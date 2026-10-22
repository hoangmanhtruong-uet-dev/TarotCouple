import { NextResponse } from 'next/server';
import type {
  PaymentOrderPayload,
  ReadingErrorResponse,
  StarPackage,
} from '@/lib/api-types';
import {
  confirmPaymentOrderIdempotent,
  DAILY_SPEND_CAP_VND,
  getDailySpendVnd,
  getPaymentOrder,
  getQuotaStatus,
  resolveClientKey,
  savePendingPaymentOrder,
  type StoredTransaction,
} from '@/lib/quota-store';
import { classifyAgeTier } from '@/lib/safety';
import { createPayOsPaymentLink, isPayOsConfigured, getPayOsConfig } from '@/lib/payos';
import {
  CURRENT_REFERENCE_YEAR,
  MAX_BIRTH_YEAR,
  MIN_BIRTH_YEAR,
} from '@/lib/schemas';

/**
 * Phase 2/3 Star Packages per PLAN.md Section 7.1
 */
const STAR_PACKAGES: StarPackage[] = [
  {
    id: 'clarifier_5k',
    name: 'Gói Lá Làm Rõ',
    priceVnd: 5000,
    stars: 5,
    badge: 'Mở nhanh 1 lá',
    description: 'Đủ mở ngay 1 Lá Làm Rõ (Clarifier) trong phiên trải bài đang mở.',
    perks: [
      '5 Sao vào ví ngay lập tức',
      'Mở khóa 1 Lá Làm Rõ thứ 4',
      'Hỏi thêm 1 câu hỏi phụ cụ thể',
    ],
  },
  {
    id: 'dem_suy_19k',
    name: 'Gói Đêm Suy',
    priceVnd: 19000,
    stars: 20,
    badge: 'Phổ biến nhất',
    description: 'Dành cho những đêm overthinking: đủ 4 lần rút Lá Làm Rõ và mở rộng góc nhìn.',
    perks: [
      '20 Sao (+25% ưu đãi)',
      'Đủ 4 lần rút Lá Làm Rõ chuyên sâu',
      'Trải nghiệm trọn vẹn cả 4 Reader AI',
    ],
  },
  {
    id: 'check_var_29k',
    name: 'Gói Check Var Tình Yêu',
    priceVnd: 29000,
    stars: 35,
    badge: 'Bói Đôi Hot',
    description: 'Combo chuyên sâu cho Bói Đôi Hợp Cạ & Red Flag cùng người thương hoặc crush.',
    perks: [
      '35 Sao (+40% ưu đãi)',
      'Đủ 7 lần rút Lá Làm Rõ & Bói Đôi',
      'Mở khóa phân tích tương hợp 78 lá RWS',
    ],
  },
  {
    id: 'vip_month_69k',
    name: 'Thẻ Tháng Tinh Hà',
    priceVnd: 69000,
    stars: 100,
    badge: 'Tiết kiệm nhất',
    description: '100 Sao sử dụng thoải mái cả tháng, mở toàn bộ 78 lá RWS và không quảng cáo.',
    perks: [
      '100 Sao vào ví Tinh Hà',
      'Mở khóa trọn bộ 78 lá Rider-Waite-Smith',
      'Không quảng cáo trong 30 ngày',
    ],
  },
];

const STAR_PACKAGES_BY_ID: Record<StarPackage['id'], StarPackage> =
  Object.fromEntries(STAR_PACKAGES.map((pkg) => [pkg.id, pkg])) as Record<
    StarPackage['id'],
    StarPackage
  >;

function generateOrderCode(): string {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `TC-${Date.now()}-${rand}`;
}

function hasLivePayOsCredentials(): boolean {
  const clientId = process.env.PAYOS_CLIENT_ID?.trim();
  const apiKey = process.env.PAYOS_API_KEY?.trim();
  return Boolean(
    clientId &&
      apiKey &&
      clientId !== 'your_payos_client_id' &&
      apiKey !== 'your_payos_api_key'
  );
}

/**
 * GET /api/payment
 * Returns all available Star packages and current client's wallet/quota status.
 */
export async function GET(request: Request) {
  const clientKey = resolveClientKey(request);
  const quota = getQuotaStatus(clientKey);

  const { searchParams } = new URL(request.url);
  const orderCode = searchParams.get('orderCode') || searchParams.get('order_code');

  if (orderCode) {
    const order = getPaymentOrder(orderCode);
    if (!order) {
      return NextResponse.json(
        { status: 'error', code: 'ORDER_NOT_FOUND', message: 'Không tìm thấy đơn hàng.' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        status: 'ok',
        order,
        quota,
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    {
      status: 'ok',
      packages: STAR_PACKAGES,
      quota,
    },
    { status: 200 }
  );
}

/**
 * POST /api/payment
 * Creates a PayOS VietQR payment order with strict enforcement of:
 * 1. Under-11 Payment Lock: Users with `age < 11` are blocked from bank/VietQR top-ups (HTTP 403 `AGE_PAYMENT_BLOCKED`).
 * 2. Responsible Daily Spend Cap (`PLAN.md` Section 7.3): Standard packages cannot exceed `50.000đ/ngày` per account (HTTP 400 `DAILY_SPEND_CAP_EXCEEDED`).
 */
export async function POST(request: Request) {
  let rawBody: Record<string, unknown>;
  try {
    rawBody = (await request.json()) as Record<string, unknown>;
  } catch {
    const errRes: ReadingErrorResponse = {
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Dữ liệu gửi lên không đúng định dạng JSON.',
    };
    return NextResponse.json(errRes, { status: 400 });
  }

  const clientKey = resolveClientKey(request);

  const rawBirthYear =
    rawBody.birthYear !== undefined
      ? Number(rawBody.birthYear)
      : rawBody.birth_year !== undefined
      ? Number(rawBody.birth_year)
      : NaN;

  if (
    !Number.isInteger(rawBirthYear) ||
    rawBirthYear < MIN_BIRTH_YEAR ||
    rawBirthYear > MAX_BIRTH_YEAR
  ) {
    const errRes: ReadingErrorResponse = {
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: `Vui lòng cung cấp năm sinh hợp lệ (${MIN_BIRTH_YEAR}–${MAX_BIRTH_YEAR}) để xác minh độ tuổi thanh toán.`,
    };
    return NextResponse.json(errRes, { status: 400 });
  }

  // Step 1: Enforce Under-11 Payment Block
  const agePolicy = classifyAgeTier(rawBirthYear, CURRENT_REFERENCE_YEAR);
  if (!agePolicy.paymentEnabled) {
    const errRes: ReadingErrorResponse = {
      status: 'error',
      code: 'AGE_PAYMENT_BLOCKED',
      message:
        'Tính năng nạp tiền bằng ngân hàng được khóa bảo vệ đối với người dùng dưới 11 tuổi. Bạn có thể nhận Sao miễn phí qua Điểm danh hàng ngày hoặc Chia sẻ ảnh Story!',
      quota: getQuotaStatus(clientKey),
    };
    return NextResponse.json(errRes, { status: 403 });
  }

  const rawPkgId = String(
    rawBody.packageId || rawBody.package_id || 'dem_suy_19k'
  ).trim() as StarPackage['id'];
  const pkg = STAR_PACKAGES_BY_ID[rawPkgId];
  if (!pkg) {
    const errRes: ReadingErrorResponse = {
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Gói Sao đã chọn không hợp lệ.',
    };
    return NextResponse.json(errRes, { status: 400 });
  }

  // Step 2: Enforce Responsible Daily Spend Cap (50.000đ/ngày for standard non-monthly packages) per PLAN.md Section 7.3
  const isMonthlyPass = pkg.id === 'vip_month_69k';
  const currentDailySpend = getDailySpendVnd(clientKey);
  if (
    !isMonthlyPass &&
    currentDailySpend + pkg.priceVnd > DAILY_SPEND_CAP_VND
  ) {
    const errRes: ReadingErrorResponse = {
      status: 'error',
      code: 'DAILY_SPEND_CAP_EXCEEDED',
      message: `Để bảo vệ chi tiêu có trách nhiệm, TarotCouple giới hạn nạp tối đa ${DAILY_SPEND_CAP_VND.toLocaleString('vi-VN')}đ/ngày cho các gói lẻ (hôm nay bạn đã nạp ${currentDailySpend.toLocaleString('vi-VN')}đ). Hãy quay lại vào ngày mai nhé!`,
      quota: getQuotaStatus(clientKey),
    };
    return NextResponse.json(errRes, { status: 400 });
  }

  // Step 3: Create pending PayOS / VietQR order
  // PayOS orderCode must be a positive integer <= 9007199254740991
  const numericOrderCode = Number(`${Date.now() % 1000000000}${Math.floor(Math.random() * 90) + 10}`);
  const orderCode = `TC-${numericOrderCode}`;
  const createdAt = new Date().toISOString();

  let vietQrImageUrl = `https://img.vietqr.io/image/MB-0000123456789-compact2.png?amount=${pkg.priceVnd}&addInfo=${encodeURIComponent(orderCode)}&accountName=TAROT%20COUPLE`;
  let qrDataText = `00020101021238570010A00000072701270006970422011300001234567890208QRIBFTTA5303704540${String(pkg.priceVnd).length}${pkg.priceVnd}5802VN62${String(orderCode.length + 4).padStart(2, '0')}08${String(orderCode.length).padStart(2, '0')}${orderCode}6304`;
  let checkoutUrl = `https://pay.payos.vn/web/${orderCode.toLowerCase()}`;
  let provider: PaymentOrderPayload['provider'] = 'payos_sandbox';

  const payosConfig = getPayOsConfig();
  let payosErrorMessage: string | undefined;

  if (payosConfig.isConfigured) {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://tarotcouple2007.vercel.app';
      const payosResult = await createPayOsPaymentLink({
        orderCode: numericOrderCode,
        amount: pkg.priceVnd,
        description: `TC ${numericOrderCode}`.slice(0, 25),
        returnUrl: `${siteUrl}/me?orderCode=${orderCode}&status=success`,
        cancelUrl: `${siteUrl}/me?orderCode=${orderCode}&status=cancelled`,
        items: [
          {
            name: pkg.name.slice(0, 50),
            quantity: 1,
            price: pkg.priceVnd,
          },
        ],
      });

      if (!payosResult.isSandbox && payosResult.qrCode) {
        provider = 'payos';
        checkoutUrl = payosResult.checkoutUrl || checkoutUrl;
        qrDataText = payosResult.qrCode;
        if (payosResult.vietQrImageUrl) {
          vietQrImageUrl = payosResult.vietQrImageUrl;
        } else if (payosResult.qrCode.startsWith('http')) {
          vietQrImageUrl = payosResult.qrCode;
        } else {
          vietQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(payosResult.qrCode)}&size=360x360`;
        }
      } else if (payosResult.errorMessage) {
        payosErrorMessage = payosResult.errorMessage;
        console.error('[PayOS Live Creation Failed]:', payosResult.errorMessage);
      }
    } catch (payosErr: any) {
      payosErrorMessage = payosErr?.message || String(payosErr);
      console.warn('[PayOS Live Order Creation Exception]:', payosErr);
    }
  }

  const storedTx: StoredTransaction = {
    orderCode,
    clientKey,
    birthYear: rawBirthYear,
    packageId: pkg.id,
    packageName: pkg.name,
    amountVnd: pkg.priceVnd,
    starsToCredit: pkg.stars,
    isMonthlyPass,
    status: 'pending',
    qrDataText,
    vietQrImageUrl,
    checkoutUrl,
    provider,
    createdAt,
  };

  const orderPayload = savePendingPaymentOrder(storedTx);
  const quota = getQuotaStatus(clientKey);

  return NextResponse.json(
    {
      ...orderPayload,
      status: 'ok',
      orderStatus: orderPayload.status,
      order: orderPayload,
      quota,
      isPayOsConfigured: payosConfig.isConfigured,
      payosError: payosErrorMessage || null,
    },
    { status: 200 }
  );
}

/**
 * PUT /api/payment (DEPRECATED & DISABLED - P0-3 / C3)
 * Manual payment confirmation via client PUT is disabled for security.
 * Official payment confirmation must go through POST /api/pay/webhook with signature verification.
 */
export async function PUT() {
  return NextResponse.json(
    {
      status: 'error',
      code: 'METHOD_NOT_ALLOWED',
      message: 'Phương thức PUT /api/payment đã bị vô hiệu hóa vì lý do bảo mật. Vui lòng sử dụng Webhook chính thức của PayOS tại POST /api/pay/webhook.',
    },
    { status: 405 }
  );
}
