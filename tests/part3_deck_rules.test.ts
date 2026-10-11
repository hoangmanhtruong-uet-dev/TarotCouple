import { describe, it, expect, beforeEach } from 'vitest';
import {
  canUseFullDeck,
  consumeQuota,
  FREE_DAILY_FULL_DECK_READINGS,
  FREE_DAILY_READINGS,
  FULL_DECK_UNLOCK_STAR_COST,
  getQuotaStatus,
  resetAllQuotaStoreForTesting,
  unlockFullDeckWithStars,
  canConsumeQuota,
  resolveClientKey,
} from '../src/lib/quota-store';
import { POST, PUT } from '../src/app/api/reading/route';

describe('Part 3: Free Account Deck Rules (Server-side Enforced)', () => {
  const testClientKey = 'test_client_deck_rules_' + Date.now();

  beforeEach(() => {
    resetAllQuotaStoreForTesting();
  });

  it('1. allows 78-card deck for FREE on the first reading of the day (usedToday === 0)', () => {
    expect(FREE_DAILY_READINGS).toBe(3);
    expect(FREE_DAILY_FULL_DECK_READINGS).toBe(1);
    expect(FULL_DECK_UNLOCK_STAR_COST).toBe(5);

    const check = canUseFullDeck(testClientKey);
    expect(check.allowed).toBe(true);
    expect(check.isFirstFreeTurn).toBe(true);
    expect(check.unlockCostStars).toBe(5);

    const quota = getQuotaStatus(testClientKey);
    expect(quota.canUseFullDeck).toBe(true);
    expect(quota.isFirstTurnFullDeckFree).toBe(true);
  });

  it('2. locks 78-card deck on turns 2 and 3 unless unlocked with Stars', () => {
    // Consume turn 1 with 78 cards
    consumeQuota(testClientKey, 100, 200, 'full_78');

    const checkTurn2 = canUseFullDeck(testClientKey);
    expect(checkTurn2.allowed).toBe(false);
    expect(checkTurn2.isFirstFreeTurn).toBe(false);

    const quota = getQuotaStatus(testClientKey);
    expect(quota.usedToday).toBe(1);
    expect(quota.canUseFullDeck).toBe(false);
    expect(quota.isFirstTurnFullDeckFree).toBe(false);
  });

  it('3. server rejects full_78 requests on turn 2+ with HTTP 403 and FORBIDDEN_DECK_MODE', async () => {
    const dummyReq = new Request('http://localhost:3000/api/reading', {
      headers: { 'x-client-id': 'client_reject_test' },
    });
    const clientKey = resolveClientKey(dummyReq);

    // Use up turn 1
    consumeQuota(clientKey, 50, 50, 'major_22');

    // Attempt to request full_78 on turn 2 without unlock
    const req = new Request('http://localhost:3000/api/reading', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': 'client_reject_test',
      },
      body: JSON.stringify({
        nickname: 'Tester',
        birth_year: 2000,
        reader_id: 'ba_co_mo_hon',
        topic: 'love',
        question_text: 'Tình duyên tháng này thế nào?',
        selected_indices: [10, 25, 40],
        deck_mode: 'full_78',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.status).toBe('error');
    expect(body.code).toBe('FORBIDDEN_DECK_MODE');
    expect(body.message).toContain('Tài khoản miễn phí chỉ được chọn bộ 78 lá ở lượt đầu tiên');

    // Quota should NOT have been deducted
    const quotaAfter = getQuotaStatus(clientKey);
    expect(quotaAfter.usedToday).toBe(1);
  });

  it('4. unlocks 78-card deck using 5 Stars via PUT /api/reading unlock_full_deck', async () => {
    const dummyReq = new Request('http://localhost:3000/api/reading', {
      headers: { 'x-client-id': 'client_unlock_test' },
    });
    const clientKey = resolveClientKey(dummyReq);

    // Turn 1 used
    consumeQuota(clientKey, 50, 50, 'major_22');
    expect(canUseFullDeck(clientKey).allowed).toBe(false);

    // Initial stars balance is 10 Stars by default
    const quotaBefore = getQuotaStatus(clientKey);
    expect(quotaBefore.starsBalance).toBe(10);

    // Call PUT to unlock full deck
    const putReq = new Request('http://localhost:3000/api/reading', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': 'client_unlock_test',
      },
      body: JSON.stringify({ action: 'unlock_full_deck' }),
    });

    const putRes = await PUT(putReq);
    expect(putRes.status).toBe(200);
    const putData = await putRes.json();
    expect(putData.status).toBe('ok');
    expect(putData.quota.starsBalance).toBe(5); // 10 - 5 = 5
    expect(putData.quota.canUseFullDeck).toBe(true);

    // Now turn 2 allows 78-card deck
    expect(canUseFullDeck(clientKey).allowed).toBe(true);

    // Performing turn 2 with full_78 consumes the unlock
    consumeQuota(clientKey, 50, 50, 'full_78');
    expect(getQuotaStatus(clientKey).usedToday).toBe(2);
    // Turn 3 is locked again
    expect(canUseFullDeck(clientKey).allowed).toBe(false);
  });

  it('5. prevents unlock and returns INSUFFICIENT_STARS when stars balance < 5', () => {
    const clientKey = 'client_poor_' + Date.now();
    // Deduct stars until balance is 2
    const wallet = unlockFullDeckWithStars(clientKey); // 10 -> 5
    expect(wallet.success).toBe(true);
    const wallet2 = unlockFullDeckWithStars(clientKey); // 5 -> 0
    expect(wallet2.success).toBe(true);

    // Third attempt with 0 stars
    const failedUnlock = unlockFullDeckWithStars(clientKey);
    expect(failedUnlock.success).toBe(false);
    expect(failedUnlock.error).toBe('INSUFFICIENT_STARS');
    expect(failedUnlock.starsBalance).toBe(0);
  });

  it('6. blocks reading and flags QUOTA_EXCEEDED when all 3 daily readings are exhausted', () => {
    const clientKey = 'client_limit_' + Date.now();
    consumeQuota(clientKey, 50, 50, 'full_78'); // turn 1
    consumeQuota(clientKey, 50, 50, 'major_22'); // turn 2
    consumeQuota(clientKey, 50, 50, 'major_22'); // turn 3

    const quota = getQuotaStatus(clientKey);
    expect(quota.usedToday).toBe(3);
    expect(quota.remainingToday).toBe(0);

    const check = canConsumeQuota(clientKey);
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('QUOTA_EXCEEDED');
  });
});
