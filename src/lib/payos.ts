import { PayOS } from '@payos/node';

/**
 * Robust PayOS Configuration Reader
 * Resolves credentials from process.env with trim and quote removal:
 * - PAYOS_CLIENT_ID (or NEXT_PUBLIC_PAYOS_CLIENT_ID / PAYOS_CLIENTID)
 * - PAYOS_API_KEY (or PAYOS_APIKEY)
 * - PAYOS_CHECKSUM_KEY (or PAYOS_CHECKSUMKEY / PAYOS_CHECKSUM)
 */
export function getPayOsConfig() {
  const clientId = (
    process.env.PAYOS_CLIENT_ID ||
    process.env.PAYOS_CLIENTID ||
    ''
  )
    .replace(/['"]/g, '')
    .trim();

  // M3: never read secrets from NEXT_PUBLIC_* — Next inlines those into the
  // client bundle, which would expose the API/checksum keys to every visitor.
  const apiKey = (
    process.env.PAYOS_API_KEY ||
    process.env.PAYOS_APIKEY ||
    ''
  )
    .replace(/['"]/g, '')
    .trim();

  const checksumKey = (
    process.env.PAYOS_CHECKSUM_KEY ||
    process.env.PAYOS_CHECKSUMKEY ||
    ''
  )
    .replace(/['"]/g, '')
    .trim();

  const isConfigured = Boolean(
    clientId &&
      apiKey &&
      checksumKey &&
      !clientId.toLowerCase().includes('your_payos') &&
      !apiKey.toLowerCase().includes('your_payos') &&
      clientId !== 'demo' &&
      apiKey !== 'demo'
  );

  return {
    clientId,
    apiKey,
    checksumKey,
    isConfigured,
  };
}

export const isPayOsConfigured = getPayOsConfig().isConfigured;

let cachedClient: PayOS | null = null;
let lastClientId = '';

export function getPayOsClient(): PayOS | null {
  const config = getPayOsConfig();
  if (!config.isConfigured) {
    return null;
  }

  if (!cachedClient || lastClientId !== config.clientId) {
    try {
      cachedClient = new PayOS({
        clientId: config.clientId,
        apiKey: config.apiKey,
        checksumKey: config.checksumKey,
      });
      lastClientId = config.clientId;
    } catch (initErr) {
      console.error('[PayOS] Initialization error:', initErr);
      return null;
    }
  }

  return cachedClient;
}

export const payOSClient = getPayOsClient();

export interface CreatePayOsOrderParams {
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface PayOsOrderResult {
  orderCode: number;
  checkoutUrl: string;
  qrCode: string;
  vietQrImageUrl?: string;
  status: string;
  paymentLinkId?: string;
  isSandbox: boolean;
  bin?: string;
  accountNumber?: string;
  accountName?: string;
  errorMessage?: string;
}

/**
 * Create Payment Link via official PayOS SDK or fallback to authenticated VietQR simulation
 */
export async function createPayOsPaymentLink(
  params: CreatePayOsOrderParams
): Promise<PayOsOrderResult> {
  const client = getPayOsClient();

  if (client) {
    try {
      // PayOS description: max 25 chars, alphanumeric with spaces, no Vietnamese diacritics
      const safeDescription = (params.description || `TC ${params.orderCode}`)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .trim()
        .slice(0, 25);

      const response = await client.paymentRequests.create({
        orderCode: params.orderCode,
        amount: params.amount,
        description: safeDescription || `TC ${params.orderCode}`.slice(0, 25),
        returnUrl: params.returnUrl,
        cancelUrl: params.cancelUrl,
        items: params.items,
      });

      // Construct live VietQR image from real PayOS bank account credentials
      let vietQrImageUrl = '';
      if (response.bin && response.accountNumber) {
        const addInfo = encodeURIComponent(safeDescription || `TC ${params.orderCode}`);
        const accName = encodeURIComponent(response.accountName || 'TAROT COUPLE');
        vietQrImageUrl = `https://img.vietqr.io/image/${response.bin}-${response.accountNumber}-compact2.png?amount=${params.amount}&addInfo=${addInfo}&accountName=${accName}`;
      } else if (response.qrCode) {
        vietQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(response.qrCode)}&size=360x360`;
      }

      return {
        orderCode: response.orderCode,
        checkoutUrl: response.checkoutUrl,
        qrCode: response.qrCode,
        vietQrImageUrl,
        bin: response.bin,
        accountNumber: response.accountNumber,
        accountName: response.accountName,
        status: response.status || 'PENDING',
        paymentLinkId: response.paymentLinkId,
        isSandbox: false,
      };
    } catch (err: any) {
      const errMsg = err?.message || err?.desc || String(err);
      console.error('[PayOS SDK] createPaymentLink live call failed:', errMsg);
      // Return error metadata rather than silently fabricating fake account
      return {
        orderCode: params.orderCode,
        checkoutUrl: `https://pay.payos.vn/web/${params.orderCode}`,
        qrCode: '',
        status: 'FAILED',
        isSandbox: true,
        errorMessage: errMsg,
      };
    }
  }

  // Resilient Sandbox & VietQR fallback for local test environment
  const addInfo = encodeURIComponent(`TC ${params.orderCode}`);
  const vietQrImageUrl = `https://img.vietqr.io/image/MB-0000123456789-compact2.png?amount=${params.amount}&addInfo=${addInfo}&accountName=TAROT%20COUPLE`;
  const qrDataText = `00020101021238570010A00000072701270006970422011300001234567890208QRIBFTTA5303704540${String(params.amount).length}${params.amount}5802VN62${String(String(params.orderCode).length + 4).padStart(2, '0')}08${String(String(params.orderCode).length).padStart(2, '0')}${params.orderCode}6304`;

  return {
    orderCode: params.orderCode,
    checkoutUrl: `https://pay.payos.vn/web/${params.orderCode}`,
    qrCode: qrDataText || vietQrImageUrl,
    vietQrImageUrl,
    status: 'PENDING',
    isSandbox: true,
  };
}

/**
 * Verify PayOS Webhook signature
 */
export async function verifyPayOsWebhookData(webhookBody: unknown): Promise<{
  verified: boolean;
  data: Record<string, unknown> | null;
  error?: string;
}> {
  if (!webhookBody || typeof webhookBody !== 'object') {
    return { verified: false, data: null, error: 'Empty or invalid webhook body' };
  }

  const payload = webhookBody as Record<string, unknown>;
  const client = getPayOsClient();
  const config = getPayOsConfig();

  if (client && config.checksumKey) {
    try {
      const verifiedData = await client.webhooks.verify(payload as any);
      return { verified: true, data: verifiedData as Record<string, unknown> };
    } catch (err: any) {
      return {
        verified: false,
        data: null,
        error: err?.message || 'Signature verification failed',
      };
    }
  }

  // Sandbox simulation mode (ONLY allowed in non-production environments when explicitly enabled via PAYOS_SANDBOX === 'true')
  if (process.env.NODE_ENV !== 'production' && process.env.PAYOS_SANDBOX === 'true') {
    const data = (payload.data || payload) as Record<string, unknown>;
    return {
      verified: true,
      data,
    };
  }

  // Fail-closed default: if missing checksumKey or running in production without verified signature -> REJECT!
  return {
    verified: false,
    data: null,
    error: 'Missing PAYOS_CHECKSUM_KEY or unverified webhook payload in fail-closed mode.',
  };
}
