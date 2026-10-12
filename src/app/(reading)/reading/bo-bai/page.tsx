'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { gsap } from 'gsap';
import { CustomCursorFollower } from '@/components/CustomCursorFollower';
import { useReadingStore } from '@/lib/reading-store';
import { READERS } from '@/data/tarot-cards';
import type { DeckMode, ReaderId } from '@/lib/schemas';
import type { QuotaStatusPayload } from '@/lib/api-types';
import { WalletPayOSModal } from '@/components/WalletPayOSModal';
import { DailyStreakModal } from '@/components/DailyStreakModal';
import { ReferralAndAdModal } from '@/components/ReferralAndAdModal';
import { soundManager } from '@/lib/sound-effects';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  Lock,
  Unlock,
  Check,
  Star,
  AlertCircle,
  X,
  Flame,
  Gift,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';

import { useQuotaSync } from '@/lib/use-quota';
import {
  FREE_DAILY_READINGS,
  FREE_DAILY_FULL_DECK_READINGS,
  FULL_DECK_UNLOCK_STAR_COST,
} from '@/lib/quota-store';

const READER_DECK_PROMPTS: Record<ReaderId, string> = {
  ba_ngoai:
    '22 lá: đủ để nghe điều quan trọng nhất. 78 lá: chi tiết hơn, hợp khi con muốn nghe kỹ nghen.',
  chi_dai:
    'Lượt đầu mở bung cả 78 lá thì tùy ý, các lượt sau muốn mở 78 lá thì cống nạp Sao cho Chị Đại nhé!',
  ban_than:
    '22 lá hay 78 lá đây bồ ơi? Lượt đầu free 78 lá, lượt sau thì tốn chút Sao thôi nhưng chi tiết tới từng chân tơ kẽ tóc!',
  thay_cu_meo:
    'Bộ 22 lá mang năng lượng cốt lõi và định hướng tổng quan. Bộ 78 lá phân tích đa chiều từng chi tiết nguyên nhân - kết quả.',
  ba_co_mo_hon:
    'Lượt đầu mở bung cả 78 lá thì tùy ý, các lượt sau muốn mở 78 lá thì cống nạp 5 Sao cho Bà Cố nhé!',
  tien_tu_chua_lanh:
    'Mỗi bộ bài mang một tầng số khác nhau. Bộ 22 lá cho bức tranh cốt lõi, còn 78 lá mở khóa từng ngóc ngách tâm hồn...',
  tong_tai_ly_tri:
    'Phân tầng tài nguyên: Lượt đầu miễn phí trọn gói 78 lá. Các phiên sau ưu tiên 22 lá hoặc đầu tư 5 Sao để mở phân tích toàn diện.',
  phap_su_toi_co:
    'Khai mở năng lượng của 22 đại diện định mệnh hay triệu hồi trọn vẹn 78 tầng rung động huyền bí...',
};

const DECK_OPTIONS: {
  id: DeckMode;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  cardCount: number;
}[] = [
  {
    id: 'major_22',
    name: 'Bộ 22 lá Ẩn Chính (Major Arcana)',
    tagline: 'Năng lượng cốt lõi, bước ngoặt lớn',
    description:
      'Tập trung vào những bài học linh hồn lớn, chuyển biến định mệnh và thông điệp bao quát từ vũ trụ.',
    badge: 'Kinh Điển • Luôn Miễn Phí',
    cardCount: 22,
  },
  {
    id: 'full_78',
    name: 'Trọn bộ 78 lá Tarot (RWS 1909)',
    tagline: 'Chi tiết sâu sắc, bao gồm cả đời sống hàng ngày',
    description:
      'Bao gồm cả 4 bộ Ẩn phụ (Gậy, Cốc, Kiếm, Tiền), bóc tách sắc sảo tình huống đời thường và góc nhìn cụ thể.',
    badge: 'Toàn Diện • Rực Rỡ Chi Tiết',
    cardCount: 78,
  },
];

export default function BoBaiSelectionPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const {
    selectedReaderId,
    readerAccentColor,
    hasFilledProfile,
    nickname,
    birthYear,
    selectedTopic,
    deckMode,
    questionText,
    setContextForm,
  } = useReadingStore();

  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Route guard: Nếu chưa điền thông tin hoặc chưa chọn chủ đề thì chuyển về bước còn thiếu
  useEffect(() => {
    if (!isHydrated) return;
    const hasProfile = hasFilledProfile && Boolean(nickname?.trim()) && Boolean(birthYear);
    if (!hasProfile) {
      router.replace('/reading/ve-ban');
      return;
    }
    if (!selectedTopic) {
      router.replace('/reading/chu-de');
      return;
    }
  }, [isHydrated, hasFilledProfile, nickname, birthYear, selectedTopic, router]);

  const activeReader = READERS.find((r) => r.id === selectedReaderId) || READERS[0]!;

  // Quota server-side state with synchronized hook
  const { quota, updateQuota, isLoading: isLoadingQuota, refreshQuota } = useQuotaSync();
  const [isDissolving, setIsDissolving] = useState(false);

  // Bottom sheets & Modals state
  const [isUnlockSheetOpen, setIsUnlockSheetOpen] = useState(false);
  const [isOutOfTurnsSheetOpen, setIsOutOfTurnsSheetOpen] = useState(false);
  const [isUnlockingLoading, setIsUnlockingLoading] = useState(false);
  const [unlockToast, setUnlockToast] = useState<string | null>(null);
  const [isLockShaking, setIsLockShaking] = useState(false);

  // Aux growth modals
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isStreakOpen, setIsStreakOpen] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);

  const deckCardRefsMap = useRef<Map<string, HTMLElement>>(new Map());
  const deckIdleRafRef = useRef<number | null>(null);
  const pointerBridgeRef = useRef({ x: 0, y: 0 });

  // GSAP mount reveal
  useEffect(() => {
    if (!isHydrated) return;
    if (shouldReduceMotion) return;
    gsap.fromTo(
      '[data-deck-card]',
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out' }
    );
  }, [isHydrated, shouldReduceMotion]);

  // Autonomous mobile idle sway
  useEffect(() => {
    const isTouchDevice =
      typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;
    if (!isTouchDevice || shouldReduceMotion) return;
    const loop = () => {
      const now = Date.now() / 1000;
      let i = 0;
      for (const [, el] of deckCardRefsMap.current) {
        const rotX = Math.cos(now * 0.9 + i * 1.1) * 3;
        const rotY = Math.sin(now * 1.2 + i * 0.8) * 4.5;
        el.style.transform = `perspective(950px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
        i++;
      }
      deckIdleRafRef.current = requestAnimationFrame(loop);
    };
    deckIdleRafRef.current = requestAnimationFrame(loop);
    return () => {
      if (deckIdleRafRef.current !== null) cancelAnimationFrame(deckIdleRafRef.current);
    };
  }, [shouldReduceMotion]);

  const handleDeckPointerMove = (e: React.PointerEvent<HTMLElement>, deckId: string) => {
    const el = deckCardRefsMap.current.get(deckId);
    if (!el || shouldReduceMotion) return;
    const rect = el.getBoundingClientRect();
    const normX = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
    const normY = Math.max(-1, Math.min(1, -((e.clientY - rect.top) / rect.height) * 2 + 1));
    pointerBridgeRef.current = { x: normX, y: normY };
    el.style.transform = `perspective(950px) rotateX(${(normY * 8).toFixed(2)}deg) rotateY(${(normX * 10).toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleDeckPointerLeave = (deckId: string) => {
    const el = deckCardRefsMap.current.get(deckId);
    if (el) el.style.transform = '';
    pointerBridgeRef.current = { x: 0, y: 0 };
  };

  const handleDeckTouchMove = (e: React.TouchEvent<HTMLElement>, deckId: string) => {
    const touch = e.touches[0];
    if (!touch) return;
    const el = deckCardRefsMap.current.get(deckId);
    if (!el || shouldReduceMotion) return;
    const rect = el.getBoundingClientRect();
    const normX = Math.max(-1, Math.min(1, ((touch.clientX - rect.left) / rect.width) * 2 - 1));
    const normY = Math.max(-1, Math.min(1, -((touch.clientY - rect.top) / rect.height) * 2 + 1));
    el.style.transform = `perspective(950px) rotateX(${(normY * 8).toFixed(2)}deg) rotateY(${(normX * 10).toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  // If server says full deck is locked and user is currently on full_78, fallback to major_22
  useEffect(() => {
    if (quota.canUseFullDeck === false && deckMode === 'full_78') {
      setContextForm({ deckMode: 'major_22' });
    }
  }, [quota.canUseFullDeck, deckMode, setContextForm]);

  // Typewriter effect
  const readerPrompt =
    READER_DECK_PROMPTS[selectedReaderId] || READER_DECK_PROMPTS.ba_ngoai;
  const [displayedPrompt, setDisplayedPrompt] = useState('');
  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayedPrompt(readerPrompt);
      return;
    }
    setDisplayedPrompt('');
    let idx = 0;
    const timer = setInterval(() => {
      idx++;
      setDisplayedPrompt(readerPrompt.slice(0, idx));
      if (idx >= readerPrompt.length) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [readerPrompt, shouldReduceMotion]);

  // Kiểm tra quyền bộ 78 lá và số lượt còn lại
  const isOutOfTurns = (quota.remainingToday ?? 3) <= 0;
  const isFullDeckLocked = !quota.canUseFullDeck;
  const isUnder18 = birthYear ? 2026 - birthYear < 18 : false;

  useEffect(() => {
    return () => {
      soundManager.cleanupRouteAudio();
    };
  }, []);

  const handleSelectDeck = (deckId: DeckMode) => {
    soundManager.playCrispClick();
    if (deckId === 'full_78' && isFullDeckLocked) {
      // Bấm vào ổ khóa -> Rung ổ khóa và hiện bottom sheet xác nhận trừ Sao
      setIsLockShaking(true);
      setTimeout(() => setIsLockShaking(false), 450);
      setIsUnlockSheetOpen(true);
      return;
    }
    soundManager.playOrganicCardFlip();
    setContextForm({ deckMode: deckId });
    // GSAP 3D card flip on select
    if (!shouldReduceMotion) {
      const el = deckCardRefsMap.current.get(deckId);
      if (el) {
        gsap.fromTo(
          el,
          { rotationY: -18, scale: 0.95 },
          { rotationY: 0, scale: 1, duration: 0.38, ease: 'back.out(1.4)', overwrite: 'auto' }
        );
      }
    }
  };

  const handleConfirmUnlock = async () => {
    setIsUnlockingLoading(true);
    try {
      const res = await fetch('/api/reading', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unlock_full_deck' }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        if (data.quota) updateQuota(data.quota);
        setContextForm({ deckMode: 'full_78' });
        setIsUnlockSheetOpen(false);
        setUnlockToast('🎉 Đã mở khóa thành công trọn bộ 78 lá cho lượt này!');
        setTimeout(() => setUnlockToast(null), 3500);
      } else {
        // Không đủ Sao
        setUnlockToast('Số dư Sao không đủ để mở khóa.');
        setTimeout(() => setUnlockToast(null), 3000);
      }
    } catch {
      setUnlockToast('Có lỗi xảy ra khi mở khóa, vui lòng thử lại.');
      setTimeout(() => setUnlockToast(null), 3000);
    } finally {
      setIsUnlockingLoading(false);
    }
  };

  const handleStartShuffle = () => {
    if (isOutOfTurns) {
      setIsOutOfTurnsSheetOpen(true);
      return;
    }

    if (deckMode === 'full_78' && isFullDeckLocked) {
      setIsUnlockSheetOpen(true);
      return;
    }

    setIsDissolving(true);
    setTimeout(() => {
      router.push('/reading/rut-bai');
    }, shouldReduceMotion ? 50 : 450);
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={shouldReduceMotion ? {} : { opacity: 0, x: -16 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative max-w-xl mx-auto px-4 pt-4 sm:pt-6 pb-36 overflow-hidden"
    >
      {/* Toast thông báo */}
      <AnimatePresence>
        {unlockToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-18 left-4 right-4 z-50 max-w-md mx-auto p-3.5 rounded-2xl bg-gradient-to-r from-[#C9A24A] to-[#C49A4D] text-[#0B0A12] font-bold text-xs shadow-2xl flex items-center justify-between gap-2"
          >
            <span>{unlockToast}</span>
            <button
              type="button"
              onClick={() => setUnlockToast(null)}
              className="p-1 hover:bg-black/10 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Golden Particle Dissolve Overlay khi bấm Xáo bài */}
      <AnimatePresence>
        {isDissolving && !shouldReduceMotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-[#0B0A12]/85"
          >
            <div className="relative text-center">
              {[...Array(24)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{
                    x: (Math.random() - 0.5) * 320,
                    y: (Math.random() - 0.5) * 320,
                    scale: 0,
                    opacity: 0,
                  }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  className="absolute w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: readerAccentColor,
                    boxShadow: `0 0 12px ${readerAccentColor}`,
                  }}
                />
              ))}
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="absolute inset-0 flex items-center justify-center font-serif text-sm tracking-widest uppercase animate-pulse"
                style={{ color: readerAccentColor }}
              >
                Xáo Bài Nghi Lễ...
              </motion.span>
              <span
                className="text-base font-bold tracking-widest uppercase block animate-pulse opacity-0"
                style={{ color: readerAccentColor }}
              >
                Vũ Trụ Đang Xáo Bài...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Avatar nhỏ Reader + Câu mở đầu theo giọng Reader */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3.5 p-4 rounded-3xl bg-[#14121F]/90 border border-[#262235] mb-5 shadow-xl"
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 shadow-inner"
          style={{
            backgroundColor: `${readerAccentColor}25`,
            border: `1.5px solid ${readerAccentColor}60`,
            color: readerAccentColor,
          }}
        >
          {activeReader.avatar_symbol}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h2 className="font-display text-sm font-bold text-[#F8F5F0]">
              {activeReader.name}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                Lượt: {quota.remainingToday}/3
              </span>
              <span className="text-[10px] text-[#C9A24A] font-bold bg-[#C9A24A]/10 px-2 py-0.5 rounded-full border border-[#C9A24A]/30 flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-[#C9A24A]" />
                {quota.starsBalance ?? 10}
              </span>
            </div>
          </div>
          <p className="text-xs text-[#E5C687] italic font-serif leading-relaxed min-h-[30px]">
            &ldquo;{displayedPrompt}&rdquo;
            {displayedPrompt.length < readerPrompt.length && (
              <span className="inline-block w-1.5 h-3 ml-0.5 bg-[#C9A24A] animate-pulse align-middle" />
            )}
          </p>
        </div>
      </motion.div>

      {/* Title */}
      <div className="mb-4">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-[#F8F5F0]">
          Chọn Quy Mô Bộ Bài
        </h1>
        <p className="text-xs text-[#9E96B0] mt-0.5">
          {quota.usedToday === 0
            ? '🎁 Lượt đầu tiên hôm nay: Bạn được tự do chọn bộ 78 lá hoặc 22 lá!'
            : 'Từ lượt thứ 2: Bộ 22 lá miễn phí, bộ 78 lá có thể mở khóa bằng 5 Sao.'}
        </p>
      </div>

      {/* 2 Lựa chọn lớn */}
      <div className="space-y-4 mb-6">
        {DECK_OPTIONS.map((deck) => {
          const isSelected = deckMode === deck.id;
          const isLocked = deck.id === 'full_78' && isFullDeckLocked;

          return (
            <motion.div
              key={deck.id}
              data-deck-card
              ref={(el) => { if (el) deckCardRefsMap.current.set(deck.id, el); }}
              animate={isSelected && !isLocked ? { y: -2 } : { y: 0 }}
              whileHover={shouldReduceMotion ? {} : { scale: 1.015, y: -3 }}
              whileTap={
                isLocked
                  ? { x: [-3, 3, -2, 2, 0] }
                  : shouldReduceMotion
                  ? {}
                  : { scale: 0.985 }
              }
              onClick={() => handleSelectDeck(deck.id)}
              onPointerMove={(e) => handleDeckPointerMove(e, deck.id)}
              onPointerLeave={() => handleDeckPointerLeave(deck.id)}
              onTouchMove={(e) => handleDeckTouchMove(e, deck.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden will-change-transform ${
                isSelected && !isLocked
                  ? 'bg-[#181429] shadow-xl ring-1'
                  : isLocked
                  ? 'bg-[#110E1C]/80 border-[#322B45] opacity-90'
                  : 'bg-[#14121F]/80 hover:bg-[#181429]/60 border-[#262235]'
              }`}
              style={{
                borderColor:
                  isSelected && !isLocked
                    ? readerAccentColor
                    : isLocked
                    ? '#3A3250'
                    : '#262235',
                boxShadow:
                  isSelected && !isLocked
                    ? `0 0 30px ${readerAccentColor}25`
                    : undefined,
              }}
            >
              {/* Top row: Badge + Card count */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <motion.span
                  animate={isLocked && isLockShaking ? { x: [-4, 4, -4, 4, -2, 2, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                  style={{
                    backgroundColor: isLocked
                      ? '#2A233C'
                      : isSelected
                      ? `${readerAccentColor}25`
                      : '#262235',
                    color: isLocked
                      ? '#E5C687'
                      : isSelected
                      ? readerAccentColor
                      : '#9E96B0',
                    border: `1px solid ${
                      isLocked
                        ? '#5E4F28'
                        : isSelected
                        ? `${readerAccentColor}50`
                        : '#3B354D'
                    }`,
                  }}
                >
                  {isLocked && <Lock className="w-3 h-3 text-amber-400" />}
                  {isLocked ? 'Khóa Lượt 2 & 3 • Cần 5 Sao' : deck.badge}
                </motion.span>

                <div className="flex items-center gap-1.5 text-xs text-[#C9A24A] font-semibold">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{deck.cardCount} Lá</span>
                </div>
              </div>

              {/* Title & Tagline */}
              <div className="mb-2">
                <h3 className="font-display text-base sm:text-lg font-bold text-[#F8F5F0] mb-0.5 flex items-center gap-2">
                  <span>{deck.name}</span>
                </h3>
                <p className="text-xs font-semibold text-[#E5C687]">
                  {deck.tagline}
                </p>
              </div>

              {/* Description */}
              <p className="text-xs text-[#9E96B0] leading-relaxed mb-3">
                {deck.description}
              </p>

              {/* Action row for Locked Full Deck */}
              {isLocked ? (
                <div className="pt-2 border-t border-[#262235] flex items-center justify-between">
                  <span className="text-[11px] text-amber-300 flex items-center gap-1 font-semibold">
                    <Star className="w-3.5 h-3.5 text-[#C9A24A] fill-[#C9A24A]" />
                    Mở khóa bằng Ví Sao: 5 Sao
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsUnlockSheetOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#0B0A12] text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Mở khóa ngay</span>
                  </button>
                </div>
              ) : isSelected ? (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 absolute top-5 right-5 shadow-md"
                  style={{ backgroundColor: readerAccentColor }}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : null}
            </motion.div>
          );
        })}
      </div>

      {/* Cảnh báo khi hết lượt hôm nay */}
      {isOutOfTurns && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-xs text-rose-200 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-300 mb-1">Bạn đã hết lượt hôm nay (0/3)</p>
            <p className="text-[11px] text-[#E5C687] leading-relaxed">
              Bạn có thể nhận thêm lượt ngay bằng cách chia sẻ ảnh Story 9:16 hoặc tham gia điểm danh chuỗi!
            </p>
          </div>
        </div>
      )}

      {/* THANH ĐÁY CỐ ĐỊNH */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0E0D17]/95 border-t border-[#262235] p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          {/* Nút phụ: Sửa Nỗi niềm */}
          <button
            type="button"
            onClick={() => router.push('/reading/noi-niem')}
            className="py-3.5 px-4 rounded-2xl bg-[#14121F] hover:bg-[#1D192C] border border-[#262235] text-[#9E96B0] font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sửa nỗi niềm</span>
          </button>

          {/* Nút chính: Xáo bài */}
          <button
            type="button"
            onClick={handleStartShuffle}
            disabled={isDissolving}
            className={`flex-1 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              isOutOfTurns
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-[#F8F5F0]'
                : 'bg-gradient-to-r from-[#C9A24A] to-[#C49A4D] hover:from-[#E5C687] hover:to-[#C9A24A] text-[#0B0A12] shadow-[0_4px_25px_rgba(217,179,106,0.35)] transform active:scale-98'
            }`}
          >
            {isOutOfTurns ? (
              <>
                <Gift className="w-4 h-4" />
                <span>Nhận Thêm Lượt &rarr;</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Xáo Bài & Rút Bài</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM SHEET 1: MỞ KHÓA BỘ 78 LÁ BẰNG SAO
      ========================================================================== */}
      <AnimatePresence>
        {isUnlockSheetOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#14121F] border border-[#262235] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsUnlockSheetOpen(false)}
                className="absolute top-4 right-4 p-2 text-[#9E96B0] hover:text-[#F8F5F0] rounded-full hover:bg-[#262235]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
                  style={{
                    backgroundColor: `${readerAccentColor}25`,
                    color: readerAccentColor,
                  }}
                >
                  <Unlock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#F8F5F0]">
                    Mở Khóa Trọn Bộ 78 Lá
                  </h3>
                  <p className="text-xs text-[#9E96B0]">
                    Khai mở chi tiết 56 lá Ẩn phụ cho trải bài sâu sắc
                  </p>
                </div>
              </div>

              {/* Chi tiết chi phí */}
              <div className="p-4 rounded-2xl bg-[#0B0A12] border border-[#262235] mb-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9E96B0]">Chi phí mở khóa:</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {FULL_DECK_UNLOCK_STAR_COST} Sao ⭐
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#262235]">
                  <span className="text-[#9E96B0]">Số dư Ví Sao hiện tại:</span>
                  <span className="text-[#F8F5F0] font-bold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-[#C9A24A] fill-[#C9A24A]" />
                    {quota.starsBalance ?? 10} Sao
                  </span>
                </div>
              </div>

              {/* Nếu đủ Sao: Nút xác nhận trừ Sao */}
              {(quota.starsBalance ?? 0) >= FULL_DECK_UNLOCK_STAR_COST ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleConfirmUnlock}
                    disabled={isUnlockingLoading}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#0B0A12] font-bold text-sm shadow-[0_4px_25px_rgba(217,179,106,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>
                      {isUnlockingLoading
                        ? 'Đang mở khóa...'
                        : `Xác nhận trừ ${FULL_DECK_UNLOCK_STAR_COST} Sao để mở khóa`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setContextForm({ deckMode: 'major_22' });
                      setIsUnlockSheetOpen(false);
                    }}
                    className="w-full py-3 text-xs text-[#9E96B0] hover:text-[#F8F5F0] cursor-pointer"
                  >
                    Dùng bộ 22 lá miễn phí cho lượt này &rarr;
                  </button>
                </div>
              ) : (
                /* Nếu không đủ Sao: Dẫn sang nạp Sao hoặc kiếm Sao */
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed mb-4">
                    {isUnder18 ? (
                      <div className="flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Chính sách an toàn 10–15 tuổi:</strong> Tính năng nạp tiền ngân hàng được khóa bảo vệ. Bạn hoàn toàn có thể dùng Sao kiếm từ <strong>Điểm danh hàng ngày</strong> hoặc <strong>Mời bạn bè</strong> để mở khóa bộ 78 lá hoàn toàn miễn phí!
                        </span>
                      </div>
                    ) : (
                      <span>
                        Số dư Ví Sao của bạn không đủ ({quota.starsBalance ?? 0}/{FULL_DECK_UNLOCK_STAR_COST} Sao). Hãy nạp thêm hoặc tham gia nhiệm vụ nhận Sao miễn phí!
                      </span>
                    )}
                  </div>

                  {!isUnder18 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUnlockSheetOpen(false);
                        setIsWalletOpen(true);
                      }}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#C9A24A] to-[#C49A4D] hover:from-[#E5C687] hover:to-[#C9A24A] text-[#0B0A12] font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Nạp Sao bằng PayOS VietQR &rarr;</span>
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUnlockSheetOpen(false);
                        setIsStreakOpen(true);
                      }}
                      className="py-3 px-3 rounded-xl bg-[#0B0A12] hover:bg-[#1D192C] border border-amber-500/40 text-amber-400 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Điểm danh (+2 ⭐)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUnlockSheetOpen(false);
                        setIsReferralOpen(true);
                      }}
                      className="py-3 px-3 rounded-xl bg-[#0B0A12] hover:bg-[#1D192C] border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Gift className="w-4 h-4" />
                      <span>Mời bạn (+5 ⭐)</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          BOTTOM SHEET 2: HẾT LƯỢT HÔM NAY
      ========================================================================== */}
      <AnimatePresence>
        {isOutOfTurnsSheetOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#14121F] border border-[#262235] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setIsOutOfTurnsSheetOpen(false)}
                className="absolute top-4 right-4 p-2 text-[#9E96B0] hover:text-[#F8F5F0] rounded-full hover:bg-[#262235]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-3">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h3 className="font-display text-xl font-bold text-[#F8F5F0]">
                  Hết Lượt Hôm Nay (0/3)
                </h3>
                <p className="text-xs text-[#9E96B0] mt-1 max-w-sm mx-auto leading-relaxed">
                  Bạn đã dùng hết 3 lượt bốc bài miễn phí của ngày hôm nay. Hãy quay lại vào ngày mai hoặc nhận thêm lượt ngay bằng cách:
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {/* 1. Chia sẻ Story */}
                <button
                  type="button"
                  onClick={async () => {
                    await fetch('/api/reading', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'share_bonus' }),
                    });
                    await refreshQuota();
                    setIsOutOfTurnsSheetOpen(false);
                    setUnlockToast('🎉 Bạn được tặng +1 lượt bốc bài từ chia sẻ!');
                  }}
                  className="w-full p-4 rounded-2xl bg-[#0B0A12] hover:bg-[#1D192C] border border-[#262235] flex items-center justify-between text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#F8F5F0]">Chia sẻ Story 9:16</p>
                      <p className="text-[11px] text-[#9E96B0]">Nhận ngay +1 lượt trải bài miễn phí</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-purple-400">+1 Lượt</span>
                </button>

                {/* 2. Điểm danh */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOutOfTurnsSheetOpen(false);
                    setIsStreakOpen(true);
                  }}
                  className="w-full p-4 rounded-2xl bg-[#0B0A12] hover:bg-[#1D192C] border border-[#262235] flex items-center justify-between text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#F8F5F0]">Điểm danh hàng ngày</p>
                      <p className="text-[11px] text-[#9E96B0]">Duy trì chuỗi streak nhận +2 Sao</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-400">+2 ⭐</span>
                </button>

                {/* 3. Mời bạn bè */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOutOfTurnsSheetOpen(false);
                    setIsReferralOpen(true);
                  }}
                  className="w-full p-4 rounded-2xl bg-[#0B0A12] hover:bg-[#1D192C] border border-[#262235] flex items-center justify-between text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#F8F5F0]">Mời bạn bè dùng app</p>
                      <p className="text-[11px] text-[#9E96B0]">Nhận +5 Sao khi bạn bè nhập mã</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">+5 ⭐</span>
                </button>

                {/* 4. Nạp Sao (Chỉ hiện nếu 18+) */}
                {!isUnder18 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOutOfTurnsSheetOpen(false);
                      setIsWalletOpen(true);
                    }}
                    className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#C9A24A]/10 to-[#C49A4D]/10 hover:from-[#C9A24A]/20 hover:to-[#C49A4D]/20 border border-[#C9A24A]/40 flex items-center justify-between text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#C9A24A]/20 border border-[#C9A24A]/40 flex items-center justify-center text-[#E5C687]">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#F8F5F0]">Nạp Ví Sao PayOS</p>
                        <p className="text-[11px] text-[#9E96B0]">Gói Đêm Suy 19.000đ = 20 Sao</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#E5C687]">Nạp ngay &rarr;</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auxiliary Modals */}
      <WalletPayOSModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        birthYear={birthYear}
        quota={quota}
        onQuotaUpdated={(q) => updateQuota(q)}
        onOpenDailyModal={() => setIsStreakOpen(true)}
      />

      <DailyStreakModal
        isOpen={isStreakOpen}
        onClose={() => setIsStreakOpen(false)}
        nickname={nickname}
        birthYear={birthYear}
        readerId={selectedReaderId}
        quota={quota}
        onQuotaUpdated={(q) => updateQuota(q)}
      />

      <ReferralAndAdModal
        isOpen={isReferralOpen}
        onClose={() => setIsReferralOpen(false)}
        nickname={nickname}
        quota={quota}
        onQuotaUpdated={(q) => updateQuota(q)}
      />

      {/* CustomCursorFollower */}
      <CustomCursorFollower />
    </motion.div>
  );
}
