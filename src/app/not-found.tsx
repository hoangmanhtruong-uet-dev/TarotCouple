'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, Home, RotateCcw } from 'lucide-react';

export default function NotFoundPage() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // If browser hit a transient dev-bundler 404 on root or legacy reader slug, auto-recover
    if (pathname === '/') {
      const timer = setTimeout(() => {
        window.location.reload();
      }, 300);
      return () => clearTimeout(timer);
    }
    if (pathname?.startsWith('/reading/reader/')) {
      router.replace('/reading/reader/ba-ngoai');
    }
  }, [pathname, router]);

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#09080D] text-[#F8F5F0] flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-[#14111C] border border-[#C9A24A]/40 shadow-[0_20px_60px_rgba(0,0,0,0.85)] space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#C9A24A]/15 border border-[#C9A24A]/50 flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6 text-[#C9A24A]" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-[0.28em] text-[#C9A24A] font-semibold">
            TAROT COUPLE SANCTUARY
          </span>
          <h1 className="font-display text-3xl font-bold text-[#F8F5F0]">
            Đang Đồng Bộ Không Gian...
          </h1>
          <p className="text-xs sm:text-sm text-[#9E96B0] leading-relaxed">
            Lối đi bạn vừa chạm tới đang được tái tạo hoặc đã chuyển sang cổng
            năng lượng mới.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-[#C9A24A] via-[#E5C687] to-[#C9A24A] text-[#09080D] font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-lg"
          >
            <Home className="w-4 h-4" />
            <span>Về Trang Chủ 3D</span>
          </Link>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-[#1D1829] border border-white/10 text-[#F8F5F0] font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#C9A24A]" />
            <span>Tải Lại</span>
          </button>
        </div>
      </div>
    </div>
  );
}
