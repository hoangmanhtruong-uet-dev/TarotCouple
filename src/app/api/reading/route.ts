import { NextResponse } from 'next/server';
import { MAJOR_ARCANA, TAROT_CARDS_BY_ID } from '@/data/tarot-cards';
import { generateTarotReading } from '@/lib/ai-provider';
import type {
  DrawnCardClientPayload,
  ReadingCrisisResponse,
  ReadingErrorResponse,
  ReadingSuccessResponse,
} from '@/lib/api-types';
import { PERSONA_PROFILES } from '@/lib/prompts';
import {
  cacheReading,
  canConsumeQuota,
  canUseFullDeck,
  consumeQuota,
  createShareToken,
  type FunnelEventName,
  getCachedReading,
  getDailyBudgetStatus,
  getFunnelMetricsSummary,
  getQuotaStatus,
  grantBonusDraw,
  isAdminRequest,
  recordFunnelEvent,
  resolveClientContext,
  unlockFullDeckWithStars,
} from '@/lib/quota-store';
import { buildSessionCookieHeader } from '@/lib/session';
import {
  classifyAgeTier,
  CRISIS_SUPPORT_DATA,
  getSpreadPositionsForTopic,
  KID_TEEN_SAFE_TOPICS,
  scanCrisisAndInjection,
  STANDARD_TOPICS,
} from '@/lib/safety';
import { CURRENT_REFERENCE_YEAR, ReadingRequestSchema } from '@/lib/schemas';
import { shuffleAndDrawServerSide } from '@/lib/shuffler';

function createReadingId(): string {
  const randomPart =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `rd_${Date.now()}_${randomPart}`;
}

function getTopicLabel(topicId: string): string {
  const allTopics = [...STANDARD_TOPICS, ...KID_TEEN_SAFE_TOPICS];
  const found = allTopics.find((t) => t.id === topicId);
  return found ? found.label : 'Thông điệp Vũ trụ';
}

/**
 * GET /api/reading
 * - Returns current client's daily quota status.
 * - Admin Gate (H3): Funnel metrics summary & daily AI budget are ONLY returned to authorized admins.
 * - Ownership (H1, H2): Accessing `?readingId=...` enforces ownership check.
 *   - Reading owner receives full reading (including private questionText).
 *   - Shared viewers with valid `?shareToken=...` receive filtered public reading.
 *   - Unauthorized third-parties are rejected with 403 Forbidden.
 */
export async function GET(request: Request) {
  const clientContext = resolveClientContext(request);
  const clientKey = clientContext.clientKey;
  const url = new URL(request.url);

  // Persist the signed session on every response path so the identity used for
  // the quota check is the same identity the browser will send back.
  const attachSession = (res: NextResponse): NextResponse => {
    const session = clientContext.signedSession;
    if (session?.isNew) {
      res.headers.set('Set-Cookie', buildSessionCookieHeader(session.cookieHeaderValue));
    }
    return res;
  };
  const readingId = url.searchParams.get('readingId');
  const shareToken = url.searchParams.get('shareToken');

  if (url.searchParams.get('track') === 'page_view') {
    recordFunnelEvent('page_view', { clientKey });
  }

  const quota = getQuotaStatus(clientKey);
  const isAdmin = isAdminRequest(request);
  const funnel = isAdmin ? getFunnelMetricsSummary() : undefined;
  const budget = isAdmin ? getDailyBudgetStatus() : undefined;

  let readingPayload: unknown = undefined;

  if (readingId) {
    const cached = getCachedReading(readingId);
    if (!cached) {
      return NextResponse.json(
        {
          status: 'error',
          code: 'READING_NOT_FOUND',
          message: 'Không tìm thấy lượt trải bài tương ứng.',
        },
        { status: 404 }
      );
    }

    const isOwner = !cached.ownerId || cached.ownerId === clientKey || isAdmin;
    const isValidShare = Boolean(shareToken && cached.shareToken && shareToken === cached.shareToken);

    if (isOwner) {
      readingPayload = cached;
    } else if (isValidShare) {
      // Filtered public view: hide questionText, birthYear, ageTier, private tokens
      readingPayload = {
        status: 'ok',
        readingId: cached.readingId,
        createdAt: cached.createdAt,
        nickname: cached.nickname,
        readerDisplayName: cached.readerDisplayName,
        readerBadge: cached.readerBadge,
        topicLabel: cached.topicLabel,
        drawnCards: cached.drawnCards,
        result: cached.result,
        clarifier: cached.clarifier,
        isSharedView: true,
      };
    } else {
      return NextResponse.json(
        {
          status: 'error',
          code: 'FORBIDDEN_READING_ACCESS',
          message: 'Bạn không có quyền truy cập lượt bói này.',
        },
        { status: 403 }
      );
    }
  }

  const session = clientContext.signedSession;
  const response = NextResponse.json(
    {
      status: 'ok',
      quota,
      ...(budget ? { budget } : {}),
      ...(funnel ? { funnel } : {}),
      ...(readingPayload ? { reading: readingPayload } : {}),
    },
    { status: 200 }
  );

  if (session?.isNew) {
    response.headers.set('Set-Cookie', buildSessionCookieHeader(session.cookieHeaderValue));
  }

  return response;
}

/**
 * POST /api/reading
 * Main server-side transaction for Tarot reading:
 * 1. Validate request payload with Zod (`ReadingRequestSchema`)
 * 2. Run Pre-AI Safety & Crisis Scanner (`scanCrisisAndInjection`) + Age Tier Guardrail (`classifyAgeTier`)
 *    - If `crisis` is detected -> immediately return `ReadingCrisisResponse` (111 / 115 / 096 306 1414) without drawing cards or deducting quota.
 * 3. Enforce per-client daily quota and global AI budget hard cap.
 * 4. Shuffle 22 Major Arcana with CSPRNG (`shuffleAndDrawServerSide`) and map user's 3 selected indices `(i, j, k)`.
 * 5. Call `generateTarotReading` (Gemini + Zod validation + 2 retries + rich contextual Gen Z / Kid-Safe fallback).
 * 6. Deduct quota, cache reading for 9:16 Story Card rendering, and return `ReadingSuccessResponse`.
 */
export async function POST(request: Request) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    const errRes: ReadingErrorResponse = {
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Dữ liệu gửi lên không đúng định dạng JSON.',
    };
    return NextResponse.json(errRes, { status: 400 });
  }

  const parsed = ReadingRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message || 'Dữ liệu đầu vào không hợp lệ.';
    const errRes: ReadingErrorResponse = {
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: firstIssue,
    };
    return NextResponse.json(errRes, { status: 400 });
  }

  const reqData = parsed.data;
  const clientContext = resolveClientContext(request);
  const clientKey = clientContext.clientKey;
  const readingId = createReadingId();
  const createdAt = new Date().toISOString();

  // Step 1: Age-Tier classification & Pre-AI Crisis / Prompt Injection scan
  const agePolicy = classifyAgeTier(
    reqData.birth_year,
    CURRENT_REFERENCE_YEAR,
    reqData.reader_id
  );
  const scan = scanCrisisAndInjection(reqData.question_text);

  recordFunnelEvent('start_reading', {
    clientKey,
    topic: reqData.topic,
    readerId: reqData.reader_id,
    ageTier: agePolicy.tier,
  });

  // Step 2: Immediate Crisis Intervention circuit-breaker (bypasses cards, AI, and quota deduction)
  if (scan.safetyFlag === 'crisis') {
    recordFunnelEvent('crisis_triggered', {
      clientKey,
      reason: scan.matchedCrisisReason || 'pre_ai_keyword_match',
    });

    const crisisResponse: ReadingCrisisResponse = {
      status: 'crisis',
      readingId,
      createdAt,
      safetyFlag: 'crisis',
      matchedReason: scan.matchedCrisisReason,
      crisisSupport: CRISIS_SUPPORT_DATA,
    };

    return NextResponse.json(crisisResponse, { status: 200 });
  }

  // Step 3: Check client daily quota & global AI budget cap
  const quotaCheck = canConsumeQuota(clientKey);
  if (!quotaCheck.allowed) {
    const isBudgetCap = quotaCheck.reason === 'BUDGET_CAP_REACHED';
    const errRes: ReadingErrorResponse = {
      status: 'error',
      code: isBudgetCap ? 'BUDGET_CAP_REACHED' : 'QUOTA_EXCEEDED',
      message: isBudgetCap
        ? 'Ngân sách AI miễn phí trong ngày của hệ thống đã chạm trần bảo vệ. Vui lòng quay lại sau nhé!'
        : 'Bạn đã hết lượt trải bài miễn phí hôm nay. Hãy chia sẻ ảnh Story 9:16 hoặc mở quà tặng để nhận thêm lượt nhé!',
      quota: quotaCheck.quota,
    };
    return NextResponse.json(errRes, { status: 429 });
  }

  // Step 3b: Server-side Full Deck (78 cards) permission check
  // Free accounts get 1 free 78-card reading per day. Subsequent turns require unlock with 5 Stars.
  if (reqData.deck_mode === 'full_78') {
    const fullDeckCheck = canUseFullDeck(clientKey);
    if (!fullDeckCheck.allowed) {
      const errRes: ReadingErrorResponse = {
        status: 'error',
        code: 'FORBIDDEN_DECK_MODE',
        message:
          'Tài khoản miễn phí chỉ được chọn bộ 78 lá ở lượt đầu tiên trong ngày. Từ lượt thứ hai trở đi, vui lòng chọn bộ 22 lá hoặc mở khóa bộ 78 lá bằng 5 Sao.',
        quota: getQuotaStatus(clientKey),
      };
      return NextResponse.json(errRes, { status: 403 });
    }
  }

  try {
    // Step 4: Server-side CSPRNG Fisher-Yates shuffle & draw (supports both 22 Major Arcana & full 78 RWS deck)
    const deckSize = reqData.deck_mode === 'full_78' ? 78 : 22;
    const drawResult = shuffleAndDrawServerSide(
      reqData.selected_indices,
      undefined,
      deckSize
    );
    const spreadPositions = getSpreadPositionsForTopic(reqData.topic);

    const mapSlotToPayload = (
      slot: (typeof drawResult)[number],
      posIdx: 0 | 1 | 2
    ): DrawnCardClientPayload => {
      const fullCard = TAROT_CARDS_BY_ID[slot.card_id] ?? MAJOR_ARCANA[0]!;
      return {
        position_index: posIdx,
        position_label: spreadPositions[posIdx] || `Lá số ${posIdx + 1}`,
        fan_index: slot.fan_index,
        reversed: slot.reversed,
        card: fullCard,
      };
    };

    const drawnCardsPayload: [
      DrawnCardClientPayload,
      DrawnCardClientPayload,
      DrawnCardClientPayload,
    ] = [
      mapSlotToPayload(drawResult[0], 0),
      mapSlotToPayload(drawResult[1], 1),
      mapSlotToPayload(drawResult[2], 2),
    ];

    recordFunnelEvent('complete_3_cards', {
      clientKey,
      readingId,
      deckMode: reqData.deck_mode,
      cards: drawnCardsPayload.map((d) => `${d.card.id}:${d.reversed ? 1 : 0}`),
    });

    // Step 5: Generate Tarot reading via AI Provider (with Zod validation + retries + contextual fallback)
    const aiResult = await generateTarotReading({
      nickname: reqData.nickname,
      birthYear: reqData.birth_year,
      readerId: reqData.reader_id,
      topic: reqData.topic,
      questionText: reqData.question_text,
      ageTier: agePolicy.tier,
      effectivePersona: agePolicy.effectivePersona,
      drawnCards: [
        {
          ...drawnCardsPayload[0].card,
          position_index: 0,
          position_label: drawnCardsPayload[0].position_label,
          reversed: drawnCardsPayload[0].reversed,
          grandma_hook_up: drawnCardsPayload[0].card.teen_hook_up,
          grandma_hook_rev: drawnCardsPayload[0].card.teen_hook_rev,
        },
        {
          ...drawnCardsPayload[1].card,
          position_index: 1,
          position_label: drawnCardsPayload[1].position_label,
          reversed: drawnCardsPayload[1].reversed,
          grandma_hook_up: drawnCardsPayload[1].card.teen_hook_up,
          grandma_hook_rev: drawnCardsPayload[1].card.teen_hook_rev,
        },
        {
          ...drawnCardsPayload[2].card,
          position_index: 2,
          position_label: drawnCardsPayload[2].position_label,
          reversed: drawnCardsPayload[2].reversed,
          grandma_hook_up: drawnCardsPayload[2].card.teen_hook_up,
          grandma_hook_rev: drawnCardsPayload[2].card.teen_hook_rev,
        },
      ],
    });

    // If the AI model itself flagged a crisis, trigger crisis response without deducting quota
    if (aiResult.reading.safety_flag === 'crisis') {
      recordFunnelEvent('crisis_triggered', {
        clientKey,
        reason: 'ai_model_safety_flag_crisis',
      });

      const crisisResponse: ReadingCrisisResponse = {
        status: 'crisis',
        readingId,
        createdAt,
        safetyFlag: 'crisis',
        matchedReason: 'AI phát hiện dấu hiệu khủng hoảng tâm lý cần hỗ trợ khẩn cấp',
        crisisSupport: CRISIS_SUPPORT_DATA,
      };
      return NextResponse.json(crisisResponse, { status: 200 });
    }

    // Step 6: Deduct quota, cache reading, and return full ReadingSuccessResponse
    const updatedQuota = consumeQuota(clientKey, aiResult.tokensIn, aiResult.tokensOut, reqData.deck_mode);

    const personaProfile = PERSONA_PROFILES[aiResult.effectivePersona];

    const shareToken = createShareToken(readingId);

    const successResponse: ReadingSuccessResponse = {
      status: 'ok',
      readingId,
      ownerId: clientKey,
      shareToken,
      createdAt,
      nickname: reqData.nickname,
      birthYear: reqData.birth_year,
      age: agePolicy.age,
      ageTier: agePolicy.tier,
      isKidTeenSafeMode: agePolicy.isKidTeenSafeMode,
      paymentEnabled: agePolicy.paymentEnabled,
      readerId: reqData.reader_id,
      effectivePersona: aiResult.effectivePersona,
      readerDisplayName: personaProfile.displayName,
      readerBadge: personaProfile.badgeTitle,
      topic: reqData.topic,
      topicLabel: getTopicLabel(reqData.topic),
      questionText: scan.sanitizedText,
      deckMode: reqData.deck_mode,
      safetyFlag: aiResult.reading.safety_flag,
      isPromptInjection: scan.isPromptInjection,
      drawnCards: drawnCardsPayload,
      result: aiResult.reading,
      aiMeta: {
        model: aiResult.aiModel,
        tokensIn: aiResult.tokensIn,
        tokensOut: aiResult.tokensOut,
        usedFallback: aiResult.usedFallback,
        retryCount: aiResult.retryCount,
      },
      quota: updatedQuota,
    };

    cacheReading(successResponse);
    recordFunnelEvent('view_result', {
      clientKey,
      readingId,
      topic: reqData.topic,
      effectivePersona: aiResult.effectivePersona,
      usedFallback: aiResult.usedFallback,
    });

    const session = clientContext.signedSession;
    const response = NextResponse.json(successResponse, { status: 200 });
    if (session?.isNew) {
      response.headers.set('Set-Cookie', buildSessionCookieHeader(session.cookieHeaderValue));
    }
    return response;
  } catch (error) {
    const errRes: ReadingErrorResponse = {
      status: 'error',
      code: 'INTERNAL_ERROR',
      message:
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi khi kết nối năng lượng vũ trụ. Vui lòng thử lại.',
    };
    return NextResponse.json(errRes, { status: 500 });
  }
}

/**
 * PUT /api/reading
 * Claim bonus draws (`share_bonus`, `reward_ad_bonus`)
 * or log client-side funnel events (`share_story`, `page_view`, etc.).
 */
export async function PUT(request: Request) {
  const clientContext = resolveClientContext(request);
  const clientKey = clientContext.clientKey;
  const isAdmin = isAdminRequest(request);
  let body: {
    action?: 'share_bonus' | 'reward_ad_bonus' | 'reset_demo_quota' | 'track_event' | 'unlock_full_deck';
    event?: FunnelEventName;
    meta?: Record<string, unknown>;
  } = {};

  try {
    body = await request.json();
  } catch {
    // Default to share_bonus if empty body
  }

  // P0-6 (C6): Reject reset_demo_quota with 400
  if (body.action === 'reset_demo_quota') {
    return NextResponse.json(
      {
        status: 'error',
        code: 'ACTION_DISABLED',
        message: 'Hành động reset_demo_quota đã bị vô hiệu hóa vì lý do bảo mật.',
      },
      { status: 400 }
    );
  }

  if (body.action === 'unlock_full_deck') {
    const unlockRes = unlockFullDeckWithStars(clientKey);
    if (!unlockRes.success) {
      return NextResponse.json(
        {
          status: 'error',
          code: 'INSUFFICIENT_STARS',
          message: 'Bạn không đủ Sao để mở khóa bộ 78 lá. Cần 5 Sao.',
          quota: unlockRes.quota,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        status: 'ok',
        action: 'unlock_full_deck',
        message: 'Đã mở khóa thành công bộ 78 lá cho lượt bốc bài tiếp theo!',
        quota: unlockRes.quota,
        funnel: isAdmin ? getFunnelMetricsSummary() : undefined,
      },
      { status: 200 }
    );
  }

  if (body.action === 'track_event' && body.event) {
    recordFunnelEvent(body.event, { clientKey, ...(body.meta || {}) });
    return NextResponse.json(
      {
        status: 'ok',
        quota: getQuotaStatus(clientKey),
        funnel: isAdmin ? getFunnelMetricsSummary() : undefined,
      },
      { status: 200 }
    );
  }

  const action =
    body.action === 'reward_ad_bonus'
      ? 'reward_ad_bonus'
      : 'share_bonus';

  const updatedQuota = grantBonusDraw(clientKey, action);

  return NextResponse.json(
    {
      status: 'ok',
      action,
      message: 'Chúc mừng! Vũ trụ vừa tặng thêm cho bạn +1 lượt bốc bài miễn phí hôm nay.',
      quota: updatedQuota,
      funnel: isAdmin ? getFunnelMetricsSummary() : undefined,
    },
    { status: 200 }
  );
}
