# Handoff Report: Milestone 2 — Serverless Room Hydration & Network Resilience

**Challenger**: challenger_2_m2  
**Recipient**: Orchestrator (`58c8abf6-6619-415c-b64e-e70b2e787b91`)  
**Date**: 2026-10-12  
**Handoff Type**: Hard (Empirical stress verification complete)  
**Empirical Verdict**: **APPROVE**  

---

## 1. Observation

1. **Target Implementations Inspected**:
   - `src/lib/supabase-hybrid.ts` (lines 380–585):
     - `fetchCoupleRoomFromSupabase(roomCode)` implements code normalization (`roomCode.trim().toUpperCase()`), URL encoding (`encodeURIComponent`), 4s network abort timeout, Tarot card mapping with safe fallbacks (`TAROT_CARDS_BY_ID[ownerCardId] ?? MAJOR_ARCANA[0]!`, `TAROT_CARDS_BY_ID[partner_card_id] ?? MAJOR_ARCANA[6]!`, `TAROT_CARDS_BY_ID[bridge_card_id] ?? MAJOR_ARCANA[19]!`), canonical persona ID normalization (`toCanonicalDbReaderId`), and 48h TTL expiration calculation (`status === 'waiting_partner' && expiresAtMs > 0 && expiresAtMs <= nowMs`).
   - `src/app/api/couple/route.ts`:
     - Line 73–80: `GET` route invokes `fetchCoupleRoomFromSupabase(roomCode)` on local cache miss (`!room`) and hydrates in-memory store via `saveCoupleRoom(remoteRoom)`.
     - Line 159–166: `POST` `consent_share` handler invokes `fetchCoupleRoomFromSupabase(roomCode)` on local cache miss and hydrates memory via `saveCoupleRoom(remoteRoom)`.
     - Line 236–243: `POST` `join_room` handler invokes `fetchCoupleRoomFromSupabase(roomCode)` on local cache miss and hydrates memory via `saveCoupleRoom(remoteRoom)`.
     - Lines 91–102 & 254–266: Returns HTTP 410 `ROOM_EXPIRED` if the room has expired.

2. **Empirical Stress Test Harness Created**:
   - `tests/m2_empirical_resilience_adversarial.test.ts` (22 comprehensive adversarial tests):
     - **Suite 1: Room Code Normalization**:
       - Verified trimming leading/trailing whitespace (`"  luv892  "`, `"\tluv892\n"`), mixed-case (`"Luv892"`), query URL encoding (`room_code=eq.LUV%2B99%26X%3D1`), and non-string/blank rejection (`null`, `undefined`, `""`, `123`, `{}`) without issuing network requests.
     - **Suite 2: Card Mapping & Missing Card ID Fallbacks**:
       - Verified Major Arcana cards (0: The Fool, 6: The Lovers, 19: The Sun) and card orientation booleans.
       - Verified fallback of missing/null/negative/out-of-bounds `owner_card_id` to The Fool (`id: 0`).
       - Verified omission of `partnerCard` and `connectionCard` when partner/bridge IDs are not provided in the DB row.
       - Verified fallback of out-of-bounds `partner_card_id` to The Lovers (`id: 6`) and `bridge_card_id` to The Sun (`id: 19`).
       - Verified Minor Arcana resolution and automatic promotion of `deckMode` to `'full_78'`.
     - **Suite 3: Expiry Calculation & 48h TTL**:
       - Verified `waiting_partner` room transitions to `'expired'` if `expires_at` is in the past (> 48h).
       - Verified active `waiting_partner` room remains active if `expires_at` is in the future.
       - Verified completed rooms remain `'completed'` even after `expires_at` passes.
       - Verified fallback 48h ISO string when `expires_at` in DB is null or malformed.
       - Verified HTTP 410 `ROOM_EXPIRED` returned in both `GET /api/couple` and `POST /api/couple` (`join_room`).
     - **Suite 4: Serverless Read-Through Fallback & Cache Miss Hydration**:
       - Simulated cache miss in `quotaStore` (`resetAllQuotaStoreForTesting()`).
       - Verified first request triggers `fetchCoupleRoomFromSupabase` (1 GET request to Supabase), hydrates memory via `saveCoupleRoom`, and stores in `quotaStore`.
       - Verified subsequent request hits memory cache with exactly 0 additional GET requests to Supabase.
       - Verified Person B joining a room on a fresh instance successfully hydrates memory, draws cards, runs reading, and transitions room to `'completed'`.
       - Verified `consent_share` hydrates memory and updates consent flags.
       - Verified graceful handling (HTTP 404 `ROOM_NOT_FOUND`) during network timeouts or Supabase HTTP 500 errors without throwing unhandled exceptions.
     - **Suite 5: Persona Mapping & Privacy**:
       - Verified canonicalization of `ba_co_mo_hon`, `ba_ngoai_vui_tinh`, `tong_tai_ly_tri`, `phap_su_toi_co`, and unknown readers.
       - Verified Person A's private question is NEVER leaked in public room view.

3. **Empirical Execution Commands & Outputs**:
   - `npx vitest run tests/m2_empirical_resilience_adversarial.test.ts`:
     - Result: `22 passed (22)`, Exit code 0.
   - `npx tsc --noEmit`:
     - Result: Exit code 0 (0 compilation errors).
   - Full test suite `npx vitest run`:
     - Result: `32 passed (32)`, `354 passed (354)`, Exit code 0.

---

## 2. Logic Chain

1. **Serverless Multi-Instance Consistency**:
   In serverless runtimes (e.g., Vercel Lambdas), separate HTTP requests may land on distinct isolates. A room created on Instance A exists only in Instance A's memory. When Instance B receives a `GET /api/couple`, `POST join_room`, or `POST consent_share` for that room, local `getCoupleRoom(roomCode)` initially returns `undefined`. By invoking `fetchCoupleRoomFromSupabase(roomCode)` and then `saveCoupleRoom(remoteRoom)`, Instance B hydrates its local in-memory map. Subsequent requests to Instance B hit the memory cache without incurring database roundtrips.

2. **Defensive Normalization Prevents False 404s**:
   User input for room codes often includes unintentional leading/trailing whitespace or lowercase letters from mobile auto-correct. Trimming and uppercase normalization ensure that queries to Supabase PostgREST (`room_code=eq.CODE`) and local cache lookups always match canonical uppercase keys, preventing 404 errors due to casing discrepancies.

3. **Deterministic Card Fallback Invariant**:
   If a database row contains missing or corrupted card IDs (e.g. from partial schema migrations), `fetchCoupleRoomFromSupabase` guarantees that `ownerCard` falls back to `MAJOR_ARCANA[0]` (The Fool), `partnerCard` falls back to `MAJOR_ARCANA[6]` (The Lovers), and `bridgeCard` falls back to `MAJOR_ARCANA[19]` (The Sun). The domain entity is always structurally valid and safe for downstream AI reading generation.

4. **Temporal Expiration Invariant**:
   Even if the database has not executed a background cleanup job, the application independently evaluates `expiresAtMs <= nowMs` for rooms in `waiting_partner` state. The status transitions to `'expired'` and returns HTTP 410 Gone, enforcing the 48-hour room lifespan requirement.

---

## 3. Caveats

- **No Caveats**: All tasks specified in the dispatch have been empirically verified and stress-tested with concrete assertions. No implementation files outside the scope were modified.

---

## 4. Conclusion

**Verdict: APPROVE**

Milestone 2 successfully satisfies all requirements for Serverless Room Hydration, PostgREST read-through fallback, defensive card mapping, 48h TTL state transitions, and network resilience. All 354 automated tests pass and TypeScript compiles cleanly with zero errors.

---

## 5. Verification Method

To independently reproduce the empirical verification:

1. **Run the Milestone 2 Empirical Resilience Adversarial Suite**:
   ```powershell
   npx vitest run tests/m2_empirical_resilience_adversarial.test.ts
   ```
   *Expected*: All 22 adversarial tests pass with exit code 0.

2. **Run TypeScript Type Check**:
   ```powershell
   npx tsc --noEmit
   ```
   *Expected*: Exit code 0 with 0 errors.

3. **Run Entire Repository Test Suite**:
   ```powershell
   npx vitest run
   ```
   *Expected*: 32 test files pass (354 passed tests), 0 failures.
