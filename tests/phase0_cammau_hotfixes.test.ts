import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST as postReading, PUT as putReading } from '../src/app/api/reading/route';
import { POST as postClarifier } from '../src/app/api/clarifier/route';
import { PUT as putPayment } from '../src/app/api/payment/route';
import { POST as postPayOsWebhook } from '../src/app/api/pay/webhook/route';
import { verifyPayOsWebhookData } from '../src/lib/payos';
import { middleware } from '../src/middleware';
import { NextRequest } from 'next/server';
import {
  resetAllQuotaStoreForTesting,
  getQuotaStatus,
  consumeQuota,
  savePendingPaymentOrder,
  deductStars,
  resolveClientKey,
} from '../src/lib/quota-store';

describe('Phase 0 Cầm Máu Security & Integrity Hotfixes (P0-2 to P0-8)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetAllQuotaStoreForTesting();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('P0-2 (C2): Removal of x-bypass-quota backdoor in reading & clarifier', () => {
    it('rejects POST /api/reading when quota is exhausted even if x-bypass-quota header is passed', async () => {
      const req = new Request('http://localhost:3000/api/reading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': 'client-quota-depleted',
          'x-bypass-quota': 'test',
        },
        body: JSON.stringify({
          nickname: 'Attacker',
          birth_year: 2000,
          reader_id: 'ba_co_mo_hon',
          topic: 'love',
          question_text: 'Will this bypass work?',
          selected_indices: [0, 1, 2],
        }),
      });

      const clientKey = resolveClientKey(req);
      // Deplete all 3 free daily readings for this exact client key
      consumeQuota(clientKey, 100, 100);
      consumeQuota(clientKey, 100, 100);
      consumeQuota(clientKey, 100, 100);

      const status = getQuotaStatus(clientKey);
      expect(status.remainingToday).toBe(0);

      // Attempt to bypass quota using old header
      const res = await postReading(req);
      expect(res.status).toBe(429);
      const json = await res.json();
      expect(json.code).toBe('QUOTA_EXCEEDED');
    });

    it('rejects POST /api/clarifier when Stars balance is insufficient even if x-bypass-quota header is passed', async () => {
      const req = new Request('http://localhost:3000/api/clarifier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': 'client-broke-user',
          'x-bypass-quota': 'test',
        },
        body: JSON.stringify({
          readingId: 'rd_test_123',
          followupQuestion: 'Can I get free clarifier?',
          nickname: 'Attacker',
          birthYear: 2000,
        }),
      });

      const clientKey = resolveClientKey(req);
      // Ensure this client's wallet has 0 Stars
      const quota = getQuotaStatus(clientKey);
      if (quota.starsBalance > 0) {
        deductStars(clientKey, quota.starsBalance);
      }
      expect(getQuotaStatus(clientKey).starsBalance).toBe(0);

      const res = await postClarifier(req);
      expect(res.status).toBe(402);
      const json = await res.json();
      expect(json.code).toBe('INSUFFICIENT_STARS');
    });
  });

  describe('P0-3 (C3): Elimination of PUT /api/payment and manual confirm button', () => {
    it('returns 405 Method Not Allowed on PUT /api/payment', async () => {
      const res = await putPayment();
      expect(res.status).toBe(405);
      const json = await res.json();
      expect(json.code).toBe('METHOD_NOT_ALLOWED');
      expect(json.message).toContain('POST /api/pay/webhook');
    });
  });

  describe('P0-4 (C4): Fail-closed PayOS webhook signature verification', () => {
    it('rejects unsigned payloads when checksum key is absent and sandbox is not explicitly enabled', async () => {
      delete process.env.PAYOS_CHECKSUM_KEY;
      delete process.env.PAYOS_SANDBOX;

      const payload = {
        code: '00',
        desc: 'success',
        data: { orderCode: 12345, amount: 19000 },
      };

      const verification = await verifyPayOsWebhookData(payload);
      expect(verification.verified).toBe(false);
      expect(verification.data).toBeNull();
      expect(verification.error).toContain('fail-closed');
    });

    it('rejects sandbox bypass in production NODE_ENV', async () => {
      process.env.NODE_ENV = 'production';
      process.env.PAYOS_SANDBOX = 'true';
      delete process.env.PAYOS_CHECKSUM_KEY;

      const payload = {
        code: '00',
        desc: 'success',
        data: { orderCode: 12345, amount: 19000 },
      };

      const verification = await verifyPayOsWebhookData(payload);
      expect(verification.verified).toBe(false);
    });
  });

  describe('P0-5 (C5): PayOS Webhook endpoint security & validation', () => {
    beforeEach(() => {
      process.env.PAYOS_SANDBOX = 'true';
    });

    it('returns 404 for unknown/synthetic order code not pre-created', async () => {
      const req = new Request('http://localhost:3000/api/pay/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: '00',
          data: { orderCode: 999999, amount: 19000 },
        }),
      });

      const res = await postPayOsWebhook(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.message).toContain('not found');
    });

    it('returns 400 when transaction code is not 00', async () => {
      savePendingPaymentOrder({
        orderCode: 'TC-111222',
        clientKey: 'user-p05',
        birthYear: 2000,
        packageId: 'dem_suy_19k',
        packageName: 'Gói Đêm Suy',
        amountVnd: 19000,
        starsToCredit: 20,
        isMonthlyPass: false,
        status: 'pending',
        qrDataText: 'VIETQR',
        vietQrImageUrl: 'https://example.com/qr.png',
        checkoutUrl: 'https://pay.payos.vn/web/111222',
        provider: 'payos',
        createdAt: new Date().toISOString(),
      });

      const req = new Request('http://localhost:3000/api/pay/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: '09', // Canceled/Failed
          data: { orderCode: 111222, amount: 19000 },
        }),
      });

      const res = await postPayOsWebhook(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.message).toContain('must be \'00\'');
    });

    it('returns 400 when amount in webhook does not match registered order amount', async () => {
      savePendingPaymentOrder({
        orderCode: 'TC-333444',
        clientKey: 'user-p05-amt',
        birthYear: 2000,
        packageId: 'dem_suy_19k',
        packageName: 'Gói Đêm Suy',
        amountVnd: 19000,
        starsToCredit: 20,
        isMonthlyPass: false,
        status: 'pending',
        qrDataText: 'VIETQR',
        vietQrImageUrl: 'https://example.com/qr.png',
        checkoutUrl: 'https://pay.payos.vn/web/333444',
        provider: 'payos',
        createdAt: new Date().toISOString(),
      });

      const req = new Request('http://localhost:3000/api/pay/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: '00',
          data: { orderCode: 333444, amount: 9000 }, // Underpaid!
        }),
      });

      const res = await postPayOsWebhook(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.message).toContain('Amount mismatch');
    });

    it('confirms legitimate order and prevents duplicate crediting on replay', async () => {
      const clientKey = 'user-replay-test';
      savePendingPaymentOrder({
        orderCode: 'TC-555666',
        clientKey,
        birthYear: 2000,
        packageId: 'dem_suy_19k',
        packageName: 'Gói Đêm Suy',
        amountVnd: 19000,
        starsToCredit: 20,
        isMonthlyPass: false,
        status: 'pending',
        qrDataText: 'VIETQR',
        vietQrImageUrl: 'https://example.com/qr.png',
        checkoutUrl: 'https://pay.payos.vn/web/555666',
        provider: 'payos',
        createdAt: new Date().toISOString(),
      });

      const initialStars = getQuotaStatus(clientKey).starsBalance;

      const legitimateReq = () =>
        new Request('http://localhost:3000/api/pay/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: '00',
            data: { orderCode: 555666, amount: 19000, reference: 'PAYOS_REF_555' },
          }),
        });

      // 1st request -> Successfully credited
      const res1 = await postPayOsWebhook(legitimateReq());
      expect(res1.status).toBe(200);
      const json1 = await res1.json();
      expect(json1.idempotentReplay).toBe(false);
      expect(getQuotaStatus(clientKey).starsBalance).toBe(initialStars + 20);

      // 2nd request (Replay) -> 200 OK with idempotentReplay: true, starsBalance untouched
      const res2 = await postPayOsWebhook(legitimateReq());
      expect(res2.status).toBe(200);
      const json2 = await res2.json();
      expect(json2.idempotentReplay).toBe(true);
      expect(getQuotaStatus(clientKey).starsBalance).toBe(initialStars + 20);
    });
  });

  describe('P0-6 (C6): Elimination of reset_demo_quota backdoor', () => {
    it('returns 400 when client invokes action=reset_demo_quota on PUT /api/reading', async () => {
      const clientKey = 'client-exploit-demo';
      consumeQuota(clientKey, 50, 50);
      consumeQuota(clientKey, 50, 50);
      consumeQuota(clientKey, 50, 50);
      const beforeQuota = getQuotaStatus(clientKey);
      expect(beforeQuota.remainingToday).toBe(0);

      const req = new Request('http://localhost:3000/api/reading', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientKey,
        },
        body: JSON.stringify({ action: 'reset_demo_quota' }),
      });

      const res = await putReading(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe('ACTION_DISABLED');

      // Verify quota and wallet were NOT modified
      const afterQuota = getQuotaStatus(clientKey);
      expect(afterQuota.remainingToday).toBe(0);
      expect(afterQuota.bonusDraws).toBe(0);
    });
  });

  describe('P0-7 (H6): Removal of default tarot_bypass token in middleware', () => {
    it('blocks ?bypass=tarot_bypass when MAINTENANCE_BYPASS_TOKEN is not configured', () => {
      delete process.env.MAINTENANCE_BYPASS_TOKEN;
      process.env.MAINTENANCE_MODE = 'true';

      const req = new NextRequest('http://localhost:3000/reading?bypass=tarot_bypass');
      const res = middleware(req);

      // Should rewrite to /maintenance (bypass rejected)
      expect(res.headers.get('x-middleware-rewrite')).toContain('/maintenance');
      expect(res.cookies.get('maintenance_bypass')).toBeUndefined();
    });

    it('allows bypass only when query param exactly matches configured MAINTENANCE_BYPASS_TOKEN', () => {
      process.env.MAINTENANCE_BYPASS_TOKEN = 'real_secret_token_2026';
      process.env.MAINTENANCE_MODE = 'true';

      // 1. Wrong token -> blocked
      const wrongReq = new NextRequest('http://localhost:3000/reading?bypass=tarot_bypass');
      const wrongRes = middleware(wrongReq);
      expect(wrongRes.headers.get('x-middleware-rewrite')).toContain('/maintenance');

      // 2. Exact match token -> redirects and sets bypass cookie
      const validReq = new NextRequest('http://localhost:3000/reading?bypass=real_secret_token_2026');
      const validRes = middleware(validReq);
      expect(validRes.status).toBe(307); // Redirect to strip query param
      expect(validRes.cookies.get('maintenance_bypass')?.value).toBe('1');
    });
  });

  describe('P0-8 (C8): Rules of Hooks order integrity in StoryPage', () => {
    it('ensures all useMemo calls in StoryPage are declared before any early return statements', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const storyCode = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/(reading)/reading/story/page.tsx'),
        'utf-8'
      );

      const firstUseMemoIndex = storyCode.indexOf('useMemo(');
      const earlyReturnIndex = storyCode.indexOf('if (!readingSuccess)');

      expect(firstUseMemoIndex).toBeGreaterThan(0);
      expect(earlyReturnIndex).toBeGreaterThan(0);
      // All useMemo calls must be hoisted BEFORE the early return
      expect(firstUseMemoIndex).toBeLessThan(earlyReturnIndex);
    });
  });
});
