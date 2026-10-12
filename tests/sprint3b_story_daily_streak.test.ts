import { describe, it, expect, beforeEach } from 'vitest';
import { GET as getDaily, POST as postDaily } from '@/app/api/daily/route';
import { PUT as putReading } from '@/app/api/reading/route';
import { GET as getStoryCard } from '@/app/api/story-card/route';
import {
  resetAllQuotaStoreForTesting,
  recordDailyPullCompletion,
  getQuotaStatus,
  resolveClientKey,
} from '@/lib/quota-store';
import { MAJOR_ARCANA } from '@/data/tarot-cards';

describe('Sprint 3B: P11 Story 9:16 & P16 Daily Streak Verification Suite', () => {
  beforeEach(() => {
    resetAllQuotaStoreForTesting();
  });

  it('1. Daily Streak awards +2 Stars on days 1-6 and +5 Stars on the 7th consecutive day milestone', async () => {
    const clientId = 'streak_tester_3b_1';

    const day1Res = await postDaily(
      new Request('http://localhost:3000/api/daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId,
        },
        body: JSON.stringify({ readerId: 'ba_ngoai' }),
      })
    );
    expect(day1Res.status).toBe(200);
    const day1Json = await day1Res.json();
    expect(day1Json.alreadyPulledToday).toBe(false);
    expect(day1Json.daily.streakDays).toBe(1);
    expect(day1Json.daily.starsRewarded).toBe(2);
    expect(day1Json.quota.starsBalance).toBe(12); // Initial 10 + 2

    // Calling POST /api/daily again on the same day should be idempotent (no duplicate star reward)
    const dupRes = await postDaily(
      new Request('http://localhost:3000/api/daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId,
        },
        body: JSON.stringify({ readerId: 'ba_ngoai' }),
      })
    );
    const dupJson = await dupRes.json();
    expect(dupJson.alreadyPulledToday).toBe(true);
    expect(dupJson.quota.starsBalance).toBe(12);
  });

  it('2. Verifies 7th day milestone awards +5 Stars when streak reaches 7', async () => {
    const mockReq = new Request('http://localhost:3000/api/daily', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': 'streak_day7_tester',
      },
      body: JSON.stringify({ readerId: 'chi_dai' }),
    });
    const clientKey = resolveClientKey(mockReq);
    getQuotaStatus(clientKey); // initialize wallet

    const store = (globalThis as any).__tarotCoupleStore;
    const wallet = store.wallets.get(clientKey);
    expect(wallet).toBeDefined();
    // Set streakDays to 6 and lastDailyPullDate to yesterday so next pull is Day 7
    wallet.streakDays = 6;
    wallet.starsBalance = 22;
    wallet.lastDailyPullDate = '2026-10-11';

    const day7Res = await postDaily(mockReq);
    expect(day7Res.status).toBe(200);
    const day7Json = await day7Res.json();
    expect(day7Json.alreadyPulledToday).toBe(false);
    expect(day7Json.daily.streakDays).toBe(7);
    expect(day7Json.daily.starsRewarded).toBe(5);
    expect(day7Json.quota.starsBalance).toBe(27); // 22 + 5
  });

  it('3. Story 9:16 renderer supports 4 canonical readers (ba_ngoai, chi_dai, ban_than, thay_cu_meo) and Couple metrics', async () => {
    const personas = ['ba_ngoai', 'chi_dai', 'ban_than', 'thay_cu_meo'] as const;

    for (const persona of personas) {
      const req = new Request(
        `http://localhost:3000/api/story-card?persona=${persona}&nickname=Linh&compatScore=92&redFlag=15&cards=0:0,6:0,19:1`,
        { method: 'GET' }
      );
      const res = await getStoryCard(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('image/png');
    }
  });

  it('4. Claiming Story Share bonus via PUT /api/reading grants +1 bonus draw', async () => {
    const putReq = new Request('http://localhost:3000/api/reading', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': 'story_bonus_tester_3b',
      },
      body: JSON.stringify({
        action: 'share_bonus',
        readingId: 'rd_test_story_3b',
      }),
    });
    const clientKey = resolveClientKey(putReq);
    const beforeQuota = getQuotaStatus(clientKey);
    expect(beforeQuota.remainingToday).toBe(3);
    expect(beforeQuota.bonusDraws).toBe(0);

    const putRes = await putReading(putReq);
    expect(putRes.status).toBe(200);
    const putJson = await putRes.json();
    expect(putJson.quota.bonusDraws).toBe(1);
    expect(putJson.quota.remainingToday).toBe(4);
  });
});
