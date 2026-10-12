# Comprehensive Survey & Investigation Report: R3 & R4

**Agent:** `survey_explorer_3`  
**Date:** 2026-10-12  
**Mission:** Survey and investigate R3 & R4: Frontend Journal Upgrade (`/me/history`), Accessibility & Admin Health View, Invariants, and Verification Setup.

---

## 1. Executive Summary

This investigation analyzed all aspects of Requirements 3 & 4 for the Tarot Couple application:
1. **Journal Store (`src/lib/journal-store.ts`)**: The current storage schema lacks `userNote` and `updatedAt`. Adding these fields and implementing `updateJournalNote(id, note)` requires note preservation during re-saves in `saveJournalEntry` so that reading updates do not overwrite existing reflections.
2. **History Page (`src/app/(app)/me/history/page.tsx`)**: Two native `window.confirm()` calls exist (lines 54 and 64). Replacing them with an inline, themed confirmation modal (`#13111E`, `#C9A24A`, `role="alertdialog"`) will enhance accessibility and branding. An instant search input can filter by question text, English and Vietnamese card names, and personal notes. A reflection note editor in the detail modal allows users to edit and save personal notes. The invalid Tailwind class `top-18` (line 95) needs updating to `top-20`. Icon-only buttons need `aria-label` attributes, and `<CustomCursorFollower />` should be integrated.
3. **Admin Funnel (`src/app/(admin)/admin/funnel/page.tsx`)**: The page currently renders `<FunnelAnalyticsModal isOpen={true} />`. A system health status banner fetching `GET /api/health` on mount will display the active Gemini keys count, model fallback chain (`gemini-3.5-flash-lite → ...`), and Supabase table readiness. Supporting an optional `banner` prop in `FunnelAnalyticsModal` allows clean, non-obtrusive rendering.
4. **Codebase Invariants**: Verified 0 occurrences of `#D9B36A` in `src/app` and `src/components`, strict absence of `backdrop-blur` on 3D reading card components, and exact `[0, 350, 700]` ms stagger interval in `rut-bai/page.tsx:205-234`.
5. **Verification Suite (`tests/golive_audit_verification.test.ts`)**: Existing 4 tests pass. Concrete test additions designed for `GET /api/health`, `updateJournalNote`, and the elimination of `window.confirm`.

---

## 2. Investigation of `src/lib/journal-store.ts`

### 2.1 Current Schema
Located at `src/lib/journal-store.ts:4-19`:
```typescript
export interface JournalEntry {
  id: string; // readingId
  createdAt: string;
  readerId: ReaderId;
  readerDisplayName: string;
  topic: TopicId;
  topicLabel: string;
  questionText: string;
  drawnCards: [DrawnCardClientPayload, DrawnCardClientPayload, DrawnCardClientPayload];
  overallVerdict: string;
  savageQuote: string;
  allSavageQuotes: [string, string, string];
  clarifierCard?: ClarifierCardPayload;
  fullResponse: ReadingSuccessResponse;
  isFavorite?: boolean;
}
```

### 2.2 Schema Upgrade
Add optional reflection fields:
```typescript
export interface JournalEntry {
  // ... existing fields ...
  userNote?: string;      // Personal reflection note added by user
  updatedAt?: string;     // ISO timestamp when user note was last updated
}
```

### 2.3 Note Preservation on `saveJournalEntry`
In `saveJournalEntry` (`src/lib/journal-store.ts:41-68`), when updating an existing entry (`existsIdx >= 0`), user notes must not be overwritten:
```typescript
const newEntry: JournalEntry = {
  // ...
  isFavorite: existsIdx >= 0 ? current[existsIdx]?.isFavorite : false,
  userNote: existsIdx >= 0 ? current[existsIdx]?.userNote : undefined,
  updatedAt: existsIdx >= 0 ? current[existsIdx]?.updatedAt : undefined,
};
```

### 2.4 New Export: `updateJournalNote`
Implementation design:
```typescript
export function updateJournalNote(id: string, note: string): JournalEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getJournalEntries();
    const updated = current.map((entry) => {
      if (entry.id === id) {
        return {
          ...entry,
          userNote: note.trim() ? note : undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      return entry;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}
```

---

## 3. Investigation of `src/app/(app)/me/history/page.tsx`

### 3.1 Native `window.confirm` Calls Located
- **Line 54**: `if (window.confirm('Bạn có chắc muốn xóa bản ghi trải bài này khỏi nhật ký?'))`
  Inside `handleDelete(id: string, e: React.MouseEvent)`.
- **Line 64**: `if (window.confirm('Bạn có chắc chắn muốn xóa TOÀN BỘ nhật ký trải bài trên thiết bị này?'))`
  Inside `handleClearAll()`.

### 3.2 Accessible Themed Confirmation Modal Design
Replace native `window.confirm` with React state:
```typescript
interface ConfirmModalState {
  type: 'delete_one' | 'clear_all';
  id?: string;
  title: string;
  message: string;
}
const [pendingConfirm, setPendingConfirm] = useState<ConfirmModalState | null>(null);
```
Modal Structure:
```tsx
<AnimatePresence>
  {pendingConfirm && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm rounded-3xl bg-[#13111E] border border-[#C9A24A]/40 p-6 shadow-2xl text-center space-y-4"
      >
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <Trash2 className="w-5 h-5" />
        </div>
        <div>
          <h3 id="confirm-modal-title" className="text-base font-bold text-[#F8F5F0]">
            {pendingConfirm.title}
          </h3>
          <p id="confirm-modal-desc" className="text-xs text-[#9E96B0] mt-1.5 leading-relaxed">
            {pendingConfirm.message}
          </p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setPendingConfirm(null)}
            className="flex-1 py-2.5 rounded-xl bg-[#1D192C] hover:bg-[#262138] border border-[#262235] text-[#9E96B0] hover:text-[#F8F5F0] text-xs font-bold transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={executeConfirmedAction}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white text-xs font-bold shadow-md hover:from-rose-600 hover:to-rose-700 transition-colors cursor-pointer"
          >
            Xác nhận xóa
          </button>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
```

### 3.3 Instant Search Filtering
Add `const [searchQuery, setSearchQuery] = useState('');`.
Filtering implementation:
```typescript
const filteredEntries = entries.filter((e) => {
  // Topic / favorite filter
  if (filterMode === 'favorite' && !e.isFavorite) return false;
  if (filterMode === 'love' && e.topic !== 'love' && e.topic !== 'crush_school') return false;
  if (filterMode === 'career' && e.topic !== 'career' && e.topic !== 'study') return false;
  if (filterMode === 'finance' && e.topic !== 'finance' && e.topic !== 'daily_luck') return false;

  // Search filter
  const q = searchQuery.trim().toLowerCase();
  if (!q) return true;

  const matchQuestion = e.questionText?.toLowerCase().includes(q);
  const matchNote = e.userNote?.toLowerCase().includes(q);
  const matchCards = e.drawnCards.some(
    (c) =>
      c.card.name_vi?.toLowerCase().includes(q) ||
      c.card.name_en?.toLowerCase().includes(q)
  );
  const matchClarifier =
    e.clarifierCard &&
    (e.clarifierCard.card.name_vi?.toLowerCase().includes(q) ||
     e.clarifierCard.card.name_en?.toLowerCase().includes(q));

  return Boolean(matchQuestion || matchNote || matchCards || matchClarifier);
});
```

Search Input UI:
Placed between the header description and filter tabs:
```tsx
<div className="relative mb-5 max-w-md mx-auto">
  <Search className="w-4 h-4 text-[#9E96B0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Tìm theo câu hỏi, tên lá bài (VN/EN), hoặc ghi chú..."
    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#14121F] border border-[#262235] focus:border-[#C9A24A] text-xs text-[#F8F5F0] placeholder:text-[#9E96B0]/60 outline-none transition-all shadow-inner"
    aria-label="Tìm kiếm nhật ký trải bài"
  />
  {searchQuery && (
    <button
      type="button"
      onClick={() => setSearchQuery('')}
      aria-label="Xóa nội dung tìm kiếm"
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#9E96B0] hover:text-[#F8F5F0]"
    >
      <X className="w-3.5 h-3.5" />
    </button>
  )}
</div>
```

### 3.4 Personal Reflection Note Editor inside Detail Modal
In the reading detail modal (`selectedEntry`):
```tsx
{/* Reflection Note Section */}
<div className="p-4 rounded-2xl bg-[#0B0A12] border border-[#262235] space-y-2">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#C9A24A] uppercase tracking-wider">
      <Sparkles className="w-3.5 h-3.5" />
      <span>Ghi Chú Chiêm Nghiệm Cá Nhân</span>
    </div>
    {selectedEntry.updatedAt && (
      <span className="text-[9px] text-[#9E96B0]">
        Cập nhật: {new Date(selectedEntry.updatedAt).toLocaleDateString('vi-VN')}
      </span>
    )}
  </div>
  <textarea
    value={noteDraft}
    onChange={(e) => setNoteDraft(e.target.value)}
    placeholder="Ghi lại cảm xúc, diễn biến thực tế theo thời gian hoặc bài học rút ra..."
    rows={3}
    className="w-full p-2.5 rounded-xl bg-[#14121F] border border-[#262235] focus:border-[#C9A24A] text-xs text-[#F8F5F0] placeholder:text-[#9E96B0]/50 outline-none resize-none"
    aria-label="Nội dung ghi chú chiêm nghiệm"
  />
  <div className="flex items-center justify-between pt-1">
    <span className="text-[10px] text-[#9E96B0]">
      {isNoteSaved ? '✓ Đã lưu vào thiết bị' : ''}
    </span>
    <button
      type="button"
      onClick={handleSaveNote}
      className="px-3 py-1.5 rounded-xl bg-[#C9A24A] hover:bg-[#E5C687] text-[#0B0A12] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
    >
      <Check className="w-3.5 h-3.5" />
      <span>Lưu Ghi Chú</span>
    </button>
  </div>
</div>
```

### 3.5 Tailwind Class Fix
- Line 95:
  `className="fixed top-18 left-1/2 ..."`
  Replace `top-18` with `top-20` (Tailwind standard spacing `top-20` = 5rem / 80px).

### 3.6 Accessibility: Icon-Only Buttons
Audit of all buttons in `/me/history/page.tsx`:
1. Bookmark toggle button (line 183):
   `aria-label={entry.isFavorite ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}`
2. Delete button (line 195):
   `aria-label="Xóa bản ghi trải bài"`
3. Clear all button (line 111):
   `aria-label="Xóa tất cả nhật ký"`
4. Modal close button (line 301):
   `aria-label="Đóng chi tiết trải bài"`
5. Search clear button:
   `aria-label="Xóa ô tìm kiếm"`

### 3.7 Custom Cursor Integration
Import and render at bottom of component:
```tsx
import { CustomCursorFollower } from '@/components/CustomCursorFollower';
// ...
return (
  <div className="max-w-3xl mx-auto px-4 py-8">
    {/* ... content ... */}
    <CustomCursorFollower />
  </div>
);
```

---

## 4. Investigation of `src/app/(admin)/admin/funnel/page.tsx`

### 4.1 Current Implementation
`src/app/(admin)/admin/funnel/page.tsx` is currently 19 lines:
```tsx
'use client';
import React from 'react';
import { FunnelAnalyticsModal } from '@/components/FunnelAnalyticsModal';
import { useRouter } from 'next/navigation';

export default function AdminFunnelPage() {
  const router = useRouter();
  return (
    <div>
      <FunnelAnalyticsModal
        isOpen={true}
        onClose={() => router.push('/')}
      />
    </div>
  );
}
```

### 4.2 Health Banner Architecture
Requirement: Fetch `/api/health` on mount and render a concise System & AI/Supabase Health status banner showing:
- Active Gemini keys count (`configuredKeysCount`)
- Model priority chain (`['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3-flash-preview']`)
- Supabase table readiness (`tablesReady`, `missingTables`)

Since `FunnelAnalyticsModal` renders a fullscreen modal (`fixed inset-0 z-50`), we can either:
1. Pass a `banner` prop to `FunnelAnalyticsModal`:
   Update `FunnelAnalyticsModalProps` to include `banner?: React.ReactNode;`
   Render `banner` inside the modal body or header.
2. Render the banner floating with `z-[60]` at the top of the viewport.
**Recommendation:** Supporting both! Pass `banner` to `FunnelAnalyticsModal` so it scrolls naturally inside the modal or sits right below the modal header, ensuring perfect visual harmony without obscuring modal metrics.

### 4.3 Proposed Health Banner Component
```tsx
interface HealthState {
  status: string;
  timestamp: string;
  ai: {
    configuredKeysCount: number;
    primaryModel: string;
    modelChain: string[];
  };
  supabase: {
    mode: string;
    connected: boolean;
    tablesReady: boolean;
    missingTables: string[];
  };
}
```
Banner visual design:
- Outer box: `p-3.5 rounded-2xl bg-[#09080D]/90 border border-[#C9A24A]/40 text-xs text-[#F8F5F0]`
- AI Section: `🔮 AI Chain: [configuredKeysCount] Key(s) • gemini-3.5-flash-lite → 3.1-flash-lite → 3.6-flash → 3-flash-preview`
- Supabase Section: `🗄️ Database: mode=[mode] • Connected=[yes/no] • Tables=[Ready / Missing: ...]`

---

## 5. Invariant Auditing Across Codebase

### 5.1 Invariant: Zero Occurrences of `#D9B36A`
- **Audit Tool**: `ripgrep` across entire `src/` directory.
- **Result**: Exactly **0** matches in `src/app` and `src/components`.
- **Existing Test**: `tests/golive_audit_verification.test.ts:29-47` scans all `.ts`/`.tsx` files in `src/app` and `src/components` (>35 files) and asserts zero matches.

### 5.2 Invariant: No `backdrop-blur` on 3D Reading Cards
- **Audit Tool**: Verified against `tests/e2e_3d_journey/tier3_interactions.test.ts:87-115`.
- **Result**:
  - `TarotCardVisual.tsx`: 0 `backdrop-blur`
  - `TactileArcFan.tsx`: 0 `backdrop-blur`
  - `HeroTarotDeck3D.tsx`: 0 `backdrop-blur`
  - `ReaderIntroModal.tsx`: 0 `backdrop-blur`
  - `ReaderProfileView.tsx`: 0 `backdrop-blur`
  - Reading flow cards in `chu-de`, `bo-bai`, `noi-niem`: strictly avoid `backdrop-blur` for GPU performance.
  - Modals overlays (like `SingleCardRevealModal`, `FollowupChatModal`) use backdrop blur for fullscreen dimming, which is permitted and intended.

### 5.3 Invariant: `[0, 350, 700]` ms Stagger in `rut-bai`
- **Location**: `src/app/(reading)/reading/rut-bai/page.tsx:205-234`.
  - Card 1: 0ms (`soundManager.playCardFlip()`, `setRevealedCount(1)`)
  - Card 2: 350ms (`setTimeout(..., 350)`)
  - Card 3: 700ms (`setTimeout(..., 700)`)
  - Transition: 1350ms (`setTimeout(..., 1350)`) -> stage `decoding`.
- **Existing Test**: Enforced by `tests/rut_bai_ritual.test.ts:28-32` and `tests/e2e_3d_journey/tier3_interactions.test.ts:74-84`.

---

## 6. Verification Test Setup (`tests/golive_audit_verification.test.ts`)

The existing suite has 4 passing tests. We design tests 5, 6, and 7 to fulfill Requirement R4:

### 6.1 Test 5: `GET /api/health` Diagnostic Contract
```typescript
it('5. GET /api/health returns valid system diagnostic schema without leaking secret keys', async () => {
  const { GET } = await import('../src/app/api/health/route');
  const res = await GET();
  expect(res.status).toBe(200);

  const json = await res.json();
  expect(json.status).toBe('ok');
  expect(typeof json.timestamp).toBe('string');

  // AI specs
  expect(json.ai).toBeDefined();
  expect(typeof json.ai.configuredKeysCount).toBe('number');
  expect(json.ai.primaryModel).toBe('gemini-3.5-flash-lite');
  expect(json.ai.modelChain).toEqual([
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.6-flash',
    'gemini-3-flash-preview',
  ]);

  // Supabase specs
  expect(json.supabase).toBeDefined();
  expect(typeof json.supabase.mode).toBe('string');
  expect(typeof json.supabase.connected).toBe('boolean');
  expect(typeof json.supabase.tablesReady).toBe('boolean');
  expect(Array.isArray(json.supabase.missingTables)).toBe(true);

  // Security check: No secret keys leaked in payload
  const rawString = JSON.stringify(json);
  expect(rawString).not.toContain('AIzaSy');
  if (process.env.GEMINI_API_KEY) {
    expect(rawString).not.toContain(process.env.GEMINI_API_KEY);
  }
});
```

### 6.2 Test 6: `updateJournalNote` Persistence & Note Preservation
```typescript
it('6. updateJournalNote persists userNote and updatedAt to localStorage', () => {
  const mockStorage: Record<string, string> = {};
  const mockWindow = {
    localStorage: {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, val: string) => {
        mockStorage[key] = val;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
    },
  };

  vi.stubGlobal('window', mockWindow);
  vi.stubGlobal('localStorage', mockWindow.localStorage);

  try {
    const { updateJournalNote, getJournalEntries } = require('../src/lib/journal-store');
    
    // Seed initial entry
    const initialEntry = {
      id: 'test_reading_001',
      createdAt: new Date().toISOString(),
      readerId: 'ba_ngoai',
      readerDisplayName: 'Bà Ngoại',
      topic: 'love',
      topicLabel: 'Tình Duyên',
      questionText: 'Test question',
      drawnCards: [],
      overallVerdict: 'Verdict',
      savageQuote: 'Quote',
      allSavageQuotes: ['', '', ''],
      fullResponse: {},
    };
    mockStorage['tc_journal_entries_v1'] = JSON.stringify([initialEntry]);

    const updated = updateJournalNote('test_reading_001', 'Chiêm nghiệm sâu sắc sau 3 ngày');
    expect(updated.length).toBe(1);
    expect(updated[0].userNote).toBe('Chiêm nghiệm sâu sắc sau 3 ngày');
    expect(typeof updated[0].updatedAt).toBe('string');

    // Confirm persisted in store
    const retrieved = getJournalEntries();
    expect(retrieved[0].userNote).toBe('Chiêm nghiệm sâu sắc sau 3 ngày');
  } finally {
    vi.unstubAllGlobals();
  }
});
```

### 6.3 Test 7: Absence of `window.confirm` in History Page
```typescript
it('7. src/app/(app)/me/history/page.tsx strictly avoids native window.confirm and uses accessible inline modal', () => {
  const filePath = path.join(process.cwd(), 'src', 'app', '(app)', 'me', 'history', 'page.tsx');
  const content = fs.readFileSync(filePath, 'utf-8');

  expect(content).not.toContain('window.confirm');
  expect(content).not.toMatch(/confirm\s*\(/);
  expect(content).toContain('CustomCursorFollower');
  expect(content).toContain('top-20');
  expect(content).not.toContain('top-18');
});
```

---

## 7. Downstream Implementation Checklist for Coder

| Area | Target File | Action Item | Priority |
|------|-------------|-------------|----------|
| **Journal Store** | `src/lib/journal-store.ts` | Add `userNote?: string`, `updatedAt?: string` to `JournalEntry` | HIGH |
| **Journal Store** | `src/lib/journal-store.ts` | Preserve notes during `saveJournalEntry` updates | HIGH |
| **Journal Store** | `src/lib/journal-store.ts` | Export `updateJournalNote(id: string, note: string)` | HIGH |
| **History Page** | `src/app/(app)/me/history/page.tsx` | Replace 2 `window.confirm` calls with accessible inline modal | HIGH |
| **History Page** | `src/app/(app)/me/history/page.tsx` | Add instant search filter (question, VN/EN card names, notes) | HIGH |
| **History Page** | `src/app/(app)/me/history/page.tsx` | Add reflection note editor in detail modal | HIGH |
| **History Page** | `src/app/(app)/me/history/page.tsx` | Change `top-18` to `top-20` on line 95 | MEDIUM |
| **History Page** | `src/app/(app)/me/history/page.tsx` | Add `aria-label` to icon-only buttons | MEDIUM |
| **History Page** | `src/app/(app)/me/history/page.tsx` | Integrate `<CustomCursorFollower />` | MEDIUM |
| **Funnel Analytics** | `src/components/FunnelAnalyticsModal.tsx` | Add optional `banner?: React.ReactNode` prop | HIGH |
| **Admin Funnel** | `src/app/(admin)/admin/funnel/page.tsx` | Fetch `/api/health` and display System & AI/Supabase Health banner | HIGH |
| **Verification Test** | `tests/golive_audit_verification.test.ts` | Add tests 5, 6, 7 verifying `/api/health`, `updateJournalNote`, and absence of `window.confirm` | HIGH |
