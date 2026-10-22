import React from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminSecret = process.env.ADMIN_SECRET?.trim();
  // Fail-closed default (H3): If ADMIN_SECRET is not configured, admin portal is completely disabled
  if (!adminSecret) {
    notFound();
  }

  const headerList = await headers();
  const adminHeader = headerList.get('x-admin-secret') || headerList.get('x-admin-mode');
  const authHeader = headerList.get('authorization');
  const bearerToken = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : null;
  const cookieHeader = headerList.get('cookie') || '';
  const adminCookieMatch = cookieHeader.match(/(?:^|;\s*)admin_secret=([^;]+)/);
  const adminCookie = adminCookieMatch ? decodeURIComponent(adminCookieMatch[1]) : null;

  const isAuthorized =
    adminHeader === adminSecret ||
    bearerToken === adminSecret ||
    adminCookie === adminSecret;

  if (!isAuthorized) {
    notFound();
  }

  return (
    <div className="min-h-dvh bg-[#0B0A12] text-[#F8F5F0]">
      <header className="border-b border-[#262235] bg-[#14121F] px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">
          🛠️ QUẢN TRỊ NỘI BỘ (FOUNDER / ADMIN)
        </span>
        <Link href="/" className="text-xs text-[#9E96B0] hover:text-[#F8F5F0]">
          Về Trang Chủ &rarr;
        </Link>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
