'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { READERS } from '@/data/tarot-cards';
import { useReadingStore } from '@/lib/reading-store';
import { Sparkles, ArrowRight, Check, Heart, Tent, Feather } from 'lucide-react';
import type { ReaderId } from '@/lib/schemas';

export default function ReaderSelectionPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const selectedReaderId = useReadingStore((state) => state.selectedReaderId);
  const setSelectedReaderId = useReadingStore((state) => state.setSelectedReaderId);
  const nickname = useReadingStore((state) => state.nickname);
  const birthYear = useReadingStore((state) => state.birthYear);

  const [isEnteringTent, setIsEnteringTent] = useState(false);

  const currentReader = READERS.find((r) => r.id === selectedReaderId) || READERS[0]!;

  const handleSelectAndProceed = (readerId: ReaderId, accentColor: string) => {
    setSelectedReaderId(readerId, accentColor);
    setIsEnteringTent(true);
    setTimeout(() => {
      // If user already has profile (nickname & birthYear), jump straight to 2b (tam-su), else go to 2a (ve-ban)
      if (nickname && nickname.trim() && birthYear) {
        router.push('/reading/tam-su');
      } else {
        router.push('/reading/ve-ban');
      }
    }, shouldReduceMotion ? 50 : 400);
  };

  return (
    <div className="relative max-w-6xl mx-auto px-4 py-4 sm:py-6 overflow-hidden">
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

      {/* Header Title Banner */}
      <div className="text-center mb-6 shrink-0">
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#D9B36A] uppercase block mb-1">
          BƯỚC 1 / 4 • CHỌN READER
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5F0]">
          Chọn Người Giải Mã Vận Mệnh
        </h1>
        <p className="text-xs sm:text-sm text-[#9E96B0] mt-1 max-w-lg mx-auto">
          Mỗi Reader mang một trường năng lượng và phong cách riêng biệt. Chọn người chạm đến trực giác của bạn nhất lúc này.
        </p>
      </div>

      {/* Desktop 2-Column Layout / Mobile Stacked Carousel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 4 Reader Compact Cards (Desktop: lg:col-span-5, Mobile: horizontal scrollable or list) */}
        <div className="lg:col-span-5 space-y-3">
          <p className="text-xs font-semibold text-[#D9B36A] uppercase tracking-wider hidden lg:block mb-2">
            Danh Sách 4 Vị Reader
          </p>

          {/* Reader List / Mobile Carousel */}
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible no-scrollbar gap-3 pb-2 lg:pb-0 snap-x snap-mandatory">
            {READERS.map((reader) => {
              const isSelected = selectedReaderId === reader.id;

              return (
                <div
                  key={reader.id}
                  onClick={() => setSelectedReaderId(reader.id, reader.accent_color)}
                  className={`snap-center shrink-0 w-[260px] lg:w-full p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                    isSelected
                      ? 'bg-[#14121F] shadow-[0_0_25px_rgba(217,179,106,0.18)] ring-1'
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

                  {/* Name & Title */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
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

        {/* Right Column: Detailed Reader Preview & Sticky Action (Desktop: lg:col-span-7) */}
        <div className="lg:col-span-7">
          <div
            className="rounded-3xl p-5 sm:p-6 border bg-[#14121F]/90 backdrop-blur shadow-2xl relative flex flex-col justify-between min-h-[460px]"
            style={{
              borderColor: `${currentReader.accent_color}60`,
              boxShadow: `0 10px 40px ${currentReader.accent_color}15`,
            }}
          >
            {/* Top Preview Header */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-inner"
                    style={{
                      backgroundColor: `${currentReader.accent_color}30`,
                      border: `2px solid ${currentReader.accent_color}70`,
                      color: currentReader.accent_color,
                    }}
                  >
                    {currentReader.avatar_symbol}
                  </div>
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

                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B0A12] border border-[#262235] text-[11px] text-[#D9B36A]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Đang chọn</span>
                </div>
              </div>

              {/* Tagline / Hợp với */}
              <div className="p-3 rounded-xl bg-[#0B0A12]/60 border border-[#262235] text-xs text-[#E5C687] mb-4">
                <strong>Đối tượng phù hợp:</strong> {currentReader.tagline}
              </div>

              {/* Sample Quote */}
              <div className="mb-4">
                <p className="text-[11px] font-semibold text-[#9E96B0] uppercase tracking-wider mb-1.5">
                  Câu Nói Thương Hiệu
                </p>
                <div className="p-3.5 rounded-xl bg-[#0B0A12]/90 border border-[#262235]/80 text-xs sm:text-sm italic text-[#F8F5F0] font-serif leading-relaxed">
                  &ldquo;{currentReader.sample_quote}&rdquo;
                </div>
              </div>

              {/* Sample Reading Snippet (Ví dụ phong cách giải mã bài) */}
              <div className="mb-6">
                <p className="text-[11px] font-semibold text-[#9E96B0] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Feather className="w-3.5 h-3.5 text-[#D9B36A]" />
                  <span>Mẫu Lời Giải Mã Thực Tế</span>
                </p>
                <div
                  className="p-3.5 rounded-xl bg-[#0B0A12]/90 border text-xs sm:text-sm text-[#9E96B0] leading-relaxed"
                  style={{ borderColor: `${currentReader.accent_color}35` }}
                >
                  <p className="text-[#F8F5F0]">
                    {currentReader.sample_reading_snippet ||
                      'Mỗi lá bài phản chiếu chính xác năng lượng và rào cản bạn đang đối mặt, kèm hành động cụ thể để xoay chuyển cục diện.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions: Sticky / Fixed at bottom of container */}
            <div className="pt-4 border-t border-[#262235]/80 space-y-3">
              <button
                type="button"
                onClick={() => handleSelectAndProceed(selectedReaderId, currentReader.accent_color)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#D9B36A] to-[#C49A4D] hover:from-[#E5C687] hover:to-[#D9B36A] text-[#0B0A12] font-bold text-base shadow-[0_4px_25px_rgba(217,179,106,0.35)] transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Vào Lều {currentReader.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Sub-link for Couple Mode positioned cleanly below main CTA */}
              <div className="text-center">
                <Link
                  href="/couple"
                  className="inline-flex items-center gap-1.5 text-xs text-[#9E96B0] hover:text-[#E5C687] transition-colors"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Muốn bói cùng người ấy? Chuyển sang <strong>Bói Đôi</strong> &rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
