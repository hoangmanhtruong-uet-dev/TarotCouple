import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createPayOsPaymentLink, verifyPayOsWebhookData } from '../src/lib/payos';
import { POST as postPayOsWebhook } from '../src/app/api/pay/webhook/route';
import {
  resetAllQuotaStoreForTesting,
  getQuotaStatus,
  savePendingPaymentOrder,
  getPaymentOrder,
} from '../src/lib/quota-store';

describe('PayOS Official Integration & Webhook Security Suite (Phase 0 P0-4 & P0-5)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetAllQuotaStoreForTesting();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('1. creates PayOS payment link with fallback VietQR generation', async () => {
    const order = await createPayOsPaymentLink({
      orderCode: 123456,
      amount: 19000,
      description: 'Nap Sao Tarot',
      returnUrl: 'http://localhost:3000/me',
      cancelUrl: 'http://localhost:3000/sao',
    });

    expect(order.orderCode).toBe(123456);
    expect(order.checkoutUrl).toContain('payos.vn');
    expect(order.qrCode).toBeDefined();
    expect(order.status).toBe('PENDING');
  });

  it('2. verifies PayOS webhook fail-closed: unverified payloads are rejected unless explicit sandbox mode', async () => {
    // Case 1: Empty body rejection
    const invalidRes = await verifyPayOsWebhookData(null);
    expect(invalidRes.verified).toBe(false);

    const mockWebhook = {
      code: '00',
      desc: 'success',
      data: {
        orderCode: 789123,
        amount: 49000,
        reference: 'FT240101999',
      },
    };

    // Case 2: Fail-closed when PAYOS_SANDBOX is not 'true' and checksum key is absent
    delete process.env.PAYOS_SANDBOX;
    delete process.env.PAYOS_CHECKSUM_KEY;
    const failClosedRes = await verifyPayOsWebhookData(mockWebhook);
    expect(failClosedRes.verified).toBe(false);
    expect(failClosedRes.error).toContain('Missing PAYOS_CHECKSUM_KEY');

    // Case 3: In production NODE_ENV, even if PAYOS_SANDBOX='true', it MUST remain fail-closed
    process.env.NODE_ENV = 'production';
    process.env.PAYOS_SANDBOX = 'true';
    const prodRes = await verifyPayOsWebhookData(mockWebhook);
    expect(prodRes.verified).toBe(false);

    // Case 4: In test/development environment with explicit PAYOS_SANDBOX='true'
    process.env.NODE_ENV = 'test';
    process.env.PAYOS_SANDBOX = 'true';
    const validSandboxRes = await verifyPayOsWebhookData(mockWebhook);
    expect(validSandboxRes.verified).toBe(true);
    expect(validSandboxRes.data?.orderCode).toBe(789123);
  });

  it('3. enforces all 4 security checks in POST /api/pay/webhook: order lạ (404), code!=00 (400), sai amount (400), and replay', async () => {
    process.env.PAYOS_SANDBOX = 'true';

    // Pre-register an authentic pending order for user 'client-test-123'
    const legitimateOrderCode = 'TC-999888';
    savePendingPaymentOrder({
      orderCode: legitimateOrderCode,
      clientKey: 'client-test-123',
      birthYear: 2000,
      packageId: 'dem_suy_19k',
      packageName: 'Gói Đêm Suy',
      amountVnd: 19000,
      starsToCredit: 20,
      isMonthlyPass: false,
      status: 'pending',
      qrDataText: `VIETQR:${legitimateOrderCode}`,
      vietQrImageUrl: 'https://example.com/qr.png',
      checkoutUrl: 'https://pay.payos.vn/web/999888',
      provider: 'payos',
      createdAt: new Date().toISOString(),
    });

    const initialQuota = getQuotaStatus('client-test-123');
    const initialStars = initialQuota.starsBalance;

    // --- Case A: Order lạ (unknown orderCode not registered in DB) -> MUST return 404
    const unknownOrderPayload = {
      code: '00',
      data: {
        orderCode: 999999999, // Unregistered
        amount: 19000,
        reference: 'PAYOS_REF_UNKNOWN',
      },
    };
    const resA = await postPayOsWebhook(
      new Request('http://localhost:3000/api/pay/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unknownOrderPayload),
      })
    );
    expect(resA.status).toBe(404);
    const jsonA = await resA.json();
    expect(jsonA.message).toContain('not found');

    // --- Case B: code !== '00' (transaction failed or pending) -> MUST return 400
    const failedCodePayload = {
      code: '01', // Failed code
      data: {
        orderCode: 999888,
        amount: 19000,
        reference: 'PAYOS_REF_FAILED',
      },
    };
    const resB = await postPayOsWebhook(
      new Request('http://localhost:3000/api/pay/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(failedCodePayload),
      })
    );
    expect(resB.status).toBe(400);
    const jsonB = await resB.json();
    expect(jsonB.message).toContain('must be \'00\'');

    // --- Case C: Sai amount (paid amount does not match registered order amount) -> MUST return 400
    const wrongAmountPayload = {
      code: '00',
      data: {
        orderCode: 999888,
        amount: 5000, // Expected 19000!
        reference: 'PAYOS_REF_WRONG_AMT',
      },
    };
    const resC = await postPayOsWebhook(
      new Request('http://localhost:3000/api/pay/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wrongAmountPayload),
      })
    );
    expect(resC.status).toBe(400);
    const jsonC = await resC.json();
    expect(jsonC.message).toContain('Amount mismatch');

    // --- Case D1: Legitimate first webhook confirmation -> 200 OK + credits +20 Stars
    const legitimatePayload = {
      code: '00',
      desc: 'success',
      data: {
        orderCode: 999888,
        amount: 19000,
        reference: 'PAYOS_TX_001',
      },
    };
    const resD1 = await postPayOsWebhook(
      new Request('http://localhost:3000/api/pay/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(legitimatePayload),
      })
    );
    expect(resD1.status).toBe(200);
    const jsonD1 = await resD1.json();
    expect(jsonD1.success).toBe(true);
    expect(jsonD1.idempotentReplay).toBe(false);
    expect(jsonD1.starsCredited).toBe(20);

    const quotaAfterFirst = getQuotaStatus('client-test-123');
    expect(quotaAfterFirst.starsBalance).toBe(initialStars + 20);

    // --- Case D2: Replay attack (same payload sent again) -> 200 OK + idempotentReplay: true + 0 extra stars
    const resD2 = await postPayOsWebhook(
      new Request('http://localhost:3000/api/pay/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(legitimatePayload),
      })
    );
    expect(resD2.status).toBe(200);
    const jsonD2 = await resD2.json();
    expect(jsonD2.idempotentReplay).toBe(true);
    expect(jsonD2.starsCredited).toBe(0);

    const quotaAfterReplay = getQuotaStatus('client-test-123');
    expect(quotaAfterReplay.starsBalance).toBe(initialStars + 20); // No double credit!
  });
});
