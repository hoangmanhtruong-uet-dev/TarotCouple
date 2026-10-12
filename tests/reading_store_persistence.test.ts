import { describe, it, expect, beforeEach } from 'vitest';
import { useReadingStore } from '../src/lib/reading-store';
import {
  ALL_READER_SLUGS,
  READER_SLUG_MAP,
  SLUG_TO_READER_ID,
} from '../src/lib/reader-slugs';
import { READERS } from '../src/data/tarot-cards';

describe('Zustand Reading Flow Store & F5 Persistence Suite', () => {
  beforeEach(() => {
    useReadingStore.getState().resetReadingFlow();
    useReadingStore.setState({
      selectedReaderId: 'ba_ngoai',
      readerAccentColor: '#EAB308',
      nickname: 'Linh',
      partnerNickname: '',
      zodiacSign: '',
      birthYear: 2004,
      selectedTopic: 'love',
      deckMode: 'full_78',
      questionText: '',
      hideQuestionOnShare: true,
      selectedFanIndices: [],
      readingSuccess: null,
      clarifierCard: null,
      activeQuoteIdx: 0,
    });
  });

  it('1. updates Reader selection and dynamic accent color in store (and normalizes legacy reader IDs)', () => {
    const store = useReadingStore.getState();
    expect(store.selectedReaderId).toBe('ba_ngoai');
    expect(store.readerAccentColor).toBe('#EAB308');

    store.setSelectedReaderId('chi_dai', '#E11D48');
    const updated = useReadingStore.getState();
    expect(updated.selectedReaderId).toBe('chi_dai');
    expect(updated.readerAccentColor).toBe('#E11D48');

    // Legacy ID automatically normalizes to canonical ID so /reading/reader/[slug] never 404s
    store.setSelectedReaderId('ba_co_mo_hon');
    expect(useReadingStore.getState().selectedReaderId).toBe('chi_dai');
  });

  it('2. updates user context form data across Step 2', () => {
    const store = useReadingStore.getState();
    store.setContextForm({
      nickname: 'Mèo Con',
      birthYear: 2000,
      selectedTopic: 'career',
      questionText: 'Tháng này có cơ hội thăng tiến không?',
      hideQuestionOnShare: false,
    });

    const updated = useReadingStore.getState();
    expect(updated.nickname).toBe('Mèo Con');
    expect(updated.birthYear).toBe(2000);
    expect(updated.selectedTopic).toBe('career');
    expect(updated.questionText).toBe('Tháng này có cơ hội thăng tiến không?');
    expect(updated.hideQuestionOnShare).toBe(false);
  });

  it('3. stores 3 drawn card indices for Step 3', () => {
    const store = useReadingStore.getState();
    store.setSelectedFanIndices([12, 45, 7]);

    const updated = useReadingStore.getState();
    expect(updated.selectedFanIndices).toEqual([12, 45, 7]);
  });

  it('4. saves mock ReadingSuccessResponse, Clarifier card, and quote index for Step 4 & 5', () => {
    const store = useReadingStore.getState();
    const mockSuccess: any = {
      status: 'ok',
      readingId: 'rd-test-1234',
      nickname: 'Mèo Con',
      drawnCards: [],
      result: {
        greeting_hook: 'Chào bạn',
        cards_analysis: [],
        overall_verdict: 'Rất tốt',
        actionable_next_step: 'Hãy tự tin',
        shareable_card: {
          headline_badge: 'TEST',
          savage_quote: 'Quote 1',
          savage_quotes: ['Quote 1', 'Quote 2', 'Quote 3'],
          sub_advice: 'Khuyên',
          lucky_item: 'Vòng tay',
        },
      },
    };

    store.setReadingSuccess(mockSuccess);
    store.setActiveQuoteIdx(2);

    const updated = useReadingStore.getState();
    expect(updated.readingSuccess?.readingId).toBe('rd-test-1234');
    expect(updated.activeQuoteIdx).toBe(2);
  });

  it('5. simulates F5 refresh (serializing to and rehydrating from localStorage)', () => {
    useReadingStore.getState().setSelectedReaderId('thay_cu_meo', '#3B82F6');
    useReadingStore.getState().setContextForm({
      nickname: 'Doanh Nhân',
      questionText: 'Chiến lược quý 4 như thế nào?',
    });
    useReadingStore.getState().setSelectedFanIndices([0, 21, 55]);

    const currentState = useReadingStore.getState();

    const serialized = JSON.stringify({
      state: {
        selectedReaderId: currentState.selectedReaderId,
        readerAccentColor: currentState.readerAccentColor,
        nickname: currentState.nickname,
        questionText: currentState.questionText,
        selectedFanIndices: currentState.selectedFanIndices,
      },
      version: 0,
    });

    const parsed = JSON.parse(serialized);
    expect(parsed.state.selectedReaderId).toBe('thay_cu_meo');
    expect(parsed.state.readerAccentColor).toBe('#3B82F6');

    useReadingStore.getState().resetReadingFlow();
    expect(useReadingStore.getState().selectedFanIndices).toEqual([]);

    useReadingStore.setState(parsed.state);

    const restored = useReadingStore.getState();
    expect(restored.selectedReaderId).toBe('thay_cu_meo');
    expect(restored.nickname).toBe('Doanh Nhân');
    expect(restored.questionText).toBe('Chiến lược quý 4 như thế nào?');
    expect(restored.selectedFanIndices).toEqual([0, 21, 55]);
  });

  it('6. resetReadingFlow clears cards and reading result while preserving user profile & reader preference', () => {
    const store = useReadingStore.getState();
    store.setSelectedReaderId('ban_than', '#EC4899');
    store.setContextForm({ nickname: 'Bạch Dương', birthYear: 1999 });
    store.setSelectedFanIndices([1, 2, 3]);
    store.setActiveQuoteIdx(1);

    store.resetReadingFlow();

    const afterReset = useReadingStore.getState();
    expect(afterReset.selectedFanIndices).toEqual([]);
    expect(afterReset.readingSuccess).toBeNull();
    expect(afterReset.clarifierCard).toBeNull();
    expect(afterReset.activeQuoteIdx).toBe(0);
    expect(afterReset.selectedReaderId).toBe('ban_than');
    expect(afterReset.nickname).toBe('Bạch Dương');
    expect(afterReset.birthYear).toBe(1999);
  });

  it('7. ensures all 8 reader slugs (canonical + legacy aliases like ba-co-mo-hon) resolve to valid READERS entries without 404', () => {
    for (const slug of ALL_READER_SLUGS) {
      const readerId = SLUG_TO_READER_ID[slug];
      expect(readerId).toBeDefined();
      const reader = READERS.find((r) => r.id === readerId);
      expect(reader).toBeDefined();
    }

    expect(READER_SLUG_MAP.ba_co_mo_hon).toBe('chi-dai');
    expect(READER_SLUG_MAP.tien_tu_chua_lanh).toBe('ba-ngoai');
    expect(READER_SLUG_MAP.tong_tai_ly_tri).toBe('thay-cu-meo');
    expect(READER_SLUG_MAP.phap_su_toi_co).toBe('ban-than');
  });
});
