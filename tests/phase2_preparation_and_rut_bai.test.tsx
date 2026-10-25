// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import { useReadingStore } from '../src/lib/reading-store';
import { READERS } from '../src/data/tarot-cards';

describe('Phase 2: Preparation Flow & Rut-Bai Ritual Specification Suite', () => {
  beforeEach(() => {
    useReadingStore.getState().resetReadingFlow();
    useReadingStore.setState({
      selectedReaderId: 'ba_co_mo_hon',
      readerAccentColor: '#E5624A',
      hasFilledProfile: true,
      nickname: 'Minh',
      birthYear: 2002,
      selectedTopic: 'love',
      deckMode: 'major_22',
      questionText: '',
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('1. verifies all 8 readers have specialized decoding quotes in rut-bai', () => {
    const rutBaiSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(reading)/reading/rut-bai/page.tsx'),
      'utf8'
    );

    const allReaderIds = [
      'ba_ngoai',
      'chi_dai',
      'ban_than',
      'thay_cu_meo',
      'ba_co_mo_hon',
      'tien_tu_chua_lanh',
      'tong_tai_ly_tri',
      'phap_su_toi_co',
    ];

    allReaderIds.forEach((id) => {
      expect(rutBaiSrc).toContain(`${id}: [`);
    });

    expect(rutBaiSrc).toContain('Bà Cố đang soi căn duyên');
    expect(rutBaiSrc).toContain('Ánh sáng chữa lành đang chiếu rọi');
    expect(rutBaiSrc).toContain('Báo cáo chiến lược định mệnh đã sẵn sàng');
    expect(rutBaiSrc).toContain('Lời sấm truyền ngàn năm đã được khai mở');
  });

  it('2. verifies Fast-Track quick draw and direct reveal in rut-bai', () => {
    const rutBaiSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(reading)/reading/rut-bai/page.tsx'),
      'utf8'
    );

    expect(rutBaiSrc).toContain('handleQuickDrawAndReveal');
    expect(rutBaiSrc).toContain('Vũ Trụ Chọn Hộ');
    expect(rutBaiSrc).toContain('startRevealSequence(tuple)');
  });

  it('3. verifies strictly 0 occurrences of banned color #D9B36A in rut-bai and chu-de', () => {
    const rutBaiSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(reading)/reading/rut-bai/page.tsx'),
      'utf8'
    );
    const chuDeSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(reading)/reading/chu-de/page.tsx'),
      'utf8'
    );
    const veBanSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(reading)/reading/ve-ban/page.tsx'),
      'utf8'
    );

    expect(rutBaiSrc).not.toContain('D9B36A');
    expect(chuDeSrc).not.toContain('D9B36A');
    expect(veBanSrc).not.toContain('D9B36A');
    expect(veBanSrc).not.toContain('217,179,106');
  });

  it('4. verifies unified 3-step sub-stepper in chu-de page contains required 3D and GSAP hooks', () => {
    const chuDeSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(reading)/reading/chu-de/page.tsx'),
      'utf8'
    );

    // Sub-stepper labels
    expect(chuDeSrc).toContain('Bước 2.1: Chọn Chủ Đề');
    expect(chuDeSrc).toContain('Bước 2.2: Gửi Gắm Nỗi Niềm');
    expect(chuDeSrc).toContain('Bước 2.3: Chọn Bộ Bài');

    // Visual & 3D tokens
    expect(chuDeSrc).toContain('ASTRAL_VORTEX_VERTEX_SHADER');
    expect(chuDeSrc).toContain('ASTRAL_VORTEX_FRAGMENT_SHADER');
    expect(chuDeSrc).toContain('InstancedMesh');
    expect(chuDeSrc).toContain('foilGlareRefsMap');
    expect(chuDeSrc).toContain('READER_TOPIC_PREVIEW');
    expect(chuDeSrc).toContain('data-topic-card');
  });

  it('5. verifies reading store state transitions across topic, question, and deck mode', () => {
    const store = useReadingStore.getState();

    // 1. Select topic
    store.setContextForm({ selectedTopic: 'finance' });
    expect(useReadingStore.getState().selectedTopic).toBe('finance');

    // 2. Set question
    store.setContextForm({ questionText: 'Dòng tiền tháng này thế nào?' });
    expect(useReadingStore.getState().questionText).toBe('Dòng tiền tháng này thế nào?');

    // 3. Switch deck mode
    store.setContextForm({ deckMode: 'full_78' });
    expect(useReadingStore.getState().deckMode).toBe('full_78');
  });
});
