# Original User Request

## 2026-10-12T13:35:15Z

Perform a comprehensive Full-Stack Frontend and Backend audit fix and feature upgrade for the Tarot Couple Next.js 15 application. Upgrade Clarifier and Couple Mode AI generators to use the 5-key `gemini-3.5-flash-lite` chain, add Serverless Supabase read-through fallback and a production `/api/health` diagnostics endpoint, and upgrade `/me/history` and `/admin/funnel` with search, personal reflection notes, accessible modals, and live health status.

Working directory: d:\MyProjects\MyProjectToMoney\TarotCouple
Integrity mode: development

## Requirements

### R1. Backend AI 5-Key Upgrade for Clarifier & Couple Mode
In `src/lib/ai-provider.ts`:
- Upgrade `generateClarifierReading` so that when valid Gemini API keys exist (`getValidGeminiApiKeys().length > 0`) and not running inside offline unit test environment (`!process.env.VITEST`), it calls the 5-key rotation chain (`['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3-flash-preview']`) to generate a personalized JSON response (`interpretation`, `advice`, `savageQuote`) for the 4th Clarifier card, falling back cleanly to the deterministic persona template if all keys fail.
- Upgrade `generateCoupleTarotReading` so that when valid Gemini API keys exist and `!process.env.VITEST`, it calls `generateTarotReading` with the 5-key rotation chain to produce live AI readings for Couple Mode (`solo_couple` and `coop_invite`), while attaching the deterministic `computeCoupleEntertainmentMetrics` (`compatibility_score`, `red_flag_level`, `vibe_tag`, `entertainment_note: 'Chỉ để giải trí'`) and preserving `usedFallback: false` when live AI succeeds.

### R2. Serverless Supabase Read-Through Fallback & Production Health Endpoint
- In `src/lib/supabase-hybrid.ts`: Add `checkSupabaseHealth()` (checking REST connectivity and whether the core tables `profiles`, `readings`, `couple_rooms` exist in the OpenAPI spec at `/rest/v1/`) and `fetchCoupleRoomFromSupabase(roomCode: string)` to retrieve a couple room from `public.couple_rooms` when not found in local memory.
- In `src/app/api/health/route.ts`: Create a `GET /api/health` endpoint returning `{ status: 'ok', timestamp, ai: { configuredKeysCount, primaryModel: 'gemini-3.5-flash-lite', modelChain }, supabase: { mode, connected, tablesReady, missingTables } }` without exposing any raw secret API keys.

### R3. Frontend Journal Upgrade (`/me/history`), Accessibility & Admin Health View
- In `src/lib/journal-store.ts`: Add optional `userNote?: string` and `updatedAt?: string` fields to `JournalEntry` and export `updateJournalNote(id: string, note: string): JournalEntry[]`.
- In `src/app/(app)/me/history/page.tsx`:
  - Replace all native `window.confirm()` calls with an accessible, themed inline confirmation modal matching `#13111E` and `#C9A24A`.
  - Add an instant search input allowing users to filter journal entries by question text, card names (Vietnamese or English), or personal notes.
  - Add a "Ghi chú chiêm nghiệm cá nhân" (`userNote`) editor inside the reading detail modal so users can write and save reflections on past readings.
  - Fix the non-standard `top-18` class to `top-20`, add `aria-label` to all icon-only buttons, and include `<CustomCursorFollower />`.
- In `src/app/(admin)/admin/funnel/page.tsx`: Fetch `/api/health` on mount and render a concise System & AI/Supabase Health status banner showing active Gemini keys count, model priority chain, and Supabase table readiness.

### R4. Verification & Git Hygiene
- Preserve all existing invariants: zero occurrences of `#D9B36A` in `src/app` and `src/components`, no `backdrop-blur` on reading cards, and `[0, 350, 700]` ms stagger in `rut-bai`.
- Add unit tests in `tests/golive_audit_verification.test.ts` verifying `GET /api/health`, `updateJournalNote`, and the absence of `window.confirm` in `src/app/(app)/me/history/page.tsx`.
- Never commit `.env.local`.

## Acceptance Criteria

### Type Safety, Unit Tests & Production Build
- [ ] `npx tsc --noEmit` exits with code 0
- [ ] `npx vitest run` passes all 26+ test suites with 0 failures
- [ ] `npm run build` succeeds across all routes with 0 errors
- [ ] Changes are committed and pushed to `origin/main`
