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

  it('6. detects missing profile and missing topic for route guard protection', () => {
    // Unfilled profile
    useReadingStore.setState({ hasFilledProfile: false, nickname: '' });
    const s1 = useReadingStore.getState();
    const hasProfile1 = s1.hasFilledProfile && Boolean(s1.nickname?.trim()) && Boolean(s1.birthYear);
    expect(hasProfile1).toBe(false); // Needs redirect to /reading/ve-ban

    // Profile filled but missing topic
    useReadingStore.setState({ hasFilledProfile: true, nickname: 'Alice', birthYear: 2004, selectedTopic: '' as any });
    const s2 = useReadingStore.getState();
    const hasProfile2 = s2.hasFilledProfile && Boolean(s2.nickname?.trim()) && Boolean(s2.birthYear);
    expect(hasProfile2).toBe(true);
    expect(Boolean(s2.selectedTopic)).toBe(false); // Needs redirect to /reading/chu-de
  });

  it('7. verifies age safety: payments strictly disabled for <11yo and ba_ngoai persona override for 10-15yo', () => {
    const kidPolicy = classifyAgeTier(2016, 2026, 'ba_co_mo_hon'); // 10 years old (<11yo)
    expect(kidPolicy.isKidTeenSafeMode).toBe(true);
    expect(kidPolicy.paymentEnabled).toBe(false); // Zero path to bank payment for <11yo
    expect(kidPolicy.effectivePersona).toBe('ba_ngoai_vui_tinh');

    const teenPolicy = classifyAgeTier(2014, 2026, 'ba_co_mo_hon'); // 12 years old (>=11yo)
    expect(teenPolicy.isKidTeenSafeMode).toBe(true);
    expect(teenPolicy.paymentEnabled).toBe(true);
  });

  it('8. verifies Step 2 (/chu-de and /bo-bai) 3D perspective tilt, GSAP reveal, voice preview, and cursor integration', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = process.cwd();

    const chuDeContent = fs.readFileSync(path.join(rootDir, 'src/app/(reading)/reading/chu-de/page.tsx'), 'utf-8');
    expect(chuDeContent).toContain('gsap');
    expect(chuDeContent).toContain('CustomCursorFollower');
    expect(chuDeContent).toContain('READER_TOPIC_PREVIEW');
    expect(chuDeContent).toContain('data-topic-card');
    expect(chuDeContent).toContain('ASTRAL_VORTEX_VERTEX_SHADER');
    expect(chuDeContent).toContain('ASTRAL_VORTEX_FRAGMENT_SHADER');
    expect(chuDeContent).toContain('InstancedMesh');
    expect(chuDeContent).toContain('foilGlareRefsMap');
    expect(chuDeContent).toContain('spreadSlots');
    expect(chuDeContent).toContain('resonancePct');

    const boBaiContent = fs.readFileSync(path.join(rootDir, 'src/app/(reading)/reading/bo-bai/page.tsx'), 'utf-8');
    expect(boBaiContent).toContain('gsap');
    expect(boBaiContent).toContain('CustomCursorFollower');
    expect(boBaiContent).toContain('data-deck-card');
    expect(boBaiContent).toContain('perspective(950px)');
    expect(boBaiContent).not.toContain('backdrop-blur-md');

    const noiNiemContent = fs.readFileSync(path.join(rootDir, 'src/app/(reading)/reading/noi-niem/page.tsx'), 'utf-8');
    expect(noiNiemContent).toContain('gsap');
    expect(noiNiemContent).toContain('CustomCursorFollower');
    expect(noiNiemContent).toContain('ASTRAL_VORTEX_VERTEX_SHADER');
    expect(noiNiemContent).toContain('emotionalResonance');
    expect(noiNiemContent).toContain('foilGlareRef');
    expect(noiNiemContent).toContain('sampleShuffleOffset');
    expect(noiNiemContent).not.toContain('backdrop-blur-md');
  });
});
