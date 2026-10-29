import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/quota-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const isAuth = isAdminRequest(request);
  return NextResponse.json({ authenticated: isAuth }, { status: isAuth ? 200 : 401 });
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { success: false, message: 'Dữ liệu JSON không hợp lệ.' },
      { status: 400 }
    );
  }

  const action = typeof body.action === 'string' ? body.action.trim() : '';
  if (action === 'logout') {
    const res = NextResponse.json({ success: true, message: 'Đã đăng xuất quản trị viên.' });
    res.cookies.set('tc_admin_secret', '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      sameSite: 'lax',
    });
    return res;
  }

  const secretInput = typeof body.secret === 'string' ? body.secret.trim() : '';
  const configuredSecret = process.env.ADMIN_SECRET?.trim();

  // Fail-closed: If ADMIN_SECRET is not configured on server
  if (!configuredSecret) {
    return NextResponse.json(
      {
        success: false,
        message: 'ADMIN_SECRET chưa được cấu hình trên máy chủ. Quyền quản trị bị khóa.',
      },
      { status: 403 }
    );
  }

  if (secretInput !== configuredSecret) {
    return NextResponse.json(
      { success: false, message: 'Mã bí mật Quản trị viên (ADMIN_SECRET) không chính xác.' },
      { status: 401 }
    );
  }

  // Authentication succeeded: set secure cookie
  const response = NextResponse.json({
    success: true,
    message: 'Xác thực Quản trị viên thành công.',
  });

  response.cookies.set('tc_admin_secret', configuredSecret, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    sameSite: 'lax',
  });

  return response;
}
