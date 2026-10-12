import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  computeCoupleEntertainmentMetrics,
  generateClarifierReading,
  generateCoupleTarotReading,
  generateTarotReading,
  getValidGeminiApiKeys,
  hasValidGeminiApiKey,
  GEMINI_MODEL_CHAIN,
} from '@/lib/ai-provider';
import { ReadingMetricsSchema, ReadingOutputSchema, CoupleRelationshipStatus } from '@/lib/schemas';
import type { DrawnCardWithMeta } from '@/lib/schemas';

// Mock @google/genai to intercept and test key and model rotation
const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  class MockGoogleGenAI {
    apiKey: string;
    models: {
      generateContent: (args: any) => Promise<any>;
    };

    constructor(options: { apiKey: string }) {
      this.apiKey = options?.apiKey;
      this.models = {
        generateContent: (args: any) => mockGenerateContent(this.apiKey, args),
      };
    }
  }

  return {
    GoogleGenAI: MockGoogleGenAI,
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      NUMBER: 'NUMBER',
      INTEGER: 'INTEGER',
      BOOLEAN: 'BOOLEAN',
      ARRAY: 'ARRAY',
    },
  };
});

describe('Milestone 1 Empirical Challenger Stress Test Suite (Backend AI 5-Key Upgrade)', () => {
  const originalEnv = { ...process.env };

  const dummyCards: [DrawnCardWithMeta, DrawnCardWithMeta, DrawnCardWithMeta] = [
    {
      id: 0,
      name_en: 'The Fool',
      name_vi: 'Kẻ Khờ Đón Gió',
      arcana: 'major',
      position_index: 0,
      position_label: 'Năng lượng của bạn',
      reversed: false,
      keywords_up: ['Khởi đầu mới'],
      keywords_rev: ['Bốc đồng'],
    },
    {
      id: 6,
      name_en: 'The Lovers',
      name_vi: 'Những Kẻ Yêu Nhau',
      arcana: 'major',
      position_index: 1,
      position_label: 'Năng lượng của đối phương',
      reversed: false,
      keywords_up: ['Hòa hợp'],
      keywords_rev: ['Mâu thuẫn'],
    },
    {
      id: 17,
      name_en: 'The Star',
      name_vi: 'Ngôi Sao Hy Vọng',
      arcana: 'major',
      position_index: 2,
      position_label: 'Sợi dây kết nối & Xu hướng',
      reversed: false,
      keywords_up: ['Hy vọng'],
      keywords_rev: ['Mất niềm tin'],
    },
  ];

  const challengingCards: [DrawnCardWithMeta, DrawnCardWithMeta, DrawnCardWithMeta] = [
    {
      id: 13,
      name_en: 'Death',
      name_vi: 'Thần Chết',
      arcana: 'major',
      position_index: 0,
      position_label: 'Năng lượng của bạn',
      reversed: true,
      keywords_up: ['Kết thúc'],
      keywords_rev: ['Cố chấp'],
    },
    {
      id: 15,
      name_en: 'The Devil',
      name_vi: 'Ác Quỷ',
      arcana: 'major',
      position_index: 1,
      position_label: 'Năng lượng của đối phương',
      reversed: false,
      keywords_up: ['Ràng buộc'],
      keywords_rev: ['Thao túng'],
    },
    {
      id: 16,
      name_en: 'The Tower',
      name_vi: 'Tòa Tháp Đổ',
      arcana: 'major',
      position_index: 2,
      position_label: 'Sợi dây kết nối & Xu hướng',
      reversed: false,
      keywords_up: ['Sụp đổ'],
      keywords_rev: ['Trì hoãn biến cố'],
    },
  ];

  const variedStatuses: Array<CoupleRelationshipStatus | 'married' | 'complicated' | 'broken_up'> = [
    'crush',
    'dating',
    'situationship',
    'ex',
    'married' as any,
    'complicated' as any,
    'broken_up' as any,
  ];

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockGenerateContent.mockReset();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe('1. Stress Test: getValidGeminiApiKeys() & Key Rotation Logic', () => {
    it('1.1 parses single GEMINI_API_KEY correctly', () => {
      delete process.env.GEMINI_API_KEYS;
      for (let i = 2; i <= 10; i++) delete process.env[`GEMINI_API_KEY_${i}`];
      process.env.GEMINI_API_KEY = 'AIzaSyTestKeyPrimary123456';

      const keys = getValidGeminiApiKeys();
      expect(keys).toEqual(['AIzaSyTestKeyPrimary123456']);
      expect(hasValidGeminiApiKey()).toBe(true);
    });

    it('1.2 parses up to 10 indexed GEMINI_API_KEY_n variables in sequence', () => {
      delete process.env.GEMINI_API_KEYS;
      process.env.GEMINI_API_KEY = 'AIzaSyKeyIndex01_ValidLength';
      for (let i = 2; i <= 10; i++) {
        process.env[`GEMINI_API_KEY_${i}`] = `AIzaSyKeyIndex${i.toString().padStart(2, '0')}_ValidLength`;
      }

      const keys = getValidGeminiApiKeys();
      expect(keys).toHaveLength(10);
      expect(keys[0]).toBe('AIzaSyKeyIndex01_ValidLength');
      expect(keys[1]).toBe('AIzaSyKeyIndex02_ValidLength');
      expect(keys[9]).toBe('AIzaSyKeyIndex10_ValidLength');
    });

    it('1.3 parses plural GEMINI_API_KEYS with comma and newline delimiters and trims whitespace', () => {
      delete process.env.GEMINI_API_KEY;
      for (let i = 2; i <= 10; i++) delete process.env[`GEMINI_API_KEY_${i}`];
      process.env.GEMINI_API_KEYS = `
        AIzaSyKeyA_DelimiterValid123,  AIzaSyKeyB_DelimiterValid123  
        AIzaSyKeyC_DelimiterValid123,AIzaSyKeyD_DelimiterValid123
      `;

      const keys = getValidGeminiApiKeys();
      expect(keys).toEqual([
        'AIzaSyKeyA_DelimiterValid123',
        'AIzaSyKeyB_DelimiterValid123',
        'AIzaSyKeyC_DelimiterValid123',
        'AIzaSyKeyD_DelimiterValid123',
      ]);
      expect(hasValidGeminiApiKey()).toBe(true);
    });

    it('1.4 deduplicates identical keys across single, indexed, and plural env vars', () => {
      process.env.GEMINI_API_KEY = 'AIzaSySharedKey_ValidLength123';
      process.env.GEMINI_API_KEY_2 = 'AIzaSySharedKey_ValidLength123'; // Duplicate
      process.env.GEMINI_API_KEY_3 = 'AIzaSyUniqueKey3_ValidLength123';
      process.env.GEMINI_API_KEYS = 'AIzaSySharedKey_ValidLength123, AIzaSyUniqueKey4_ValidLength123';

      const keys = getValidGeminiApiKeys();
      expect(keys).toHaveLength(3);
      expect(keys).toEqual([
        'AIzaSySharedKey_ValidLength123',
        'AIzaSyUniqueKey3_ValidLength123',
        'AIzaSyUniqueKey4_ValidLength123',
      ]);
    });

    it('1.5 strictly filters out empty, placeholder, and short (< 15 chars) keys', () => {
      process.env.GEMINI_API_KEY = '   ';
      process.env.GEMINI_API_KEY_2 = 'your_gemini_api_key_here';
      process.env.GEMINI_API_KEY_3 = 'YOUR_API_KEY';
      process.env.GEMINI_API_KEY_4 = 'placeholder_secret_key';
      process.env.GEMINI_API_KEY_5 = 'shortKey123'; // 11 chars < 15
      process.env.GEMINI_API_KEYS = 'placeholder_another, tooShort';

      const keys = getValidGeminiApiKeys();
      expect(keys).toEqual([]);
      expect(hasValidGeminiApiKey()).toBe(false);
    });
  });

  describe('2. Stress Test: GEMINI_MODEL_CHAIN & Model Failover Cascading', () => {
    it('2.1 GEMINI_MODEL_CHAIN exports the exact 4 candidate models in mandated priority order', () => {
      expect(GEMINI_MODEL_CHAIN).toEqual([
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-3.6-flash',
        'gemini-3-flash-preview',
      ]);
      expect(GEMINI_MODEL_CHAIN[0]).toBe('gemini-3.5-flash-lite');
      expect(Object.isFrozen(GEMINI_MODEL_CHAIN) || Array.isArray(GEMINI_MODEL_CHAIN)).toBe(true);
    });

    it('2.2 Clarifier AI rotates across keys and candidate models when simulated online', async () => {
      process.env.GEMINI_API_KEY = 'AIzaSyMockKeyAlpha_1234567';
      process.env.GEMINI_API_KEY_2 = 'AIzaSyMockKeyBeta_1234567';

      const attempts: Array<{ key: string; model: string }> = [];

      mockGenerateContent.mockImplementation(async (apiKey: string, opts: any) => {
        attempts.push({ key: apiKey, model: opts.model });
        // Primary model fails with 429 quota exhaustion
        if (opts.model === 'gemini-3.5-flash-lite') {
          throw new Error('429 RESOURCE_EXHAUSTED');
        }
        // Secondary model succeeds
        if (opts.model === 'gemini-3.1-flash-lite') {
          return {
            text: JSON.stringify({
              interpretation: 'Lời luận giải sâu sắc đạt chuẩn độ dài tối thiểu cho trải bài làm rõ.',
              advice: 'Lời khuyên hành động thiết thực trong vòng 24 giờ tới.',
              savageQuote: 'Quote đắt giá dưới 20 từ.',
            }),
            usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 85 },
          };
        }
        throw new Error('Unexpected model');
      });

      const savedVitest = process.env.VITEST;
      delete process.env.VITEST;

      try {
        const res = await generateClarifierReading({
          card: { id: 0, name_vi: 'Kẻ Khờ', name_en: 'The Fool', reversed: false },
          reversed: false,
          questionAsked: 'Liệu mình có nên thử sức một lần nữa?',
          readerId: 'ba_co_mo_hon',
        });

        expect(res.usedFallback).toBe(false);
        expect(res.aiModel).toBe('gemini-3.1-flash-lite');
        expect(res.interpretation).toContain('Lời luận giải sâu sắc');
        expect(res.advice).toContain('Lời khuyên hành động');
        expect(res.savageQuote).toBe('Quote đắt giá dưới 20 từ.');
        expect(typeof res.usedFallback).toBe('boolean');
        expect(res.tokensIn).toBe(120);
        expect(res.tokensOut).toBe(85);

        // Verify that model chain failover was executed
        expect(attempts.length).toBeGreaterThanOrEqual(2);
        expect(attempts[0].model).toBe('gemini-3.5-flash-lite');
        expect(attempts[1].model).toBe('gemini-3.1-flash-lite');
      } finally {
        process.env.VITEST = savedVitest;
      }
    });

    it('2.3 Clarifier AI cleanly falls back to deterministic persona template when all keys and models fail', async () => {
      process.env.GEMINI_API_KEY = 'AIzaSyMockKeyFailing_123456';

      mockGenerateContent.mockRejectedValue(new Error('500 INTERNAL_SERVER_ERROR'));

      const savedVitest = process.env.VITEST;
      delete process.env.VITEST;

      try {
        const res = await generateClarifierReading({
          card: { id: 1, name_vi: 'Nhà Ảo Thuật', name_en: 'The Magician', reversed: true },
          reversed: true,
          questionAsked: 'Người ấy có đang thao túng tâm lý mình không?',
          readerId: 'chi_dai',
        });

        expect(res.usedFallback).toBe(true);
        expect(typeof res.usedFallback).toBe('boolean');
        expect(res.aiModel).toBe('clarifier-persona-template-v1');
        expect(res.interpretation).toContain('Chị giải đáp thẳng');
        expect(res.advice).toContain('Hành động ngay');
        expect(res.savageQuote).toContain('Chị Đại bắt bài');
      } finally {
        process.env.VITEST = savedVitest;
      }
    });
  });

  describe('3. Couple Mode Compatibility Metrics Stress Test Across Varied Relationship Statuses', () => {
    it('3.1 calculates bounded metrics (42 <= compat <= 98, 8 <= redFlag <= 88) for all statuses', () => {
      for (const status of variedStatuses) {
        const metrics = computeCoupleEntertainmentMetrics(dummyCards, status as CoupleRelationshipStatus);

        expect(metrics.compatibility_score).toBeGreaterThanOrEqual(42);
        expect(metrics.compatibility_score).toBeLessThanOrEqual(98);
        expect(metrics.red_flag_level).toBeGreaterThanOrEqual(8);
        expect(metrics.red_flag_level).toBeLessThanOrEqual(88);
        expect(Number.isInteger(metrics.compatibility_score)).toBe(true);
        expect(Number.isInteger(metrics.red_flag_level)).toBe(true);
        expect(typeof metrics.vibe_tag).toBe('string');
        expect(metrics.vibe_tag!.length).toBeGreaterThan(5);
        expect(metrics.entertainment_note).toBe('Chỉ để giải trí');

        // Validate strictly through Zod
        expect(ReadingMetricsSchema.safeParse(metrics).success).toBe(true);
      }
    });

    it('3.2 triggers correct status-specific vibeTag rules', () => {
      const neutralCardsWithModerateRedFlag: [DrawnCardWithMeta, DrawnCardWithMeta, DrawnCardWithMeta] = [
        { ...dummyCards[0], id: 4, reversed: false }, // +5 compat, +2 redFlag -> 73, 28
        { ...dummyCards[1], id: 7, reversed: true },  // +1 compat, +7 redFlag -> 74, 35
        { ...dummyCards[2], id: 9, reversed: true },  // +1 compat, +7 redFlag -> 75, 42
      ];

      // crush
      const crushMetrics = computeCoupleEntertainmentMetrics(neutralCardsWithModerateRedFlag, 'crush');
      expect(crushMetrics.vibe_tag).toBe('Tín Hiệu Bật Đèn Xanh • Đợi Người Chủ Động');

      // ex
      const exMetrics = computeCoupleEntertainmentMetrics(neutralCardsWithModerateRedFlag, 'ex');
      expect(exMetrics.vibe_tag).toBe('Duyên Cũ Còn Vương • Bài Học Trưởng Thành');

      // dating (default tag when not extreme)
      const datingMetrics = computeCoupleEntertainmentMetrics(neutralCardsWithModerateRedFlag, 'dating');
      expect(datingMetrics.vibe_tag).toBe('Tần Số Giao Thoa • Cần Mở Lòng Đối Thoại');

      // High red flag override takes precedence over status
      const severeMetrics = computeCoupleEntertainmentMetrics(challengingCards, 'crush');
      expect(severeMetrics.red_flag_level).toBeGreaterThanOrEqual(60);
      expect(severeMetrics.vibe_tag).toBe('Chemistry Cuốn Hút • Cảnh Báo Cờ Đỏ Mập Mờ');
    });

    it('3.3 exhaustive mathematical boundary stress: testing 1000 randomized card permutations', () => {
      for (let i = 0; i < 1000; i++) {
        const c1Id = Math.floor(Math.random() * 78);
        const c2Id = Math.floor(Math.random() * 78);
        const c3Id = Math.floor(Math.random() * 78);
        const sampleCards: [DrawnCardWithMeta, DrawnCardWithMeta, DrawnCardWithMeta] = [
          { ...dummyCards[0], id: c1Id, reversed: Math.random() > 0.5 },
          { ...dummyCards[1], id: c2Id, reversed: Math.random() > 0.5 },
          { ...dummyCards[2], id: c3Id, reversed: Math.random() > 0.5 },
        ];

        const randomStatus = variedStatuses[i % variedStatuses.length];
        const res = computeCoupleEntertainmentMetrics(sampleCards, randomStatus as CoupleRelationshipStatus);

        expect(res.compatibility_score).toBeGreaterThanOrEqual(42);
        expect(res.compatibility_score).toBeLessThanOrEqual(98);
        expect(res.red_flag_level).toBeGreaterThanOrEqual(8);
        expect(res.red_flag_level).toBeLessThanOrEqual(88);
        expect(res.entertainment_note).toBe('Chỉ để giải trí');
      }
    });

    it('3.4 generateCoupleTarotReading handles all varied statuses smoothly without throwing', async () => {
      for (const status of variedStatuses) {
        const res = await generateCoupleTarotReading({
          ownerNickname: 'Hoàng',
          partnerNickname: 'Mai',
          relationshipStatus: status as CoupleRelationshipStatus,
          drawnCards: [
            { id: 0, reversed: false },
            { id: 6, reversed: false },
            { id: 17, reversed: false },
          ],
        });

        expect(res.reading).toBeDefined();
        expect(res.reading.metrics).toBeDefined();
        expect(res.reading.metrics?.entertainment_note).toBe('Chỉ để giải trí');
        expect(res.reading.metrics?.compatibility_score).toBeGreaterThanOrEqual(42);
        expect(res.reading.metrics?.red_flag_level).toBeGreaterThanOrEqual(8);
        expect(ReadingOutputSchema.safeParse(res.reading).success).toBe(true);
        expect(typeof res.usedFallback).toBe('boolean');
      }
    });
  });

  describe('4. Strict Verification: usedFallback Flag is Strictly Boolean & entertainment_note is Exact', () => {
    it('4.1 verifies usedFallback is strictly boolean across offline, live success, and failure paths', async () => {
      // Offline fallback path
      const offlineCouple = await generateCoupleTarotReading({
        ownerNickname: 'Minh',
        partnerNickname: 'Linh',
        drawnCards: [{ id: 1 }, { id: 2 }, { id: 3 }],
      });
      expect(typeof offlineCouple.usedFallback).toBe('boolean');
      expect(offlineCouple.usedFallback).toBe(true);

      const offlineClarifier = await generateClarifierReading({
        card: { id: 19, name_vi: 'Mặt Trời', name_en: 'The Sun', reversed: false },
        questionAsked: 'Liệu dự định có thành công?',
      });
      expect(typeof offlineClarifier.usedFallback).toBe('boolean');
      expect(offlineClarifier.usedFallback).toBe(true);

      // Live success path for generateCoupleTarotReading
      process.env.GEMINI_API_KEY = 'AIzaSyMockKeyForCoupleLive12345';
      const mockLiveReadingOutput = {
        greeting_hook: 'Chào hai bạn, trải bài bắt đầu với nguồn năng lượng rực rỡ.',
        cards_analysis: [
          {
            position_index: 0,
            position_label: 'Lá 1',
            card_id: 0,
            card_name_vi: 'Kẻ Khờ',
            card_name_en: 'The Fool',
            reversed: false,
            interpretation: 'Năng lượng mở đầu đầy hứa hẹn và tự do cho bạn.',
            energy_keyword: 'Khởi đầu',
          },
          {
            position_index: 1,
            position_label: 'Lá 2',
            card_id: 1,
            card_name_vi: 'Nhà Ảo Thuật',
            card_name_en: 'The Magician',
            reversed: false,
            interpretation: 'Đối phương có sự chủ động và khả năng thu hút.',
            energy_keyword: 'Hành động',
          },
          {
            position_index: 2,
            position_label: 'Lá 3',
            card_id: 2,
            card_name_vi: 'Nữ Tư Tế',
            card_name_en: 'High Priestess',
            reversed: false,
            interpretation: 'Sợi dây kết nối đòi hỏi sự thấu hiểu từ trực giác.',
            energy_keyword: 'Trực giác',
          },
        ],
        overall_verdict: 'Tổng quan hai bạn có sự kết nối tâm linh và cảm xúc sâu sắc vượt trội.',
        actionable_next_step: 'Hãy dành thời gian gặp gỡ trực tiếp để chia sẻ chân thành hơn.',
        shareable_card: {
          headline_badge: 'Tần Số Hòa Hợp',
          savage_quote: 'Đừng ngần ngại bày tỏ những điều sâu kín.',
          savage_quotes: [
            'Đừng ngần ngại bày tỏ những điều sâu kín.',
            'Sự chân thành luôn là chiếc cầu nối bền vững nhất.',
            'Lắng nghe trực giác của bạn trong từng khoảnh khắc.',
          ],
          sub_advice: 'Chủ động gửi một lời chào ấm áp hôm nay.',
          lucky_item: 'Vòng tay đá thạch anh tím',
        },
        safety_flag: 'none',
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockLiveReadingOutput),
        usageMetadata: { promptTokenCount: 300, candidatesTokenCount: 150 },
      });

      const savedVitest = process.env.VITEST;
      delete process.env.VITEST;

      try {
        const liveCouple = await generateCoupleTarotReading({
          ownerNickname: 'An',
          partnerNickname: 'Bình',
          drawnCards: [{ id: 0 }, { id: 1 }, { id: 2 }],
        });

        expect(typeof liveCouple.usedFallback).toBe('boolean');
        expect(liveCouple.usedFallback).toBe(false);
        expect(liveCouple.aiModel).toBe('gemini-3.5-flash-lite');
        expect(liveCouple.reading.metrics?.entertainment_note).toBe('Chỉ để giải trí');
        expect(liveCouple.reading.metrics?.compatibility_score).toBeGreaterThanOrEqual(42);
      } finally {
        process.env.VITEST = savedVitest;
      }
    });

    it('4.2 verifies round-robin key rotation advances on consecutive calls', async () => {
      process.env.GEMINI_API_KEY = 'AIzaSyMockKeyRoundRobin_A_1234';
      process.env.GEMINI_API_KEY_2 = 'AIzaSyMockKeyRoundRobin_B_1234';

      const usedKeys: string[] = [];

      mockGenerateContent.mockImplementation(async (apiKey: string, opts: any) => {
        usedKeys.push(apiKey);
        return {
          text: JSON.stringify({
            interpretation: 'Luận giải làm rõ với độ dài hợp lệ hơn hai mươi ký tự.',
            advice: 'Lời khuyên hành động thiết thực mười ký tự.',
            savageQuote: 'Quote ngắn gọn dưới 20 từ.',
          }),
          usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 50 },
        };
      });

      const savedVitest = process.env.VITEST;
      delete process.env.VITEST;

      try {
        await generateClarifierReading({
          card: { id: 0, name_vi: 'Kẻ Khờ', name_en: 'The Fool' },
          questionAsked: 'Câu hỏi 1?',
        });
        await generateClarifierReading({
          card: { id: 1, name_vi: 'Nhà Ảo Thuật', name_en: 'The Magician' },
          questionAsked: 'Câu hỏi 2?',
        });

        expect(usedKeys.length).toBe(2);
        // Consecutive calls should alternate between Key A and Key B
        expect(usedKeys[0]).not.toEqual(usedKeys[1]);
        expect(['AIzaSyMockKeyRoundRobin_A_1234', 'AIzaSyMockKeyRoundRobin_B_1234']).toContain(usedKeys[0]);
        expect(['AIzaSyMockKeyRoundRobin_A_1234', 'AIzaSyMockKeyRoundRobin_B_1234']).toContain(usedKeys[1]);
      } finally {
        process.env.VITEST = savedVitest;
      }
    });

    it('4.3 verifies live Couple Mode gracefully falls back when LLM returns malformed non-JSON', async () => {
      process.env.GEMINI_API_KEY = 'AIzaSyMockKeyMalformed_123456';

      mockGenerateContent.mockResolvedValue({
        text: 'This is not valid JSON string at all',
        usageMetadata: { promptTokenCount: 50, candidatesTokenCount: 20 },
      });

      const savedVitest = process.env.VITEST;
      delete process.env.VITEST;

      try {
        const res = await generateCoupleTarotReading({
          ownerNickname: 'Quân',
          partnerNickname: 'Trang',
          drawnCards: [{ id: 0 }, { id: 1 }, { id: 2 }],
        });

        expect(res.usedFallback).toBe(true);
        expect(typeof res.usedFallback).toBe('boolean');
        expect(res.aiModel).toBe('couple-compatibility-engine-v2');
        expect(res.reading.metrics?.entertainment_note).toBe('Chỉ để giải trí');
        expect(res.reading.metrics?.compatibility_score).toBeGreaterThanOrEqual(42);
      } finally {
        process.env.VITEST = savedVitest;
      }
    });

    it('4.4 verifies entertainment_note is strictly exact string "Chỉ để giải trí"', () => {
      const metrics = computeCoupleEntertainmentMetrics(dummyCards, 'dating');
      expect(metrics.entertainment_note).toBe('Chỉ để giải trí');
      expect(metrics.entertainment_note).not.toBe('chỉ để giải trí');
      expect(metrics.entertainment_note).not.toBe('For entertainment only');
      expect(metrics.entertainment_note.length).toBe('Chỉ để giải trí'.length);

      // Verify ReadingMetricsSchema default enforces this exact string
      const parsedDefault = ReadingMetricsSchema.parse({});
      expect(parsedDefault.entertainment_note).toBe('Chỉ để giải trí');
    });
  });
});
