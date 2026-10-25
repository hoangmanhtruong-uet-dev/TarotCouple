// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetAllQuotaStoreForTesting,
  getQuotaStatus,
  consumeQuota,
  canConsumeQuota,
  unlockDrawWithStars,
  DRAW_STAR_COST,
  deductStars,
} from '../src/lib/quota-store';
import { resolveSignedSession } from '../src/lib/session';
import {
  generateHardwareSignature,
  getDeviceFingerprintHeaders,
} from '../src/lib/device-fingerprint';
import { PUT as putReading } from '../src/app/api/reading/route';
import { STAR_PACKAGES } from '../src/components/WalletPayOSModal';

const BASE_URL = 'http://localhost:3000';

describe('Anti-Spam Device Fingerprinting & Draw Quota Governance', () => {
  beforeEach(() => {
    resetAllQuotaStoreForTesting();
  });

  describe('1. Device Fingerprinting & Anti-Spam Session Pinning', () => {
    it('generates consistent hardware signature format in browser environment', () => {
      const sig = generateHardwareSignature();
      expect(sig).toMatch(/^tc_dfp_[a-f0-9]{16}$/);
    });

    it('returns x-device-id header from getDeviceFingerprintHeaders', () => {
      const headers = getDeviceFingerprintHeaders();
      expect(headers['x-device-id']).toBeDefined();
      expect(headers['x-device-id']).toMatch(/^tc_dfp_[a-f0-9]{16}$/);
    });

    it('pins session ID to x-device-id header even across different user agents or incognito tabs', () => {
      const deviceId = 'tc_dfp_abc123def4567890';
      const ip = '198.51.100.42';

      // Request 1: Normal browser tab
      const req1 = new Request(`${BASE_URL}/api/reading`, {
        headers: {
          'x-forwarded-for': ip,
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'x-device-id': deviceId,
        },
      });
      const session1 = resolveSignedSession(req1);

      // Request 2: Incognito tab on the same device (no cookie, slightly different UA/cache)
      const req2 = new Request(`${BASE_URL}/api/reading`, {
        headers: {
          'x-forwarded-for': ip,
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edg/120.0',
          'x-device-id': deviceId,
        },
      });
      const session2 = resolveSignedSession(req2);

      expect(session1.sessionId).toBe(session2.sessionId);
    });

    it('resolves session ID using tc_device_fp cookie if header is omitted', () => {
      const deviceId = 'tc_dfp_cookie_99988877';
      const ip = '198.51.100.43';

      const reqWithCookie = new Request(`${BASE_URL}/api/reading`, {
        headers: {
          'x-forwarded-for': ip,
          cookie: `tc_device_fp=${deviceId}`,
        },
      });

      const session = resolveSignedSession(reqWithCookie);

      const reqWithHeader = new Request(`${BASE_URL}/api/reading`, {
        headers: {
          'x-forwarded-for': ip,
          'x-device-id': deviceId,
        },
      });

      const sessionWithHeader = resolveSignedSession(reqWithHeader);
      expect(session.sessionId).toBe(sessionWithHeader.sessionId);
    });

    it('isolates different hardware devices on the same IP', () => {
      const ip = '198.51.100.50';

      const reqDevA = new Request(`${BASE_URL}/api/reading`, {
        headers: {
          'x-forwarded-for': ip,
          'x-device-id': 'tc_dfp_device_aaa_1111',
        },
      });

      const reqDevB = new Request(`${BASE_URL}/api/reading`, {
        headers: {
          'x-forwarded-for': ip,
          'x-device-id': 'tc_dfp_device_bbb_2222',
        },
      });

      const sessionA = resolveSignedSession(reqDevA);
      const sessionB = resolveSignedSession(reqDevB);

      expect(sessionA.sessionId).not.toBe(sessionB.sessionId);
    });
  });

  describe('2. 3 Free Daily Draws & Quota Exhaustion', () => {
    it('initializes with 3 daily free limit and 0 used draws', () => {
      const clientKey = 'user_test_quota_initial';
      const quota = getQuotaStatus(clientKey);

      expect(quota.dailyLimit).toBe(3);
      expect(quota.usedToday).toBe(0);
      expect(quota.bonusDraws).toBe(0);
      expect(quota.remainingToday).toBe(3);
      expect(quota.drawStarCost).toBe(3);
    });

    it('permits exactly 3 draws then reports quota exhaustion', () => {
      const clientKey = 'user_test_3_draws';

      expect(canConsumeQuota(clientKey).allowed).toBe(true);
      consumeQuota(clientKey);

      expect(canConsumeQuota(clientKey).allowed).toBe(true);
      consumeQuota(clientKey);

      expect(canConsumeQuota(clientKey).allowed).toBe(true);
      consumeQuota(clientKey);

      const quotaAfter3 = getQuotaStatus(clientKey);
      expect(quotaAfter3.usedToday).toBe(3);
      expect(quotaAfter3.remainingToday).toBe(0);

      const gateCheck = canConsumeQuota(clientKey);
      expect(gateCheck.allowed).toBe(false);
      expect(gateCheck.reason).toBe('QUOTA_EXCEEDED');
    });
  });

  describe('3. Unlock Additional Draws with Stars (3 Stars / Draw)', () => {
    it('has DRAW_STAR_COST set to 3', () => {
      expect(DRAW_STAR_COST).toBe(3);
    });

    it('successfully unlocks +1 draw by deducting 3 stars', () => {
      const clientKey = 'user_test_unlock_draw';

      // Exhaust 3 free draws
      consumeQuota(clientKey);
      consumeQuota(clientKey);
      consumeQuota(clientKey);

      const quotaBefore = getQuotaStatus(clientKey);
      expect(quotaBefore.remainingToday).toBe(0);
      const initialStars = quotaBefore.starsBalance;

      // Unlock 1 draw
      const result = unlockDrawWithStars(clientKey);
      expect(result.success).toBe(true);
      expect(result.starsBalance).toBe(initialStars - DRAW_STAR_COST);
      expect(result.quota.bonusDraws).toBe(1);
      expect(result.quota.remainingToday).toBe(1);

      // Now 4th draw is allowed
      expect(canConsumeQuota(clientKey).allowed).toBe(true);
    });

    it('fails to unlock when star balance is below 3', () => {
      const clientKey = 'user_broke';
      // Drain wallet stars
      const status = getQuotaStatus(clientKey);
      const walletBalance = status.starsBalance;
      // Deduct all stars
      deductStars(clientKey, walletBalance);

      const brokeStatus = getQuotaStatus(clientKey);
      expect(brokeStatus.starsBalance).toBe(0);

      const result = unlockDrawWithStars(clientKey);
      expect(result.success).toBe(false);
      expect(result.error).toBe('INSUFFICIENT_STARS');
      expect(result.quota.remainingToday).toBe(3); // Daily limit still intact if not consumed
    });
  });

  describe('4. PayOS Packages (Micro-Draws vs Value Packs)', () => {
    it('contains draw_5k and draw_15k in draws category', () => {
      const draw5k = STAR_PACKAGES.find((p) => p.id === 'draw_5k');
      const draw15k = STAR_PACKAGES.find((p) => p.id === 'draw_15k');

      expect(draw5k).toBeDefined();
      expect(draw5k?.priceVnd).toBe(5000);
      expect(draw5k?.stars).toBe(5);
      expect(draw5k?.category).toBe('draws');
      expect(draw5k?.equivalentDraws).toBe(1);

      expect(draw15k).toBeDefined();
      expect(draw15k?.priceVnd).toBe(15000);
      expect(draw15k?.stars).toBe(15);
      expect(draw15k?.category).toBe('draws');
      expect(draw15k?.equivalentDraws).toBe(3);
    });

    it('contains savings packages in stars category', () => {
      const clarifier = STAR_PACKAGES.find((p) => p.id === 'clarifier_5k');
      const demSuy = STAR_PACKAGES.find((p) => p.id === 'dem_suy_19k');

      expect(clarifier?.category).toBe('stars');
      expect(demSuy?.category).toBe('stars');
    });
  });

  describe('5. API PUT /api/reading with action "unlock_draw"', () => {
    it('unlocks draw via API endpoint', async () => {
      const clientId = 'client_api_unlock_test';

      const res = await putReading(
        new Request(`${BASE_URL}/api/reading`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': clientId,
          },
          body: JSON.stringify({ action: 'unlock_draw' }),
        })
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('ok');
      expect(data.action).toBe('unlock_draw');
      expect(data.quota.bonusDraws).toBe(1);
    });
  });
});
