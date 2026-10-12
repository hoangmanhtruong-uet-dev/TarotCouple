# Challenger Verification Report: Milestone 1 — Backend AI 5-Key Upgrade

**Agent**: `challenger_1_m1`  
**Target File**: `src/lib/ai-provider.ts`  
**Verdict**: **APPROVE**  
**Date**: 2026-10-12  
**Handoff Type**: Hard (Verification Complete)  

---

## 1. Observation

1. **Candidate Model Chain Export (`GEMINI_MODEL_CHAIN`)**:
   - `src/lib/ai-provider.ts` lines 987–992:
     ```typescript
     export const GEMINI_MODEL_CHAIN = [
       'gemini-3.5-flash-lite',
       'gemini-3.1-flash-lite',
       'gemini-3.6-flash',
       'gemini-3-flash-preview',
     ] as const;
     ```
   - Exported as a read-only tuple of 4 distinct strings. Primary model is `gemini-3.5-flash-lite`.

2. **Clarifier Reading Implementation (`generateClarifierReading`)**:
   - `src/lib/ai-provider.ts` lines 1648–1733 & lines 1735–1809:
     - Detects valid keys via `getValidGeminiApiKeys()`.
     - In live mode (`availableKeys.length > 0 && !process.env.VITEST`), iterates round-robin across keys and candidate models in `GEMINI_MODEL_CHAIN` using `GoogleGenAI`.
     - Validates structured JSON schema `{ interpretation, advice, savageQuote }` with 15s timeout, enforcing `interpretation.length >= 20`, `advice.length >= 10`, `savageQuote.length >= 5`, and concise quote formatting (`countWords <= 22`).
     - In Vitest test environments (`process.env.VITEST = 'true'`) or when API keys are absent, falls back deterministically to rich persona templates across all personas (`ba_ngoai`, `chi_dai`, `ban_than`, `thay_cu_meo`, `ba_co_mo_hon`, `tong_tai_ly_tri`, `phap_su_toi_co`, and default/healing).
     - Returns complete payload with `usedFallback: true` and `aiModel: 'clarifier-persona-template-v1'` when falling back, and `usedFallback: false` with live model metadata when live generation succeeds.

3. **Couple Mode Reading Implementation (`generateCoupleTarotReading`)**:
   - `src/lib/ai-provider.ts` lines 1466–1555:
     - In live mode (`hasValidGeminiApiKey() && !process.env.VITEST`), delegates to `generateTarotReading` with couple topic and normalized card positions (`Năng lượng của ${ownerNick}`, `Năng lượng của ${partnerNick}`, `Sợi dây kết nối & Xu hướng`).
     - When live reading succeeds (`!liveReadingRes.usedFallback`), merges deterministic `computeCoupleEntertainmentMetrics` (`compatibility_score`, `red_flag_level`, `vibe_tag`, `entertainment_note: 'Chỉ để giải trí'`), preserves 3 concise shareable quotes, and returns `usedFallback: false` with the live `aiModel`.
     - When running under Vitest, when keys are absent, or upon unexpected API error, safely falls back to `buildContextualFallbackReading` with `usedFallback: true`, `aiModel: 'couple-compatibility-engine-v2'`, and deterministic metrics.
     - Validated against `ReadingOutputSchema` with 0 schema violations.

4. **Empirical Verification Test Suite (`tests/m1_backend_ai_verification.test.ts`)**:
   - Authored and executed 20 adversarial tests covering:
     - Model chain array integrity, non-emptiness, ordering, and deduplication.
     - Key parsing: placeholder filtering, up to 10 keys collection, comma/newline splitting, and deduplication.
     - Offline determinism under `process.env.VITEST = 'true'` across all personas, upright/reversed cards, and default parameters.
     - Clean fallback when no keys are configured in non-Vitest runtime.
     - Couple Mode schema conformance and metrics constraints (`compatibility_score` 0–100, `red_flag_level` 0–100, `entertainment_note: 'Chỉ để giải trí'`).
     - Live simulation: primary model success, 503 error failover to secondary model `gemini-3.1-flash-lite`, total 429 quota failure fallback, and live couple mode error containment.
   - Result: 20/20 passed in 35ms.

5. **Full Test Suite & Production Build**:
   - `npx tsc --noEmit`: Exited code 0 (0 type errors).
   - `npx vitest run`: 28 test suites, 274 tests passed, 0 failures.
   - `npm run build`: Exited code 0 (all 118 static and dynamic routes compiled successfully).

---

## 2. Logic Chain

1. **Requirement R1 Satisfaction**:
   - The user requested upgrading `generateClarifierReading` to use the 5-key `gemini-3.5-flash-lite` chain when keys exist and `!process.env.VITEST`, falling back to persona templates when keys fail or in unit tests. Observation 2 directly confirms this implementation.
   - The user requested upgrading `generateCoupleTarotReading` to call `generateTarotReading` with the 5-key chain when keys exist and `!process.env.VITEST`, attaching deterministic `computeCoupleEntertainmentMetrics` with `entertainment_note: 'Chỉ để giải trí'`, preserving `usedFallback: false` on success and falling back cleanly when offline. Observation 3 directly confirms this implementation.
2. **Offline Determinism & Zero Test Regressions**:
   - Checking `!process.env.VITEST` guarantees that existing unit tests never incur network latency or quota consumption, while production runtimes with valid credentials immediately use the live multi-key rotation chain.
3. **Adversarial Resilience**:
   - High-fidelity live simulations in Observation 4 proved that if `gemini-3.5-flash-lite` fails with a 503 or timeout, the engine automatically attempts `gemini-3.1-flash-lite` without crashing the caller, and if all models/keys fail, it seamlessly returns the deterministic fallback reading with `usedFallback: true`.
4. **Zero Production Build Regressions**:
   - Observation 5 confirms full TypeScript compilation (exit 0) and Next.js production build completion across all 118 routes (exit 0).

---

## 3. Caveats

- **Network Credential Isolation**: Because Vitest unit tests execute with `process.env.VITEST = 'true'`, live network calls to Google's production endpoints are intentionally bypassed in unit test runs. Live model failover and rotation were verified via high-fidelity mock generators directly exercising the control flow in `src/lib/ai-provider.ts`.
- **Exclusive File Ownership**: As mandated, only `src/lib/ai-provider.ts` was modified by the worker, and no implementation files were modified by the challenger.

---

## 4. Conclusion

**Verdict**: **APPROVE**.

The Milestone 1 implementation in `src/lib/ai-provider.ts` fully and accurately meets all criteria specified in `ORIGINAL_REQUEST.md` and `PROJECT.md`:
- `GEMINI_MODEL_CHAIN` is properly exported and prioritized.
- Multi-key rotation and failover are robustly implemented for Clarifier readings.
- Couple mode integrates live AI readings while preserving deterministic entertainment metrics.
- Complete offline safety and deterministic fallback are guaranteed under `process.env.VITEST` and when keys are absent.
- Full type safety, 274 unit tests, and production Next.js build all pass with zero errors.

---

## 5. Verification Method

To independently reproduce and verify this verdict:

1. **Type Check**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected Output*: Exits with code 0.

2. **Dedicated Milestone 1 Verification Suite**:
   ```bash
   npx vitest run tests/m1_backend_ai_verification.test.ts
   ```
   *Expected Output*: 20 passed (20 tests).

3. **Complete Test Suite**:
   ```bash
   npx vitest run
   ```
   *Expected Output*: 28 test files passed (28), 274 tests passed (274), 0 failures.

4. **Production Build**:
   ```bash
   npm run build
   ```
   *Expected Output*: Exits with code 0 (118 routes compiled successfully).
