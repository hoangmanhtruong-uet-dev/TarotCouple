import { describe, it, expect, beforeEach } from 'vitest';
import { classifyAgeTier } from '../src/lib/safety';
import { POST as postPayment, GET as getPayment } from '../src/app/api/payment/route';
import {
  resetAllQuotaStoreForTesting,
  savePendingPaymentOrder,
  confirmPaymentOrderIdempotent,
} from '../src/lib/quota-store';
import { CURRENT_REFERENCE_YEAR } from '../src/lib/schemas';

describe('Sprint 2: PayOS VietQR & Age Guardrail (<11t) Verification Suite', () => {
  beforeEach(() => {
    resetAllQuotaStoreForTesting();
  });

  it('1. classifyAgeTier enforces paymentEnabled only for age >= 11', () => {
    // Under 11 years old
    const age10 = classifyAgeTier(2016, 2026);
    expect(age10.age).toBe(10);
    expect(age10.paymentEnabled).toBe(false);

    const age9 = classifyAgeTier(2017, 2026);
    expect(age9.age).toBe(9);
    expect(age9.paymentEnabled).toBe(false);

    // 11 years old and above
    const age11 = classifyAgeTier(2015, 2026);
    expect(age11.age).toBe(11);
    expect(age11.paymentEnabled).toBe(true);

    const age18 = classifyAgeTier(2008, 2026);
    expect(age18.age).toBe(18);
    expect(age18.paymentEnabled).toBe(true);
  });

  it('2. POST /api/payment returns 403 AGE_PAYMENT_BLOCKED for users under 11 years old', async () => {
    const req = new Request('http://localhost:3000/api/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': 'kid_user_test_01',
      },
      body: JSON.stringify({
        birthYear: 2016, // 10 years old in 2026
        packageId: 'clarifier_5k',
      }),
    });

    const res = await postPayment(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.status).toBe('error');
    expect(data.code).toBe('AGE_PAYMENT_BLOCKED');
    expect(data.message).toContain('dưới 11 tuổi');
  });

  it('3. POST /api/payment allows users 11 years and older to create VietQR payment order', async () => {
    const req = new Request('http://localhost:3000/api/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': 'student_11yo_user',
      },
      body: JSON.stringify({
        birthYear: 2015, // 11 years old in 2026
        packageId: 'dem_suy_19k',
      }),
    });

    const res = await postPayment(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.order).toBeDefined();
    expect(data.order.amountVnd).toBe(19000);
    expect(data.order.status).toBe('pending');
  });

  it('4. GET /api/payment?orderCode=... enables client-side polling for order status', async () => {
    const orderCode = 'TC-POLL-9988';
    savePendingPaymentOrder({
      orderCode,
      clientKey: 'polling_client_01',
      packageId: 'clarifier_5k',
      packageName: 'Lá Làm Rõ',
      amountVnd: 5000,
      starsToCredit: 5,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    // 1. Initial poll -> pending
    const pollReq1 = new Request(`http://localhost:3000/api/payment?orderCode=${orderCode}`, {
      method: 'GET',
      headers: { 'x-client-id': 'polling_client_01' },
    });
    const pollRes1 = await getPayment(pollReq1);
    expect(pollRes1.status).toBe(200);
    const pollData1 = await pollRes1.json();
    expect(pollData1.order.status).toBe('pending');

    // 2. Simulate Webhook confirmation
    confirmPaymentOrderIdempotent({ orderCode, providerRef: `payos_${orderCode}` });

    // 3. Second poll -> paid
    const pollReq2 = new Request(`http://localhost:3000/api/payment?orderCode=${orderCode}`, {
      method: 'GET',
      headers: { 'x-client-id': 'polling_client_01' },
    });
    const pollRes2 = await getPayment(pollReq2);
    expect(pollRes2.status).toBe(200);
    const pollData2 = await pollRes2.json();
    expect(pollData2.order.status).toBe('paid');
  });
});
