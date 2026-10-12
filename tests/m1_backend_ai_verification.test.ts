import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GEMINI_MODEL_CHAIN,
  getValidGeminiApiKeys,
  hasValidGeminiApiKey,
  generateClarifierReading,
  generateCoupleTarotReading,
} from '@/lib/ai-provider';
import { ReadingOutputSchema, countWords } from '@/lib/schemas';

// Controlled mock generator for @google/genai
let mockGenerateContentFn: ((params: any) => Promise<any>) | null = null;

vi.mock('@google/genai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@google/genai')>();
  class MockGoogleGenAI {
    apiKey?: string;
    models: { generateContent: (params: any) => Promise<any> };

    constructor(opts?: { apiKey?: string }) {
      this.apiKey = opts?.apiKey;
      this.models = {
        generateContent: (params: any) => {
          if (mockGenerateContentFn) {
            return mockGenerateContentFn(params);
          }
          return Promise.reject(new Error('Unmocked live AI call'));
        },
      };
    }
  }

  return {
    ...actual,
    GoogleGenAI: MockGoogleGenAI,
  };
});

describe('Milestone 1 Verification: Backend AI 5-Key Upgrade & Fallback Integrity', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset env to clean state
    process.env = { ...originalEnv };
    mockGenerateContentFn = null;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    mockGenerateContentFn = null;
    vi.restoreAllMocks();
  });

  // =========================================================================
  // SECTION 1: GEMINI_MODEL_CHAIN Integrity
  // =========================================================================
  describe('1. GEMINI_MODEL_CHAIN Array Integrity & Prioritization', () => {
    it('exports a non-empty array with exactly 4 candidate models in correct order', () => {
      expect(Array.isArray(GEMINI_MODEL_CHAIN)).toBe(true);
      expect(GEMINI_MODEL_CHAIN).toHaveLength(4);

      expect(GEMINI_MODEL_CHAIN).toEqual([
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-3.6-flash',
        'gemini-3-flash-preview',
      ]);
    });

    it('ensures all models in the chain are distinct non-empty strings starting with gemini-', () => {
      const unique = new Set(GEMINI_MODEL_CHAIN);
      expect(unique.size).toBe(GEMINI_MODEL_CHAIN.length);

      for (const model of GEMINI_MODEL_CHAIN) {
        expect(typeof model).toBe('string');
        expect(model.length).toBeGreaterThan(0);
        expect(model.startsWith('gemini-')).toBe(true);
      }
    });

    it('verifies primary fallback priority model is gemini-3.5-flash-lite', () => {
      expect(GEMINI_MODEL_CHAIN[0]).toBe('gemini-3.5-flash-lite');
    });
  });

  // =========================================================================
  // SECTION 2: API Key Parsing & Multi-Key Rotation
  // =========================================================================
  describe('2. Multi-Key Extraction & Validation (getValidGeminiApiKeys)', () => {
    it('returns empty array when no keys are present in process.env', () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEYS;
      for (let i = 2; i <= 10; i++) {
        delete process.env[`GEMINI_API_KEY_${i}`];
      }

      const keys = getValidGeminiApiKeys();
      expect(keys).toEqual([]);
      expect(hasValidGeminiApiKey()).toBe(false);
    });

    it('filters out known placeholders and short strings (< 15 chars)', () => {
      process.env.GEMINI_API_KEY = 'your_gemini_api_key_here';
      process.env.GEMINI_API_KEY_2 = 'YOUR_API_KEY';
      process.env.GEMINI_API_KEY_3 = 'placeholder_12345';
      process.env.GEMINI_API_KEY_4 = 'short_key_123'; // 13 chars

      const keys = getValidGeminiApiKeys();
      expect(keys).toEqual([]);
      expect(hasValidGeminiApiKey()).toBe(false);
    });

    it('collects up to 10 keys from individual GEMINI_API_KEY and GEMINI_API_KEY_2..10', () => {
      delete process.env.GEMINI_API_KEYS;
      process.env.GEMINI_API_KEY = 'AIzaSyA_key_number_1_valid';
      for (let i = 2; i <= 5; i++) {
        process.env[`GEMINI_API_KEY_${i}`] = `AIzaSyA_key_number_${i}_valid`;
      }

      const keys = getValidGeminiApiKeys();
      expect(keys).toHaveLength(5);
      expect(keys[0]).toBe('AIzaSyA_key_number_1_valid');
      expect(keys[4]).toBe('AIzaSyA_key_number_5_valid');
      expect(hasValidGeminiApiKey()).toBe(true);
    });

    it('supports comma and newline separated keys in GEMINI_API_KEYS and deduplicates', () => {
      process.env.GEMINI_API_KEY = 'AIzaSyA_key_primary_valid';
      process.env.GEMINI_API_KEYS = 'AIzaSyA_key_primary_valid, AIzaSyB_key_second_valid\nAIzaSyC_key_third_valid';

      const keys = getValidGeminiApiKeys();
      expect(keys).toHaveLength(3);
      expect(keys).toEqual([
        'AIzaSyA_key_primary_valid',
        'AIzaSyB_key_second_valid',
        'AIzaSyC_key_third_valid',
      ]);
    });
  });

  // =========================================================================
  // SECTION 3: Clarifier Reading Offline Determinism (process.env.VITEST = 'true')
  // =========================================================================
  describe('3. Clarifier Reading (generateClarifierReading) Offline / Vitest Fallback', () => {
    it('guarantees persona fallback and usedFallback: true when running in vitest environment', async () => {
      process.env.VITEST = 'true';
      process.env.GEMINI_API_KEY = 'AIzaSyA_dummy_key_should_not_be_called';

      const result = await generateClarifierReading({
        card: { id: 0, name_vi: 'Kẻ Khờ', name_en: 'The Fool', reversed: false },
        reversed: false,
        questionAsked: 'Tôi có nên chuyển hướng sự nghiệp ngay bây giờ không?',
        readerId: 'chi_dai',
        birthYear: 2000,
        starsSpent: 5,
      });

      expect(result.usedFallback).toBe(true);
      expect(result.aiModel).toBe('clarifier-persona-template-v1');
      expect(result.tokensIn).toBe(0);
      expect(result.tokensOut).toBe(0);
      expect(result.retryCount).toBe(0);

      // Root properties
      expect(result.interpretation.length).toBeGreaterThanOrEqual(20);
      expect(result.advice.length).toBeGreaterThanOrEqual(10);
      expect(result.savageQuote.length).toBeGreaterThanOrEqual(5);
      expect(countWords(result.savageQuote)).toBeLessThanOrEqual(22);
      expect(result.starsSpent).toBe(5);
      expect(result.effectivePersona).toBe('chi_dai');
      expect(result.ageTier).toBe('adult_18_plus');

      // Nested clarifier sub-object
      expect(result.clarifier).toBeDefined();
      expect(result.clarifier.interpretation).toBe(result.interpretation);
      expect(result.clarifier.advice).toBe(result.advice);
      expect(result.clarifier.savageQuote).toBe(result.savageQuote);
      expect(result.clarifier.starsSpent).toBe(5);
    });

    it('generates distinct deterministic voices for all supported personas', async () => {
      process.env.VITEST = 'true';

      const testPersonas = [
        { readerId: 'ba_ngoai', expectedKeyword: 'Bà Ngoại' },
        { readerId: 'chi_dai', expectedKeyword: 'Chị' },
        { readerId: 'ban_than', expectedKeyword: 'Bạn thân' },
        { readerId: 'thay_cu_meo', expectedKeyword: 'Thầy Cú Mèo' },
        { readerId: 'ba_co_mo_hon', expectedKeyword: 'Lá Làm Rõ' },
        { readerId: 'tong_tai_ly_tri', expectedKeyword: 'KPI' },
        { readerId: 'phap_su_toi_co', expectedKeyword: 'Mật ngữ' },
      ] as const;

      for (const { readerId, expectedKeyword } of testPersonas) {
        const res = await generateClarifierReading({
          card: { id: 1, name_vi: 'Nhà Ảo Thuật', name_en: 'The Magician' },
          readerId,
          birthYear: 2000,
          questionAsked: 'Tôi nên làm gì trong 24h tới?',
        });

        expect(res.usedFallback).toBe(true);
        expect(res.interpretation.length).toBeGreaterThan(20);
        expect(res.advice.length).toBeGreaterThan(10);
        expect(
          res.interpretation.includes(expectedKeyword) ||
          res.savageQuote.includes(expectedKeyword) ||
          res.advice.includes(expectedKeyword)
        ).toBe(true);
      }
    });

    it('correctly adapts to reversed cards and reflects reversed orientation in template text', async () => {
      process.env.VITEST = 'true';

      const resUpright = await generateClarifierReading({
        card: { id: 10, name_vi: 'Bánh Xe Số Phận', name_en: 'Wheel of Fortune', reversed: false },
        reversed: false,
        readerId: 'ba_ngoai',
      });

      const resReversed = await generateClarifierReading({
        card: { id: 10, name_vi: 'Bánh Xe Số Phận', name_en: 'Wheel of Fortune', reversed: true },
        reversed: true,
        readerId: 'ba_ngoai',
      });

      expect(resUpright.reversed).toBe(false);
      expect(resReversed.reversed).toBe(true);
      expect(resUpright.interpretation).toContain('chiều Xuôi');
      expect(resReversed.interpretation).toContain('chiều Ngược');
    });

    it('handles minimal parameters with safe fallbacks (no question, no nickname, no starsSpent)', async () => {
      process.env.VITEST = 'true';

      const res = await generateClarifierReading({
        card: { id: 19 },
      });

      expect(res.questionAsked).toBe('Bước hành động tiếp theo mình nên ưu tiên là gì?');
      expect(res.starsSpent).toBe(5);
      expect(res.usedFallback).toBe(true);
      expect(res.interpretation.length).toBeGreaterThan(20);
    });
  });

  // =========================================================================
  // SECTION 4: Clarifier Reading Without Keys (Offline Non-Vitest Runtime)
  // =========================================================================
  describe('4. Clarifier Reading with No Keys Configured (Non-Vitest Runtime)', () => {
    it('cleanly falls back to persona template without throwing when process.env.VITEST is empty and no keys exist', async () => {
      delete process.env.VITEST;
      delete process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEYS;
      for (let i = 2; i <= 10; i++) {
        delete process.env[`GEMINI_API_KEY_${i}`];
      }

      const res = await generateClarifierReading({
        card: { id: 17, name_vi: 'Ngôi Sao', name_en: 'The Star' },
        questionAsked: 'Liệu tôi có đạt được mục tiêu không?',
        readerId: 'ban_than',
      });

      expect(res.usedFallback).toBe(true);
      expect(res.aiModel).toBe('clarifier-persona-template-v1');
      expect(res.interpretation.length).toBeGreaterThan(20);
      expect(res.advice.length).toBeGreaterThan(10);
      expect(res.savageQuote.length).toBeGreaterThan(5);
    });
  });

  // =========================================================================
  // SECTION 5: Couple Tarot Reading Offline Determinism (process.env.VITEST = 'true')
  // =========================================================================
  describe('5. Couple Tarot Reading (generateCoupleTarotReading) Offline / Vitest Fallback', () => {
    it('guarantees usedFallback: true and aiModel: couple-compatibility-engine-v2 under vitest', async () => {
      process.env.VITEST = 'true';
      process.env.GEMINI_API_KEY = 'AIzaSyA_dummy_key_should_not_be_called';

      const res = await generateCoupleTarotReading({
        ownerNickname: 'Minh',
        partnerNickname: 'Ngọc',
        birthYear: 2001,
        relationshipStatus: 'dating',
        readerId: 'chi_dai',
        drawnCards: [
          { id: 6, reversed: false },
          { id: 2, reversed: true },
          { id: 21, reversed: false },
        ],
      });

      expect(res.usedFallback).toBe(true);
      expect(res.aiModel).toBe('couple-compatibility-engine-v2');
      expect(res.tokensIn).toBe(0);
      expect(res.tokensOut).toBe(0);
      expect(res.retryCount).toBe(0);

      // Validate schema compliance
      const parsed = ReadingOutputSchema.safeParse(res.reading);
      expect(parsed.success).toBe(true);
      expect(res.result).toEqual(res.reading);

      // Validate metrics presence and entertainment disclaimer
      expect(res.reading.metrics).toBeDefined();
      expect(res.reading.metrics?.compatibility_score).toBeGreaterThanOrEqual(0);
      expect(res.reading.metrics?.compatibility_score).toBeLessThanOrEqual(100);
      expect(res.reading.metrics?.red_flag_level).toBeGreaterThanOrEqual(0);
      expect(res.reading.metrics?.red_flag_level).toBeLessThanOrEqual(100);
      expect(Number.isInteger(res.reading.metrics?.red_flag_level)).toBe(true);
      expect(res.reading.metrics?.vibe_tag.length).toBeGreaterThan(0);
      expect(res.reading.metrics?.entertainment_note).toBe('Chỉ để giải trí');

      // Validate quotes length
      expect(res.reading.shareable_card.savage_quotes).toHaveLength(3);
      for (const quote of res.reading.shareable_card.savage_quotes) {
        expect(countWords(quote)).toBeLessThanOrEqual(22);
      }

      // Validate couple spread card positions
      expect(res.reading.cards_analysis[0].position_label).toContain('Minh');
      expect(res.reading.cards_analysis[1].position_label).toContain('Ngọc');
    });

    it('handles all relationship statuses and minimal card payloads correctly', async () => {
      process.env.VITEST = 'true';

      const statuses = ['crush', 'dating', 'married', 'complicated', 'situationship'] as const;

      for (const status of statuses) {
        const res = await generateCoupleTarotReading({
          relationshipStatus: status,
          drawnCards: [{ id: 0 }, { id: 1 }, { id: 2 }],
        });

        expect(res.usedFallback).toBe(true);
        expect(res.reading.metrics?.compatibility_score).toBeDefined();
        expect(res.reading.metrics?.entertainment_note).toBe('Chỉ để giải trí');
        expect(ReadingOutputSchema.safeParse(res.reading).success).toBe(true);
      }
    });
  });

  // =========================================================================
  // SECTION 6: Couple Tarot Reading Without Keys (Offline Non-Vitest Runtime)
  // =========================================================================
  describe('6. Couple Tarot Reading with No Keys Configured (Non-Vitest Runtime)', () => {
    it('cleanly falls back to contextual fallback reading without throwing when keys are absent', async () => {
      delete process.env.VITEST;
      delete process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEYS;
      for (let i = 2; i <= 10; i++) {
        delete process.env[`GEMINI_API_KEY_${i}`];
      }

      const res = await generateCoupleTarotReading({
        ownerNickname: 'Hoàng',
        partnerNickname: 'Mai',
        drawnCards: [{ id: 10 }, { id: 11 }, { id: 12 }],
      });

      expect(res.usedFallback).toBe(true);
      expect(res.aiModel).toBe('couple-compatibility-engine-v2');
      expect(ReadingOutputSchema.safeParse(res.reading).success).toBe(true);
      expect(res.reading.metrics?.entertainment_note).toBe('Chỉ để giải trí');
    });
  });

  // =========================================================================
  // SECTION 7: Live AI Simulation via Mocks (Adversarial Failover Stress Testing)
  // =========================================================================
  describe('7. Live AI Path Simulation & Chain Failover Verification', () => {
    it('invokes primary model gemini-3.5-flash-lite on clarifier when keys are present and VITEST is unset', async () => {
      delete process.env.VITEST;
      process.env.GEMINI_API_KEY = 'AIzaSyA_live_test_key_valid_12345';

      const calls: any[] = [];
      mockGenerateContentFn = async (params: any) => {
        calls.push(params);
        return {
          text: JSON.stringify({
            interpretation: 'Đây là lời luận giải sâu sắc từ mô hình AI trực tiếp cho câu hỏi của bạn.',
            advice: 'Hãy hành động dứt khoát trong vòng 24 giờ tới và giữ vững lập trường.',
            savageQuote: 'Đừng hỏi người ta muốn gì, hãy hỏi mình xứng đáng với điều gì!',
          }),
          usageMetadata: {
            promptTokenCount: 150,
            candidatesTokenCount: 65,
          },
        };
      };

      const res = await generateClarifierReading({
        card: { id: 1, name_vi: 'Nhà Ảo Thuật', name_en: 'The Magician' },
        questionAsked: 'Tôi có nên mở rộng kinh doanh không?',
      });

      expect(calls.length).toBeGreaterThanOrEqual(1);
      expect(calls[0].model).toBe('gemini-3.5-flash-lite');

      expect(res.usedFallback).toBe(false);
      expect(res.aiModel).toBe('gemini-3.5-flash-lite');
      expect(res.tokensIn).toBe(150);
      expect(res.tokensOut).toBe(65);
      expect(res.interpretation).toContain('lời luận giải sâu sắc từ mô hình AI');
    });

    it('falls over to secondary model gemini-3.1-flash-lite when primary model fails', async () => {
      delete process.env.VITEST;
      process.env.GEMINI_API_KEY = 'AIzaSyA_live_test_key_valid_12345';

      const calls: any[] = [];
      mockGenerateContentFn = async (params: any) => {
        calls.push(params);
        if (params.model === 'gemini-3.5-flash-lite') {
          throw new Error('503 Service Unavailable: High load');
        }
        return {
          text: JSON.stringify({
            interpretation: 'Lời giải đáp phục hồi thành công từ mô hình dự phòng gemini-3.1-flash-lite.',
            advice: 'Tập trung vào giải pháp thay vì lo lắng về sự cố ngoài ý muốn.',
            savageQuote: 'Sóng gió chỉ làm tăng thêm bản lĩnh của người thuyền trưởng!',
          }),
          usageMetadata: {
            promptTokenCount: 140,
            candidatesTokenCount: 55,
          },
        };
      };

      const res = await generateClarifierReading({
        card: { id: 3, name_vi: 'Hoàng Hậu', name_en: 'The Empress' },
        questionAsked: 'Mối quan hệ này có phát triển được không?',
      });

      expect(calls.length).toBe(2);
      expect(calls[0].model).toBe('gemini-3.5-flash-lite');
      expect(calls[1].model).toBe('gemini-3.1-flash-lite');

      expect(res.usedFallback).toBe(false);
      expect(res.aiModel).toBe('gemini-3.1-flash-lite');
      expect(res.interpretation).toContain('gemini-3.1-flash-lite');
    });

    it('cleanly falls back to persona template if all candidate models in chain fail', async () => {
      delete process.env.VITEST;
      process.env.GEMINI_API_KEY = 'AIzaSyA_live_test_key_valid_12345';

      mockGenerateContentFn = async () => {
        throw new Error('429 Resource Exhausted');
      };

      const res = await generateClarifierReading({
        card: { id: 5, name_vi: 'Đại Tư Tế', name_en: 'The Hierophant' },
        questionAsked: 'Tôi nên đưa ra lựa chọn nào?',
        readerId: 'chi_dai',
      });

      // All models failed -> safe fallback
      expect(res.usedFallback).toBe(true);
      expect(res.aiModel).toBe('clarifier-persona-template-v1');
      expect(res.interpretation.length).toBeGreaterThan(20);
    });

    it('attaches entertainment metrics and preserves usedFallback: false when couple live AI succeeds', async () => {
      delete process.env.VITEST;
      process.env.GEMINI_API_KEY = 'AIzaSyA_live_test_key_valid_12345';

      mockGenerateContentFn = async () => ({
        text: JSON.stringify({
          greeting_hook: 'Chào hai bạn, năng lượng tình yêu của hai bạn đang rất bùng nổ!',
          cards_analysis: [
            {
              position_index: 0,
              position_label: 'Năng lượng của An',
              card_id: 1,
              card_name_vi: 'Nhà Ảo Thuật',
              card_name_en: 'The Magician',
              reversed: false,
              interpretation: 'Bạn đang tràn đầy ý tưởng và sự chủ động trong kết nối.',
              energy_keyword: 'Chủ động',
            },
            {
              position_index: 1,
              position_label: 'Năng lượng của Bình',
              card_id: 2,
              card_name_vi: 'Nữ Đại Tư Tế',
              card_name_en: 'The High Priestess',
              reversed: false,
              interpretation: 'Đối phương đang lắng nghe trực giác và có phần kín đáo.',
              energy_keyword: 'Sâu lắng',
            },
            {
              position_index: 2,
              position_label: 'Sợi dây kết nối & Xu hướng',
              card_id: 6,
              card_name_vi: 'Những Kẻ Yêu Nhau',
              card_name_en: 'The Lovers',
              reversed: false,
              interpretation: 'Điểm chạm hài hòa mở ra cơ hội gắn kết sâu sắc.',
              energy_keyword: 'Hòa hợp',
            },
          ],
          overall_verdict: 'Hai bạn có tần số bù trừ rất tốt, chỉ cần một người mở lời rõ ràng là mọi rào cản sẽ tan biến.',
          actionable_next_step: 'Hãy hẹn một buổi cà phê trò chuyện chân thành trong tuần này.',
          shareable_card: {
            headline_badge: 'Tần số đồng điệu',
            savage_quote: 'Độ hợp cạ chạm đỉnh: Đừng để sự ngại ngùng cản bước tình yêu!',
            savage_quotes: [
              'Quote 1: Tần số đã bắt, chỉ chờ người mở lời!',
              'Quote 2: Đối thoại thẳng thắn một lần đi!',
              'Quote 3: Cùng nâng cấp bản thân thay vì mập mờ.',
            ],
            sub_advice: 'Mở lòng chân thành',
            lucky_item: 'Vòng tay đôi',
          },
          safety_flag: 'none',
          disclaimer: 'Thông điệp mang tính chất chiêm nghiệm tích cực.',
        }),
        usageMetadata: {
          promptTokenCount: 220,
          candidatesTokenCount: 110,
        },
      });

      const res = await generateCoupleTarotReading({
        ownerNickname: 'An',
        partnerNickname: 'Bình',
        drawnCards: [{ id: 1 }, { id: 2 }, { id: 6 }],
      });

      expect(res.usedFallback).toBe(false);
      expect(res.aiModel).toBe('gemini-3.5-flash-lite');
      expect(res.tokensIn).toBe(220);
      expect(res.tokensOut).toBe(110);
      expect(res.reading.metrics).toBeDefined();
      expect(res.reading.metrics?.entertainment_note).toBe('Chỉ để giải trí');
      expect(ReadingOutputSchema.safeParse(res.reading).success).toBe(true);
    });

    it('cleanly falls back to couple-compatibility-engine-v2 if live generation throws an unexpected error', async () => {
      delete process.env.VITEST;
      process.env.GEMINI_API_KEY = 'AIzaSyA_live_test_key_valid_12345';

      mockGenerateContentFn = async () => {
        throw new Error('Internal AI Service Error');
      };

      const res = await generateCoupleTarotReading({
        ownerNickname: 'Tuấn',
        partnerNickname: 'Hương',
        drawnCards: [{ id: 10 }, { id: 11 }, { id: 12 }],
      });

      expect(res.usedFallback).toBe(true);
      expect(res.aiModel).toBe('couple-compatibility-engine-v2');
      expect(res.reading.metrics?.entertainment_note).toBe('Chỉ để giải trí');
      expect(ReadingOutputSchema.safeParse(res.reading).success).toBe(true);
    });
  });
});
