import { describe, expect, it } from 'vitest';
import {
  buildContextualFallbackReading,
  generateClarifierReading,
  generateCoupleTarotReading,
  generateDailyCardReading,
} from '../src/lib/ai-provider';
import { PERSONA_PROFILES } from '../src/lib/prompts';
import {
  classifyAgeTier,
  COUPLE_SPREAD_POSITIONS,
  resolveEffectivePersona,
} from '../src/lib/safety';
import {
  ClarifierRequestSchema,
  CliffhangerUpsellSchema,
  countWords,
  CoupleReadingRequestSchema,
  EffectivePersonaSchema,
  ReaderIdSchema,
  ReadingOutputSchema,
  ReadingRequestSchema,
} from '../src/lib/schemas';
import {
  drawSingleRandomCardServerSide,
  generateShuffledMajorArcanaDeck,
  shuffleAndDrawServerSide,
} from '../src/lib/shuffler';

describe('Phase 2 & 3 AI, Shuffler 22/78 & Prompts Verification', () => {
  it('validates all 4 readers, 5 effective personas, 22/78 deck_mode, Couple & Clarifier schemas', () => {
    expect(ReaderIdSchema.options).toEqual([
      'ba_ngoai',
      'chi_dai',
      'ban_than',
      'thay_cu_meo',
      'ba_co_mo_hon',
      'tien_tu_chua_lanh',
      'tong_tai_ly_tri',
      'phap_su_toi_co',
    ]);
    expect(EffectivePersonaSchema.options).toEqual([
      'ba_ngoai',
      'chi_dai',
      'ban_than',
      'thay_cu_meo',
      'ba_ngoai_vui_tinh',
      'ba_co_mo_hon',
      'tien_tu_chua_lanh',
      'tong_tai_ly_tri',
      'phap_su_toi_co',
    ]);

    // major_22 rejects index > 21
    const invalidMajor = ReadingRequestSchema.safeParse({
      nickname: 'Test',
      birth_year: 2002,
      reader_id: 'tong_tai_ly_tri',
      topic: 'career',
      question_text: 'Mình có nên chuyển việc lúc này?',
      deck_mode: 'major_22',
      selected_indices: [0, 12, 45],
    });
    expect(invalidMajor.success).toBe(false);

    // full_78 accepts indices up to 77
    const validFull = ReadingRequestSchema.safeParse({
      nickname: 'Test',
      birth_year: 2002,
      reader_id: 'phap_su_toi_co',
      topic: 'love',
      question_text: 'Duyên nghiệp giữa hai người là gì?',
      deck_mode: 'full_78',
      selected_indices: [0, 35, 77],
    });
    expect(validFull.success).toBe(true);

    expect(
      CoupleReadingRequestSchema.safeParse({
        nickname: 'An',
        partner_nickname: 'Bình',
        relationship_status: 'situationship',
      }).success
    ).toBe(true);

    expect(
      ClarifierRequestSchema.safeParse({
        followup_question: 'Làm sao để tháo gỡ khoảng cách trong 2 tuần tới?',
      }).success
    ).toBe(true);
  });

  it('shuffles 22 or 78 cards and draws single Clarifier/Daily cards with exclusions', () => {
    const deck22 = generateShuffledMajorArcanaDeck(0.3, 22);
    expect(deck22).toHaveLength(22);

    const deck78 = generateShuffledMajorArcanaDeck(0.3, 78);
    expect(deck78).toHaveLength(78);

    const drawn78 = shuffleAndDrawServerSide([5, 38, 77], 0.3, 78);
    expect(drawn78).toHaveLength(3);
    expect(drawn78.deck).toHaveLength(78);

    const single = drawSingleRandomCardServerSide([0, 1, 2], 0.3, 78);
    expect(single.card_id).toBeGreaterThanOrEqual(3);
    expect(single.card_id).toBeLessThanOrEqual(77);
  });

  it('supports Tổng Tài Lý Trí and Pháp Sư Tối Cổ personas with responsible cliffhanger upsell', () => {
    expect(COUPLE_SPREAD_POSITIONS).toEqual([
      'Năng lượng của bạn',
      'Năng lượng của người ấy',
      'Sợi dây kết nối & Xu hướng',
    ]);
    expect(resolveEffectivePersona('ba_co_mo_hon', 'kid_teen_10_15')).toBe(
      'ba_ngoai_vui_tinh'
    );
    expect(resolveEffectivePersona('tong_tai_ly_tri', 'adult_18_plus')).toBe(
      'tong_tai_ly_tri'
    );
    expect(resolveEffectivePersona('phap_su_toi_co', 'adult_18_plus')).toBe(
      'phap_su_toi_co'
    );

    for (const readerId of ['tong_tai_ly_tri', 'phap_su_toi_co'] as const) {
      expect(PERSONA_PROFILES[readerId].displayName.length).toBeGreaterThan(3);
      const policy = classifyAgeTier(2000, 2026, readerId);
      const reading = buildContextualFallbackReading({
        nickname: 'Minh',
        birthYear: 2000,
        readerId,
        topic: 'career',
        questionText: 'Nên đầu tư thời gian vào dự án mới hay giữ vị trí cũ?',
        ageTier: policy.tier,
        effectivePersona: policy.effectivePersona,
        drawnCards: [
          { id: 1, reversed: false },
          { id: 34, reversed: true },
          { id: 68, reversed: false },
        ],
      });

      expect(ReadingOutputSchema.safeParse(reading).success).toBe(true);
      expect(reading.cliffhanger_upsell).toBeDefined();
      expect(
        CliffhangerUpsellSchema.safeParse(reading.cliffhanger_upsell).success
      ).toBe(true);
    }
  });

  it('omits cliffhanger_upsell when safety_flag is crisis', () => {
    const crisisReading = buildContextualFallbackReading({
      nickname: 'User',
      birthYear: 2002,
      readerId: 'ba_co_mo_hon',
      topic: 'love',
      questionText: 'Em muốn tự tử vì quá tuyệt vọng',
      drawnCards: [
        { id: 0, reversed: false },
        { id: 1, reversed: false },
        { id: 2, reversed: false },
      ],
    });
    expect(crisisReading.safety_flag).toBe('crisis');
    expect(crisisReading.cliffhanger_upsell).toBeUndefined();
  });

  it('generates Couple reading, Clarifier reading, and Daily 1-card reading', async () => {
    const coupleRes = await generateCoupleTarotReading({
      ownerNickname: 'Lan',
      partnerNickname: 'Điệp',
      relationshipStatus: 'situationship',
      readerId: 'ba_co_mo_hon',
      drawnCards: [
        { id: 6, reversed: false },
        { id: 15, reversed: true },
        { id: 42, reversed: false },
      ],
    });
    expect(coupleRes.reading.metrics).toBeDefined();
    expect(coupleRes.reading.metrics?.entertainment_note).toBe('Chỉ để giải trí');
    expect(coupleRes.reading.shareable_card.savage_quotes).toHaveLength(3);
    for (const q of coupleRes.reading.shareable_card.savage_quotes) {
      expect(countWords(q)).toBeLessThanOrEqual(22);
    }

    const clarifierRes = await generateClarifierReading({
      card: { id: 19, name_vi: 'Mặt Trời Rực Rỡ', name_en: 'The Sun', reversed: false },
      reversed: false,
      questionAsked: 'Mình nên chủ động nhắn tin trước không?',
      readerId: 'tong_tai_ly_tri',
    });
    expect(clarifierRes.interpretation.length).toBeGreaterThan(20);
    expect(clarifierRes.advice.length).toBeGreaterThan(10);
    expect(countWords(clarifierRes.savageQuote)).toBeLessThanOrEqual(22);

    const dailyRes = await generateDailyCardReading({
      card: { id: 17, name_vi: 'Ngôi Sao Hy Vọng', name_en: 'The Star', reversed: false },
      reversed: false,
      readerId: 'phap_su_toi_co',
      streakDays: 3,
    });
    expect(dailyRes.headline.length).toBeGreaterThan(5);
    expect(dailyRes.message.length).toBeGreaterThan(20);
    expect(dailyRes.luckyNumber).toBeGreaterThanOrEqual(10);
    expect(dailyRes.luckyColor.length).toBeGreaterThan(3);
    expect(dailyRes.luckyItem.length).toBeGreaterThan(3);
  });
});
