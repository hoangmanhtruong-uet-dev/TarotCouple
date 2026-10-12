'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Calendar, Star, X, CreditCard, CheckCircle2 } from 'lucide-react';
import { useQuotaSync } from '@/lib/use-quota';
import { soundManager } from '@/lib/sound-effects';

interface OutOfStarsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  requiredStars: number;
  currentStars: number;
  reasonText?: string;
  onStarsClaimed?: () => void;
}

export default function OutOfStarsSheet({
  isOpen,
  onClose,
  requiredStars,
  currentStars,
  reasonText = 'Số dư Sao hiện tại chưa đủ để tiếp tục hành trình.',
  onStarsClaimed,
}: OutOfStarsSheetProps) {
  const { updateQuota } = useQuotaSync();
  const [isClaimingDaily, setIsClaimingDaily] = useState(false);
  const [dailyClaimSuccess, setDailyClaimSuccess] = useState<string | null>(null);
  const [dailyError, setDailyError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Thực hiện điểm danh nhận 2 Sao ngay tại chỗ
  const handleClaimDaily = async () => {
    if (isClaimingDaily) return;
    setIsClaimingDaily(true);
    setDailyError(null);

    try {
      const res = await fetch('/api/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (res.ok && data?.status === 'ok') {
        soundManager.playMysticChime();
        setDailyClaimSuccess('Điểm danh thành công! Bạn nhận được +2 Sao ⭐');
        if (data.quota) updateQuota(data.quota);
        if (onStarsClaimed) onStarsClaimed();
      } else {
        setDailyError(data?.message || 'Bạn đã điểm danh hôm nay rồi, hãy quay lại vào ngày mai nhé!');
      }
    } catch {
      setDailyError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsClaimingDaily(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#09080D]/85 backdrop-blur-md flex items-center justify-center p-4 select-none"
      >
        <motion.div
          initial={{ scale: 0.94, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.94, y: 20 }}
          className="w-full max-w-sm rounded-3xl bg-[#14111C] border border-[#C9A24A]/50 p-5 sm:p-6 text-center shadow-[0_0_50px_rgba(201,162,74,0.2)] relative"
        >
          {/* Nút đóng */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full text-[#9E96B0] hover:text-[#F8F5F0] hover:bg-[#1D1829] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon Ngôi Sao */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#C9A24A]/20 to-[#8B5CF6]/20 border border-[#C9A24A]/40 flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg">
            ⭐
          </div>

          <h3 className="font-display text-lg font-bold text-[#F8F5F0]">
            Cần Thêm {requiredStars} Sao
          </h3>
          <p className="text-xs text-[#9E96B0] mt-1 leading-relaxed">
            {reasonText} (Số dư hiện tại: <span className="text-[#C9A24A] font-bold">{currentStars} ⭐</span>)
          </p>

          {/* Feedback điểm danh */}
          {dailyClaimSuccess && (
            <div className="my-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{dailyClaimSuccess}</span>
            </div>
          )}
          {dailyError && (
            <div className="my-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {dailyError}
            </div>
          )}

          {/* Các cách nhận thêm Sao */}
          <div className="mt-4 space-y-2.5 text-left">
            {/* Lựa chọn 1: Điểm danh nhận 2 Sao miễn phí */}
            <div className="p-3 rounded-2xl bg-[#1D1829] border border-[#262235] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#F8F5F0]">Điểm danh hôm nay</p>
                  <p className="text-[10px] text-[#9E96B0]">Nhận ngay +2 Sao miễn phí</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClaimDaily}
                disabled={isClaimingDaily || !!dailyClaimSuccess}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isClaimingDaily ? 'Đang nhận...' : dailyClaimSuccess ? 'Đã nhận' : 'Nhận Ngay'}
              </button>
            </div>

            {/* Lựa chọn 2: Nạp PayOS VietQR */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-[#C9A24A]/10 to-[#8B5CF6]/10 border border-[#C9A24A]/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-[#C9A24A] shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#F8F5F0]">Nạp Sao qua VietQR</p>
                  <p className="text-[10px] text-[#C9A24A]">Chỉ từ 10.000đ nhận 10 Sao</p>
                </div>
              </div>
              <a
                href="/me"
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#E879A8] text-[#09080D] font-bold text-xs transition-transform active:scale-95 cursor-pointer shadow-sm"
              >
                Nạp Ngay
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full mt-4 py-2.5 rounded-xl bg-[#1D1829] hover:bg-[#262235] text-[#9E96B0] hover:text-[#F8F5F0] text-xs font-semibold cursor-pointer transition-colors"
          >
            Để sau nha
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
