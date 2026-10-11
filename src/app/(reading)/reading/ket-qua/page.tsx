'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useReadingStore } from '@/lib/reading-store';
import { TarotCardVisual } from '@/components/TarotCardVisual';
import { Sparkles, Share2, RotateCcw, ArrowRight, Star, Eye } from 'lucide-react';
import { ALL_TAROT_CARDS } from '@/data/tarot-cards';
import { SingleCardRevealModal } from '@/components/SingleCardRevealModal';
import { CascadeProphecyText } from '@/components/CascadeProphecyText';
import type { ClarifierCardPayload } from '@/lib/api-types';

export default function KetQuaPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const {
    readingSuccess,
    clarifierCard,
    activeQuoteIdx,
    setActiveQuoteIdx,
    setClarifierCard,
    resetReadingFlow,
  } = useReadingStore();

  const [flippedCards, setFlippedCards] = useState<[boolean, boolean, boolean]>([true, true, true]);
  const [selectedSpotlightIdx, setSelectedSpotlightIdx] = useState<number | null>(null);

  const [isDrawingClarifier, setIsDrawingClarifier] = useState(false);
  const [followupQuestion, setFollowupQuestion] = useState(
    'Bước ngoặt ẩn giấu nào sắp xảy ra trong 7 ngày tới mà mình cần chuẩn bị?'
  );

  if (!readingSuccess) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Sparkles className="w-12 h-12 text-[#D9B36A] mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold text-[#F8F5F0] mb-2">
          Chưa Có Kết Quả Trải Bài
        </h2>
        <p className="text-xs text-[#9E96B0] mb-6">
          Bạn chưa thực hiện nghi thức rút bài nào trong phiên này. Hãy bắt đầu chọn Reader nhé!
        </p>
        <Link
          href="/reading/reader"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#D9B36A] text-[#0B0A12] font-bold text-sm shadow-md cursor-pointer"
        >
          <span>Bắt Đầu Bốc Bài Ngay</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const { drawnCards, result, readerDisplayName } = readingSuccess;
  const quotes = result.shareable_card.savage_quotes;
  const selectedQuote = quotes[activeQuoteIdx] || quotes[0]!;

  const handleDrawClarifier = async () => {
    if (isDrawingClarifier) return;
    setIsDrawingClarifier(true);

    try {
      const res = await fetch('/api/clarifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reading_id: readingSuccess.readingId,
          readingId: readingSuccess.readingId,
          nickname: readingSuccess.nickname,
          birth_year: 2004,
          birthYear: 2004,
          reader_id: readingSuccess.readerId,
          readerId: readingSuccess.readerId,
          topic: readingSuccess.topic,
          original_question: readingSuccess.questionText,
          originalQuestion: readingSuccess.questionText,
          followup_question: followupQuestion,
          followupQuestion: followupQuestion,
          previous_card_ids: drawnCards.map((c) => c.card.id),
          previousCardIds: drawnCards.map((c) => c.card.id),
        }),
      });

      const data = await res.json();
      if (data?.clarifier) {
        setClarifierCard(data.clarifier);
      } else {
        const usedIds = new Set(drawnCards.map((c) => c.card.id));
        const available = ALL_TAROT_CARDS.filter((c) => !usedIds.has(c.id));
        const chosen = available[0] || ALL_TAROT_CARDS[0]!;
        const fallback: ClarifierCardPayload = {
          card: chosen,
          reversed: false,
          questionAsked: followupQuestion,
          interpretation: chosen.core_meaning_up,
          advice: chosen.healing_hook_up,
          savageQuote: chosen.savage_hook_up,
          starsSpent: 5,
        };
        setClarifierCard(fallback);
      }
    } catch {
      const usedIds = new Set(drawnCards.map((c) => c.card.id));
      const available = ALL_TAROT_CARDS.filter((c) => !usedIds.has(c.id));
      const chosen = available[0] || ALL_TAROT_CARDS[0]!;
      setClarifierCard({
        card: chosen,
        reversed: false,
        questionAsked: followupQuestion,
        interpretation: chosen.core_meaning_up,
        advice: chosen.healing_hook_up,
        savageQuote: chosen.savage_hook_up,
        starsSpent: 5,
      });
    } finally {
      setIsDrawingClarifier(false);
    }
  };

  // Convert cards_analysis to Cascade items
  const cascadeParagraphs = result.cards_analysis.map((item) => ({
    title: `${item.position_label} • ${item.card_name_vi} (${item.reversed ? 'Ngược' : 'Xuôi'})`,
    body: item.interpretation,
    tag: `Năng lượng: ${item.energy_keyword}`,
  }));

  const currentSpotlightCard =
    selectedSpotlightIdx !== null ? drawnCards[selectedSpotlightIdx] : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Spotlight Modal for Inspecting Single Card */}
      {currentSpotlightCard && (
        <SingleCardRevealModal
          isOpen={selectedSpotlightIdx !== null}
          onClose={() => setSelectedSpotlightIdx(null)}
          card={currentSpotlightCard.card}
          reversed={currentSpotlightCard.reversed}
          positionLabel={currentSpotlightCard.position_label}
          readerName={readerDisplayName}
          onNextCard={() => {
            if (selectedSpotlightIdx !== null && selectedSpotlightIdx < 2) {
              setSelectedSpotlightIdx(selectedSpotlightIdx + 1);
            } else {
              setSelectedSpotlightIdx(null);
            }
          }}
          hasNextCard={selectedSpotlightIdx !== null && selectedSpotlightIdx < 2}
        />
      )}

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#D9B36A] uppercase block mb-1">
          BƯỚC 4 / 4 • KẾT QUẢ GIẢI MÃ
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5F0]">
          Lời Luận Giải Từ {readerDisplayName}
        </h1>
        <p className="text-xs text-[#D9B36A] italic mt-1 font-serif">
          &ldquo;{result.greeting_hook}&rdquo;
        </p>
      </motion.div>

      {/* 3 Drawn Cards Visuals (Clickable with Spotlight Hover) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {drawnCards.map((drawn, idx) => (
          <motion.div
            key={idx}
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 25, rotateY: 90 }
            }
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{
              duration: 0.6,
              delay: idx * 0.18,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={shouldReduceMotion ? {} : { scale: 1.03, y: -5 }}
            onClick={() => setSelectedSpotlightIdx(idx)}
            className="flex flex-col items-center p-3.5 rounded-2xl bg-[#14121F]/90 border border-[#262235] hover:border-[#D9B36A]/60 transition-all cursor-pointer shadow-lg group relative"
          >
            <span className="text-[10px] font-bold text-[#D9B36A] uppercase tracking-wider mb-2">
              {drawn.position_label}
            </span>

            <div className="w-full max-w-[200px]">
              <TarotCardVisual
                card={drawn.card}
                reversed={drawn.reversed}
                isFlipped={flippedCards[idx]}
                onFlip={() => setSelectedSpotlightIdx(idx)}
              />
            </div>

            <p className="text-xs font-semibold text-[#F8F5F0] mt-3 text-center group-hover:text-[#E5C687] transition-colors">
              {drawn.card.name_vi}
            </p>
            <span className="text-[10px] text-[#9E96B0]">
              {drawn.reversed ? 'Chiều Ngược' : 'Chiều Xuôi'}
            </span>

            {/* Tap indicator */}
            <span className="mt-2 text-[10px] text-[#D9B36A] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye className="w-3 h-3" />
              <span>Chạm để soi kỹ</span>
            </span>
          </motion.div>
        ))}
      </div>

      {/* Detailed Analysis with Cascade Prophecy Text */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-[#14121F]/90 border border-[#262235] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl mb-8"
      >
        <h3 className="font-display text-lg font-bold text-[#D9B36A] flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>Luận Giải Từng Khía Cạnh (Lời Phán Tuần Tự)</span>
        </h3>

        {/* Cascade Paragraphs Animation */}
        <CascadeProphecyText paragraphs={cascadeParagraphs} />

        {/* Chốt hạ & Lời khuyên */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1C172B] to-[#120F1D] border border-[#D9B36A]/40 space-y-3">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-[#D9B36A] uppercase block mb-1">
              CHỐT HẠ TỔNG QUAN
            </span>
            <p className="text-xs sm:text-sm text-[#F8F5F0] leading-relaxed">
              {result.overall_verdict}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase block mb-1">
              HÀNH ĐỘNG NÊN LÀM
            </span>
            <p className="text-xs text-[#9E96B0] leading-relaxed">
              {result.actionable_next_step}
            </p>
          </div>
        </div>

        {/* Savage Quote Switcher */}
        <div className="pt-2">
          <span className="text-[11px] font-semibold text-[#9E96B0] uppercase tracking-wider block mb-2">
            Chọn câu quote cho Story (3 phương án miễn phí):
          </span>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {quotes.map((_, qIdx) => (
              <button
                key={qIdx}
                type="button"
                onClick={() => setActiveQuoteIdx(qIdx as any)}
                className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  activeQuoteIdx === qIdx
                    ? 'bg-[#D9B36A]/20 border-[#D9B36A] text-[#E5C687]'
                    : 'bg-[#0B0A12] border-[#262235] text-[#9E96B0]'
                }`}
              >
                Phương án {qIdx + 1}
              </button>
            ))}
          </div>
          <motion.div
            key={activeQuoteIdx}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-xl bg-[#0B0A12] border border-[#D9B36A]/30 text-xs text-[#F8F5F0] italic font-serif"
          >
            &ldquo;{selectedQuote}&rdquo;
          </motion.div>
        </div>
      </motion.div>

      {/* Clarifier Card Section (Lá thứ 4) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-[#14121F]/90 border border-[#D9B36A]/30 rounded-3xl p-6 sm:p-8 mb-8 shadow-xl"
      >
        <div className="flex items-center gap-2 mb-2">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <h3 className="font-display text-base font-bold text-[#F8F5F0]">
            Mở Lá Bài Làm Rõ Thứ 4 (5 Sao ⭐)
          </h3>
        </div>
        <p className="text-xs text-[#9E96B0] mb-4">
          Soi sâu vào bước ngoặt ẩn giấu mà trải 3 lá chưa lật mở hết.
        </p>

        {clarifierCard ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl bg-[#0B0A12] border border-[#D9B36A]/50 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-16 rounded-lg bg-[#14121F] border border-[#D9B36A]/40 flex items-center justify-center text-xs text-[#D9B36A] font-bold">
                {clarifierCard.card.roman}
              </div>
              <div>
                <p className="text-sm font-bold text-[#F8F5F0]">{clarifierCard.card.name_vi}</p>
                <p className="text-[11px] text-[#9E96B0]">{clarifierCard.reversed ? 'Chiều Ngược' : 'Chiều Xuôi'}</p>
              </div>
            </div>
            <p className="text-xs text-[#9E96B0] leading-relaxed">{clarifierCard.interpretation}</p>
            <p className="text-xs italic text-[#D9B36A] font-serif">&ldquo;{clarifierCard.savageQuote}&rdquo;</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={followupQuestion}
              onChange={(e) => setFollowupQuestion(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0B0A12] border border-[#262235] text-xs text-[#F8F5F0]"
            />
            <button
              type="button"
              onClick={handleDrawClarifier}
              disabled={isDrawingClarifier}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-[#D9B36A]/20 hover:from-amber-500/30 hover:to-[#D9B36A]/30 border border-[#D9B36A]/50 text-xs font-bold text-[#E5C687] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isDrawingClarifier ? 'Đang Rút Lá Thứ 4...' : 'Rút Lá Làm Rõ Thứ 4 (5 Sao)'}</span>
            </button>
          </div>
        )}
      </motion.div>

      {/* Primary Actions: Story & Reset */}
      <div className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
        <Link
          href="/reading/story"
          className="w-full flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#D9B36A] to-[#C49A4D] hover:from-[#E5C687] hover:to-[#D9B36A] text-[#0B0A12] font-bold text-sm shadow-[0_4px_25px_rgba(217,179,106,0.3)] transition-all flex items-center justify-center gap-2 text-center cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Xuất Ảnh Story 9:16</span>
        </Link>

        <button
          type="button"
          onClick={() => {
            resetReadingFlow();
            router.push('/reading/reader');
          }}
          className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#14121F] hover:bg-[#1D192C] border border-[#262235] text-[#9E96B0] hover:text-[#F8F5F0] font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Bốc Lượt Mới</span>
        </button>
      </div>
    </div>
  );
}
