import { describe, it, expect, beforeEach } from 'vitest';
import {
  canAskFollowup,
  recordFollowupMessageExchange,
  getFollowupMessages,
  resetAllQuotaStoreForTesting,
  FREE_FOLLOWUPS_PER_ACCOUNT,
  FOLLOWUP_STAR_COST,
  FOLLOWUP_MAX_PER_READING,
  addStars,
  deductStars,
  getQuotaStatus,
} from '@/lib/quota-store';

describe('Followup "Thắc mắc sâu hơn" backend logic', () => {
  const clientKey = 'test_client_followup_123';
  const readingId = 'rd_test_followup_reading_01';

  beforeEach(() => {
    resetAllQuotaStoreForTesting();
  });

  it('provides 2 free followups per account by default', () => {
    const quota = getQuotaStatus(clientKey);
    expect(quota.freeFollowupsRemaining).toBe(FREE_FOLLOWUPS_PER_ACCOUNT);
    expect(quota.followupStarCost).toBe(FOLLOWUP_STAR_COST);

    const check1 = canAskFollowup(clientKey, readingId);
    expect(check1.allowed).toBe(true);
    expect(check1.costType).toBe('free');
    expect(check1.starsCost).toBe(0);
    expect(check1.freeFollowupsRemaining).toBe(2);
  });

  it('consumes free followups first, then switches to 5 Stars cost', () => {
    // 1st question - free
    const res1 = recordFollowupMessageExchange({
      clientKey,
      readingId,
      question: 'Lá nào ảnh hưởng nhất?',
      answer: 'Lá thứ nhất nhé con.',
      costType: 'free',
      starsDeducted: 0,
    });
    expect(res1.quota.freeFollowupsRemaining).toBe(1);
    expect(res1.allMessages.length).toBe(2);

    // 2nd question - free
    const check2 = canAskFollowup(clientKey, readingId, { bypassRateLimit: true });
    expect(check2.allowed).toBe(true);
    expect(check2.costType).toBe('free');

    const res2 = recordFollowupMessageExchange({
      clientKey,
      readingId,
      question: 'Tuần này mình nên làm gì?',
      answer: 'Hãy nghỉ ngơi và tập trung bản thân.',
      costType: 'free',
      starsDeducted: 0,
    });
    expect(res2.quota.freeFollowupsRemaining).toBe(0);

    // 3rd question - switches to star cost (5 Stars)
    const check3 = canAskFollowup(clientKey, readingId, { bypassRateLimit: true });
    expect(check3.allowed).toBe(true);
    expect(check3.costType).toBe('star');
    expect(check3.starsCost).toBe(FOLLOWUP_STAR_COST);

    const initialStars = check3.starsBalance;
    const res3 = recordFollowupMessageExchange({
      clientKey,
      readingId,
      question: 'Nếu mình chọn khác thì sao?',
      answer: 'Kết quả vẫn phụ thuộc vào bạn.',
      costType: 'star',
      starsDeducted: FOLLOWUP_STAR_COST,
    });
    expect(res3.quota.starsBalance).toBe(initialStars - FOLLOWUP_STAR_COST);
    expect(res3.allMessages.length).toBe(6);
  });

  it('enforces maximum 5 followups per reading', () => {
    // Record 5 questions
    for (let i = 1; i <= FOLLOWUP_MAX_PER_READING; i++) {
      recordFollowupMessageExchange({
        clientKey,
        readingId,
        question: `Câu hỏi số ${i}`,
        answer: `Câu trả lời ${i}`,
        costType: i <= 2 ? 'free' : 'star',
        starsDeducted: i <= 2 ? 0 : 5,
      });
    }

    const check6 = canAskFollowup(clientKey, readingId, { bypassRateLimit: true });
    expect(check6.allowed).toBe(false);
    expect(check6.reason).toBe('READING_LIMIT_REACHED');
  });

  it('rejects question when out of Stars and out of free quota', () => {
    // Exhaust 2 free questions
    recordFollowupMessageExchange({
      clientKey,
      readingId,
      question: 'Q1',
      answer: 'A1',
      costType: 'free',
      starsDeducted: 0,
    });
    recordFollowupMessageExchange({
      clientKey,
      readingId,
      question: 'Q2',
      answer: 'A2',
      costType: 'free',
      starsDeducted: 0,
    });

    // Drain wallet to 0 stars
    const currentStars = getQuotaStatus(clientKey).starsBalance ?? 10;
    deductStars(clientKey, currentStars);

    const check = canAskFollowup(clientKey, readingId, { bypassRateLimit: true });
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('INSUFFICIENT_STARS');
  });
});
