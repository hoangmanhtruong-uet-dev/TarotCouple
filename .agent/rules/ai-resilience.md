---
description: Guardrails for LLM structured output parsing, Zod schema normalization, and resilient model fallback under high demand.
---

# AI Resilience & Schema Normalization Invariants

1. **Pre-Validation Normalization Layer**:
   - Never pass raw JSON from LLM directly into `ZodSchema.safeParse()`.
   - LLMs frequently output 1-based indices (e.g. `position_index: 1, 2, 3` instead of `0, 1, 2`) or slightly exceed string length thresholds.
   - Always run through `sanitizeRawModelOutput()` to strictly map array positions to `0, 1, 2`, clamp numeric ranges (e.g. `card_id: 0..77`), enforce string length boundaries, and deduplicate `energy_keyword`.

2. **Model Prioritization & High-Demand Resilience**:
   - Always prioritize robust tier models (e.g. `gemini-2.5-flash`) over capacity-constrained preview/lite models (`gemini-2.5-flash-lite`) in production to avoid `HTTP 503: High demand spikes`.
   - Use a generous per-model timeout (minimum 20s) before falling back to next candidate models or deterministic fallback generators.

3. **Zero White-Screen Fallback Guarantee**:
   - If all remote LLM retries fail (network drop, API quota exhaustion), the system must seamlessly invoke `buildContextualFallbackReading()`.
   - The user must always receive a structured, persona-aligned reading matching their 3 drawn cards and question, never a 500 error or blank screen.
