# E2E Test Infra: Tarot Couple Go-Live Audit Verification

## Test Philosophy
- Opaque-box, requirement-driven verification covering R1, R2, R3, R4.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise + Real-World Scenarios.
- Guarantees 0 regressions against existing 26 Vitest test suites (238 tests).

## Feature Inventory & Test Matrix
| # | Feature | Requirement | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|-------------|:------:|:------:|:------:|:------:|
| 1 | GEMINI_MODEL_CHAIN | R1 | ✓ | ✓ | ✓ | ✓ |
| 2 | Clarifier 5-Key AI Fallback & Live Schema | R1 | ✓ | ✓ | ✓ | ✓ |
| 3 | Couple Mode AI Live & Metrics Attachment | R1 | ✓ | ✓ | ✓ | ✓ |
| 4 | checkSupabaseHealth() | R2 | ✓ | ✓ | ✓ | ✓ |
| 5 | fetchCoupleRoomFromSupabase() & Route Read-Through | R2 | ✓ | ✓ | ✓ | ✓ |
| 6 | GET /api/health Diagnostics & Security | R2 | ✓ | ✓ | ✓ | ✓ |
| 7 | JournalStore userNote & updateJournalNote | R3 | ✓ | ✓ | ✓ | ✓ |
| 8 | History inline alertdialog (no window.confirm) | R3 | ✓ | ✓ | ✓ | ✓ |
| 9 | History multi-field search | R3 | ✓ | ✓ | ✓ | ✓ |
| 10 | History note editor | R3 | ✓ | ✓ | ✓ | ✓ |
| 11 | History accessibility (top-20, aria-labels) | R3 | ✓ | ✓ | ✓ | ✓ |
| 12 | Admin Funnel Health Banner | R3 | ✓ | ✓ | ✓ | ✓ |
| 13 | Palette Invariant (zero #D9B36A) | R4 | ✓ | ✓ | ✓ | ✓ |
| 14 | Performance Invariant (no backdrop-blur on cards) | R4 | ✓ | ✓ | ✓ | ✓ |
| 15 | Ritual Stagger ([0, 350, 700] ms) | R4 | ✓ | ✓ | ✓ | ✓ |

## Test Architecture
- Test Runner: `npx vitest run tests/golive_audit_verification.test.ts`
- Global Suite: `npx vitest run` (all 26+ test suites)
- Type Check: `npx tsc --noEmit`
- Build Verification: `npm run build`
