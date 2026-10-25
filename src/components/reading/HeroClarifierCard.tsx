'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Star,
  Sparkles,
  ArrowRight,
  Lock,
} from 'lucide-react';
import type { ClarifierCardPayload } from '@/lib/api-types';

export interface HeroClarifierCardProps {
  clarifierCard?: ClarifierCardPayload | null;
  cliffhangerTease?: string;
  readerDisplayName: string;
  accentColor?: string;
  onContinue: () => void;
  className?: string;
}

export default function HeroClarifierCard({
  clarifierCard,
  cliffhangerTease,
  readerDisplayName,
  accentColor = '#C9A24A',
  onContinue,
  className = '',
}: HeroClarifierCardProps) {
  const shouldReduceMotion = useReducedMotion();

  // ── Trạng Thái 1: ĐÃ MỞ KHÓA LÁ THỨ 4 ─────────────────────────────────────────
  if (clarifierCard) {
    return (
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#1A152C] via-[#120F20] to-[#0A0813] border-2 border-[#C9A24A]/60 shadow-[0_0_30px_rgba(201,162,74,0.18)] space-y-4 relative overflow-hidden ${className}`}
      >
        {/* Subtle Ambient Glow */}
        <div
          className="absolute -top-10 -right-10 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />

        {/* Top Header Badge */}
        <div className="flex items-center justify-between gap-2 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-sm">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            LÁ BÀI LÀM RÕ THỨ 4 · ĐÃ LẬT MỞ
          </span>
          <span className="text-[10px] font-bold text-[#E5C687] bg-[#C9A24A]/10 px-2.5 py-0.5 rounded-full border border-[#C9A24A]/30">
            5 Sao ⭐
          </span>
        </div>

        {/* Card and Content Row */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 relative z-10">
          {/* Visual Mini Card */}
          <div className="w-24 h-38 sm:w-28 sm:h-44 rounded-2xl overflow-hidden border-2 border-[#C9A24A] shrink-0 shadow-lg bg-[#0E0C18]">
            <img
              src={clarifierCard.card.rws_image_url}
              alt={clarifierCard.card.name_vi}
              className={`w-full h-full object-cover ${clarifierCard.reversed ? 'rotate-180' : ''}`}
            />
          </div>

          {/* Detailed Interpretation */}
          <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
            <div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-[#F8F5F0]">
                {clarifierCard.card.roman ? `${clarifierCard.card.roman}. ` : ''}
                {clarifierCard.card.name_vi}
              </h3>
              <p className="text-xs text-[#E5C687] font-semibold tracking-wide">
                {clarifierCard.card.name_en} • {clarifierCard.reversed ? 'Chiều Ngược (Reversed)' : 'Chiều Xuôi (Upright)'}
              </p>
            </div>

            {clarifierCard.questionAsked && (
              <p className="text-xs text-[#A9A1BC] italic">
                ✦ Câu hỏi làm rõ: &ldquo;{clarifierCard.questionAsked}&rdquo;
              </p>
            )}

            <p className="text-xs sm:text-sm text-[#F8F5F0] leading-relaxed">
              {clarifierCard.interpretation}
            </p>

            {clarifierCard.advice && (
              <div className="p-3 rounded-xl bg-[#0F0C18] border-l-2 border-[#C9A24A] border-y border-r border-white/5">
                <span className="text-[10px] font-bold text-[#E5C687] uppercase block mb-0.5">
                  ✦ Lời khuyên của {readerDisplayName}:
                </span>
                <p className="text-xs text-[#F3E5AB] leading-relaxed italic">
                  {clarifierCard.advice}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Trạng Thái 2: CHƯA MỞ KHÓA (Hero CTA Card) ──────────────────────────────
  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      onClick={onContinue}
      className={`group relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#1F1731] via-[#140F22] to-[#0A0712] border-2 border-[#C9A24A]/60 hover:border-[#E5C687] transition-all duration-300 shadow-[0_0_35px_rgba(201,162,74,0.22)] cursor-pointer ${className}`}
    >
      {/* Ambient Golden Aura behind the card */}
      <div
        className="absolute -right-12 -top-12 w-52 h-52 rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />

      {/* Shimmer light sweep beam */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                x: ['-100%', '200%'],
              }
        }
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
          repeatDelay: 1.5,
        }}
        className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-[#C9A24A]/10 to-transparent skew-x-12 pointer-events-none"
      />

      {/* Top Badge Header */}
      <div className="flex items-center justify-between gap-2 mb-3.5 relative z-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-[#C9A24A]/25 to-[#E5C687]/20 border border-[#C9A24A]/50 text-[#F3E5AB] shadow-sm">
          <Star className="w-3 h-3 fill-[#C9A24A] text-[#C9A24A]" />
          GỢI MỞ BÍ MẬT QUYẾT ĐỊNH · 5 SAO ⭐
        </span>
        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
          Lá Bài Thứ 4
        </span>
      </div>

      {/* Center Body: Ornate Card Back + Cliffhanger Teaser */}
      <div className="flex items-center gap-4 sm:gap-5 relative z-10">
        {/* Royal Mystic Card Back */}
        <motion.div
          animate={
            shouldReduceMotion
              ? {}
              : {
                  boxShadow: [
                    '0 0 12px rgba(201,162,74,0.3)',
                    '0 0 28px rgba(201,162,74,0.65)',
                    '0 0 12px rgba(201,162,74,0.3)',
                  ],
                }
          }
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-32 sm:w-24 sm:h-36 rounded-2xl bg-gradient-to-br from-[#2D2345] via-[#1B152B] to-[#0E0B19] border-2 border-[#C9A24A] flex flex-col items-center justify-center shrink-0 relative overflow-hidden select-none shadow-xl"
        >
          {/* Card Back Ornate Details */}
          <div className="absolute inset-1.5 rounded-xl border border-[#C9A24A]/40 flex flex-col items-center justify-center p-1 bg-[#140F22]/70">
            <div className="text-xl sm:text-2xl text-[#C9A24A] font-serif leading-none">✦</div>
            <div className="text-[10px] sm:text-[11px] font-bold text-[#E8C872] tracking-widest uppercase mt-1">LÁ 4</div>
            <div className="text-[8px] text-[#A9A1BC] tracking-wider mt-0.5 font-medium">ĐIỂM MÙ</div>
          </div>
          {/* Sacred geometry corner stars */}
          <div className="absolute top-1 left-1 text-[8px] text-[#C9A24A]/60">❖</div>
          <div className="absolute top-1 right-1 text-[8px] text-[#C9A24A]/60">❖</div>
          <div className="absolute bottom-1 left-1 text-[8px] text-[#C9A24A]/60">❖</div>
          <div className="absolute bottom-1 right-1 text-[8px] text-[#C9A24A]/60">❖</div>
        </motion.div>

        {/* Text and Tease Quote */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base sm:text-xl font-bold text-[#F8F5F0] group-hover:text-[#E8C872] transition-colors leading-tight">
            Mở Khóa Lá Bài Làm Rõ Thứ 4
          </h3>
          <p className="text-xs text-[#E5C687] font-semibold tracking-wide mt-1">
            ✦ Soi Sáng Nút Thắt Ẩn Giấu Cuối Cùng
          </p>

          <div className="mt-2 p-2.5 sm:p-3 rounded-2xl bg-[#0B0814]/85 border-l-2 border-[#C9A24A] border-y border-r border-white/5 shadow-inner">
            <p className="text-xs sm:text-sm text-[#F3E5AB] font-serif italic leading-relaxed line-clamp-3">
              &ldquo;{cliffhangerTease || `Vũ trụ đang giấu một nút thắt quan trọng. Hãy để ${readerDisplayName} lật mở lá bài thứ 4 để soi sâu hơn.`}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Hero CTA Button inside card */}
      <div className="mt-4 pt-1 relative z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onContinue();
          }}
          className="w-full py-3.5 sm:py-4 px-4 rounded-2xl font-bold text-sm sm:text-base text-[#0B0A12] flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_4px_25px_rgba(201,162,74,0.45)] hover:brightness-110 active:scale-98"
          style={{
            background: 'linear-gradient(135deg, #C9A24A 0%, #E5C687 50%, #C9A24A 100%)',
          }}
        >
          <Star className="w-4 h-4 fill-[#0B0A12]" />
          <span>LẬT MỞ LÁ THỨ 4 NGAY · 5 SAO</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </motion.div>
  );
}
