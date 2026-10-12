# Adversarial Review & Critic Handoff Report: Milestone 2 — Serverless Supabase Read-Through Fallback & `/api/health`

**Reviewer / Critic**: reviewer_2_m2  
**Recipient**: Orchestrator (`58c8abf6-6619-415c-b64e-e70b2e787b91`)  
**Date**: 2026-10-12  
**Verdict**: **APPROVE**  
**Handoff Type**: Hard (Review complete)

---

## 1. Observation

1. **Implementation Files Inspected**:
   - `src/lib/supabase-hybrid.ts`:
     - Lines 287–292: `SupabaseHealthResult` interface defines `{ mode: 'hybrid' | 'memory-only', connected: boolean, tablesReady: boolean, missingTables: string[] }`.
     - Lines 294: `const CORE_SUPABASE_TABLES = ['profiles', 'readings', 'couple_rooms'];`.
     - Lines 300–373: `checkSupabaseHealth()` queries `${baseUrl}/rest/v1/` with `AbortSignal.timeout(4000)`, gracefully handling missing credentials (`mode: 'memory-only'`), network timeouts/rejections, and inspecting both OpenAPI 3.0 (`components.schemas`) and Swagger 2.0 (`definitions`, `paths`) formats.
     - Lines 380–585: `fetchCoupleRoomFromSupabase(roomCode)` performs parameterized PostgREST querying (`room_code=eq.${encodeURIComponent(normalizedCode)}&select=*`), handles card id fallbacks (`TAROT_CARDS_BY_ID[id] ?? MAJOR_ARCANA[0]`), canonicalizes legacy reader IDs (`toCanonicalDbReaderId`), evaluates 48-hour expiration TTL (`expiresAtMs <= nowMs -> status = 'expired'`), and reconstructs complete `StoredCoupleRoom` domain entities.
   - `src/app/api/health/route.ts`:
     - Line 5: `export const dynamic = 'force-dynamic';`.
     - Lines 23–49: `GET()` handler returns `{ status: 'ok', timestamp, ai: { configuredKeysCount, primaryModel: 'gemini-3.5-flash-lite', modelChain }, supabase }` with response header `'Cache-Control': 'no-store, max-age=0'`.
     - String scanning verified zero exposure of API keys (`AIzaSy...`), JWTs (`eyJ...`), or database connection strings.
   - `src/app/api/couple/route.ts`:
     - Lines 73–80: `GET` handler falls back to `fetchCoupleRoomFromSupabase(roomCode)` and executes in-memory hydration via `saveCoupleRoom(remoteRoom)`.
     - Lines 159–166: `POST` with `action: 'consent_share'` falls back to `fetchCoupleRoomFromSupabase(roomCode)` and hydrates via `saveCoupleRoom(remoteRoom)`.
     - Lines 236–243: `POST` with `action: 'join_room'` falls back to `fetchCoupleRoomFromSupabase(roomCode)` and hydrates via `saveCoupleRoom(remoteRoom)`.

2. **Integrity Audit**:
   - Scanned all modified code for integrity violations:
     - No hardcoded test responses or facade mocks embedded in source files.
     - Dynamic querying of PostgREST OpenAPI spec and live table reconstruction.
     - Verified zero self-certifying work; implementation logic is fully functional and generic.

3. **Adversarial Stress Testing Execution**:
   - Created independent test suite `tests/m2_adversarial_stress.test.ts` (20 tests) testing:
     - Edge case 1.1–1.5: Offline unconfigured credentials, non-HTTP URLs, network connection refused (`ECONNREFUSED`), 401/500/502 HTTP errors, and non-JSON HTML error pages from Cloudflare/proxies.
     - Edge case 1.6–1.8: OpenAPI 3.0 `components.schemas`, Swagger 2.0 `definitions`, and partial missing table detection.
     - Edge case 2.1–2.2: Malformed input types and SQL injection attempts (`LUV123' OR '1'='1; DROP TABLE...`) safely URL-encoded.
     - Edge case 2.3–2.5: Full domain entity reconstruction, out-of-bounds card IDs, obsolete reader IDs canonicalization, and expired TTL auto-transition.
     - Edge case 3.1–3.2: Rigorous `/api/health` secret isolation: zero tokens exposed even when mock secrets are set in environment.
     - Edge case 4.1–4.5: Serverless read-through fallback across `GET`, `join_room`, and `consent_share`, cache miss 404, and expired 410 handling.
   - Result: 20 passed out of 20 tests.

4. **Fresh Verification Commands Output**:
   - `npx tsc --noEmit`: Exited with code 0 (0 compilation errors).
   - `npx vitest run`: Exited with code 0 (32 test suites passed, 354 tests passed, 0 failed).

---

## 2. Logic Chain

1. **From Observation 1 & 3 to Concurrency & Serverless Safety**:
   In serverless functions, instances lack shared memory. When a client requests a couple room created on another instance, local `getCoupleRoom` returns `undefined`. By invoking `await fetchCoupleRoomFromSupabase(roomCode)` and then calling `saveCoupleRoom(remoteRoom)`, the remote room is fetched from PostgreSQL and hydrated into the instance's local memory store. Subsequent lookups in that container instance hit the memory cache. If multiple requests arrive concurrently on a cold instance, each independently queries Supabase and updates the map idempotently without collision.

2. **From Observation 1 & 3 to Security & Secret Isolation**:
   `/api/health` derives `configuredKeysCount: keys.length` as a primitive integer. No token substring is included in the payload. Testing confirmed that setting `AIzaSy...` and service role JWTs does not bleed into the output JSON. Response headers contain `'Cache-Control': 'no-store, max-age=0'`, preventing CDN/browser caching of diagnostics.

3. **From Observation 1 & 3 to Network Resilience**:
   `checkSupabaseHealth` and `fetchCoupleRoomFromSupabase` wrap all network calls in `try ... catch` and attach `AbortSignal.timeout(4000)`. When DNS resolution fails, connection is refused, or timeout occurs, `checkSupabaseHealth` returns `{ mode: 'hybrid', connected: false, tablesReady: false, missingTables: [...] }`, and `fetchCoupleRoomFromSupabase` returns `null`. Neither method ever throws an unhandled rejection.

4. **From Observation 2 & 4 to Approval Verdict**:
   With 0 integrity violations, complete implementation of the specifications in `ORIGINAL_REQUEST.md` (R2) and `PROJECT.md` (Features 4, 5, 6, 7), clean TypeScript compilation, and 354 passing unit tests, the implementation is robust and ready for production.

---

## 3. Caveats

- **Network Latency Upper Bound**: The `AbortSignal.timeout` is configured to 4000ms. In high-latency or slow-responding network environments, cold cache misses will block up to 4 seconds before returning 404. This is safe and standard for database fallbacks.
- **No Caveats**: No other assumptions or uninvestigated areas.

---

## 4. Conclusion

**Verdict: APPROVE**

Milestone 2 fulfills all requirements:
1. `checkSupabaseHealth()` safely inspects PostgREST OpenAPI specs for `profiles`, `readings`, and `couple_rooms` with zero secret exposure.
2. `fetchCoupleRoomFromSupabase()` reconstructs couple room domain entities and handles corrupted card IDs, legacy reader IDs, and TTL expiration.
3. Serverless read-through fallback is fully integrated into `src/app/api/couple/route.ts` across `GET`, `consent_share`, and `join_room`.
4. Production `/api/health` endpoint is live, typed, non-cacheable, and leaks zero secrets.
5. All verification commands pass cleanly (`tsc --noEmit` exit 0, `vitest run` 354/354 passed).

---

## 5. Verification Method

To independently reproduce and verify this review:

1. **TypeScript Type Check**:
   ```powershell
   npx tsc --noEmit
   ```
   *Expected*: Exit code 0, 0 errors.

2. **Adversarial Stress Test Suite**:
   ```powershell
   npx vitest run tests/m2_adversarial_stress.test.ts
   ```
   *Expected*: 20 tests pass.

3. **Complete Test Suite**:
   ```powershell
   npx vitest run
   ```
   *Expected*: 32 test files pass, 354 tests pass.

4. **Health Endpoint Secret Isolation Check**:
   ```powershell
   npx tsx -e "import { GET } from './src/app/api/health/route'; GET().then(r => r.json()).then(data => { if (JSON.stringify(data).includes('AIzaSy')) throw new Error('Secret leak!'); console.log('Health check passed cleanly:', data); })"
   ```
   *Expected*: Outputs valid health payload without secret strings.
