'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Shield,
  Flame,
  Heart,
  Lock,
  Unlock,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Share2,
  Gift,
  Users,
  CheckCircle2,
  AlertCircle,
  Eye,
  Compass,
  Wand2,
  Play,
  Star,
  BarChart3,
  Scale,
  Layers,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { ALL_TAROT_CARDS, READERS } from '@/data/tarot-cards';
import {
  classifyAgeTier,
  getSpreadPositionsForTopic,
} from '@/lib/safety';
import {
  CURRENT_REFERENCE_YEAR,
  type DeckMode,
  type ReaderId,
  type TopicId,
} from '@/lib/schemas';
import type {
  ClarifierCardPayload,
  QuotaStatusPayload,
  ReadingApiResponse,
  ReadingCrisisResponse,
  ReadingSuccessResponse,
} from '@/lib/api-types';
import { TarotCardVisual } from '@/components/TarotCardVisual';
import { CrisisSupportView } from '@/components/CrisisSupportView';
import { StoryCardModal } from '@/components/StoryCardModal';
import { LegalPrivacyModal } from '@/components/LegalPrivacyModal';
import { DailyStreakModal } from '@/components/DailyStreakModal';
import { WalletPayOSModal } from '@/components/WalletPayOSModal';
import { FunnelAnalyticsModal } from '@/components/FunnelAnalyticsModal';
import { CoupleModeView } from '@/components/CoupleModeView';
import { SpiritualWrappedModal } from '@/components/SpiritualWrappedModal';
import { TikTokStudioModal } from '@/components/TikTokStudioModal';
import { ReferralAndAdModal } from '@/components/ReferralAndAdModal';
import MobileBottomNav from '@/components/MobileBottomNav';

type RitualStep = 1 | 2 | 3 | 4;
type AppMode = 'solo' | 'couple';

const SAMPLE_QUESTIONS_BY_TOPIC: Record<TopicId, string[]> = {
  love: [
    'Người ấy im lặng 3 ngày nay là đang bận thật hay đang âm thầm ghost mình vậy bà?',
    'Mối quan hệ mập mờ hiện tại có cơ hội tiến tới chính thức trong tháng tới không?',
    'Mình nên chủ động nhắn tin trước hay lùi lại giữ giá để xem thái độ người ta?',
  ],
  career: [
    'Mình đang phân vân giữa việc nhảy việc sang môi trường mới hay ở lại chờ cơ hội thăng tiến?',
    'Dự án và kỳ thi sắp tới của mình đang gặp điểm nghẽn gì cần tháo gỡ ngay?',
    'Làm sao để thoát khỏi cảm giác trì hoãn và mất động lực mỗi sáng thức dậy?',
  ],
  finance: [
    'Tình hình tài chính tháng này của mình cần lưu ý lỗ hổng chi tiêu nào nhất?',
    'Sắp tới mình có cơ hội tăng thu nhập hay công việc làm thêm nào khả quan không?',
    'Thói quen nào đang âm thầm cản trở vận may tiền bạc của mình lúc này?',
  ],
  crush_school: [
    'Bạn ngồi bàn bên cạnh dạo này hay nhìn mình cười, không biết bạn ấy nghĩ gì về mình nhỉ?',
    'Làm sao để tụi mình trong nhóm bạn thân hiểu nhau hơn và không còn giận dỗi vu vơ?',
    'Mình muốn bắt chuyện làm quen với crush cùng khối thì nên mở lời thế nào cho tự nhiên?',
  ],
  study: [
    'Kỳ thi học kỳ sắp tới mình nên tập trung ôn luyện thế nào để đạt điểm cao nhất?',
    'Mình hay bị mất tập trung khi ngồi vào bàn học, có bí kíp nào giúp mình bứt phá không?',
    'Môn học mình đang lo lắng nhất sẽ có chuyển biến tích cực nếu mình đổi cách học chứ?',
  ],
  daily_luck: [
    'Tuần mới của mình trên trường sẽ có niềm vui hay điều bất ngờ dễ thương nào đang chờ đón?',
    'Năng lượng may mắn hôm nay nhắn nhủ mình nên làm một việc tốt gì để cả ngày rực rỡ?',
    'Hôm nay mình cần giữ tinh thần thế nào để thu hút toàn chuyện vui vẻ?',
  ],
};

const ZODIAC_SIGNS = [
  'Bạch Dương (21/3 - 19/4)',
  'Kim Ngưu (20/4 - 20/5)',
  'Song Tử (21/5 - 21/6)',
  'Cự Giải (22/6 - 22/7)',
  'Sư Tử (23/7 - 22/8)',
  'Xử Nữ (23/8 - 22/9)',
  'Thiên Bình (23/9 - 23/10)',
  'Bọ Cạp (24/10 - 22/11)',
  'Nhân Mã (23/11 - 21/12)',
  'Ma Kết (22/12 - 19/1)',
  'Bảo Bình (20/1 - 18/2)',
  'Song Ngư (19/2 - 20/3)',
];

const BIRTH_YEAR_OPTIONS = Array.from(
  { length: 2016 - 1970 + 1 },
  (_, i) => 2016 - i
);

export default function TarotCoupleHomePage() {
  // Super-App Mode Switcher ('solo' vs 'couple') & URL invite param
  const [appMode, setAppMode] = useState<AppMode>('solo');
  const activeMainMode = appMode;
  const setActiveMainMode = setAppMode;
  const [inviteRoomCode, setInviteRoomCode] = useState<string | null>(null);

  // Desktop iPhone 16 Pro Frame Simulator Mode (default false)
  const [isPhoneSimulator, setIsPhoneSimulator] = useState<boolean>(false);
  // Founder/admin mode — internal tools visible only when ?admin=1 is in URL
  const [isFounderMode, setIsFounderMode] = useState<boolean>(false);

  // Navigation & Flow Steps (Solo Mode)
  const [step, setStep] = useState<RitualStep>(1);

  // Step 1: Persona selection (All 4 Readers available!)
  const [selectedReaderId, setSelectedReaderId] =
    useState<ReaderId>('ba_co_mo_hon');

  // Step 2: User context, Age policy, Partner nickname, Zodiac & Deck Mode
  const [nickname, setNickname] = useState<string>('Linh');
  const [partnerNickname, setPartnerNickname] = useState<string>('');
  const [zodiacSign, setZodiacSign] = useState<string>('');
  const [birthYear, setBirthYear] = useState<number>(2004);
  const [selectedTopic, setSelectedTopic] = useState<TopicId>('love');
  const [deckMode, setDeckMode] = useState<DeckMode>('full_78');
  const [questionText, setQuestionText] = useState<string>('');
  const [hideQuestionOnShare, setHideQuestionOnShare] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Step 3: Shuffle & Fan Selection
  const [shuffleStage, setShuffleStage] = useState<'charge' | 'fan'>('charge');
  const [chargeProgress, setChargeProgress] = useState<number>(0);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [selectedFanIndices, setSelectedFanIndices] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const chargeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Step 4: Reading Result, Crisis Response & Clarifier 4th Card
  const [readingSuccess, setReadingSuccess] =
    useState<ReadingSuccessResponse | null>(null);
  const [storyModalReading, setStoryModalReading] =
    useState<ReadingSuccessResponse | null>(null);
  const [crisisResponse, setCrisisResponse] =
    useState<ReadingCrisisResponse | null>(null);
  const [flippedCards, setFlippedCards] = useState<[boolean, boolean, boolean]>([
    true,
    false,
    false,
  ]);
  const [activeQuoteIdx, setActiveQuoteIdx] = useState<0 | 1 | 2>(0);

  // Step 4 Clarifier Card (Lá Làm Rõ Thứ 4 — 5 ⭐)
  const [followupQuestion, setFollowupQuestion] = useState<string>('');
  const [clarifierCard, setClarifierCard] =
    useState<ClarifierCardPayload | null>(null);
  const [isClarifierFlipped, setIsClarifierFlipped] = useState<boolean>(true);
  const [isDrawingClarifier, setIsDrawingClarifier] = useState<boolean>(false);
  const [clarifierError, setClarifierError] = useState<string | null>(null);

  // Modals & Quota / Wallet / Streak
  const [quota, setQuota] = useState<QuotaStatusPayload>({
    usedToday: 0,
    dailyLimit: 3,
    bonusDraws: 0,
    remainingToday: 3,
    starsBalance: 15,
    streakDays: 1,
    dailyPullCompletedToday: false,
    dailySpendVnd: 0,
    dailySpendCapVnd: 50000,
  });
  const [isStoryModalOpen, setIsStoryModalOpen] = useState<boolean>(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [isDailyStreakModalOpen, setIsDailyStreakModalOpen] =
    useState<boolean>(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [isFunnelModalOpen, setIsFunnelModalOpen] = useState<boolean>(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState<boolean>(false);
  const [isWrappedModalOpen, setIsWrappedModalOpen] = useState<boolean>(false);
  const [isTikTokStudioModalOpen, setIsTikTokStudioModalOpen] =
    useState<boolean>(false);
  const [isReferralModalOpen, setIsReferralModalOpen] =
    useState<boolean>(false);
  const [referralCodeParam, setReferralCodeParam] = useState<string | null>(
    null
  );
  const [adCountdown, setAdCountdown] = useState<number | null>(null);
  const [bonusBanner, setBonusBanner] = useState<string | null>(null);

  // Real-time Age Policy computation
  const agePolicy = useMemo(
    () => classifyAgeTier(birthYear, CURRENT_REFERENCE_YEAR, selectedReaderId),
    [birthYear, selectedReaderId]
  );

  // Keep selectedTopic synchronized with allowedTopics when age tier switches between 10-15 and 16+
  useEffect(() => {
    const allowedIds = agePolicy.allowedTopics.map((t) => t.id);
    if (!allowedIds.includes(selectedTopic)) {
      const nextDefault = agePolicy.allowedTopics[0]?.id || 'love';
      setSelectedTopic(nextDefault);
      const samples = SAMPLE_QUESTIONS_BY_TOPIC[nextDefault];
      if (samples && samples[0]) {
        setQuestionText(samples[0]);
      }
    }
  }, [agePolicy, selectedTopic]);

  // Check URL `?coupleRoom=XYZ` and `?ref=XYZ` on mount & fetch initial quota
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('tc_nickname');
      const savedYear = localStorage.getItem('tc_birth_year');
      if (savedName) setNickname(savedName);
      if (savedYear) {
        const parsed = Number.parseInt(savedYear, 10);
        if (parsed >= 1970 && parsed <= 2016) setBirthYear(parsed);
      }

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const roomParam = params.get('coupleRoom');
        if (roomParam && roomParam.trim()) {
          setInviteRoomCode(roomParam.trim().toUpperCase());
          setAppMode('couple');
        }
        const refParam = params.get('ref');
        if (refParam && refParam.trim()) {
          setReferralCodeParam(refParam.trim().toUpperCase());
          setIsReferralModalOpen(true);
        }
        // Founder/admin mode: hidden tools visible only when ?admin=1 is in URL
        if (params.get('admin') === '1' || params.get('founder') === '1') {
          setIsFounderMode(true);
        }
      }
    } catch {
      // Ignore storage access errors
    }

    fetch('/api/reading?track=page_view')
      .then((res) => res.json())
      .then((data) => {
        if (data?.quota) {
          setQuota((prev) => ({
            ...prev,
            ...data.quota,
            starsBalance: data.quota.starsBalance ?? prev.starsBalance ?? 15,
            streakDays: data.quota.streakDays ?? prev.streakDays ?? 1,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const currentSpreadPositions = useMemo(
    () => getSpreadPositionsForTopic(selectedTopic),
    [selectedTopic]
  );

  // Step 2 -> Step 3 validation
  const handleProceedToStep3 = () => {
    setFormError(null);
    const trimmedName = nickname.trim() || 'Bạn Ẩn Danh';
    const trimmedQuestion = questionText.trim();

    if (!trimmedQuestion) {
      setFormError(
        'Hãy chọn một câu hỏi gợi ý bên dưới hoặc viết đôi dòng tâm sự để Vũ Trụ bắt sóng nhé!'
      );
      return;
    }

    if (trimmedQuestion.length > 300) {
      setFormError('Câu hỏi tối đa 300 ký tự để giữ năng lượng tập trung.');
      return;
    }

    try {
      localStorage.setItem('tc_nickname', trimmedName);
      localStorage.setItem('tc_birth_year', String(birthYear));
    } catch {
      // Ignore storage errors
    }

    setNickname(trimmedName);
    setShuffleStage('charge');
    setChargeProgress(0);
    setSelectedFanIndices([]);
    setStep(3);
  };

  // Sub-stage 3A: Haptic 3s Energy Charge
  const startEnergyCharge = () => {
    if (shuffleStage === 'fan') return;
    if (isCharging) return;

    setIsCharging(true);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 60, 40, 80, 120]);
    }

    if (chargeIntervalRef.current) {
      clearInterval(chargeIntervalRef.current);
    }

    chargeIntervalRef.current = setInterval(() => {
      setChargeProgress((prev) => {
        const next = prev + 5;
        if (next >= 100) {
          if (chargeIntervalRef.current) {
            clearInterval(chargeIntervalRef.current);
          }
          setIsCharging(false);
          setShuffleStage('fan');
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([90, 50, 140]);
          }
          return 100;
        }
        return next;
      });
    }, 85);
  };

  useEffect(() => {
    return () => {
      if (chargeIntervalRef.current) {
        clearInterval(chargeIntervalRef.current);
      }
    };
  }, []);

  const totalDeckCards = deckMode === 'full_78' ? 78 : 22;

  // Sub-stage 3B: Pick 3 cards from the arc fan
  const handlePickFanCard = (fanIndex: number) => {
    if (isSubmitting) return;
    if (selectedFanIndices.includes(fanIndex)) return;
    if (selectedFanIndices.length >= 3) return;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }

    const updated = [...selectedFanIndices, fanIndex];
    setSelectedFanIndices(updated);

    if (updated.length === 3) {
      void submitReadingRequest([updated[0]!, updated[1]!, updated[2]!]);
    }
  };

  const handleQuickPickThree = () => {
    if (isSubmitting) return;
    const pool = Array.from({ length: totalDeckCards }, (_, idx) => idx);
    const picked: number[] = [];
    while (picked.length < 3) {
      const randIdx = Math.floor(Math.random() * pool.length);
      const val = pool.splice(randIdx, 1)[0]!;
      picked.push(val);
    }
    setSelectedFanIndices(picked);
    void submitReadingRequest([picked[0]!, picked[1]!, picked[2]!]);
  };

  // Call POST /api/reading
  const submitReadingRequest = async (indices: [number, number, number]) => {
    setIsSubmitting(true);
    setFormError(null);
    setCrisisResponse(null);
    setReadingSuccess(null);
    setClarifierCard(null);
    setClarifierError(null);

    try {
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim() || 'Bạn Ẩn Danh',
          birth_year: birthYear,
          reader_id: selectedReaderId,
          topic: selectedTopic,
          deck_mode: deckMode,
          question_text: questionText.trim(),
          selected_indices: indices,
        }),
      });

      const data = (await res.json()) as ReadingApiResponse;

      if (data.status === 'crisis') {
        setCrisisResponse(data);
        setStep(4);
        return;
      }

      if (data.status === 'error') {
        if (data.quota) {
          setQuota((prev) => ({ ...prev, ...data.quota }));
        }
        setFormError(data.message);
        setSelectedFanIndices([]);
        if (data.code === 'QUOTA_EXCEEDED') {
          setIsRewardModalOpen(true);
        }
        return;
      }

      if (data.status === 'ok') {
        setReadingSuccess(data);
        setStoryModalReading(data);
        setQuota((prev) => ({
          ...prev,
          ...data.quota,
          starsBalance: data.quota.starsBalance ?? prev.starsBalance ?? 15,
          streakDays: data.quota.streakDays ?? prev.streakDays ?? 1,
        }));
        setFlippedCards([true, false, false]);
        setActiveQuoteIdx(0);
        const defaultFollowup =
          data.result.cliffhanger_upsell?.suggested_followup_questions?.[0] ||
          'Bước ngoặt ẩn giấu nào sắp xảy ra trong 7 ngày tới mà mình cần chuẩn bị?';
        setFollowupQuestion(defaultFollowup);
        setStep(4);
      }
    } catch {
      setFormError(
        'Kết nối tạm thời gián đoạn. Vui lòng chạm chọn lại lá bài thứ 3 nhé!'
      );
      setSelectedFanIndices((prev) => prev.slice(0, 2));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Call POST /api/clarifier (Lá Bài Làm Rõ Thứ 4 — 5 ⭐)
  const handleDrawClarifierCard = async () => {
    if (!readingSuccess || isDrawingClarifier) return;

    const currentStars = quota.starsBalance ?? 0;
    const costStars =
      readingSuccess.result.cliffhanger_upsell?.clarifier_cost_stars ?? 5;

    if (currentStars < costStars) {
      setIsWalletModalOpen(true);
      return;
    }

    const askedQ =
      followupQuestion.trim() ||
      'Điều ẩn giấu thực sự phía sau 3 lá bài này là gì?';

    setIsDrawingClarifier(true);
    setClarifierError(null);

    try {
      const previousCardIds = readingSuccess.drawnCards.map((d) => d.card.id);
      const res = await fetch('/api/clarifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reading_id: readingSuccess.readingId,
          readingId: readingSuccess.readingId,
          nickname: readingSuccess.nickname,
          birth_year: birthYear,
          birthYear,
          reader_id: selectedReaderId,
          readerId: selectedReaderId,
          topic: selectedTopic,
          original_question: readingSuccess.questionText,
          originalQuestion: readingSuccess.questionText,
          followup_question: askedQ,
          followupQuestion: askedQ,
          previous_card_ids: previousCardIds,
          previousCardIds,
          deck_mode: deckMode,
          deckMode,
        }),
      });

      const data = await res.json();

      if (!res.ok || data?.status === 'error') {
        if (data?.code === 'INSUFFICIENT_STARS') {
          setIsWalletModalOpen(true);
          return;
        }
        setClarifierError(
          data?.message || 'Không thể rút Lá Bài Làm Rõ lúc này.'
        );
        return;
      }

      const clarifierPayload: ClarifierCardPayload | undefined =
        data?.clarifier || (data?.card ? data : undefined);

      if (clarifierPayload && clarifierPayload.card) {
        setClarifierCard(clarifierPayload);
        setIsClarifierFlipped(true);
        if (data.quota) {
          setQuota((prev) => ({ ...prev, ...data.quota }));
        } else {
          setQuota((prev) => ({
            ...prev,
            starsBalance: Math.max(0, (prev.starsBalance ?? 15) - costStars),
          }));
        }
      } else {
        // Resilient client fallback if /api/clarifier is not yet mounted
        const usedIds = new Set(readingSuccess.drawnCards.map((c) => c.card.id));
        const available = ALL_TAROT_CARDS.filter((c) => !usedIds.has(c.id));
        const chosen =
          available[Math.floor(Math.random() * available.length)] ??
          ALL_TAROT_CARDS[0]!;
        const isRev = Math.random() < 0.3;
        const fallbackClarifier: ClarifierCardPayload = {
          card: chosen,
          reversed: isRev,
          questionAsked: askedQ,
          interpretation: isRev ? chosen.core_meaning_rev : chosen.core_meaning_up,
          advice: isRev ? chosen.healing_hook_rev : chosen.healing_hook_up,
          savageQuote: isRev ? chosen.savage_hook_rev : chosen.savage_hook_up,
          starsSpent: costStars,
        };
        setClarifierCard(fallbackClarifier);
        setIsClarifierFlipped(true);
        setQuota((prev) => ({
          ...prev,
          starsBalance: Math.max(0, (prev.starsBalance ?? 15) - costStars),
        }));
      }
    } catch {
      const usedIds = new Set(readingSuccess.drawnCards.map((c) => c.card.id));
      const available = ALL_TAROT_CARDS.filter((c) => !usedIds.has(c.id));
      const chosen =
        available[Math.floor(Math.random() * available.length)] ??
        ALL_TAROT_CARDS[0]!;
      const isRev = Math.random() < 0.3;
      const fallbackClarifier: ClarifierCardPayload = {
        card: chosen,
        reversed: isRev,
        questionAsked: askedQ,
        interpretation: isRev ? chosen.core_meaning_rev : chosen.core_meaning_up,
        advice: isRev ? chosen.healing_hook_rev : chosen.healing_hook_up,
        savageQuote: isRev ? chosen.savage_hook_rev : chosen.savage_hook_up,
        starsSpent: costStars,
      };
      setClarifierCard(fallbackClarifier);
      setIsClarifierFlipped(true);
      setQuota((prev) => ({
        ...prev,
        starsBalance: Math.max(0, (prev.starsBalance ?? 15) - costStars),
      }));
    } finally {
      setIsDrawingClarifier(false);
    }
  };

  // Simulated 15s Rewarded Ad or Share Bonus
  const handleWatchSimulatedRewardedAd = () => {
    if (adCountdown !== null) return;
    setAdCountdown(5);
    const timer = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          void claimBonusTurn('reward_ad_bonus');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const claimBonusTurn = async (
    action: 'share_bonus' | 'reward_ad_bonus' | 'reset_demo_quota'
  ) => {
    try {
      const res = await fetch('/api/reading', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data?.quota) {
        setQuota((prev) => ({ ...prev, ...data.quota }));
      }
      setBonusBanner(
        data?.message ||
          'Đã cộng thêm +1 lượt trải bài miễn phí vào tài khoản phiên của bạn!'
      );
      setTimeout(() => {
        setIsRewardModalOpen(false);
        setBonusBanner(null);
      }, 1800);
    } catch {
      // Ignore error
    }
  };

  // Reset ritual back to Step 1
  const handleResetRitual = () => {
    setAppMode('solo');
    setStep(1);
    setCrisisResponse(null);
    setReadingSuccess(null);
    setClarifierCard(null);
    setSelectedFanIndices([]);
    setShuffleStage('charge');
    setChargeProgress(0);
    setFormError(null);
  };

  const activeReaderObj =
    READERS.find((r) => r.id === selectedReaderId) ?? READERS[0]!;

  const cliffhangerData = useMemo(() => {
    if (!readingSuccess || readingSuccess.safetyFlag === 'crisis') return null;
    if (readingSuccess.result.cliffhanger_upsell) {
      return readingSuccess.result.cliffhanger_upsell;
    }
    return {
      tease_text: `${readingSuccess.readerDisplayName} nhận thấy giữa lá bài số 2 và số 3 vẫn còn một điểm nút ẩn giấu chưa được lật mở hết. Bạn có muốn rút thêm Lá Bài Làm Rõ thứ 4 để soi tận gốc không?`,
      suggested_followup_questions: [
        'Hành động thực sự tiếp theo của đối phương/cục diện trong 7 ngày tới là gì?',
        'Điều gì mình tuyệt đối không nên làm lúc này để tránh đi vào vết xe đổ?',
      ] as [string, string],
      clarifier_cost_stars: 5,
    };
  }, [readingSuccess]);

  return (
    <div className={isPhoneSimulator ? 'min-h-dvh bg-[#050408] sm:py-2' : ''}>
      {/* Desktop Floating Simulator Mode Pill (sm: and above) — only in Founder Mode */}
      {isFounderMode ? (
      <div className="hidden sm:flex justify-center pt-2 pb-1 relative z-50">
        <button
          type="button"
          onClick={() => setIsPhoneSimulator((prev) => !prev)}
          data-testid="desktop-simulator-toggle-btn"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#171424]/95 hover:bg-[#231D36] border border-[#D4AF37]/45 text-xs font-bold text-[#F3E5AB] shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-all cursor-pointer"
        >
          {isPhoneSimulator ? (
            <>
              <Monitor className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>🖥️ Xem Toàn Màn Hình</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>📱 Xem Khung Điện Thoại (iPhone 16 Pro)</span>
            </>
          )}
        </button>
      </div>
      ) : null}

      <div
        className={
          isPhoneSimulator
            ? 'w-full min-h-dvh pb-28 pb-safe-nav bg-[#09080D] text-[#F8F5F0] flex flex-col justify-between relative overflow-x-hidden max-w-[420px] mx-auto my-4 rounded-[42px] border-[6px] border-[#262135] shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden'
            : 'w-full min-h-dvh pb-28 pb-safe-nav bg-[#09080D] text-[#F8F5F0] flex flex-col justify-between relative overflow-x-hidden'
        }
      >
        {/* Subtle Ambient Gold-Obsidian Spotlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.09)_0%,rgba(18,16,27,0.45)_45%,rgba(9,8,13,1)_85%)]"
        />

        {/* iPhone 16 Pro Dynamic Island Notch (visible when isPhoneSimulator is active) */}
        {isPhoneSimulator ? (
          <div className="relative z-40 flex items-center justify-between px-6 pt-2.5 pb-1.5 bg-[#09080D] border-b border-white/5 select-none">
            <span className="text-[11px] font-bold text-[#F8F5F0]/85 tracking-tight">
              9:41
            </span>
            <div className="h-5 w-28 rounded-full bg-black border border-white/15 shadow-inner flex items-center justify-end px-2.5">
              <span className="h-2 w-2 rounded-full bg-[#1A162B] ring-1 ring-emerald-400/50" />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#F8F5F0]/80">
              <span>5G</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                100%
              </span>
            </div>
          </div>
        ) : null}

        {/* ================= TOP NAVIGATION BAR ================= */}
        <header className="sticky top-0 z-40 border-b border-[#D4AF37]/20 bg-[#09080D]/95 backdrop-blur-md">
          {/* Primary Single-Row Thumb-Friendly Bar */}
          <div className="max-w-6xl mx-auto h-14 px-3 sm:px-4 flex items-center justify-between gap-2">
            {/* Left: TarotCouple Emblem + Brand title */}
            <button
              type="button"
              onClick={handleResetRitual}
              className="flex items-center gap-2 text-left group cursor-pointer shrink-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#171424] border border-[#D4AF37]/50 flex items-center justify-center text-[#F3E5AB] shadow-[0_0_18px_rgba(212,175,55,0.2)] group-hover:border-[#F3E5AB] transition-colors">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div>
                <span className="font-display text-sm sm:text-lg font-bold tracking-wider text-[#F8F5F0] block leading-none">
                  TAROT COUPLE
                </span>
                <span className="text-[8px] sm:text-[9px] tracking-[0.14em] uppercase text-[#D4AF37]">
                  RWS 1909 • Super-App
                </span>
              </div>
            </button>

            {/* Right: Compact ⭐ {starsBalance} pill, 🔮 {remainingToday} lượt pill, and Desktop 📱 Khung ĐT toggle */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* 1. Ví Sao (WalletPayOSModal) */}
              <button
                type="button"
                onClick={() => setIsWalletModalOpen(true)}
                data-testid="topbar-wallet-btn"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-[#241B35] to-[#171223] hover:border-[#F3E5AB] border border-[#D4AF37]/50 text-[11px] sm:text-xs font-bold text-[#F3E5AB] transition-all cursor-pointer shrink-0"
                title="Ví Sao & Cổng Thanh Toán VietQR PayOS"
              >
                <span>⭐ {quota.starsBalance ?? 15}</span>
              </button>

              {/* 2. Lượt miễn phí */}
              <button
                type="button"
                onClick={() => setIsRewardModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#171424] hover:bg-[#221D34] border border-[#D4AF37]/35 text-[11px] sm:text-xs font-semibold text-[#F3E5AB] transition-colors cursor-pointer shrink-0"
                title="Lượt trải bài miễn phí hôm nay"
              >
                <span>🔮 {quota.remainingToday} lượt</span>
              </button>

              {/* 3. Desktop Khung ĐT Toggle Button — only in Founder Mode */}
              {isFounderMode ? (
                <button
                  type="button"
                  onClick={() => setIsPhoneSimulator((prev) => !prev)}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-[#D4AF37]/35 text-[11px] font-semibold text-[#F3E5AB] transition-colors cursor-pointer shrink-0"
                  title="Chuyển đổi Khung Điện Thoại (iPhone 16 Pro) / Toàn Màn Hình"
                >
                  <span>{isPhoneSimulator ? '🖥️ Toàn Màn' : '📱 Khung ĐT'}</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Subtle Horizontal Scrollable Quick-Chip Bar (never wraps onto multiple lines) */}
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-1.5 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap">
            {/* Public: Referral/Gift */}
            <button
              type="button"
              onClick={() => setIsReferralModalOpen(true)}
              data-testid="topbar-referral-btn"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-[11px] font-bold text-emerald-200 transition-colors cursor-pointer shrink-0"
              title="Mời Bạn Bè Nhận +5 Sao ⭐ & Xem Quảng Cáo Thưởng"
            >
              <span>🎁 Mời Bạn +5⭐</span>
            </button>

            {/* Public: Daily Streak */}
            <button
              type="button"
              onClick={() => setIsDailyStreakModalOpen(true)}
              data-testid="topbar-streak-btn"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-[11px] font-bold text-amber-200 transition-colors cursor-pointer shrink-0"
              title="Thông Điệp Vũ Trụ Hàng Ngày & Chuỗi Điểm Danh Streak"
            >
              <span>🔥 {quota.streakDays ?? 1} ngày</span>
            </button>

            {/* Public: Legal */}
            <button
              type="button"
              onClick={() => setIsLegalModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-[#A39BB5] hover:text-[#F8F5F0] transition-colors cursor-pointer shrink-0"
              title="Điều khoản, Quyền riêng tư & Chính sách độ tuổi 10+"
            >
              <span>⚖️ Pháp lý</span>
            </button>

            {/* ——— Founder-Only Internal Tools (hidden from public users) ——— */}
            {isFounderMode ? (
              <>
                <span className="text-[9px] text-[#D4AF37]/60 px-1 shrink-0">|</span>

                <button
                  type="button"
                  onClick={() => setIsWrappedModalOpen(true)}
                  data-testid="topbar-wrapped-btn"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/15 hover:bg-purple-500/25 border border-[#D4AF37]/40 text-[11px] font-bold text-[#F3E5AB] transition-colors cursor-pointer shrink-0"
                  title="Hồ Sơ Tâm Linh Cuối Tháng (Spiritual Wrapped 9:16)"
                >
                  <span>🌙 Wrapped</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTikTokStudioModalOpen(true)}
                  data-testid="topbar-tiktok-btn"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/40 text-[11px] font-bold text-rose-200 transition-colors cursor-pointer shrink-0"
                  title="Xưởng Seeding TikTok & Reels 0đ (3-Slide Carousel Studio)"
                >
                  <span>🎬 TikTok Studio</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFunnelModalOpen(true)}
                  data-testid="topbar-funnel-btn"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] font-semibold text-[#D8D2E7] transition-colors cursor-pointer shrink-0"
                  title="Bảng Kiểm Chứng Giả Định Thị Trường & Chi Phí AI"
                >
                  <span>📊 Funnel</span>
                </button>
              </>
            ) : null}
          </div>
        </header>

        {/* ================= MAIN STAGE ================= */}
        <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5">
          {/* Super-App Mode Switcher Tabs (Compact 2-Column Pill on Mobile & Desktop) */}
          <div className="grid grid-cols-2 gap-1.5 max-w-2xl mx-auto bg-[#12101B] border border-[#D4AF37]/35 rounded-2xl p-1.5 shadow-lg">
            <button
              type="button"
              onClick={() => setActiveMainMode('solo')}
              className={`w-full py-2.5 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMainMode === 'solo'
                  ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-[#09080D] shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                  : 'text-[#A39BB5] hover:text-[#F8F5F0] hover:bg-white/5'
              }`}
            >
              <span className="truncate">🔮 Bốc Bài Cá Nhân</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainMode('couple')}
              className={`w-full py-2.5 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMainMode === 'couple'
                  ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-[#09080D] shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                  : 'text-[#A39BB5] hover:text-[#F8F5F0] hover:bg-white/5'
              }`}
            >
              <span className="truncate">💞 Bói Đôi TarotCouple</span>
            </button>
          </div>

        {/* ================= MODE 2: COUPLE MODE VIEW ================= */}
        {appMode === 'couple' ? (
          <CoupleModeView
            initialRoomCode={inviteRoomCode}
            nickname={nickname}
            birthYear={birthYear}
            selectedReaderId={selectedReaderId}
            onSelectReaderId={(rId) => setSelectedReaderId(rId)}
            deckMode={deckMode}
            onQuotaUpdated={(newQuota) =>
              setQuota((prev) => ({ ...prev, ...newQuota }))
            }
            onOpenStoryModal={(coupleReadingData) => {
              setStoryModalReading(coupleReadingData);
              setActiveQuoteIdx(0);
              setIsStoryModalOpen(true);
            }}
          />
        ) : (
          /* ================= MODE 1: SOLO 3-CARD RITUAL ================= */
          <>
            {/* Step Progress Indicator (Hidden during Crisis Intervention) */}
            {!(step === 4 && crisisResponse) ? (
              <div className="mb-6 flex items-center justify-between max-w-xl mx-auto bg-[#12101B] border border-[#D4AF37]/25 rounded-full p-1.5">
                {(
                  [
                    { num: 1, label: '1. Chọn Reader' },
                    { num: 2, label: '2. Tâm Sự' },
                    { num: 3, label: '3. Rút 3 Lá' },
                    { num: 4, label: '4. Giải Mã' },
                  ] as const
                ).map((item) => {
                  const isActive = step === item.num;
                  const isDone = step > item.num;
                  return (
                    <button
                      key={item.num}
                      type="button"
                      disabled={item.num > step}
                      onClick={() => {
                        if (item.num < step) {
                          setStep(item.num);
                        }
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-full text-[11px] sm:text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#D4AF37] text-[#09080D] shadow-[0_0_16px_rgba(212,175,55,0.4)]'
                          : isDone
                            ? 'text-[#F3E5AB] hover:bg-white/5 cursor-pointer'
                            : 'text-[#A39BB5]/60 cursor-not-allowed'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {/* ================= STEP 1: CHỌN LỀU READER (ALL 4 READERS) ================= */}
            {step === 1 ? (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6 sm:space-y-8"
              >
                {/* Header Title (Page 1 & 2 of Redesign UI) */}
                <div className="space-y-2">
                  <h1 className="font-display text-2xl sm:text-4xl font-bold text-[#F8F5F0] tracking-tight">
                    Chọn người đọc bài cho đêm suy của bạn
                  </h1>
                  <p className="text-xs sm:text-sm text-[#9E96B0] leading-relaxed">
                    Bài được xáo bằng bộ tạo số ngẫu nhiên an toàn và bạn tự tay rút 3 lá. Reader chỉ giải nghĩa những lá đã rút.
                  </p>
                </div>

                {/* 2-Column Desktop Layout (Page 1): 4 Readers on Left (cols 8), Info Cards on Right (cols 4) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: 4 Readers 2x2 Grid */}
                  <div className="lg:col-span-8 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {READERS.map((reader) => {
                        const isSelected = selectedReaderId === reader.id;

                        return (
                          <div
                            key={reader.id}
                            onClick={() => setSelectedReaderId(reader.id as ReaderId)}
                            className={`relative rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer border ${
                              isSelected
                                ? 'bg-[#1D192C] border-[#D9B36A] shadow-[0_8px_30px_rgba(217,179,106,0.15)] ring-1 ring-[#D9B36A]'
                                : 'bg-[#14121F] border-[#262235] hover:border-[#D9B36A]/50'
                            }`}
                          >
                            <div className="space-y-3">
                              {/* Header: Monogram Avatar + Name + Title */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border"
                                    style={{
                                      borderColor: `${reader.accent_color}55`,
                                      backgroundColor: `${reader.accent_color}18`,
                                      color: reader.accent_color,
                                    }}
                                  >
                                    {reader.avatar_symbol}
                                  </div>
                                  <div>
                                    <h2 className="font-display text-base sm:text-lg font-bold text-[#F8F5F0] leading-snug">
                                      {reader.name}
                                    </h2>
                                    <p
                                      className="text-[10px] font-bold tracking-wider uppercase mt-0.5"
                                      style={{ color: reader.accent_color }}
                                    >
                                      {reader.title}
                                    </p>
                                  </div>
                                </div>

                                {isSelected && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#E5C687] shrink-0">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#E5C687]" />
                                    Đang chọn
                                  </span>
                                )}
                              </div>

                              {/* Sample Quote */}
                              <p className="text-xs italic text-[#E5C687]/90 leading-relaxed">
                                “{reader.sample_quote}”
                              </p>

                              {/* Hợp với... */}
                              <p className="text-xs text-[#9E96B0] leading-relaxed pt-1 border-t border-white/5">
                                {reader.tagline}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom Selected Bar (Desktop & Mobile) */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-[#14121F] border border-[#262235] flex items-center justify-between gap-3">
                      <div className="text-xs text-[#9E96B0]">
                        Bạn chọn: <strong className="text-[#F8F5F0] font-semibold">{activeReaderObj.name}</strong>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!questionText) {
                            const defaultSamples = SAMPLE_QUESTIONS_BY_TOPIC[selectedTopic];
                            if (defaultSamples?.[0]) {
                              setQuestionText(defaultSamples[0]);
                            }
                          }
                          setStep(2);
                        }}
                        className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-[#D9B36A] hover:bg-[#E5C687] text-[#0B0A12] font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-[0_4px_16px_rgba(217,179,106,0.3)] active:scale-[0.98]"
                      >
                        <span>Tiếp tục với {activeReaderObj.name}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Right Column (Page 1 Desktop Side Column) */}
                  <div className="lg:col-span-4 space-y-4">
                    {/* Card 1: HÔM NAY - Còn 3 lượt miễn phí */}
                    <div className="rounded-2xl bg-[#14121F] border border-[#262235] p-5 space-y-2">
                      <span className="text-[10px] font-bold tracking-widest text-[#9E96B0] uppercase block">
                        HÔM NAY
                      </span>
                      <p className="font-display text-xl font-bold text-[#F8F5F0]">
                        Còn {quota.remainingToday} lượt miễn phí
                      </p>
                      <p className="text-xs text-[#9E96B0] leading-relaxed">
                        Lượt làm mới lúc 00:00. Điểm danh 7 ngày liên tiếp để nhận một lượt Bói Đôi.
                      </p>
                    </div>

                    {/* Card 2: Bói Đôi Teaser */}
                    <div className="rounded-2xl bg-[#14121F] border border-[#262235] p-5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#D9B36A]">
                        <Users className="w-4 h-4" />
                        <span>Bói Đôi</span>
                      </div>
                      <p className="text-xs text-[#9E96B0] leading-relaxed">
                        Mời người ấy cùng rút một lá. Kết quả hai chiều chỉ mở khi cả hai đã rút, câu hỏi của bạn được giữ kín.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveMainMode('couple')}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#1D192C] hover:bg-[#262238] border border-[#D9B36A]/35 text-xs font-semibold text-[#E5C687] transition-colors cursor-pointer"
                      >
                        Thử Bói Đôi →
                      </button>
                    </div>

                    {/* Disclaimer Mini */}
                    <p className="text-[11px] text-[#9E96B0]/75 leading-relaxed px-1">
                      Tarot là hình thức giải trí và tự phản chiếu, không thay thế tư vấn y tế, pháp lý hay tài chính.
                    </p>
                  </div>
                </div>
              </motion.section>
            ) : null}

            {/* ================= STEP 2: KỂ CHUYỆN, CHỌN CHỦ ĐỀ & CHỌN BỘ BÀI (22 vs 78) ================= */}
            {step === 2 ? (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="space-y-6"
              >
                {/* Header Title (Page 3 & 4 of Redesign UI) */}
                <div className="space-y-1">
                  <h1 className="font-display text-2xl sm:text-4xl font-bold text-[#F8F5F0] tracking-tight">
                    Kể {activeReaderObj.name} nghe đi
                  </h1>
                  <p className="text-xs sm:text-sm text-[#9E96B0]">
                    Càng cụ thể, lá bài càng sát. Kể ngắn thôi, tối đa 300 ký tự.
                  </p>
                </div>

                {/* 2-Column Desktop Layout (Page 3): Form on Left (cols 8), Reader Advice & Suggestions on Right (cols 4) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Form */}
                  <div className="lg:col-span-8 space-y-5 rounded-2xl bg-[#14121F] border border-[#262235] p-5 sm:p-7">
                    {/* 1. Chủ đề */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-[#9E96B0]">
                        Chủ đề
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {agePolicy.allowedTopics.map((topicItem) => {
                          const isSelected = selectedTopic === topicItem.id;
                          return (
                            <button
                              key={topicItem.id}
                              type="button"
                              onClick={() => {
                                setSelectedTopic(topicItem.id);
                                const samples = SAMPLE_QUESTIONS_BY_TOPIC[topicItem.id];
                                if (samples?.[0]) setQuestionText(samples[0]);
                              }}
                              className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#1D192C] text-[#E5C687] border border-[#D9B36A] shadow-sm'
                                  : 'bg-[#0B0A12] text-[#9E96B0] border border-[#262235] hover:text-[#F8F5F0]'
                              }`}
                            >
                              {topicItem.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Biệt danh người ấy & Cung hoàng đạo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="partner-nickname-input"
                          className="block text-xs font-semibold text-[#9E96B0]"
                        >
                          Biệt danh người ấy (tuỳ chọn)
                        </label>
                        <input
                          id="partner-nickname-input"
                          type="text"
                          maxLength={30}
                          value={partnerNickname}
                          onChange={(e) => setPartnerNickname(e.target.value)}
                          placeholder="Ví dụ: Crush, Ex, Bạn ấy..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0A12] border border-[#262235] text-xs sm:text-sm text-[#F8F5F0] placeholder:text-[#9E96B0]/40 focus:outline-none focus:border-[#D9B36A]"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="zodiac-select"
                          className="block text-xs font-semibold text-[#9E96B0]"
                        >
                          Cung hoàng đạo (tuỳ chọn)
                        </label>
                        <select
                          id="zodiac-select"
                          value={zodiacSign}
                          onChange={(e) => setZodiacSign(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0A12] border border-[#262235] text-xs sm:text-sm text-[#F8F5F0] focus:outline-none focus:border-[#D9B36A] cursor-pointer"
                        >
                          <option value="">Chọn cung của bạn</option>
                          {ZODIAC_SIGNS.map((z) => (
                            <option key={z} value={z}>
                              {z}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 3. Ô chuyện mất ngủ (300 ký tự) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="question-textarea"
                          className="block text-xs font-semibold text-[#9E96B0]"
                        >
                          Chuyện gì đang làm bạn mất ngủ?
                        </label>
                        <span className="text-[11px] font-mono text-[#9E96B0]">
                          {questionText.length}/300
                        </span>
                      </div>
                      <textarea
                        id="question-textarea"
                        rows={4}
                        maxLength={300}
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="Ví dụ: Em với bạn này nhắn tin 2 tháng rồi mà chưa thấy tỏ tình..."
                        className="w-full p-3.5 rounded-xl bg-[#0B0A12] border border-[#262235] text-xs sm:text-sm text-[#F8F5F0] placeholder:text-[#9E96B0]/40 focus:outline-none focus:border-[#D9B36A] leading-relaxed resize-none"
                      />
                    </div>

                    {/* 4. Checkbox Ẩn câu hỏi trên ảnh chia sẻ */}
                    <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
                      <input
                        type="checkbox"
                        checked={hideQuestionOnShare}
                        onChange={(e) => setHideQuestionOnShare(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-[#262235] bg-[#0B0A12] text-[#D9B36A] accent-[#D9B36A] cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-medium text-[#F8F5F0]">
                          Ẩn câu hỏi trên ảnh chia sẻ
                        </p>
                        <p className="text-[11px] text-[#9E96B0] mt-0.5">
                          Ảnh chỉ hiện lá bài, câu quote và chỉ số. Người khác không thấy bạn hỏi gì.
                        </p>
                      </div>
                    </label>

                    {formError ? (
                      <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-400/40 text-xs text-rose-200">
                        {formError}
                      </div>
                    ) : null}

                    {/* Bottom Action Buttons (Page 3 & 4) */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#262235]">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="py-2.5 px-4 rounded-xl text-xs font-medium text-[#9E96B0] hover:text-[#F8F5F0] transition-colors cursor-pointer"
                      >
                        Quay lại
                      </button>

                      <button
                        type="button"
                        onClick={handleProceedToStep3}
                        className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-[#D9B36A] hover:bg-[#E5C687] text-[#0B0A12] font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-[0_4px_16px_rgba(217,179,106,0.3)] active:scale-[0.98]"
                      >
                        <span>Xào bài →</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column (Page 3 Desktop Side Column) */}
                  <div className="lg:col-span-4 space-y-4">
                    {/* Reader Mini Card */}
                    <div className="rounded-2xl bg-[#14121F] border border-[#262235] p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{
                              backgroundColor: `${activeReaderObj.accent_color}22`,
                              color: activeReaderObj.accent_color,
                            }}
                          >
                            {activeReaderObj.avatar_symbol}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#F8F5F0]">
                              {activeReaderObj.name}
                            </p>
                            <span className="text-[10px] text-[#9E96B0]">
                              {activeReaderObj.title}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-xs text-[#E5C687] hover:underline cursor-pointer"
                        >
                          Đổi Reader
                        </button>
                      </div>

                      <p className="text-xs italic text-[#E5C687]/90 leading-relaxed pt-2 border-t border-white/5">
                        “Kể đi, tui nghe. Đừng kể dài quá, bà già rồi.”
                      </p>
                    </div>

                    {/* Gợi ý câu hỏi */}
                    <div className="rounded-2xl bg-[#14121F] border border-[#262235] p-5 space-y-2.5">
                      <span className="text-[10px] font-bold tracking-wider text-[#9E96B0] uppercase block">
                        GỢI Ý CÂU HỎI
                      </span>
                      <div className="space-y-1.5">
                        {(SAMPLE_QUESTIONS_BY_TOPIC[selectedTopic] || []).map((sample, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setQuestionText(sample)}
                            className="w-full text-left p-2.5 rounded-xl bg-[#0B0A12] hover:bg-[#1D192C] border border-[#262235] text-xs text-[#E2E8F0] leading-snug transition-colors cursor-pointer"
                          >
                            {sample}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Privacy Note & Support Line */}
                    <div className="p-4 rounded-2xl bg-[#14121F]/80 border border-[#262235] text-[11px] text-[#9E96B0] space-y-1.5 leading-relaxed">
                      <p>
                        🔒 Câu hỏi chỉ dùng để giải bài và xoá được trong Cài đặt.
                      </p>
                      <p>
                        Đang rất tệ?{' '}
                        <button
                          type="button"
                          onClick={() => setIsLegalModalOpen(true)}
                          className="text-[#E5C687] underline cursor-pointer"
                        >
                          Xem đường dây hỗ trợ.
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              </motion.section>
            ) : null}

            {/* ================= STEP 3: NGHI THỨC XÀO BÀI & RÚT 3 LÁ ================= */}
            {step === 3 ? (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-6"
              >
                {/* Header (Page 5 & 6 of Redesign UI) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h1 className="font-display text-2xl sm:text-4xl font-bold text-[#F8F5F0] tracking-tight">
                      Chọn lá bài đang gọi bạn
                    </h1>
                    <p className="text-xs sm:text-sm text-[#9E96B0]">
                      {shuffleStage === 'charge'
                        ? `Giữ nút để xáo và nạp năng lượng vào bộ bài (${totalDeckCards} lá).`
                        : `Bộ bài đã được xáo. Chạm vào lá bạn thấy bị thu hút. Còn ${3 - selectedFanIndices.length} lá.`}
                    </p>
                  </div>

                  {/* Reader Speech Bubble */}
                  <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#14121F] border border-[#262235] text-xs text-[#E5C687] self-start sm:self-auto shrink-0">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{
                        backgroundColor: `${activeReaderObj.accent_color}25`,
                        color: activeReaderObj.accent_color,
                      }}
                    >
                      {activeReaderObj.avatar_symbol}
                    </span>
                    <span className="italic">“Chọn lẹ đi, đêm dài lắm.”</span>
                  </div>
                </div>

                {/* Sub-stage 3A: Quick Charge Orb */}
                {shuffleStage === 'charge' ? (
                  <div className="rounded-2xl bg-[#14121F] border border-[#262235] p-8 sm:p-14 text-center space-y-6">
                    <div className="space-y-2 max-w-md mx-auto">
                      <p className="text-xs text-[#9E96B0]">
                        Nhẩm lại câu hỏi của bạn: <em className="text-[#E5C687]">“{questionText}”</em>
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <button
                        type="button"
                        onMouseDown={startEnergyCharge}
                        onTouchStart={startEnergyCharge}
                        onClick={startEnergyCharge}
                        className="py-3 px-8 rounded-xl bg-[#D9B36A] hover:bg-[#E5C687] text-[#0B0A12] font-semibold text-xs sm:text-sm shadow-[0_4px_20px_rgba(217,179,106,0.3)] transition-all cursor-pointer active:scale-[0.98]"
                      >
                        {isCharging
                          ? `Đang xáo bài... ${chargeProgress}%`
                          : 'Giữ để truyền năng lượng & Xào bài'}
                      </button>

                      <div className="w-56 h-1.5 rounded-full bg-[#0B0A12] border border-[#262235] overflow-hidden">
                        <div
                          className="h-full bg-[#D9B36A] transition-all duration-100"
                          style={{ width: `${chargeProgress}%` }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (chargeIntervalRef.current) clearInterval(chargeIntervalRef.current);
                          setChargeProgress(100);
                          setIsCharging(false);
                          setShuffleStage('fan');
                        }}
                        className="text-xs text-[#9E96B0] hover:text-[#E5C687] underline cursor-pointer"
                      >
                        Trải {totalDeckCards} lá bài ra bàn ngay →
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Sub-stage 3B: Arc Fan & 3 Position Slots */
                  <div className="rounded-2xl bg-[#14121F] border border-[#262235] p-5 sm:p-8 space-y-6">
                    {/* Interactive Arc Fan Cards */}
                    <div className="pt-2 pb-6 flex items-center justify-center overflow-x-auto no-scrollbar">
                      <div className="relative h-44 sm:h-52 w-full max-w-xl flex items-center justify-center">
                        {Array.from({ length: Math.min(totalDeckCards, 22) }, (_, fanIdx) => {
                          const pickOrder = selectedFanIndices.indexOf(fanIdx);
                          const isPicked = pickOrder !== -1;
                          const totalVisual = Math.min(totalDeckCards, 22);
                          const angle = ((fanIdx - (totalVisual - 1) / 2) / (totalVisual / 2)) * 32;
                          const offsetX = (fanIdx - (totalVisual - 1) / 2) * 18;
                          const offsetY = Math.abs(fanIdx - (totalVisual - 1) / 2) * 2.2;

                          return (
                            <motion.button
                              key={fanIdx}
                              type="button"
                              disabled={isPicked || selectedFanIndices.length >= 3}
                              onClick={() => handlePickFanCard(fanIdx)}
                              whileHover={{ y: -14, scale: 1.08 }}
                              style={{
                                transform: isPicked
                                  ? `translateY(-30px) scale(0.9)`
                                  : `translateX(${offsetX}px) translateY(${offsetY}px) rotate(${angle}deg)`,
                                zIndex: isPicked ? 30 : fanIdx,
                              }}
                              className={`absolute w-14 h-24 sm:w-16 sm:h-28 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-between p-1.5 shadow-lg ${
                                isPicked
                                  ? 'bg-[#1D192C] border-[#D9B36A] ring-2 ring-[#D9B36A]'
                                  : 'bg-gradient-to-b from-[#1C182B] to-[#0F0D17] border-[#D9B36A]/40 hover:border-[#E5C687]'
                              }`}
                            >
                              <span className="text-[8px] text-[#D9B36A]/70 font-mono">
                                #{fanIdx + 1}
                              </span>
                              <div className="w-5 h-5 rounded-full border border-[#D9B36A]/30 flex items-center justify-center text-[10px] text-[#E5C687]">
                                {isPicked ? `0${pickOrder + 1}` : '✦'}
                              </div>
                              <span className="text-[7px] text-[#9E96B0] uppercase">
                                {isPicked ? `Đã chọn` : 'Rút lá'}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3 Position Slots (Page 5 & 6) */}
                    <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2 border-t border-[#262235]">
                      {[0, 1, 2].map((slotIdx) => {
                        const pickedFanIdx = selectedFanIndices[slotIdx];
                        const isFilled = pickedFanIdx !== undefined;

                        return (
                          <div
                            key={slotIdx}
                            className={`p-3 sm:p-4 rounded-xl border text-center transition-all ${
                              isFilled
                                ? 'bg-[#1D192C] border-[#D9B36A]'
                                : 'bg-[#0B0A12] border-dashed border-[#262235]'
                            }`}
                          >
                            <span className="text-[10px] font-semibold text-[#D9B36A] block">
                              {slotIdx + 1}
                            </span>
                            <p className="font-display text-xs sm:text-sm font-bold text-[#F8F5F0] truncate mt-0.5">
                              {currentSpreadPositions[slotIdx]}
                            </p>
                            <span className="mt-1 inline-block text-[11px] text-[#9E96B0]">
                              {isFilled ? `✓ Đã rút` : 'Chờ rút...'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {formError ? (
                      <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-400/40 text-xs text-rose-200">
                        {formError}
                      </div>
                    ) : null}

                    {/* Bottom Action Controls (Page 5 & 6) */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#262235]">
                      <div className="text-xs text-[#9E96B0]">
                        Đã rút <strong className="text-[#F8F5F0] font-semibold">{selectedFanIndices.length}/3</strong> lá
                      </div>

                      <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        {selectedFanIndices.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedFanIndices([])}
                            className="py-2.5 px-4 rounded-xl border border-[#262235] text-xs font-medium text-[#9E96B0] hover:text-[#F8F5F0] cursor-pointer"
                          >
                            Chọn lại
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={selectedFanIndices.length < 3 || isSubmitting}
                          onClick={() => {
                            if (selectedFanIndices.length === 3) {
                              void handlePickFanCard(selectedFanIndices[2]!);
                            }
                          }}
                          className={`flex-1 sm:flex-initial py-2.5 px-6 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                            selectedFanIndices.length === 3 && !isSubmitting
                              ? 'bg-[#D9B36A] hover:bg-[#E5C687] text-[#0B0A12] cursor-pointer shadow-[0_4px_16px_rgba(217,179,106,0.3)] active:scale-[0.98]'
                              : 'bg-[#1D192C] text-[#9E96B0]/50 border border-[#262235] cursor-not-allowed'
                          }`}
                        >
                          {isSubmitting ? 'Đang giải mã...' : 'Giải mã 3 lá →'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.section>
            ) : null}

            {/* ================= STEP 4A: CRISIS INTERVENTION SCREEN ================= */}
            {step === 4 && crisisResponse ? (
              <CrisisSupportView
                crisisSupport={crisisResponse.crisisSupport}
                onReturnHome={handleResetRitual}
              />
            ) : null}

            {/* ================= STEP 4B: GIẢI MÃ TRẢI BÀI, LÁ LÀM RÕ THỨ 4 & STORY 9:16 ================= */}
            {step === 4 && readingSuccess ? (
              <motion.section
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="space-y-6"
              >
                {/* 2-Column Layout (Page 7 Desktop & Page 8 Mobile) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column (cols 8): 3 Cards Analysis + CHỐT HẠ */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* Reader Meta Hook */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                          style={{
                            backgroundColor: `${activeReaderObj.accent_color}25`,
                            color: activeReaderObj.accent_color,
                          }}
                        >
                          {activeReaderObj.avatar_symbol}
                        </span>
                        <span className="text-xs text-[#9E96B0]">
                          {readingSuccess.readerDisplayName} đọc cho {readingSuccess.nickname} · {readingSuccess.topicLabel}
                        </span>
                      </div>

                      <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5F0] italic leading-snug">
                        “{readingSuccess.result.greeting_hook}”
                      </h1>
                    </div>

                    {/* 3 Drawn Cards (Vertical List matching Page 7 & 8) */}
                    <div className="space-y-4">
                      {readingSuccess.drawnCards.map((drawnSlot, idx) => {
                        const analysis =
                          readingSuccess.result.cards_analysis[idx] ??
                          readingSuccess.result.cards_analysis[0]!;

                        return (
                          <div
                            key={drawnSlot.position_index}
                            className="rounded-2xl bg-[#14121F] border border-[#262235] p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4 transition-all"
                          >
                            {/* Card Visual / Thumbnail */}
                            <div className="w-24 sm:w-28 shrink-0 flex flex-col items-center mx-auto sm:mx-0">
                              <TarotCardVisual
                                card={drawnSlot.card}
                                reversed={drawnSlot.reversed}
                                isFlipped={true}
                                positionIndex={idx}
                                positionLabel={drawnSlot.position_label}
                                size="sm"
                              />
                            </div>

                            {/* Card Content & Meaning */}
                            <div className="flex-1 space-y-2">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-[#9E96B0] block">
                                {idx + 1} · {drawnSlot.position_label.toUpperCase()}
                              </span>

                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-display text-base sm:text-lg font-bold text-[#F8F5F0]">
                                  {drawnSlot.card.name_en}
                                </h3>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    drawnSlot.reversed
                                      ? 'bg-[#E5624A]/15 text-[#E5624A] border border-[#E5624A]/40'
                                      : 'bg-[#D9B36A]/15 text-[#E5C687] border border-[#D9B36A]/35'
                                  }`}
                                >
                                  {drawnSlot.reversed ? 'Ngược' : 'Xuôi'}
                                </span>
                              </div>

                              <p className="text-xs sm:text-sm text-[#E2E8F0] leading-relaxed">
                                {analysis.interpretation}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Khối CHỐT HẠ (Page 7 & 8) */}
                    <div className="rounded-2xl bg-[#14121F] border border-[#D9B36A]/40 p-5 space-y-2">
                      <span className="text-[10px] font-bold tracking-widest text-[#D9B36A] uppercase block">
                        CHỐT HẠ
                      </span>
                      <p className="text-xs sm:text-sm text-[#F8F5F0] leading-relaxed">
                        {readingSuccess.result.overall_verdict}
                      </p>
                      {readingSuccess.result.actionable_next_step && (
                        <p className="text-xs text-[#9E96B0] leading-relaxed pt-1.5 border-t border-white/5">
                          👉 {readingSuccess.result.actionable_next_step}
                        </p>
                      )}
                    </div>

                    {/* Disclaimer Mini */}
                    <p className="text-[11px] text-[#9E96B0]/75 leading-relaxed">
                      Tarot là hình thức giải trí và tự phản chiếu, không dự đoán chắc chắn và không thay thế tư vấn chuyên môn.
                    </p>
                  </div>

                  {/* Right Column (cols 4): ẢNH STORY 9:16 PREVIEW & MUỐN HỎI SÂU HƠN */}
                  <div className="lg:col-span-4 space-y-5">
                    {/* 1. ẢNH STORY 9:16 Preview Card */}
                    <div className="rounded-2xl bg-[#14121F] border border-[#262235] p-5 space-y-4">
                      <span className="text-[10px] font-bold tracking-widest text-[#9E96B0] uppercase block">
                        ẢNH STORY 9:16
                      </span>

                      {/* Mini Poster Preview */}
                      <div className="relative aspect-[9/16] max-w-[210px] mx-auto rounded-xl bg-[#0B0A12] border border-[#D9B36A]/40 p-3.5 flex flex-col justify-between text-center overflow-hidden shadow-lg">
                        <div className="space-y-1">
                          <p className="text-[7px] text-[#9E96B0] uppercase tracking-wider">
                            VŨ TRỤ GỬI ĐẾN @{readingSuccess.nickname.toUpperCase()}
                          </p>
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase"
                            style={{
                              backgroundColor: `${activeReaderObj.accent_color}25`,
                              color: activeReaderObj.accent_color,
                            }}
                          >
                            {activeReaderObj.name}
                          </span>
                        </div>

                        {/* 3 Cards Mini Representation */}
                        <div className="flex items-center justify-center gap-1 my-2">
                          {readingSuccess.drawnCards.map((c, i) => (
                            <div
                              key={i}
                              className="w-7 h-11 rounded border border-[#D9B36A]/40 bg-[#14121F] flex items-center justify-center text-[7px] font-mono text-[#D9B36A]"
                            >
                              {c.card.roman}
                            </div>
                          ))}
                        </div>

                        <p className="font-display text-[10px] font-bold italic text-[#F8F5F0] leading-snug">
                          “
                          {readingSuccess.result.shareable_card.savage_quotes[activeQuoteIdx] ||
                            readingSuccess.result.shareable_card.savage_quote}
                          ”
                        </p>

                        <div className="text-[7px] text-[#9E96B0] pt-1 border-t border-white/5">
                          tarotcouple.vn
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setStoryModalReading(readingSuccess);
                          setIsStoryModalOpen(true);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#D9B36A] hover:bg-[#E5C687] text-[#0B0A12] font-semibold text-xs transition-all cursor-pointer shadow-[0_4px_16px_rgba(217,179,106,0.3)] active:scale-[0.98]"
                      >
                        Tuỳ chỉnh và chia sẻ
                      </button>
                    </div>

                    {/* 2. MUỐN HỎI SÂU HƠN? (Clarifier Card Upsell) */}
                    <div className="rounded-2xl bg-[#14121F] border border-[#262235] p-5 space-y-3.5">
                      <span className="text-[10px] font-bold tracking-widest text-[#9E96B0] uppercase block">
                        MUỐN HỎI SÂU HƠN?
                      </span>

                      <p className="text-xs sm:text-sm font-semibold text-[#F8F5F0]">
                        Rút thêm 1 lá làm rõ cho lá số 2
                      </p>

                      <p className="text-xs text-[#9E96B0] leading-relaxed">
                        Lá làm rõ giúp xem người ấy đang nghĩ gì sau cùng. Bạn chọn một cách mở khoá.
                      </p>

                      <div className="space-y-2 pt-1">
                        <button
                          type="button"
                          disabled={isDrawingClarifier}
                          onClick={() => void handleDrawClarifierCard()}
                          className="w-full py-2.5 px-4 rounded-xl bg-[#E5C687] hover:bg-[#D9B36A] text-[#0B0A12] font-semibold text-xs transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                        >
                          {isDrawingClarifier ? 'Đang mở khoá...' : 'Mở khoá bằng 5 Sao'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsRewardModalOpen(true)}
                          className="w-full py-2.5 px-4 rounded-xl bg-[#1D192C] hover:bg-[#262238] border border-[#262235] text-xs font-semibold text-[#E2E8F0] transition-colors cursor-pointer"
                        >
                          Xem quảng cáo 30 giây
                        </button>
                      </div>

                      <p className="text-[11px] text-[#9E96B0] text-center pt-1">
                        Bạn đang có {quota.starsBalance ?? 15} Sao.
                      </p>
                    </div>

                    {/* 3. Bốc lượt mới Button */}
                    <button
                      type="button"
                      onClick={handleResetRitual}
                      className="w-full py-2.5 px-4 rounded-xl border border-[#262235] hover:bg-[#14121F] text-xs font-medium text-[#9E96B0] hover:text-[#F8F5F0] transition-colors cursor-pointer"
                    >
                      Bốc lượt mới
                    </button>
                  </div>
                </div>
              </motion.section>
            ) : null}
          </>
        )}
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="relative z-10 border-t border-white/10 bg-[#09080D]/90 py-5 px-4 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#A39BB5]">
          <p>
            Tarot là hình thức giải trí và tự phản chiếu, không thay thế tư vấn chuyên môn.
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsLegalModalOpen(true)}
              className="hover:text-[#F3E5AB] underline cursor-pointer"
            >
              Điều khoản & Quyền riêng tư (Nghị định 13/2023/NĐ-CP)
            </button>
          </div>
        </div>
      </footer>

      {/* ================= MOBILE THUMB-ZONE BOTTOM NAVIGATION ================= */}
      <MobileBottomNav
        activeTab={activeMainMode}
        onSelectTab={(tab) => setActiveMainMode(tab)}
        starsBalance={quota.starsBalance ?? 15}
        streakDays={quota.streakDays ?? 1}
        remainingToday={quota.remainingToday}
        onOpenDailyStreak={() => setIsDailyStreakModalOpen(true)}
        onOpenWallet={() => setIsWalletModalOpen(true)}
        onOpenWrapped={() => setIsWrappedModalOpen(true)}
        onOpenTikTokStudio={() => setIsTikTokStudioModalOpen(true)}
        onOpenReferral={() => setIsReferralModalOpen(true)}
        onOpenFunnel={() => setIsFunnelModalOpen(true)}
        onOpenLegal={() => setIsLegalModalOpen(true)}
        isPhoneSimulator={isPhoneSimulator}
        onTogglePhoneSimulator={() => setIsPhoneSimulator((prev) => !prev)}
      />

      {/* ================= MODALS ================= */}
      {storyModalReading ? (
        <StoryCardModal
          isOpen={isStoryModalOpen}
          onClose={() => setIsStoryModalOpen(false)}
          readingData={storyModalReading}
          initialQuoteIndex={activeQuoteIdx}
          onQuotaUpdated={(newQuota) =>
            setQuota((prev) => ({ ...prev, ...newQuota }))
          }
        />
      ) : null}

      <DailyStreakModal
        isOpen={isDailyStreakModalOpen}
        onClose={() => setIsDailyStreakModalOpen(false)}
        nickname={nickname}
        birthYear={birthYear}
        readerId={selectedReaderId}
        quota={quota}
        onQuotaUpdated={(newQuota) =>
          setQuota((prev) => ({ ...prev, ...newQuota }))
        }
      />

      <WalletPayOSModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        birthYear={birthYear}
        onBirthYearChange={(yr) => setBirthYear(yr)}
        quota={quota}
        onQuotaUpdated={(newQuota) =>
          setQuota((prev) => ({ ...prev, ...newQuota }))
        }
        onOpenDailyModal={() => setIsDailyStreakModalOpen(true)}
      />

      <FunnelAnalyticsModal
        isOpen={isFunnelModalOpen}
        onClose={() => setIsFunnelModalOpen(false)}
      />

      <SpiritualWrappedModal
        isOpen={isWrappedModalOpen}
        onClose={() => setIsWrappedModalOpen(false)}
        nickname={nickname}
        readerId={selectedReaderId}
        onQuotaUpdated={(newQuota) =>
          setQuota((prev) => ({ ...prev, ...newQuota }))
        }
      />

      <TikTokStudioModal
        isOpen={isTikTokStudioModalOpen}
        onClose={() => setIsTikTokStudioModalOpen(false)}
        currentReading={readingSuccess}
      />

      <ReferralAndAdModal
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
        nickname={nickname}
        initialReferralCode={referralCodeParam}
        quota={quota}
        onQuotaUpdated={(newQuota) =>
          setQuota((prev) => ({ ...prev, ...newQuota }))
        }
      />

      <LegalPrivacyModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        onClearHistory={() => {
          try {
            localStorage.removeItem('tc_nickname');
            localStorage.removeItem('tc_birth_year');
          } catch {}
          setQuestionText('');
          setReadingSuccess(null);
          setClarifierCard(null);
        }}
        onResetSession={() => {
          try {
            localStorage.clear();
          } catch {}
          setNickname('Mèo Đêm');
          setBirthYear(2004);
          setSelectedReaderId('ba_co_mo_hon');
          setSelectedTopic('love');
          void claimBonusTurn('reset_demo_quota');
          handleResetRitual();
        }}
      />

      {/* Rewarded Ad / Share Bonus Modal (+1 Free Turn) */}
      <AnimatePresence>
        {isRewardModalOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-[#12101B] border border-[#D4AF37]/45 p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#F3E5AB] font-bold text-sm">
                  <Gift className="w-4 h-4 text-[#D4AF37]" />
                  <span>Nhận Thêm Lượt Bốc Bài Miễn Phí</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRewardModalOpen(false)}
                  className="text-xs text-[#A39BB5] hover:text-[#F8F5F0] cursor-pointer"
                >
                  Đóng ✕
                </button>
              </div>

              <p className="text-xs sm:text-sm text-[#A39BB5] leading-relaxed">
                Bạn hiện có{' '}
                <strong className="text-[#F8F5F0]">
                  {quota.remainingToday} lượt
                </strong>{' '}
                miễn phí hôm nay. Bạn có thể nhận thêm +1 lượt hoàn toàn miễn phí bằng một trong hai cách:
              </p>

              {bonusBanner ? (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-400/40 text-xs text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{bonusBanner}</span>
                </div>
              ) : null}

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => void claimBonusTurn('share_bonus')}
                  className="w-full p-4 rounded-2xl bg-[#171424] hover:bg-[#231E36] border border-[#D4AF37]/40 text-left flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-bold text-[#F3E5AB]">
                      1. Chia sẻ ảnh Story 9:16 hoặc mời bạn bè
                    </p>
                    <p className="text-xs text-[#A39BB5] mt-0.5">
                      Nhận ngay +1 lượt trải bài miễn phí (0đ)
                    </p>
                  </div>
                  <Share2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                </button>

                <button
                  type="button"
                  disabled={adCountdown !== null}
                  onClick={handleWatchSimulatedRewardedAd}
                  className="w-full p-4 rounded-2xl bg-[#171424] hover:bg-[#231E36] border border-emerald-400/35 text-left flex items-center justify-between transition-colors cursor-pointer disabled:opacity-60"
                >
                  <div>
                    <p className="text-sm font-bold text-emerald-300">
                      {adCountdown !== null
                        ? `Đang phát thông điệp tài trợ... (${adCountdown}s)`
                        : '2. Xem Quảng Cáo Nhận Thưởng (Mô phỏng 5s)'}
                    </p>
                    <p className="text-xs text-[#A39BB5] mt-0.5">
                      Quảng cáo nhận thưởng miễn phí — Mạng quảng cáo trả tiền cho App
                    </p>
                  </div>
                  <Play className="w-4 h-4 text-emerald-300 shrink-0" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      </div>
    </div>
  );
}
