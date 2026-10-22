import { NextResponse } from 'next/server';
import { MAJOR_ARCANA, TAROT_CARDS_BY_ID } from '@/data/tarot-cards';
import { generateClarifierReading } from '@/lib/ai-provider';
import type {
  ClarifierCardPayload,
  ReadingCrisisResponse,
  ReadingErrorResponse,
} from '@/lib/api-types';
import {
  addStars,
  cacheReading,
  CLARIFIER_STAR_COST,
  deductStars,
  getCachedReading,
  getDailyBudgetStatus,
  getQuotaStatus,
  isAdminRequest,
  recordFunnelEvent,
  resolveClientContext,
} from '@/lib/quota-store';
import {
  CRISIS_SUPPORT_DATA,
  scanCrisisAndInjection,
} from '@/lib/safety';
import {
  ClarifierRequestSchema,
  MAX_BIRTH_YEAR,
  MIN_BIRTH_YEAR,
  type ReaderId,
  ReaderIdSchema,
} from '@/lib/schemas';
import { drawSingleRandomCardServerSide } from '@/lib/shuffler';

/**
 * POST /api/clarifier
 * Phase 2/3: Unlocks the 4th Clarifier Card ("Lá làm rõ" - 5 Sao) for an active reading:
 * 1. Scans `followupQuestion` with `scanCrisisAndInjection` — if `crisis`, immediately returns `ReadingCrisisResponse` WITHOUT deducting Stars!
 * 2. If `readingId` refers to a cached reading that had `safetyFlag === 'crisis'`, blocks Clarifier per PLAN.md Section 8.1.
 * 3. Deducts `5` Stars from the client's Stars Wallet, returning `INSUFFICIENT_STARS` if balance < 5.
 * 4. Draws 1 random card from the 78-card RWS deck (excluding already drawn cards) via CSPRNG (`drawSingleRandomCardServerSide`).
 * 5. Generates persona-matched Clarifier reading, attaches to cached reading, and returns `{ status: 'ok', clarifier, quota }`.
 */
export async function POST(request: Request) {
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

  const parsed = ClarifierRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message || 'Dữ liệu yêu cầu lá làm rõ không hợp lệ.';
    const errRes: ReadingErrorResponse = {
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: firstIssue,
    };
    return NextResponse.json(errRes, { status: 400 });
  }

  const clientKey = resolveClientContext(request).clientKey;
  const readingId = String(
    rawBody.readingId || rawBody.reading_id || ''
  ).trim();
  const cachedReading = readingId ? getCachedReading(readingId) : undefined;

  // Ownership Check (H1, H2): Only reading owner or authorized admin can unlock clarifier
  if (cachedReading?.ownerId && cachedReading.ownerId !== clientKey && !isAdminRequest(request)) {
    const errRes: ReadingErrorResponse = {
      status: 'error',
      code: 'FORBIDDEN_READING_ACCESS',
      message: 'Bạn không có quyền mở lá làm rõ trên lượt bói của người khác.',
    };
    return NextResponse.json(errRes, { status: 403 });
  }

  // Enforce PLAN.md Section 8.1: Never sell or unlock Clarifier in a crisis session
  if (cachedReading && cachedReading.safetyFlag === 'crisis') {
    const crisisRes: ReadingCrisisResponse = {
      status: 'crisis',
      readingId: cachedReading.readingId,
      createdAt: new Date().toISOString(),
      safetyFlag: 'crisis',
      matchedReason: 'Phiên trải bài đang ở chế độ bảo vệ khủng hoảng tâm lý.',
      crisisSupport: CRISIS_SUPPORT_DATA,
    };
    return NextResponse.json(crisisRes, { status: 200 });
  }

  const followupQuestion = String(
    rawBody.followupQuestion ??
      rawBody.followup_question ??
      rawBody.questionAsked ??
      rawBody.question_asked ??
      ''
  )
    .trim()
    .slice(0, 200);

  if (followupQuestion.length < 2) {
    const errRes: ReadingErrorResponse = {
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Vui lòng chọn hoặc nhập câu hỏi làm rõ (tối thiểu 2 ký tự).',
    };
    return NextResponse.json(errRes, { status: 400 });
  }

  // Step 1: Pre-AI Crisis & Injection Scan on follow-up question (before deducting Stars!)
  const scan = scanCrisisAndInjection(followupQuestion);
  if (scan.safetyFlag === 'crisis') {
    recordFunnelEvent('crisis_triggered', {
      clientKey,
      source: 'clarifier_api',
      reason: scan.matchedCrisisReason || 'pre_ai_keyword_match',
    });

    const crisisRes: ReadingCrisisResponse = {
      status: 'crisis',
      readingId: readingId || `rd_clarifier_${Date.now()}`,
      createdAt: new Date().toISOString(),
      safetyFlag: 'crisis',
      matchedReason: scan.matchedCrisisReason,
      crisisSupport: CRISIS_SUPPORT_DATA,
    };
    return NextResponse.json(crisisRes, { status: 200 });
  }

  // Step 2: Check and deduct 5 Stars from client's wallet
  // Phase 2 (H11): never spend AI budget when the global cap is reached.
  if (getDailyBudgetStatus().isHardCapReached) {
    const budgetErr: ReadingErrorResponse = {
      status: 'error',
      code: 'BUDGET_CAP_REACHED',
      message:
        'Ngân sách AI miễn phí trong ngày của hệ thống đã chạm trần bảo vệ. Vui lòng quay lại sau nhé!',
      quota: getQuotaStatus(clientKey),
    };
    return NextResponse.json(budgetErr, { status: 429 });
  }

  const deduction = deductStars(clientKey, CLARIFIER_STAR_COST);
  if (!deduction.allowed) {
    const errRes: ReadingErrorResponse = {
      status: 'error',
      code: 'INSUFFICIENT_STARS',
      message: `Bạn cần ${CLARIFIER_STAR_COST} Sao để mở Lá Làm Rõ (số dư hiện tại: ${deduction.starsBalance} Sao). Hãy điểm danh nhận Sao miễn phí hoặc nạp thêm Sao nhé!`,
      quota: deduction.quota,
    };
    return NextResponse.json(errRes, { status: 402 });
  }
  const currentQuota = deduction.quota;

  const nickname =
    String(
      rawBody.nickname || cachedReading?.nickname || 'Bạn'
    )
      .trim()
      .slice(0, 40) || 'Bạn';

  const rawBirthYear =
    rawBody.birthYear !== undefined
      ? Number(rawBody.birthYear)
      : rawBody.birth_year !== undefined
      ? Number(rawBody.birth_year)
      : cachedReading?.birthYear ?? 2002;
  const birthYear =
    Number.isInteger(rawBirthYear) &&
    rawBirthYear >= MIN_BIRTH_YEAR &&
    rawBirthYear <= MAX_BIRTH_YEAR
      ? rawBirthYear
      : 2002;

  const parsedReader = ReaderIdSchema.safeParse(
    rawBody.readerId ||
      rawBody.reader_id ||
      cachedReading?.readerId ||
      'ba_co_mo_hon'
  );
  const readerId: ReaderId = parsedReader.success
    ? parsedReader.data
    : 'ba_co_mo_hon';

  const rawExclude = Array.isArray(rawBody.excludeCardIds)
    ? rawBody.excludeCardIds
    : Array.isArray(rawBody.exclude_card_ids)
    ? rawBody.exclude_card_ids
    : Array.isArray(rawBody.previous_card_ids)
    ? rawBody.previous_card_ids
    : cachedReading
    ? cachedReading.drawnCards.map((d) => d.card.id)
    : [];

  const excludeCardIds = rawExclude
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id >= 0 && id <= 77);

  // Step 3: Draw 1 random card from the 78-card deck via CSPRNG
  const singleDraw = drawSingleRandomCardServerSide(excludeCardIds, 0.3, 78);
  const fullCard =
    TAROT_CARDS_BY_ID[singleDraw.card_id] ?? MAJOR_ARCANA[0]!;

  // Step 4: Generate Clarifier interpretation (refund the Stars if AI fails)
  let clarifierGen: Awaited<ReturnType<typeof generateClarifierReading>>;
  try {
    clarifierGen = await generateClarifierReading({
      card: {
        ...fullCard,
        reversed: singleDraw.reversed,
      },
      reversed: singleDraw.reversed,
      questionAsked: scan.sanitizedText,
      followupQuestion: scan.sanitizedText,
      nickname,
      readerId,
      birthYear,
      starsSpent: CLARIFIER_STAR_COST,
    });
  } catch (err) {
    console.error('[Clarifier] Generation failed, refunding Stars:', err);
    addStars(clientKey, CLARIFIER_STAR_COST);
    const refundErr: ReadingErrorResponse = {
      status: 'error',
      code: 'INTERNAL_ERROR',
      message:
        'Không thể kết nối năng lượng vũ trụ cho Lá Làm Rõ lúc này. Sao của bạn đã được hoàn lại, vui lòng thử lại nhé!',
      quota: getQuotaStatus(clientKey),
    };
    return NextResponse.json(refundErr, { status: 502 });
  }

  const clarifierPayload: ClarifierCardPayload = {
    card: fullCard,
    reversed: singleDraw.reversed,
    questionAsked: clarifierGen.questionAsked,
    interpretation: clarifierGen.interpretation,
    advice: clarifierGen.advice,
    savageQuote: clarifierGen.savageQuote,
    starsSpent: CLARIFIER_STAR_COST,
  };

  if (cachedReading) {
    cachedReading.clarifier = clarifierPayload;
    cachedReading.quota = currentQuota;
    cacheReading(cachedReading);
  }

  recordFunnelEvent('clarifier_unlocked', {
    clientKey,
    readingId: readingId || 'standalone',
    cardId: fullCard.id,
    reversed: singleDraw.reversed,
    starsSpent: CLARIFIER_STAR_COST,
  });

  return NextResponse.json(
    {
      status: 'ok',
      clarifier: clarifierPayload,
      quota: currentQuota,
    },
    { status: 200 }
  );
}
