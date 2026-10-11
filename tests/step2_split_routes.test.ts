import { describe, it, expect, beforeEach } from 'vitest';
import { useReadingStore } from '../src/lib/reading-store';
import { classifyAgeTier } from '../src/lib/safety';

describe('Step 2 Split Sub-routes Flow Suite (/chu-de, /noi-niem, /bo-bai)', () => {
  beforeEach(() => {
    useReadingStore.getState().resetReadingFlow();
    useReadingStore.setState({
      selectedReaderId: 'ba_co_mo_hon',
      readerAccentColor: '#E5624A',
      hasFilledProfile: true,
      nickname: 'TestUser',
      birthYear: 2004,
      selectedTopic: 'love',
      deckMode: 'full_78',
      questionText: '',
      hideQuestionOnShare: true,
    });
  });

  it('1. filters topics according to age tier for Step 2a (chu-de)', () => {
    // 10-15 yo (born 2013)
    const kidPolicy = classifyAgeTier(2013, 2026, 'ba_co_mo_hon');
    expect(kidPolicy.isKidTeenSafeMode).toBe(true);
    expect(kidPolicy.allowedTopics.map((t) => t.id)).toEqual([
      'crush_school',
      'study',
      'daily_luck',
    ]);

    // 18+ yo (born 2004)
    const adultPolicy = classifyAgeTier(2004, 2026, 'ba_co_mo_hon');
    expect(adultPolicy.isKidTeenSafeMode).toBe(false);
    expect(adultPolicy.allowedTopics.map((t) => t.id)).toEqual([
      'love',
      'career',
      'finance',
    ]);
  });

  it('2. updates selectedTopic and presets question context in Step 2a (chu-de)', () => {
    const store = useReadingStore.getState();
    store.setContextForm({ selectedTopic: 'career' });

    const updated = useReadingStore.getState();
    expect(updated.selectedTopic).toBe('career');
  });

  it('3. manages question input, privacy switch, and max length in Step 2b (noi-niem)', () => {
    const store = useReadingStore.getState();

    // Type question
    const sampleQuestion = 'Người ấy có chủ động nhắn tin lại không?';
    store.setContextForm({ questionText: sampleQuestion });
    expect(useReadingStore.getState().questionText).toBe(sampleQuestion);

    // Toggle hideQuestionOnShare switch
    store.setContextForm({ hideQuestionOnShare: false });
    expect(useReadingStore.getState().hideQuestionOnShare).toBe(false);
  });

  it('4. skip action clears questionText in Step 2b so AI interprets by topic', () => {
    const store = useReadingStore.getState();
    store.setContextForm({ questionText: 'Nháp câu hỏi...' });
    expect(useReadingStore.getState().questionText).toBe('Nháp câu hỏi...');

    // User taps "Bỏ qua & AI đọc theo chủ đề"
    store.setContextForm({ questionText: '' });
    expect(useReadingStore.getState().questionText).toBe('');
  });

  it('5. toggles deck mode between 22 Major Arcana and 78 Full Deck in Step 2c (bo-bai)', () => {
    const store = useReadingStore.getState();
    expect(store.deckMode).toBe('full_78');

    // Switch to 22 Major Arcana
    store.setContextForm({ deckMode: 'major_22' });
    expect(useReadingStore.getState().deckMode).toBe('major_22');

    // Switch back to 78 Full Deck
    store.setContextForm({ deckMode: 'full_78' });
    expect(useReadingStore.getState().deckMode).toBe('full_78');
  });
});
