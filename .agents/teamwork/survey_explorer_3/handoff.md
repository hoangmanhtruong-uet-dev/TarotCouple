# Handoff Report: R3 & R4 Frontend Journal, Accessibility, Admin Health & Invariants

**Agent:** `survey_explorer_3`  
**Date:** 2026-10-12  
**Type:** Hard Handoff (Investigation & Survey Complete)  
**Target:** Orchestrator (`58c8abf6-6619-415c-b64e-e70b2e787b91`) / Subsequent Implementing Agents

---

## 1. Observation

1. **`src/lib/journal-store.ts` (lines 4-19)**:
   - `JournalEntry` currently lacks `userNote?: string` and `updatedAt?: string`.
   - `saveJournalEntry` on line 59 preserves `isFavorite`, but without explicit preservation of `userNote` and `updatedAt`, re-saving an existing reading (`existsIdx >= 0`) would drop user reflection notes.
   - `updateJournalNote` function is not yet exported.

2. **`src/app/(app)/me/history/page.tsx`**:
   - **Line 54**: `if (window.confirm('Bạn có chắc muốn xóa bản ghi trải bài này khỏi nhật ký?'))`
   - **Line 64**: `if (window.confirm('Bạn có chắc chắn muốn xóa TOÀN BỘ nhật ký trải bài trên thiết bị này?'))`
   - **Line 95**: `<div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 ...">` (`top-18` is non-standard Tailwind).
   - Icon-only buttons at line 183 (`Bookmark`), line 195 (`Trash2`), line 111 (`Trash2`), line 301 (`X`) lack `aria-label` attributes.
   - `<CustomCursorFollower />` is not imported or rendered on `/me/history`.
   - There is no search input or text filtering mechanism in the UI (only 5 topic tabs at line 139).
   - The detail modal (lines 287-385) displays question, cards, and verdict, but has no reflection note textarea or update mechanism.

3. **`src/app/(admin)/admin/funnel/page.tsx`**:
   - Currently 19 lines, rendering `<FunnelAnalyticsModal isOpen={true} onClose={() => router.push('/')} />`.
   - Does not fetch `/api/health` or render any health status banner.
   - `FunnelAnalyticsModal` in `src/components/FunnelAnalyticsModal.tsx` renders a modal overlay (`fixed inset-0 z-50`) with no slot or prop for an external banner.

4. **Invariants**:
   - Search for `#D9B36A` across `src/app` and `src/components`: **0 occurrences**.
   - Search for `backdrop-blur` on 3D card visuals (`TarotCardVisual`, `TactileArcFan`, `HeroTarotDeck3D`, and reading cards in `chu-de`, `bo-bai`, `noi-niem`): **0 occurrences** (strict adherence to 60 FPS GPU rule).
   - `src/app/(reading)/reading/rut-bai/page.tsx` lines 205-234: `startRevealSequence` strictly implements card 1 at 0ms, card 2 at 350ms, card 3 at 700ms, and transition at 1350ms.

5. **Test Suites**:
   - `npx vitest run tests/golive_audit_verification.test.ts`: passes 4/4 tests in 19ms.
   - `npx vitest run`: passes all 26 test files and 238 tests.
   - `npx tsc --noEmit`: exits with code 0.
   - `npm run build`: builds all 118 static and dynamic routes with code 0.

---

## 2. Logic Chain

1. **Journal Store Logic**:
   - Adding `userNote?: string` and `updatedAt?: string` to `JournalEntry` allows storing user reflections.
   - Because `saveJournalEntry` constructs a new `JournalEntry` object when an entry is re-saved (line 45), mapping `userNote: existsIdx >= 0 ? current[existsIdx]?.userNote : undefined` and `updatedAt: existsIdx >= 0 ? current[existsIdx]?.updatedAt : undefined` is mathematically necessary to prevent data loss.
   - Implementing `updateJournalNote(id: string, note: string): JournalEntry[]` using standard `Array.prototype.map` ensures immutability and persistence to `localStorage`.

2. **History Page UX & Accessibility Logic**:
   - Native `window.confirm` blocks the browser thread and fails headless automation / custom styling requirements. Replacing both calls (lines 54 and 64) with React modal state `pendingConfirm: { type: 'delete_one' | 'clear_all', id?: string, title, message } | null` provides non-blocking, themed confirmation using `#13111E` and `#C9A24A` with accessible `role="alertdialog"`.
   - The instant search filter evaluates `entry.questionText`, `c.card.name_vi`, `c.card.name_en`, `entry.clarifierCard?.card.name_vi/en`, and `entry.userNote`. Normalizing to lowercase enables real-time client-side search across all 20 entries without server latency.
   - In Tailwind CSS, `top-18` (4.5rem) is not a default utility and fails to apply standard positioning; changing to `top-20` (5rem) conforms to the standard Tailwind spacing scale.
   - Icon-only buttons lacking `aria-label` violate WCAG 2.1 AA and screen-reader accessibility; adding explicit labels (`aria-label="Xóa bản ghi"`, `aria-label="Yêu thích"`) fixes this directly.
   - Adding `<CustomCursorFollower />` aligns `/me/history` with the rest of the application's mystic desktop and mobile touch aura visual language.

3. **Admin Funnel System Health View Logic**:
   - R2 defines `GET /api/health` returning `{ status: 'ok', timestamp, ai: { configuredKeysCount, primaryModel, modelChain }, supabase: { mode, connected, tablesReady, missingTables } }`.
   - In `src/app/(admin)/admin/funnel/page.tsx`, fetching `/api/health` on mount in `useEffect` and passing the resulting banner into `FunnelAnalyticsModal` via an optional `banner?: React.ReactNode` prop (or rendering above the modal) ensures system diagnostics are directly visible without interfering with funnel metrics.

4. **Verification Test Logic**:
   - R4 specifies testing `GET /api/health`, `updateJournalNote`, and the absence of `window.confirm` in `tests/golive_audit_verification.test.ts`.
   - Testing `GET /api/health` directly against the exported route handler validates response schema and confirms no secret API keys are leaked.
   - Testing `updateJournalNote` with Vitest global window/localStorage stubbing validates persistence and note mutation without requiring a browser environment.
   - Testing file contents of `src/app/(app)/me/history/page.tsx` via `fs.readFileSync` guarantees regex-level enforcement against `window.confirm`.

---

## 3. Caveats

- `/api/health` endpoint (`src/app/api/health/route.ts`) is currently being implemented by peer agents (R2). Tests for `GET /api/health` should be added once the route is in place or coordinated so tests import the route seamlessly.
- In Node test environments (`vitest`), `window` and `localStorage` are undefined by default. Tests targeting `updateJournalNote` must stub `window` and `localStorage` using `vi.stubGlobal()` and restore them via `vi.unstubAllGlobals()`.
- No other caveats. All requirements have been exhaustively surveyed with line-level accuracy.

---

## 4. Conclusion

The codebase is in an exceptionally clean state (100% build pass, 238/238 tests passing, 0 TypeScript errors).
The roadmap for completing R3 & R4 is fully mapped:
1. Update `src/lib/journal-store.ts` (interface + note preservation + `updateJournalNote` export).
2. Refactor `src/app/(app)/me/history/page.tsx` (inline modal replacing `window.confirm`, instant search input, note editor, `top-20`, `aria-label`, `<CustomCursorFollower />`).
3. Enhance `src/components/FunnelAnalyticsModal.tsx` and `src/app/(admin)/admin/funnel/page.tsx` with `/api/health` banner.
4. Add verification tests 5, 6, and 7 to `tests/golive_audit_verification.test.ts`.

---

## 5. Verification Method

To independently verify all findings and validate subsequent changes:

1. **Verify No `window.confirm` in History**:
   ```powershell
   # In PowerShell:
   Select-String -Path "src/app/(app)/me/history/page.tsx" -Pattern "confirm"
   ```
2. **Verify Invariant `#D9B36A`**:
   ```powershell
   Select-String -Path "src/app/**/*.tsx","src/components/**/*.tsx" -Pattern "#D9B36A"
   # Must return 0 matches
   ```
3. **Run TypeScript Check**:
   ```powershell
   npx tsc --noEmit
   # Must exit with code 0
   ```
4. **Run Verification Test Suite**:
   ```powershell
   npx vitest run tests/golive_audit_verification.test.ts
   # Must pass all tests
   ```
5. **Run All Vitest Tests**:
   ```powershell
   npx vitest run
   # All 26 test suites must pass
   ```
6. **Run Next.js Production Build**:
   ```powershell
   npm run build
   # Must succeed across all 118 routes
   ```
