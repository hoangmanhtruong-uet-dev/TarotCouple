## 2026-10-12T14:09:57Z

You are worker_m2.
Your working directory is: d:\MyProjects\MyProjectToMoney\TarotCouple\.agents\teamwork\worker_m2
Authoritative user request: d:\MyProjects\MyProjectToMoney\TarotCouple\.agents\teamwork\ORIGINAL_REQUEST.md
Project plan: d:\MyProjects\MyProjectToMoney\TarotCouple\PROJECT.md
Survey findings: d:\MyProjects\MyProjectToMoney\TarotCouple\.agents\teamwork\survey_explorer_2\report.md and d:\MyProjects\MyProjectToMoney\TarotCouple\.agents\teamwork\survey_explorer_2\handoff.md

Scope: Milestone 2 — Serverless Supabase Read-Through Fallback & Production `/api/health` Endpoint.
Write ownership: You own `src/lib/supabase-hybrid.ts`, `src/app/api/health/route.ts`, and `src/app/api/couple/route.ts` exclusively. Do not modify other source files.

Task Description:
1. Read ORIGINAL_REQUEST.md, PROJECT.md, and survey_explorer_2's report.md and handoff.md.
2. In `src/lib/supabase-hybrid.ts`:
   - Export `checkSupabaseHealth()`:
     Checks REST connectivity by querying PostgREST OpenAPI spec at `${config.supabaseUrl}/rest/v1/`.
     Checks whether core tables (`profiles`, `readings`, `couple_rooms`) exist in OpenAPI definitions or paths.
     Returns `{ mode: 'hybrid' | 'memory-only', connected: boolean, tablesReady: boolean, missingTables: string[] }`.
     Must safely handle timeouts (e.g. 4s AbortSignal timeout), offline test runs, and missing credentials without throwing.
   - Export `fetchCoupleRoomFromSupabase(roomCode: string)`:
     Fetches room row from `public.couple_rooms` where `room_code = normalizedCode`.
     Maps PostgreSQL columns to `StoredCoupleRoom` using `TAROT_CARDS_BY_ID` and returns `StoredCoupleRoom | null`.
3. In `src/app/api/couple/route.ts`:
   - Integrate read-through fallback at:
     - GET handler (line ~72)
     - consent_share action (line ~150)
     - join_room action (line ~219)
     When local `getCoupleRoom(roomCode)` returns undefined/null, call `await fetchCoupleRoomFromSupabase(roomCode)`.
     If found, hydrate local store via `saveCoupleRoom(room)`.
     If not found, return 404 `ROOM_NOT_FOUND`.
4. In `src/app/api/health/route.ts`:
   - Create dynamic Next.js API route:
     `export const dynamic = 'force-dynamic';`
     `GET()` handler returning:
     ```json
     {
       "status": "ok",
       "timestamp": "<ISO String>",
       "ai": {
         "configuredKeysCount": number,
         "primaryModel": "gemini-3.5-flash-lite",
         "modelChain": ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.6-flash", "gemini-3-flash-preview"]
       },
       "supabase": {
         "mode": "hybrid" | "memory-only",
         "connected": boolean,
         "tablesReady": boolean,
         "missingTables": string[]
       }
     }
     ```
     With `'Cache-Control': 'no-store, max-age=0'`.
     ZERO SECRET LEAKS: Do NOT expose raw API keys, service role keys, or tokens.
5. Verification:
   Run `npx tsc --noEmit` and `npx vitest run`. All tests must pass with 0 errors.
6. Write your completion report to `d:\MyProjects\MyProjectToMoney\TarotCouple\.agents\teamwork\worker_m2\handoff.md`.
