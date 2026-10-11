'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { READERS, type ReaderPersona } from '@/data/tarot-cards';
import { Sparkles, ArrowRight, X, ChevronRight, Quote, Heart } from 'lucide-react';

interface ReaderIntroModalProps {
  isOpen: boolean;
  isCoupleMode?: boolean;
  onClose: () => void;
}

export default function ReaderIntroModal({
  isOpen,
  isCoupleMode = false,
  onClose,
}: ReaderIntroModalProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [currentIdx, setCurrentIdx] = useState(0);

  if (!isOpen) return null;

  const reader: ReaderPersona = READERS[currentIdx] || READERS[0]!;
  const isLast = currentIdx === READERS.length - 1;

  const handleNextOrFinish = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isLast) {
      onClose();
      const query = isCoupleMode ? '?mode=couple' : '';
      router.push(`/reading/reader${query}`);
    } else {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
    const query = isCoupleMode ? '?mode=couple' : '';
    router.push(`/reading/reader${query}`);
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={handleNextOrFinish}
      >
        <motion.div
          key={reader.id}
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: -20 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-sm sm:max-w-md rounded-3xl p-6 sm:p-7 border bg-[#14121F]/95 shadow-2xl text-center cursor-pointer select-none overflow-hidden"
          style={{
            borderColor: `${reader.accent_color}60`,
            boxShadow: `0 20px 60px ${reader.accent_color}30, 0 0 30px ${reader.accent_color}15`,
          }}
          onClick={handleNextOrFinish}
        >
          {/* Nút bỏ qua */}
          <button
            type="button"
            onClick={handleSkip}
            className="absolute top-4 right-4 z-20 text-[11px] text-[#9E96B0] hover:text-[#F8F5F0] bg-[#1F1B2E] px-2.5 py-1 rounded-full border border-[#2D2842] flex items-center gap-1 cursor-pointer"
          >
            <span>Bỏ qua</span>
            <X className="w-3 h-3" />
          </button>

          {/* Thanh tiến trình 4 chấm */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {READERS.map((r, idx) => (
              <div
                key={r.id}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: idx === currentIdx ? '28px' : '8px',
                  backgroundColor: idx === currentIdx ? reader.accent_color : '#2D2842',
                }}
              />
            ))}
          </div>

          <div className="text-[10px] uppercase font-bold tracking-widest text-[#D9B36A] mb-1">
            GIỚI THIỆU READER {currentIdx + 1}/4
          </div>

          {/* Avatar Reader với hiệu ứng hào quang tỏa sáng */}
          <div className="my-4 relative flex items-center justify-center">
            <motion.div
              animate={
                shouldReduceMotion
                  ? {}
                  : {
                      boxShadow: [
                        `0 0 25px ${reader.accent_color}40`,
                        `0 0 50px ${reader.accent_color}70`,
                        `0 0 25px ${reader.accent_color}40`,
                      ],
                      scale: [1, 1.03, 1],
                    }
              }
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl flex items-center justify-center font-display text-3xl sm:text-4xl font-black relative overflow-hidden shadow-2xl"
              style={{
                backgroundColor: `${reader.accent_color}25`,
                border: `2.5px solid ${reader.accent_color}90`,
                color: reader.accent_color,
              }}
            >
              {reader.avatar_image ? (
                <img
                  src={reader.avatar_image}
                  alt={reader.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="tracking-tighter">{reader.avatar_symbol}</span>
              )}
              {/* Radial gradient overlay */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, ${reader.accent_color} 0%, transparent 70%)`,
                }}
              />
            </motion.div>
          </div>

          {/* Badge & Tên Reader */}
          <div className="mb-2">
            <span
              className="inline-block px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase mb-1.5"
              style={{
                backgroundColor: `${reader.accent_color}20`,
                color: reader.accent_color,
                border: `1px solid ${reader.accent_color}40`,
              }}
            >
              {reader.badge}
            </span>
            <h3 className="font-display text-2xl font-extrabold text-[#F8F5F0]">
              {reader.name}
            </h3>
            <p
              className="text-xs font-semibold mt-0.5"
              style={{ color: reader.accent_color }}
            >
              {reader.title}
            </p>
          </div>

          {/* Câu quote đặc trưng */}
          <div className="my-3 p-3 rounded-2xl bg-[#0B0A12]/80 border border-[#262235] text-xs italic text-[#F8F5F0] font-serif leading-relaxed relative text-center">
            <Quote className="w-3.5 h-3.5 text-[#D9B36A]/40 absolute top-2 left-2" />
            <p className="px-3">&ldquo;{reader.sample_quote}&rdquo;</p>
          </div>

          {/* Tagline hợp với ai */}
          <p className="text-xs text-[#9E96B0] leading-relaxed mb-4 px-2">
            {reader.tagline}
          </p>

          {/* Chỉ dẫn chạm */}
          <div className="pt-2 border-t border-[#262235]/60 flex items-center justify-between text-xs text-[#9E96B0]">
            <span className="text-[11px] text-[#D9B36A]">
              Chạm vào khung để tiếp tục &rarr;
            </span>
            <button
              type="button"
              onClick={handleNextOrFinish}
              className="inline-flex items-center gap-1 font-bold px-3 py-1.5 rounded-xl transition-all"
              style={{
                backgroundColor: `${reader.accent_color}25`,
                color: reader.accent_color,
                border: `1px solid ${reader.accent_color}50`,
              }}
            >
              <span>{isLast ? 'Khám phá ngay' : 'Tiếp theo'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
