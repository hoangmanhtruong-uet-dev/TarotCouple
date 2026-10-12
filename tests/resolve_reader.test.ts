import { describe, it, expect } from 'vitest';
import { resolveReader, READERS, CANONICAL_READERS, ALL_READERS } from '../src/data/tarot-cards';

describe('resolveReader(readerId, birthYear) - Single Source of Truth', () => {
  it('correctly resolves canonical readers for adult users (18+)', () => {
    // User born in 2004 -> 22 years old in 2026
    const bn = resolveReader('ba_ngoai', 2004);
    expect(bn.name).toBe('Bà Ngoại');
    expect(bn.accent_color).toBe('#EAB308');
    expect(bn.isStudentVariant).toBe(false);
    expect(bn.age).toBe(22);

    const cd = resolveReader('chi_dai', 2004);
    expect(cd.name).toBe('Chị Đại');
    expect(cd.accent_color).toBe('#E11D48');
    expect(cd.isStudentVariant).toBe(false);

    const bt = resolveReader('ban_than', 2004);
    expect(bt.name).toBe('Bạn Thân');
    expect(bt.accent_color).toBe('#EC4899');
    expect(bt.isStudentVariant).toBe(false);

    const cm = resolveReader('thay_cu_meo', 2004);
    expect(cm.name).toBe('Thầy Cú Mèo');
    expect(cm.accent_color).toBe('#3B82F6');
    expect(cm.isStudentVariant).toBe(false);
  });

  it('automatically resolves Student Variant for users under 16 years old', () => {
    // User born in 2012 -> 14 years old in 2026 (< 16)
    const kidBn = resolveReader('ba_ngoai', 2012);
    expect(kidBn.isStudentVariant).toBe(true);
    expect(kidBn.name).toBe('Bà Ngoại Vui Tính');
    expect(kidBn.age).toBe(14);
    expect(kidBn.effectiveVoice).toContain('Bản học sinh');

    const kidCd = resolveReader('chi_dai', 2012);
    expect(kidCd.isStudentVariant).toBe(true);
    expect(kidCd.name).toBe('Chị Cả Tỉnh Táo');

    const kidBt = resolveReader('ban_than', 2012);
    expect(kidBt.isStudentVariant).toBe(true);
    expect(kidBt.name).toBe('Bạn Cùng Bàn');
  });

  it('gracefully handles legacy reader aliases', () => {
    // Legacy alias ba_co_mo_hon -> maps cleanly to legacy or canonical
    const resolvedLegacy = resolveReader('ba_co_mo_hon', 2000);
    expect(resolvedLegacy).toBeDefined();
    expect(resolvedLegacy.accent_color).toBeDefined();

    const resolvedHealer = resolveReader('tien_tu_chua_lanh', 2000);
    expect(resolvedHealer).toBeDefined();

    // Default fallback when unknown ID is passed
    const fallback = resolveReader('unknown_reader_xyz', 2004);
    expect(fallback).toBeDefined();
    expect(fallback.name).toBe('Bà Ngoại');
  });

  it('guarantees 4 canonical readers and all available readers in registry', () => {
    expect(CANONICAL_READERS).toHaveLength(4);
    expect(READERS).toHaveLength(4);
    expect(ALL_READERS.length).toBeGreaterThanOrEqual(8);
  });
});
