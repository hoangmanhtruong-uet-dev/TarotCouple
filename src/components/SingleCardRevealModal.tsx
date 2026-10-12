'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Star, ArrowRight, ShieldAlert, HeartHandshake } from 'lucide-react';
import type { TarotCard } from '@/data/tarot-cards';

export interface SingleCardRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: TarotCard;
  reversed: boolean;
  positionLabel: string;
  readerName?: string;
  readerAccentColor?: string;
  onNextCard?: () => void;
  hasNextCard?: boolean;
}

export function SingleCardRevealModal({
  isOpen,
  onClose,
  card,
  reversed,
  positionLabel,
  readerName = 'Bà Cố Mỏ Hỗn',
  readerAccentColor = '#C9A24A',
  onNextCard,
  hasNextCard = false,
}: SingleCardRevealModalProps) {
  if (!isOpen) return null;

  const coreMeaning = reversed ? card.core_meaning_rev : card.core_meaning_up;
  const keywords = reversed ? card.keywords_rev : card.keywords_up;
  const hook = reversed ? card.savage_hook_rev : card.savage_hook_up;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 20 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md bg-[#120F1D] border border-[#C9A24A]/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(217,179,106,0.25)] overflow-hidden"
        >
          {/* Subtle Ambient Glow behind the card */}
          <div
            className="pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-30"
            style={{ backgroundColor: card.palette?.glow || readerAccentColor }}
          />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#1C172B] hover:bg-[#2A2340] border border-white/10 flex items-center justify-center text-[#9E96B0] hover:text-[#F8F5F0] transition-colors cursor-pointer z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Position Tag */}
          <div className="text-center mb-4">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#1C172B] border border-[#C9A24A]/30 text-[#C9A24A]">
              {positionLabel}
            </span>
          </div>

          {/* Card Presentation */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-36 h-56 sm:w-40 sm:h-64 rounded-2xl overflow-hidden border-2 border-[#C9A24A] shadow-[0_0_35px_rgba(217,179,106,0.35)] bg-[#0B0A12] mb-3">
              <img
                src={card.rws_image_url}
                alt={card.name_vi}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  reversed ? 'rotate-180' : ''
                }`}
              />
              {/* Orientation Badge Overlay */}
              <div className="absolute bottom-2 left-2 right-2 text-center">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase backdrop-blur-md shadow-sm ${
                    reversed
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {reversed ? 'Lá Bài Ngược (Reversed)' : 'Lá Bài Xuôi (Upright)'}
                </span>
              </div>
            </div>

            <h3 className="font-display text-xl font-bold text-[#F8F5F0]">
              {card.roman}. {card.name_vi}
            </h3>
            <p className="text-xs text-[#C9A24A] tracking-wider uppercase">
              {card.name_en} {card.suit ? `• Bộ ${card.suit}` : ''}
            </p>
          </div>

          {/* Keywords Chips */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4">
            {keywords.map((kw, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#1C172B] text-[#E5C687] border border-[#262235]"
              >
                #{kw}
              </span>
            ))}
          </div>

          {/* Core Meaning */}
          <div className="p-3.5 rounded-2xl bg-[#0B0A12]/80 border border-[#262235] mb-4 text-xs text-[#9E96B0] leading-relaxed">
            <p className="mb-2 text-[#F8F5F0] font-medium">{coreMeaning}</p>
            {hook && (
              <p
                className="text-xs italic font-serif pt-1 border-t border-[#262235]"
                style={{ color: readerAccentColor }}
              >
                &ldquo;{hook}&rdquo;
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-2">
            {hasNextCard && onNextCard ? (
              <button
                type="button"
                onClick={onNextCard}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#C9A24A] to-[#C49A4D] hover:from-[#E5C687] hover:to-[#C9A24A] text-[#0B0A12] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Xem Lá Kế Tiếp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-[#1C172B] hover:bg-[#27203C] border border-[#C9A24A]/40 text-[#E5C687] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Xem Toàn Bộ Lời Giải Mã</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
