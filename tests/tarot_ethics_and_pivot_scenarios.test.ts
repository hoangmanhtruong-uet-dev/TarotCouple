import { describe, it, expect } from 'vitest';
import {
  ReadingOutputSchema,
  PivotScenariosSchema,
  type TopicId,
} from '@/lib/schemas';
import {
  buildContextualPivotScenarios,
  buildContextualFallbackReading,
} from '@/lib/ai-provider';
import { buildSystemPrompt } from '@/lib/prompts';
import { ALL_TAROT_CARDS } from '@/data/tarot-cards';

describe('Tarot Ethics & Pivot Scenarios (Sự Thật Thấu Cảm & Lối Thoát) Verification Suite', () => {
  const card1 = { ...ALL_TAROT_CARDS[0]!, reversed: false, position_label: 'Vị trí 1' };
  const card2 = { ...ALL_TAROT_CARDS[1]!, reversed: true, position_label: 'Vị trí 2' };
  const card3 = { ...ALL_TAROT_CARDS[2]!, reversed: false, position_label: 'Vị trí 3' };

  describe('1. PivotScenariosSchema & ReadingOutputSchema Integrity', () => {
    it('validates a correct PivotScenarios object', () => {
      const validScenarios = {
        scenario_release: 'Nếu chọn buông bỏ: Bạn giải phóng năng lượng trì trệ và lấy lại 100% tự tôn.',
        scenario_persist: 'Nếu chọn tiếp tục: Phải thiết lập ranh giới rõ ràng trong 48h tới.',
      };
      const parsed = PivotScenariosSchema.safeParse(validScenarios);
      expect(parsed.success).toBe(true);
    });

    it('rejects too short or empty pivot scenarios', () => {
      const invalidScenarios = {
        scenario_release: 'Quá ngắn',
        scenario_persist: '',
      };
      const parsed = PivotScenariosSchema.safeParse(invalidScenarios);
      expect(parsed.success).toBe(false);
    });
  });

  describe('2. buildContextualPivotScenarios across all topics', () => {
    const topics: TopicId[] = [
      'love',
      'career',
      'finance',
      'self_healing',
      'family',
      'crush_school',
      'study',
      'daily_luck',
    ];

    topics.forEach((topic) => {
      it(`generates actionable release and persist scenarios for topic "${topic}"`, () => {
        const scenarios = buildContextualPivotScenarios(
          topic,
          card1,
          card2,
          card3,
          'ba_co_mo_hon'
        );

        expect(scenarios).toBeDefined();
        expect(scenarios.scenario_release.length).toBeGreaterThanOrEqual(15);
        expect(scenarios.scenario_persist.length).toBeGreaterThanOrEqual(15);
        expect(scenarios.scenario_release).toMatch(/buông|dừng lại|cắt lỗ|hạ bớt/);
        expect(scenarios.scenario_persist).toMatch(/tiếp tục|kiên trì|đối diện|chủ động/);
      });
    });
  });

  describe('3. buildContextualFallbackReading returns populated pivot_scenarios', () => {
    it('automatically generates pivot_scenarios in fallback reading', () => {
      const reading = buildContextualFallbackReading({
        nickname: 'Minh',
        birthYear: 2000,
        readerId: 'ba_co_mo_hon',
        topic: 'love',
        questionText: 'Người ấy im lặng thì mình nên làm gì?',
        drawnCards: [card1, card2, card3],
      });

      expect(reading.pivot_scenarios).toBeDefined();
      expect(reading.pivot_scenarios?.scenario_release).toBeDefined();
      expect(reading.pivot_scenarios?.scenario_persist).toBeDefined();
      expect(reading.greeting_hook.length).toBeGreaterThan(10);
      expect(reading.overall_verdict.length).toBeGreaterThan(20);
      expect(reading.actionable_next_step.length).toBeGreaterThan(10);
    });
  });

  describe('4. Professional Tarot Ethics & System Prompt Verification', () => {
    it('enforces third-party ethics, health/death prohibition, and 3-step structured format in prompt', () => {
      const systemPrompt = buildSystemPrompt('ba_co_mo_hon', 'adult_18_plus');

      // Professional Tarot Ethics
      expect(systemPrompt).toContain('RANH GIỚI ĐẠO ĐỨC & QUY TẮC NGHỀ NGHIỆP TAROT');
      expect(systemPrompt).toContain('Third-party ethics');
      expect(systemPrompt).toContain('ngoại tình');
      expect(systemPrompt).toContain('bệnh nan y');
      expect(systemPrompt).toContain('CHỐNG PHỤ THUỘC TÂM LINH');

      // Anti-fluff 3-step structured form & Fork scenarios
      expect(systemPrompt).toContain('QUY TẮC FORM TRẢ LỜI 3 PHẦN DỨT KHOÁT');
      expect(systemPrompt).toContain('⚡ BẮT BỆNH TRỰC DIỆN (THE HARD TRUTH)');
      expect(systemPrompt).toContain('🃏 GIẢI MÃ 3 LÁ GÃY GỌN (CARD INSIGHTS)');
      expect(systemPrompt).toContain('🎯 CHỐT HẠ & KỊCH BẢN XOAY CHUYỂN');
      expect(systemPrompt).toContain('scenario_release');
      expect(systemPrompt).toContain('scenario_persist');
    });
  });
});
