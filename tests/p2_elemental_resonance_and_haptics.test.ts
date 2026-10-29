import { describe, it, expect, vi } from 'vitest';
import {
  resolveElementFromCard,
  computeCoupleElementalResonance,
  generateCoupleInterpretationBundle,
} from '../src/lib/couple-interpretation';
import { triggerHaptic } from '../src/lib/haptics';

describe('P2 Verification Suite — 4-Element Resonance Engine & Haptic Integration', () => {
  describe('1. resolveElementFromCard mapping accuracy', () => {
    it('accurately maps Minor Arcana suits to 4 Elements', () => {
      // Wands (Fire)
      expect(resolveElementFromCard(22, 'Ace of Wands').element).toBe('fire');
      expect(resolveElementFromCard(30, 'Nine of Wands').element).toBe('fire');

      // Cups (Water)
      expect(resolveElementFromCard(36, 'Ace of Cups').element).toBe('water');
      expect(resolveElementFromCard(45, 'Ten of Cups').element).toBe('water');

      // Swords (Air)
      expect(resolveElementFromCard(50, 'Ace of Swords').element).toBe('air');
      expect(resolveElementFromCard(55, 'Six of Swords').element).toBe('air');

      // Pentacles (Earth)
      expect(resolveElementFromCard(64, 'Ace of Pentacles').element).toBe('earth');
      expect(resolveElementFromCard(73, 'Ten of Pentacles').element).toBe('earth');
    });

    it('accurately maps Major Arcana to canonical astrological elements', () => {
      expect(resolveElementFromCard(4, 'The Emperor').element).toBe('fire');
      expect(resolveElementFromCard(19, 'The Sun').element).toBe('fire');

      expect(resolveElementFromCard(2, 'The High Priestess').element).toBe('water');
      expect(resolveElementFromCard(18, 'The Moon').element).toBe('water');

      expect(resolveElementFromCard(0, 'The Fool').element).toBe('air');
      expect(resolveElementFromCard(6, 'The Lovers').element).toBe('air');

      expect(resolveElementFromCard(3, 'The Empress').element).toBe('earth');
      expect(resolveElementFromCard(21, 'The World').element).toBe('earth');
    });
  });

  describe('2. computeCoupleElementalResonance chemistry matrix', () => {
    it('identifies Fire + Air as Tuong Sinh (Gió thổi bùng Lửa)', () => {
      const res = computeCoupleElementalResonance(
        22, // Ace of Wands (Fire)
        'Ace of Wands',
        50, // Ace of Swords (Air)
        'Ace of Swords',
        'Minh',
        'Linh'
      );
      expect(res.synergyType).toBe('tuong_sinh');
      expect(res.synergyScore).toBe(96);
      expect(res.synergyTitle).toContain('Lửa & Gió');
    });

    it('identifies Water + Earth as Tuong Sinh (Nước tưới mát Đất)', () => {
      const res = computeCoupleElementalResonance(
        36, // Cups (Water)
        'Ace of Cups',
        64, // Pentacles (Earth)
        'Ace of Pentacles',
        'Huy',
        'Trang'
      );
      expect(res.synergyType).toBe('tuong_sinh');
      expect(res.synergyScore).toBe(98);
      expect(res.synergyTitle).toContain('Đất & Nước');
    });

    it('identifies Identical Elements as Dong Khi', () => {
      const res = computeCoupleElementalResonance(
        22, // Wands (Fire)
        'Ace of Wands',
        30, // Nine of Wands (Fire)
        'Nine of Wands',
        'Bảo',
        'An'
      );
      expect(res.synergyType).toBe('dong_khi');
      expect(res.synergyScore).toBe(92);
      expect(res.synergyTitle).toContain('Song Hành Cùng Hệ');
    });

    it('identifies Complementary Opposite Elements (Fire + Water) as Can Bang Am Duong', () => {
      const res = computeCoupleElementalResonance(
        22, // Wands (Fire)
        'Ace of Wands',
        36, // Cups (Water)
        'Ace of Cups',
        'Nam',
        'Mai'
      );
      expect(res.synergyType).toBe('can_bang_am_duong');
      expect(res.synergyScore).toBe(86);
      expect(res.synergyTitle).toContain('Lửa & Nước');
    });
  });

  describe('3. generateCoupleInterpretationBundle integration', () => {
    it('returns full bundle with loveLanguage, secretAdvice, coupleQuests, and elementalResonance', () => {
      const bundle = generateCoupleInterpretationBundle({
        ownerName: 'Hoàng',
        partnerName: 'Vy',
        c1: { id: 6, reversed: false, name_vi: 'Đôi Tình Nhân' }, // Air
        c2: { id: 19, reversed: false, name_vi: 'Mặt Trời' }, // Fire
        c3: { id: 21, reversed: false, name_vi: 'Thế Giới' },
        relationshipStatus: 'dating',
      });

      expect(bundle.loveLanguage).toBeDefined();
      expect(bundle.secretAdvice).toBeDefined();
      expect(bundle.coupleQuests).toBeDefined();
      expect(bundle.elementalResonance).toBeDefined();
      expect(bundle.elementalResonance?.ownerElement.element).toBe('air');
      expect(bundle.elementalResonance?.partnerElement.element).toBe('fire');
      expect(bundle.elementalResonance?.synergyType).toBe('tuong_sinh');
    });
  });

  describe('4. triggerHaptic safety', () => {
    it('runs safely in Node.js / SSR environment without throwing', () => {
      expect(() => triggerHaptic('light')).not.toThrow();
      expect(() => triggerHaptic('medium')).not.toThrow();
      expect(() => triggerHaptic('heartbeat')).not.toThrow();
      expect(() => triggerHaptic('success')).not.toThrow();
      expect(() => triggerHaptic('warning')).not.toThrow();
    });

    it('invokes navigator.vibrate when present', () => {
      const vibrateMock = vi.fn();
      const originalVibrate = (globalThis as any).navigator?.vibrate;
      const originalWindow = (globalThis as any).window;
      (globalThis as any).window = globalThis;
      Object.defineProperty(globalThis.navigator, 'vibrate', {
        value: vibrateMock,
        configurable: true,
        writable: true,
      });

      try {
        triggerHaptic('heartbeat');
        expect(vibrateMock).toHaveBeenCalledWith([35, 50, 70]);

        triggerHaptic('light');
        expect(vibrateMock).toHaveBeenCalledWith(12);
      } finally {
        (globalThis as any).window = originalWindow;
        if (originalVibrate) {
          Object.defineProperty(globalThis.navigator, 'vibrate', {
            value: originalVibrate,
            configurable: true,
            writable: true,
          });
        } else {
          delete (globalThis.navigator as any).vibrate;
        }
      }
    });
  });
});
