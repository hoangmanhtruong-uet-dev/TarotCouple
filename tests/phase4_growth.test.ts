import { describe, expect, it } from 'vitest';
import { GET as getGrowth, POST as postGrowth } from '../src/app/api/growth/route';
import { GET as getWrappedCard } from '../src/app/api/wrapped-card/route';
import { resetAllQuotaStoreForTesting } from '../src/lib/quota-store';

describe('Phase 4 Growth Engine & Stage Gate 4 Verification Suite', () => {
  it('1. GET /api/growth returns Spiritual Wrapped, 4 TikTok 3-Slide Kits, Referral Code, and Stage Gate 4 Unit Economics (ARPPU > Cost per Paying User)', async () => {
    resetAllQuotaStoreForTesting();
    // H3: unit economics are internal metrics, only exposed to an authorized admin.
    process.env.ADMIN_SECRET = 'growth_admin_test_secret_123456';
    const adminHeaders = {
      'x-client-id': 'growth_user_01',
      'x-admin-secret': 'growth_admin_test_secret_123456',
    };

    const req = new Request(
      'http://localhost:3000/api/growth?nickname=LinhSuy&readerId=ba_co_mo_hon',
      {
        method: 'GET',
        headers: adminHeaders,
      }
    );

    const res = await getGrowth(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.status).toBe('ok');

    // Spiritual Wrapped checks
    expect(data.wrapped).toBeDefined();
    expect(data.wrapped.nickname).toBe('LinhSuy');
    expect(data.wrapped.signatureCard.card.id).toBeGreaterThanOrEqual(0);
    expect(data.wrapped.auraMetrics.selfLoveScore).toBeGreaterThanOrEqual(50);
    expect(data.wrapped.wrappedCardImageUrl).toContain('/api/wrapped-card');

    // TikTok 3-Slide Carousel Kits checks
    expect(Array.isArray(data.tiktokKits)).toBe(true);
    expect(data.tiktokKits.length).toBeGreaterThanOrEqual(4);
    for (const kit of data.tiktokKits) {
      expect(kit.slides).toHaveLength(3);
      expect(kit.hashtags.length).toBeGreaterThanOrEqual(4);
      expect(kit.capcutVoiceoverScript.length).toBeGreaterThan(20);
    }

    // Referral code check
    expect(data.referral.referralCode).toMatch(/^TC-[A-Z0-9]{5}$/);

    // Stage Gate 4 Unit Economics check: ARPPU > Cost per Paying User
    expect(data.unitEconomics).toBeDefined();
    expect(data.unitEconomics.arppuVnd).toBeGreaterThan(
      data.unitEconomics.costPerPayingUserVnd
    );
    expect(data.unitEconomics.isStageGate4Passed).toBe(true);
  });

  it('2. POST /api/growth handles Referral Bonus (+5 Stars, +1 Draw, anti-duplicate & anti-self-referral) and Rewarded Video Ads (+3 Stars, +1 Draw, +45 VND eCPM)', async () => {
    resetAllQuotaStoreForTesting();

    // User A fetches their referral code
    const userARes = await getGrowth(
      new Request('http://localhost:3000/api/growth', {
        method: 'GET',
        headers: { 'x-client-id': 'user_a_referrer' },
      })
    );
    const userAData = await userARes.json();
    const codeA: string = userAData.referral.referralCode;

    // Self-referral by User A must fail
    const selfClaimRes = await postGrowth(
      new Request('http://localhost:3000/api/growth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': 'user_a_referrer',
        },
        body: JSON.stringify({
          action: 'claim_referral',
          referralCode: codeA,
        }),
      })
    );
    expect(selfClaimRes.status).toBe(400);

    // User B claims User A's referral code -> both get +5 Stars!
    const userBClaimRes = await postGrowth(
      new Request('http://localhost:3000/api/growth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': 'user_b_invitee',
        },
        body: JSON.stringify({
          action: 'claim_referral',
          referralCode: codeA,
        }),
      })
    );
    expect(userBClaimRes.status).toBe(200);
    const userBClaimData = await userBClaimRes.json();
    expect(userBClaimData.quota.starsBalance).toBe(15); // 10 initial + 5 referral
    expect(userBClaimData.quota.bonusDraws).toBe(1);

    // Duplicate claim by User B for the same code must be rejected
    const dupClaimRes = await postGrowth(
      new Request('http://localhost:3000/api/growth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': 'user_b_invitee',
        },
        body: JSON.stringify({
          action: 'claim_referral',
          referralCode: codeA,
        }),
      })
    );
    expect(dupClaimRes.status).toBe(400);

    // User B watches a Rewarded Video Ad -> +3 Stars (15 -> 18) and +1 Draw, +45 VND ad revenue
    const adRes = await postGrowth(
      new Request('http://localhost:3000/api/growth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': 'user_b_invitee',
        },
        body: JSON.stringify({
          action: 'watch_rewarded_ad',
        }),
      })
    );
    expect(adRes.status).toBe(200);
    const adData = await adRes.json();
    expect(adData.quota.starsBalance).toBe(18);
    expect(adData.referral.rewardedAdsWatchedToday).toBe(1);
    // H3: unit economics stay private; the per-event revenue delta is public-safe.
    expect(adData.unitEconomics).toBeUndefined();
    expect(adData.adRevenueAddedVnd).toBe(45);
  });

  it('3. POST /api/growth generates custom TikTok 3-Slide kit and GET /api/wrapped-card renders 1080x1920 PNG poster', async () => {
    const customKitRes = await postGrowth(
      new Request('http://localhost:3000/api/growth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': 'creator_01',
        },
        body: JSON.stringify({
          action: 'generate_custom_tiktok_kit',
          nickname: 'Trường',
          readerId: 'ba_co_mo_hon',
          questionText: 'Crush thả tim story lúc 1h sáng nhưng không nhắn tin?',
          savageQuote: 'Người ta thả tim dạo cho đỡ mỏi tay chứ không phải bật đèn xanh đâu con!',
        }),
      })
    );
    expect(customKitRes.status).toBe(200);
    const customKitData = await customKitRes.json();
    expect(customKitData.kit.slides).toHaveLength(3);

    const wrappedImgRes = await getWrappedCard(
      new Request(
        'http://localhost:3000/api/wrapped-card?nickname=HoangTruong&cardId=19&reversed=0&totalReadings=12'
      )
    );
    expect(wrappedImgRes.status).toBe(200);
    expect(wrappedImgRes.headers.get('content-type')).toContain('image/png');
  });
});
