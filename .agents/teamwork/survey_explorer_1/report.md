# Survey & Investigation Report: R1 Backend AI 5-Key Upgrade

**Target File**: `src/lib/ai-provider.ts`  
**Related Files**: `src/lib/prompts.ts`, `src/lib/schemas.ts`, `src/lib/api-types.ts`, `src/app/api/couple/route.ts`, `src/app/api/clarifier/route.ts`, `tests/phase2_3_ai_shuffler.test.ts`, `tests/phase2_3_verification.test.ts`, `tests/sprint3a_couple_mode.test.ts`, `tests/rut_bai_ritual.test.ts`  
**Investigator**: `survey_explorer_1`  
**Date**: 2026-10-12  

---

## Executive Summary

The Tarot Couple application currently contains a rich, multi-layered AI provider in `src/lib/ai-provider.ts` (1,859 lines). While single-reading generation (`generateTarotReading`) and follow-up Q&A (`generateFollowupReading`) have already implemented multi-key rotation and multi-model fallback, the **4th Clarifier Card** (`generateClarifierReading`) and **Couple Tarot Mode** (`generateCoupleTarotReading`) are currently static/deterministic mock engines that never call live Google Gemini models.

This investigation provides the detailed architectural survey, call chains, schema mappings, error fallbacks, and test assertions needed to upgrade both generators to use the 5-key `['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3-flash-preview']` rotation chain while guaranteeing 100% deterministic offline safety under Vitest.

---

## 1. Key Management Architecture (`getValidGeminiApiKeys`)

### 1.1 Implementation Analysis (`src/lib/ai-provider.ts:987-1021`)
- **Key Resolution**: `getValidGeminiApiKeys()` inspects:
  - `process.env.GEMINI_API_KEY`
  - `process.env.GEMINI_API_KEY_2` through `process.env.GEMINI_API_KEY_10`
  - `process.env.GEMINI_API_KEYS` (supports comma or newline separation)
- **Validation Rules (`isValidKeyString`)**:
  - Rejects empty, `undefined`, or null strings.
  - Rejects placeholders: `'your_gemini_api_key_here'`, `'YOUR_API_KEY'`, and anything starting with `'placeholder'`.
  - Enforces minimum length >= 15 characters.
  - Deduplicates keys.
- **Round-Robin State**:
  - A module-scoped `currentApiKeyIndex` (initialized to `0`) tracks rotation index.
  - On each generation invocation, the start index advances:
    ```typescript
    const startIdx = currentApiKeyIndex;
    currentApiKeyIndex = (currentApiKeyIndex + 1) % (availableKeys.length || 1);
    ```
  - Up to `availableKeys.length` attempts are made, wrapping around cleanly with modular arithmetic.
- **Helper**: `hasValidGeminiApiKey()` returns `getValidGeminiApiKeys().length > 0`.

### 1.2 Model Chain Standardization
The application targets the prioritized model hierarchy:
```typescript
export const GEMINI_MODEL_CHAIN = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-3-flash-preview',
] as const;
```
Defining this constant as an export in `src/lib/ai-provider.ts` will allow both `generateClarifierReading`, `generateTarotReading`, `generateFollowupReading`, and the future `GET /api/health` (R2) to reference a single source of truth.

---

## 2. Deep Dive: `generateClarifierReading`

### 2.1 Current State (`src/lib/ai-provider.ts:1533-1636`)
- `generateClarifierReading` accepts `GenerateClarifierParams`:
  - `card`: `FlexibleCardInput`
  - `reversed?: boolean`
  - `questionAsked?: string` / `followupQuestion?: string`
  - `nickname?: string`
  - `readerId?: ReaderId`
  - `birthYear?: number`
  - `starsSpent?: number` (defaults to 5)
- Currently, it resolves `effectivePersona` via `classifyAgeTier(birthYear, undefined, readerId)` and normalizes the card via `normalizeDrawnCard(...)`.
- **Limitation**: It immediately enters a static `if/else` block based on `effectivePersona` (`ba_ngoai`, `chi_dai`, `ban_than`, `thay_cu_meo`, `ba_co_mo_hon`, `tong_tai_ly_tri`, `phap_su_toi_co`, `tien_tu_chua_lanh`). It generates template strings and returns without ever invoking Gemini AI.

### 2.2 Upgrade Architecture for Clarifier Live AI
When `getValidGeminiApiKeys().length > 0 && !process.env.VITEST`:
1. **Prompt Construction**:
   - Persona voice instructions: `PERSONA_PROFILES[effectivePersona].voiceInstructions`
   - Context: User nickname, question asked (`questionAsked`), card name (vi/en), orientation (`orientVi`), and energy keywords (`primaryKw`, `secondaryKw`).
   - Instructions: Deliver direct, actionable clarification answering the question in the persona's voice.
2. **Gemini API Call**:
   - Instantiate `new GoogleGenAI({ apiKey })`.
   - Use `ai.models.generateContent` with `responseMimeType: 'application/json'` and schema:
     ```typescript
     {
       type: Type.OBJECT,
       properties: {
         interpretation: { type: Type.STRING },
         advice: { type: Type.STRING },
         savageQuote: { type: Type.STRING },
       },
       required: ['interpretation', 'advice', 'savageQuote'],
     }
     ```
   - Timeout: 15 seconds per call (`Promise.race`).
   - Model iteration: `GEMINI_MODEL_CHAIN` across available rotated keys.
3. **Response Sanitization**:
   - Parse JSON.
   - Enforce minimum length: `interpretation` >= 20 chars, `advice` >= 10 chars, `savageQuote` >= 5 chars.
   - Ensure quote conciseness via `ensureConciseQuote(...)` (<= 20 words).
   - If model returns `savage_quote` (snake_case), map to `savageQuote`.
4. **Resilient Fallback**:
   - If not in live mode, or if all keys and models throw or fail schema validation, fall back cleanly to the existing deterministic persona templates (`ba_ngoai`, `chi_dai`, etc.).
   - Return type `ClarifierReadingResult` must preserve both flat properties (`interpretation`, `advice`, `savageQuote`, `starsSpent`) and nested `clarifier` object for backwards compatibility with `src/app/api/clarifier/route.ts:192-200`.

---

## 3. Deep Dive: `generateCoupleTarotReading`

### 3.1 Current State (`src/lib/ai-provider.ts:1415-1491`)
- Accepts `GenerateCoupleReadingParams`:
  - `ownerNickname`, `partnerNickname`
  - `birthYear`, `readerId`
  - `relationshipStatus` (`dating`, `crush`, `situationship`, `ex`, `married`)
  - `questionText`
  - `drawnCards`: 3 cards representing:
    - Position 0: Owner's energy (`Năng lượng của ${ownerNick}`)
    - Position 1: Partner's energy (`Năng lượng của ${partnerNick}`)
    - Position 2: Shared future connection (`Tần số kết nối & Hướng đi tương lai`)
- Currently calls `buildContextualFallbackReading(...)` unconditionally, computes `computeCoupleEntertainmentMetrics(...)`, formats `coupleQuotes`, and returns with hardcoded:
  ```typescript
  aiModel: 'couple-compatibility-engine-v2',
  tokensIn: 0,
  tokensOut: 0,
  usedFallback: true,
  retryCount: 0,
  ```

### 3.2 Couple Mode Call Chains in Routes
There are two execution modes in `src/app/api/couple/route.ts`:
1. **Co-op Invite Mode (`join_room` action, line 332)**:
   - Person B enters roomCode and draws Partner Card.
   - Server merges Owner Card (Card 0), Partner Card (Card 1), and Connection Card (Card 2).
   - Calls `generateCoupleTarotReading` with `questionText: 'Soi tần số kết nối giữa ...'`.
   - Results are cached and mapped to `readingResponse.aiMeta` (lines 391-397).
2. **Solo Couple Mode (`solo_couple` action, line 657)**:
   - Single user provides both nicknames and draws 3 cards directly.
   - Calls `generateCoupleTarotReading` with sanitized user question.
   - Results mapped to `readingResponse.aiMeta` (lines 703-709).

### 3.3 Upgrade Architecture for Couple Mode Live AI
When `hasValidGeminiApiKey() && !process.env.VITEST`:
1. **Invoke `generateTarotReading`**:
   - Pass:
     - `nickname`: `${ownerNick} & ${partnerNick}`
     - `birthYear`
     - `readerId`
     - `topic`: `'love'`
     - `questionText`: `params.questionText || 'Soi tần số kết nối giữa ...'`
     - `drawnCards`: `normalizedCards` (with `couplePositions`)
     - `ageTier`, `effectivePersona`
   - `generateTarotReading` automatically uses the 5-key rotation and candidate model chain (`gemini-3.5-flash-lite`, etc.) with Zod validation.
2. **Handle Live Success (`!liveReadingRes.usedFallback`)**:
   - Merge `liveReadingRes.reading` with:
     - `metrics`: deterministic `computeCoupleEntertainmentMetrics(normalizedCards, relStatus)`.
     - `greeting_hook`: custom couple greeting or live greeting.
     - `shareable_card`: retain live quotes or couple quotes.
   - Return:
     ```typescript
     return {
       reading: coupleReading,
       result: coupleReading,
       effectivePersona: liveReadingRes.effectivePersona,
       ageTier: liveReadingRes.ageTier,
       aiModel: liveReadingRes.aiModel,
       tokensIn: liveReadingRes.tokensIn,
       tokensOut: liveReadingRes.tokensOut,
       usedFallback: false,
       retryCount: liveReadingRes.retryCount,
     };
     ```
3. **Handle Fallback (`usedFallback === true` or error thrown)**:
   - Call `buildContextualFallbackReading(...)` as before.
   - Attach `metrics` and `coupleQuotes`.
   - Return with `usedFallback: true` and `aiModel: 'couple-compatibility-engine-v2'`.

---

## 4. Test Suite Inventory & Gap Analysis

### 4.1 Existing Test Suite Status
Running `npx vitest run` currently executes **26 test files, 238 tests, all passing (0 failures)**.
Specific test files covering `ai-provider.ts`:
- `tests/phase0_1_verification.test.ts`: Tests `MAJOR_ARCANA`, `normalizeDrawnCard`, `buildContextualFallbackReading`.
- `tests/phase2_3_ai_shuffler.test.ts:168-208`: Tests `generateCoupleTarotReading` metrics and `generateClarifierReading` length assertions.
- `tests/phase2_3_verification.test.ts:111-139`: Tests couple metrics boundaries and clarifier star costs.
- `tests/rut_bai_ritual.test.ts:68-78`: Tests that `'gemini-3.5-flash-lite'`, `'gemini-3.1-flash-lite'`, `'gemini-3.6-flash'`, and `GEMINI_API_KEY_${i}` are present in `ai-provider.ts`.
- `tests/sprint3a_couple_mode.test.ts`: Tests co-op invite and solo couple HTTP endpoints.

### 4.2 Gaps & Needed Assertions
1. **Key Loader Verification**:
   - Unit test asserting that `getValidGeminiApiKeys()` correctly handles multiple keys (`GEMINI_API_KEY`, `GEMINI_API_KEY_2..10`, `GEMINI_API_KEYS`), ignores placeholders, and filters out invalid short keys.
2. **Model Chain Export**:
   - Test verifying that `GEMINI_MODEL_CHAIN` is exported and contains `['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3-flash-preview']`.
3. **Clarifier Fallback vs Live Behavior**:
   - Under Vitest (`process.env.VITEST = 'true'`), verify `generateClarifierReading` falls back cleanly to deterministic template and never throws.
   - Using simulated environment or vi.mock on `@google/genai`, verify that when `!process.env.VITEST` and valid keys exist, `generateClarifierReading` calls `generateContent` and returns parsed `{ interpretation, advice, savageQuote }`.
4. **Couple Mode Fallback vs Live Behavior**:
   - Under Vitest, verify `generateCoupleTarotReading` attaches `computeCoupleEntertainmentMetrics` with `entertainment_note: 'Chỉ để giải trí'` and `usedFallback: true`.
   - With simulated live AI success, verify `generateCoupleTarotReading` preserves `usedFallback: false` and the actual `aiModel`.

---

## 5. Recommended Implementation Reference

### 5.1 Export `GEMINI_MODEL_CHAIN`
```typescript
export const GEMINI_MODEL_CHAIN = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-3-flash-preview',
] as const;
```

### 5.2 Clarifier Upgrade in `src/lib/ai-provider.ts`
```typescript
export async function generateClarifierReading(
  params: GenerateClarifierParams
): Promise<ClarifierReadingResult> {
  const reversed = Boolean(params.reversed ?? params.card?.reversed);
  const questionAsked = (
    params.questionAsked ||
    params.followupQuestion ||
    'Bước hành động tiếp theo mình nên ưu tiên là gì?'
  )
    .trim()
    .slice(0, 200);
  const readerId = params.readerId ?? 'ba_co_mo_hon';
  const birthYear = params.birthYear ?? 2002;
  const safeNick = (params.nickname || 'Bạn').trim().slice(0, 35);
  const starsSpent = params.starsSpent ?? 5;

  const agePolicy = classifyAgeTier(birthYear, undefined, readerId);
  const effectivePersona = agePolicy.effectivePersona;

  const normalized = normalizeDrawnCard(
    { ...params.card, reversed },
    0,
    'love',
    ['Lá Làm Rõ (Clarifier)', 'Lá Làm Rõ', 'Lá Làm Rõ']
  );

  const orientVi = reversed ? 'chiều Ngược' : 'chiều Xuôi';
  const primaryKw =
    (reversed ? normalized.keywords_rev[0] : normalized.keywords_up[0]) ||
    'Chuyển động mới';
  const secondaryKw =
    (reversed ? normalized.keywords_rev.slice(1, 3) : normalized.keywords_up.slice(1, 3)).join(
      ', '
    ) || 'lắng nghe trực giác';

  let interpretation = '';
  let advice = '';
  let savageQuote = '';

  const availableKeys = getValidGeminiApiKeys();

  // Try live AI generation when keys are available and outside Vitest test environment
  if (availableKeys.length > 0 && !process.env.VITEST) {
    const profile = PERSONA_PROFILES[effectivePersona] || PERSONA_PROFILES.ba_co_mo_hon;
    const promptText = `
${profile.voiceInstructions}

BỐI CẢNH TRẢI BÀI TAROT:
- Người hỏi: "${safeNick}"
- Nhân vật Reader: "${profile.displayName}" (${effectivePersona})
${params.originalQuestion ? `- Câu hỏi ban đầu: "${params.originalQuestion.trim().slice(0, 200)}"` : ''}
- Câu hỏi cần làm rõ thêm: "${questionAsked}"

LÁ BÀI LÀM RÕ THỨ 4 VỪA ĐƯỢC RÚT:
- Tên lá bài: ${normalized.name_vi} (${normalized.name_en}) - ${orientVi}
- Từ khóa năng lượng: ${primaryKw}, ${secondaryKw}

NHIỆM VỤ CỦA BẠN:
1. Hãy giải nghĩa Lá Làm Rõ này trả lời trực tiếp cho câu hỏi "${questionAsked}".
2. Giữ ĐÚNG 100% phong cách, xưng hô và cá tính của ${profile.displayName}.
3. Trả về cấu trúc JSON hợp lệ gồm 3 trường:
   - "interpretation": Lời luận giải sâu sắc, đi thẳng vào câu hỏi của ${safeNick} (khoảng 80 - 140 từ).
   - "advice": Lời khuyên hành động thiết thực trong 24-48 giờ tới (khoảng 25 - 50 từ).
   - "savageQuote": Một câu quote ngắn gọn, đắt giá, bắt bài hoặc truyền cảm hứng, TỐI ĐA 20 TỪ.
`.trim();

    const startIdx = currentApiKeyIndex;
    currentApiKeyIndex = (currentApiKeyIndex + 1) % availableKeys.length;

    keysLoop: for (let k = 0; k < availableKeys.length; k++) {
      const key = availableKeys[(startIdx + k) % availableKeys.length]!;
      const ai = new GoogleGenAI({ apiKey: key });

      for (const modelToTry of GEMINI_MODEL_CHAIN) {
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), 15000)
          );
          const genPromise = ai.models.generateContent({
            model: modelToTry,
            contents: promptText,
            config: {
              systemInstruction: `Bạn là ${profile.displayName} — Tarot Reader AI chuyên nghiệp. Trả về đúng định dạng JSON.`,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  interpretation: { type: Type.STRING },
                  advice: { type: Type.STRING },
                  savageQuote: { type: Type.STRING },
                },
                required: ['interpretation', 'advice', 'savageQuote'],
              },
              temperature: 0.75,
            },
          });

          const response = await Promise.race([genPromise, timeoutPromise]);
          const text = response.text?.trim();
          if (!text) continue;

          const parsed = JSON.parse(text);
          const rawInterp = typeof parsed.interpretation === 'string' ? parsed.interpretation.trim() : '';
          const rawAdvice = typeof parsed.advice === 'string' ? parsed.advice.trim() : '';
          const rawQuote = typeof (parsed.savageQuote || parsed.savage_quote) === 'string'
            ? (parsed.savageQuote || parsed.savage_quote).trim()
            : '';

          if (rawInterp.length >= 20 && rawAdvice.length >= 10 && rawQuote.length >= 5) {
            interpretation = rawInterp.slice(0, 890);
            advice = rawAdvice.slice(0, 400);
            savageQuote = ensureConciseQuote(rawQuote);
            break keysLoop;
          }
        } catch (err) {
          console.warn(`[Clarifier AI Warning] Model ${modelToTry} attempt failed:`, err);
        }
      }
    }
  }

  // Clean fallback to deterministic persona template if live call was skipped or failed
  if (!interpretation) {
    if (effectivePersona === 'ba_ngoai') {
      interpretation = `Bà Ngoại trả lời cho con về câu hỏi "${questionAsked}" nghe ${safeNick}: Lá Làm Rõ ${normalized.name_vi} (${orientVi}) hiện ra với từ khóa "${primaryKw}" và ${secondaryKw}. Bà thấy con không việc gì phải lo lắng hay hấp tấp; điều quan trọng nhất lúc này là giữ gìn sức khỏe và lắng nghe con tim mình, cái gì an lành tự khắc sẽ tìm đến con.`;
      advice = `Hôm nay con cứ ăn ngon ngủ kỹ, đừng tự tạo áp lực cho mình, để tâm trí thảnh thơi rồi đưa ra quyết định sau.`;
      savageQuote = ensureConciseQuote(
        `Bà Ngoại nhắn nhủ: Có sức khỏe và sự bình an trong lòng là con đã thắng một nửa rồi.`
      );
    } else if (effectivePersona === 'chi_dai') {
      // ... existing templates preserved verbatim ...
    }
    // ...
  }

  const payload = {
    card: params.card,
    reversed,
    questionAsked,
    interpretation,
    advice,
    savageQuote,
    starsSpent,
  };

  return {
    ...payload,
    clarifier: payload,
  };
}
```

### 5.3 Couple Mode Upgrade in `src/lib/ai-provider.ts`
```typescript
export async function generateCoupleTarotReading(
  params: GenerateCoupleReadingParams
): Promise<GenerateCoupleReadingResult> {
  const ownerNick = (params.ownerNickname || params.nickname || 'Bạn').trim().slice(0, 35);
  const partnerNick = (params.partnerNickname || 'Người ấy').trim().slice(0, 35);
  const birthYear = params.birthYear ?? 2002;
  const readerId = params.readerId ?? 'ba_co_mo_hon';
  const relStatus: CoupleRelationshipStatus = params.relationshipStatus ?? 'situationship';
  const relLabel = RELATIONSHIP_STATUS_LABELS[relStatus] || 'Đang tìm hiểu';

  const agePolicy = classifyAgeTier(birthYear, undefined, readerId);
  const ageTier = params.ageTier ?? agePolicy.tier;
  const effectivePersona = params.effectivePersona ?? agePolicy.effectivePersona;

  const couplePositions: [string, string, string] = [
    `Năng lượng của ${ownerNick}`,
    `Năng lượng của ${partnerNick}`,
    COUPLE_SPREAD_POSITIONS[2],
  ];

  const normalizedCards: [DrawnCardWithMeta, DrawnCardWithMeta, DrawnCardWithMeta] = [
    normalizeDrawnCard(params.drawnCards[0], 0, 'love', couplePositions),
    normalizeDrawnCard(params.drawnCards[1], 1, 'love', couplePositions),
    normalizeDrawnCard(params.drawnCards[2], 2, 'love', couplePositions),
  ];

  const [c1, c2, c3] = normalizedCards;
  const metrics = computeCoupleEntertainmentMetrics(normalizedCards, relStatus);

  const coupleQuotes: [string, string, string] = [
    ensureConciseQuote(
      `Độ hợp cạ ${metrics.compatibility_score}% giữa ${c1.name_vi} và ${c2.name_vi}: Tần số đã bắt, chỉ chờ người mở lời!`
    ),
    ensureConciseQuote(
      `Lá kết nối ${c3.name_vi} nhắn nhủ: Đừng đoán ý qua story nữa, đối thoại thẳng thắn một lần đi!`
    ),
    ensureConciseQuote(
      `Tình yêu đẹp nhất khi cả hai cùng nâng cấp bản thân thay vì chạy theo sự mập mờ.`
    ),
  ];

  // Try live AI reading when keys exist and not running inside offline unit tests
  if (hasValidGeminiApiKey() && !process.env.VITEST) {
    try {
      const coupleQuestion =
        params.questionText ||
        `Soi tần số kết nối giữa ${ownerNick} và ${partnerNick} (${relLabel}).`;

      const liveReadingRes = await generateTarotReading({
        nickname: `${ownerNick} & ${partnerNick}`,
        birthYear,
        readerId,
        topic: 'love',
        questionText: coupleQuestion,
        drawnCards: normalizedCards,
        ageTier,
        effectivePersona,
      });

      if (!liveReadingRes.usedFallback) {
        const coupleReading: ReadingOutput = ReadingOutputSchema.parse({
          ...liveReadingRes.reading,
          greeting_hook:
            liveReadingRes.reading.greeting_hook ||
            `Trải bài Bói Đôi (${relLabel}) giữa ${ownerNick} và ${partnerNick} đã mở! Với 3 lá ${c1.name_vi}, ${c2.name_vi} và ${c3.name_vi}, hãy cùng soi độ hợp cạ của hai bạn nhé!`,
          shareable_card: {
            ...liveReadingRes.reading.shareable_card,
            savage_quote:
              liveReadingRes.reading.shareable_card?.savage_quote || coupleQuotes[0],
            savage_quotes:
              liveReadingRes.reading.shareable_card?.savage_quotes?.length === 3
                ? liveReadingRes.reading.shareable_card.savage_quotes
                : coupleQuotes,
          },
          metrics,
        });

        return {
          reading: coupleReading,
          result: coupleReading,
          effectivePersona: liveReadingRes.effectivePersona,
          ageTier: liveReadingRes.ageTier,
          aiModel: liveReadingRes.aiModel,
          tokensIn: liveReadingRes.tokensIn,
          tokensOut: liveReadingRes.tokensOut,
          usedFallback: false,
          retryCount: liveReadingRes.retryCount,
        };
      }
    } catch (err) {
      console.warn('[Couple AI Live Generation Error]:', err);
      // Clean fallback below
    }
  }

  // Deterministic contextual fallback
  const baseReading = buildContextualFallbackReading({
    nickname: `${ownerNick} & ${partnerNick}`,
    birthYear,
    readerId,
    topic: 'love',
    questionText:
      params.questionText ||
      `Soi tần số kết nối giữa ${ownerNick} và ${partnerNick} (${relLabel}).`,
    drawnCards: normalizedCards,
    ageTier,
    effectivePersona,
  });

  const coupleReading: ReadingOutput = ReadingOutputSchema.parse({
    ...baseReading,
    greeting_hook: `Trải bài Bói Đôi (${relLabel}) giữa ${ownerNick} và ${partnerNick} đã mở! Với 3 lá ${c1.name_vi}, ${c2.name_vi} và ${c3.name_vi}, hãy cùng soi độ hợp cạ của hai bạn nhé!`,
    shareable_card: {
      ...baseReading.shareable_card,
      savage_quote: coupleQuotes[0],
      savage_quotes: coupleQuotes,
    },
    metrics,
  });

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
}
```
