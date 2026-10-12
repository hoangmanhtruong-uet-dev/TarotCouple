import { describe, it, expect, beforeEach } from 'vitest';
import {
  canAskFollowup,
  recordFollowupMessageExchange,
  FREE_FOLLOWUPS_PER_ACCOUNT,
  FOLLOWUP_STAR_COST,
  CLARIFIER_STAR_COST,
  resetAllQuotaStoreForTesting,
  getQuotaStatus,
  deductStars,
} from '../src/lib/quota-store';

describe('P08 Result & P09 Clarifier & Followup Verification Suite', () => {
  const clientKey = 'test_user_p08_p09';
  const readingId = 'rd_test_p08_p09_reading';

  beforeEach(() => {
    resetAllQuotaStoreForTesting();
  });

  it('1. verifies Followup pricing conforms to Masterplan PDF Section 4.4 (2 free lifetime, 2 Stars afterwards)', () => {
    expect(FREE_FOLLOWUPS_PER_ACCOUNT).toBe(2);
    expect(FOLLOWUP_STAR_COST).toBe(2);

    const initial = canAskFollowup(clientKey, readingId);
    expect(initial.allowed).toBe(true);
    expect(initial.costType).toBe('free');
    expect(initial.freeFollowupsRemaining).toBe(2);

    // Question 1 (free)
    recordFollowupMessageExchange({
      clientKey,
      readingId,
      question: 'Câu 1?',
      answer: 'Trả lời 1',
      costType: 'free',
      starsDeducted: 0,
    });

    // Question 2 (free)
    recordFollowupMessageExchange({
      clientKey,
      readingId,
      question: 'Câu 2?',
      answer: 'Trả lời 2',
      costType: 'free',
      starsDeducted: 0,
    });

    // Question 3 (switches to 2 Stars)
    const check3 = canAskFollowup(clientKey, readingId, { bypassRateLimit: true });
    expect(check3.allowed).toBe(true);
    expect(check3.costType).toBe('star');
    expect(check3.starsCost).toBe(2);
  });

  it('2. verifies Clarifier 4th card cost is 5 Stars', () => {
    expect(CLARIFIER_STAR_COST).toBe(5);

    const quota = getQuotaStatus(clientKey);
    const initialStars = quota.starsBalance ?? 10;

    const deduction = deductStars(clientKey, CLARIFIER_STAR_COST);
    expect(deduction.allowed).toBe(true);
    expect(deduction.starsBalance).toBe(initialStars - 5);
  });

  it('3. blocks clarifier and triggers out of stars when balance is insufficient', () => {
    // Drain wallet to 2 stars
    const currentStars = getQuotaStatus(clientKey).starsBalance ?? 10;
    deductStars(clientKey, currentStars - 2);

    const insufficientDeduction = deductStars(clientKey, CLARIFIER_STAR_COST);
    expect(insufficientDeduction.allowed).toBe(false);
    expect(insufficientDeduction.starsBalance).toBe(2);
  });
});
