import { describe, it, expect, beforeEach } from 'vitest';
import { createPayOsPaymentLink, verifyPayOsWebhookData } from '../src/lib/payos';
import { POST as postPayOsWebhook } from '../src/app/api/pay/webhook/route';
import { resetAllQuotaStoreForTesting, getQuotaStatus } from '../src/lib/quota-store';

describe('PayOS Official Integration & Webhook Security Suite', () => {
  beforeEach(() => {
    resetAllQuotaStoreForTesting();
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

  it('2. verifies PayOS webhook payload verification logic', async () => {
    // Empty body rejection
    const invalidRes = await verifyPayOsWebhookData(null);
    expect(invalidRes.verified).toBe(false);

    // Valid mock payload in simulation mode
    const mockWebhook = {
      code: '00',
      desc: 'success',
      data: {
        orderCode: 789123,
        amount: 49000,
        reference: 'FT240101999',
      },
    };
    const validRes = await verifyPayOsWebhookData(mockWebhook);
    expect(validRes.verified).toBe(true);
    expect(validRes.data?.orderCode).toBe(789123);
  });

  it('3. processes POST /api/pay/webhook idempotently without double-crediting', async () => {
    const webhookPayload = {
      code: '00',
      desc: 'success',
      data: {
        orderCode: 999888,
        amount: 19000,
        reference: 'PAYOS_REF_001',
      },
    };

    // First call -> Credits Stars
    const res1 = await postPayOsWebhook(
      new Request('http://localhost:3000/api/pay/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      })
    );
    expect(res1.status).toBe(200);
    const json1 = await res1.json();
    expect(json1.success).toBe(true);
    expect(json1.idempotentReplay).toBe(false);

    // Second call -> Idempotent Replay, does NOT credit twice
    const res2 = await postPayOsWebhook(
      new Request('http://localhost:3000/api/pay/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      })
    );
    expect(res2.status).toBe(200);
    const json2 = await res2.json();
    expect(json2.success).toBe(true);
    expect(json2.idempotentReplay).toBe(true);
  });
});
