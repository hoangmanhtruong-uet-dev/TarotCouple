'use client';

import { useEffect } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service in production
    console.error('[TarotCouple Error]', error);
  }, [error]);

  return (
    <div className="min-h-dvh bg-[#09080D] text-[#F8F5F0] flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-[#14111C] border border-[#C9A24A]/40 shadow-[0_20px_60px_rgba(0,0,0,0.85)] space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#C9A24A]/15 border border-[#C9A24A]/50 flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6 text-[#C9A24A]" />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-[0.28em] text-[#C9A24A] font-semibold">
            TAROT COUPLE SANCTUARY
          </span>
          <h2 className="font-display text-2xl font-bold text-[#F8F5F0]">
            Năng Lượng Bị Gián Đoạn
          </h2>
          <p className="text-xs sm:text-sm text-[#9E96B0] leading-relaxed">
            Đã xảy ra sự cố không mong muốn. Vũ trụ đang tái điều chỉnh năng
            lượng — thử lại ngay nhé.
          </p>
          {error.digest && (
            <p className="text-[10px] text-[#9E96B0]/60 font-mono">
              Mã lỗi: {error.digest}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={reset}
          className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-[#C9A24A] via-[#E5C687] to-[#C9A24A] text-[#09080D] font-bold text-sm inline-flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Thử Lại</span>
        </button>
      </div>
    </div>
  );
}
