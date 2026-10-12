import { NextResponse } from 'next/server';
import { MAJOR_ARCANA, TAROT_CARDS_BY_ID } from '@/data/tarot-cards';
import { generateCoupleTarotReading } from '@/lib/ai-provider';
import type {
  CoupleRelationshipStatus,
  DeckMode,
  DrawnCardClientPayload,
  ReadingCrisisResponse,
  ReadingErrorResponse,
  ReadingSuccessResponse,
} from '@/lib/api-types';
import { PERSONA_PROFILES } from '@/lib/prompts';
import {
  cacheReading,
  COUPLE_ROOM_TTL_MS,
  generateCoupleRoomCode,
  getCoupleRoom,
  getQuotaStatus,
  recordFunnelEvent,
  resolveClientKey,
  saveCoupleRoom,
  type StoredCoupleRoom,
  toPublicCoupleRoomView,
} from '@/lib/quota-store';
import {
  classifyAgeTier,
  COUPLE_SPREAD_POSITIONS,
  CRISIS_SUPPORT_DATA,
  RELATIONSHIP_STATUS_LABELS,
  scanCrisisAndInjection,
} from '@/lib/safety';
import {
  CoupleRelationshipStatusSchema,
  CURRENT_REFERENCE_YEAR,
  DeckModeSchema,
  MAX_BIRTH_YEAR,
  MIN_BIRTH_YEAR,
  type ReaderId,
  ReaderIdSchema,
} from '@/lib/schemas';
import {
  drawSingleRandomCardServerSide,
  shuffleAndDrawServerSide,
} from '@/lib/shuffler';

function createCoupleReadingId(): string {
  const randomPart =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `rd_couple_${Date.now()}_${randomPart}`;
}

/**
 * GET /api/couple?roomCode=XYZ
 * Returns public view of a Couple Room (NEVER exposing Person A's private `ownerQuestionText` per PLAN.md Section 3.4).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const roomCode =
    url.searchParams.get('roomCode') || url.searchParams.get('room_code');

  if (!roomCode) {
    const errRes: ReadingErrorResponse = {
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Vui lòng cung cấp mã phòng Bói Đôi (roomCode).',
    };
    return NextResponse.json(errRes, { status: 400 });
  }

  const room = getCoupleRoom(roomCode);
  if (!room) {
    const errRes: ReadingErrorResponse = {
      status: 'error',
      code: 'ROOM_NOT_FOUND',
      message: 'Không tìm thấy phòng Bói Đôi hoặc mã phòng không tồn tại.',
    };
    return NextResponse.json(errRes, { status: 404 });
  }

  const publicView = toPublicCoupleRoomView(room);
  if (publicView.status === 'expired') {
    const errRes: ReadingErrorResponse = {
      status: 'error',
      code: 'ROOM_EXPIRED',
      message: 'Liên kết phòng Bói Đôi này đã hết hạn sau 48 giờ.',
    };
    return NextResponse.json(
      { ...errRes, room: publicView },
      { status: 410 }
    );
  }

  return NextResponse.json(
    {
      status: 'ok',
      room: publicView,
      ...(room.status === 'completed' && room.fullReading
        ? { reading: room.fullReading }
        : {}),
    },
    { status: 200 }
  );
}

/**
 * POST /api/couple
 * Supports:
 * - `action: 'solo_couple'` (Kiểu 1: Tự soi mối quan hệ 2 người)
 * - `action: 'create_room'` (Kiểu 2: Người A tạo phòng mời Người B cùng rút trong 48h, ẩn câu hỏi của A)
 * - `action: 'join_room'` (Kiểu 2: Người B mở link/mã phòng, rút lá thứ 2 và mở kết quả chung)
 * - `action: 'consent_share'` (Cập nhật đồng ý chia sẻ kết quả chung của A hoặc B)
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

  const clientKey = resolveClientKey(request);

  // Normalize action / mode aliases
  const rawAction = String(
    rawBody.action || rawBody.mode || 'solo_couple'
  ).trim();
  const action: 'solo_couple' | 'create_room' | 'join_room' | 'consent_share' =
    rawAction === 'create_room' ||
    rawAction === 'coop_create' ||
    rawAction === 'coop_invite'
      ? 'create_room'
      : rawAction === 'join_room' || rawAction === 'coop_join'
      ? 'join_room'
      : rawAction === 'consent_share'
      ? 'consent_share'
      : 'solo_couple';

  // Handle `consent_share` action
  if (action === 'consent_share') {
    const roomCode = String(
      rawBody.roomCode || rawBody.room_code || ''
    ).trim();
    const room = getCoupleRoom(roomCode);
    if (!room) {
      const errRes: ReadingErrorResponse = {
        status: 'error',
        code: 'ROOM_NOT_FOUND',
        message: 'Không tìm thấy phòng Bói Đôi.',
      };
      return NextResponse.json(errRes, { status: 404 });
    }

    if (room.status === 'expired') {
      const errRes: ReadingErrorResponse = {
        status: 'error',
        code: 'ROOM_EXPIRED',
        message: 'Phòng Bói Đôi đã hết hạn sau 48 giờ.',
      };
      return NextResponse.json(errRes, { status: 410 });
    }

    const consentVal =
      typeof rawBody.consentShare === 'boolean'
        ? rawBody.consentShare
        : typeof rawBody.consent_share === 'boolean'
        ? rawBody.consent_share
        : true;
    const role = String(rawBody.role || '').trim();

    if (typeof rawBody.ownerConsentedShare === 'boolean') {
      room.ownerConsentedShare = rawBody.ownerConsentedShare;
    }
    if (typeof rawBody.partnerConsentedShare === 'boolean') {
      room.partnerConsentedShare = rawBody.partnerConsentedShare;
    }
    if (role === 'owner') {
      room.ownerConsentedShare = consentVal;
    } else if (role === 'partner') {
      room.partnerConsentedShare = consentVal;
    } else if (
      typeof rawBody.ownerConsentedShare !== 'boolean' &&
      typeof rawBody.partnerConsentedShare !== 'boolean'
    ) {
      room.ownerConsentedShare = consentVal;
      room.partnerConsentedShare = consentVal;
    }

    const publicView = saveCoupleRoom(room);
    return NextResponse.json(
      {
        status: 'ok',
        room: publicView,
      },
      { status: 200 }
    );
  }

  // Handle `join_room` action (Person B joins existing room)
  if (action === 'join_room') {
    const roomCode = String(
      rawBody.roomCode || rawBody.room_code || ''
    ).trim();
    if (!roomCode) {
      const errRes: ReadingErrorResponse = {
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Vui lòng nhập mã phòng Bói Đôi (roomCode).',
      };
      return NextResponse.json(errRes, { status: 400 });
    }

    const room = getCoupleRoom(roomCode);
    if (!room) {
      const errRes: ReadingErrorResponse = {
        status: 'error',
        code: 'ROOM_NOT_FOUND',
        message: 'Không tìm thấy phòng Bói Đôi hoặc mã phòng không chính xác.',
      };
      return NextResponse.json(errRes, { status: 404 });
    }

    if (
      room.status === 'expired' ||
      new Date(room.expiresAt).getTime() <= Date.now()
    ) {
      room.status = 'expired';
      saveCoupleRoom(room);
      const errRes: ReadingErrorResponse = {
        status: 'error',
        code: 'ROOM_EXPIRED',
        message: 'Phòng Bói Đôi này đã hết hạn sau 48 giờ.',
      };
      return NextResponse.json(errRes, { status: 410 });
    }

    const partnerNickname = String(
      rawBody.partnerNickname ||
        rawBody.partner_nickname ||
        rawBody.nickname ||
        room.partnerNickname ||
        'Người ấy'
    )
      .trim()
      .slice(0, 40) || 'Người ấy';

    const partnerConsentedShare =
      typeof rawBody.partnerConsentedShare === 'boolean'
        ? rawBody.partnerConsentedShare
        : typeof rawBody.consentShare === 'boolean'
        ? rawBody.consentShare
        : typeof rawBody.consent_share === 'boolean'
        ? rawBody.consent_share
        : true;

    const deckSize = room.deckMode === 'full_78' ? 78 : 22;

    // Draw Person B's card & 3rd Connection card via CSPRNG (excluding already drawn cards)
    const partnerDraw = drawSingleRandomCardServerSide(
      [room.ownerCard.card.id],
      undefined,
      deckSize
    );
    const partnerCardObj =
      TAROT_CARDS_BY_ID[partnerDraw.card_id] ?? MAJOR_ARCANA[6]!;

    const connectionDraw = drawSingleRandomCardServerSide(
      [room.ownerCard.card.id, partnerCardObj.id],
      undefined,
      deckSize
    );
    const connectionCardObj =
      TAROT_CARDS_BY_ID[connectionDraw.card_id] ?? MAJOR_ARCANA[19]!;

    room.partnerNickname = partnerNickname;
    room.partnerCard = {
      card: partnerCardObj,
      reversed: partnerDraw.reversed,
    };
    room.connectionCard = {
      card: connectionCardObj,
      reversed: connectionDraw.reversed,
    };
    room.partnerConsentedShare = partnerConsentedShare;

    const couplePositions: [string, string, string] = [
      `Năng lượng của ${room.ownerNickname}`,
      `Năng lượng của ${partnerNickname}`,
      COUPLE_SPREAD_POSITIONS[2],
    ];

    const drawnCardsPayload: [
      DrawnCardClientPayload,
      DrawnCardClientPayload,
      DrawnCardClientPayload,
    ] = [
      {
        position_index: 0,
        position_label: couplePositions[0],
        fan_index: 0,
        reversed: room.ownerCard.reversed,
        card: room.ownerCard.card,
      },
      {
        position_index: 1,
        position_label: couplePositions[1],
        fan_index: partnerDraw.fan_index,
        reversed: partnerDraw.reversed,
        card: partnerCardObj,
      },
      {
        position_index: 2,
        position_label: couplePositions[2],
        fan_index: connectionDraw.fan_index,
        reversed: connectionDraw.reversed,
        card: connectionCardObj,
      },
    ];

    const agePolicy = classifyAgeTier(
      room.ownerBirthYear,
      CURRENT_REFERENCE_YEAR,
      room.readerId
    );

    const coupleAi = await generateCoupleTarotReading({
      ownerNickname: room.ownerNickname,
      partnerNickname,
      birthYear: room.ownerBirthYear,
      readerId: room.readerId,
      relationshipStatus: room.relationshipStatus,
      // Khi Người B vào phòng, giải bài dựa trên tình trạng mối quan hệ chung để bảo mật câu hỏi riêng tư của Người A
      questionText: `Soi tần số kết nối giữa ${room.ownerNickname} và ${partnerNickname} (${room.relationshipLabel}).`,
      ageTier: agePolicy.tier,
      effectivePersona: agePolicy.effectivePersona,
      drawnCards: [
        {
          ...room.ownerCard.card,
          position_index: 0,
          position_label: couplePositions[0],
          reversed: room.ownerCard.reversed,
        },
        {
          ...partnerCardObj,
          position_index: 1,
          position_label: couplePositions[1],
          reversed: partnerDraw.reversed,
        },
        {
          ...connectionCardObj,
          position_index: 2,
          position_label: couplePositions[2],
          reversed: connectionDraw.reversed,
        },
      ],
    });

    const readingId = createCoupleReadingId();
    const createdAt = new Date().toISOString();
    const personaProfile = PERSONA_PROFILES[coupleAi.effectivePersona];
    const quota = getQuotaStatus(clientKey);

    const readingResponse: ReadingSuccessResponse = {
      status: 'ok',
      readingId,
      createdAt,
      nickname: `${room.ownerNickname} & ${partnerNickname}`,
      birthYear: room.ownerBirthYear,
      age: agePolicy.age,
      ageTier: agePolicy.tier,
      isKidTeenSafeMode: agePolicy.isKidTeenSafeMode,
      paymentEnabled: agePolicy.paymentEnabled,
      readerId: room.readerId,
      effectivePersona: coupleAi.effectivePersona,
      readerDisplayName: personaProfile.displayName,
      readerBadge: personaProfile.badgeTitle,
      topic: 'love',
      topicLabel: `Bói Đôi • ${room.relationshipLabel}`,
      questionText: '', // Private question is NEVER exposed to Partner B
      deckMode: room.deckMode,
      safetyFlag: coupleAi.reading.safety_flag,
      isPromptInjection: false,
      drawnCards: drawnCardsPayload,
      result: coupleAi.reading,
      aiMeta: {
        model: coupleAi.aiModel,
        tokensIn: coupleAi.tokensIn,
        tokensOut: coupleAi.tokensOut,
        usedFallback: coupleAi.usedFallback,
        retryCount: coupleAi.retryCount,
      },
      quota,
    };

    room.status = 'completed';
    room.readingId = readingId;
    room.readingResult = coupleAi.reading;
    room.fullReading = readingResponse;

    cacheReading(readingResponse);
    const publicView = saveCoupleRoom(room);

    recordFunnelEvent('couple_room_completed', {
      clientKey,
      roomCode: room.roomCode,
      readingId,
      topic: 'love',
      effectivePersona: coupleAi.effectivePersona,
    });
    recordFunnelEvent('view_result', {
      clientKey,
      readingId,
      topic: 'love',
      effectivePersona: coupleAi.effectivePersona,
    });

    return NextResponse.json(
      {
        status: 'ok',
        mode: 'coop_invite',
        room: publicView,
        reading: readingResponse,
        quota,
      },
      { status: 200 }
    );
  }

  // Validate shared fields for `solo_couple` and `create_room`
  const ownerNickname = String(
    rawBody.ownerNickname || rawBody.nickname || ''
  ).trim();
  if (!ownerNickname || ownerNickname.length > 40) {
    const errRes: ReadingErrorResponse = {
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Vui lòng nhập biệt danh của bạn (tối đa 40 ký tự).',
    };
    return NextResponse.json(errRes, { status: 400 });
  }

  const partnerNickname =
    String(
      rawBody.partnerNickname || rawBody.partner_nickname || 'Người ấy'
    )
      .trim()
      .slice(0, 40) || 'Người ấy';

  const rawBirthYear =
    rawBody.birthYear !== undefined
      ? Number(rawBody.birthYear)
      : rawBody.birth_year !== undefined
      ? Number(rawBody.birth_year)
      : 2002;

  if (
    !Number.isInteger(rawBirthYear) ||
    rawBirthYear < MIN_BIRTH_YEAR ||
    rawBirthYear > MAX_BIRTH_YEAR
  ) {
    const errRes: ReadingErrorResponse = {
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: `Năm sinh phải từ ${MIN_BIRTH_YEAR} đến ${MAX_BIRTH_YEAR} (tối thiểu 10 tuổi).`,
    };
    return NextResponse.json(errRes, { status: 400 });
  }

  const parsedReader = ReaderIdSchema.safeParse(
    rawBody.readerId || rawBody.reader_id || 'ba_co_mo_hon'
  );
  const readerId: ReaderId = parsedReader.success
    ? parsedReader.data
    : 'ba_co_mo_hon';

  const parsedRel = CoupleRelationshipStatusSchema.safeParse(
    rawBody.relationshipStatus || rawBody.relationship_status || 'situationship'
  );
  const relationshipStatus: CoupleRelationshipStatus = parsedRel.success
    ? parsedRel.data
    : 'situationship';
  const relationshipLabel =
    RELATIONSHIP_STATUS_LABELS[relationshipStatus] || 'Đang tìm hiểu';

  const parsedDeckMode = DeckModeSchema.safeParse(
    rawBody.deckMode || rawBody.deck_mode || 'major_22'
  );
  const deckMode: DeckMode = parsedDeckMode.success
    ? parsedDeckMode.data
    : 'major_22';
  const deckSize = deckMode === 'full_78' ? 78 : 22;

  const questionText = String(
    rawBody.questionText ??
      rawBody.question_text ??
      'Tụi mình có thật sự hợp tần số hay chỉ là trạm dừng chân?'
  )
    .trim()
    .slice(0, 300);

  // Pre-AI Crisis & Prompt Injection Scanner (PLAN.md Section 8.1)
  const scan = scanCrisisAndInjection(questionText);
  if (scan.safetyFlag === 'crisis') {
    const readingId = createCoupleReadingId();
    recordFunnelEvent('crisis_triggered', {
      clientKey,
      source: 'couple_api',
      reason: scan.matchedCrisisReason || 'pre_ai_keyword_match',
    });

    const crisisRes: ReadingCrisisResponse = {
      status: 'crisis',
      readingId,
      createdAt: new Date().toISOString(),
      safetyFlag: 'crisis',
      matchedReason: scan.matchedCrisisReason,
      crisisSupport: CRISIS_SUPPORT_DATA,
    };
    return NextResponse.json(crisisRes, { status: 200 });
  }

  const agePolicy = classifyAgeTier(
    rawBirthYear,
    CURRENT_REFERENCE_YEAR,
    readerId
  );
  const personaProfile = PERSONA_PROFILES[agePolicy.effectivePersona];

  // Handle `create_room` (Kiểu 2: Người A tạo phòng mời Người B trong 48h)
  if (action === 'create_room') {
    const ownerDraw = drawSingleRandomCardServerSide([], undefined, deckSize);
    const ownerCardObj =
      TAROT_CARDS_BY_ID[ownerDraw.card_id] ?? MAJOR_ARCANA[0]!;

    const roomCode = generateCoupleRoomCode();
    const nowMs = Date.now();
    const createdAt = new Date(nowMs).toISOString();
    const expiresAt = new Date(nowMs + COUPLE_ROOM_TTL_MS).toISOString();

    const ownerConsentedShare =
      typeof rawBody.ownerConsentedShare === 'boolean'
        ? rawBody.ownerConsentedShare
        : typeof rawBody.consentShare === 'boolean'
        ? rawBody.consentShare
        : typeof rawBody.consent_share === 'boolean'
        ? rawBody.consent_share
        : true;

    const storedRoom: StoredCoupleRoom = {
      roomCode,
      mode: 'coop_invite',
      status: 'waiting_partner',
      createdAt,
      expiresAt,
      ownerClientKey: clientKey,
      ownerBirthYear: rawBirthYear,
      readerId,
      readerDisplayName: personaProfile.displayName,
      relationshipStatus,
      relationshipLabel,
      deckMode,
      ownerNickname,
      ownerQuestionText: scan.sanitizedText, // Stored privately on server ONLY
      ownerCard: {
        card: ownerCardObj,
        reversed: ownerDraw.reversed,
      },
      ownerConsentedShare,
      ...(rawBody.partnerNickname || rawBody.partner_nickname
        ? { partnerNickname }
        : {}),
      partnerConsentedShare: true,
    };

    const publicView = saveCoupleRoom(storedRoom);
    recordFunnelEvent('couple_room_created', {
      clientKey,
      roomCode,
      topic: 'love',
      effectivePersona: agePolicy.effectivePersona,
    });

    return NextResponse.json(
      {
        status: 'ok',
        mode: 'coop_invite',
        room: publicView,
        quota: getQuotaStatus(clientKey),
      },
      { status: 200 }
    );
  }

  // Handle `solo_couple` (Kiểu 1: Tự soi mối quan hệ 2 người)
  const rawIndices = Array.isArray(rawBody.selectedIndices)
    ? rawBody.selectedIndices
    : Array.isArray(rawBody.selected_indices)
    ? rawBody.selected_indices
    : null;

  let selectedIndices: [number, number, number] = [0, 6, 19];
  if (
    rawIndices &&
    rawIndices.length === 3 &&
    rawIndices.every(
      (n) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < deckSize
    ) &&
    rawIndices[0] !== rawIndices[1] &&
    rawIndices[1] !== rawIndices[2] &&
    rawIndices[0] !== rawIndices[2]
  ) {
    selectedIndices = [
      Number(rawIndices[0]),
      Number(rawIndices[1]),
      Number(rawIndices[2]),
    ];
  }

  const drawResult = shuffleAndDrawServerSide(
    selectedIndices,
    undefined,
    deckSize
  );

  const couplePositions: [string, string, string] = [
    `Năng lượng của ${ownerNickname}`,
    `Năng lượng của ${partnerNickname}`,
    COUPLE_SPREAD_POSITIONS[2],
  ];

  const drawnCardsPayload: [
    DrawnCardClientPayload,
    DrawnCardClientPayload,
    DrawnCardClientPayload,
  ] = [0, 1, 2].map((idx) => {
    const slot = drawResult[idx as 0 | 1 | 2];
    const card = TAROT_CARDS_BY_ID[slot.card_id] ?? MAJOR_ARCANA[idx]!;
    return {
      position_index: idx as 0 | 1 | 2,
      position_label: couplePositions[idx as 0 | 1 | 2],
      fan_index: slot.fan_index,
      reversed: slot.reversed,
      card,
    };
  }) as [
    DrawnCardClientPayload,
    DrawnCardClientPayload,
    DrawnCardClientPayload,
  ];

  const coupleAi = await generateCoupleTarotReading({
    ownerNickname,
    partnerNickname,
    birthYear: rawBirthYear,
    readerId,
    relationshipStatus,
    questionText: scan.sanitizedText,
    ageTier: agePolicy.tier,
    effectivePersona: agePolicy.effectivePersona,
    drawnCards: drawnCardsPayload.map((d) => ({
      ...d.card,
      position_index: d.position_index,
      position_label: d.position_label,
      reversed: d.reversed,
    })),
  });

  const readingId = createCoupleReadingId();
  const nowMs = Date.now();
  const createdAt = new Date(nowMs).toISOString();
  const expiresAt = new Date(nowMs + COUPLE_ROOM_TTL_MS).toISOString();
  const roomCode = generateCoupleRoomCode();
  const quota = getQuotaStatus(clientKey);

  const readingResponse: ReadingSuccessResponse = {
    status: 'ok',
    readingId,
    createdAt,
    nickname: `${ownerNickname} & ${partnerNickname}`,
    birthYear: rawBirthYear,
    age: agePolicy.age,
    ageTier: agePolicy.tier,
    isKidTeenSafeMode: agePolicy.isKidTeenSafeMode,
    paymentEnabled: agePolicy.paymentEnabled,
    readerId,
    effectivePersona: coupleAi.effectivePersona,
    readerDisplayName: personaProfile.displayName,
    readerBadge: personaProfile.badgeTitle,
    topic: 'love',
    topicLabel: `Bói Đôi • ${relationshipLabel}`,
    questionText: scan.sanitizedText,
    deckMode,
    safetyFlag: coupleAi.reading.safety_flag,
    isPromptInjection: scan.isPromptInjection,
    drawnCards: drawnCardsPayload,
    result: coupleAi.reading,
    aiMeta: {
      model: coupleAi.aiModel,
      tokensIn: coupleAi.tokensIn,
      tokensOut: coupleAi.tokensOut,
      usedFallback: coupleAi.usedFallback,
      retryCount: coupleAi.retryCount,
    },
    quota,
  };

  const storedRoom: StoredCoupleRoom = {
    roomCode,
    mode: 'solo_couple',
    status: 'completed',
    createdAt,
    expiresAt,
    ownerClientKey: clientKey,
    ownerBirthYear: rawBirthYear,
    readerId,
    readerDisplayName: personaProfile.displayName,
    relationshipStatus,
    relationshipLabel,
    deckMode,
    ownerNickname,
    ownerQuestionText: scan.sanitizedText,
    ownerCard: {
      card: drawnCardsPayload[0].card,
      reversed: drawnCardsPayload[0].reversed,
    },
    ownerConsentedShare: true,
    partnerNickname,
    partnerCard: {
      card: drawnCardsPayload[1].card,
      reversed: drawnCardsPayload[1].reversed,
    },
    connectionCard: {
      card: drawnCardsPayload[2].card,
      reversed: drawnCardsPayload[2].reversed,
    },
    partnerConsentedShare: true,
    readingResult: coupleAi.reading,
    readingId,
    fullReading: readingResponse,
  };

  cacheReading(readingResponse);
  const publicView = saveCoupleRoom(storedRoom);

  recordFunnelEvent('couple_room_created', {
    clientKey,
    roomCode,
    mode: 'solo_couple',
    topic: 'love',
    effectivePersona: coupleAi.effectivePersona,
  });
  recordFunnelEvent('couple_room_completed', {
    clientKey,
    roomCode,
    readingId,
    mode: 'solo_couple',
    topic: 'love',
    effectivePersona: coupleAi.effectivePersona,
  });
  recordFunnelEvent('view_result', {
    clientKey,
    readingId,
    topic: 'love',
    effectivePersona: coupleAi.effectivePersona,
  });

  return NextResponse.json(
    {
      status: 'ok',
      mode: 'solo_couple',
      room: publicView,
      reading: readingResponse,
      quota,
    },
    { status: 200 }
  );
}
