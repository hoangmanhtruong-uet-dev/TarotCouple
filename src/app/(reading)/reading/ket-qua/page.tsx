'use client';

/**
 * /reading/ket-qua — Trang Giải Mã Kết Quả
 *
 * Luồng trải nghiệm 5 màn (stage machine):
 *   STAGE 0: "reveal_1"   — Lá 1 nổi bật, chạm lần 2 để xem chi tiết
 *   STAGE 1: "reveal_2"   — Lá 2 nổi bật, chạm lần 2 để xem chi tiết
 *   STAGE 2: "reveal_3"   — Lá 3 nổi bật, chạm lần 2 để xem chi tiết
 *   STAGE 3: "verdict"    — Tổng kết 3 lá + Chốt hạ tổng quan + Quote switcher
 *   STAGE 4: "clarifier"  — Lời khuyên ngắn + Lá làm rõ thứ 4
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useTransform,
  animate,
} from 'framer-motion';
import { useReadingStore } from '@/lib/reading-store';
import { TarotCardVisual } from '@/components/TarotCardVisual';
import {
  Sparkles,
  Share2,
  RotateCcw,
  ArrowRight,
  Star,
  ChevronDown,
  ChevronUp,
  Zap,
  MessageSquare,
  Lock,
  Eye,
  HelpCircle,
} from 'lucide-react';
import FollowupChatModal from '@/components/FollowupChatModal';
import { ALL_TAROT_CARDS } from '@/data/tarot-cards';
import { READERS } from '@/data/tarot-cards';
import { getCardTopicInterpretation } from '@/data/topic-interpretations';
import { useQuotaSync } from '@/lib/use-quota';
import { saveJournalEntry } from '@/lib/journal-store';
import { soundManager } from '@/lib/sound-effects';
import type { ClarifierCardPayload, DrawnCardClientPayload } from '@/lib/api-types';
import type { ReadingOutput, CardAnalysis } from '@/lib/schemas';

// ─── Stage Types ─────────────────────────────────────────────────────────────
type Stage = 'reveal_1' | 'reveal_2' | 'reveal_3' | 'verdict' | 'clarifier';
const STAGES: Stage[] = ['reveal_1', 'reveal_2', 'reveal_3', 'verdict', 'clarifier'];
const STAGE_CARD_IDX: Record<string, number> = {
  reveal_1: 0,
  reveal_2: 1,
  reveal_3: 2,
};

// ─── Spotlight sub-state ─────────────────────────────────────────────────────
type SpotlightPhase = 'intro' | 'detail'; // intro = card nổi bật; detail = chi tiết giải nghĩa

function getReaderAccent(readerId?: string): string {
  const r = READERS.find((x) => x.id === readerId);
  return r?.accent_color || '#D9B36A';
}

/**
 * Điều chỉnh 'Ý nghĩa lá bài' bám sát 100% vào chủ đề user đã chọn,
 * loại bỏ hoàn toàn các câu chung chung kiểu 'Trong chuyện tình cảm hay công việc...'.
 */
function formatTopicCoreMeaning(text: string, topic?: string): string {
  if (!text) return '';
  const trimmed = text.trim();

  if (topic === 'love' || topic === 'crush_school') {
    // Chỉ tập trung vào khía cạnh tình duyên, cảm xúc, người ấy
    return trimmed
      .replace(/Trong chuyện tình cảm hay công việc,/gi, 'Trong chuyện tình cảm & kết nối trái tim,')
      .replace(/Dù là công việc hay tình cảm,/gi, 'Trong tình duyên & mối quan hệ này,')
      .replace(/trong công việc hay tình cảm/gi, 'trong chuyện tình cảm')
      .replace(/công việc lẫn tình cảm/gi, 'tình cảm & sự gắn kết')
      .replace(/chuyện tình cảm lẫn công việc/gi, 'chuyện tình cảm');
  }

  if (topic === 'career' || topic === 'study') {
    // Chỉ tập trung vào học tập, sự nghiệp, mục tiêu công việc
    return trimmed
      .replace(/Trong chuyện tình cảm hay công việc,/gi, 'Trong con đường học tập & sự nghiệp,')
      .replace(/Dù là công việc hay tình cảm,/gi, 'Trong công việc & định hướng học tập,')
      .replace(/trong chuyện tình cảm hay công việc/gi, 'trong công việc & học tập')
      .replace(/trong công việc hay tình cảm/gi, 'trong công việc')
      .replace(/chuyện tình cảm lẫn công việc/gi, 'công việc & học tập')
      .replace(/tình cảm lẫn công việc/gi, 'công việc & sự nghiệp');
  }

  if (topic === 'finance' || topic === 'daily_luck') {
    // Chỉ tập trung vào tài chính, nguồn lực, vận may
    return trimmed
      .replace(/Trong chuyện tình cảm hay công việc,/gi, 'Về mặt tài vận & cơ hội thực tế,')
      .replace(/Dù là công việc hay tình cảm,/gi, 'Về dòng tiền & vận may phía trước,')
      .replace(/trong chuyện tình cảm hay công việc/gi, 'về tài chính & vận may')
      .replace(/trong công việc hay tình cảm/gi, 'về tài chính');
  }

  return trimmed;
}

// ─── CardSpotlightView ───────────────────────────────────────────────────────
// Màn giới thiệu từng lá bài với animation nổi bật
function CardSpotlightView({
  drawn,
  cardAnalysis,
  cardNumber,
  accentColor,
  readerName,
  readerId,
  onTapDetail,   // Chạm lần 2 → chuyển sang detail
  phase,
  topic,
}: {
  drawn: DrawnCardClientPayload;
  cardAnalysis: CardAnalysis;
  cardNumber: 1 | 2 | 3;
  accentColor: string;
  readerName: string;
  readerId?: string;
  onTapDetail: () => void;
  phase: SpotlightPhase;
  topic?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  const [pulsing, setPulsing] = useState(false);

  // Auto-flip sau 800ms để tạo nghi thức mở bài
  useEffect(() => {
    if (phase === 'intro') {
      const t = setTimeout(() => {
        soundManager.playCardFlip();
        setFlipped(true);
      }, shouldReduceMotion ? 100 : 800);
      return () => clearTimeout(t);
    }
  }, [phase, shouldReduceMotion]);

  // Glow pulse khi vừa lật xong
  useEffect(() => {
    if (flipped && !shouldReduceMotion) {
      setPulsing(true);
      const t = setTimeout(() => setPulsing(false), 1200);
      return () => clearTimeout(t);
    }
  }, [flipped, shouldReduceMotion]);

  const keywords = drawn.reversed ? drawn.card.keywords_rev : drawn.card.keywords_up;
  
  // Lấy câu hook đặc trưng đúng theo Reader đã chọn thay vì chỉ lấy savage_hook
  let hook = drawn.reversed ? drawn.card.savage_hook_rev : drawn.card.savage_hook_up;
  if (readerId === 'tien_tu_chua_lanh') {
    hook = (drawn.reversed ? drawn.card.healing_hook_rev : drawn.card.healing_hook_up) || hook;
  } else if (readerId === 'ba_ngoai_vui_tinh') {
    hook = (drawn.reversed ? drawn.card.teen_hook_rev : drawn.card.teen_hook_up) || hook;
  } else if (readerId === 'tong_tai_ly_tri') {
    hook = (drawn.reversed ? (drawn.card as any).ceo_hook_rev : (drawn.card as any).ceo_hook_up) || hook;
  } else if (readerId === 'phap_su_toi_co') {
    hook = (drawn.reversed ? (drawn.card as any).mystic_hook_rev : (drawn.card as any).mystic_hook_up) || hook;
  }

  if (phase === 'intro') {
    return (
      <motion.div
        key="intro"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: -20 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center px-4 pt-6 pb-32 min-h-screen"
      >
        {/* Nhãn vị trí */}
        <div className="text-center mb-5">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border"
            style={{ borderColor: accentColor + '60', color: accentColor, backgroundColor: accentColor + '15' }}
          >
            LÁ {cardNumber} / 3 • {drawn.position_label}
          </span>
        </div>

        {/* Card Visual lớn */}
        <motion.div
          className="relative mb-6"
          animate={
            pulsing && !shouldReduceMotion
              ? { boxShadow: [`0 0 0px ${accentColor}00`, `0 0 60px ${accentColor}70`, `0 0 0px ${accentColor}00`] }
              : {}
          }
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          style={{ borderRadius: '1rem' }}
        >
          <div className="w-52 h-80 sm:w-60 sm:h-96">
            <TarotCardVisual
              card={drawn.card}
              reversed={drawn.reversed}
              isFlipped={flipped}
              onFlip={() => {}}
            />
          </div>
          {/* Ambient glow circle behind card */}
          <div
            className="absolute -inset-8 rounded-full pointer-events-none blur-3xl"
            style={{ backgroundColor: (drawn.card.palette?.glow || accentColor) + '25', zIndex: -1 }}
          />
        </motion.div>

        {/* Tên bài sau khi lật */}
        <AnimatePresence>
          {flipped && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="text-center mb-4"
            >
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5F0] mb-1">
                {drawn.card.roman}. {drawn.card.name_vi}
              </h2>
              <p className="text-xs tracking-wider uppercase" style={{ color: accentColor }}>
                {drawn.card.name_en} • {drawn.reversed ? 'Chiều Ngược' : 'Chiều Xuôi'}
              </p>

              {/* Keywords chips */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                {keywords.slice(0, 4).map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#1C172B] text-[#E5C687] border border-[#262235]"
                  >
                    #{kw}
                  </span>
                ))}
              </div>

              {/* Câu hook Reader */}
              {hook && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm italic font-serif text-[#E5C687] mt-4 max-w-xs mx-auto leading-relaxed px-2"
                >
                  &ldquo;{hook}&rdquo;
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA: Chạm để xem chi tiết */}
        <AnimatePresence>
          {flipped && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#0E0D17]/95 backdrop-blur-md border-t border-[#262235] shadow-[0_-8px_30px_rgba(0,0,0,0.8)]"
            >
              <div className="max-w-xl mx-auto">
                <button
                  type="button"
                  onClick={onTapDetail}
                  className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
                    color: '#0B0A12',
                    boxShadow: `0 4px 25px ${accentColor}40`,
                  }}
                >
                  <Eye className="w-4 h-4" />
                  <span>Xem Giải Nghĩa Chi Tiết</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // PHASE: detail — Giải nghĩa chuyên sâu bám sát 100% chủ đề từ Dataset
  const specializedData = getCardTopicInterpretation(
    drawn.card.id,
    drawn.reversed,
    (topic as any) || 'love'
  );

  const rawCoreMeaning = drawn.reversed ? drawn.card.core_meaning_rev : drawn.card.core_meaning_up;
  const coreMeaning = specializedData?.meaning || formatTopicCoreMeaning(rawCoreMeaning, topic);
  const specializedAdvice = specializedData?.advice;

  return (
    <motion.div
      key="detail"
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-xl mx-auto px-4 pt-4 pb-36"
    >
      {/* Header mini card */}
      <div
        className="flex items-center gap-3 p-3.5 rounded-2xl border mb-5"
        style={{ borderColor: accentColor + '40', backgroundColor: accentColor + '0C' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: accentColor + '20', color: accentColor }}
        >
          {drawn.card.roman}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-[#F8F5F0] truncate">{drawn.card.name_vi}</p>
          <p className="text-[11px]" style={{ color: accentColor }}>
            {drawn.position_label} • {drawn.reversed ? '⬇ Ngược' : '⬆ Xuôi'}
          </p>
        </div>
        <div className="w-14 h-20 rounded-xl overflow-hidden border shrink-0" style={{ borderColor: accentColor + '50' }}>
          <img
            src={drawn.card.rws_image_url}
            alt={drawn.card.name_vi}
            className={`w-full h-full object-cover ${drawn.reversed ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Từ khóa năng lượng */}
      <div className="mb-1.5">
        <span
          className="text-[10px] font-bold tracking-widest uppercase"
          style={{ color: accentColor }}
        >
          Năng lượng: {specializedData?.keyword || cardAnalysis.energy_keyword}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {keywords.map((kw, i) => (
          <span
            key={i}
            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#1C172B] text-[#E5C687] border border-[#262235]"
          >
            #{kw}
          </span>
        ))}
      </div>

      {/* Giải nghĩa chính — cascade */}
      <div className="space-y-3 mb-5">
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-5 sm:p-6 rounded-2xl bg-[#14121F]/90 border border-[#262235]"
        >
          <p className="text-xs font-bold text-[#D9B36A] uppercase tracking-wider mb-2">
            Ý nghĩa lá bài
          </p>
          <p className="text-base text-[#F8F5F0] leading-[1.6]">{coreMeaning}</p>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="p-5 sm:p-6 rounded-2xl bg-[#14121F]/90 border border-[#262235]"
        >
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
            Luận giải cho bạn
          </p>
          <p className="text-base text-[#9E96B0] leading-[1.6] mb-3">{cardAnalysis.interpretation}</p>
          {specializedAdvice && (
            <p className="text-sm text-[#E5C687] leading-[1.6] border-t border-[#262235] pt-3 flex items-start gap-2">
              <span className="font-bold text-amber-400 shrink-0">✦ Lời khuyên:</span>
              <span>{specializedAdvice}</span>
            </p>
          )}
        </motion.div>

        {hook && (
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="p-4 rounded-2xl border"
            style={{
              backgroundColor: accentColor + '10',
              borderColor: accentColor + '40',
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>
              {readerName} nói
            </p>
            <p className="text-sm italic font-serif text-[#E5C687] leading-relaxed">
              &ldquo;{hook}&rdquo;
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── VerdictView ─────────────────────────────────────────────────────────────
// Màn 4: Tổng kết 3 lá + Chốt hạ
function VerdictView({
  drawnCards,
  result,
  readerDisplayName,
  accentColor,
  activeQuoteIdx,
  setActiveQuoteIdx,
  onContinue,
  onOpenFollowup,
}: {
  drawnCards: [DrawnCardClientPayload, DrawnCardClientPayload, DrawnCardClientPayload];
  result: ReadingOutput;
  readerDisplayName: string;
  accentColor: string;
  activeQuoteIdx: 0 | 1 | 2;
  setActiveQuoteIdx: (i: 0 | 1 | 2) => void;
  onContinue: () => void;
  onOpenFollowup: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const quotes = result.shareable_card.savage_quotes;
  const selectedQuote = quotes[activeQuoteIdx] || quotes[0]!;

  return (
    <motion.div
      key="verdict"
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-xl mx-auto px-4 pt-4 pb-36"
    >
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <span className="text-[10px] font-bold tracking-widest text-[#D9B36A] uppercase block mb-1">
          TỔNG HỢP 3 LÁ
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5F0]">
          Chốt Hạ Của Vũ Trụ
        </h1>
        <p className="text-xs text-[#D9B36A] italic mt-1 font-serif">
          &ldquo;{result.greeting_hook}&rdquo;
        </p>
      </motion.div>

      {/* 3 mini cards recap */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {drawnCards.map((drawn, i) => (
          <motion.div
            key={i}
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center p-2.5 rounded-2xl bg-[#14121F]/80 border border-[#262235]"
          >
            <div className="w-full h-28 rounded-xl overflow-hidden mb-2 border" style={{ borderColor: accentColor + '40' }}>
              <img
                src={drawn.card.rws_image_url}
                alt={drawn.card.name_vi}
                className={`w-full h-full object-cover ${drawn.reversed ? 'rotate-180' : ''}`}
              />
            </div>
            <p className="text-[10px] font-bold text-[#F8F5F0] text-center leading-tight">{drawn.card.name_vi}</p>
            <span
              className="text-[9px] mt-0.5"
              style={{ color: accentColor }}
            >
              {drawn.reversed ? '↓ Ngược' : '↑ Xuôi'}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Chốt hạ tổng quan */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#1C172B] to-[#120F1D] border border-[#D9B36A]/40 space-y-4 mb-5 shadow-xl"
      >
        <div>
          <span className="text-xs font-bold tracking-wider text-[#D9B36A] uppercase block mb-2">
            CHỐT HẠ TỔNG QUAN
          </span>
          <p className="text-base text-[#F8F5F0] leading-[1.6]">{result.overall_verdict}</p>
        </div>

        <div className="border-t border-[#262235] pt-4">
          <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase block mb-2">
            HÀNH ĐỘNG NÊN LÀM NGAY
          </span>
          <p className="text-base text-[#9E96B0] leading-[1.6]">{result.actionable_next_step}</p>
        </div>
      </motion.div>

      {/* THẺ THẮC MẮC SÂU HƠN (PHẦN C: NẰM GIỮA "HÀNH ĐỘNG NÊN LÀM NGAY" VÀ THẺ LÁ THỨ 4) */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
        onClick={onOpenFollowup}
        className="group p-4 sm:p-5 rounded-3xl bg-[#14121F]/90 border border-[#3A334F] hover:border-[#D9B36A]/80 transition-all cursor-pointer mb-5 shadow-xl relative overflow-hidden"
      >
        <div className="flex items-center gap-3.5 relative z-10">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border"
            style={{
              borderColor: accentColor + '60',
              backgroundColor: accentColor + '18',
              color: accentColor,
            }}
          >
            <MessageSquare className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                2 câu đầu miễn phí ✨
              </span>
            </div>
            <h3 className="font-display text-sm sm:text-base font-bold text-[#F8F5F0] mb-0.5 group-hover:text-[#E5C687] transition-colors">
              Thắc Mắc Sâu Hơn Với Reader
            </h3>
            <p className="text-xs text-[#9E96B0] leading-relaxed line-clamp-2">
              Bạn có điều gì chưa thông suốt về 3 lá? Nhắn trực tiếp để {readerDisplayName} giải đáp sâu hơn nhé.
            </p>
          </div>

          <div className="shrink-0 text-[#D9B36A] group-hover:translate-x-1 transition-transform">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </motion.div>

      {/* THẺ GỢI Ý LÁ THỨ 4 (THAY THẾ KHỐI QUOTE - BẤM CHẠM = MỞ MÀN CLARIFIER) */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        onClick={onContinue}
        className="group p-5 rounded-3xl bg-[#14121F]/90 border border-[#D9B36A]/40 hover:border-[#D9B36A] transition-all cursor-pointer mb-5 shadow-xl relative overflow-hidden"
        style={{
          boxShadow: `0 0 25px ${accentColor}18`,
        }}
      >
        {/* Ambient background glow */}
        <div
          className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />

        <div className="flex items-center gap-4 relative z-10">
          {/* Lá úp phát sáng nhịp thở nhẹ */}
          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    boxShadow: [
                      `0 0 10px ${accentColor}30`,
                      `0 0 24px ${accentColor}70`,
                      `0 0 10px ${accentColor}30`,
                    ],
                  }
            }
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-24 sm:w-18 sm:h-28 rounded-xl bg-gradient-to-br from-[#262135] to-[#120F1D] border-2 border-[#D9B36A]/70 flex flex-col items-center justify-center shrink-0 text-center relative overflow-hidden"
          >
            <div className="text-[#D9B36A] text-lg font-serif">✦</div>
            <div className="text-[9px] font-bold text-[#E5C687] tracking-wider uppercase mt-1">Lá 4</div>
            <div className="absolute inset-1 rounded-lg border border-[#D9B36A]/20 pointer-events-none" />
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-[#D9B36A] tracking-wider uppercase bg-[#D9B36A]/10 px-2.5 py-0.5 rounded-full border border-[#D9B36A]/30">
                Gợi mở bí mật · 5 Sao ⭐
              </span>
            </div>
            <h3 className="font-display text-base font-bold text-[#F8F5F0] mb-1 group-hover:text-[#E5C687] transition-colors">
              Mở Khóa Lá Bài Làm Rõ Thứ 4
            </h3>
            <p className="text-xs text-[#9E96B0] leading-relaxed line-clamp-2">
              {result.cliffhanger_upsell?.tease_text ||
                `Vũ trụ đang giấu một nút thắt quan trọng. Hãy để ${readerDisplayName} lật mở lá bài thứ 4 để soi sâu hơn.`}
            </p>
          </div>

          <div className="shrink-0 text-[#D9B36A] group-hover:translate-x-1 transition-transform">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </motion.div>

      {/* Fixed bottom actions: Ưu tiên nút Lá Thứ 4 khi chưa mở */}
      <div className="fixed bottom-0 left-0 right-0 p-3.5 sm:p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#0E0D17]/95 backdrop-blur-md border-t border-[#262235] shadow-[0_-8px_30px_rgba(0,0,0,0.8)] z-30">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onContinue}
            className="flex-1 py-3.5 sm:py-4 rounded-2xl text-[#0B0A12] font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg active:scale-98"
            style={{
              background: `linear-gradient(135deg, #D9B36A, #C49A4D)`,
              boxShadow: '0 4px 25px rgba(217,179,106,0.35)',
            }}
          >
            <Star className="w-4 h-4 fill-[#0B0A12]" />
            <span>Mở Lá Thứ 4 · 5 Sao</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <Link
            href="/reading/story"
            className="py-3.5 sm:py-4 px-4 sm:px-5 rounded-2xl bg-[#14121F] hover:bg-[#1D192C] border-2 border-[#D9B36A]/70 text-[#F8F5F0] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <Share2 className="w-4 h-4 text-[#D9B36A]" />
            <span className="whitespace-nowrap">Xuất Story 9:16</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── ClarifierView ─────────────────────────────────────────────────────────────
// Màn 5: Lời khuyên ngắn + Lá làm rõ thứ 4
function ClarifierView({
  drawnCards,
  result,
  clarifierCard,
  isDrawingClarifier,
  followupQuestion,
  setFollowupQuestion,
  onDrawClarifier,
  onReset,
  accentColor,
  readerDisplayName,
  onOpenFollowup,
}: {
  drawnCards: [DrawnCardClientPayload, DrawnCardClientPayload, DrawnCardClientPayload];
  result: ReadingOutput;
  clarifierCard: ClarifierCardPayload | null;
  isDrawingClarifier: boolean;
  followupQuestion: string;
  setFollowupQuestion: (s: string) => void;
  onDrawClarifier: () => void;
  onReset: () => void;
  accentColor: string;
  readerDisplayName: string;
  onOpenFollowup?: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [expandedAdvice, setExpandedAdvice] = useState(false);

  const suggestedQuestions = result.cliffhanger_upsell?.suggested_followup_questions;

  return (
    <motion.div
      key="clarifier"
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-xl mx-auto px-4 pt-4 pb-36"
    >
      {/* Title */}
      <div className="text-center mb-6">
        <span className="text-[10px] font-bold tracking-widest text-[#D9B36A] uppercase block mb-1">
          BƯỚC TIẾP THEO
        </span>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-[#F8F5F0]">
          Lời Khuyên & Lá Làm Rõ
        </h1>
      </div>

      {/* Short actionable advice box */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#1C172B] to-[#0B0A12] border border-emerald-500/30 mb-5 shadow-lg"
      >
        <div className="flex items-center gap-2 mb-2.5">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Lời khuyên ngắn gọn từ {readerDisplayName}
          </span>
        </div>
        <p className="text-base text-[#F8F5F0] leading-[1.6]">
          {result.actionable_next_step}
        </p>

        {/* Cliffhanger tease if available */}
        {result.cliffhanger_upsell && (
          <div className="mt-4 border-t border-[#262235] pt-3.5">
            <button
              type="button"
              onClick={() => setExpandedAdvice(!expandedAdvice)}
              className="flex items-center gap-1.5 text-xs text-[#9E96B0] hover:text-[#E5C687] cursor-pointer transition-colors"
            >
              {expandedAdvice ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span className="leading-relaxed">{result.cliffhanger_upsell.tease_text}</span>
            </button>
          </div>
        )}
      </motion.div>

      {/* Clarifier section */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-5 rounded-3xl bg-[#14121F]/90 border border-[#D9B36A]/30 mb-5 shadow-xl"
      >
        <div className="flex items-center gap-2 mb-1">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <h3 className="font-display text-base font-bold text-[#F8F5F0]">
            Mở Lá Bài Làm Rõ Thứ 4
          </h3>
        </div>
        <p className="text-xs text-[#9E96B0] mb-4 leading-relaxed">
          Soi sâu vào bước ngoặt ẩn giấu mà trải 3 lá chưa lật mở hết. Tốn 5 Sao ⭐
        </p>

        {clarifierCard ? (
          // Đã rút lá thứ 4 — hiển thị kết quả
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            <div
              className="flex items-center gap-3 p-3.5 rounded-2xl border"
              style={{ borderColor: accentColor + '50', backgroundColor: accentColor + '10' }}
            >
              <div className="w-14 h-20 rounded-xl overflow-hidden border shrink-0" style={{ borderColor: accentColor + '60' }}>
                <img
                  src={clarifierCard.card.rws_image_url}
                  alt={clarifierCard.card.name_vi}
                  className={`w-full h-full object-cover ${clarifierCard.reversed ? 'rotate-180' : ''}`}
                />
              </div>
              <div>
                <p className="font-bold text-sm text-[#F8F5F0]">
                  {clarifierCard.card.roman}. {clarifierCard.card.name_vi}
                </p>
                <p className="text-[11px]" style={{ color: accentColor }}>
                  {clarifierCard.card.name_en} • {clarifierCard.reversed ? '↓ Ngược' : '↑ Xuôi'}
                </p>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-[#0B0A12] border border-[#262235]">
              <p className="text-base text-[#F8F5F0] leading-[1.6] mb-3">{clarifierCard.interpretation}</p>
              {clarifierCard.advice && (
                <p className="text-base text-[#E5C687] leading-[1.6] border-t border-[#262235] pt-3">
                  {clarifierCard.advice}
                </p>
              )}
            </div>
            <p className="text-sm italic text-[#D9B36A] font-serif px-1 leading-relaxed">
              &ldquo;{clarifierCard.savageQuote}&rdquo;
            </p>
          </motion.div>
        ) : (
          // Chưa rút — hiển thị form câu hỏi nhỏ
          <div className="space-y-3">
            {/* Suggested questions chips */}
            {suggestedQuestions && (
              <div className="flex flex-col gap-1.5 mb-1">
                <span className="text-[10px] text-[#9E96B0] font-semibold uppercase tracking-wider">
                  Câu hỏi gợi ý:
                </span>
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFollowupQuestion(q)}
                    className={`text-left text-xs px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                      followupQuestion === q
                        ? 'border-[#D9B36A]/60 bg-[#D9B36A]/10 text-[#E5C687]'
                        : 'border-[#262235] bg-[#0B0A12] text-[#9E96B0] hover:border-[#D9B36A]/40'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Custom question input */}
            <div>
              <label className="text-[10px] font-semibold text-[#D9B36A] uppercase tracking-wider block mb-1.5">
                Hoặc đặt câu hỏi của riêng bạn:
              </label>
              <textarea
                value={followupQuestion}
                onChange={(e) => setFollowupQuestion(e.target.value)}
                maxLength={200}
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-[#0B0A12] border border-[#262235] text-xs text-[#F8F5F0] focus:outline-none focus:border-[#D9B36A]/60 resize-none leading-relaxed"
                placeholder="Nhập câu hỏi muốn làm rõ..."
              />
            </div>

            <button
              type="button"
              onClick={onDrawClarifier}
              disabled={isDrawingClarifier || !followupQuestion.trim()}
              className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}18)`,
                border: `1px solid ${accentColor}50`,
                color: '#E5C687',
                boxShadow: isDrawingClarifier ? 'none' : `0 0 25px ${accentColor}20`,
              }}
            >
              {isDrawingClarifier ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                  <span>Đang Rút Lá Thứ 4...</span>
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>Rút Lá Làm Rõ Thứ 4 (5 Sao ⭐)</span>
                  <Lock className="w-3.5 h-3.5 opacity-50" />
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>

      {/* THẺ HỎI THÊM VỚI READER SAU KHI LẬP 3 LÁ / 4 LÁ (2 CÂU ĐẦU MIỄN PHÍ) */}
      {onOpenFollowup && (
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={onOpenFollowup}
          className="group p-4 sm:p-5 rounded-3xl bg-[#14121F]/90 border border-[#3A334F] hover:border-[#D9B36A]/80 transition-all cursor-pointer mb-5 shadow-xl relative overflow-hidden"
        >
          <div className="flex items-center gap-3.5 relative z-10">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border"
              style={{
                borderColor: accentColor + '60',
                backgroundColor: accentColor + '18',
                color: accentColor,
              }}
            >
              <MessageSquare className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  2 câu đầu miễn phí ✨
                </span>
                <span className="text-[10px] text-[#9E96B0]">
                  Sau đó: 5 Sao / câu
                </span>
              </div>
              <h3 className="font-display text-sm sm:text-base font-bold text-[#F8F5F0] mb-0.5 group-hover:text-[#E5C687] transition-colors">
                Hỏi Thêm Với {readerDisplayName}
              </h3>
              <p className="text-xs text-[#9E96B0] leading-relaxed line-clamp-2">
                Bạn muốn đào sâu hơn về trải bài này? Nhắn tin trực tiếp để {readerDisplayName} giải đáp nhé.
              </p>
            </div>

            <div className="shrink-0 text-[#D9B36A] group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Fixed bottom: Story + Reset */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#0E0D17]/95 backdrop-blur-md border-t border-[#262235] shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <Link
            href="/reading/story"
            className="flex-1 py-3.5 rounded-2xl text-[#0B0A12] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            style={{
              background: `linear-gradient(135deg, #D9B36A, #C49A4D)`,
              boxShadow: '0 4px 25px rgba(217,179,106,0.35)',
            }}
          >
            <Share2 className="w-4 h-4" />
            <span>Xuất Story 9:16</span>
          </Link>
          <button
            type="button"
            onClick={onReset}
            className="py-3.5 px-4 rounded-2xl bg-[#14121F] hover:bg-[#1D192C] border border-[#262235] text-[#9E96B0] font-semibold text-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="whitespace-nowrap">Lượt Mới</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function KetQuaPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const {
    readingSuccess,
    clarifierCard,
    activeQuoteIdx,
    selectedReaderId,
    readerAccentColor,
    setActiveQuoteIdx,
    setClarifierCard,
    resetReadingFlow,
  } = useReadingStore();

  // Stage machine state
  const [stage, setStage] = useState<Stage>('reveal_1');
  const [spotlightPhase, setSpotlightPhase] = useState<SpotlightPhase>('intro');

  // Clarifier state
  const [isDrawingClarifier, setIsDrawingClarifier] = useState(false);
  const [followupQuestion, setFollowupQuestion] = useState('');
  const [isFollowupOpen, setIsFollowupOpen] = useState(false);
  const { updateQuota } = useQuotaSync();

  // Set default followup question from cliffhanger when result loads
  useEffect(() => {
    if (readingSuccess?.result?.cliffhanger_upsell?.suggested_followup_questions?.[0]) {
      setFollowupQuestion(readingSuccess.result.cliffhanger_upsell.suggested_followup_questions[0]);
    } else {
      setFollowupQuestion('Bước ngoặt ẩn giấu nào sắp xảy ra trong 7 ngày tới mà mình cần chuẩn bị?');
    }
  }, [readingSuccess]);

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!readingSuccess) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Sparkles className="w-12 h-12 text-[#D9B36A] mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold text-[#F8F5F0] mb-2">
          Chưa Có Kết Quả Trải Bài
        </h2>
        <p className="text-xs text-[#9E96B0] mb-6">
          Bạn chưa thực hiện nghi thức rút bài nào trong phiên này.
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
  const accentColor = readerAccentColor || getReaderAccent(selectedReaderId);

  // ── Clarifier handler ─────────────────────────────────────────────────────
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
          birth_year: readingSuccess.birthYear,
          birthYear: readingSuccess.birthYear,
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
        if (data.quota) updateQuota(data.quota);
        soundManager.playMysticChime();
        setClarifierCard(data.clarifier);
        saveJournalEntry({
          ...readingSuccess,
          clarifier: data.clarifier,
        });
      } else {
        // Fallback contextual
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
        soundManager.playMysticChime();
        setClarifierCard(fallback);
        saveJournalEntry({
          ...readingSuccess,
          clarifier: fallback,
        });
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

  // ── Stage navigation helpers ──────────────────────────────────────────────
  const handleTapDetail = () => setSpotlightPhase('detail');

  const handleNextStage = () => {
    if (stage === 'reveal_1') {
      setStage('reveal_2');
      setSpotlightPhase('intro');
    } else if (stage === 'reveal_2') {
      setStage('reveal_3');
      setSpotlightPhase('intro');
    } else if (stage === 'reveal_3') {
      setStage('verdict');
      setSpotlightPhase('intro');
    } else if (stage === 'verdict') {
      setStage('clarifier');
    }
  };

  // Progress indicator (dots)
  const stageIndex = STAGES.indexOf(stage);

  // ── Card index for current reveal stage ──────────────────────────────────
  const currentCardIdx = STAGE_CARD_IDX[stage] ?? -1;
  const currentDrawn = currentCardIdx >= 0 ? drawnCards[currentCardIdx] : null;
  const currentAnalysis = currentCardIdx >= 0 ? result.cards_analysis[currentCardIdx] : null;

  // ── Progress bar + stage label ────────────────────────────────────────────
  const stageLabels: Record<Stage, string> = {
    reveal_1: `Lá 1 • ${drawnCards[0].position_label}`,
    reveal_2: `Lá 2 • ${drawnCards[1].position_label}`,
    reveal_3: `Lá 3 • ${drawnCards[2].position_label}`,
    verdict: 'Tổng Kết',
    clarifier: 'Lá Làm Rõ',
  };

  return (
    <div className="relative min-h-screen">
      {/* Progress dots at top */}
      <div className="sticky top-0 z-30 bg-[#0E0D17]/90 backdrop-blur-md border-b border-[#262235] px-4 py-2.5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          {/* Back button for detail phases */}
          {spotlightPhase === 'detail' && currentCardIdx >= 0 && (
            <button
              type="button"
              onClick={() => setSpotlightPhase('intro')}
              className="text-[11px] text-[#9E96B0] hover:text-[#F8F5F0] flex items-center gap-1 cursor-pointer transition-colors shrink-0"
            >
              ← Quay lại
            </button>
          )}

          {/* Stage label */}
          <span className="text-[11px] font-bold text-[#D9B36A] uppercase tracking-widest mx-auto">
            {stageLabels[stage]}{spotlightPhase === 'detail' ? ' — Chi Tiết' : ''}
          </span>

          {/* 5-dot progress */}
          <div className="flex items-center gap-1.5 shrink-0">
            {STAGES.map((s, i) => (
              <div
                key={s}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === stageIndex ? 16 : 6,
                  height: 6,
                  backgroundColor: i <= stageIndex ? accentColor : '#262235',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main content — stage-gated */}
      <AnimatePresence mode="wait">
        {/* ── STAGE: reveal_1 / reveal_2 / reveal_3 ── */}
        {currentDrawn && currentAnalysis && (
          <div key={`${stage}-${spotlightPhase}`}>
            {spotlightPhase === 'intro' ? (
              <CardSpotlightView
                drawn={currentDrawn}
                cardAnalysis={currentAnalysis}
                cardNumber={(currentCardIdx + 1) as 1 | 2 | 3}
                accentColor={accentColor}
                readerName={readerDisplayName}
                readerId={readingSuccess.readerId}
                onTapDetail={handleTapDetail}
                phase="intro"
                topic={readingSuccess.topic}
              />
            ) : (
              <>
                <CardSpotlightView
                  drawn={currentDrawn}
                  cardAnalysis={currentAnalysis}
                  cardNumber={(currentCardIdx + 1) as 1 | 2 | 3}
                  accentColor={accentColor}
                  readerName={readerDisplayName}
                  readerId={readingSuccess.readerId}
                  onTapDetail={handleTapDetail}
                  phase="detail"
                  topic={readingSuccess.topic}
                />
                {/* Fixed CTA for detail phase */}
                <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#0E0D17]/95 backdrop-blur-md border-t border-[#262235] shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
                  <div className="max-w-xl mx-auto">
                    <button
                      type="button"
                      onClick={handleNextStage}
                      className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg text-[#0B0A12]"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
                        boxShadow: `0 4px 25px ${accentColor}40`,
                      }}
                    >
                      {stage === 'reveal_3' ? (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Xem Tổng Kết 3 Lá</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4" />
                          <span>Tiếp — Lá {currentCardIdx + 2} / 3</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STAGE: verdict ── */}
        {stage === 'verdict' && (
          <VerdictView
            key="verdict"
            drawnCards={drawnCards}
            result={result}
            readerDisplayName={readerDisplayName}
            accentColor={accentColor}
            activeQuoteIdx={activeQuoteIdx}
            setActiveQuoteIdx={setActiveQuoteIdx}
            onContinue={() => setStage('clarifier')}
            onOpenFollowup={() => setIsFollowupOpen(true)}
          />
        )}

        {/* ── STAGE: clarifier ── */}
        {stage === 'clarifier' && (
          <ClarifierView
            key="clarifier"
            drawnCards={drawnCards}
            result={result}
            clarifierCard={clarifierCard}
            isDrawingClarifier={isDrawingClarifier}
            followupQuestion={followupQuestion}
            setFollowupQuestion={setFollowupQuestion}
            onDrawClarifier={handleDrawClarifier}
            onReset={() => {
              resetReadingFlow();
              router.push('/reading/reader');
            }}
            accentColor={accentColor}
            readerDisplayName={readerDisplayName}
            onOpenFollowup={() => setIsFollowupOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* Deep-dive follow-up modal */}
      {readingSuccess && (
        <FollowupChatModal
          isOpen={isFollowupOpen}
          onClose={() => setIsFollowupOpen(false)}
          reading={readingSuccess}
          accentColor={accentColor}
        />
      )}
    </div>
  );
}
