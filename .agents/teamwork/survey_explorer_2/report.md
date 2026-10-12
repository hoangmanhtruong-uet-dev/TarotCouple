# Investigation Report: R2 — Serverless Supabase Read-Through Fallback & Production `/api/health` Endpoint

**Explorer Agent**: survey_explorer_2  
**Date**: 2026-10-12  
**Target Milestone**: R2 (Serverless Supabase Read-Through Fallback & Production `/api/health` Endpoint)  
**Workspace**: `d:\MyProjects\MyProjectToMoney\TarotCouple`

---

## 1. Executive Summary

This report provides a comprehensive architectural and codebase survey for implementing **R2**:
1. **Serverless Supabase Read-Through Fallback** in `src/lib/supabase-hybrid.ts` and `src/app/api/couple/route.ts`.
2. **Supabase OpenAPI Health Check** (`checkSupabaseHealth()`) querying `/rest/v1/` to inspect table existence (`profiles`, `readings`, `couple_rooms`).
3. **Production Diagnostics Endpoint** (`GET /api/health`) reporting system readiness, multi-key AI pool metadata, and Supabase connectivity without leaking sensitive secrets.

### Baseline Health Check:
- Existing test suites: **26 passing test suites (238 tests passed)** via `npx vitest run`.
- TypeScript validation: `npx tsc --noEmit` exits with **code 0 (0 errors)**.
- Production build: `npm run build` compiles **118 static and dynamic routes successfully**.

---

## 2. Codebase & Architectural Analysis

### 2.1 Current Supabase Adapter (`src/lib/supabase-hybrid.ts`)
The application currently operates a hybrid database architecture:
- **Zero-config local fallback**: When `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is absent, the system operates purely in-memory (`local_memory` mode).
- **Existing exported functions**:
  - `getSupabaseConfigStatus(): SupabaseConfigStatus` (line 17): Returns `enabled`, `supabaseUrl`, `hasServiceRoleKey`, `hasAnonKey`, `mode`.
  - `isSupabaseConfigured(): boolean` (line 32): Returns `getSupabaseConfigStatus().enabled`.
  - `syncStarTransactionHybrid(input)` (line 57): Calls PostgreSQL RPC `atomic_star_transaction` via REST.
  - `syncReadingHybrid(params)` (line 143): Fire-and-forget upsert to `public.profiles` and `public.readings`.
  - `syncCoupleRoomHybrid(params)` (line 209): Fire-and-forget upsert to `public.couple_rooms` with `Prefer: resolution=merge-duplicates,return=minimal`.

### 2.2 The Serverless Multi-Instance / Cold-Start Problem
In `src/lib/quota-store.ts`:
- Rooms are stored in a module-level `Map<string, StoredCoupleRoom>` inside `getStore().coupleRooms` (lines 664–667).
- When Person A creates a room via `POST /api/couple` (`create_room`), `saveCoupleRoom` writes to local memory and invokes `syncCoupleRoomHybrid(...)`.
- **The flaw in Serverless / Vercel execution**: Serverless functions are stateless and ephemeral. If Person B opens the link or joins the room on a different serverless instance, or if the instance recycles (cold start), `store.coupleRooms.get(normalizedCode)` returns `undefined`.
- Currently in `src/app/api/couple/route.ts` (lines 72, 150, 219), when `getCoupleRoom(roomCode)` is `undefined`, the API immediately returns `404 ROOM_NOT_FOUND`, causing room join failures even though the room was safely persisted in Supabase!

### 2.3 Supabase Database Schema Verification
Inspected `supabase/migrations/001_tarot_couple_golive_schema.sql`:
- Core tables defined:
  - `public.profiles`: `id TEXT PRIMARY KEY`, `nickname`, `birth_year`, `age_tier`, `stars_balance`, `streak_days`, etc.
  - `public.readings`: `id TEXT PRIMARY KEY`, `user_id REFERENCES profiles`, `reader_id`, `topic`, `deck_mode`, `question_text`, `drawn_cards`, `ai_result`, `clarifier`, `followup_messages`.
  - `public.couple_rooms`: `room_code TEXT PRIMARY KEY`, `owner_id`, `owner_nickname`, `owner_birth_year`, `owner_question_text`, `owner_card_id`, `owner_reversed`, `partner_nickname`, `partner_birth_year`, `partner_card_id`, `partner_reversed`, `bridge_card_id`, `bridge_reversed`, `reader_id`, `status`, `compatibility_score`, `red_flag_level`, `full_reading`, `expires_at`.
- Live Supabase verification:
  - Direct REST inspection of the live database (`https://zyenwgmdghxyrwnniwkv.supabase.co/rest/v1/`) with service credentials confirms that `GET /rest/v1/` returns HTTP 200 with OpenAPI Swagger/OpenAPI spec where `data.definitions` and `data.paths` contain all 6 tables including `profiles`, `readings`, and `couple_rooms`.

---

## 3. Specification & Detailed Design for `checkSupabaseHealth()`

### 3.1 Location & Signature
To be added to `src/lib/supabase-hybrid.ts`:
```ts
export interface SupabaseHealthResult {
  mode: 'hybrid' | 'memory-only';
  connected: boolean;
  tablesReady: boolean;
  missingTables: string[];
}

export async function checkSupabaseHealth(): Promise<SupabaseHealthResult>
```

### 3.2 Verification Algorithm
1. Check configuration via `getSupabaseConfigStatus()`:
   - If not enabled (`!config.enabled || !config.supabaseUrl`), immediately return:
     ```ts
     {
       mode: 'memory-only',
       connected: false,
       tablesReady: false,
       missingTables: ['profiles', 'readings', 'couple_rooms'],
     }
     ```
2. Prepare HTTP request to `${config.supabaseUrl}/rest/v1/`:
   - Headers:
     ```ts
     const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
     headers: {
       apikey: serviceKey,
       Authorization: `Bearer ${serviceKey}`,
       Accept: 'application/openapi+json, application/json',
     }
     ```
   - Timeout: 4000ms using `AbortSignal.timeout(4000)` to prevent blocking health checks.
3. Query OpenAPI schema:
   - PostgREST exposes table schemas under `definitions` (Swagger 2.0), `components.schemas` (OpenAPI 3.0), and endpoint paths under `paths`.
   - Verification check for each table in `['profiles', 'readings', 'couple_rooms']`:
     ```ts
     const hasTable = (name: string): boolean => {
       const inDefs = Boolean(spec?.definitions?.[name]);
       const inPaths = Boolean(spec?.paths?.[`/${name}`]);
       const inSchemas = Boolean(spec?.components?.schemas?.[name]);
       return inDefs || inPaths || inSchemas;
     };
     ```
4. Results evaluation:
   - Filter `CORE_TABLES = ['profiles', 'readings', 'couple_rooms']` where `!hasTable(table)`.
   - If response `res.ok` (HTTP 200):
     ```ts
     return {
       mode: 'hybrid',
       connected: true,
       tablesReady: missingTables.length === 0,
       missingTables,
     };
     ```
   - If network failure, HTTP error (401, 503), or timeout:
     ```ts
     return {
       mode: 'hybrid',
       connected: false,
       tablesReady: false,
       missingTables: ['profiles', 'readings', 'couple_rooms'],
     };
     ```

---

## 4. Specification & Detailed Design for `fetchCoupleRoomFromSupabase(roomCode)`

### 4.1 Location & Signature
To be exported from `src/lib/supabase-hybrid.ts`:
```ts
import type { StoredCoupleRoom } from './quota-store';

export async function fetchCoupleRoomFromSupabase(
  roomCode: string
): Promise<StoredCoupleRoom | null>
```

### 4.2 Query Logic
1. Normalize room code:
   ```ts
   if (!roomCode || typeof roomCode !== 'string') return null;
   const normalizedCode = roomCode.trim().toUpperCase();
   if (!normalizedCode) return null;
   ```
2. If Supabase is disabled (`!isSupabaseConfigured()`), return `null`.
3. Query PostgREST:
   ```ts
   const url = `${baseUrl}/rest/v1/couple_rooms?room_code=eq.${encodeURIComponent(normalizedCode)}&select=*`;
   const res = await fetch(url, {
     method: 'GET',
     headers: {
       apikey: serviceKey,
       Authorization: `Bearer ${serviceKey}`,
     },
     signal: AbortSignal.timeout(4000),
   });
   ```
4. If `!res.ok`, return `null`.
5. Parse `rows` as array; if empty, return `null`.

### 4.3 Mapping Supabase Row to `StoredCoupleRoom`
Row fields mapping:
- **Card Reconstruction**:
  - `ownerCard`: `{ card: TAROT_CARDS_BY_ID[row.owner_card_id] ?? MAJOR_ARCANA[0]!, reversed: Boolean(row.owner_reversed) }`
  - `partnerCard`: if `row.partner_card_id != null`, `{ card: TAROT_CARDS_BY_ID[row.partner_card_id] ?? MAJOR_ARCANA[6]!, reversed: Boolean(row.partner_reversed) }`
  - `connectionCard`: if `row.bridge_card_id != null`, `{ card: TAROT_CARDS_BY_ID[row.bridge_card_id] ?? MAJOR_ARCANA[19]!, reversed: Boolean(row.bridge_reversed) }`
- **Reader Persona**:
  - `readerId`: `toCanonicalDbReaderId(row.reader_id || 'ba_ngoai') as ReaderId`
  - `readerDisplayName`: `READERS_BY_ID[canonicalId]?.name || PERSONA_PROFILES[canonicalId]?.displayName || 'Bà Ngoại'`
- **TTL / Expiry Enforcement**:
  - If `row.status === 'waiting_partner'` and `new Date(row.expires_at).getTime() <= Date.now()`, evaluate `status` as `'expired'`.
- **Full Reading**:
  - Reconstruct `readingResult` and `fullReading` from `row.full_reading` JSONB if room is completed.

### 4.4 Read-Through Fallback Integration Points
In `src/app/api/couple/route.ts`:
Apply fallback at all 3 entry points where `getCoupleRoom(roomCode)` is invoked:
1. **GET `/api/couple`** (around line 72):
   ```ts
   let room = getCoupleRoom(roomCode);
   if (!room) {
     const remoteRoom = await fetchCoupleRoomFromSupabase(roomCode);
     if (remoteRoom) {
       saveCoupleRoom(remoteRoom); // Hydrates memory store
       room = remoteRoom;
     }
   }
   ```
2. **POST `/api/couple` (`action: 'consent_share'`)** (around line 150):
   ```ts
   let room = getCoupleRoom(roomCode);
   if (!room) {
     const remoteRoom = await fetchCoupleRoomFromSupabase(roomCode);
     if (remoteRoom) {
       saveCoupleRoom(remoteRoom);
       room = remoteRoom;
     }
   }
   ```
3. **POST `/api/couple` (`action: 'join_room'`)** (around line 219):
   ```ts
   let room = getCoupleRoom(roomCode);
   if (!room) {
     const remoteRoom = await fetchCoupleRoomFromSupabase(roomCode);
     if (remoteRoom) {
       saveCoupleRoom(remoteRoom);
       room = remoteRoom;
     }
   }
   ```

---

## 5. Specification & Detailed Design for `src/app/api/health/route.ts`

### 5.1 Endpoint Status
- **File path**: `src/app/api/health/route.ts`.
- **Current status**: Does NOT exist yet. Needs to be created.
- **Route directive**: `export const dynamic = 'force-dynamic';` (Must NOT be statically rendered at build time).

### 5.2 Implementation Blueprint
```ts
import { NextResponse } from 'next/server';
import { getValidGeminiApiKeys } from '@/lib/ai-provider';
import { checkSupabaseHealth } from '@/lib/supabase-hybrid';

export const dynamic = 'force-dynamic';

export async function GET() {
  const keys = getValidGeminiApiKeys();
  const supabaseHealth = await checkSupabaseHealth();

  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      ai: {
        configuredKeysCount: keys.length,
        primaryModel: 'gemini-3.5-flash-lite',
        modelChain: [
          'gemini-3.5-flash-lite',
          'gemini-3.1-flash-lite',
          'gemini-3.6-flash',
          'gemini-3-flash-preview',
        ],
      },
      supabase: {
        mode: supabaseHealth.mode,
        connected: supabaseHealth.connected,
        tablesReady: supabaseHealth.tablesReady,
        missingTables: supabaseHealth.missingTables,
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
```

### 5.3 Strict Security & Privacy Invariants
- **Zero Secret Exposure**:
  - Only `keys.length` is returned under `configuredKeysCount`. The actual API key strings are NEVER included.
  - No database passwords, JWT tokens (`eyJ...`), or Service Role keys are exposed.
  - The endpoint is safe for public production consumption and frontend admin monitoring.
- **Integration with R3**:
  - `src/app/(admin)/admin/funnel/page.tsx` will fetch `GET /api/health` on mount and display:
    - AI: `{ai.configuredKeysCount} keys | Primary: {ai.primaryModel}`
    - Supabase: `{supabase.mode} | Connected: {supabase.connected ? 'Yes' : 'No'} | Ready: {supabase.tablesReady ? 'OK' : supabase.missingTables.join(', ')}`

---

## 6. Testing Strategy & Test Coverage

### 6.1 Existing Test Suite Context
- `tests/golive_audit_verification.test.ts` currently tests:
  1. Invariant: 0 occurrences of `#D9B36A`.
  2. Growth Engine canonical 4 readers.
  3. Supabase production SQL migration verification (6 tables, append-only trigger, RPC).
  4. Hybrid Supabase adapter operates cleanly in `local_memory` mode.

### 6.2 New Verification Tests to Add in `tests/golive_audit_verification.test.ts`
1. **Test `GET /api/health`**:
   - Verify HTTP status 200.
   - Verify response schema contains `status: 'ok'`, `timestamp`, `ai`, `supabase`.
   - Verify `ai.primaryModel === 'gemini-3.5-flash-lite'`.
   - Verify `ai.modelChain` contains 4 models.
   - Verify `ai.configuredKeysCount` is a number >= 0.
   - Verify security invariant: `JSON.stringify(response)` contains zero secret tokens (no `eyJ`, no `AIzaSy`).
2. **Test `checkSupabaseHealth()`**:
   - In memory-only environment: returns `mode: 'memory-only'`, `connected: false`, `tablesReady: false`.
   - When mocked with full OpenAPI spec: returns `mode: 'hybrid'`, `connected: true`, `tablesReady: true`, `missingTables: []`.
   - When mocked with partial OpenAPI spec: returns `tablesReady: false`, lists missing tables.
3. **Test `fetchCoupleRoomFromSupabase()`**:
   - Returns `null` when room is not found.
   - Correctly maps table columns into `StoredCoupleRoom` with valid `TarotCard` objects and canonical reader name.
   - Correctly expires rooms when `expires_at` is in the past.
4. **Test Read-Through Fallback in `/api/couple`**:
   - Simulates room absent from local memory.
   - Demonstrates that `GET /api/couple` and `POST /api/couple` successfully fetch and hydrate from Supabase.

---

## 7. Implementation Checklist for R2

| Step | File | Action | Details |
|---|---|---|---|
| 1 | `src/lib/supabase-hybrid.ts` | Add exports | `checkSupabaseHealth()`, `fetchCoupleRoomFromSupabase(roomCode)` |
| 2 | `src/app/api/couple/route.ts` | Integrate fallback | Add `fetchCoupleRoomFromSupabase` fallback at lines 72, 150, 219 and hydrate memory via `saveCoupleRoom` |
| 3 | `src/app/api/health/route.ts` | Create file | Implement `GET /api/health` with `dynamic = 'force-dynamic'` returning safe AI & Supabase diagnostic metrics |
| 4 | `tests/golive_audit_verification.test.ts` | Add test cases | Add tests for `GET /api/health`, `checkSupabaseHealth`, and security assertions |
| 5 | Vitest & Build | Run verification | Confirm `npx tsc --noEmit`, `npx vitest run`, and `npm run build` pass with 0 errors |
