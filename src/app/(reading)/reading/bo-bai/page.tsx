'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useReadingStore } from '@/lib/reading-store';
import { READERS } from '@/data/tarot-cards';
import type { DeckMode, ReaderId } from '@/lib/schemas';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  Crown,
  Check,
  Zap,
} from 'lucide-react';

const READER_DECK_PROMPTS: Record<ReaderId, string> = {
  ba_co_mo_hon:
    'Chọn xem muốn rút 22 lá cốt lõi hay mở bung cả 78 lá cho rõ mười mươi nào!',
  tien_tu_chua_lanh:
    'Mỗi bộ bài mang một tầng số khác nhau. Hãy để trực giác mách bảo bạn nhé...',
  tong_tai_ly_tri:
    'Quy mô dữ liệu: 22 lá cho bức tranh tổng quan hoặc 78 lá cho phân tích chuyên sâu.',
  phap_su_toi_co:
    'Khai mở năng lượng của 22 đại diện định mệnh hay toàn bộ 78 tầng rung động...',
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
    badge: 'Kinh Điển • Năng Lượng Lớn',
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
    nickname,
    deckMode,
    questionText,
    setContextForm,
  } = useReadingStore();

  const activeReader = READERS.find((r) => r.id === selectedReaderId) || READERS[0]!;

  const [isDissolving, setIsDissolving] = useState(false);

  // Typewriter effect
  const readerPrompt =
    READER_DECK_PROMPTS[selectedReaderId] || READER_DECK_PROMPTS.ba_co_mo_hon;
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

  const handleStartShuffle = () => {
    setIsDissolving(true);
    setTimeout(() => {
      router.push('/reading/rut-bai');
    }, shouldReduceMotion ? 50 : 450);
  };

  return (
    <div className="relative max-w-xl mx-auto px-4 pt-4 sm:pt-6 pb-36 overflow-hidden">
      {/* Golden Particle Dissolve Overlay khi bấm Xáo bài */}
      <AnimatePresence>
        {isDissolving && !shouldReduceMotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-[#0B0A12]/85 backdrop-blur-sm"
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
              <span
                className="text-base font-bold tracking-widest uppercase block animate-pulse"
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
        className="flex items-start gap-3.5 p-4 rounded-3xl bg-[#14121F]/90 border border-[#262235] mb-6 shadow-xl"
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
            <Link
              href="/reading/noi-niem"
              className="text-[11px] text-[#9E96B0] hover:text-[#E5C687] transition-colors truncate"
            >
              Nỗi niềm: <strong>{questionText ? 'Đã phong ấn' : 'Đọc theo chủ đề'}</strong> &rarr;
            </Link>
          </div>
          <p className="text-xs text-[#E5C687] italic font-serif leading-relaxed min-h-[30px]">
            &ldquo;{displayedPrompt}&rdquo;
            {displayedPrompt.length < readerPrompt.length && (
              <span className="inline-block w-1.5 h-3 ml-0.5 bg-[#D9B36A] animate-pulse align-middle" />
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
          Quyết định mức độ chi tiết và năng lượng phản chiếu của trải bài
        </p>
      </div>

      {/* 2 Lựa chọn lớn */}
      <div className="space-y-4 mb-8">
        {DECK_OPTIONS.map((deck) => {
          const isSelected = deckMode === deck.id;

          return (
            <motion.div
              key={deck.id}
              whileHover={shouldReduceMotion ? {} : { scale: 1.015, y: -2 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.985 }}
              onClick={() => setContextForm({ deckMode: deck.id })}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-[#181429] shadow-xl ring-1'
                  : 'bg-[#14121F]/80 hover:bg-[#181429]/60 border-[#262235]'
              }`}
              style={{
                borderColor: isSelected ? readerAccentColor : '#262235',
                boxShadow: isSelected
                  ? `0 0 30px ${readerAccentColor}25`
                  : undefined,
              }}
            >
              {/* Top row: Badge + Card count */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: isSelected
                      ? `${readerAccentColor}25`
                      : '#262235',
                    color: isSelected ? readerAccentColor : '#9E96B0',
                    border: `1px solid ${
                      isSelected ? `${readerAccentColor}50` : '#3B354D'
                    }`,
                  }}
                >
                  {deck.badge}
                </span>

                <div className="flex items-center gap-1.5 text-xs text-[#D9B36A] font-semibold">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{deck.cardCount} Lá</span>
                </div>
              </div>

              {/* Title & Tagline */}
              <div className="mb-2">
                <h3 className="font-display text-base sm:text-lg font-bold text-[#F8F5F0] mb-0.5">
                  {deck.name}
                </h3>
                <p className="text-xs font-semibold text-[#E5C687]">
                  {deck.tagline}
                </p>
              </div>

              {/* Description */}
              <p className="text-xs text-[#9E96B0] leading-relaxed">
                {deck.description}
              </p>

              {/* Selection Check Icon */}
              {isSelected && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 absolute top-5 right-5 shadow-md"
                  style={{ backgroundColor: readerAccentColor }}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Gợi ý nhẹ */}
      <div className="p-3.5 rounded-xl bg-[#0B0A12]/80 border border-[#262235] text-center mb-6">
        <p className="text-[11px] text-[#9E96B0]">
          Tip: Nếu bạn đang băn khoăn về quyết định lớn của cuộc đời, bộ <strong>22 lá</strong> cho câu trả lời cô đọng nhất. Nếu cần chi tiết hàng ngày, hãy chọn <strong>78 lá</strong>!
        </p>
      </div>

      {/* THANH ĐÁY CỐ ĐỊNH: Nút "Xáo bài" dẫn sang /reading/rut-bai */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0E0D17]/95 backdrop-blur-md border-t border-[#262235] p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          {/* Nút phụ: Quay lại Nỗi niềm */}
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
            className="flex-1 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#D9B36A] to-[#C49A4D] hover:from-[#E5C687] hover:to-[#D9B36A] text-[#0B0A12] font-bold text-sm sm:text-base shadow-[0_4px_25px_rgba(217,179,106,0.35)] transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span>Xáo Bài & Rút Bài</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
