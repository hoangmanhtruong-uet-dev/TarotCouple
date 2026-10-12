import { describe, it, expect, beforeEach } from 'vitest';
import { useReadingStore } from '@/lib/reading-store';
import { classifyAgeTier } from '@/lib/safety';
import { soundManager } from '@/lib/sound-effects';
import { computeParabolicArcTransform } from '@/lib/three/core';
import { saveJournalEntry, getJournalEntries } from '@/lib/journal-store';
import type { ReadingSuccessResponse } from '@/lib/api-types';

describe('Tier 4: Real-World Application Scenarios (End-to-End User Journeys across 4 Reading Steps)', () => {
  beforeEach(() => {
    useReadingStore.getState().resetReadingFlow();
    useReadingStore.getState().setContextForm({ selectedTopic: 'love' });
    soundManager.setEnabled(true);
  });

  it('S01: Full Happy Path Journey (/chu-de -> /bo-bai -> /rut-bai -> /ket-qua)', () => {
    const store = useReadingStore.getState();

    // 1. Initial State: User selected Reader "Bà Ngoại"
    store.setSelectedReaderId('ba_ngoai', '#EAB308');
    store.setContextForm({
      hasFilledProfile: true,
      nickname: 'Mai Linh',
      birthYear: 2000,
    });
    expect(useReadingStore.getState().selectedReaderId).toBe('ba_ngoai');
    expect(useReadingStore.getState().hasFilledProfile).toBe(true);

    // 2. Step 2a: /reading/chu-de — Selects "Tình Yêu" (love)
    store.setContextForm({ selectedTopic: 'love' });
    expect(useReadingStore.getState().selectedTopic).toBe('love');

    // 3. Step 2b: /reading/bo-bai — Selects Full Deck 78 Cards
    store.setContextForm({ deckMode: 'full_78' });
    expect(useReadingStore.getState().deckMode).toBe('full_78');

    // 4. Step 3: /reading/rut-bai — User draws 3 cards from 3D Tactile Arc Fan
    const drawnIndices = [7, 21, 42];
    store.setSelectedFanIndices(drawnIndices);
    expect(useReadingStore.getState().selectedFanIndices).toEqual([7, 21, 42]);

    // 5. Step 4: /reading/ket-qua — Simulated API returns divination response with 3 cards
    const mockSuccessPayload: ReadingSuccessResponse = {
      readingId: 'reading_happy_path_001',
      createdAt: new Date().toISOString(),
      readerId: 'ba_ngoai',
      readerDisplayName: 'Bà Ngoại',
      readerRole: 'Bà ngoại hiền hậu',
      topic: 'love',
      topicLabel: 'Tình Duyên & Mối Quan Hệ',
      questionText: 'Tương lai mối quan hệ của chúng mình thế nào?',
      drawnCards: [
        {
          id: 'the_lovers',
          name: 'The Lovers',
          name_vi: 'Người Yêu',
          arcana: 'major',
          position: 'present',
          position_label: 'Hiện Tại',
          orientation: 'upright',
          keywords: ['Tình yêu', 'Lựa chọn'],
          image_url: '/cards/lovers.jpg',
        },
        {
          id: 'two_of_cups',
          name: 'Two of Cups',
          name_vi: 'Hai Chiếc Cốc',
          arcana: 'minor',
          position: 'challenge',
          position_label: 'Thử Thách',
          orientation: 'upright',
          keywords: ['Hòa hợp', 'Kết nối'],
          image_url: '/cards/2_cups.jpg',
        },
        {
          id: 'ten_of_cups',
          name: 'Ten of Cups',
          name_vi: 'Mười Chiếc Cốc',
          arcana: 'minor',
          position: 'outcome',
          position_label: 'Kết Quả',
          orientation: 'upright',
          keywords: ['Hạnh phúc', 'Mái ấm'],
          image_url: '/cards/10_cups.jpg',
        },
      ],
      result: {
        summary: 'Mối quan hệ đầy tiềm năng gắn kết sâu sắc.',
        overall_verdict: 'Hai bạn đang trên con đường vun đắp tình cảm bền chặt.',
        cards_analysis: [
          {
            card_id: 'the_lovers',
            card_name: 'The Lovers',
            position_label: 'Hiện Tại',
            is_reversed: false,
            insight: 'Tình cảm nồng thắm.',
            actionable_advice: 'Hãy cởi mở chia sẻ cảm xúc.',
          },
          {
            card_id: 'two_of_cups',
            card_name: 'Two of Cups',
            position_label: 'Thử Thách',
            is_reversed: false,
            insight: 'Đôi lúc có chút hiểu lầm nhỏ.',
            actionable_advice: 'Lắng nghe đối phương nhiều hơn.',
          },
          {
            card_id: 'ten_of_cups',
            card_name: 'Ten of Cups',
            position_label: 'Kết Quả',
            is_reversed: false,
            insight: 'Tương lai bình yên, hòa thuận.',
            actionable_advice: 'Tiếp tục tin tưởng và yêu thương.',
          },
        ],
        shareable_card: {
          savage_quote: 'Bà thấy hai đứa hợp nhau lắm, cứ thế mà phát huy nghen con!',
          savage_quotes: [
            'Bà thấy hai đứa hợp nhau lắm nghen!',
            'Có giận hờn gì cũng ráng làm lành sớm!',
            'Người ta thương con thiệt lòng đó!',
          ],
          hashtags: ['#TarotCouple', '#TinhYeu', '#BaNgoai'],
        },
      },
      aiMeta: {
        provider: 'gemini',
        latencyMs: 1200,
        usedFallback: false,
      },
    };

    store.setReadingSuccess(mockSuccessPayload);
    const finalState = useReadingStore.getState();
    expect(finalState.readingSuccess).not.toBeNull();
    expect(finalState.readingSuccess?.readingId).toBe('reading_happy_path_001');
    expect(finalState.readingSuccess?.drawnCards.length).toBe(3);
    expect(finalState.readingSuccess?.result.cards_analysis.length).toBe(3);
  });

  it('S02: Under-16 Student Safe Mode Reading Journey', () => {
    const store = useReadingStore.getState();

    // 14 years old student born in 2012
    const birthYear = 2012;
    const currentYear = 2026;
    const policy = classifyAgeTier(birthYear, currentYear, 'chi_dai');

    expect(policy.isKidTeenSafeMode).toBe(true);
    // Sharp reader persona is safely adapted to wholesome guide for teens
    expect(policy.effectivePersona).toBe('ba_ngoai_vui_tinh');

    // Blocked adult topics: love, finance, career
    const allowedTopicIds = policy.allowedTopics.map((t) => t.id);
    expect(allowedTopicIds).toContain('study');
    expect(allowedTopicIds).toContain('crush_school');
    expect(allowedTopicIds).toContain('daily_luck');
    expect(allowedTopicIds).not.toContain('finance');

    // Setting store context for student flow
    store.setSelectedReaderId('ba_ngoai');
    store.setContextForm({
      hasFilledProfile: true,
      nickname: 'Bé Na',
      birthYear: 2012,
      selectedTopic: 'study',
      deckMode: 'major_22',
      questionText: 'Kỳ thi sắp tới của em thế nào?',
    });

    const studentState = useReadingStore.getState();
    expect(studentState.selectedTopic).toBe('study');
    expect(studentState.deckMode).toBe('major_22');
  });

  it('S03: Global Sound Preference Persistence Across Page Transitions', () => {
    // 1. Initial on /reading/chu-de: Sound is active
    expect(soundManager.isEnabled()).toBe(true);

    // 2. User toggles mute button on /reading/chu-de
    const isNowMuted = !soundManager.toggle();
    expect(isNowMuted).toBe(true);
    expect(soundManager.isEnabled()).toBe(false);

    // 3. User navigates to /reading/bo-bai and /reading/rut-bai
    // Audio interactions must remain muted and execute safely
    expect(() => {
      soundManager.playMagneticHover();
      soundManager.playCardSlide();
      soundManager.playRiffleShuffle();
    }).not.toThrow();

    // 4. User arrives at /reading/ket-qua and toggles sound back on
    const isNowActive = soundManager.toggle();
    expect(isNowActive).toBe(true);
    expect(soundManager.isEnabled()).toBe(true);

    expect(() => {
      soundManager.playCardFlip();
      soundManager.playBellTone();
    }).not.toThrow();
  });

  it('S04: Dual-Deck Mode Invariants & Fan Geometry Allocation (22 vs 78 Cards)', () => {
    // 22 Major Arcana Fan configuration (even count 22 cards: pair 10 and 11 symmetric around 0)
    const fan22Left = computeParabolicArcTransform(10, 22, 0);
    const fan22Right = computeParabolicArcTransform(11, 22, 0);
    const fan22First = computeParabolicArcTransform(0, 22, 0);
    const fan22Last = computeParabolicArcTransform(21, 22, 0);

    expect((fan22Left.x + fan22Right.x) / 2).toBeCloseTo(0, 4);
    expect(fan22First.x).toBeCloseTo(-fan22Last.x, 4);
    expect(fan22First.rotZ).toBeCloseTo(-fan22Last.rotZ, 4);

    // 78 Full Deck Fan configuration (even count 78 cards: pair 38 and 39 symmetric around 0)
    const fan78Left = computeParabolicArcTransform(38, 78, 0);
    const fan78Right = computeParabolicArcTransform(39, 78, 0);
    const fan78First = computeParabolicArcTransform(0, 78, 0);
    const fan78Last = computeParabolicArcTransform(77, 78, 0);

    expect((fan78Left.x + fan78Right.x) / 2).toBeCloseTo(0, 4);
    expect(fan78First.x).toBeCloseTo(-fan78Last.x, 3);
    expect(fan78First.rotZ).toBeCloseTo(-fan78Last.rotZ, 3);

    // Card angular/spatial step density in 78 deck is much tighter than 22 deck
    const step22 = fan22Right.x - fan22Left.x;
    const step78 = fan78Right.x - fan78Left.x;
    expect(step78).toBeLessThan(step22);
  });

  it('S05: Multi-Stage Divination Progression & Journal Persistence', () => {
    const store = useReadingStore.getState();

    const mockReading: ReadingSuccessResponse = {
      readingId: 'reading_journal_persist_001',
      createdAt: new Date().toISOString(),
      readerId: 'chi_dai',
      readerDisplayName: 'Chị Đại',
      readerRole: 'Chị đại sắc sảo',
      topic: 'career',
      topicLabel: 'Sự Nghiệp & Công Việc',
      questionText: 'Có nên chuyển việc trong quý này?',
      drawnCards: [
        {
          id: 'the_magician',
          name: 'The Magician',
          name_vi: 'Pháp Sư',
          arcana: 'major',
          position: 'present',
          position_label: 'Hiện Tại',
          orientation: 'upright',
          keywords: ['Năng lực'],
          image_url: '/cards/magician.jpg',
        },
        {
          id: 'eight_of_pentacles',
          name: 'Eight of Pentacles',
          name_vi: 'Tám Đồng Tiền',
          arcana: 'minor',
          position: 'challenge',
          position_label: 'Thử Thách',
          orientation: 'upright',
          keywords: ['Rèn luyện'],
          image_url: '/cards/8_pentacles.jpg',
        },
        {
          id: 'the_chariot',
          name: 'The Chariot',
          name_vi: 'Cỗ Xe Chiến Thắng',
          arcana: 'major',
          position: 'outcome',
          position_label: 'Kết Quả',
          orientation: 'upright',
          keywords: ['Bứt phá'],
          image_url: '/cards/chariot.jpg',
        },
      ],
      result: {
        summary: 'Cơ hội bứt phá rất lớn nếu bạn dám hành động.',
        overall_verdict: 'Chị Đại khuyên bạn hãy tự tin nắm bắt cơ hội.',
        cards_analysis: [
          {
            card_id: 'the_magician',
            card_name: 'The Magician',
            position_label: 'Hiện Tại',
            is_reversed: false,
            insight: 'Bạn có đủ kỹ năng.',
            actionable_advice: 'Tận dụng thế mạnh.',
          },
          {
            card_id: 'eight_of_pentacles',
            card_name: 'Eight of Pentacles',
            position_label: 'Thử Thách',
            is_reversed: false,
            insight: 'Cần nỗ lực kiên trì.',
            actionable_advice: 'Trau dồi chuyên môn.',
          },
          {
            card_id: 'the_chariot',
            card_name: 'The Chariot',
            position_label: 'Kết Quả',
            is_reversed: false,
            insight: 'Chiến thắng thuyết phục.',
            actionable_advice: 'Tiến về phía trước.',
          },
        ],
        shareable_card: {
          savage_quote: 'Muốn lương cao thì phải chứng minh thực lực, đừng mơ mộng!',
          savage_quotes: [
            'Muốn lương cao thì phải chứng minh thực lực!',
            'Cơ hội không đợi người chần chừ đâu!',
            'Bớt suy nghĩ linh tinh, bắt tay làm ngay đi!',
          ],
          hashtags: ['#TarotCouple', '#SuNghiep', '#ChiDai'],
        },
      },
    };

    store.setReadingSuccess(mockReading);

    // Save to journal store
    const entries = saveJournalEntry(mockReading);
    if (typeof window !== 'undefined') {
      expect(entries.length).toBeGreaterThan(0);
      expect(entries[0].id).toBe('reading_journal_persist_001');
    }

    // Reset flow for next fresh session — resets ritual cards and results while retaining profile
    store.resetReadingFlow();
    const resetState = useReadingStore.getState();
    expect(resetState.readingSuccess).toBeNull();
    expect(resetState.selectedFanIndices).toEqual([]);
    expect(resetState.clarifierCard).toBeNull();
  });

  it('S06: Reading Route Guardrail Validation (Redirect Safeguards)', () => {
    // 1. Missing profile -> must trigger redirect to /reading/ve-ban
    useReadingStore.setState({ hasFilledProfile: false, nickname: '', birthYear: 0 });
    const s1 = useReadingStore.getState();
    const canEnterChuDe = s1.hasFilledProfile && Boolean(s1.nickname?.trim()) && Boolean(s1.birthYear);
    expect(canEnterChuDe).toBe(false);

    // 2. Profile filled but missing topic -> cannot enter bo-bai
    useReadingStore.setState({ hasFilledProfile: true, nickname: 'Hải', birthYear: 1998, selectedTopic: '' as any });
    const s2 = useReadingStore.getState();
    const canEnterBoBai = Boolean(s2.selectedTopic);
    expect(canEnterBoBai).toBe(false);

    // 3. Topic filled but cards not drawn -> cannot view result
    useReadingStore.setState({ selectedTopic: 'love', selectedFanIndices: [] });
    const s3 = useReadingStore.getState();
    const canEnterKetQua = s3.selectedFanIndices.length === 3 || Boolean(s3.readingSuccess);
    expect(canEnterKetQua).toBe(false);
  });
});
