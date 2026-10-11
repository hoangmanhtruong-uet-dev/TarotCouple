import React from 'react';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
