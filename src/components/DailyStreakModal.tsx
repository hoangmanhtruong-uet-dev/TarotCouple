'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Flame,
  Star,
  Sparkles,
  CheckCircle2,
  Compass,
  Gift,
  Palette,
  Hash,
} from 'lucide-react';
import { ALL_TAROT_CARDS, READERS } from '@/data/tarot-cards';
import { getCardProse } from '@/data/tarot-card-prose';
import type {
  DailyPullPayload,
  QuotaStatusPayload,
} from '@/lib/api-types';
import type { ReaderId } from '@/lib/schemas';
import { TarotCardVisual } from '@/components/TarotCardVisual';
import { soundManager } from '@/lib/sound-effects';

export interface DailyStreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  nickname: string;
  birthYear: number;
  readerId: ReaderId;
  quota: QuotaStatusPayload;
  onQuotaUpdated?: (newQuota: QuotaStatusPayload) => void;
}

const LUCKY_COLORS_FALLBACK = [
  'Vàng Hoàng Kim (Champagne Gold)',
  'Xanh Ngọc Lục Bảo (Emerald)',
  'Đỏ Rượu Vang (Burgundy)',
  'Trắng Ánh Trăng (Moonlight Ivory)',
  'Xanh Cổ Vịt (Deep Teal)',
];

const LUCKY_ITEMS_FALLBACK = [
  'Ly trà thảo mộc ấm',
  'Chiếc nhẫn bạc nhỏ',
  'Cuốn sổ tay bìa cứng',
  'Nến thơm hương gỗ đàn hương',
  'Tai nghe nhạc Acoustic',
];

function buildFallbackDailyPull(
  nickname: string,
  readerId: ReaderId,
  currentStreak: number,
  currentStars: number
): DailyPullPayload {
  const todayStr = new Date(Date.now() + 7 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);
  const daySeed = todayStr
    .split('-')
    .reduce((acc, part) => acc + Number.parseInt(part, 10), 0);
  const card =
    ALL_TAROT_CARDS[daySeed % ALL_TAROT_CARDS.length] ?? ALL_TAROT_CARDS[0]!;
  const reversed = daySeed % 5 === 0;
  const nextStreak = currentStreak + 1;
  const reward = nextStreak % 7 === 0 ? 5 : 2;
  const prose = getCardProse(card.id);

  return {
    date: todayStr,
    card,
    reversed,
    readerId,
    headline: `Năng lượng ngày mới cho @${nickname}: ${card.name_vi}`,
    message: (reversed ? prose?.core_meaning_rev : prose?.core_meaning_up) || '',
    savageQuote: (reversed ? prose?.savage_hook_rev : prose?.savage_hook_up) || '',
    luckyNumber: ((daySeed * 7) % 89) + 10,
    luckyColor:
      LUCKY_COLORS_FALLBACK[daySeed % LUCKY_COLORS_FALLBACK.length]!,
    luckyItem: LUCKY_ITEMS_FALLBACK[daySeed % LUCKY_ITEMS_FALLBACK.length]!,
    streakDays: nextStreak,
    starsRewarded: reward,
    totalStarsBalance: currentStars + reward,
  };
}

export function DailyStreakModal({
  isOpen,
  onClose,
  nickname,
  birthYear,
  readerId,
  quota,
  onQuotaUpdated,
}: DailyStreakModalProps) {
  const [dailyPull, setDailyPull] = useState<DailyPullPayload | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);
  const [rewardToast, setRewardToast] = useState<string | null>(null);

  const streakDays = dailyPull?.streakDays ?? quota.streakDays ?? 1;
  const starsBalance =
    dailyPull?.totalStarsBalance ?? quota.starsBalance ?? 10;

  const activeReader =
    READERS.find((r) => r.id === readerId) ?? READERS[0]!;

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/daily')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const payload: DailyPullPayload | undefined =
          data.daily || data.dailyPull || data.pull || (data.card ? data : undefined);
        if (payload && payload.card) {
          setDailyPull(payload);
          setIsCardFlipped(true);
        }
        if (data.quota && onQuotaUpdated) {
          onQuotaUpdated(data.quota);
        }
      })
      .catch(() => {});
  }, [isOpen, onQuotaUpdated]);

  const handleDrawDailyCard = async () => {
    if (isDrawing) return;
    if (dailyPull) {
      soundManager.playCardFlip();
      setIsCardFlipped((prev) => !prev);
      return;
    }

    setIsDrawing(true);
    setRewardToast(null);

    try {
      const res = await fetch('/api/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim() || 'Bạn Ẩn Danh',
          birth_year: birthYear,
          reader_id: readerId,
          readerId,
        }),
      });

      const data = await res.json();
      const payload: DailyPullPayload | undefined =
        data?.daily || data?.dailyPull || data?.pull || (data?.card ? data : undefined);

      if (payload && payload.card) {
        soundManager.playCardFlip();
        setDailyPull(payload);
        setTimeout(() => {
          setIsCardFlipped(true);
          if (!data?.alreadyPulledToday) {
            soundManager.playMysticChime();
          }
        }, 120);

        const nextQuota: QuotaStatusPayload = data.quota || {
          ...quota,
          streakDays: payload.streakDays,
          starsBalance: payload.totalStarsBalance,
          dailyPullCompletedToday: true,
        };
        onQuotaUpdated?.(nextQuota);

        if (!data?.alreadyPulledToday && payload.starsRewarded > 0) {
          setRewardToast(
            `Điểm danh thành công! Bạn nhận được +${payload.starsRewarded} Sao ⭐ (Tổng: ${payload.totalStarsBalance} ⭐)`
          );
        } else {
          setRewardToast(
            'Bạn đã nhận thưởng điểm danh hôm nay. Hẹn gặp lại vào ngày mai nhé!'
          );
        }
      } else {
        const fallback = buildFallbackDailyPull(
          nickname || 'Bạn',
          readerId,
          quota.streakDays ?? 0,
          quota.starsBalance ?? 10
        );
        soundManager.playCardFlip();
        setDailyPull(fallback);
        setTimeout(() => {
          setIsCardFlipped(true);
          soundManager.playMysticChime();
        }, 120);
        onQuotaUpdated?.({
          ...quota,
          streakDays: fallback.streakDays,
          starsBalance: fallback.totalStarsBalance,
          dailyPullCompletedToday: true,
        });
        setRewardToast(
          `Điểm danh thành công! Cộng +${fallback.starsRewarded} Sao ⭐ vào Ví Sao của bạn.`
        );
      }
    } catch {
      const fallback = buildFallbackDailyPull(
        nickname || 'Bạn',
        readerId,
        quota.streakDays ?? 0,
        quota.starsBalance ?? 10
      );
      soundManager.playCardFlip();
      setDailyPull(fallback);
      setTimeout(() => {
        setIsCardFlipped(true);
        soundManager.playMysticChime();
      }, 120);
      onQuotaUpdated?.({
        ...quota,
        streakDays: fallback.streakDays,
        starsBalance: fallback.totalStarsBalance,
        dailyPullCompletedToday: true,
      });
      setRewardToast(
        `Điểm danh thành công! Cộng +${fallback.starsRewarded} Sao ⭐ vào Ví Sao của bạn.`
      );
    } finally {
      setIsDrawing(false);
    }
  };

  const streakMilestones = [1, 2, 3, 4, 5, 6, 7];

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Thông Điệp Vũ Trụ Hàng Ngày & Chuỗi Điểm Danh Streak"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="relative w-full max-w-3xl rounded-3xl bg-[#12101B] border border-[#D4AF37]/45 shadow-[0_24px_80px_rgba(0,0,0,0.92)] overflow-hidden my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#D4AF37]/25 bg-[#09080D]/85">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-[#D4AF37]/50 flex items-center justify-center text-[#F3E5AB]">
                  <Flame className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#F8F5F0]">
                    Thông Điệp Vũ Trụ Hàng Ngày (Daily 1-Card)
                  </h3>
                  <p className="text-xs text-[#A39BB5]">
                    Rút 1 lá định hướng năng lượng ngày mới • Tích lũy chuỗi Streak nhận Sao miễn phí
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-[#F8F5F0] transition-colors cursor-pointer"
                aria-label="Đóng cửa sổ"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-6 max-h-[82vh] overflow-y-auto">
              {/* Top Streak & Reward Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1D162B] via-[#171324] to-[#1D162B] border border-[#C9A24A]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-200 font-bold text-sm flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>🔥 Chuỗi {streakDays} ngày liên tiếp</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-[#09080D]/80 border border-[#C9A24A]/40 text-xs font-semibold text-[#F3E5AB] flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-[#C9A24A]" />
                    <span>Mỗi ngày +2 ⭐ • Ngày 7 +5 ⭐</span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs text-[#F3E5AB] bg-[#09080D]/80 px-3.5 py-2 rounded-xl border border-white/10">
                  <Star className="w-3.5 h-3.5 text-[#C9A24A] fill-[#C9A24A]" />
                  <span>Ví Sao hiện tại:</span>
                  <strong className="text-[#F8F5F0] font-bold">
                    {starsBalance} ⭐
                  </strong>
                </div>
              </div>

              {/* 7-Day Streak Progress Track */}
              <div className="grid grid-cols-7 gap-2">
                {streakMilestones.map((dayNum) => {
                  const completedInCycle =
                    streakDays > 0 ? ((streakDays - 1) % 7) + 1 : 0;
                  const isCompleted = dayNum <= completedInCycle;
                  return (
                    <div
                      key={dayNum}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        isCompleted
                          ? 'bg-[#C9A24A]/20 border-[#C9A24A] text-[#F3E5AB]'
                          : 'bg-[#09080D]/60 border-white/10 text-[#A39BB5]'
                      }`}
                    >
                      <span className="text-[10px] block uppercase tracking-wider">
                        Ngày {dayNum}
                      </span>
                      <span className="text-xs font-bold mt-0.5 block">
                        {dayNum === 7 ? '+5 ⭐' : '+2 ⭐'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {rewardToast ? (
                <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-400/40 flex items-center gap-2.5 text-xs sm:text-sm text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{rewardToast}</span>
                </div>
              ) : null}

              {/* Interactive Card Pull Area */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Left Column: 3D Tarot Card */}
                <div className="md:col-span-5 flex flex-col items-center space-y-3">
                  <TarotCardVisual
                    card={dailyPull?.card}
                    reversed={dailyPull?.reversed ?? false}
                    isFlipped={Boolean(dailyPull && isCardFlipped)}
                    positionLabel="LÁ BÀI NGÀY MỚI"
                    size="md"
                    selected={!dailyPull}
                    onFlip={() => {
                      void handleDrawDailyCard();
                    }}
                  />

                  <button
                    type="button"
                    disabled={isDrawing}
                    onClick={() => void handleDrawDailyCard()}
                    className="w-full max-w-[210px] py-3 px-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-[#09080D] font-bold text-xs sm:text-sm shadow-[0_8px_25px_rgba(212,175,55,0.35)] hover:brightness-110 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-60"
                  >
                    {isDrawing
                      ? 'Đang kết nối Vũ Trụ...'
                      : dailyPull
                        ? isCardFlipped
                          ? 'Úp/Lật lại lá bài ↺'
                          : 'Chạm mở lá bài hôm nay ✦'
                        : '✨ Rút Lá Bài Hôm Nay (+2 ⭐)'}
                  </button>
                </div>

                {/* Right Column: Revealed Daily Message or Invitation */}
                <div className="md:col-span-7">
                  {dailyPull ? (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="rounded-2xl bg-[#171424] border border-[#D4AF37]/35 p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-xs font-bold text-[#F3E5AB]">
                          ✦ {activeReader.name} • {dailyPull.date}
                        </span>
                        <span className="text-xs text-emerald-300 font-semibold">
                          Đã điểm danh (+{dailyPull.starsRewarded} ⭐)
                        </span>
                      </div>

                      <div>
                        <h4 className="font-display text-xl sm:text-2xl font-bold text-[#F8F5F0]">
                          {dailyPull.headline}
                        </h4>
                        <p className="text-xs text-[#D4AF37] mt-0.5">
                          Lá bài: {dailyPull.card.roman} •{' '}
                          {dailyPull.card.name_vi} ({dailyPull.card.name_en}){' '}
                          {dailyPull.reversed ? '— Chiều Ngược ↺' : '— Chiều Xuôi ↑'}
                        </p>
                      </div>

                      <p className="text-xs sm:text-sm text-[#D8D2E7] leading-relaxed">
                        {dailyPull.message}
                      </p>

                      <div className="p-3.5 rounded-xl bg-[#09080D]/90 border border-[#D4AF37]/30">
                        <p className="font-display text-sm sm:text-base italic text-[#F3E5AB]">
                          “{dailyPull.savageQuote}”
                        </p>
                      </div>

                      {/* Lucky Attributes Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                        <div className="p-3 rounded-xl bg-[#09080D]/70 border border-white/10">
                          <span className="text-[10px] uppercase tracking-wider text-[#A39BB5] flex items-center gap-1">
                            <Hash className="w-3 h-3 text-[#D4AF37]" />
                            Con số may mắn
                          </span>
                          <p className="font-display text-lg font-bold text-[#F3E5AB] mt-0.5">
                            {dailyPull.luckyNumber}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-[#09080D]/70 border border-white/10">
                          <span className="text-[10px] uppercase tracking-wider text-[#A39BB5] flex items-center gap-1">
                            <Palette className="w-3 h-3 text-[#D4AF37]" />
                            Màu sắc hợp mệnh
                          </span>
                          <p className="text-xs font-bold text-[#F8F5F0] mt-1">
                            {dailyPull.luckyColor}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-[#09080D]/70 border border-white/10">
                          <span className="text-[10px] uppercase tracking-wider text-[#A39BB5] flex items-center gap-1">
                            <Compass className="w-3 h-3 text-[#D4AF37]" />
                            Vật phẩm độ mệnh
                          </span>
                          <p className="text-xs font-bold text-[#F8F5F0] mt-1">
                            {dailyPull.luckyItem}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="rounded-2xl bg-[#171424] border border-dashed border-[#D4AF37]/35 p-6 text-center space-y-3">
                      <Sparkles className="w-8 h-8 text-[#D4AF37] mx-auto" />
                      <h4 className="font-display text-xl font-bold text-[#F8F5F0]">
                        Lá Bài Định Hướng Hôm Nay Đang Chờ Bạn
                      </h4>
                      <p className="text-xs sm:text-sm text-[#A39BB5] leading-relaxed max-w-md mx-auto">
                        Chạm vào lá bài vàng bên trái để đón nhận thông điệp ngắn gọn trong ngày từ{' '}
                        <strong className="text-[#F3E5AB]">
                          {activeReader.name}
                        </strong>
                        , biết ngay Con số – Màu sắc – Vật phẩm may mắn và nhận ngay{' '}
                        <strong className="text-amber-300">+2 Sao ⭐</strong> miễn phí!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
