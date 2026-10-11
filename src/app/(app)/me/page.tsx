'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Star, Flame, Moon, Gift, Scale, ArrowRight, Sparkles } from 'lucide-react';
import { WalletPayOSModal } from '@/components/WalletPayOSModal';
import { DailyStreakModal } from '@/components/DailyStreakModal';
import { ReferralAndAdModal } from '@/components/ReferralAndAdModal';
import { LegalPrivacyModal } from '@/components/LegalPrivacyModal';
import type { QuotaStatusPayload } from '@/lib/api-types';

export default function MeProfilePage() {
  const shouldReduceMotion = useReducedMotion();
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isStreakOpen, setIsStreakOpen] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);

  const [quota, setQuota] = useState<QuotaStatusPayload>({
    usedToday: 0,
    dailyLimit: 3,
    bonusDraws: 0,
    remainingToday: 3,
    starsBalance: 15,
    streakDays: 1,
    dailyPullCompletedToday: false,
    dailySpendVnd: 0,
    dailySpendCapVnd: 50000,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#D9B36A] uppercase block mb-1">
          TÀI KHOẢN • HỒ SƠ TÂM LINH
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5F0]">
          Không Gian Của Bạn
        </h1>
        <p className="text-xs sm:text-sm text-[#9E96B0] mt-1">
          Quản lý số dư Sao, chuỗi điểm danh streak và tiện ích nhận thưởng.
        </p>
      </motion.div>

      {/* Overview Cards with Tap Scale */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <motion.div
          whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          onClick={() => setIsWalletOpen(true)}
          className="p-5 rounded-2xl bg-[#14121F] border border-[#D9B36A]/40 hover:border-[#D9B36A] transition-all cursor-pointer shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#9E96B0]">Ví Sao</span>
            <Star className="w-4 h-4 text-[#D9B36A] fill-[#D9B36A]" />
          </div>
          <p className="font-display text-2xl font-bold text-[#F8F5F0]">
            {quota.starsBalance ?? 15} Sao
          </p>
          <span className="text-[10px] text-[#D9B36A] font-semibold mt-1 block">
            Nạp thêm với PayOS &rarr;
          </span>
        </motion.div>

        <motion.div
          whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          onClick={() => setIsStreakOpen(true)}
          className="p-5 rounded-2xl bg-[#14121F] border border-amber-500/40 hover:border-amber-400 transition-all cursor-pointer shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#9E96B0]">Streak</span>
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <p className="font-display text-2xl font-bold text-[#F8F5F0]">
            {quota.streakDays ?? 1} Ngày
          </p>
          <span className="text-[10px] text-amber-400 font-semibold mt-1 block">
            Điểm danh nhận +2 Sao &rarr;
          </span>
        </motion.div>
      </div>

      {/* Menu List */}
      <div className="bg-[#14121F]/80 border border-[#262235] rounded-3xl p-3 space-y-1 mb-8 shadow-xl">
        <motion.div whileHover={shouldReduceMotion ? {} : { x: 4 }}>
          <Link
            href="/reading/ve-ban"
            className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-[#1D192C] text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D9B36A]/10 border border-[#D9B36A]/30 flex items-center justify-center text-[#E5C687]">
                <Sparkles className="w-5 h-5 text-[#D9B36A]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#F8F5F0]">Hồ Sơ Tâm Linh Của Bạn</p>
                <p className="text-xs text-[#9E96B0]">Sửa biệt danh, năm sinh, cung hoàng đạo</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#9E96B0]" />
          </Link>
        </motion.div>

        <motion.button
          whileHover={shouldReduceMotion ? {} : { x: 4 }}
          type="button"
          onClick={() => setIsReferralOpen(true)}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-[#1D192C] text-left transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#F8F5F0]">Mời Bạn Bè & Xem Quảng Cáo</p>
              <p className="text-xs text-[#9E96B0]">Nhận +5 Sao khi chia sẻ mã mời</p>
            </div>
          </div>
          <span className="text-xs text-emerald-400 font-bold">+5 Sao</span>
        </motion.button>

        <motion.div whileHover={shouldReduceMotion ? {} : { x: 4 }}>
          <Link
            href="/wrapped"
            className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-[#1D192C] text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D9B36A]/10 border border-[#D9B36A]/30 flex items-center justify-center text-[#E5C687]">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#F8F5F0]">Hồ Sơ Tâm Linh Tháng (Wrapped)</p>
                <p className="text-xs text-[#9E96B0]">Tổng kết năng lượng & tải poster 9:16</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#9E96B0]" />
          </Link>
        </motion.div>

        <motion.div whileHover={shouldReduceMotion ? {} : { x: 4 }}>
          <Link
            href="/me/history"
            className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-[#1D192C] text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#F8F5F0]">Nhật Ký Trải Bài (Journal)</p>
                <p className="text-xs text-[#9E96B0]">Xem lại các lần bốc bài và lời giải cũ</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#9E96B0]" />
          </Link>
        </motion.div>

        <motion.div whileHover={shouldReduceMotion ? {} : { x: 4 }}>
          <Link
            href="/cards"
            className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-[#1D192C] text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#F8F5F0]">Từ Điển 78 Lá Bài (Codex)</p>
                <p className="text-xs text-[#9E96B0]">Tra cứu ý nghĩa toàn bộ 78 lá RWS 1909</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#9E96B0]" />
          </Link>
        </motion.div>

        <motion.button
          whileHover={shouldReduceMotion ? {} : { x: 4 }}
          type="button"
          onClick={() => setIsLegalOpen(true)}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-[#1D192C] text-left transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#9E96B0]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#F8F5F0]">Điều Khoản & Quyền Riêng Tư</p>
              <p className="text-xs text-[#9E96B0]">Chính sách bảo vệ độ tuổi, xóa dữ liệu</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#9E96B0]" />
        </motion.button>
      </div>

      {/* Modals */}
      <WalletPayOSModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        birthYear={2004}
        quota={quota}
        onQuotaUpdated={(newQ) => setQuota(newQ)}
      />

      <DailyStreakModal
        isOpen={isStreakOpen}
        onClose={() => setIsStreakOpen(false)}
        nickname="Linh"
        birthYear={2004}
        readerId="ba_co_mo_hon"
        quota={quota}
        onQuotaUpdated={(newQ) => setQuota(newQ)}
      />

      <ReferralAndAdModal
        isOpen={isReferralOpen}
        onClose={() => setIsReferralOpen(false)}
        nickname="Linh"
        quota={quota}
        onQuotaUpdated={(newQ) => setQuota(newQ)}
      />

      <LegalPrivacyModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        onClearHistory={() => {
          try {
            localStorage.clear();
          } catch {}
        }}
        onResetSession={() => {
          try {
            sessionStorage.clear();
          } catch {}
        }}
      />
    </div>
  );
}
