import { NextResponse } from 'next/server';
import { verifyPayOsWebhookData } from '@/lib/payos';
import { confirmPaymentOrderIdempotent, getPaymentOrder, savePendingPaymentOrder } from '@/lib/quota-store';

/**
 * POST /api/pay/webhook
 * Official PayOS Webhook receiver endpoint per TarotCouple_Plan_GoLive.pdf Section 10.3.
 * 1. Verifies HMAC-SHA256 signature using PAYOS_CHECKSUM_KEY
 * 2. Enforces idempotent transaction processing (prevents double-crediting)
 * 3. Credits Stars safely to user's wallet
 */
export async function POST(request: Request) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  // Verify webhook signature
  const verification = await verifyPayOsWebhookData(rawBody);
  if (!verification.verified || !verification.data) {
    return NextResponse.json(
      {
        status: 'error',
        message: verification.error || 'Invalid PayOS webhook signature',
      },
      { status: 400 }
    );
  }

  const webhookData = verification.data;

  // Requirement: Enforce code === '00' (Payment success code in PayOS)
  const transactionCode = String(
    (rawBody as Record<string, unknown>)?.code ?? webhookData.code ?? ''
  ).trim();
  if (transactionCode !== '00') {
    return NextResponse.json(
      {
        status: 'error',
        message: `Transaction code '${transactionCode}' is not successful (must be '00').`,
      },
      { status: 400 }
    );
  }

  const rawOrderCode = webhookData.orderCode;
  const orderCodeStr = String(rawOrderCode || '').trim();
  const providerRef = String(
    webhookData.reference || webhookData.paymentLinkId || orderCodeStr
  ).trim();

  if (!orderCodeStr) {
    return NextResponse.json(
      { status: 'error', message: 'Missing orderCode in webhook data' },
      { status: 400 }
    );
  }

  // Format order code (supporting both TC-xxx format and numeric PayOS orderCode)
  const fullOrderCode = orderCodeStr.startsWith('TC-')
    ? orderCodeStr
    : `TC-${orderCodeStr}`;

  // Requirement: Reject unknown order with 404 (Fail-closed against synthetic fabricated orders)
  const existing = getPaymentOrder(fullOrderCode) || getPaymentOrder(orderCodeStr);
  if (!existing) {
    return NextResponse.json(
      { status: 'error', message: `Order '${fullOrderCode}' not found.` },
      { status: 404 }
    );
  }

  // Requirement: Verify webhook amount matches stored pending amountVnd
  const webhookAmount = Number(webhookData.amount);
  if (Number.isFinite(webhookAmount) && webhookAmount !== existing.amountVnd) {
    return NextResponse.json(
      {
        status: 'error',
        message: `Amount mismatch: expected ${existing.amountVnd} VND, received ${webhookAmount} VND.`,
      },
      { status: 400 }
    );
  }

  // Execute idempotent confirmation using the pre-registered order (starsToCredit from registered package)
  const confirmed = confirmPaymentOrderIdempotent({
    orderCode: existing.orderCode,
    providerRef,
  });

  return NextResponse.json(
    {
      success: true,
      status: 'ok',
      idempotentReplay: confirmed.idempotentReplay,
      orderCode: existing.orderCode,
      starsCredited: confirmed.idempotentReplay ? 0 : existing.starsToCredit,
    },
    { status: 200 }
  );
}
