'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Heart,
  Flame,
  Compass,
  Star,
  Moon,
  Film,
  Gift,
  BarChart3,
  Scale,
  X,
  ChevronRight,
  Smartphone,
  Monitor,
} from 'lucide-react';

export type ActiveMainTab = 'solo' | 'couple';

interface MobileBottomNavProps {
  activeTab: ActiveMainTab;
  onSelectTab: (tab: ActiveMainTab) => void;
  starsBalance: number;
  streakDays: number;
  remainingToday: number;
  onOpenDailyStreak: () => void;
  onOpenWallet: () => void;
  onOpenWrapped: () => void;
  onOpenTikTokStudio: () => void;
  onOpenReferral: () => void;
  onOpenFunnel: () => void;
  onOpenLegal: () => void;
  isFounderMode?: boolean;
  isPhoneSimulator?: boolean;
  onTogglePhoneSimulator?: () => void;
}

export default function MobileBottomNav({
  activeTab,
  onSelectTab,
  starsBalance,
  streakDays,
  remainingToday,
  onOpenDailyStreak,
  onOpenWallet,
  onOpenWrapped,
  onOpenTikTokStudio,
  onOpenReferral,
  onOpenFunnel,
  onOpenLegal,
  isFounderMode = false,
  isPhoneSimulator = false,
  onTogglePhoneSimulator,
}: MobileBottomNavProps) {
  const [isExploreSheetOpen, setIsExploreSheetOpen] = useState(false);

  const handleActionAndClose = (fn: () => void) => {
    setIsExploreSheetOpen(false);
    fn();
  };

  return (
    <>
      {/* iOS / Android Style Bottom Sheet for "Khám Phá & Tiện Ích" */}
      {isExploreSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm transition-opacity"
          onClick={() => setIsExploreSheetOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl border-t border-[#D4AF37]/35 bg-[#12101B] p-5 pb-8 shadow-[0_-16px_50px_rgba(0,0,0,0.85)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#D4AF37]/30" />

            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.2em] text-[#D4AF37] uppercase">
                  Không Gian Tâm Linh • TarotCouple
                </p>
                <h3 className="font-display text-xl font-bold text-[#F8F5F0]">
                  Tiện Ích & Hồ Sơ Của Bạn
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExploreSheetOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#A39BB5] hover:text-white"
                aria-label="Đóng menu khám phá"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Status Row */}
            <div className="mb-4 grid grid-cols-3 gap-2.5 rounded-2xl border border-[#D4AF37]/20 bg-[#09080D]/80 p-3">
              <div className="text-center">
                <p className="text-[11px] text-[#A39BB5]">Lượt hôm nay</p>
                <p className="mt-0.5 text-sm font-bold text-[#F3E5AB]">
                  🔮 {remainingToday} lượt
                </p>
              </div>
              <div className="border-x border-white/10 text-center">
                <p className="text-[11px] text-[#A39BB5]">Chuỗi điểm danh</p>
                <p className="mt-0.5 text-sm font-bold text-amber-400">
                  🔥 {streakDays} ngày
                </p>
              </div>
              <div className="text-center">
                <p className="text-[11px] text-[#A39BB5]">Số dư Ví Sao</p>
                <p className="mt-0.5 text-sm font-bold text-emerald-400">
                  ⭐ {starsBalance} Sao
                </p>
              </div>
            </div>

            {/* Consumer Action List */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleActionAndClose(onOpenWrapped)}
                className="flex w-full items-center justify-between rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-r from-[#D4AF37]/15 via-[#171424] to-[#171424] p-3.5 text-left transition active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F3E5AB]">
                    <Moon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#F8F5F0]">
                        Hồ Sơ Tâm Linh Tháng
                      </span>
                      <span className="rounded-full bg-[#D4AF37]/25 px-2 py-0.5 text-[10px] font-bold text-[#F3E5AB]">
                        Poster 9:16
                      </span>
                    </div>
                    <p className="text-xs text-[#A39BB5]">
                      Tổng kết năng lượng tháng, lá bài bản mệnh & tải Poster 9:16
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#D4AF37]" />
              </button>

              <button
                type="button"
                onClick={() => handleActionAndClose(onOpenReferral)}
                className="flex w-full items-center justify-between rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 via-[#171424] to-[#171424] p-3.5 text-left transition active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/15 text-emerald-300">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#F8F5F0]">
                        Mời Bạn Bè Nhận Lượt Miễn Phí
                      </span>
                      <span className="rounded-full bg-emerald-500/25 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                        +5 ⭐
                      </span>
                    </div>
                    <p className="text-xs text-[#A39BB5]">
                      Chia sẻ mã giới thiệu hoặc xem video ngắn để nhận thêm lượt
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-emerald-300" />
              </button>

              <button
                type="button"
                onClick={() => handleActionAndClose(onOpenLegal)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#171424] p-3.5 text-left transition active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#A39BB5]">
                    <Scale className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#F8F5F0]">
                      Điều Khoản, Độ Tuổi (10+) & Quyền Riêng Tư
                    </p>
                    <p className="text-xs text-[#A39BB5]">
                      Chính sách bảo vệ độ tuổi 10–15, ẩn danh hóa & xóa dữ liệu
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#A39BB5]" />
              </button>

              {/* Founder-Only Internal Tools (Hidden from normal users unless ?admin=1) */}
              {isFounderMode && (
                <div className="mt-3 space-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3">
                  <p className="text-[10px] font-bold tracking-wider text-amber-300 uppercase">
                    🛠️ Công Cụ Quản Trị Nội Bộ (Founder Mode)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleActionAndClose(onOpenFunnel)}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#171424] p-2.5 text-left"
                    >
                      <BarChart3 className="h-4 w-4 shrink-0 text-[#D4AF37]" />
                      <div>
                        <p className="text-xs font-bold text-[#F8F5F0]">Funnel & Chi phí</p>
                        <p className="text-[10px] text-[#A39BB5]">Chỉ số nội bộ</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleActionAndClose(onOpenTikTokStudio)}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#171424] p-2.5 text-left"
                    >
                      <Film className="h-4 w-4 shrink-0 text-rose-300" />
                      <div>
                        <p className="text-xs font-bold text-[#F8F5F0]">TikTok Studio</p>
                        <p className="text-[10px] text-[#A39BB5]">Seeding 3-Slide</p>
                      </div>
                    </button>
                  </div>

                  {onTogglePhoneSimulator && (
                    <button
                      type="button"
                      onClick={() => {
                        onTogglePhoneSimulator();
                        setIsExploreSheetOpen(false);
                      }}
                      className="hidden sm:flex w-full items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/25 bg-[#09080D] py-2 text-xs font-semibold text-[#F3E5AB]"
                    >
                      {isPhoneSimulator ? (
                        <>
                          <Monitor className="h-4 w-4" />
                          Chuyển về Toàn Màn Hình
                        </>
                      ) : (
                        <>
                          <Smartphone className="h-4 w-4" />
                          Bật Khung Giả Lập iPhone
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Thumb-Zone Bottom Tab Bar (4 Tabs matching Redesign UI: Bốc bài | Bói Đôi | Hôm nay | Tôi) */}
      <nav
        aria-label="Thanh điều hướng chính"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#C9A24A]/20 bg-[#0B0A12]/95 backdrop-blur-xl pb-safe"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 items-center px-2 pt-1.5 pb-1">
          {/* Tab 1: Bốc bài */}
          <button
            type="button"
            onClick={() => onSelectTab('solo')}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 transition active:scale-95 ${
              activeTab === 'solo'
                ? 'text-[#E5C687]'
                : 'text-[#9E96B0] hover:text-white'
            }`}
          >
            <div
              className={`flex h-7 w-12 items-center justify-center rounded-full transition ${
                activeTab === 'solo'
                  ? 'bg-[#C9A24A]/20 border border-[#C9A24A]/40'
                  : ''
              }`}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-medium tracking-tight">
              Bốc bài
            </span>
          </button>

          {/* Tab 2: Bói Đôi */}
          <button
            type="button"
            onClick={() => onSelectTab('couple')}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 transition active:scale-95 ${
              activeTab === 'couple'
                ? 'text-[#E5C687]'
                : 'text-[#9E96B0] hover:text-white'
            }`}
          >
            <div
              className={`flex h-7 w-12 items-center justify-center rounded-full transition ${
                activeTab === 'couple'
                  ? 'bg-[#C9A24A]/20 border border-[#C9A24A]/40'
                  : ''
              }`}
            >
              <Heart className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-medium tracking-tight">
              Bói Đôi
            </span>
          </button>

          {/* Tab 3: Hôm nay */}
          <button
            type="button"
            onClick={onOpenDailyStreak}
            className="flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[#9E96B0] hover:text-[#E5C687] transition active:scale-95"
          >
            <div className="flex h-7 w-12 items-center justify-center rounded-full">
              <Moon className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-medium tracking-tight">
              Hôm nay
            </span>
          </button>

          {/* Tab 4: Tôi (Mở Menu Cài đặt, Ví Sao, Quyền riêng tư & Cài đặt) */}
          <button
            type="button"
            onClick={() => setIsExploreSheetOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 transition active:scale-95 ${
              isExploreSheetOpen
                ? 'text-[#E5C687]'
                : 'text-[#9E96B0] hover:text-white'
            }`}
          >
            <div
              className={`flex h-7 w-12 items-center justify-center rounded-full transition ${
                isExploreSheetOpen
                  ? 'bg-[#C9A24A]/20 border border-[#C9A24A]/40'
                  : ''
              }`}
            >
              <Compass className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-medium tracking-tight">
              Tôi
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
