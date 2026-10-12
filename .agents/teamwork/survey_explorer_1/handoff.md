# Handoff Report: R1 Backend AI 5-Key Upgrade Survey

**From**: `survey_explorer_1`  
**To**: Orchestrator / Backend Implementer  
**Date**: 2026-10-12  
**Handoff Type**: Hard (Task Complete)  

---

## 1. Observation

1. **Key Loading Implementation**:
   - `src/lib/ai-provider.ts` lines 987–1009 implements `getValidGeminiApiKeys(): string[]`. It extracts keys from `process.env.GEMINI_API_KEY`, `process.env.GEMINI_API_KEY_2` through `process.env.GEMINI_API_KEY_10`, and `process.env.GEMINI_API_KEYS`.
   - Lines 1011–1021 implements `isValidKeyString(key: string): boolean`, rejecting keys < 15 chars and placeholders (`'your_gemini_api_key_here'`, `'YOUR_API_KEY'`, and `'placeholder*'`).
   - Line 1023 defines module-level `let currentApiKeyIndex = 0;` rotated on line 1237 via `(currentApiKeyIndex + 1) % (availableKeys.length || 1)`.

2. **Current `generateClarifierReading`**:
   - `src/lib/ai-provider.ts` lines 1533–1636 implements `generateClarifierReading(params: GenerateClarifierParams): Promise<ClarifierReadingResult>`.
   - It normalizes card input with `normalizeDrawnCard(...)` and determines `effectivePersona` via `classifyAgeTier(birthYear, undefined, readerId)`.
   - **Crucial observation**: Lines 1568–1620 directly assigns `interpretation`, `advice`, and `savageQuote` using static string templates. It contains **no Google GenAI SDK call** (`new GoogleGenAI(...)`), no model rotation, and never checks `getValidGeminiApiKeys()`.

3. **Current `generateCoupleTarotReading`**:
   - `src/lib/ai-provider.ts` lines 1415–1491 implements `generateCoupleTarotReading(params: GenerateCoupleReadingParams): Promise<GenerateCoupleReadingResult>`.
   - It directly calls `buildContextualFallbackReading(...)` (line 1441) and computes `metrics = computeCoupleEntertainmentMetrics(normalizedCards, relStatus)` (line 1455).
   - Lines 1480–1490 returns:
     ```typescript
     return {
       reading: coupleReading,
       result: coupleReading,
       effectivePersona,
       ageTier,
       aiModel: 'couple-compatibility-engine-v2',
       tokensIn: 0,
       tokensOut: 0,
       usedFallback: true,
       retryCount: 0,
     };
     ```
   - **Crucial observation**: It **never calls `generateTarotReading`**, always sets `usedFallback: true`, and never performs live AI generation regardless of whether keys are present.

4. **API Route Usage in `src/app/api/couple/route.ts`**:
   - Line 332 (`coop_invite` / `join_room` action) and Line 657 (`solo_couple` action) both invoke `generateCoupleTarotReading`.
   - Lines 391–397 and 703–709 populate `readingResponse.aiMeta`:
     ```typescript
     aiMeta: {
       model: coupleAi.aiModel,
       tokensIn: coupleAi.tokensIn,
       tokensOut: coupleAi.tokensOut,
       usedFallback: coupleAi.usedFallback,
       retryCount: coupleAi.retryCount,
     }
     ```
   - When `usedFallback: false` is returned by `generateCoupleTarotReading`, the API response automatically surfaces `usedFallback: false` and the live `model` name.

5. **Test Status and Offline Invariant**:
   - `npx vitest run` currently executes **26 test files (238 passed, 0 failed, 10.72s duration)**.
   - Vitest automatically sets `process.env.VITEST = 'true'`.
   - `npx tsc --noEmit` exits with status 0.
   - `tests/rut_bai_ritual.test.ts:74-77` asserts that `'gemini-3.5-flash-lite'`, `'gemini-3.1-flash-lite'`, `'gemini-3.6-flash'`, and `GEMINI_API_KEY_${i}` exist in `src/lib/ai-provider.ts`.

---

## 2. Logic Chain

1. **Observation 1 & 2 -> Clarifier Upgrade Path**:
   Because `generateClarifierReading` is currently 100% deterministic, upgrading it requires checking `getValidGeminiApiKeys().length > 0 && !process.env.VITEST`. When true, it should initiate a loop over rotated keys and candidate models `['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3-flash-preview']`, requesting a structured JSON schema `{ interpretation, advice, savageQuote }`.
   If `!process.env.VITEST` is false (such as in Vitest unit tests) or all API attempts fail, the existing lines 1568–1620 provide an immediate, battle-tested fallback template that guarantees 0 regressions.

2. **Observation 1, 3 & 4 -> Couple Tarot Upgrade Path**:
   Because `generateTarotReading` already encapsulates the 5-key multi-key round-robin rotation, model failover, and Zod output validation, `generateCoupleTarotReading` can delegate directly to `generateTarotReading` when `hasValidGeminiApiKey() && !process.env.VITEST`.
   Upon success (`!liveReadingRes.usedFallback`), attaching `computeCoupleEntertainmentMetrics` (`compatibility_score`, `red_flag_level`, `vibe_tag`, `entertainment_note: 'Chỉ để giải trí'`) produces a live reading with `usedFallback: false`. If keys are absent, offline, or fail, falling back to `buildContextualFallbackReading` preserves `usedFallback: true` and `aiModel: 'couple-compatibility-engine-v2'`.

3. **Observation 5 -> Test Guardrails**:
   Because Vitest sets `process.env.VITEST = 'true'`, guarding live network requests with `!process.env.VITEST` ensures all 26 existing test suites continue to pass with 0 timeouts or network flakiness.

---

## 3. Caveats

- In `generateCoupleTarotReading`, the question text passed to `generateTarotReading` should use `params.questionText` if provided; otherwise, use `Soi tần số kết nối giữa ${ownerNick} và ${partnerNick} (${relLabel}).` to ensure the AI focuses on romantic compatibility rather than generic advice.
- When `generateTarotReading` succeeds for Couple mode, its `greeting_hook` should be checked; if generic, prepend/replace with the couple-specific greeting to keep consistent branding.
- No source code edits were performed during this survey phase (strictly read-only investigation).

---

## 4. Conclusion

The upgrade for R1 is clean, highly modular, and carries very low regression risk:
1. Export constant `GEMINI_MODEL_CHAIN = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3-flash-preview'] as const` from `src/lib/ai-provider.ts`.
2. In `generateClarifierReading`: when `getValidGeminiApiKeys().length > 0 && !process.env.VITEST`, execute the multi-key model rotation with structured JSON schema `{ interpretation, advice, savageQuote }`. Fall back to existing persona template if offline or on error.
3. In `generateCoupleTarotReading`: when `hasValidGeminiApiKey() && !process.env.VITEST`, call `generateTarotReading`. When live AI succeeds, merge with `computeCoupleEntertainmentMetrics` and return `usedFallback: false`. When fallback is used, return `usedFallback: true`.
4. Add verification assertions in `tests/golive_audit_verification.test.ts` (or `phase2_3_verification.test.ts`) covering key loading, fallback under Vitest, and model chain integrity.

---

## 5. Verification Method

To independently verify after implementation:
1. **Type Safety**:
   ```bash
   npx tsc --noEmit
   ```
   Must exit with code 0.
2. **Vitest Unit Test Suite**:
   ```bash
   npx vitest run
   ```
   Must pass all 26+ test suites with 0 failures.
3. **Inspect Output Files**:
   - Check `src/lib/ai-provider.ts` for export of `GEMINI_MODEL_CHAIN`.
   - Check `tests/rut_bai_ritual.test.ts` passes and validates presence of `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-3.6-flash`.
