'use client';

import React, { useState } from 'react';
import { Sparkles, RefreshCw, ShieldCheck, Clock } from 'lucide-react';

export default function MaintenancePage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#09080D] text-[#F8F5F0] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden selection:bg-[#C9A24A]/30 selection:text-[#E5C687]">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[520px] h-[340px] sm:h-[520px] bg-gradient-to-tr from-[#C9A24A]/10 via-[#8B5CF6]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[280px] h-[280px] bg-[#E5566D]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-lg w-full p-6 sm:p-10 rounded-3xl bg-[#14111C]/90 border border-[#C9A24A]/30 shadow-[0_20px_70px_rgba(0,0,0,0.85)] text-center backdrop-blur-md space-y-6">
        
        {/* Mystic Icon */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#C9A24A]/25 via-[#8B5CF6]/25 to-[#E5C687]/20 blur-md animate-pulse" />
          <div className="relative w-full h-full rounded-2xl bg-[#1D1829] border border-[#C9A24A]/50 flex items-center justify-center shadow-inner">
            <Sparkles className="w-9 h-9 text-[#E5C687] animate-spin-slow" />
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C9A24A]/15 border border-[#C9A24A]/35 text-[#E5C687] text-xs font-semibold uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-[#E5C687] animate-ping" />
          <span>Hệ Thống Đang Nâng Cấp</span>
        </div>

        {/* Headings */}
        <div className="space-y-3">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5F0] tracking-wide">
            Không Gian Huyền Bí <br />
            <span className="bg-gradient-to-r from-[#E5C687] via-[#F8F5F0] to-[#C9A24A] bg-clip-text text-transparent">
              Đang Được Tối Ưu
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#A9A1BC] leading-relaxed">
            Tarot Couple đang tạm dừng hoạt động ít phút để bảo trì định kỳ, nâng cấp máy chủ
            và tinh chỉnh tần số AI nhằm đem lại trải nghiệm trải bài mượt mà và chính xác nhất cho bạn.
          </p>
        </div>

        {/* Information Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
          <div className="p-3.5 rounded-xl bg-[#1D1829]/70 border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#E5C687]">
              <Clock className="w-3.5 h-3.5" />
              <span>Thời gian dự kiến</span>
            </div>
            <p className="text-[11px] text-[#A9A1BC]">
              Khoảng 15 - 30 phút. Chúng tôi sẽ mở lại ngay sau khi hoàn tất.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#1D1829]/70 border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8B5CF6]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Dữ liệu an toàn</span>
            </div>
            <p className="text-[11px] text-[#A9A1BC]">
              Lịch sử và các giao dịch của bạn vẫn được lưu trữ bảo mật tuyệt đối.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#C9A24A] via-[#E5C687] to-[#C9A24A] text-[#09080D] font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(201,162,74,0.35)] hover:shadow-[0_4px_28px_rgba(201,162,74,0.5)] active:scale-[0.98] transition cursor-pointer disabled:opacity-75"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Đang kiểm tra...' : 'Kiểm Tra & Tải Lại Trang'}</span>
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-[11px] text-[#6E677F]">
          Cảm ơn bạn đã kiên nhẫn đồng hành cùng Tarot Couple 🔮
        </p>
      </div>
    </div>
  );
}
