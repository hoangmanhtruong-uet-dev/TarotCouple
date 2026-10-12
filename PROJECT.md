# Project: Tarot Couple - Full-Stack Audit Fix & Go-Live Upgrade

## Architecture
- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Backend AI Engine**: `src/lib/ai-provider.ts` with 5-key rotation (`GEMINI_API_KEY` 1..10, `GEMINI_API_KEYS`) and candidate model chain (`gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-3.6-flash`, `gemini-3-flash-preview`), guarded with deterministic fallback when offline (`!process.env.VITEST`).
- **Data Persistence**: Hybrid Supabase architecture (`src/lib/supabase-hybrid.ts`, `src/lib/quota-store.ts`) with PostgreSQL tables (`profiles`, `readings`, `couple_rooms`) and serverless read-through fallback to eliminate cold-start 404s.
- **Diagnostics API**: `src/app/api/health/route.ts` providing production system health status without exposing sensitive API keys.
- **Frontend History & Reflection**: `src/lib/journal-store.ts` and `src/app/(app)/me/history/page.tsx` with local storage persistence, accessible themed confirmation dialogs (`#13111E`, `#C9A24A`), instant multi-field search, and personal reflection note editor.
- **Admin Diagnostics**: `src/app/(admin)/admin/funnel/page.tsx` and `src/components/FunnelAnalyticsModal.tsx` showing live health banner.
- **UI Invariants**: Strict dark mystic palette (`#13111E`, `#C9A24A`, `#E6CA65`, zero `#D9B36A`), 60 FPS mobile performance (zero `backdrop-blur` on reading cards), and exact `[0, 350, 700]` ms ritual stagger.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | GEMINI_MODEL_CHAIN export | Export model priority chain `['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3-flash-preview']` | M1 | Survey R1 |
| 2 | Clarifier 5-Key AI Upgrade | `generateClarifierReading` uses 5-key rotation for 4th card structured JSON with deterministic persona template fallback | M1 | Survey R1 |
| 3 | Couple Mode AI Live Integration | `generateCoupleTarotReading` invokes `generateTarotReading` with 5-key chain, attaches couple metrics, preserves `usedFallback: false` | M1 | Survey R1 |
| 4 | Supabase Health Check | `checkSupabaseHealth()` inspects PostgREST OpenAPI spec for `profiles`, `readings`, `couple_rooms` | M2 | Survey R2 |
| 5 | Supabase Room Read-Through | `fetchCoupleRoomFromSupabase(roomCode)` retrieves room on cache miss to prevent serverless 404s | M2 | Survey R2 |
| 6 | Couple Route Cache Hydration | Integrate read-through fallback into `src/app/api/couple/route.ts` at GET, consent, and join | M2 | Survey R2 |
| 7 | Production Health Endpoint | `GET /api/health` returning system, AI key count/chain, and Supabase health without leaking secrets | M2 | Survey R2 |
| 8 | Journal Store Note Extension | Add `userNote?: string`, `updatedAt?: string` to `JournalEntry` and export `updateJournalNote` | M3 | Survey R3 |
| 9 | History Modal Confirmation | Replace `window.confirm` with accessible `#13111E`/`#C9A24A` alertdialog modal | M3 | Survey R3 |
| 10 | History Instant Search | Client-side search across question, card names (VN/EN), and personal notes | M3 | Survey R3 |
| 11 | History Personal Note Editor | Textarea inside reading detail modal to view and update reflections | M3 | Survey R3 |
| 12 | History Accessibility & Styling | Replace `top-18` with `top-20`, add `aria-label` to icon buttons, include `<CustomCursorFollower />` | M3 | Survey R3 |
| 13 | Admin Funnel Health Banner | Fetch `/api/health` and display status banner in `/admin/funnel` | M3 | Survey R3 |
| 14 | Invariant: Zero #D9B36A | Strict palette check ensuring zero deprecated gold occurrences in `src/app` and `src/components` | M4 | Survey R4 |
| 15 | Invariant: No Backdrop Blur | Maintain zero `backdrop-blur` on 3D reading cards | M4 | Survey R4 |
| 16 | Invariant: Ritual Stagger | Maintain exact `[0, 350, 700]` ms card reveal stagger in `rut-bai` | M4 | Survey R4 |
| 17 | Golive Audit Verification Tests | Add comprehensive tests in `tests/golive_audit_verification.test.ts` for health endpoint, note updates, and no `window.confirm` | M4 | Survey R4 |
| 18 | Acceptance Verification | Verify `tsc --noEmit`, all 26+ vitest test suites, `npm run build` | M4 | Survey Acceptance |
| 19 | Git Hygiene & Origin Push | Never commit `.env.local`, commit all changes cleanly and push to `origin/main` | M4 | Survey Acceptance |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend AI 5-Key Upgrade | Features 1, 2, 3 (`src/lib/ai-provider.ts`) | none | DONE |
| M2 | Supabase Read-Through & /api/health | Features 4, 5, 6, 7 (`src/lib/supabase-hybrid.ts`, `src/app/api/health/route.ts`, `src/app/api/couple/route.ts`) | none | DONE |
| M3 | Frontend Journal Upgrade & Admin Health | Features 8, 9, 10, 11, 12, 13 (`src/lib/journal-store.ts`, `src/app/(app)/me/history/page.tsx`, `src/app/(admin)/admin/funnel/page.tsx`, `src/components/FunnelAnalyticsModal.tsx`) | M2 (for /api/health) | IN_PROGRESS |
| M4 | Final Milestone: Verification & Git Push | Features 14, 15, 16, 17, 18, 19 (`tests/golive_audit_verification.test.ts`, UI invariants audit, vitest, tsc, build, git commit & push) | M1, M2, M3 | PLANNED |

## Interface Contracts
### `src/lib/ai-provider.ts` ↔ API Routes & Consumers
```typescript
export const GEMINI_MODEL_CHAIN: readonly string[] = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-3-flash-preview',
];

export async function generateClarifierReading(
  params: GenerateClarifierParams
): Promise<ClarifierReadingResult>;
// Returns: { reading: string, clarifierCard: DrawnCard, interpretation: string, advice: string, savageQuote: string, effectivePersona: string, ageTier: string, aiModel: string, tokensIn: number, tokensOut: number, usedFallback: boolean, retryCount: number }

export async function generateCoupleTarotReading(
  params: GenerateCoupleReadingParams
): Promise<GenerateCoupleReadingResult>;
// When live AI succeeds: usedFallback: false, aiModel matches candidate model
// When fallback: usedFallback: true, aiModel: 'couple-compatibility-engine-v2'
```

### `src/lib/supabase-hybrid.ts` ↔ `/api/health` & `/api/couple`
```typescript
export interface SupabaseHealthResult {
  mode: 'hybrid' | 'memory-only';
  connected: boolean;
  tablesReady: boolean;
  missingTables: string[];
}

export async function checkSupabaseHealth(): Promise<SupabaseHealthResult>;

export async function fetchCoupleRoomFromSupabase(
  roomCode: string
): Promise<StoredCoupleRoom | null>;
```

### `src/app/api/health/route.ts` ↔ Consumers
```typescript
export interface HealthResponse {
  status: 'ok';
  timestamp: string;
  ai: {
    configuredKeysCount: number;
    primaryModel: string;
    modelChain: readonly string[];
  };
  supabase: {
    mode: 'hybrid' | 'memory-only';
    connected: boolean;
    tablesReady: boolean;
    missingTables: string[];
  };
}
```

### `src/lib/journal-store.ts` ↔ `/me/history`
```typescript
export interface JournalEntry {
  // existing fields...
  userNote?: string;
  updatedAt?: string;
}

export function updateJournalNote(id: string, note: string): JournalEntry[];
```

## Code Layout
- `src/lib/ai-provider.ts`: Owned exclusively by Milestone 1 Worker
- `src/lib/supabase-hybrid.ts`: Owned exclusively by Milestone 2 Worker
- `src/app/api/health/route.ts`: Owned exclusively by Milestone 2 Worker
- `src/app/api/couple/route.ts`: Owned exclusively by Milestone 2 Worker
- `src/lib/journal-store.ts`: Owned exclusively by Milestone 3 Worker
- `src/app/(app)/me/history/page.tsx`: Owned exclusively by Milestone 3 Worker
- `src/app/(admin)/admin/funnel/page.tsx`: Owned exclusively by Milestone 3 Worker
- `src/components/FunnelAnalyticsModal.tsx`: Owned exclusively by Milestone 3 Worker
- `tests/golive_audit_verification.test.ts`: Owned exclusively by Milestone 4 Worker
