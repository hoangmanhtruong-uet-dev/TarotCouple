'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { READERS } from '@/data/tarot-cards';
import { useReadingStore } from '@/lib/reading-store';
import { Sparkles, ArrowRight, Check, Heart, Tent } from 'lucide-react';
import type { ReaderId } from '@/lib/schemas';

export default function ReaderSelectionPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const selectedReaderId = useReadingStore((state) => state.selectedReaderId);
  const setSelectedReaderId = useReadingStore((state) => state.setSelectedReaderId);

  const [isEnteringTent, setIsEnteringTent] = useState(false);

  const handleSelectAndProceed = (readerId: ReaderId, accentColor: string) => {
    setSelectedReaderId(readerId, accentColor);
    setIsEnteringTent(true);
    setTimeout(() => {
      router.push('/reading/tam-su');
    }, shouldReduceMotion ? 50 : 400);
  };

  const currentReader = READERS.find((r) => r.id === selectedReaderId) || READERS[0]!;

  return (
    <div className="relative max-w-4xl mx-auto px-4 py-8 overflow-hidden">
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

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#D9B36A] uppercase block mb-1">
          BƯỚC 1 / 4 • CHỌN READER
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5F0]">
          Chọn Người Giải Mã Vận Mệnh
        </h1>
        <p className="text-xs sm:text-sm text-[#9E96B0] mt-1 max-w-md mx-auto">
          Mỗi Reader mang một trường năng lượng và ngôn từ riêng biệt. Hãy chọn người chạm đến trực giác của bạn nhất lúc này.
        </p>
      </motion.div>

      {/* Reader Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
        {READERS.map((reader, idx) => {
          const isSelected = selectedReaderId === reader.id;

          return (
            <motion.div
              key={reader.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              whileHover={shouldReduceMotion ? {} : { scale: 1.015 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.985 }}
              onClick={() => setSelectedReaderId(reader.id, reader.accent_color)}
              className={`relative p-5 rounded-3xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#14121F] shadow-[0_0_30px_rgba(217,179,106,0.18)]'
                  : 'bg-[#0E0D17]/80 hover:bg-[#14121F]/70 border-[#262235]'
              }`}
              style={{
                borderColor: isSelected ? reader.accent_color : undefined,
              }}
            >
              {/* Top Row: Symbol + Badge */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner transition-transform"
                  style={{
                    backgroundColor: `${reader.accent_color}25`,
                    border: `1.5px solid ${reader.accent_color}60`,
                  }}
                >
                  <span>{reader.avatar_symbol}</span>
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
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: reader.accent_color }}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Reader Name & Tagline */}
              <h3 className="font-display text-lg font-bold text-[#F8F5F0] mb-0.5">
                {reader.name}
              </h3>
              <p
                className="text-xs font-medium mb-3"
                style={{ color: reader.accent_color }}
              >
                {reader.title}
              </p>
              <p className="text-xs text-[#9E96B0] leading-relaxed mb-4">
                {reader.tagline}
              </p>

              {/* Sample Quote */}
              <div className="p-3 rounded-xl bg-[#0B0A12]/80 border border-[#262235]/60 text-xs italic text-[#D9B36A] font-serif">
                &ldquo;{reader.sample_quote}&rdquo;
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Suggestion & Fixed Bottom Button */}
      <div className="max-w-md mx-auto text-center space-y-4">
        <Link
          href="/couple"
          className="inline-flex items-center gap-1.5 text-xs text-[#9E96B0] hover:text-[#E5C687] transition-colors"
        >
          <Heart className="w-3.5 h-3.5 text-rose-400" />
          <span>Muốn bói cùng người ấy? Chuyển sang <strong>Bói Đôi</strong> &rarr;</span>
        </Link>

        <div>
          <button
            type="button"
            onClick={() => handleSelectAndProceed(selectedReaderId, currentReader.accent_color)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#D9B36A] to-[#C49A4D] hover:from-[#E5C687] hover:to-[#D9B36A] text-[#0B0A12] font-bold text-base shadow-[0_4px_25px_rgba(217,179,106,0.3)] transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Vào Lều {currentReader.name}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
