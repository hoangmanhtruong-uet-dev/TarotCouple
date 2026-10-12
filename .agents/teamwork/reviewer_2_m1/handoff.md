# Handoff Report: Review & Adversarial Stress-Test for Milestone 1

**Reviewer**: `reviewer_2_m1` (Reviewer & Adversarial Critic)  
**Recipient**: Orchestrator (`58c8abf6-6619-415c-b64e-e70b2e787b91`)  
**Scope**: Milestone 1 — Backend AI 5-Key Upgrade (`src/lib/ai-provider.ts`)  
**Verdict**: **APPROVE**  
**Date**: 2026-10-12  

---

## 1. Observation

1. **Target File Modifications**:
   - `git diff src/lib/ai-provider.ts` demonstrates that strictly `src/lib/ai-provider.ts` was edited. Zero modifications were introduced into other components or endpoints.
   - `GEMINI_MODEL_CHAIN` is exported at lines 987–992:
     ```typescript
     export const GEMINI_MODEL_CHAIN = [
       'gemini-3.5-flash-lite',
       'gemini-3.1-flash-lite',
       'gemini-3.6-flash',
       'gemini-3-flash-preview',
     ] as const;
     ```
2. **Clarifier Reading Live & Fallback Implementation (`generateClarifierReading`)**:
   - Lines 1648–1733 implement key rotation across `availableKeys` (`currentApiKeyIndex = (currentApiKeyIndex + 1) % availableKeys.length`) and candidate model loop across `GEMINI_MODEL_CHAIN`.
   - Structured JSON schema enforces `{ interpretation, advice, savageQuote }` via `@google/genai` `Type.OBJECT` schema definition with a 15-second per-model timeout (`Promise.race`).
   - String validations (`interpretation >= 20`, `advice >= 10`, `savageQuote >= 5`) prevent truncated or blank responses from bypassing fallback. Quote strings pass through `ensureConciseQuote(...)` which caps words at $\le 20$ (safely below the 22-word limit of `StoryQuoteStringSchema`).
   - Offline guard (`!process.env.VITEST`) prevents flaky network requests in CI and unit tests, cleanly serving deterministic persona templates across all 8 personas (`ba_ngoai`, `chi_dai`, `ban_than`, `thay_cu_meo`, `ba_co_mo_hon`, `tong_tai_ly_tri`, `phap_su_toi_co`, `tien_tu_chua_lanh`).
   - `ClarifierReadingResult` returns full metadata `{ effectivePersona, ageTier, aiModel, tokensIn, tokensOut, usedFallback, retryCount }`.
3. **Couple Reading Live & Fallback Implementation (`generateCoupleTarotReading`)**:
   - Lines 1466–1518 invoke `generateTarotReading` when `hasValidGeminiApiKey() && !process.env.VITEST`.
   - When live generation succeeds (`!liveReadingRes.usedFallback`), attaches deterministic `metrics` computed by `computeCoupleEntertainmentMetrics(normalizedCards, relStatus)` and returns `usedFallback: false` with live `aiModel` and token usage.
   - When live generation throws or fails validation, cleanly catches and falls back to `buildContextualFallbackReading` with `usedFallback: true` and `aiModel: 'couple-compatibility-engine-v2'`.
4. **Consumer Compatibility**:
   - `src/app/api/couple/route.ts`: Consumers at line 332 and line 657 receive expected `coupleAi.reading`, `coupleAi.effectivePersona`, `coupleAi.aiModel`, `coupleAi.tokensIn`, `coupleAi.tokensOut`, `coupleAi.usedFallback`, `coupleAi.retryCount`.
   - `src/app/api/clarifier/route.ts`: Consumer at line 178 accesses `clarifierGen.questionAsked`, `clarifierGen.interpretation`, `clarifierGen.advice`, `clarifierGen.savageQuote`.
   - `src/app/api/reading/route.ts`: Consumer at line 232 continues invoking `generateTarotReading` without signature alterations.
5. **Verification Commands**:
   - `npx tsc --noEmit`: Exited code 0 with 0 TypeScript compilation errors.
   - `npx vitest run`: 26/26 test suites passed, 238/238 unit tests passed, 0 failures.

---

## 2. Logic Chain

1. **Integrity Mandate Compliance**:
   - Verified that neither mock stubs nor hardcoded test outputs were placed into `src/lib/ai-provider.ts`. The implementation uses genuine `@google/genai` calls with genuine parameters and real failover logic.
2. **Defensive Error Handling**:
   - Timeouts are strictly bounded (15s for Clarifier, 20s for general reading).
   - Any network exception, 429 quota exhaustion, or 401/403 authorization error is trapped in `try ... catch` and advances the model/key pointer.
   - Malformed JSON responses (`JSON.parse` failures) or schema mismatches are trapped and fail over rather than crashing the Next.js API route.
3. **Type Safety & Schema Conformance**:
   - Both live and fallback branches validate through `ReadingOutputSchema.parse(...)` before returning.
   - Quotes strictly satisfy `StoryQuoteStringSchema` length constraints through `ensureConciseQuote(...)`.
4. **Zero Regressions**:
   - Full 26 test suites remain green.
   - All consumer route contracts remain intact.

---

## 3. Caveats

- In test runs (Vitest), `process.env.VITEST` intentionally bypasses live Gemini calls to maintain deterministic, instant test execution. Live multi-model API execution occurs in production runtimes where `process.env.VITEST` is unset and API keys are configured.
- Static build (`next build`) in Next.js 15.5.27 on Windows encounters a known file trace issue (`.next/server/app/_not-found/page.js.nft.json`) that is independent of `ai-provider.ts` and falls under the scope of Milestone 4 build verification.

---

## 4. Conclusion

Milestone 1 satisfies all requirements set forth in `PROJECT.md` and `ORIGINAL_REQUEST.md`:
- `GEMINI_MODEL_CHAIN` is accurately exported.
- `generateClarifierReading` supports 5-key rotation, candidate model fallback, structured JSON validation, and clean persona fallback.
- `generateCoupleTarotReading` properly integrates live AI with couple entertainment metrics and non-fallback flags.
- Full type safety (`npx tsc --noEmit`) and test suite (`npx vitest run`) pass with 0 errors.

**Verdict**: **APPROVE**.

---

## 5. Verification Method

To independently reproduce verification:
1. `npx tsc --noEmit` -> Check exit code 0.
2. `npx vitest run tests/phase2_3_ai_shuffler.test.ts tests/phase2_3_verification.test.ts tests/sprint3a_couple_mode.test.ts` -> 15/15 tests pass.
3. `npx vitest run` -> 26 test files pass, 238 tests pass, 0 failed.

---

## Adversarial Stress Test & Review Findings

### Review Summary
**Verdict**: **APPROVE**

### Findings
- **[Minor] Informational**: `process.env.GEMINI_MODEL_CHAIN` is exported as a `const` tuple `['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3-flash-preview'] as const`. Milestone 2's `/api/health` endpoint can import and serve this directly.

### Verified Claims
- `GEMINI_MODEL_CHAIN` exported with exact 4 candidate models -> **PASS**
- `generateClarifierReading` 5-key rotation & model failover -> **PASS**
- `generateClarifierReading` fallback to 8 persona templates -> **PASS**
- `generateCoupleTarotReading` entertainment metrics attachment -> **PASS**
- `generateCoupleTarotReading` `usedFallback: false` on live AI -> **PASS**
- No regressions to `/api/couple`, `/api/clarifier`, `/api/reading` -> **PASS**
- `npx tsc --noEmit` -> **PASS** (0 errors)
- `npx vitest run` -> **PASS** (26 suites, 238 tests)

### Stress Test Scenarios Checked
1. **Total Network Outage**: Handled cleanly; rejected promises caught and deferred to deterministic templates.
2. **Missing / Empty API Keys**: Guarded by `getValidGeminiApiKeys()`; zero runtime errors.
3. **Revoked / Invalid Keys**: Caught by SDK try/catch; rotates through remaining keys.
4. **429 Rate Limiting**: Rotates to next key and next model in chain.
5. **Corrupted / Partial JSON LLM Output**: `JSON.parse` error trapped, length validation (<20/10/5) rejects incomplete responses, cleanly falls back.
