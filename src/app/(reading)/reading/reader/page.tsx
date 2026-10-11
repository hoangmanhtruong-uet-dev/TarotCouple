'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { READERS } from '@/data/tarot-cards';
import { useReadingStore } from '@/lib/reading-store';
import { Sparkles, ArrowRight, Check, Heart, Tent } from 'lucide-react';
import type { ReaderId } from '@/lib/schemas';

function ReaderSelectionContent() {
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
  const [activeMobileIdx, setActiveMobileIdx] = useState(0);

  const currentReader = READERS.find((r) => r.id === selectedReaderId) || READERS[0]!;

  const handleSelectAndProceed = (readerId: ReaderId, accentColor: string) => {
    setSelectedReaderId(readerId, accentColor);
    setIsEnteringTent(true);
    setTimeout(() => {
      if (isCoupleMode) {
        router.push('/couple');
        return;
      }
      // If user has already filled their profile, jump straight to chu-de, else go to ve-ban
      if (hasFilledProfile && nickname && nickname.trim() && birthYear) {
        router.push('/reading/chu-de');
      } else {
        router.push('/reading/ve-ban');
      }
    }, shouldReduceMotion ? 50 : 400);
  };

  const handleMobileScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const cardWidth = el.scrollWidth / READERS.length;
    const currentIdx = Math.round(el.scrollLeft / cardWidth);
    if (currentIdx !== activeMobileIdx && currentIdx >= 0 && currentIdx < READERS.length) {
      setActiveMobileIdx(currentIdx);
      const targetReader = READERS[currentIdx];
      if (targetReader && targetReader.id !== selectedReaderId) {
        setSelectedReaderId(targetReader.id, targetReader.accent_color);
      }
    }
  };

  return (
    <div className="relative max-w-6xl mx-auto px-4 pt-4 sm:pt-6 pb-32 sm:pb-36 overflow-hidden">
      {/* Tent Curtain Transition Overlay */}
      <AnimatePresence>
        {isEnteringTent && !shouldReduceMotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none flex"
          >
            {/* Left Curtain */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="w-1/2 h-full bg-[#120F1D] border-r border-[#D9B36A]/40 shadow-[10px_0_40px_rgba(0,0,0,0.8)]"
            />
            {/* Right Curtain */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="w-1/2 h-full bg-[#120F1D] border-l border-[#D9B36A]/40 shadow-[-10px_0_40px_rgba(0,0,0,0.8)]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Title Banner (Thống nhất khung, bỏ chữ BƯỚC thừa vì đã có Stepper) */}
      <div className="text-center mb-6 shrink-0">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5F0]">
          {isCoupleMode ? 'Chọn Reader Soi Kèo Mối Quan Hệ' : 'Chọn Người Giải Mã Vận Mệnh'}
        </h1>
        <p className="text-xs sm:text-sm text-[#9E96B0] mt-1 max-w-lg mx-auto">
          {isCoupleMode
            ? 'Mỗi Reader có góc nhìn độc đáo về tình cảm và mối quan hệ. Hãy chọn người phù hợp nhất với câu chuyện của hai bạn.'
            : 'Mỗi Reader mang một trường năng lượng và phong cách riêng biệt. Hãy chọn người chạm đến trực giác của bạn nhất lúc này.'}
        </p>
      </div>

      {/* MOBILE ONLY: Carousel 1 thẻ lớn, vuốt ngang, thẻ 2 bên lấp ló, 4 chấm chỉ vị trí */}
      <div className="block lg:hidden mb-6">
        <div
          onScroll={handleMobileScroll}
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 px-6 py-2"
        >
          {READERS.map((reader) => {
            const isSelected = selectedReaderId === reader.id;

            return (
              <div
                key={reader.id}
                onClick={() => setSelectedReaderId(reader.id, reader.accent_color)}
                className={`snap-center shrink-0 w-[84vw] max-w-[320px] rounded-3xl p-5 border transition-all cursor-pointer bg-[#14121F] flex flex-col justify-between min-h-[380px] shadow-lg ${
                  isSelected ? 'ring-2' : 'opacity-80'
                }`}
                style={{
                  borderColor: isSelected ? reader.accent_color : '#262235',
                  boxShadow: isSelected ? `0 0 25px ${reader.accent_color}30` : undefined,
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-inner"
                      style={{
                        backgroundColor: `${reader.accent_color}25`,
                        border: `1.5px solid ${reader.accent_color}60`,
                        color: reader.accent_color,
                      }}
                    >
                      {reader.avatar_symbol}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"
                        style={{
                          backgroundColor: `${reader.accent_color}20`,
                          color: reader.accent_color,
                          border: `1px solid ${reader.accent_color}40`,
                        }}
                      >
                        {reader.badge}
                      </span>
                      {isSelected && (
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: reader.accent_color }}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-display text-xl font-bold text-[#F8F5F0] mb-1">
                    {reader.name}
                  </h3>
                  <p className="text-xs text-[#E5C687] mb-3">
                    {reader.tagline}
                  </p>

                  <div className="p-3 rounded-xl bg-[#0B0A12]/80 border border-[#262235] text-xs italic text-[#D9B36A] font-serif mb-3 leading-relaxed">
                    &ldquo;{reader.sample_quote}&rdquo;
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4 Chấm chỉ vị trí Mobile Indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {READERS.map((reader, idx) => {
            const isSelected = selectedReaderId === reader.id;
            return (
              <button
                key={reader.id}
                type="button"
                aria-label={`Chọn ${reader.name}`}
                onClick={() => setSelectedReaderId(reader.id, reader.accent_color)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  isSelected ? 'w-6 bg-[#D9B36A]' : 'w-2 bg-[#262235]'
                }`}
                style={{
                  backgroundColor: isSelected ? reader.accent_color : undefined,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* DESKTOP (từ 1024px): Bố cục chia đôi song song */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-6 items-start">
        {/* Cột Trái: Danh sách 4 Reader gọn (avatar, tên, nhãn) */}
        <div className="lg:col-span-5 space-y-3">
          <p className="text-xs font-semibold text-[#D9B36A] uppercase tracking-wider mb-2">
            Danh Sách 4 Vị Reader
          </p>

          <div className="space-y-3">
            {READERS.map((reader) => {
              const isSelected = selectedReaderId === reader.id;

              return (
                <div
                  key={reader.id}
                  onClick={() => setSelectedReaderId(reader.id, reader.accent_color)}
                  className={`w-full p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                    isSelected
                      ? 'bg-[#14121F] shadow-[0_0_20px_rgba(217,179,106,0.18)] ring-1'
                      : 'bg-[#0E0D17]/80 hover:bg-[#14121F]/70 border-[#262235]'
                  }`}
                  style={{
                    borderColor: isSelected ? reader.accent_color : undefined,
                    boxShadow: isSelected ? `0 0 20px ${reader.accent_color}25` : undefined,
                  }}
                >
                  {/* Avatar Symbol */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 shadow-inner"
                    style={{
                      backgroundColor: `${reader.accent_color}25`,
                      border: `1.5px solid ${reader.accent_color}60`,
                      color: reader.accent_color,
                    }}
                  >
                    <span>{reader.avatar_symbol}</span>
                  </div>

                  {/* Name & Badge (Không lặp chữ) */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h3 className="font-display text-sm font-bold text-[#F8F5F0] truncate">
                        {reader.name}
                      </h3>
                      {isSelected && (
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: reader.accent_color }}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <span
                      className="inline-block px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase truncate"
                      style={{
                        backgroundColor: `${reader.accent_color}18`,
                        color: reader.accent_color,
                        border: `1px solid ${reader.accent_color}35`,
                      }}
                    >
                      {reader.badge}
                    </span>
                    <p className="text-[11px] text-[#9E96B0] truncate mt-1">
                      {reader.tagline}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cột Phải: Khung xem trước lớn của Reader đang chọn */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentReader.id}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl p-6 border bg-[#14121F]/90 backdrop-blur shadow-2xl relative flex flex-col justify-between min-h-[460px]"
              style={{
                borderColor: `${currentReader.accent_color}60`,
                boxShadow: `0 10px 40px ${currentReader.accent_color}18`,
              }}
            >
              <div>
                {/* Top Row: Avatar lớn + Tên + Nhãn */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3.5">
                    <motion.div
                      initial={shouldReduceMotion ? {} : { scale: 0.85, rotate: -6 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-inner"
                      style={{
                        backgroundColor: `${currentReader.accent_color}30`,
                        border: `2px solid ${currentReader.accent_color}70`,
                        color: currentReader.accent_color,
                      }}
                    >
                      {currentReader.avatar_symbol}
                    </motion.div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F8F5F0]">
                          {currentReader.name}
                        </h2>
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
                          style={{
                            backgroundColor: `${currentReader.accent_color}20`,
                            color: currentReader.accent_color,
                            border: `1px solid ${currentReader.accent_color}40`,
                          }}
                        >
                          {currentReader.badge}
                        </span>
                      </div>
                      <p
                        className="text-xs font-semibold mt-0.5"
                        style={{ color: currentReader.accent_color }}
                      >
                        {currentReader.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B0A12] border border-[#262235] text-[11px] text-[#D9B36A]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Đang chọn</span>
                  </div>
                </div>

                {/* Thanh chỉ số năng lượng Reader chạy đầy mượt mà (Animated Energy Gauge) */}
                <div className="mb-4 p-3 rounded-xl bg-[#0B0A12]/80 border border-[#262235]/60">
                  <div className="flex justify-between text-[10px] font-semibold text-[#9E96B0] mb-1.5 uppercase tracking-wider">
                    <span>Độ cộng hưởng trực giác</span>
                    <span style={{ color: currentReader.accent_color }}>98% Tương Thích</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#1D192C] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '98%' }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: currentReader.accent_color }}
                    />
                  </div>
                </div>

                {/* Dòng "Hợp với" */}
                <div className="p-3.5 rounded-xl bg-[#0B0A12]/60 border border-[#262235] text-xs text-[#E5C687] mb-4">
                  <strong>Hợp với:</strong> {currentReader.tagline}
                </div>

                {/* Câu trích hiện mượt từng cụm chữ */}
                <div className="mb-4">
                  <p className="text-[11px] font-semibold text-[#9E96B0] uppercase tracking-wider mb-1.5">
                    Câu Trích Dẫn
                  </p>
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="p-3.5 rounded-xl bg-[#0B0A12]/90 border border-[#262235]/80 text-xs sm:text-sm italic text-[#F8F5F0] font-serif leading-relaxed"
                  >
                    &ldquo;{currentReader.sample_quote}&rdquo;
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* THANH ĐÁY CỐ ĐỊNH (Luôn nhìn thấy cả trên Mobile và Desktop, kèm Safe-Area iPhone) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0E0D17]/95 backdrop-blur-md border-t border-[#262235] p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-xl mx-auto flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelectAndProceed(selectedReaderId, currentReader.accent_color)}
            className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#D9B36A] to-[#C49A4D] hover:from-[#E5C687] hover:to-[#D9B36A] text-[#0B0A12] font-bold text-sm sm:text-base shadow-[0_4px_25px_rgba(217,179,106,0.35)] transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{isCoupleMode ? `Chọn ${currentReader.name} & Bắt Đầu Bói Đôi` : `Vào Lều ${currentReader.name}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Link Chuyển sang Bói Đôi đặt nhỏ ngay dưới nút chính (chỉ hiện khi đang ở solo mode) */}
          {!isCoupleMode && (
            <Link
              href="/reading/reader?mode=couple"
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

export default function ReaderSelectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09080D] flex items-center justify-center text-[#D9B36A] text-sm font-medium">Đang chuẩn bị lều Reader...</div>}>
      <ReaderSelectionContent />
    </Suspense>
  );
}
