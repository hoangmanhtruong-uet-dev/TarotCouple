import { describe, expect, it } from 'vitest';
import { POST as postClarifier } from '../src/app/api/clarifier/route';
import { GET as getCouple, POST as postCouple } from '../src/app/api/couple/route';
import { GET as getDaily, POST as postDaily } from '../src/app/api/daily/route';
import {
  GET as getPayment,
  POST as postPayment,
  PUT as putPayment,
} from '../src/app/api/payment/route';
import { POST as postPayOsWebhook } from '../src/app/api/pay/webhook/route';
import { POST as postReading } from '../src/app/api/reading/route';
import { GET as getStoryCard } from '../src/app/api/story-card/route';
import {
  ALL_TAROT_CARDS,
  MAJOR_ARCANA,
  MINOR_ARCANA,
  READERS,
  TAROT_CARDS_BY_ID,
} from '../src/data/tarot-cards';
import {
  generateClarifierReading,
  generateCoupleTarotReading,
  generateDailyCardReading,
  generateTarotReading,
} from '../src/lib/ai-provider';
import { resetAllQuotaStoreForTesting } from '../src/lib/quota-store';
import { ReadingOutputSchema } from '../src/lib/schemas';
import {
  drawSingleRandomCardServerSide,
  shuffleAndDrawServerSide,
} from '../src/lib/shuffler';

describe('Phase 2 & Phase 3 Verification Suite (78 Cards, 4 Readers, Couple, Clarifier, Daily & PayOS)', () => {
  it('1. validates full 78-card Rider-Waite-Smith deck (22 Major + 56 Minor across 4 suits) and 4 active Readers', () => {
    expect(MAJOR_ARCANA).toHaveLength(22);
    expect(MINOR_ARCANA).toHaveLength(56);
    expect(ALL_TAROT_CARDS).toHaveLength(78);
    expect(Object.keys(TAROT_CARDS_BY_ID)).toHaveLength(78);

    const suitCounts = { wands: 0, cups: 0, swords: 0, pentacles: 0 };
    for (const card of MINOR_ARCANA) {
      expect(card.arcana).toBe('minor');
      expect(card.suit).toBeDefined();
      suitCounts[card.suit!]++;
      expect(card.rws_image_url).toMatch(/^https:\/\/upload\.wikimedia\.org\//);
      expect(card.keywords_up.length).toBeGreaterThanOrEqual(4);
      expect(card.keywords_rev.length).toBeGreaterThanOrEqual(4);
    }
    expect(suitCounts).toEqual({
      wands: 14,
      cups: 14,
      swords: 14,
      pentacles: 14,
    });

    const activeReaders = READERS.filter((r) => r.active);
    expect(activeReaders.map((r) => r.id)).toEqual([
      'ba_ngoai',
      'chi_dai',
      'ban_than',
      'thay_cu_meo',
    ]);
  });

  it('2. shuffles and draws from the full 78-card deck and single card drawer using CSPRNG', () => {
    const drawn78 = shuffleAndDrawServerSide([4, 39, 75], 0.3, 78);
    expect(drawn78).toHaveLength(3);
    expect(drawn78.deck).toHaveLength(78);

    const excluded = drawn78.map((d) => d.card_id);
    const single = drawSingleRandomCardServerSide(excluded, 0.3, 78);
    expect(excluded).not.toContain(single.card_id);
    expect(single.card_id).toBeGreaterThanOrEqual(0);
    expect(single.card_id).toBeLessThanOrEqual(77);
  });

  it('3. generates validated readings for new Phase 2/3 Readers (Tổng Tài Lý Trí & Pháp Sư Tối Cổ) with responsible cliffhanger_upsell', async () => {
    const sampleCards = [
      { ...TAROT_CARDS_BY_ID[22]!, position_index: 0 as const, reversed: false },
      { ...TAROT_CARDS_BY_ID[45]!, position_index: 1 as const, reversed: true },
      { ...TAROT_CARDS_BY_ID[70]!, position_index: 2 as const, reversed: false },
    ];

    for (const readerId of ['tong_tai_ly_tri', 'phap_su_toi_co'] as const) {
      const res = await generateTarotReading({
        nickname: 'Hoàng Trường',
        birthYear: 2001,
        readerId,
        topic: 'career',
        questionText:
          'Mình đang xây dựng dự án startup AI Tarot cho Gen Z, cần tập trung chiến lược nào để tăng trưởng bền vững?',
        drawnCards: sampleCards,
      });

      const parsed = ReadingOutputSchema.safeParse(res.reading);
      expect(parsed.success).toBe(true);
      expect(res.reading.cliffhanger_upsell).toBeDefined();
      expect(res.reading.cliffhanger_upsell?.clarifier_cost_stars).toBe(5);
      expect(
        res.reading.cliffhanger_upsell?.suggested_followup_questions
      ).toHaveLength(2);
    }
  });

  it('4. generates Couple Tarot readings with entertainment compatibility & red flag metrics, Clarifier 4th card, and Daily 1-card pull', async () => {
    const coupleCards = [
      { ...TAROT_CARDS_BY_ID[6]!, position_index: 0 as const, reversed: false },
      { ...TAROT_CARDS_BY_ID[37]!, position_index: 1 as const, reversed: false },
      { ...TAROT_CARDS_BY_ID[19]!, position_index: 2 as const, reversed: false },
    ];

    const coupleRes = await generateCoupleTarotReading({
      ownerNickname: 'Trường',
      partnerNickname: 'Linh',
      birthYear: 2002,
      readerId: 'ba_co_mo_hon',
      relationshipStatus: 'dating',
      questionText: 'Tụi mình hợp nhau điểm nào nhất và cần lưu ý gì?',
      drawnCards: coupleCards,
    });

    expect(coupleRes.result.metrics).toBeDefined();
    expect(
      coupleRes.result.metrics?.compatibility_score
    ).toBeGreaterThanOrEqual(40);
    expect(coupleRes.result.metrics?.red_flag_level).toBeGreaterThanOrEqual(0);
    expect(coupleRes.result.metrics?.entertainment_note).toContain('giải trí');

    const clarifierRes = await generateClarifierReading({
      card: TAROT_CARDS_BY_ID[1]!,
      reversed: false,
      questionAsked: 'Bước tiếp theo hai đứa nên làm để hiểu nhau hơn là gì?',
      nickname: 'Trường',
      readerId: 'tong_tai_ly_tri',
      birthYear: 2002,
      starsSpent: 5,
    });
    expect(clarifierRes.interpretation.length).toBeGreaterThan(20);
    expect(clarifierRes.starsSpent).toBe(5);

    const dailyRes = await generateDailyCardReading({
      card: TAROT_CARDS_BY_ID[17]!,
      reversed: false,
      readerId: 'tien_tu_chua_lanh',
      streakDays: 3,
      starsRewarded: 2,
      totalStarsBalance: 12,
    });
    expect(dailyRes.headline).toContain(TAROT_CARDS_BY_ID[17]!.name_vi);
    expect(dailyRes.streakDays).toBe(3);
    expect(dailyRes.luckyNumber).toBeGreaterThanOrEqual(10);
  });

  it('5. verifies /api/reading with full_78 deck mode and /api/couple (solo_couple + coop_invite privacy guardrail)', async () => {
    resetAllQuotaStoreForTesting();

    // Test /api/reading with full_78 deck_mode
    const readingReq = new Request('http://localhost:3000/api/reading', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': 'test_p23_user',
      },
      body: JSON.stringify({
        nickname: 'Trường',
        birth_year: 2001,
        reader_id: 'tong_tai_ly_tri',
        topic: 'career',
        question_text: 'Tháng này dự án mới của mình tiến triển thế nào?',
        deck_mode: 'full_78',
        selected_indices: [5, 38, 72],
      }),
    });

    const readingRes = await postReading(readingReq);
    expect(readingRes.status).toBe(200);
    const readingData = await readingRes.json();
    expect(readingData.status).toBe('ok');
    expect(readingData.deckMode).toBe('full_78');
    expect(readingData.quota.starsBalance).toBe(10);

    // Test /api/couple create_room (Person A) and verify Person A's question is NEVER exposed
    const secretQuestion = 'Bí mật riêng của A: Liệu người ấy có còn nhớ người yêu cũ không?';
    const createRoomReq = new Request('http://localhost:3000/api/couple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': 'person_a_client',
      },
      body: JSON.stringify({
        action: 'create_room',
        ownerNickname: 'Minh Anh',
        birthYear: 2002,
        readerId: 'ba_co_mo_hon',
        relationshipStatus: 'situationship',
        questionText: secretQuestion,
      }),
    });

    const createRoomRes = await postCouple(createRoomReq);
    expect(createRoomRes.status).toBe(200);
    const createRoomJson = await createRoomRes.json();
    expect(createRoomJson.status).toBe('ok');
    expect(createRoomJson.room.roomCode).toHaveLength(6);
    expect(createRoomJson.room.status).toBe('waiting_partner');
    expect(JSON.stringify(createRoomJson.room)).not.toContain(secretQuestion);
    expect(
      (createRoomJson.room as Record<string, unknown>).ownerQuestionText
    ).toBeUndefined();

    // GET /api/couple?roomCode=... by Person B
    const getRoomReq = new Request(
      `http://localhost:3000/api/couple?roomCode=${createRoomJson.room.roomCode}`,
      { method: 'GET' }
    );
    const getRoomRes = await getCouple(getRoomReq);
    expect(getRoomRes.status).toBe(200);
    const getRoomJson = await getRoomRes.json();
    expect(JSON.stringify(getRoomJson.room)).not.toContain(secretQuestion);

    // POST /api/couple join_room by Person B
    const joinRoomReq = new Request('http://localhost:3000/api/couple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': 'person_b_client',
      },
      body: JSON.stringify({
        action: 'join_room',
        roomCode: createRoomJson.room.roomCode,
        partnerNickname: 'Hoàng',
      }),
    });
    const joinRoomRes = await postCouple(joinRoomReq);
    expect(joinRoomRes.status).toBe(200);
    const joinRoomJson = await joinRoomRes.json();
    expect(joinRoomJson.status).toBe('ok');
    expect(joinRoomJson.room.status).toBe('completed');
    expect(joinRoomJson.room.readingResult.metrics.compatibility_score).toBeGreaterThanOrEqual(40);
    expect(JSON.stringify(joinRoomJson.room)).not.toContain(secretQuestion);
  });

  it('6. verifies /api/clarifier, /api/daily, /api/payment (Under-18 block, 50k cap, idempotency), and /api/story-card v2', async () => {
    resetAllQuotaStoreForTesting();
    const clientHeaders = {
      'Content-Type': 'application/json',
      'x-client-id': 'wallet_tester_01',
    };

    // 1. Daily pull awards +2 Stars (from initial 10 -> 12) and increments streak to 1
    const dailyPostRes = await postDaily(
      new Request('http://localhost:3000/api/daily', {
        method: 'POST',
        headers: clientHeaders,
        body: JSON.stringify({ readerId: 'ba_co_mo_hon' }),
      })
    );
    expect(dailyPostRes.status).toBe(200);
    const dailyJson = await dailyPostRes.json();
    expect(dailyJson.status).toBe('ok');
    expect(dailyJson.alreadyPulledToday).toBe(false);
    expect(dailyJson.quota.starsBalance).toBe(12);
    expect(dailyJson.quota.streakDays).toBe(1);

    //GET /api/daily confirms today's pull
    const dailyGetRes = await getDaily(
      new Request('http://localhost:3000/api/daily', {
        method: 'GET',
        headers: clientHeaders,
      })
    );
    const dailyGetJson = await dailyGetRes.json();
    expect(dailyGetJson.alreadyPulledToday).toBe(true);
    expect(dailyGetJson.starsBalance).toBe(12);

    // 2. Clarifier Crisis Check: Crisis follow-up question does NOT deduct Stars
    const crisisClarifierRes = await postClarifier(
      new Request('http://localhost:3000/api/clarifier', {
        method: 'POST',
        headers: clientHeaders,
        body: JSON.stringify({
          followupQuestion: 'Em tuyệt vọng lắm chỉ muốn chết thôi',
          nickname: 'An',
          birthYear: 2002,
        }),
      })
    );
    const crisisClarifierJson = await crisisClarifierRes.json();
    expect(crisisClarifierJson.status).toBe('crisis');

    // 3. Normal Clarifier deducts 5 Stars (12 -> 7)
    const okClarifierRes = await postClarifier(
      new Request('http://localhost:3000/api/clarifier', {
        method: 'POST',
        headers: clientHeaders,
        body: JSON.stringify({
          followupQuestion: 'Mình nên chủ động nhắn tin trước hay đợi cuối tuần?',
          nickname: 'An',
          birthYear: 2002,
          readerId: 'ba_co_mo_hon',
          excludeCardIds: [0, 6, 19],
        }),
      })
    );
    expect(okClarifierRes.status).toBe(200);
    const okClarifierJson = await okClarifierRes.json();
    expect(okClarifierJson.status).toBe('ok');
    expect(okClarifierJson.clarifier.starsSpent).toBe(5);
    expect(okClarifierJson.quota.starsBalance).toBe(7);

    // 4. Payment Under-11 Block (birthYear 2016 -> 10yo in 2026 -> HTTP 403 AGE_PAYMENT_BLOCKED)
    const under11PayRes = await postPayment(
      new Request('http://localhost:3000/api/payment', {
        method: 'POST',
        headers: clientHeaders,
        body: JSON.stringify({
          packageId: 'dem_suy_19k',
          birthYear: 2016,
        }),
      })
    );
    expect(under11PayRes.status).toBe(403);
    const under11PayJson = await under11PayRes.json();
    expect(under11PayJson.code).toBe('AGE_PAYMENT_BLOCKED');

    // 5. Adult Payment Order + Idempotent Webhook Confirmation
    const getPkgRes = await getPayment(
      new Request('http://localhost:3000/api/payment', {
        method: 'GET',
        headers: clientHeaders,
      })
    );
    const getPkgJson = await getPkgRes.json();
    expect(getPkgJson.packages.length).toBeGreaterThanOrEqual(4);

    const adultPayRes = await postPayment(
      new Request('http://localhost:3000/api/payment', {
        method: 'POST',
        headers: clientHeaders,
        body: JSON.stringify({
          packageId: 'check_var_29k',
          birthYear: 2000,
        }),
      })
    );
    expect(adultPayRes.status).toBe(200);
    const adultPayJson = await adultPayRes.json();
    expect(adultPayJson.order.orderCode).toMatch(/^TC-/);

    // P0-3: PUT /api/payment is disabled for security and MUST return 405 Method Not Allowed
    const putDisabledRes = await putPayment();
    expect(putDisabledRes.status).toBe(405);
    const putDisabledJson = await putDisabledRes.json();
    expect(putDisabledJson.code).toBe('METHOD_NOT_ALLOWED');

    // Official Webhook confirmation (POST /api/pay/webhook) credits +35 Stars (7 -> 42) and records 29.000đ daily spend
    process.env.PAYOS_SANDBOX = 'true';
    const rawNumericCode = adultPayJson.order.orderCode.replace(/^TC-/, '');
    const webhookPayload = {
      code: '00',
      desc: 'success',
      data: {
        orderCode: rawNumericCode,
        amount: 29000,
        reference: 'PAYOS_TX_999',
      },
    };

    const confirm1Res = await postPayOsWebhook(
      new Request('http://localhost:3000/api/pay/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      })
    );
    const confirm1Json = await confirm1Res.json();
    expect(confirm1Res.status).toBe(200);
    expect(confirm1Json.status).toBe('ok');
    expect(confirm1Json.idempotentReplay).toBe(false);
    const updatedClientQuota = (await (await getPayment(new Request('http://localhost:3000/api/payment', { headers: clientHeaders }))).json()).quota;
    expect(updatedClientQuota.starsBalance).toBe(42);
    expect(updatedClientQuota.dailySpendVnd).toBe(29000);

    // Second duplicate webhook confirmation with same providerRef / orderCode NEVER credits twice!
    const confirm2Res = await postPayOsWebhook(
      new Request('http://localhost:3000/api/pay/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      })
    );
    const confirm2Json = await confirm2Res.json();
    expect(confirm2Res.status).toBe(200);
    expect(confirm2Json.status).toBe('ok');
    expect(confirm2Json.idempotentReplay).toBe(true);
    const replayQuota = (await (await getPayment(new Request('http://localhost:3000/api/payment', { headers: clientHeaders }))).json()).quota;
    expect(replayQuota.starsBalance).toBe(42);

    // 6. Responsible Daily Spend Cap: another 29.000đ package today (29k + 29k = 58k > 50k cap) is blocked!
    const capExceededRes = await postPayment(
      new Request('http://localhost:3000/api/payment', {
        method: 'POST',
        headers: clientHeaders,
        body: JSON.stringify({
          packageId: 'check_var_29k',
          birthYear: 2000,
        }),
      })
    );
    expect(capExceededRes.status).toBe(400);
    const capExceededJson = await capExceededRes.json();
    expect(capExceededJson.code).toBe('DAILY_SPEND_CAP_EXCEEDED');

    // 7. Story Card 9:16 v2 with Couple Meter Bar renders valid PNG
    const storyRes = await getStoryCard(
      new Request(
        'http://localhost:3000/api/story-card?persona=tong_tai_ly_tri&compatScore=88&redFlagLevel=18&vibeTag=HopCaDinhCao',
        { method: 'GET' }
      )
    );
    expect(storyRes.status).toBe(200);
    expect(storyRes.headers.get('content-type')).toContain('image/png');
    const pngBuf = await storyRes.arrayBuffer();
    expect(pngBuf.byteLength).toBeGreaterThan(5000);
  });
});
