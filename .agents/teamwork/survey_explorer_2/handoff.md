# Handoff Report: R2 — Serverless Supabase Read-Through Fallback & Production `/api/health` Endpoint

**From**: survey_explorer_2  
**To**: Orchestrator (58c8abf6-6619-415c-b64e-e70b2e787b91)  
**Date**: 2026-10-12  
**Handoff Type**: Hard (Task complete)  
**Detailed Findings File**: `d:\MyProjects\MyProjectToMoney\TarotCouple\.agents\teamwork\survey_explorer_2\report.md`

---

## 1. Observation

1. **Supabase Hybrid Configuration & Adapter**:
   - `src/lib/supabase-hybrid.ts` lines 9–30 exports `getSupabaseConfigStatus()` returning `{ enabled, supabaseUrl, hasServiceRoleKey, hasAnonKey, mode }` where `enabled` is `Boolean(url && serviceKey && url.startsWith('http'))`.
   - Lines 57–128: `syncStarTransactionHybrid` calls `${config.supabaseUrl}/rest/v1/rpc/atomic_star_transaction`.
   - Lines 143–204: `syncReadingHybrid` posts to `/rest/v1/profiles` and `/rest/v1/readings`.
   - Lines 209–273: `syncCoupleRoomHybrid` posts to `/rest/v1/couple_rooms` with headers `Prefer: resolution=merge-duplicates,return=minimal`.
   - Neither `checkSupabaseHealth` nor `fetchCoupleRoomFromSupabase` exists in `src/lib/supabase-hybrid.ts`.

2. **In-Memory Store and Serverless Vulnerability**:
   - `src/lib/quota-store.ts` line 207: `coupleRooms: Map<string, StoredCoupleRoom>` inside `getStore()`.
   - `src/lib/quota-store.ts` lines 663–692: `saveCoupleRoom(room)` saves to local memory `Map` and triggers non-blocking `void syncCoupleRoomHybrid(...)`.
   - `src/lib/quota-store.ts` lines 697–712: `getCoupleRoom(roomCode)` only queries local memory `store.coupleRooms.get(normalizedCode)`.
   - `src/app/api/couple/route.ts` line 72 (GET), line 150 (consent_share), line 219 (join_room): calls `getCoupleRoom(roomCode)`. If not in memory, it returns HTTP 404 `ROOM_NOT_FOUND`. In a serverless multi-instance environment (Vercel cold start or request routing to another lambda instance), a room created on instance A is missing from instance B's memory, causing false 404 errors.

3. **Live Supabase OpenAPI Schema at `/rest/v1/`**:
   - Tested live PostgREST endpoint `https://zyenwgmdghxyrwnniwkv.supabase.co/rest/v1/` with service role key:
     `status: 200`, `data.definitions` contains:
     `['quota_usage', 'orders', 'profiles', 'couple_rooms', 'readings', 'wallet_ledger']`.
     `data.paths` contains:
     `['/', '/quota_usage', '/orders', '/profiles', '/couple_rooms', '/readings', '/wallet_ledger', '/rpc/atomic_star_transaction']`.
   - All 3 core tables required by R2 (`profiles`, `readings`, `couple_rooms`) are present in the OpenAPI schema.

4. **Health Endpoint Absence**:
   - Inspected `src/app/api/`: `health/route.ts` does not exist.
   - Requirement from `ORIGINAL_REQUEST.md`: `GET /api/health` returning `{ status: 'ok', timestamp, ai: { configuredKeysCount, primaryModel: 'gemini-3.5-flash-lite', modelChain }, supabase: { mode, connected, tablesReady, missingTables } }` without exposing raw secret API keys.

5. **AI Keys and Model Chain**:
   - `src/lib/ai-provider.ts` lines 987–1009: `getValidGeminiApiKeys()` aggregates `GEMINI_API_KEY`, `GEMINI_API_KEY_2` through `10`, and `GEMINI_API_KEYS`.
   - Lines 1222–1226: Candidate model priority chain starts with `'gemini-3.5-flash-lite'`, followed by `'gemini-3.1-flash-lite'`, `'gemini-3.6-flash'`, `'gemini-3-flash-preview'`.

6. **Current Test Suite and Build Health**:
   - Ran `npx vitest run`: 26 test suites passed (238 tests passed, 0 failed).
   - Ran `npx tsc --noEmit`: 0 errors (exit code 0).
   - Ran `npm run build`: 118 routes generated successfully (exit code 0).

---

## 2. Logic Chain

1. **Why Read-Through Fallback is Mandatory**:
   From Observation 1 and 2, `syncCoupleRoomHybrid` already persists all couple rooms to Supabase PostgreSQL `public.couple_rooms`. However, `getCoupleRoom` only reads from the in-process Node.js `Map`. In serverless deployments, lambda instances are isolated and short-lived. Person B visiting `GET /api/couple?roomCode=...` or submitting `POST /api/couple` (`join_room`) hits a serverless instance where `store.coupleRooms` is empty. Adding `fetchCoupleRoomFromSupabase(roomCode)` and hydrating the local memory store (`saveCoupleRoom(room)`) when `getCoupleRoom` returns `undefined` guarantees seamless room discovery across all serverless invocations.

2. **How to Map Supabase `couple_rooms` Row to `StoredCoupleRoom`**:
   From Observation 3 and `supabase/migrations/001_tarot_couple_golive_schema.sql`, the PostgreSQL row has `owner_card_id`, `owner_reversed`, `partner_card_id`, `partner_reversed`, `bridge_card_id`, `bridge_reversed`, `reader_id`, `status`, `expires_at`, and `full_reading`. Using `TAROT_CARDS_BY_ID[cardId] ?? MAJOR_ARCANA[defaultId]` and `toCanonicalDbReaderId` / `READERS_BY_ID[canonicalId].name`, the Supabase row maps deterministically to a valid `StoredCoupleRoom` object without loss of data. If `expires_at <= now()`, status automatically transitions to `'expired'`.

3. **How `checkSupabaseHealth()` Works**:
   From Observation 1 and 3, querying `GET ${supabaseUrl}/rest/v1/` with `apikey` and `Authorization` headers returns PostgREST's OpenAPI spec with HTTP 200. Testing `spec.definitions[t] || spec.paths['/' + t] || spec.components?.schemas?.[t]` for each of `['profiles', 'readings', 'couple_rooms']` verifies both REST connectivity and database schema readiness. If Supabase is unconfigured, it safely returns `{ mode: 'memory-only', connected: false, tablesReady: false, missingTables: ['profiles', 'readings', 'couple_rooms'] }`.

4. **Health Endpoint Design & Security**:
   From Observation 4 and 5, `src/app/api/health/route.ts` can invoke `getValidGeminiApiKeys().length` to get `configuredKeysCount`, declare `primaryModel: 'gemini-3.5-flash-lite'`, and call `await checkSupabaseHealth()`. Because only counts, metadata, and status booleans are placed in the JSON response, no secrets (`AIzaSy...` or `eyJ...`) are ever leaked.

---

## 3. Caveats

- In unit test environments (`process.env.VITEST = 'true'`), `fetch` calls to Supabase should either be mocked or gracefully fallback to `memory-only` / `null` without throwing unhandled rejections.
- Next.js route caching: `src/app/api/health/route.ts` must declare `export const dynamic = 'force-dynamic';` and include `'Cache-Control': 'no-store'` so Vercel does not statically cache health check results.

---

## 4. Conclusion

The survey for R2 is complete and verified against the live codebase and Supabase database. The implementation blueprint is fully documented in `report.md`:
1. Export `checkSupabaseHealth()` and `fetchCoupleRoomFromSupabase(roomCode: string)` from `src/lib/supabase-hybrid.ts`.
2. Integrate read-through fallback into `src/app/api/couple/route.ts` at lines 72, 150, and 219.
3. Create `src/app/api/health/route.ts` exporting dynamic `GET` handler returning AI and Supabase diagnostics.
4. Add unit test assertions in `tests/golive_audit_verification.test.ts`.

---

## 5. Verification Method

To independently verify the implementation:
1. **Type Check**:
   ```powershell
   npx tsc --noEmit
   ```
   Must exit with code 0.
2. **Unit Tests**:
   ```powershell
   npx vitest run tests/golive_audit_verification.test.ts
   npx vitest run
   ```
   Must pass all tests with 0 failures.
3. **Endpoint Verification**:
   ```powershell
   npx tsx -e "import { GET } from './src/app/api/health/route'; GET().then(r => r.json()).then(console.log)"
   ```
   Must print `{ status: 'ok', timestamp: '...', ai: { configuredKeysCount: ..., primaryModel: 'gemini-3.5-flash-lite', modelChain: [...] }, supabase: { mode: '...', connected: ..., tablesReady: ..., missingTables: [...] } }`.
4. **Production Build**:
   ```powershell
   npm run build
   ```
   Must compile all routes including `/api/health` without errors.
