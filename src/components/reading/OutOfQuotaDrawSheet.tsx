'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Sparkles, CreditCard, Share2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useQuotaSync } from '@/lib/use-quota';
import { soundManager } from '@/lib/sound-effects';
import { getDeviceFingerprintHeaders } from '@/lib/device-fingerprint';

interface OutOfQuotaDrawSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentStars: number;
  onDrawUnlocked: () => void;
  onOpenPayOS: () => void;
}

export default function OutOfQuotaDrawSheet({
  isOpen,
  onClose,
  currentStars,
  onDrawUnlocked,
  onOpenPayOS,
}: OutOfQuotaDrawSheetProps) {
  const { updateQuota } = useQuotaSync();
  const [isUnlockingWithStars, setIsUnlockingWithStars] = useState(false);
  const [isClaimingShare, setIsClaimingShare] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const hasEnoughStars = currentStars >= 3;

  // 1. Đổi 3 Sao lấy 1 lượt bốc bài mới
  const handleUnlockWithStars = async () => {
    if (isUnlockingWithStars) return;
    setIsUnlockingWithStars(true);
    setErrorMessage(null);

    try {
      soundManager.playCrispClick();
      const res = await fetch('/api/reading', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getDeviceFingerprintHeaders(),
        },
        body: JSON.stringify({ action: 'unlock_draw' }),
      });

      const data = await res.json();
      if (res.ok && data?.status === 'ok') {
        soundManager.playMysticChime();
        setSuccessMessage('Đã mở khóa thành công +1 lượt bốc bài mới!');
        if (data.quota) updateQuota(data.quota);
        setTimeout(() => {
          onDrawUnlocked();
          onClose();
        }, 800);
      } else {
        setErrorMessage(data?.message || 'Không thể đổi Sao lúc này. Vui lòng thử lại.');
      }
    } catch {
      setErrorMessage('Mất kết nối mạng. Vui lòng kiểm tra lại đường truyền.');
    } finally {
      setIsUnlockingWithStars(false);
    }
  };

  // 2. Chia sẻ Story nhận +1 lượt free
  const handleShareBonus = async () => {
    if (isClaimingShare) return;
    setIsClaimingShare(true);
    setErrorMessage(null);

    try {
      soundManager.playCrispClick();
      const res = await fetch('/api/reading', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getDeviceFingerprintHeaders(),
        },
        body: JSON.stringify({ action: 'share_bonus' }),
      });

      const data = await res.json();
      if (res.ok && data?.status === 'ok') {
        soundManager.playMysticChime();
        setSuccessMessage('Vũ trụ vừa tặng bạn +1 lượt bốc bài miễn phí!');
        if (data.quota) updateQuota(data.quota);
        setTimeout(() => {
          onDrawUnlocked();
          onClose();
        }, 800);
      } else {
        setErrorMessage(data?.message || 'Bạn đã nhận hết lượt thưởng chia sẻ trong ngày.');
      }
    } catch {
      setErrorMessage('Mất kết nối mạng. Vui lòng kiểm tra lại đường truyền.');
    } finally {
      setIsClaimingShare(false);
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
          className="w-full max-w-md rounded-3xl bg-[#14111C] border border-[#C9A24A]/50 p-5 sm:p-6 text-center shadow-[0_0_50px_rgba(201,162,74,0.2)] relative"
        >
          {/* Nút đóng */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full text-[#9E96B0] hover:text-[#F8F5F0] hover:bg-[#1D1829] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon Header */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#C9A24A]/20 to-[#8B5CF6]/20 border border-[#C9A24A]/40 flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg">
            🎴
          </div>

          <h3 className="font-display text-lg sm:text-xl font-bold text-[#F8F5F0]">
            Đã Hết 3 Lượt Bốc Bài Miễn Phí Hôm Nay
          </h3>
          <p className="text-xs text-[#9E96B0] mt-1.5 leading-relaxed">
            Mỗi ngày bạn có 3 quẻ miễn phí. Bạn có thể dùng Sao trong ví để mở thêm quẻ mới hoặc nạp nhanh qua VietQR.
          </p>

          {/* Banners */}
          {successMessage && (
            <div className="my-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="my-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center justify-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 3 LỰA CHỌN MỞ KHÓA */}
          <div className="mt-4 space-y-3 text-left">
            {/* Lựa chọn 1: Đổi 3 Sao */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                hasEnoughStars
                  ? 'bg-gradient-to-r from-[#1D1829] to-[#171424] border-[#C9A24A] shadow-md'
                  : 'bg-[#120F1D] border-white/10 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#C9A24A] fill-[#C9A24A]" />
                  <span className="text-xs font-bold text-[#F8F5F0]">Bốc tiếp bằng 3 Sao</span>
                </div>
                <span className="text-[11px] text-[#C9A24A] font-semibold">
                  Ví có: {currentStars} ⭐
                </span>
              </div>
              <p className="text-[11px] text-[#9E96B0] mb-3 leading-relaxed">
                {hasEnoughStars
                  ? 'Trừ 3 Sao từ ví và mở khóa ngay 1 lượt bốc bài mới tức thì.'
                  : `Bạn còn thiếu ${3 - currentStars} Sao để đổi lượt này.`}
              </p>
              <button
                type="button"
                disabled={!hasEnoughStars || isUnlockingWithStars}
                onClick={handleUnlockWithStars}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  hasEnoughStars
                    ? 'bg-gradient-to-r from-[#C9A24A] to-[#E5C687] text-[#0B0A12] shadow-sm hover:brightness-105 active:scale-98'
                    : 'bg-white/5 text-[#9E96B0] border border-white/10 cursor-not-allowed'
                }`}
              >
                {isUnlockingWithStars ? (
                  <span>Đang mở khóa...</span>
                ) : (
                  <>
                    <span>Đổi 3 Sao Bốc Bài Ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Lựa chọn 2: Nạp nhanh 5k VietQR */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#C9A24A]/10 to-[#8B5CF6]/10 border border-[#C9A24A]/40 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#C9A24A]" />
                  <span className="text-xs font-bold text-[#F8F5F0]">Nạp nhanh 5.000đ (5 Sao)</span>
                </div>
                <p className="text-[11px] text-[#C9A24A]">Đủ 1 lượt bốc bài & dư 2 Sao hỏi thêm</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPayOS();
                }}
                className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#E5C687] text-[#0B0A12] font-bold text-xs shrink-0 cursor-pointer hover:brightness-105 transition-transform active:scale-95 shadow-sm"
              >
                Nạp 5k
              </button>
            </div>

            {/* Lựa chọn 3: Chia sẻ nhận lượt free */}
            <div className="p-3 rounded-2xl bg-[#120F1D] border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-[#F8F5F0] block">Nhận lượt qua chia sẻ</span>
                  <span className="text-[10px] text-[#9E96B0]">Chia sẻ để nhận thêm +1 lượt</span>
                </div>
              </div>
              <button
                type="button"
                disabled={isClaimingShare}
                onClick={handleShareBonus}
                className="py-1.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isClaimingShare ? 'Đang nhận...' : 'Nhận Free'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
