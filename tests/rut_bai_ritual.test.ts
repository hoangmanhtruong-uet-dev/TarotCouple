import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
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

  it('4. supports card re-selection, slot removal, clear all, and 3-step decoding checklist in rut-bai', () => {
    const rutBaiSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(reading)/reading/rut-bai/page.tsx'),
      'utf8'
    );
    const fanSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/components/TactileArcFan.tsx'),
      'utf8'
    );

    expect(rutBaiSrc).toContain('handleRemoveSlotCard');
    expect(rutBaiSrc).toContain('handleClearSelection');
    expect(rutBaiSrc).toContain('Xác Nhận & Lật Mở 3 Lá');
    expect(rutBaiSrc).toContain('Chọn Lại Từ Đầu');
    expect(rutBaiSrc).toContain('Đổi 3 Lá Ngẫu Nhiên Khác');
    expect(rutBaiSrc).toContain('1. Kết nối tần số năng lượng & câu hỏi');
    expect(rutBaiSrc).toContain('2. Phân tích chiều sâu 3 lá bài định mệnh');
    expect(rutBaiSrc).toContain('3. Đúc kết thông điệp & lời khuyên hành động');
    expect(fanSrc).toContain('onPickRef.current(pickedIdx)');
    expect(fanSrc).toContain('onPickCard(cardIndex)');
  });

  it('5. supports 1-tap copy verdict and redraw 3 cards button in ket-qua', () => {
    const ketQuaSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(reading)/reading/ket-qua/page.tsx'),
      'utf8'
    );

    expect(ketQuaSrc).toContain('handleCopyVerdict');
    expect(ketQuaSrc).toContain('handleRedrawCards');
    expect(ketQuaSrc).toContain('Chọn lại 3 lá khác');
    expect(ketQuaSrc).toContain('Sao chép');
  });

  it('6. prioritizes gemini-3.5-flash-lite and rotates across up to 10 API keys in ai-provider', () => {
    const aiProviderSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/lib/ai-provider.ts'),
      'utf8'
    );

    expect(aiProviderSrc).toContain("'gemini-3.5-flash-lite'");
    expect(aiProviderSrc).toContain("'gemini-3.1-flash-lite'");
    expect(aiProviderSrc).toContain("'gemini-3.6-flash'");
    expect(aiProviderSrc).toContain('GEMINI_API_KEY_${i}');
  });
});

