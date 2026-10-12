## 2026-10-12T13:47:21Z
You are worker_m1.
Your working directory is: d:\MyProjects\MyProjectToMoney\TarotCouple\.agents\teamwork\worker_m1
Authoritative user request: d:\MyProjects\MyProjectToMoney\TarotCouple\.agents\teamwork\ORIGINAL_REQUEST.md
Project plan: d:\MyProjects\MyProjectToMoney\TarotCouple\PROJECT.md
Survey findings: d:\MyProjects\MyProjectToMoney\TarotCouple\.agents\teamwork\survey_explorer_1\report.md and d:\MyProjects\MyProjectToMoney\TarotCouple\.agents\teamwork\survey_explorer_1\handoff.md

Scope: Milestone 1 — Backend AI 5-Key Upgrade for Clarifier & Couple Mode in `src/lib/ai-provider.ts`
Write ownership: You own `src/lib/ai-provider.ts` exclusively. Do not modify any other source files.

Task Description:
1. Read ORIGINAL_REQUEST.md, PROJECT.md, and survey_explorer_1's report.md and handoff.md.
2. In `src/lib/ai-provider.ts`:
   - Export `GEMINI_MODEL_CHAIN`:
     ```typescript
     export const GEMINI_MODEL_CHAIN = [
       'gemini-3.5-flash-lite',
       'gemini-3.1-flash-lite',
       'gemini-3.6-flash',
       'gemini-3-flash-preview',
     ] as const;
     ```
   - Upgrade `generateClarifierReading`:
     When `getValidGeminiApiKeys().length > 0 && !process.env.VITEST`:
     Call Google GenAI with the rotated key across candidate models (`GEMINI_MODEL_CHAIN`), requesting structured JSON response `{ interpretation, advice, savageQuote }` for the 4th Clarifier card.
     If offline (`process.env.VITEST`) or if all keys/models fail, cleanly fall back to the deterministic persona template (preserving existing behavior).
   - Upgrade `generateCoupleTarotReading`:
     When `hasValidGeminiApiKey() && !process.env.VITEST`:
     Call `generateTarotReading` with the couple parameters and 5-key rotation chain.
     When live AI succeeds: attach deterministic `computeCoupleEntertainmentMetrics` (`compatibility_score`, `red_flag_level`, `vibe_tag`, `entertainment_note: 'Chỉ để giải trí'`) and return with `usedFallback: false` and the actual `aiModel`.
     When offline or if live AI fails: cleanly fall back to `buildContextualFallbackReading` with `usedFallback: true`.
3. Verification:
   Run `npx tsc --noEmit` and `npx vitest run tests/rut_bai_ritual.test.ts` and `npx vitest run`. All tests must pass with 0 errors.
4. Write your completion report to `d:\MyProjects\MyProjectToMoney\TarotCouple\.agents\teamwork\worker_m1\handoff.md`.
