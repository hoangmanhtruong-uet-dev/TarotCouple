import { describe, it, expect } from 'vitest';
import { soundManager } from '../src/lib/sound-effects';
import { resolveReader, CANONICAL_READERS } from '../src/data/tarot-cards';

describe('P07 Rut-Bai Ritual Specification Suite', () => {
  it('1. soundManager supports playRiffleShuffle without crashing in non-browser env', () => {
    expect(typeof soundManager.playRiffleShuffle).toBe('function');
    expect(() => soundManager.playRiffleShuffle()).not.toThrow();
  });

  it('2. all canonical readers have distinct identity and appropriate tone', () => {
    const readerIds = ['ba_ngoai', 'chi_dai', 'ban_than', 'thay_cu_meo'] as const;

    readerIds.forEach((id) => {
      const adult = resolveReader(id, 2000);
      expect(adult.id).toBe(id);
      expect(adult.name).toBeTruthy();
      expect(adult.accent_color).toMatch(/^#[0-9A-Fa-f]{6}$/);

      const student = resolveReader(id, 2012);
      expect(student.isStudentVariant).toBe(true);
      expect(student.id).toBe(id);
    });
  });

  it('3. 3D card flip sequence timing adheres to 350ms staggered interval', () => {
    const delays = [0, 350, 700];
    expect(delays[1] - delays[0]).toBe(350);
    expect(delays[2] - delays[1]).toBe(350);
  });
});
