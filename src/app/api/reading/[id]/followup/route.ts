import { NextResponse } from 'next/server';
import { generateFollowupReading } from '@/lib/ai-provider';
import type {
  FollowupMessagePayload,
  ReadingCrisisResponse,
  ReadingErrorResponse,
} from '@/lib/api-types';
import {
  canAskFollowup,
  FOLLOWUP_MAX_QUESTION_CHARS,
  FOLLOWUP_STAR_COST,
  getCachedReading,
  getDailyBudgetStatus,
  getFollowupMessages,
  getQuotaStatus,
  isAdminRequest,
  recordFollowupMessageExchange,
  recordFunnelEvent,
  resolveClientKey,
} from '@/lib/quota-store';
import { CRISIS_SUPPORT_DATA, scanCrisisAndInjection } from '@/lib/safety';

/**
 * GET /api/reading/[id]/followup
 * Returns current followup messages and followup quota status for this reading.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: readingId } = await context.params;
  const clientKey = resolveClientKey(request);

  if (!readingId) {
    return NextResponse.json(
      { status: 'error', code: 'INVALID_READING_ID', message: 'Thiếu mã lượt bói.' },
      { status: 400 }
    );
  }

  // Ownership Check (H1, H2)
  const reading = getCachedReading(readingId);
  if (reading && reading.ownerId && reading.ownerId !== clientKey && !isAdminRequest(request)) {
    return NextResponse.json(
      {
        status: 'error',
        code: 'FORBIDDEN_READING_ACCESS',
        message: 'Bạn không có quyền xem các câu hỏi đào sâu của lượt bói này.',
      },
      { status: 403 }
    );
  }

  const messages = getFollowupMessages(readingId);
  const quota = getQuotaStatus(clientKey);
  const check = canAskFollowup(clientKey, readingId);

  return NextResponse.json({
    status: 'ok',
    readingId,
    messages,
    quota,
    canAsk: check.allowed,
    costType: check.costType,
    starsCost: check.starsCost,
    reason: check.reason,
    freeFollowupsRemaining: check.freeFollowupsRemaining,
    currentMessageCount: check.currentMessageCount,
  });
}

/**
 * POST /api/reading/[id]/followup
 * Handles asking a deeper question to the Reader:
 * 1. Checks readingId and cached reading existence.
 * 2. Checks crisis guardrail on previous reading and scans new question for crisis/injection.
 * 3. Enforces rate limits (1 req/3s) and reading limits (max 5 questions per reading).
 * 4. Checks quota (first 2 questions free per account, 5 Stars from 3rd onwards).
 * 5. Calls AI provider with persona voice and 3-card context (~120 words).
 * 6. Atomically deducts quota / Stars and saves user & assistant messages upon success.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: readingId } = await context.params;
  const clientKey = resolveClientKey(request);

  let rawBody: Record<string, unknown>;
  try {
    rawBody = (await request.json()) as Record<string, unknown>;
  } catch {
    const errRes: ReadingErrorResponse = {
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Dữ liệu gửi lên không đúng định dạng JSON.',
    };
    return NextResponse.json(errRes, { status: 400 });
  }

  const question = String(rawBody.question || rawBody.content || '').trim();

  if (!question || question.length < 2) {
    return NextResponse.json(
      {
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Vui lòng nhập câu hỏi thắc mắc (tối thiểu 2 ký tự).',
      },
      { status: 400 }
    );
  }

  if (question.length > FOLLOWUP_MAX_QUESTION_CHARS) {
    return NextResponse.json(
      {
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: `Câu hỏi không được vượt quá ${FOLLOWUP_MAX_QUESTION_CHARS} ký tự.`,
      },
      { status: 400 }
    );
  }

  // 1. Look up cached reading
  const reading = getCachedReading(readingId);
  if (!reading) {
    return NextResponse.json(
      {
        status: 'error',
        code: 'READING_NOT_FOUND',
        message: 'Không tìm thấy lượt bói này hoặc phiên đã hết hạn. Hãy bắt đầu một lượt mới nhé.',
      },
      { status: 404 }
    );
  }

  // Ownership Check (H1, H2): Only reading owner or authorized admin can ask deeper followup questions
  if (reading.ownerId && reading.ownerId !== clientKey && !isAdminRequest(request)) {
    return NextResponse.json(
      {
        status: 'error',
        code: 'FORBIDDEN_READING_ACCESS',
        message: 'Bạn không có quyền gửi câu hỏi đào sâu trên lượt bói của người khác.',
      },
      { status: 403 }
    );
  }

  // 2. Crisis guardrail: Never allow follow-up in crisis sessions
  if (reading.safetyFlag === 'crisis') {
    const crisisRes: ReadingCrisisResponse = {
      status: 'crisis',
      readingId: reading.readingId,
      createdAt: new Date().toISOString(),
      safetyFlag: 'crisis',
      matchedReason: 'Phiên trải bài đang ở chế độ bảo vệ khủng hoảng tâm lý.',
      crisisSupport: CRISIS_SUPPORT_DATA,
    };
    return NextResponse.json(crisisRes, { status: 200 });
  }

  // 3. Scan new question for crisis / prompt injection
  const scan = scanCrisisAndInjection(question);
  if (scan.safetyFlag === 'crisis') {
    recordFunnelEvent('crisis_triggered', {
      clientKey,
      source: 'followup_api',
      reason: scan.matchedCrisisReason || 'pre_ai_keyword_match',
    });

    const crisisRes: ReadingCrisisResponse = {
      status: 'crisis',
      readingId: reading.readingId,
      createdAt: new Date().toISOString(),
      safetyFlag: 'crisis',
      matchedReason: scan.matchedCrisisReason,
      crisisSupport: CRISIS_SUPPORT_DATA,
    };
    return NextResponse.json(crisisRes, { status: 200 });
  }

  // 4. Check quota / rate limit / max questions per reading
  const check = canAskFollowup(clientKey, readingId);
  if (!check.allowed) {
    if (check.reason === 'READING_LIMIT_REACHED') {
      return NextResponse.json(
        {
          status: 'error',
          code: 'READING_LIMIT_REACHED',
          message: 'Bạn đã đạt giới hạn 5 câu hỏi sâu cho lượt bói này. Hãy bốc một lượt mới để khám phá thêm nhé!',
        },
        { status: 429 }
      );
    }

    if (check.reason === 'RATE_LIMITED') {
      return NextResponse.json(
        {
          status: 'error',
          code: 'RATE_LIMITED',
          message: 'Bạn đang gửi quá nhanh. Vui lòng đợi 3 giây trước khi hỏi tiếp nhé.',
        },
        { status: 429 }
      );
    }

    if (check.reason === 'INSUFFICIENT_STARS') {
      return NextResponse.json(
        {
          status: 'error',
          code: 'INSUFFICIENT_STARS',
          message: `Bạn cần ${FOLLOWUP_STAR_COST} Sao để hỏi tiếp câu này. Hãy điểm danh mỗi ngày hoặc chia sẻ để nhận thêm Sao nhé!`,
          requiredStars: FOLLOWUP_STAR_COST,
          currentStars: check.starsBalance,
        },
        { status: 402 }
      );
    }
  }

  // 5. Generate AI answer in Reader persona (~120 words)
  // Phase 2 (H11): global AI budget guard.
  const budget = getDailyBudgetStatus();
  if (budget.isHardCapReached) {
    return NextResponse.json(
      {
        status: 'error',
        code: 'BUDGET_CAP_REACHED',
        message:
          'Ngân sách AI miễn phí trong ngày của hệ thống đã chạm trần bảo vệ. Vui lòng quay lại sau nhé!',
      },
      { status: 429 }
    );
  }

  let answer = '';
  try {
    const history = getFollowupMessages(readingId);
    answer = await generateFollowupReading({
      reading,
      // M8: use the sanitised text, not the raw question (delimiter breakout).
      question: scan.sanitizedText || question,
      history,
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        code: 'AI_GENERATION_FAILED',
        message: 'Reader đang bận kết nối vũ trụ, vui lòng thử lại nhé (chưa trừ Sao).',
      },
      { status: 500 }
    );
  }

  // 6. Deduct quota / Stars atomically and record message
  const result = recordFollowupMessageExchange({
    clientKey,
    readingId,
    question,
    answer,
    costType: check.costType,
    starsDeducted: check.starsCost,
  });

  return NextResponse.json({
    status: 'ok',
    readingId,
    userMessage: result.userMessage,
    assistantMessage: result.assistantMessage,
    messages: result.allMessages,
    quota: result.quota,
  });
}
