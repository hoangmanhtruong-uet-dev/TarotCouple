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

import React, { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useTransform,
  animate,
} from 'framer-motion';
import { gsap } from 'gsap';
import { CustomCursorFollower } from '@/components/CustomCursorFollower';
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
  Copy,
  Check,
  Bookmark,
  LayoutGrid,
  ListOrdered,
} from 'lucide-react';
import FollowupChatModal from '@/components/FollowupChatModal';
import OutOfStarsSheet from '@/components/OutOfStarsSheet';
import { AIVoiceReaderBar } from '@/components/AIVoiceReaderBar';
import InteractiveFollowupCard from '@/components/reading/InteractiveFollowupCard';
import HeroClarifierCard from '@/components/reading/HeroClarifierCard';
import { ALL_TAROT_CARDS, withCardProse } from '@/data/tarot-cards';
import { READERS } from '@/data/tarot-cards';
import { getCardTopicInterpretation } from '@/data/topic-interpretations';
import { buildContextualPivotScenarios } from '@/lib/ai-provider';
import { useQuotaSync } from '@/lib/use-quota';
import {
  saveJournalEntry,
  getJournalEntryById,
  getLatestJournalEntry,
  updateJournalReflection,
  type ReflectionStatus,
} from '@/lib/journal-store';
import { soundManager } from '@/lib/sound-effects';
import type { ClarifierCardPayload, DrawnCardClientPayload } from '@/lib/api-types';
import type { ReadingOutput, CardAnalysis, ReaderId } from '@/lib/schemas';

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
  return r?.accent_color || '#C9A24A';
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

  const cardWithProse = withCardProse(drawn.card);
  const rawCoreMeaning = (drawn.reversed ? cardWithProse.core_meaning_rev : cardWithProse.core_meaning_up) || '';
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
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-[#C9A24A] uppercase tracking-wider">
              Ý nghĩa lá bài (Chủ đề {topic === 'love' || topic === 'crush_school' ? 'Tình Duyên' : topic === 'career' || topic === 'study' ? 'Công Việc & Học Tập' : 'Tài Chính & Vận May'})
            </p>
            <span className="text-[10px] font-bold text-[#E5C687] px-2 py-0.5 rounded-full bg-[#C9A24A]/10 border border-[#C9A24A]/30">
              Chuẩn 100%
            </span>
          </div>
          <p className="text-base text-[#F8F5F0] leading-[1.6]">{coreMeaning}</p>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="p-5 sm:p-6 rounded-2xl bg-[#14121F]/90 border border-[#262235]"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Luận giải thấu suốt cho bạn
            </p>
            <span className="text-[10px] font-semibold text-emerald-400/80">
              Đối chiếu tâm sự ✦
            </span>
          </div>
          <p className="text-base text-[#D4CEE0] leading-[1.65] mb-3 whitespace-pre-line">{cardAnalysis.interpretation}</p>
          {specializedAdvice && (
            <div className="text-sm text-[#E5C687] leading-[1.6] border-t border-[#262235] pt-3 flex items-start gap-2">
              <span className="font-bold text-amber-400 shrink-0">✦ Lời khuyên hành động:</span>
              <span>{specializedAdvice}</span>
            </div>
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
              {readerName} bắt vị bạn
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
  onRedrawCards,
  questionText,
  nickname,
  usedFallback,
  readerId,
  topicLabel,
  topic,
  clarifierCard,
}: {
  drawnCards: [DrawnCardClientPayload, DrawnCardClientPayload, DrawnCardClientPayload];
  result: ReadingOutput;
  readerDisplayName: string;
  accentColor: string;
  activeQuoteIdx: 0 | 1 | 2;
  setActiveQuoteIdx: (i: 0 | 1 | 2) => void;
  onContinue: () => void;
  onOpenFollowup: (initialQuestion?: string) => void;
  onRedrawCards?: () => void;
  questionText?: string;
  nickname?: string;
  usedFallback?: boolean;
  readerId?: ReaderId;
  topicLabel?: string;
  topic?: string;
  clarifierCard?: ClarifierCardPayload | null;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [copiedVerdict, setCopiedVerdict] = useState(false);
  const [isActionPinned, setIsActionPinned] = useState(false);
  const [userReaction, setUserReaction] = useState<'accurate' | 'empowered' | 'reflecting' | null>(null);

  const pivotScenarios = result.pivot_scenarios || buildContextualPivotScenarios(
    (topic as any) || 'love',
    drawnCards[0].card,
    drawnCards[1].card,
    drawnCards[2].card,
    readerId as any
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const pinned = localStorage.getItem('tc_guidance_48h_v1');
        if (pinned) {
          const parsed = JSON.parse(pinned);
          if (parsed?.action === result.actionable_next_step) {
            setIsActionPinned(true);
          }
        }
      } catch {
        // ignore
      }
    }
  }, [result.actionable_next_step]);

  const handlePinAction = () => {
    soundManager.playCrispClick();
    if (typeof window !== 'undefined') {
      try {
        const payload = {
          savedAt: new Date().toISOString(),
          readerDisplayName,
          topic,
          action: result.actionable_next_step,
          verdict: finalVerdictText,
        };
        localStorage.setItem('tc_guidance_48h_v1', JSON.stringify(payload));
        setIsActionPinned(true);
      } catch {
        // ignore
      }
    }
  };

  const handleSelectReaction = (type: 'accurate' | 'empowered' | 'reflecting') => {
    soundManager.playCrispClick();
    setUserReaction(type);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`tc_reaction_${result.greeting_hook.slice(0, 20)}`, type);
      } catch {
        // ignore
      }
    }
  };

  const quotes = result.shareable_card.savage_quotes;
  const selectedQuote = quotes[activeQuoteIdx] || quotes[0]!;

  const finalVerdictText = usedFallback
    ? result.overall_verdict.endsWith('( DTS)')
      ? result.overall_verdict
      : `${result.overall_verdict.trim()} ( DTS)`
    : result.overall_verdict.replace(/\s*\( DTS\)$/, '');

  const handleCopyVerdict = async () => {
    soundManager.playCrispClick();
    const cardsSummary = drawnCards
      .map((d, i) => `Lá ${i + 1} (${d.position_label}): ${d.card.name_vi} (${d.reversed ? 'Ngược' : 'Xuôi'})`)
      .join('\n');
    const textToCopy = `🔮 Trải Bài Tarot với ${readerDisplayName}\n${cardsSummary}\n\n✨ Chốt hạ: ${finalVerdictText}\n🎯 Hành động: ${result.actionable_next_step}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedVerdict(true);
      setTimeout(() => setCopiedVerdict(false), 2200);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <motion.div
      key="verdict"
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-xl mx-auto px-4 pt-4 pb-36"
    >
      {/* Title & Topic Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-5"
      >
        <span className="text-[10px] font-bold tracking-widest text-[#C9A24A] uppercase block mb-1">
          TỔNG HỢP 3 LÁ • {topicLabel?.toUpperCase() || 'TAROT'}
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5F0]">
          Chốt Hạ Của Vũ Trụ
        </h1>
      </motion.div>

      {/* AI Voice Reader Bar */}
      <AIVoiceReaderBar
        readerId={readerId || 'ba_ngoai'}
        nickname={nickname || 'Bạn'}
        topicLabel={topicLabel || 'Tình Duyên'}
        overallVerdict={finalVerdictText}
        savageQuote={selectedQuote}
        cards={drawnCards.map((d) => ({
          name_vi: d.card.name_vi,
          reversed: d.reversed,
          position_label: d.position_label,
        }))}
        className="mb-5"
      />

      {/* KHỐI 1: ⚡ BẮT BỆNH CỐT LÕI (THE HARD TRUTH) */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#171424] via-[#120F1D] to-[#0E0D17] border border-[#C9A24A]/40 mb-4 shadow-xl"
        style={{ borderLeft: `4px solid ${accentColor}` }}
      >
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider text-[#E5C687] uppercase flex items-center gap-1.5 font-serif">
              <span className="text-amber-400">⚡</span> KHỐI 1: BẮT BỆNH CỐT LÕI
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold tracking-wider uppercase">
              Đi thẳng vào tim đen
            </span>
          </div>
        </div>

        <p className="font-serif text-sm sm:text-base text-[#F8F5F0] leading-[1.7] italic">
          &ldquo;{result.greeting_hook}&rdquo;
        </p>

        {questionText && questionText.trim().length > 3 && (
          <div className="mt-3 pt-3 border-t border-[#262235] flex items-center gap-2 text-xs">
            <span className="text-[10px] font-bold text-[#E5C687] shrink-0 uppercase tracking-wider">
              Khúc mắc của {nickname || 'bạn'}:
            </span>
            <span className="text-[11px] text-[#9E96B0] truncate italic">
              &ldquo;{questionText.trim()}&rdquo;
            </span>
          </div>
        )}
      </motion.div>

      {/* KHỐI 2: 🃏 3 LÁ BÀI GIẢI MÃ (CARD INSIGHTS) */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-5 sm:p-6 rounded-3xl bg-[#14121F]/90 border border-[#262235] mb-4 space-y-3.5 shadow-xl"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold tracking-wider text-[#E5C687] uppercase flex items-center gap-1.5 font-serif">
            <span>🃏</span> KHỐI 2: GIẢI MÃ 3 LÁ GÃY GỌN
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#1C172B] border border-[#2E2840] text-[#9E96B0]">
            Không lý thuyết sáo rỗng
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {drawnCards.map((drawn, i) => {
            const cardAnalysis = result.cards_analysis?.[i];
            const cleanInterpretation = cardAnalysis?.interpretation
              ?.replace(/^ở vị trí.*?lá.*?:/i, '')
              ?.replace(/\n\n📌 Trọng tâm:.*$/s, '')
              ?.trim() || '';

            return (
              <div
                key={i}
                className="p-3 rounded-2xl bg-[#0E0D17]/80 border border-[#262235] flex flex-col justify-between"
              >
                <div>
                  <div className="w-full h-32 rounded-xl overflow-hidden mb-2 border relative" style={{ borderColor: accentColor + '40' }}>
                    <img
                      src={drawn.card.rws_image_url}
                      alt={drawn.card.name_vi}
                      className={`w-full h-full object-cover ${drawn.reversed ? 'rotate-180' : ''}`}
                    />
                    <span
                      className="absolute bottom-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-black/80 backdrop-blur-sm"
                      style={{ color: accentColor }}
                    >
                      {drawn.reversed ? 'Ngược' : 'Xuôi'}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#9E96B0] font-semibold tracking-wider uppercase mb-0.5">
                    {drawn.position_label}
                  </div>
                  <div className="text-xs font-bold text-[#F8F5F0] mb-1.5">
                    {drawn.card.name_vi}
                  </div>
                </div>

                <p className="text-[11px] text-[#D4CFE2] leading-relaxed line-clamp-4">
                  {cleanInterpretation || cardAnalysis?.interpretation || drawn.card.keywords_up?.[0] || 'Thông điệp vũ trụ'}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* KHỐI 3: 🎯 CHỐT HẠ & HÀNH ĐỘNG TRONG 48H */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-[#171326] via-[#120F1D] to-[#0B0A12] border border-[#E5C687]/40 space-y-4 mb-5 card-luxury-glow"
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-bold tracking-wider text-[#E5C687] uppercase text-gold-luxury font-serif flex items-center gap-1.5">
              <span>🎯</span> KHỐI 3: CHỐT HẠ DỨT KHOÁT
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyVerdict}
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#1D1829] hover:bg-[#2A233B] text-[#E5C687] border border-[#C9A24A]/40 transition-colors cursor-pointer"
                title="Sao chép nhanh lời phán"
              >
                {copiedVerdict ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Phán Quyết
              </span>
            </div>
          </div>
          <p className="font-serif text-base sm:text-lg text-[#F8F5F0] leading-[1.75] whitespace-pre-line">
            {finalVerdictText}
          </p>
        </div>

        {/* 2 KỊCH BẢN NGÃ RẼ: SỰ THẬT THẤU CẢM & LỐI THOÁT */}
        {pivotScenarios && (
          <div className="mt-4 pt-4 border-t border-[#E5C687]/20 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider text-[#E5C687] uppercase font-serif">
                🔀 2 KỊCH BẢN NGÃ RẼ (LỐI THOÁT HÀNH ĐỘNG)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Kịch bản Buông */}
              <div className="p-3.5 rounded-2xl bg-[#0F0D18] border border-sky-500/30 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🕊️</span>
                  <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wide">
                    Nếu Chọn Buông / Dừng Lại
                  </span>
                </div>
                <p className="text-xs text-[#D8E2EC] leading-[1.6]">
                  {pivotScenarios.scenario_release}
                </p>
              </div>

              {/* Kịch bản Giữ */}
              <div className="p-3.5 rounded-2xl bg-[#0F0D18] border border-amber-500/30 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🔥</span>
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                    Nếu Chọn Giữ / Tiếp Tục
                  </span>
                </div>
                <p className="text-xs text-[#ECDCC8] leading-[1.6]">
                  {pivotScenarios.scenario_persist}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-[#E5C687]/20 pt-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase font-serif flex items-center gap-1.5">
              <span>⚡</span> VIỆC CẦN LÀM NGAY TRONG 48H
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePinAction}
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#1D1829] hover:bg-[#2A233B] text-[#E5C687] border border-[#C9A24A]/40 transition-all cursor-pointer"
                title="Ghim làm Kim Chỉ Nam 48h"
              >
                {isActionPinned ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Đã ghim</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3 h-3 text-[#E5C687]" />
                    <span>Ghim 48h</span>
                  </>
                )}
              </button>
              {onRedrawCards && (
                <button
                  type="button"
                  onClick={onRedrawCards}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C9A24A] hover:text-[#F3E5AB] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Đổi 3 lá</span>
                </button>
              )}
            </div>
          </div>
          <p className="text-sm sm:text-base text-[#D4CFE2] leading-[1.65]">
            {result.actionable_next_step}
          </p>

          {/* BỘ ĐÁNH GIÁ CẢM XÚC NHANH (1-CHẠM) */}
          <div className="mt-4 pt-3.5 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[#9E96B0] uppercase tracking-wider">
                Lời luận giải này có chạm đến bạn?
              </span>
              {userReaction && (
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Đã ghi nhận
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectReaction('accurate')}
                className={`py-2 px-1.5 rounded-xl text-center text-xs font-semibold border transition-all cursor-pointer ${
                  userReaction === 'accurate'
                    ? 'bg-[#C9A24A]/20 border-[#C9A24A] text-[#F3E5AB] shadow-[0_0_12px_rgba(201,162,74,0.3)]'
                    : 'bg-[#14121F] border-white/10 text-[#9E96B0] hover:border-white/20 hover:text-[#F8F5F0]'
                }`}
              >
                🎯 Trúng tim đen
              </button>
              <button
                type="button"
                onClick={() => handleSelectReaction('empowered')}
                className={`py-2 px-1.5 rounded-xl text-center text-xs font-semibold border transition-all cursor-pointer ${
                  userReaction === 'empowered'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'bg-[#14121F] border-white/10 text-[#9E96B0] hover:border-white/20 hover:text-[#F8F5F0]'
                }`}
              >
                ⚡ Nhẹ lòng & Động lực
              </button>
              <button
                type="button"
                onClick={() => handleSelectReaction('reflecting')}
                className={`py-2 px-1.5 rounded-xl text-center text-xs font-semibold border transition-all cursor-pointer ${
                  userReaction === 'reflecting'
                    ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                    : 'bg-[#14121F] border-white/10 text-[#9E96B0] hover:border-white/20 hover:text-[#F8F5F0]'
                }`}
              >
                🧘 Cần suy ngẫm
              </button>
            </div>
          </div>

          {/* HUY HIỆU BẢO TOÀN NĂNG LƯỢNG (ENERGY COOLDOWN NOTE) */}
          <div className="mt-3.5 p-3 rounded-2xl bg-[#0A0910] border border-white/5 flex items-start gap-2.5">
            <span className="text-base shrink-0">💡</span>
            <p className="text-[11px] text-[#8E879E] leading-[1.6]">
              <strong className="text-[#E5C687]">Lưu ý năng lượng từ Reader:</strong> Hãy dành 24–48h tập trung hoàn thành hành động trên trước khi rút quẻ mới cho cùng câu chuyện để tâm trí không bị nhiễu loạn.
            </p>
          </div>
        </div>
      </motion.div>

      {/* THẺ THẮC MẮC SÂU HƠN VỚI READER */}
      <InteractiveFollowupCard
        readerDisplayName={readerDisplayName}
        readerId={readerId}
        accentColor={accentColor}
        topic={topic}
        suggestedQuestions={result.cliffhanger_upsell?.suggested_followup_questions}
        onOpenFollowup={onOpenFollowup}
        className="mb-5"
      />

      {/* THẺ HERO GỢI MỞ LÁ THỨ 4 */}
      <HeroClarifierCard
        clarifierCard={clarifierCard}
        cliffhangerTease={result.cliffhanger_upsell?.tease_text}
        readerDisplayName={readerDisplayName}
        accentColor={accentColor}
        onContinue={onContinue}
        className="mb-5"
      />

      {/* Fixed bottom actions: Nút Lá Thứ 4 + Hỏi Thêm + Story */}
      <div className="fixed bottom-0 left-0 right-0 p-3.5 sm:p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#0E0D17]/95 backdrop-blur-md border-t border-[#262235] shadow-[0_-8px_30px_rgba(0,0,0,0.8)] z-30">
        <div className="max-w-xl mx-auto flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onContinue}
            className="flex-1 py-3.5 sm:py-4 rounded-2xl text-[#0B0A12] font-bold text-xs sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer transition-all shadow-lg active:scale-98"
            style={{
              background: 'linear-gradient(135deg, #C9A24A, #E5C687)',
              boxShadow: '0 4px 25px rgba(201,162,74,0.35)',
            }}
          >
            <Star className="w-4 h-4 fill-[#0B0A12] shrink-0" />
            <span className="truncate">{clarifierCard ? 'Xem Lá Thứ 4' : 'Mở Lá Thứ 4 · 5 Sao'}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => onOpenFollowup()}
            className="py-3.5 sm:py-4 px-3 sm:px-4 rounded-2xl bg-[#14121F] hover:bg-[#1D1829] border border-[#8B5CF6]/50 hover:border-[#C9A24A] text-[#F8F5F0] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
            title="Hỏi thêm với Reader"
          >
            <MessageSquare className="w-4 h-4 text-[#C9A24A]" />
            <span className="hidden sm:inline">Hỏi thêm</span>
          </button>

          <Link
            href="/reading/story"
            className="py-3.5 sm:py-4 px-3 sm:px-4 rounded-2xl bg-[#14121F] hover:bg-[#1D1829] border border-white/10 hover:border-[#C9A24A] text-[#9E96B0] hover:text-[#F8F5F0] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
            title="Xuất Story 9:16"
          >
            <Share2 className="w-4 h-4 text-[#C9A24A]" />
            <span className="hidden sm:inline">Story</span>
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
        <span className="text-[10px] font-bold tracking-widest text-[#C9A24A] uppercase block mb-1">
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
        className="p-5 rounded-3xl bg-[#14121F]/90 border border-[#C9A24A]/30 mb-5 shadow-xl"
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
            <p className="text-sm italic text-[#C9A24A] font-serif px-1 leading-relaxed">
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
                        ? 'border-[#C9A24A]/60 bg-[#C9A24A]/10 text-[#E5C687]'
                        : 'border-[#262235] bg-[#0B0A12] text-[#9E96B0] hover:border-[#C9A24A]/40'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Custom question input */}
            <div>
              <label className="text-[10px] font-semibold text-[#C9A24A] uppercase tracking-wider block mb-1.5">
                Hoặc đặt câu hỏi của riêng bạn:
              </label>
              <textarea
                value={followupQuestion}
                onChange={(e) => setFollowupQuestion(e.target.value)}
                maxLength={200}
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-[#0B0A12] border border-[#262235] text-xs text-[#F8F5F0] focus:outline-none focus:border-[#C9A24A]/60 resize-none leading-relaxed"
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
          className="group p-4 sm:p-5 rounded-3xl bg-[#14121F]/90 border border-[#3A334F] hover:border-[#C9A24A]/80 transition-all cursor-pointer mb-5 shadow-xl relative overflow-hidden"
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
                  Sau đó: 2 Sao / câu
                </span>
              </div>
              <h3 className="font-display text-sm sm:text-base font-bold text-[#F8F5F0] mb-0.5 group-hover:text-[#E8C872] transition-colors">
                Hỏi Thêm Với {readerDisplayName}
              </h3>
              <p className="text-xs text-[#9E96B0] leading-relaxed line-clamp-2">
                Bạn muốn đào sâu hơn về trải bài này? Nhắn tin trực tiếp để {readerDisplayName} giải đáp nhé.
              </p>
            </div>

            <div className="shrink-0 text-[#C9A24A] group-hover:translate-x-1 transition-transform">
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
              background: `linear-gradient(135deg, #C9A24A, #A68032)`,
              boxShadow: '0 4px 25px rgba(201,162,74,0.35)',
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

// ─── DashboardView ───────────────────────────────────────────────────────────
// Màn Toàn Cảnh (All-in-One Dashboard): Xem nhanh trọn bộ 3 lá, audio, chốt hạ, lời khuyên và lá làm rõ
function DashboardView({
  drawnCards,
  result,
  readerDisplayName,
  accentColor,
  activeQuoteIdx,
  setActiveQuoteIdx,
  questionText,
  nickname,
  usedFallback,
  readerId,
  topicLabel,
  topic,
  clarifierCard,
  onContinueClarifier,
  onOpenFollowup,
  onRedrawCards,
  readingId,
}: {
  drawnCards: [DrawnCardClientPayload, DrawnCardClientPayload, DrawnCardClientPayload];
  result: ReadingOutput;
  readerDisplayName: string;
  accentColor: string;
  activeQuoteIdx: 0 | 1 | 2;
  setActiveQuoteIdx: (i: 0 | 1 | 2) => void;
  questionText?: string;
  nickname?: string;
  usedFallback?: boolean;
  readerId?: ReaderId;
  topicLabel?: string;
  topic?: string;
  clarifierCard?: ClarifierCardPayload | null;
  onContinueClarifier: () => void;
  onOpenFollowup: (initialQuestion?: string) => void;
  onRedrawCards: () => void;
  readingId?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [copiedVerdict, setCopiedVerdict] = useState(false);
  const [isActionPinned, setIsActionPinned] = useState(false);
  const [userReaction, setUserReaction] = useState<'accurate' | 'empowered' | 'reflecting' | null>(null);

  const pivotScenarios = result.pivot_scenarios || buildContextualPivotScenarios(
    (topic as any) || 'love',
    drawnCards[0].card,
    drawnCards[1].card,
    drawnCards[2].card,
    readerId as any
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const pinned = localStorage.getItem('tc_guidance_48h_v1');
        if (pinned) {
          const parsed = JSON.parse(pinned);
          if (parsed?.action === result.actionable_next_step) {
            setIsActionPinned(true);
          }
        }
      } catch {
        // ignore
      }
    }
  }, [result.actionable_next_step]);

  const handlePinAction = () => {
    soundManager.playCrispClick();
    if (typeof window !== 'undefined') {
      try {
        const payload = {
          savedAt: new Date().toISOString(),
          readerDisplayName,
          topic,
          action: result.actionable_next_step,
          verdict: finalVerdictText,
        };
        localStorage.setItem('tc_guidance_48h_v1', JSON.stringify(payload));
        setIsActionPinned(true);
      } catch {
        // ignore
      }
    }
  };

  const handleSelectReaction = (type: 'accurate' | 'empowered' | 'reflecting') => {
    soundManager.playCrispClick();
    setUserReaction(type);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`tc_reaction_${result.greeting_hook.slice(0, 20)}`, type);
      } catch {
        // ignore
      }
    }
  };

  const [reflectionStatus, setReflectionStatus] = useState<ReflectionStatus | null>(() => {
    if (readingId) {
      const entry = getJournalEntryById(readingId);
      return entry?.reflection?.status || null;
    }
    return null;
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const quotes = result.shareable_card.savage_quotes;
  const selectedQuote = quotes[activeQuoteIdx] || quotes[0]!;

  const finalVerdictText = usedFallback
    ? result.overall_verdict.endsWith('( DTS)')
      ? result.overall_verdict
      : `${result.overall_verdict.trim()} ( DTS)`
    : result.overall_verdict.replace(/\s*\( DTS\)$/, '');

  const handleCopyVerdict = async () => {
    soundManager.playCrispClick();
    const cardsSummary = drawnCards
      .map((d, i) => `Lá ${i + 1} (${d.position_label}): ${d.card.name_vi} (${d.reversed ? 'Ngược' : 'Xuôi'})`)
      .join('\n');
    const textToCopy = `🔮 Trải Bài Tarot với ${readerDisplayName}\n${cardsSummary}\n\n✨ Chốt hạ: ${finalVerdictText}\n🎯 Hành động: ${result.actionable_next_step}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedVerdict(true);
      setTimeout(() => setCopiedVerdict(false), 2200);
    } catch {
      // ignore
    }
  };

  const handleRateReflection = (status: ReflectionStatus) => {
    if (!readingId) return;
    updateJournalReflection(readingId, status);
    setReflectionStatus(status);
    soundManager.playMysticChime();
    setToastMsg(
      status === 'very_accurate'
        ? '✦ Tuyệt vời! Đã ghi nhận: Rất đúng'
        : status === 'partially_accurate'
        ? '✦ Đã ghi nhận: Một phần ứng nghiệm'
        : '✦ Đã ghi nhận: Chưa thấy ứng nghiệm'
    );
    setTimeout(() => setToastMsg(null), 2500);
  };

  return (
    <motion.div
      key="dashboard"
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="max-w-2xl mx-auto px-4 pt-4 pb-36 space-y-6"
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#C9A24A] text-[#0B0A12] text-xs font-bold shadow-lg animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#14121F]/90 border border-white/10 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#E5C687]">
              🔮 {readerDisplayName}
            </span>
            <span className="text-[10px] text-[#9E96B0] bg-[#0B0A12] px-2.5 py-0.5 rounded-full border border-white/10 font-medium">
              {topicLabel || 'Trải bài'}
            </span>
          </div>
          <span className="text-[10px] text-[#716A85]">
            Bảng Tổng Quan Toàn Cảnh
          </span>
        </div>

        {questionText && questionText.trim().length > 0 && (
          <div className="p-3 rounded-2xl bg-[#09080D] border border-white/5">
            <p className="text-[10px] text-[#C9A24A] font-bold uppercase tracking-wider mb-0.5">
              Nỗi niềm của {nickname || 'bạn'}:
            </p>
            <p className="text-xs text-[#D4CEE0] italic font-serif">
              &ldquo;{questionText.trim()}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* AI Voice Reader Bar */}
      <AIVoiceReaderBar
        readerId={readerId || 'ba_ngoai'}
        nickname={nickname || 'Bạn'}
        topicLabel={topicLabel || 'Tình Duyên'}
        overallVerdict={finalVerdictText}
        savageQuote={selectedQuote}
        cards={drawnCards.map((d) => ({
          name_vi: d.card.name_vi,
          reversed: d.reversed,
          position_label: d.position_label,
        }))}
      />

      {/* KHỐI 1: ⚡ BẮT BỆNH CỐT LÕI */}
      <div
        className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#171424] via-[#120F1D] to-[#0E0D17] border border-[#C9A24A]/40 shadow-xl"
        style={{ borderLeft: `4px solid ${accentColor}` }}
      >
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-[11px] font-bold tracking-wider text-[#E5C687] uppercase flex items-center gap-1.5 font-serif">
            <span className="text-amber-400">⚡</span> KHỐI 1: BẮT BỆNH CỐT LÕI
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold tracking-wider uppercase">
            Đi thẳng vào tim đen
          </span>
        </div>
        <p className="font-serif text-sm sm:text-base text-[#F8F5F0] leading-[1.7] italic">
          &ldquo;{result.greeting_hook}&rdquo;
        </p>
      </div>

      {/* KHỐI 2: 🃏 3 LÁ BÀI GIẢI MÃ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#E5C687] uppercase tracking-wider font-serif flex items-center gap-1.5">
            <span>🃏</span> KHỐI 2: GIẢI MÃ 3 LÁ GÃY GỌN
          </span>
          <span className="text-[11px] text-[#9E96B0]">
            3 Vị Trí Soi Chiếu
          </span>
        </div>

        <div className="space-y-4">
          {drawnCards.map((drawn, idx) => {
            const cardAnalysis = result.cards_analysis[idx];
            const specializedData = getCardTopicInterpretation(
              drawn.card.id,
              drawn.reversed,
              (topic as any) || 'love'
            );
            const cardWithProse = withCardProse(drawn.card);
            const rawCoreMeaning =
              (drawn.reversed ? cardWithProse.core_meaning_rev : cardWithProse.core_meaning_up) || '';
            const coreMeaning =
              specializedData?.meaning || formatTopicCoreMeaning(rawCoreMeaning, topic);
            const keywords = drawn.reversed ? drawn.card.keywords_rev : drawn.card.keywords_up;

            return (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-3xl bg-[#120F1D]/90 border border-white/10 space-y-3.5 shadow-lg"
              >
                {/* Card Header & Artwork */}
                <div className="flex items-start gap-3.5">
                  <div
                    className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl overflow-hidden border shrink-0 bg-[#09080D]"
                    style={{ borderColor: accentColor + '60' }}
                  >
                    <img
                      src={drawn.card.rws_image_url}
                      alt={drawn.card.name_vi}
                      className={`w-full h-full object-cover ${drawn.reversed ? 'rotate-180' : ''}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span
                      className="inline-block text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border mb-1"
                      style={{
                        borderColor: accentColor + '40',
                        color: accentColor,
                        backgroundColor: accentColor + '10',
                      }}
                    >
                      Lá {idx + 1}: {drawn.position_label}
                    </span>
                    <h3 className="font-serif text-base font-bold text-[#F8F5F0] truncate">
                      {drawn.card.roman}. {drawn.card.name_vi}
                    </h3>
                    <p className="text-[11px] text-[#9E96B0]">
                      {drawn.card.name_en} •{' '}
                      <span className={drawn.reversed ? 'text-amber-400' : 'text-emerald-400'}>
                        {drawn.reversed ? 'Chiều Ngược' : 'Chiều Xuôi'}
                      </span>
                    </p>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {keywords.slice(0, 3).map((kw, kIdx) => (
                        <span
                          key={kIdx}
                          className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#1D182A] text-[#E5C687] border border-white/5"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Core meaning */}
                <div className="p-3.5 rounded-2xl bg-[#09080D]/80 border border-white/5 space-y-1">
                  <p className="text-[10px] font-bold text-[#C9A24A] uppercase tracking-wider">
                    Ý nghĩa năng lượng:
                  </p>
                  <p className="text-xs sm:text-sm text-[#F8F5F0] leading-relaxed">
                    {coreMeaning}
                  </p>
                </div>

                {/* Interpretation */}
                {cardAnalysis && (
                  <div className="p-3.5 rounded-2xl bg-[#14111E] border border-emerald-500/20 space-y-1">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Luận giải cho bạn:
                    </p>
                    <p className="text-xs sm:text-sm text-[#D4CEE0] leading-relaxed">
                      {cardAnalysis.interpretation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* KHỐI 3: 🎯 CHỐT HẠ & HÀNH ĐỘNG TRONG 48H */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#1C172E] via-[#120F1D] to-[#09080D] border border-[#C9A24A]/40 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#E5C687] uppercase tracking-wider font-serif flex items-center gap-1.5">
            <span>🎯</span> KHỐI 3: CHỐT HẠ DỨT KHOÁT
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyVerdict}
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#1D1829] hover:bg-[#2A233B] text-[#E5C687] border border-[#C9A24A]/40 transition-colors cursor-pointer"
            >
              {copiedVerdict ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onRedrawCards}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#C9A24A] hover:text-[#F3E5AB] cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Chọn lại 3 lá khác</span>
            </button>
          </div>
        </div>

        <p className="font-serif text-sm sm:text-base text-[#F8F5F0] leading-relaxed whitespace-pre-line">
          {finalVerdictText}
        </p>

        {/* 2 KỊCH BẢN NGÃ RẼ: SỰ THẬT THẤU CẢM & LỐI THOÁT */}
        {pivotScenarios && (
          <div className="mt-4 pt-4 border-t border-[#E5C687]/20 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider text-[#E5C687] uppercase font-serif">
                🔀 2 KỊCH BẢN NGÃ RẼ (LỐI THOÁT HÀNH ĐỘNG)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Kịch bản Buông */}
              <div className="p-3.5 rounded-2xl bg-[#0F0D18] border border-sky-500/30 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🕊️</span>
                  <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wide">
                    Nếu Chọn Buông / Dừng Lại
                  </span>
                </div>
                <p className="text-xs text-[#D8E2EC] leading-[1.6]">
                  {pivotScenarios.scenario_release}
                </p>
              </div>

              {/* Kịch bản Giữ */}
              <div className="p-3.5 rounded-2xl bg-[#0F0D18] border border-amber-500/30 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🔥</span>
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                    Nếu Chọn Giữ / Tiếp Tục
                  </span>
                </div>
                <p className="text-xs text-[#ECDCC8] leading-[1.6]">
                  {pivotScenarios.scenario_persist}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-white/10 pt-3">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-bold text-emerald-400 uppercase block">
              ⚡ VIỆC CẦN LÀM NGAY TRONG 48H:
            </span>
            <button
              type="button"
              onClick={handlePinAction}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#1D1829] hover:bg-[#2A233B] text-[#E5C687] border border-[#C9A24A]/40 transition-all cursor-pointer"
              title="Ghim làm Kim Chỉ Nam 48h"
            >
              {isActionPinned ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Đã ghim</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3 h-3 text-[#E5C687]" />
                  <span>Ghim 48h</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs sm:text-sm text-[#D4CFE2] leading-relaxed">
            {result.actionable_next_step}
          </p>

          {/* BỘ ĐÁNH GIÁ CẢM XÚC NHANH (1-CHẠM) */}
          <div className="mt-4 pt-3.5 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[#9E96B0] uppercase tracking-wider">
                Lời luận giải này có chạm đến bạn?
              </span>
              {userReaction && (
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Đã ghi nhận
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectReaction('accurate')}
                className={`py-2 px-1.5 rounded-xl text-center text-xs font-semibold border transition-all cursor-pointer ${
                  userReaction === 'accurate'
                    ? 'bg-[#C9A24A]/20 border-[#C9A24A] text-[#F3E5AB] shadow-[0_0_12px_rgba(201,162,74,0.3)]'
                    : 'bg-[#14121F] border-white/10 text-[#9E96B0] hover:border-white/20 hover:text-[#F8F5F0]'
                }`}
              >
                🎯 Trúng tim đen
              </button>
              <button
                type="button"
                onClick={() => handleSelectReaction('empowered')}
                className={`py-2 px-1.5 rounded-xl text-center text-xs font-semibold border transition-all cursor-pointer ${
                  userReaction === 'empowered'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'bg-[#14121F] border-white/10 text-[#9E96B0] hover:border-white/20 hover:text-[#F8F5F0]'
                }`}
              >
                ⚡ Nhẹ lòng & Động lực
              </button>
              <button
                type="button"
                onClick={() => handleSelectReaction('reflecting')}
                className={`py-2 px-1.5 rounded-xl text-center text-xs font-semibold border transition-all cursor-pointer ${
                  userReaction === 'reflecting'
                    ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                    : 'bg-[#14121F] border-white/10 text-[#9E96B0] hover:border-white/20 hover:text-[#F8F5F0]'
                }`}
              >
                🧘 Cần suy ngẫm
              </button>
            </div>
          </div>

          {/* HUY HIỆU BẢO TOÀN NĂNG LƯỢNG (ENERGY COOLDOWN NOTE) */}
          <div className="mt-3.5 p-3 rounded-2xl bg-[#0A0910] border border-white/5 flex items-start gap-2.5">
            <span className="text-base shrink-0">💡</span>
            <p className="text-[11px] text-[#8E879E] leading-[1.6]">
              <strong className="text-[#E5C687]">Lưu ý năng lượng từ Reader:</strong> Hãy dành 24–48h tập trung hoàn thành hành động trên trước khi rút quẻ mới cho cùng câu chuyện để tâm trí không bị nhiễu loạn.
            </p>
          </div>
        </div>
      </div>

      {/* Savage Quote Swiper */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#120F1D] border border-white/10 space-y-2.5 text-center">
        <span className="text-[10px] font-bold text-[#C9A24A] uppercase tracking-widest block">
          CÂU NÓI TRÚC TRẮC ĐỂ ĐỜI CỦA {readerDisplayName}
        </span>
        <p className="font-serif text-sm sm:text-base text-[#E5C687] italic px-4 leading-relaxed">
          &ldquo;{selectedQuote}&rdquo;
        </p>
        <div className="flex items-center justify-center gap-2 pt-1">
          {quotes.map((_, qIdx) => (
            <button
              key={qIdx}
              type="button"
              onClick={() => {
                soundManager.playCrispClick();
                setActiveQuoteIdx(qIdx as 0 | 1 | 2);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                activeQuoteIdx === qIdx ? 'bg-[#C9A24A] w-5' : 'bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Chọn câu nói ${qIdx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Thắc Mắc Sâu Hơn Với Reader */}
      <InteractiveFollowupCard
        readerDisplayName={readerDisplayName}
        readerId={readerId}
        accentColor={accentColor}
        topic={topic}
        suggestedQuestions={result.cliffhanger_upsell?.suggested_followup_questions}
        onOpenFollowup={onOpenFollowup}
      />

      {/* Hero Lá Bài Làm Rõ Thứ 4 */}
      <HeroClarifierCard
        clarifierCard={clarifierCard}
        cliffhangerTease={result.cliffhanger_upsell?.tease_text}
        readerDisplayName={readerDisplayName}
        accentColor={accentColor}
        onContinue={onContinueClarifier}
      />

      {/* Prediction Reflection Tracker Widget */}
      <div className="p-5 rounded-3xl bg-[#0F0D1A] border border-[#C9A24A]/30 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#C9A24A] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#C9A24A]" />
            <span>Độ Ứng Nghiệm Thực Tế (Reflection Tracker)</span>
          </span>
          {reflectionStatus && (
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Đã ghi nhận
            </span>
          )}
        </div>
        <p className="text-xs text-[#9E96B0]">
          Sau khi đối chiếu với cuộc sống, quẻ bài này ứng nghiệm với bạn như thế nào?
        </p>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'very_accurate' as const, label: '✨ Rất đúng' },
            { id: 'partially_accurate' as const, label: '⚖️ Một phần' },
            { id: 'not_yet' as const, label: '⏳ Chưa thấy' },
          ].map((opt) => {
            const isSelected = reflectionStatus === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleRateReflection(opt.id)}
                className={`py-2.5 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#C9A24A]/25 border-[#C9A24A] text-[#F3E5AB] shadow-[0_0_15px_rgba(201,162,74,0.3)]'
                    : 'bg-[#14121F] border-white/10 text-[#9E96B0] hover:text-[#F8F5F0] hover:bg-[#1D182A]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fixed bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 p-3.5 sm:p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#0E0D17]/95 backdrop-blur-md border-t border-[#262235] shadow-[0_-8px_30px_rgba(0,0,0,0.8)] z-30">
        <div className="max-w-xl mx-auto flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onContinueClarifier}
            className="flex-1 py-3.5 sm:py-4 rounded-2xl text-[#0B0A12] font-bold text-xs sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer transition-all shadow-lg active:scale-98"
            style={{
              background: 'linear-gradient(135deg, #C9A24A, #E5C687)',
              boxShadow: '0 4px 25px rgba(201,162,74,0.35)',
            }}
          >
            <Star className="w-4 h-4 fill-[#0B0A12] shrink-0" />
            <span className="truncate">{clarifierCard ? 'Xem Lá Thứ 4' : 'Mở Lá Thứ 4 · 5 Sao'}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => onOpenFollowup()}
            className="py-3.5 sm:py-4 px-3 sm:px-4 rounded-2xl bg-[#14121F] hover:bg-[#1D1829] border border-[#8B5CF6]/50 hover:border-[#C9A24A] text-[#F8F5F0] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
            title="Hỏi thêm với Reader"
          >
            <MessageSquare className="w-4 h-4 text-[#C9A24A]" />
            <span className="hidden sm:inline">Hỏi thêm</span>
          </button>

          <Link
            href="/reading/story"
            className="py-3.5 sm:py-4 px-3 sm:px-4 rounded-2xl bg-[#14121F] hover:bg-[#1D1829] border border-white/10 hover:border-[#C9A24A] text-[#9E96B0] hover:text-[#F8F5F0] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
            title="Xuất Story 9:16"
          >
            <Share2 className="w-4 h-4 text-[#C9A24A]" />
            <span className="hidden sm:inline">Story</span>
          </Link>

          <button
            type="button"
            onClick={onRedrawCards}
            className="py-3.5 sm:py-4 px-3 rounded-2xl bg-[#14121F] hover:bg-[#1D1829] border border-white/10 hover:border-[#C9A24A] text-[#9E96B0] hover:text-[#F8F5F0] font-semibold text-xs transition flex items-center justify-center cursor-pointer shrink-0"
            title="Chọn lại 3 lá khác"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page Content ────────────────────────────────────────────────────────
function KetQuaPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') === 'dashboard' ? 'dashboard' : 'step_by_step';
  const [viewMode, setViewMode] = useState<'step_by_step' | 'dashboard'>(initialView);
  const shouldReduceMotion = useReducedMotion();

  const {
    readingSuccess,
    clarifierCard,
    activeQuoteIdx,
    selectedReaderId,
    readerAccentColor,
    setActiveQuoteIdx,
    setClarifierCard,
    setSelectedFanIndices,
    setReadingSuccess,
    resetReadingFlow,
  } = useReadingStore();

  // Auto-restore reading from query param or latest journal entry if state is empty
  useEffect(() => {
    if (!readingSuccess) {
      const urlId = searchParams.get('id') || searchParams.get('readingId');
      const entry = urlId ? getJournalEntryById(urlId) : getLatestJournalEntry();
      if (entry) {
        setReadingSuccess(entry.fullResponse);
        if (entry.clarifierCard) {
          setClarifierCard(entry.clarifierCard);
        }
      }
    }
  }, [readingSuccess, searchParams, setReadingSuccess, setClarifierCard]);

  const handleRedrawCards = () => {
    soundManager.playCardSlide();
    setSelectedFanIndices([]);
    setClarifierCard(null);
    setReadingSuccess(null);
    router.push('/reading/rut-bai');
  };

  // Stage machine state
  const [stage, setStage] = useState<Stage>('reveal_1');
  const [spotlightPhase, setSpotlightPhase] = useState<SpotlightPhase>('intro');

  // Clarifier state
  const [isDrawingClarifier, setIsDrawingClarifier] = useState(false);
  const [followupQuestion, setFollowupQuestion] = useState('');
  const [isFollowupOpen, setIsFollowupOpen] = useState(false);
  const [showOutOfStarsSheet, setShowOutOfStarsSheet] = useState(false);
  const { quota, updateQuota } = useQuotaSync();

  // Set default followup question from cliffhanger when result loads
  useEffect(() => {
    if (readingSuccess?.result?.cliffhanger_upsell?.suggested_followup_questions?.[0]) {
      setFollowupQuestion(readingSuccess.result.cliffhanger_upsell.suggested_followup_questions[0]);
    } else {
      setFollowupQuestion('Bước ngoặt ẩn giấu nào sắp xảy ra trong 7 ngày tới mà mình cần chuẩn bị?');
    }
  }, [readingSuccess]);

  // Play Tibetan singing bowl when reaching verdict stage & cleanup audio on unmount
  useEffect(() => {
    if (stage === 'verdict') {
      soundManager.playTibetanSingingBowl();
    } else if (stage === 'reveal_1' || stage === 'reveal_2' || stage === 'reveal_3') {
      soundManager.playOrganicCardFlip();
    }
  }, [stage]);

  useEffect(() => {
    return () => {
      soundManager.cleanupRouteAudio();
    };
  }, []);

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!readingSuccess) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Sparkles className="w-12 h-12 text-[#C9A24A] mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold text-[#F8F5F0] mb-2">
          Chưa Có Kết Quả Trải Bài
        </h2>
        <p className="text-xs text-[#9E96B0] mb-6">
          Bạn chưa thực hiện nghi thức rút bài nào trong phiên này.
        </p>
        <Link
          href="/reading/reader"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#C9A24A] text-[#0B0A12] font-bold text-sm shadow-md cursor-pointer"
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

    if ((quota?.starsBalance ?? 0) < 5) {
      setShowOutOfStarsSheet(true);
      return;
    }

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

      if (res.status === 402 || data?.code === 'INSUFFICIENT_STARS') {
        setShowOutOfStarsSheet(true);
        return;
      }
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
          interpretation: withCardProse(chosen).core_meaning_up || '',
          advice: withCardProse(chosen).healing_hook_up || '',
          savageQuote: withCardProse(chosen).savage_hook_up || '',
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
        interpretation: withCardProse(chosen).core_meaning_up || '',
        advice: withCardProse(chosen).healing_hook_up || '',
        savageQuote: withCardProse(chosen).savage_hook_up || '',
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
      {/* Sticky Header: Mode switcher + Stage/Title + Actions */}
      <div className="sticky top-0 z-30 bg-[#0E0D17]/90 backdrop-blur-md border-b border-[#262235] px-4 py-2.5">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
          {/* Back button for detail phases (only in step_by_step mode) */}
          {viewMode === 'step_by_step' && spotlightPhase === 'detail' && currentCardIdx >= 0 ? (
            <button
              type="button"
              onClick={() => setSpotlightPhase('intro')}
              className="text-[11px] text-[#9E96B0] hover:text-[#F8F5F0] flex items-center gap-1 cursor-pointer transition-colors shrink-0"
            >
              ← Quay lại
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-[#14121F] p-0.5 rounded-xl border border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundManager.playCrispClick();
                  setViewMode('step_by_step');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                  viewMode === 'step_by_step'
                    ? 'bg-[#C9A24A] text-[#0B0A12]'
                    : 'text-[#9E96B0] hover:text-[#F8F5F0]'
                }`}
                title="Xem từng bước kịch tính"
              >
                <ListOrdered className="w-3 h-3" />
                <span className="hidden sm:inline">Từng Bước</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundManager.playCrispClick();
                  setViewMode('dashboard');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                  viewMode === 'dashboard'
                    ? 'bg-[#C9A24A] text-[#0B0A12]'
                    : 'text-[#9E96B0] hover:text-[#F8F5F0]'
                }`}
                title="Xem toàn cảnh tổng thể"
              >
                <LayoutGrid className="w-3 h-3" />
                <span className="hidden sm:inline">Toàn Cảnh</span>
              </button>
            </div>
          )}

          {/* Stage label or View Mode title */}
          <span className="text-[11px] font-bold text-[#C9A24A] uppercase tracking-widest text-center truncate">
            {viewMode === 'dashboard'
              ? 'Bảng Toàn Cảnh Trải Bài'
              : `${stageLabels[stage]}${spotlightPhase === 'detail' ? ' — Chi Tiết' : ''}`}
          </span>

          {/* 5-dot progress or quick redraw */}
          {viewMode === 'step_by_step' ? (
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
          ) : (
            <button
              type="button"
              onClick={handleRedrawCards}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#9E96B0] hover:text-[#C9A24A] shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Rút lại</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === 'dashboard' ? (
        <DashboardView
          drawnCards={drawnCards}
          result={result}
          readerDisplayName={readerDisplayName}
          accentColor={accentColor}
          activeQuoteIdx={activeQuoteIdx}
          setActiveQuoteIdx={setActiveQuoteIdx}
          questionText={readingSuccess.questionText}
          nickname={readingSuccess.nickname}
          usedFallback={readingSuccess.aiMeta?.usedFallback}
          readerId={readingSuccess.readerId}
          topicLabel={readingSuccess.topicLabel}
          topic={readingSuccess.topic}
          clarifierCard={clarifierCard}
          onContinueClarifier={() => {
            if (clarifierCard) return;
            if ((quota?.starsBalance ?? 0) < 5) {
              setShowOutOfStarsSheet(true);
              return;
            }
            void handleDrawClarifier();
          }}
          onOpenFollowup={(q?: string) => {
            if (q) setFollowupQuestion(q);
            setIsFollowupOpen(true);
          }}
          onRedrawCards={handleRedrawCards}
          readingId={readingSuccess.readingId}
        />
      ) : (
        /* Main content — stage-gated */
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
            questionText={readingSuccess.questionText}
            nickname={readingSuccess.nickname}
            usedFallback={readingSuccess.aiMeta?.usedFallback}
            readerId={readingSuccess.readerId}
            topicLabel={readingSuccess.topicLabel}
            topic={readingSuccess.topic}
            clarifierCard={clarifierCard}
            onContinue={() => {
              if (clarifierCard) {
                setStage('clarifier');
                return;
              }
              if ((quota?.starsBalance ?? 0) < 5) {
                setShowOutOfStarsSheet(true);
                return;
              }
              setStage('clarifier');
              void handleDrawClarifier();
            }}
            onOpenFollowup={(q?: string) => {
              if (q) setFollowupQuestion(q);
              setIsFollowupOpen(true);
            }}
            onRedrawCards={handleRedrawCards}
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
      )}

      {/* Deep-dive follow-up modal */}
      {readingSuccess && (
        <FollowupChatModal
          isOpen={isFollowupOpen}
          onClose={() => setIsFollowupOpen(false)}
          reading={readingSuccess}
          accentColor={accentColor}
          initialQuestion={followupQuestion}
        />
      )}

      {/* Out of stars modal sheet */}
      <OutOfStarsSheet
        isOpen={showOutOfStarsSheet}
        onClose={() => setShowOutOfStarsSheet(false)}
        requiredStars={5}
        currentStars={quota?.starsBalance ?? 0}
        reasonText="Bạn cần 5 Sao để mở khóa Lá Bài Làm Rõ Thứ 4."
      />

      {/* CustomCursorFollower */}
      <CustomCursorFollower />
    </div>
  );
}

export default function KetQuaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <Sparkles className="w-8 h-8 text-[#C9A24A] animate-spin" />
            <p className="text-xs text-[#9E96B0]">Đang tải kết quả trải bài...</p>
          </div>
        </div>
      }
    >
      <KetQuaPageContent />
    </Suspense>
  );
}
