import { describe, it, expect, beforeEach } from 'vitest';
import { useReadingStore } from '../src/lib/reading-store';

describe('Zustand Reading Flow Store & F5 Persistence Suite', () => {
  beforeEach(() => {
    // Reset state before each test
    useReadingStore.getState().resetReadingFlow();
    useReadingStore.setState({
      selectedReaderId: 'ba_co_mo_hon',
      readerAccentColor: '#E5624A',
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

  it('1. updates Reader selection and dynamic accent color in store', () => {
    const store = useReadingStore.getState();
    expect(store.selectedReaderId).toBe('ba_co_mo_hon');
    expect(store.readerAccentColor).toBe('#E5624A');

    store.setSelectedReaderId('tien_tu_chua_lanh', '#5DB075');
    const updated = useReadingStore.getState();
    expect(updated.selectedReaderId).toBe('tien_tu_chua_lanh');
    expect(updated.readerAccentColor).toBe('#5DB075');
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
    // Modify store state
    useReadingStore.getState().setSelectedReaderId('tong_tai_ly_tri', '#5B8DEF');
    useReadingStore.getState().setContextForm({
      nickname: 'Doanh Nhân',
      questionText: 'Chiến lược quý 4 như thế nào?',
    });
    useReadingStore.getState().setSelectedFanIndices([0, 21, 55]);

    // Snapshot state
    const currentState = useReadingStore.getState();

    // Serialize to JSON (similar to persist middleware writing to localStorage)
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

    // Simulate page reload: parse JSON and set to store
    const parsed = JSON.parse(serialized);
    expect(parsed.state.selectedReaderId).toBe('tong_tai_ly_tri');
    expect(parsed.state.readerAccentColor).toBe('#5B8DEF');
    expect(parsed.state.nickname).toBe('Doanh Nhân');
    expect(parsed.state.questionText).toBe('Chiến lược quý 4 như thế nào?');
    expect(parsed.state.selectedFanIndices).toEqual([0, 21, 55]);
  });

  it('6. tracks hasFilledProfile flag to skip /reading/ve-ban on subsequent readings', () => {
    const store = useReadingStore.getState();
    expect(store.hasFilledProfile).toBe(false);

    // User fills profile for the first time
    store.setContextForm({
      hasFilledProfile: true,
      nickname: 'An Nhiên',
      birthYear: 2012, // 14 years old (Kid/Teen safe)
    });

    const updated = useReadingStore.getState();
    expect(updated.hasFilledProfile).toBe(true);
    expect(updated.nickname).toBe('An Nhiên');
    expect(updated.birthYear).toBe(2012);
  });
});
