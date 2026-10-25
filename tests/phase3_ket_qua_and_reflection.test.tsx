// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  saveJournalEntry,
  getJournalEntries,
  getJournalEntryById,
  getLatestJournalEntry,
  updateJournalReflection,
  type ReflectionStatus,
} from '@/lib/journal-store';
import type { ReadingSuccessResponse } from '@/lib/api-types';

describe('Phase 3 Verification: Dual Viewing Modes, URL State Recovery & Prediction Reflection Tracker', () => {
  const mockReading: ReadingSuccessResponse = {
    status: 'success',
    readingId: 'test-reading-phase3-001',
    createdAt: new Date().toISOString(),
    readerId: 'ba_ngoai',
    readerDisplayName: 'Bà Ngoại Vui Tính',
    topic: 'tinh_cam',
    topicLabel: 'Tình Duyên',
    questionText: 'Tụi mình có thể đi đến hôn nhân không?',
    nickname: 'Bảo & Vy',
    birthYear: '1998',
    drawnCards: [
      {
        position: 0,
        position_label: 'Hiện Tại',
        reversed: false,
        card: {
          id: 'the_lovers',
          name_vi: 'The Lovers',
          name_en: 'The Lovers',
          arcana: 'major',
          suit: 'major',
          number: 6,
          roman: 'VI',
          element: 'Khí',
          astrology: 'Song Tử',
          keywords_up: ['Kết nối', 'Tình yêu', 'Lựa chọn'],
          keywords_rev: ['Bất đồng', 'Mất cân bằng'],
          rws_image_url: '/cards/lovers.jpg',
        } as any,
      },
      {
        position: 1,
        position_label: 'Thử Thách',
        reversed: true,
        card: {
          id: 'two_of_swords',
          name_vi: 'Two of Swords',
          name_en: 'Two of Swords',
          arcana: 'minor',
          suit: 'swords',
          number: 2,
          roman: 'II',
          element: 'Khí',
          astrology: 'Mặt Trăng trong Thiên Bình',
          keywords_up: ['Bế tắc', 'Do dự'],
          keywords_rev: ['Lộ diện', 'Quyết định'],
          rws_image_url: '/cards/two_swords.jpg',
        } as any,
      },
      {
        position: 2,
        position_label: 'Tương Lai',
        reversed: false,
        card: {
          id: 'ten_of_cups',
          name_vi: 'Ten of Cups',
          name_en: 'Ten of Cups',
          arcana: 'minor',
          suit: 'cups',
          number: 10,
          roman: 'X',
          element: 'Nước',
          astrology: 'sao Hỏa trong Song Ngư',
          keywords_up: ['Hạnh phúc', 'Gia đình viên mãn'],
          keywords_rev: ['Rạn nứt', 'Kỳ vọng sai lệch'],
          rws_image_url: '/cards/ten_cups.jpg',
        } as any,
      },
    ],
    result: {
      greeting_hook: 'Chào hai đứa, để Ngoại xem duyên nợ thế nào.',
      cards_analysis: [
        {
          card_index: 0,
          card_id: 'the_lovers',
          card_name_vi: 'The Lovers',
          reversed: false,
          position_label: 'Hiện Tại',
          interpretation: 'Tình cảm sâu đậm, thấu hiểu lẫn nhau.',
          advice: 'Hãy giữ vững sự chân thành.',
        },
        {
          card_index: 1,
          card_id: 'two_of_swords',
          card_name_vi: 'Two of Swords',
          reversed: true,
          position_label: 'Thử Thách',
          interpretation: 'Đôi lúc có những việc hai đứa ngại nói thẳng thắn.',
          advice: 'Đừng im lặng chịu đựng một mình.',
        },
        {
          card_index: 2,
          card_id: 'ten_of_cups',
          card_name_vi: 'Ten of Cups',
          reversed: false,
          position_label: 'Tương Lai',
          interpretation: 'Một cái kết viên mãn có gia đình ủng hộ.',
          advice: 'Cùng chuẩn bị kế hoạch dài hạn.',
        },
      ],
      overall_verdict: 'Hai đứa có duyên nợ lành, chỉ cần học cách lắng nghe khi bất đồng.',
      actionable_next_step: 'Hãy dành cuối tuần ngồi uống trà và chia sẻ về dự định 3 năm tới.',
      shareable_card: {
        savage_quote: 'Muốn cưới nhau thì bớt giận dỗi vu vơ đi hai đứa!',
        savage_quotes: [
          'Muốn cưới nhau thì bớt giận dỗi vu vơ đi hai đứa!',
          'Tình yêu đẹp là tình yêu cả hai cùng chịu hạ cái tôi xuống.',
          'Duyên đến tay mà lười vun đắp thì tiên bụt cũng chào thua.',
        ],
        badge_title: 'Cặp Đôi Định Mệnh',
        accent_color: '#C9A24A',
      },
    },
  };

  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const k in store) delete store[k];
      },
    });
  });

  describe('1. Journal Store: Prediction Reflection Tracker & Helper Functions', () => {
    it('1.1 saves reading entry and preserves reflection state on re-save', () => {
      saveJournalEntry(mockReading);
      const entries = getJournalEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].id).toBe('test-reading-phase3-001');

      // Add reflection
      updateJournalReflection('test-reading-phase3-001', 'very_accurate', 'Thực tế đúng 100%!');
      const updated = getJournalEntryById('test-reading-phase3-001');
      expect(updated?.reflection?.status).toBe('very_accurate');
      expect(updated?.reflection?.feedback).toBe('Thực tế đúng 100%!');

      // Re-save reading (e.g. after drawing clarifier)
      saveJournalEntry(mockReading);
      const reSaved = getJournalEntryById('test-reading-phase3-001');
      expect(reSaved?.reflection?.status).toBe('very_accurate');
      expect(reSaved?.reflection?.feedback).toBe('Thực tế đúng 100%!');
    });

    it('1.2 retrieves latest entry via getLatestJournalEntry', () => {
      saveJournalEntry(mockReading);
      const latest = getLatestJournalEntry();
      expect(latest?.id).toBe('test-reading-phase3-001');
      expect(latest?.fullResponse.nickname).toBe('Bảo & Vy');
    });

    it('1.3 supports all reflection statuses: very_accurate, partially_accurate, not_yet', () => {
      saveJournalEntry(mockReading);

      updateJournalReflection('test-reading-phase3-001', 'partially_accurate');
      expect(getJournalEntryById('test-reading-phase3-001')?.reflection?.status).toBe('partially_accurate');

      updateJournalReflection('test-reading-phase3-001', 'not_yet');
      expect(getJournalEntryById('test-reading-phase3-001')?.reflection?.status).toBe('not_yet');

      updateJournalReflection('test-reading-phase3-001', 'very_accurate');
      expect(getJournalEntryById('test-reading-phase3-001')?.reflection?.status).toBe('very_accurate');
    });
  });

  describe('2. Source Code Invariants: Dual Viewing Modes & URL Restoration in /reading/ket-qua', () => {
    const ketQuaFilePath = path.resolve(__dirname, '../src/app/(reading)/reading/ket-qua/page.tsx');
    const ketQuaSource = fs.readFileSync(ketQuaFilePath, 'utf8');

    it('2.1 implements dual viewing modes (step_by_step and dashboard)', () => {
      expect(ketQuaSource).toContain("viewMode === 'dashboard'");
      expect(ketQuaSource).toContain("viewMode === 'step_by_step'");
      expect(ketQuaSource).toContain('Từng Bước');
      expect(ketQuaSource).toContain('Toàn Cảnh');
      expect(ketQuaSource).toContain('DashboardView');
    });

    it('2.2 wraps page content in Suspense for Next.js useSearchParams safety', () => {
      expect(ketQuaSource).toContain('useSearchParams');
      expect(ketQuaSource).toContain('<Suspense');
      expect(ketQuaSource).toContain('export default function KetQuaPage()');
    });

    it('2.3 implements URL state restoration & local storage recovery', () => {
      expect(ketQuaSource).toContain('getJournalEntryById');
      expect(ketQuaSource).toContain('getLatestJournalEntry');
      expect(ketQuaSource).toContain("searchParams.get('id')");
    });

    it('2.4 embeds AIVoiceReaderBar and Prediction Reflection Tracker in DashboardView', () => {
      expect(ketQuaSource).toContain('<AIVoiceReaderBar');
      expect(ketQuaSource).toContain('Prediction Reflection Tracker');
      expect(ketQuaSource).toContain('very_accurate');
      expect(ketQuaSource).toContain('partially_accurate');
      expect(ketQuaSource).toContain('not_yet');
    });

    it('2.5 maintains color token purity: zero #D9B36A, antique gold #C9A24A and luxury gold #E5C687', () => {
      expect(ketQuaSource).not.toContain('#D9B36A');
      expect(ketQuaSource).toContain('#C9A24A');
      expect(ketQuaSource).toContain('#E5C687');
    });

    it('2.6 embeds prominent InteractiveFollowupCard and HeroClarifierCard in both Verdict and Dashboard views', () => {
      expect(ketQuaSource).toContain('InteractiveFollowupCard');
      expect(ketQuaSource).toContain('HeroClarifierCard');
      expect(ketQuaSource).toContain('initialQuestion={followupQuestion}');

      const followupPath = path.resolve(__dirname, '../src/components/reading/InteractiveFollowupCard.tsx');
      const followupSrc = fs.readFileSync(followupPath, 'utf8');
      expect(followupSrc).toContain('2 câu đầu miễn phí ✨');
      expect(followupSrc).toContain('Chạm để hỏi nhanh');
      expect(followupSrc).toContain('animate-ping');

      const clarifierPath = path.resolve(__dirname, '../src/components/reading/HeroClarifierCard.tsx');
      const clarifierSrc = fs.readFileSync(clarifierPath, 'utf8');
      expect(clarifierSrc).toContain('GỢI MỞ BÍ MẬT QUYẾT ĐỊNH · 5 SAO ⭐');
      expect(clarifierSrc).toContain('LẬT MỞ LÁ THỨ 4 NGAY · 5 SAO');
      expect(clarifierSrc).toContain('LÁ 4');
    });
  });

  describe('3. Source Code Invariants: Prediction Tracker in /me/history', () => {
    const historyFilePath = path.resolve(__dirname, '../src/app/(app)/me/history/page.tsx');
    const historySource = fs.readFileSync(historyFilePath, 'utf8');

    it('3.1 integrates updateJournalReflection and reflection badges in history', () => {
      expect(historySource).toContain('updateJournalReflection');
      expect(historySource).toContain('handleUpdateReflection');
      expect(historySource).toContain('Rất đúng');
      expect(historySource).toContain('Một phần');
      expect(historySource).toContain('Chưa thấy');
    });
  });
});
