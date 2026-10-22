import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isMaintenanceMode =
    process.env.MAINTENANCE_MODE === 'true' ||
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  const { pathname, searchParams } = request.nextUrl;

  // 1. Kiểm tra quyền truy cập đặc biệt (Bypass cho Admin)
  // P0-7 (H6): Không có default token. Nếu thiếu MAINTENANCE_BYPASS_TOKEN trong env -> tắt tính năng bypass hoàn toàn.
  const bypassSecret = process.env.MAINTENANCE_BYPASS_TOKEN?.trim();
  const queryBypass = searchParams.get('bypass');
  const hasBypassCookie = request.cookies.get('maintenance_bypass')?.value === '1';

  // Nếu Admin vào với ?bypass=<token> hợp lệ (và có cấu hình secret) -> lưu cookie và cho phép truy cập bình thường
  if (bypassSecret && queryBypass && queryBypass === bypassSecret) {
    const targetUrl = request.nextUrl.clone();
    targetUrl.searchParams.delete('bypass'); // Xóa query param cho sạch URL
    const response = NextResponse.redirect(targetUrl);
    response.cookies.set('maintenance_bypass', '1', {
      path: '/',
      maxAge: 60 * 60 * 24, // 24 giờ
      httpOnly: true,
      sameSite: 'lax',
    });
    return response;
  }

  // Nếu Admin đã có cookie bypass thì bỏ qua chế độ bảo trì
  if (hasBypassCookie) {
    return NextResponse.next();
  }

  // 2. Các route đặc biệt không bao giờ bị chặn (Webhook thanh toán, v.v.)
  const isExcludedPath =
    pathname.startsWith('/api/payment/webhook') ||
    pathname.startsWith('/api/webhooks');

  if (isExcludedPath) {
    return NextResponse.next();
  }

  // 3. Xử lý khi ĐANG BẬT chế độ bảo trì
  if (isMaintenanceMode) {
    if (pathname !== '/maintenance') {
      const response = NextResponse.rewrite(new URL('/maintenance', request.url));
      response.headers.set('Retry-After', '1800'); // Gợi ý bot/crawler quay lại sau 30 phút
      return response;
    }
    return NextResponse.next();
  }

  // 4. Xử lý khi ĐÃ TẮT bảo trì nhưng user gõ trực tiếp /maintenance
  if (!isMaintenanceMode && pathname === '/maintenance') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Cấu hình matcher để bỏ qua static assets, hình ảnh, favicon, font...
export const config = {
  matcher: [
    /*
     * Khớp tất cả các request ngoại trừ:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg, manifest.json, robots.txt, sitemap.xml
     * - Các định dạng file tĩnh (svg, png, jpg, jpeg, gif, webp, mp4, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.json|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)$).*)',
  ],
};
