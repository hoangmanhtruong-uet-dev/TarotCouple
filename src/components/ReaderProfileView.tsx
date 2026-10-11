'use client';

import React, { useEffect, useState, useRef, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { READERS, type ReaderPersona } from '@/data/tarot-cards';
import { useReadingStore } from '@/lib/reading-store';
import { classifyAgeTier } from '@/lib/safety';
import { CURRENT_REFERENCE_YEAR, type ReaderId } from '@/lib/schemas';
import { READER_SLUG_MAP } from '@/lib/reader-slugs';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  Heart,
  ShieldCheck,
  Zap,
  ThumbsDown,
  Quote,
} from 'lucide-react';

interface ReaderProfileViewProps {
  readerId: ReaderId;
  currentSlug: string;
}

export default function ReaderProfileView({
  readerId,
  currentSlug,
}: ReaderProfileViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const isCoupleMode = mode === 'couple';
  const shouldReduceMotion = useReducedMotion();

  const selectedReaderId = useReadingStore((state) => state.selectedReaderId);
  const setSelectedReaderId = useReadingStore((state) => state.setSelectedReaderId);
  const hasFilledProfile = useReadingStore((state) => state.hasFilledProfile);
  const nickname = useReadingStore((state) => state.nickname);
  const birthYear = useReadingStore((state) => state.birthYear);

  const [isEnteringTent, setIsEnteringTent] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Age policy (đổi Bà Cố sang Bà Ngoại Vui Tính cho 10-15t)
  const agePolicy = classifyAgeTier(birthYear, CURRENT_REFERENCE_YEAR, readerId);
  const isKidTeen = agePolicy.isKidTeenSafeMode;

  const currentIdx = READERS.findIndex((r) => r.id === readerId);
  const reader: ReaderPersona = READERS[currentIdx >= 0 ? currentIdx : 0]!;

  // Dynamic names according to age policy
  const displayName = isKidTeen ? reader.teen_safe_name : reader.name;
  const displayTagline = isKidTeen ? reader.teen_tagline : reader.tagline;
  const displayNotSuitable = isKidTeen ? reader.teen_not_suitable_for : reader.not_suitable_for;

  // Auto-sync store selected reader with current active page
  useEffect(() => {
    if (selectedReaderId !== reader.id) {
      setSelectedReaderId(reader.id, reader.accent_color);
    }
  }, [reader.id, reader.accent_color, selectedReaderId, setSelectedReaderId]);

  // Navigate between readers using router.replace (so Back button doesn't trap user)
  const navigateToReader = (targetIdx: number) => {
    const safeIdx = (targetIdx + READERS.length) % READERS.length;
    const target = READERS[safeIdx]!;
    const slug = READER_SLUG_MAP[target.id];
    const query = isCoupleMode ? '?mode=couple' : '';
    router.replace(`/reading/reader/${slug}${query}`);
  };

  const handlePrev = () => navigateToReader(currentIdx - 1);
  const handleNext = () => navigateToReader(currentIdx + 1);

  // Arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx]);

  // Swipe gestures for touch screens
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0]?.clientX ?? null);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0]?.clientX ?? 0;
    const diff = touchStartX - touchEndX;
    if (diff > 50) {
      // Swiped left -> Next
      handleNext();
    } else if (diff < -50) {
      // Swiped right -> Prev
      handlePrev();
    }
    setTouchStartX(null);
  };

  // CTA proceed
  const handleSelectAndProceed = () => {
    setSelectedReaderId(reader.id, reader.accent_color);
    setIsEnteringTent(true);
    setTimeout(() => {
      if (isCoupleMode) {
        router.push('/couple');
        return;
      }
      if (hasFilledProfile && nickname && nickname.trim() && birthYear) {
        router.push('/reading/chu-de');
      } else {
        router.push('/reading/ve-ban');
      }
    }, shouldReduceMotion ? 50 : 400);
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="relative w-full max-w-5xl mx-auto px-4 pt-3 sm:pt-6 pb-28 sm:pb-32 overflow-hidden flex flex-col justify-start min-h-[calc(100dvh-4rem)]"
    >
      {/* Tent Curtain Transition Overlay */}
      <AnimatePresence>
        {isEnteringTent && !shouldReduceMotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none flex"
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="w-1/2 h-full bg-[#120F1D] border-r border-[#D9B36A]/40 shadow-[10px_0_40px_rgba(0,0,0,0.8)]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="w-1/2 h-full bg-[#120F1D] border-l border-[#D9B36A]/40 shadow-[-10px_0_40px_rgba(0,0,0,0.8)]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="text-center mb-4 sm:mb-6 shrink-0">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-[10px] font-bold tracking-widest text-[#D9B36A] uppercase">
            BƯỚC 1 · CHỌN NĂNG LƯỢNG
          </span>
          {isKidTeen && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
              <ShieldCheck className="w-3 h-3" />
              <span>Chế độ học đường (10-15t)</span>
            </span>
          )}
        </div>
        <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-[#F8F5F0]">
          {isCoupleMode ? 'Chọn Reader Soi Kèo Mối Quan Hệ' : 'Chọn Người Giải Mã Vận Mệnh'}
        </h1>
        <p className="text-xs sm:text-sm text-[#9E96B0] mt-1 max-w-lg mx-auto">
          {isCoupleMode
            ? 'Mỗi Reader có lăng kính độc đáo về tình cảm. Vuốt hoặc chọn vị Reader hợp gu nhất.'
            : 'Mỗi Reader mang trường năng lượng và góc nhìn riêng biệt. Hãy chọn người trực giác bạn mách bảo.'}
        </p>

        {/* 4 Chấm chỉ vị trí & Nút chuyển trang trên Desktop/Tablet */}
        <div className="flex items-center justify-center gap-3 mt-3">
          <button
            type="button"
            aria-label="Reader trước"
            onClick={handlePrev}
            className="w-7 h-7 rounded-full bg-[#14121F] hover:bg-[#1D192C] border border-[#262235] text-[#9E96B0] hover:text-[#F8F5F0] flex items-center justify-center transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            {READERS.map((r, idx) => {
              const isCurrent = idx === currentIdx;
              return (
                <button
                  key={r.id}
                  type="button"
                  aria-label={`Xem ${r.name}`}
                  onClick={() => navigateToReader(idx)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    isCurrent ? 'w-7' : 'w-2.5 bg-[#262235] hover:bg-[#38334C]'
                  }`}
                  style={{
                    backgroundColor: isCurrent ? reader.accent_color : undefined,
                  }}
                />
              );
            })}
          </div>

          <button
            type="button"
            aria-label="Reader kế tiếp"
            onClick={handleNext}
            className="w-7 h-7 rounded-full bg-[#14121F] hover:bg-[#1D192C] border border-[#262235] text-[#9E96B0] hover:text-[#F8F5F0] flex items-center justify-center transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Responsive Container: 
          - Mobile (< 640px): 1 cột, hình lớn ở trên, thông tin ở dưới, không chiều cao cố định
          - Tablet & Desktop (>= 640px): 2 cột (hình trái, thông tin phải), căn giữa chiều dọc
      */}
      <div className="flex-1 w-full max-w-4xl mx-auto flex items-center justify-center my-auto">
        <motion.div
          key={reader.id}
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-full rounded-3xl p-5 sm:p-7 md:p-8 border bg-[#14121F]/90 backdrop-blur-md shadow-2xl relative"
          style={{
            borderColor: `${reader.accent_color}55`,
            boxShadow: `0 12px 45px ${reader.accent_color}20`,
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 sm:gap-7 md:gap-8 items-center">
            {/* Cột 1: Hình lớn của Reader (Placeholder monogram to với glow) */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center text-center">
              <div className="relative group">
                <motion.div
                  animate={{
                    boxShadow: [
                      `0 0 30px ${reader.accent_color}35`,
                      `0 0 55px ${reader.accent_color}60`,
                      `0 0 30px ${reader.accent_color}35`,
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-3xl flex items-center justify-center font-display text-4xl sm:text-5xl md:text-6xl font-black shadow-inner relative overflow-hidden"
                  style={{
                    backgroundColor: `${reader.accent_color}20`,
                    border: `2.5px solid ${reader.accent_color}70`,
                    color: reader.accent_color,
                  }}
                >
                  {reader.avatar_image ? (
                    <img
                      src={reader.avatar_image}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="tracking-tighter select-none">{reader.avatar_symbol}</span>
                  )}
                  {/* Subtle inner rays */}
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at center, ${reader.accent_color} 0%, transparent 70%)`,
                    }}
                  />
                </motion.div>

                {/* Badge bên dưới avatar */}
                <div className="mt-3">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-wider uppercase shadow-md"
                    style={{
                      backgroundColor: `${reader.accent_color}25`,
                      color: reader.accent_color,
                      border: `1px solid ${reader.accent_color}50`,
                    }}
                  >
                    {reader.badge}
                  </span>
                </div>
              </div>

              {/* 3 Từ khóa đặc trưng */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 max-w-[260px]">
                {reader.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-lg bg-[#0B0A12] border border-[#262235] text-[10px] text-[#D9B36A] font-medium"
                  >
                    ✦ {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Cột 2: Thông tin chi tiết */}
            <div className="sm:col-span-7 flex flex-col justify-center space-y-3.5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F8F5F0]">
                    {displayName}
                  </h2>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Sẵn Sàng
                  </span>
                </div>
                <p
                  className="text-xs sm:text-sm font-semibold mt-0.5"
                  style={{ color: reader.accent_color }}
                >
                  {reader.title}
                </p>
              </div>

              {/* Câu trích dẫn đặc trưng */}
              <div className="p-3.5 rounded-2xl bg-[#0B0A12]/80 border border-[#262235] text-xs sm:text-sm italic text-[#F8F5F0] font-serif leading-relaxed relative">
                <Quote className="w-3.5 h-3.5 text-[#D9B36A]/50 absolute top-2.5 left-2.5" />
                <p className="pl-4">
                  &ldquo;{reader.sample_quote}&rdquo;
                </p>
              </div>

              {/* Hợp với */}
              <div className="p-3 rounded-xl bg-[#0B0A12]/50 border border-[#262235] text-xs">
                <span className="font-bold text-[#E5C687] mr-1.5">✓ Hợp với:</span>
                <span className="text-[#9E96B0] leading-relaxed">{displayTagline}</span>
              </div>

              {/* MỤC MỚI: Không hợp nếu */}
              <div className="p-3 rounded-xl bg-[#1C1217]/50 border border-rose-900/40 text-xs">
                <span className="font-bold text-rose-400 mr-1.5 flex items-center gap-1 inline-flex">
                  <ThumbsDown className="w-3 h-3 text-rose-400" />
                  <span>Không hợp nếu:</span>
                </span>
                <span className="text-[#B59AA3] leading-relaxed">{displayNotSuitable}</span>
              </div>

              {/* Thanh chỉ số trực giác */}
              <div className="pt-1">
                <div className="flex justify-between text-[10px] font-semibold text-[#9E96B0] mb-1 uppercase tracking-wider">
                  <span>Chỉ số tương thích trực giác</span>
                  <span style={{ color: reader.accent_color }}>98% Tương Thích</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#1D192C] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '98%' }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: reader.accent_color }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* THANH ĐÁY CỐ ĐỊNH (Giữ nguyên vị trí cả trên Mobile và Desktop, không tải lại) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0E0D17]/95 backdrop-blur-md border-t border-[#262235] p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-xl mx-auto flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAndProceed}
            className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#D9B36A] to-[#C49A4D] hover:from-[#E5C687] hover:to-[#D9B36A] text-[#0B0A12] font-bold text-sm sm:text-base shadow-[0_4px_25px_rgba(217,179,106,0.35)] transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>
              {isCoupleMode
                ? `Chọn ${displayName} & Bắt Đầu Bói Đôi`
                : `Vào Lều ${displayName}`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {!isCoupleMode && (
            <Link
              href={`/reading/reader/${currentSlug}?mode=couple`}
              className="inline-flex items-center gap-1.5 text-xs text-[#9E96B0] hover:text-[#E5C687] transition-colors"
            >
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>Muốn bói cùng người ấy? Chuyển sang <strong>Bói Đôi</strong> &rarr;</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
