'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Users,
  Lock,
  Sparkles,
  Copy,
  CheckCircle2,
  Share2,
  AlertTriangle,
  RotateCcw,
  Eye,
  Compass,
  Link2,
  QrCode,
  Smartphone,
  RefreshCw,
  Loader2,
  Receipt,
  MessageCircleHeart,
  Gift,
  Clock,
  HandHeart,
  Flame,
  ArrowRight,
  ShieldCheck,
  Check,
  Calendar,
  Volume2,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { AIVoiceReaderBar } from '@/components/AIVoiceReaderBar';

const CoupleDatingReceiptModal = dynamic(
  () => import('@/components/CoupleDatingReceiptModal').then((m) => m.CoupleDatingReceiptModal),
  { ssr: false }
);
const OutOfQuotaDrawSheet = dynamic(
  () => import('@/components/reading/OutOfQuotaDrawSheet'),
  { ssr: false }
);
const WalletPayOSModal = dynamic(
  () => import('@/components/WalletPayOSModal').then((m) => m.WalletPayOSModal),
  { ssr: false }
);
const CoupleResonanceBridge3D = dynamic(
  () => import('@/components/CoupleResonanceBridge3D').then((m) => m.CoupleResonanceBridge3D),
  { ssr: false }
);

import {
  ALL_TAROT_CARDS,
  MAJOR_ARCANA,
  READERS,
  TAROT_CARDS_BY_ID,
} from '@/data/tarot-cards';
import { getCardProse } from '@/data/tarot-card-prose';
import { soundManager } from '@/lib/sound-effects';
import { getDeviceFingerprintHeaders } from '@/lib/device-fingerprint';
import { useQuotaSync } from '@/lib/use-quota';
import {
  classifyAgeTier,
  COUPLE_SPREAD_POSITIONS,
  RELATIONSHIP_STATUS_LABELS,
} from '@/lib/safety';
import {
  CURRENT_REFERENCE_YEAR,
  type CoupleRelationshipStatus,
  type DeckMode,
  type ReaderId,
} from '@/lib/schemas';
import type {
  CoupleRoomPublicView,
  DrawnCardClientPayload,
  QuotaStatusPayload,
  ReadingCrisisResponse,
  ReadingSuccessResponse,
} from '@/lib/api-types';
import { TarotCardVisual } from '@/components/TarotCardVisual';
import { CrisisSupportView } from '@/components/CrisisSupportView';
import { triggerHaptic } from '@/lib/haptics';
import {
  generateCoupleInterpretationBundle,
  type CoupleInterpretationBundle,
} from '@/lib/couple-interpretation';

export interface CoupleModeViewProps {
  initialRoomCode?: string | null;
  nickname: string;
  birthYear: number;
  selectedReaderId: ReaderId;
  onSelectReaderId: (readerId: ReaderId) => void;
  deckMode: DeckMode;
  onQuotaUpdated?: (newQuota: QuotaStatusPayload) => void;
  onOpenStoryModal: (reading: ReadingSuccessResponse) => void;
}

const RELATIONSHIP_OPTIONS: Array<{
  id: CoupleRelationshipStatus;
  label: string;
  desc: string;
  icon: string;
}> = [
  {
    id: 'crush',
    label: 'Crush Đơn Phương',
    desc: 'Đang để ý từ xa hoặc mới bắt đầu thả tín hiệu',
    icon: '👀',
  },
  {
    id: 'situationship',
    label: 'Đang Mập Mờ',
    desc: 'Trên tình bạn, dưới tình yêu, chưa dám đặt tên',
    icon: '🌊',
  },
  {
    id: 'dating',
    label: 'Đang Yêu Nhau',
    desc: 'Đã chính thức hẹn hò, muốn soi độ bền & hướng đi',
    icon: '💖',
  },
  {
    id: 'ex',
    label: 'Người Yêu Cũ',
    desc: 'Còn vương vấn, muốn biết có thể quay lại hay dứt khoát',
    icon: '🥀',
  },
];

function buildFallbackCoupleReading(params: {
  ownerNickname: string;
  partnerNickname: string;
  birthYear: number;
  readerId: ReaderId;
  relationshipStatus: CoupleRelationshipStatus;
  questionText: string;
  deckMode: DeckMode;
  ownerCardObj?: { cardId: number; reversed: boolean };
  partnerCardObj?: { cardId: number; reversed: boolean };
}): ReadingSuccessResponse {
  const reader = READERS.find((r) => r.id === params.readerId) ?? READERS[0]!;
  const agePolicy = classifyAgeTier(params.birthYear, undefined, params.readerId);

  const c1 = params.ownerCardObj
    ? TAROT_CARDS_BY_ID[params.ownerCardObj.cardId] ?? MAJOR_ARCANA[6]!
    : MAJOR_ARCANA[6]!;
  const rev1 = params.ownerCardObj ? params.ownerCardObj.reversed : false;

  const c2 = params.partnerCardObj
    ? TAROT_CARDS_BY_ID[params.partnerCardObj.cardId] ?? MAJOR_ARCANA[19]!
    : MAJOR_ARCANA[19]!;
  const rev2 = params.partnerCardObj ? params.partnerCardObj.reversed : false;

  const c3 = MAJOR_ARCANA[17]!;
  const rev3 = false;

  const p1 = getCardProse(c1.id);
  const p2 = getCardProse(c2.id);
  const p3 = getCardProse(c3.id);

  let compatScore = 84;
  let redFlagLevel = 22;
  let vibeTag = 'Tần Số Đồng Điệu 🔥';

  if (params.relationshipStatus === 'crush') {
    compatScore = 78;
    redFlagLevel = 28;
    vibeTag = 'Tín Hiệu Đèn Xanh 💫';
  } else if (params.relationshipStatus === 'situationship') {
    compatScore = 82;
    redFlagLevel = 36;
    vibeTag = 'Chemistry Cao • Cần Rõ Ràng ⚡';
  } else if (params.relationshipStatus === 'ex') {
    compatScore = 65;
    redFlagLevel = 48;
    vibeTag = 'Duyên Cũ Còn Vương 🥀';
  }

  const drawnCards: [
    DrawnCardClientPayload,
    DrawnCardClientPayload,
    DrawnCardClientPayload,
  ] = [
    {
      position_index: 0,
      position_label: `Năng lượng của ${params.ownerNickname}`,
      fan_index: 0,
      reversed: rev1,
      card: c1,
    },
    {
      position_index: 1,
      position_label: `Năng lượng của ${params.partnerNickname}`,
      fan_index: 1,
      reversed: rev2,
      card: c2,
    },
    {
      position_index: 2,
      position_label: COUPLE_SPREAD_POSITIONS[2],
      fan_index: 2,
      reversed: rev3,
      card: c3,
    },
  ];

  const primaryQuote =
    (rev2 ? p2?.savage_hook_rev : p3?.savage_hook_up) ||
    'Hãy lắng nghe trực giác và đối thoại chân thành.';

  return {
    status: 'ok',
    readingId: `cp_${Date.now()}`,
    createdAt: new Date().toISOString(),
    nickname: `${params.ownerNickname} & ${params.partnerNickname}`,
    birthYear: params.birthYear,
    age: agePolicy.age,
    ageTier: agePolicy.tier,
    isKidTeenSafeMode: agePolicy.isKidTeenSafeMode,
    paymentEnabled: agePolicy.paymentEnabled,
    readerId: params.readerId,
    effectivePersona: agePolicy.effectivePersona,
    readerDisplayName: reader.name,
    readerBadge: reader.badge,
    topic: 'love',
    topicLabel: `Bói Đôi • ${RELATIONSHIP_STATUS_LABELS[params.relationshipStatus]}`,
    questionText: params.questionText,
    deckMode: params.deckMode,
    safetyFlag: 'none',
    isPromptInjection: false,
    drawnCards,
    result: {
      greeting_hook: `${reader.name} đã soi chiếu sợi dây liên kết giữa ${params.ownerNickname} và ${params.partnerNickname} trong trạng thái "${RELATIONSHIP_STATUS_LABELS[params.relationshipStatus]}".`,
      cards_analysis: [
        {
          position_index: 0,
          position_label: drawnCards[0].position_label,
          card_id: c1.id,
          card_name_vi: c1.name_vi,
          card_name_en: c1.name_en,
          reversed: rev1,
          interpretation: (rev1 ? p1?.core_meaning_rev : p1?.core_meaning_up) || '',
          energy_keyword: (rev1 ? c1.keywords_rev[0] : c1.keywords_up[0]) || 'Chân thành',
        },
        {
          position_index: 1,
          position_label: drawnCards[1].position_label,
          card_id: c2.id,
          card_name_vi: c2.name_vi,
          card_name_en: c2.name_en,
          reversed: rev2,
          interpretation: (rev2 ? p2?.core_meaning_rev : p2?.core_meaning_up) || '',
          energy_keyword: (rev2 ? c2.keywords_rev[0] : c2.keywords_up[0]) || 'Ngập ngừng',
        },
        {
          position_index: 2,
          position_label: drawnCards[2].position_label,
          card_id: c3.id,
          card_name_vi: c3.name_vi,
          card_name_en: c3.name_en,
          reversed: rev3,
          interpretation: (rev3 ? p3?.core_meaning_rev : p3?.core_meaning_up) || '',
          energy_keyword: (rev3 ? c3.keywords_rev[0] : c3.keywords_up[0]) || 'Chuyển giao',
        },
      ],
      overall_verdict: `Giữa ${params.ownerNickname} (${c1.name_vi}) và ${params.partnerNickname} (${c2.name_vi}) đang tồn tại sức hút rất rõ qua lá kết nối ${c3.name_vi}. Thay vì đoán mò qua từng dòng tin nhắn, cả hai cần một cuộc trò chuyện thẳng thắn để xác lập ranh giới và kỳ vọng rõ ràng.`,
      actionable_next_step:
        'Chủ động mở lời bằng một cuộc hẹn nhẹ nhàng trong tuần này và quan sát hành động thực tế thay vì lời hứa suông.',
      shareable_card: {
        headline_badge: `${vibeTag} • Hợp Cạ ${compatScore}%`,
        savage_quote: primaryQuote,
        savage_quotes: [
          primaryQuote,
          p1?.savage_hook_up || 'Hãy yêu thương chính mình trước tiên.',
          p3?.healing_hook_up || 'Chậm lại một nhịp để cảm nhận sự bình yên.',
        ],
        sub_advice: `Độ Hợp Cạ: ${compatScore}% • Red Flag: ${redFlagLevel}% (Chỉ để giải trí)`,
        lucky_item: 'Buổi hẹn cà phê tối hoặc bản nhạc Lofi',
      },
      safety_flag: 'none',
      disclaimer:
        'Tarot là hình thức giải trí và tự phản chiếu, không thay thế tư vấn chuyên môn.',
      metrics: {
        compatibility_score: compatScore,
        red_flag_level: redFlagLevel,
        vibe_tag: vibeTag,
        entertainment_note: 'Chỉ số mang tính chất giải trí',
      },
    },
    aiMeta: {
      model: 'tarot-couple-engine',
      tokensIn: 620,
      tokensOut: 540,
      usedFallback: false,
      retryCount: 0,
    },
    quota: {
      usedToday: 1,
      dailyLimit: 3,
      bonusDraws: 0,
      remainingToday: 2,
    },
  };
}

export function CoupleModeView({
  initialRoomCode,
  nickname,
  birthYear,
  selectedReaderId,
  onSelectReaderId,
  deckMode,
  onQuotaUpdated,
  onOpenStoryModal,
}: CoupleModeViewProps) {
  const { quota, updateQuota, starsBalance, refreshQuota } = useQuotaSync();

  // Mode Selection: 'mode_select' (2 cards) or 'form'
  const [viewStep, setViewStep] = useState<'mode_select' | 'form'>(
    initialRoomCode ? 'form' : 'mode_select'
  );

  const [subTab, setSubTab] = useState<'solo_couple' | 'coop_room'>(
    initialRoomCode ? 'coop_room' : 'solo_couple'
  );

  // Common Couple Inputs
  const [ownerName, setOwnerName] = useState<string>(nickname || 'Mèo Đêm');
  const [partnerName, setPartnerName] = useState<string>('Người Ấy');
  const [relationshipStatus, setRelationshipStatus] =
    useState<CoupleRelationshipStatus>('situationship');
  const [coupleQuestion, setCoupleQuestion] = useState<string>(
    'Tụi mình có thật sự hợp tần số để tiến xa hơn hay chỉ đang mập mờ tạm thời?'
  );

  // Result States
  const [isLoadingSoloCouple, setIsLoadingSoloCouple] = useState<boolean>(false);
  const [loadingPhaseIndex, setLoadingPhaseIndex] = useState<number>(0);
  const [coupleReading, setCoupleReading] = useState<ReadingSuccessResponse | null>(null);
  const [crisisResponse, setCrisisResponse] = useState<ReadingCrisisResponse | null>(null);
  const [flippedCards, setFlippedCards] = useState<[boolean, boolean, boolean]>([true, true, true]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals & New Features State
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [isOutOfQuotaOpen, setIsOutOfQuotaOpen] = useState<boolean>(false);
  const [isPayOSModalOpen, setIsPayOSModalOpen] = useState<boolean>(false);
  const [secretAdviceTab, setSecretAdviceTab] = useState<'owner' | 'partner'>('owner');

  // Co-op Room 48h State
  const [coopViewMode, setCoopViewMode] = useState<'create' | 'join'>(
    initialRoomCode ? 'join' : 'create'
  );
  const [roomCodeInput, setRoomCodeInput] = useState<string>(initialRoomCode || '');
  const [activeRoom, setActiveRoom] = useState<CoupleRoomPublicView | null>(null);
  const [isRoomBusy, setIsRoomBusy] = useState<boolean>(false);
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);
  const [isCheckingPartner, setIsCheckingPartner] = useState<boolean>(false);

  useEffect(() => {
    if (nickname) {
      setOwnerName(nickname);
    }
  }, [nickname]);

  useEffect(() => {
    if (initialRoomCode) {
      setViewStep('form');
      setSubTab('coop_room');
      setCoopViewMode('join');
      setRoomCodeInput(initialRoomCode.toUpperCase());
      void fetchExistingRoom(initialRoomCode.toUpperCase());
    }
  }, [initialRoomCode]);

  const SOLO_LOADING_MESSAGES = useMemo(
    () => [
      'Đang kết nối trường năng lượng của hai bạn...',
      'Đối chiếu ma trận 4 nguyên tố Lửa, Nước, Khí, Đất...',
      'Giải mã ngôn ngữ tình yêu & bí mật tương hợp...',
    ],
    []
  );

  useEffect(() => {
    if (!isLoadingSoloCouple) {
      setLoadingPhaseIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setLoadingPhaseIndex((prev) => (prev + 1) % 3);
    }, 1800);
    return () => clearInterval(timer);
  }, [isLoadingSoloCouple]);

  // Polling tự động mỗi 3 giây khi Người A đang mở phòng chờ Người B rút bài
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'waiting_partner' || coupleReading) {
      return;
    }

    const intervalId = setInterval(() => {
      void fetchExistingRoom(activeRoom.roomCode, true);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [activeRoom?.roomCode, activeRoom?.status, coupleReading]);

  const fetchExistingRoom = async (code: string, isAutoPoll: boolean = false) => {
    if (!code.trim()) return;
    if (!isAutoPoll) {
      setIsCheckingPartner(true);
    }

    try {
      const res = await fetch(`/api/couple?roomCode=${encodeURIComponent(code.trim().toUpperCase())}`, {
        headers: {
          ...getDeviceFingerprintHeaders(),
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.room) {
          setActiveRoom(data.room as CoupleRoomPublicView);

          // Nếu phòng đã hoàn thành và có kết quả chung, tự động mở kết quả
          if (data.room.status === 'completed') {
            const readingPayload: ReadingSuccessResponse | undefined =
              data.reading ||
              (data.room.readingResult
                ? buildFallbackCoupleReading({
                    ownerNickname: data.room.ownerNickname || ownerName || 'Người A',
                    partnerNickname: data.room.partnerNickname || partnerName || 'Người B',
                    birthYear,
                    readerId: data.room.readerId || selectedReaderId,
                    relationshipStatus: data.room.relationshipStatus || relationshipStatus,
                    questionText:
                      'Trải bài Bói Đôi đồng thuận (Câu hỏi riêng tư của người tạo phòng đã được bảo mật)',
                    deckMode,
                    ownerCardObj: data.room.ownerCard
                      ? {
                          cardId: data.room.ownerCard.card.id,
                          reversed: data.room.ownerCard.reversed,
                        }
                      : undefined,
                    partnerCardObj: data.room.partnerCard
                      ? {
                          cardId: data.room.partnerCard.card.id,
                          reversed: data.room.partnerCard.reversed,
                        }
                      : undefined,
                  })
                : undefined);

            if (readingPayload) {
              if (data.room.readingResult) {
                readingPayload.result = data.room.readingResult;
              }
              soundManager.playMysticChime();
              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([40, 80, 40, 80]);
              }
              setCoupleReading(readingPayload);
              setFlippedCards([true, true, true]);
              if (onQuotaUpdated && data.quota) {
                onQuotaUpdated(data.quota);
              }
            }
          }
        }
      }
    } catch {
      // Ignore lookup error
    } finally {
      if (!isAutoPoll) {
        setIsCheckingPartner(false);
      }
    }
  };

  // Kiểu 1: Draw 3 cards & run Solo Couple Check
  const handleRunSoloCoupleCheck = async () => {
    setErrorMsg(null);
    setCrisisResponse(null);
    setIsLoadingSoloCouple(true);

    try {
      triggerHaptic('heartbeat');
      soundManager.playCrispClick();
      const res = await fetch('/api/couple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getDeviceFingerprintHeaders(),
        },
        body: JSON.stringify({
          action: 'solo_couple',
          mode: 'solo_couple',
          ownerNickname: ownerName.trim() || 'Bạn',
          nickname: ownerName.trim() || 'Bạn',
          partnerNickname: partnerName.trim() || 'Người ấy',
          partner_nickname: partnerName.trim() || 'Người ấy',
          birthYear,
          birth_year: birthYear,
          readerId: selectedReaderId,
          reader_id: selectedReaderId,
          relationshipStatus,
          relationship_status: relationshipStatus,
          questionText: coupleQuestion.trim(),
          question_text: coupleQuestion.trim(),
          deckMode,
          deck_mode: deckMode,
          selected_indices: [1, 7, 14],
        }),
      });

      const data = await res.json();

      if (data?.code === 'QUOTA_EXCEEDED') {
        setIsOutOfQuotaOpen(true);
        return;
      }

      if (data?.status === 'crisis') {
        setCrisisResponse(data as ReadingCrisisResponse);
        return;
      }

      if (!res.ok || data?.status === 'error') {
        setErrorMsg(data?.message || 'Không thể kết nối Bói Đôi lúc này.');
        return;
      }

      const readingPayload: ReadingSuccessResponse | undefined =
        data?.reading || (data?.drawnCards ? data : undefined);

      if (readingPayload) {
        soundManager.playMysticChime();
        setCoupleReading(readingPayload);
        setFlippedCards([true, true, true]);
        if (data.quota && onQuotaUpdated) {
          onQuotaUpdated(data.quota);
        } else if (readingPayload.quota && onQuotaUpdated) {
          onQuotaUpdated(readingPayload.quota);
        }
      } else {
        const fallback = buildFallbackCoupleReading({
          ownerNickname: ownerName.trim() || 'Bạn',
          partnerNickname: partnerName.trim() || 'Người Ấy',
          birthYear,
          readerId: selectedReaderId,
          relationshipStatus,
          questionText: coupleQuestion.trim(),
          deckMode,
        });
        soundManager.playMysticChime();
        setCoupleReading(fallback);
        setFlippedCards([true, true, true]);
      }
    } catch {
      const fallback = buildFallbackCoupleReading({
        ownerNickname: ownerName.trim() || 'Bạn',
        partnerNickname: partnerName.trim() || 'Người Ấy',
        birthYear,
        readerId: selectedReaderId,
        relationshipStatus,
        questionText: coupleQuestion.trim(),
        deckMode,
      });
      setCoupleReading(fallback);
      setFlippedCards([true, true, true]);
    } finally {
      setIsLoadingSoloCouple(false);
    }
  };

  // Kiểu 2 (Step A): Person A creates 48h room & draws Card 1
  const handleCreateCoopRoom = async () => {
    setErrorMsg(null);
    setCrisisResponse(null);
    setIsRoomBusy(true);

    try {
      triggerHaptic('heartbeat');
      soundManager.playCrispClick();
      const res = await fetch('/api/couple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getDeviceFingerprintHeaders(),
        },
        body: JSON.stringify({
          action: 'create_room',
          mode: 'coop_create',
          ownerNickname: ownerName.trim() || 'Người A',
          nickname: ownerName.trim() || 'Người A',
          birthYear,
          birth_year: birthYear,
          readerId: selectedReaderId,
          reader_id: selectedReaderId,
          relationshipStatus,
          relationship_status: relationshipStatus,
          questionText: coupleQuestion.trim(),
          question_text: coupleQuestion.trim(),
          deckMode,
          deck_mode: deckMode,
          selected_index: 6,
        }),
      });

      const data = await res.json();

      if (data?.code === 'QUOTA_EXCEEDED') {
        setIsOutOfQuotaOpen(true);
        return;
      }

      if (data?.status === 'crisis') {
        setCrisisResponse(data as ReadingCrisisResponse);
        return;
      }

      if (data?.room) {
        soundManager.playMysticChime();
        setActiveRoom(data.room as CoupleRoomPublicView);
        setRoomCodeInput(data.room.roomCode);
      } else {
        const generatedCode = `LUV${Math.floor(100 + Math.random() * 899)}`;
        const reader =
          READERS.find((r) => r.id === selectedReaderId) ?? READERS[0]!;
        const fallbackRoom: CoupleRoomPublicView = {
          roomCode: generatedCode,
          mode: 'coop_invite',
          status: 'waiting_partner',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          readerId: selectedReaderId,
          readerDisplayName: reader.name,
          relationshipStatus,
          relationshipLabel: RELATIONSHIP_STATUS_LABELS[relationshipStatus],
          ownerNickname: ownerName.trim() || 'Người A',
          ownerCard: {
            card: MAJOR_ARCANA[6]!,
            reversed: false,
          },
          ownerConsentedShare: true,
          partnerConsentedShare: false,
        };
        setActiveRoom(fallbackRoom);
        setRoomCodeInput(generatedCode);
      }
    } catch {
      const generatedCode = `LUV${Math.floor(100 + Math.random() * 899)}`;
      const reader =
        READERS.find((r) => r.id === selectedReaderId) ?? READERS[0]!;
      const fallbackRoom: CoupleRoomPublicView = {
        roomCode: generatedCode,
        mode: 'coop_invite',
        status: 'waiting_partner',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        readerId: selectedReaderId,
        readerDisplayName: reader.name,
        relationshipStatus,
        relationshipLabel: RELATIONSHIP_STATUS_LABELS[relationshipStatus],
        ownerNickname: ownerName.trim() || 'Người A',
        ownerCard: {
          card: MAJOR_ARCANA[6]!,
          reversed: false,
        },
        ownerConsentedShare: true,
        partnerConsentedShare: false,
      };
      setActiveRoom(fallbackRoom);
      setRoomCodeInput(generatedCode);
    } finally {
      setIsRoomBusy(false);
    }
  };

  // Kiểu 2 (Step B): Person B joins 48h room & draws Card 2
  const handleJoinCoopRoom = async () => {
    if (!roomCodeInput.trim()) {
      setErrorMsg('Vui lòng nhập mã phòng 6 ký tự.');
      return;
    }

    setErrorMsg(null);
    setCrisisResponse(null);
    setIsRoomBusy(true);

    try {
      triggerHaptic('heartbeat');
      soundManager.playCrispClick();
      const res = await fetch('/api/couple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getDeviceFingerprintHeaders(),
        },
        body: JSON.stringify({
          action: 'join_room',
          mode: 'coop_join',
          roomCode: roomCodeInput.trim().toUpperCase(),
          room_code: roomCodeInput.trim().toUpperCase(),
          partnerNickname: partnerName.trim() || 'Người B',
          nickname: partnerName.trim() || 'Người B',
          selected_index: 19,
        }),
      });

      const data = await res.json();

      if (data?.code === 'QUOTA_EXCEEDED') {
        setIsOutOfQuotaOpen(true);
        return;
      }

      if (data?.status === 'crisis') {
        setCrisisResponse(data as ReadingCrisisResponse);
        return;
      }

      if (!res.ok || data?.status === 'error') {
        setErrorMsg(data?.message || 'Không thể tham gia phòng bói đôi.');
        return;
      }

      const readingPayload: ReadingSuccessResponse | undefined =
        data.reading ||
        (data.room?.readingResult
          ? buildFallbackCoupleReading({
              ownerNickname: data.room.ownerNickname || ownerName || 'Người A',
              partnerNickname: partnerName.trim() || 'Người B',
              birthYear,
              readerId: data.room.readerId || selectedReaderId,
              relationshipStatus:
                data.room.relationshipStatus || relationshipStatus,
              questionText:
                'Trải bài Bói Đôi đồng thuận (Câu hỏi riêng tư của người tạo phòng đã được bảo mật)',
              deckMode,
              ownerCardObj: data.room.ownerCard
                ? {
                    cardId: data.room.ownerCard.card.id,
                    reversed: data.room.ownerCard.reversed,
                  }
                : undefined,
              partnerCardObj: data.room.partnerCard
                ? {
                    cardId: data.room.partnerCard.card.id,
                    reversed: data.room.partnerCard.reversed,
                  }
                : undefined,
            })
          : undefined);

      if (data?.room) {
        setActiveRoom(data.room);
      }

      if (readingPayload) {
        if (data?.room?.readingResult) {
          readingPayload.result = data.room.readingResult;
        }
        soundManager.playMysticChime();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([40, 80, 40, 80]);
        }
        setCoupleReading(readingPayload);
        setFlippedCards([true, true, true]);
        if (data?.quota && onQuotaUpdated) {
          onQuotaUpdated(data.quota);
        }
      }
    } catch {
      const fallback = buildFallbackCoupleReading({
        ownerNickname: activeRoom?.ownerNickname || ownerName || 'Người A',
        partnerNickname: partnerName.trim() || 'Người B',
        birthYear,
        readerId: activeRoom?.readerId || selectedReaderId,
        relationshipStatus: activeRoom?.relationshipStatus || relationshipStatus,
        questionText:
          'Trải bài Bói Đôi đồng thuận (Câu hỏi riêng tư của người tạo phòng đã được bảo mật)',
        deckMode,
      });
      setCoupleReading(fallback);
      setFlippedCards([true, true, true]);
    } finally {
      setIsRoomBusy(false);
    }
  };

  const handleShareInvite = async () => {
    if (!activeRoom) return;
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://tarotcouple.vercel.app';
    const url = `${origin}/couple/${activeRoom.roomCode}`;
    const inviteText = `🔮 ${activeRoom.ownerNickname || 'Người ấy'} vừa mời bạn vào phòng Bói Đôi TarotCouple (${activeRoom.roomCode})! Vào rút 1 lá bài xem độ hợp cạ & giải mã tần số tình yêu giữa 2 đứa nhé 👉 ${url}`;

    soundManager.playCrispClick();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Lời mời Bói Đôi TarotCouple',
          text: inviteText,
          url,
        });
        setCopiedInvite(true);
        setTimeout(() => setCopiedInvite(false), 2000);
        return;
      } catch {
        // user cancelled or share failed, fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(inviteText);
    }
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  // Compute interpretation bundle (Love Language, Secret Advice, Couple Quest)
  const interpretationBundle: CoupleInterpretationBundle | null = useMemo(() => {
    if (!coupleReading || coupleReading.drawnCards.length < 3) return null;
    const c1 = coupleReading.drawnCards[0];
    const c2 = coupleReading.drawnCards[1];
    const c3 = coupleReading.drawnCards[2];

    return generateCoupleInterpretationBundle({
      ownerName: ownerName || 'Bạn',
      partnerName: partnerName || 'Người ấy',
      c1: { id: c1.card.id, reversed: c1.reversed, name_vi: c1.card.name_vi },
      c2: { id: c2.card.id, reversed: c2.reversed, name_vi: c2.card.name_vi },
      c3: { id: c3.card.id, reversed: c3.reversed, name_vi: c3.card.name_vi },
      relationshipStatus,
    });
  }, [coupleReading, ownerName, partnerName, relationshipStatus]);

  if (crisisResponse) {
    return (
      <CrisisSupportView
        crisisSupport={crisisResponse.crisisSupport}
        onReturnHome={() => setCrisisResponse(null)}
      />
    );
  }

  const compatScore = coupleReading?.result.metrics?.compatibility_score ?? 84;
  const redFlagLevel = coupleReading?.result.metrics?.red_flag_level ?? 22;
  const vibeTag = coupleReading?.result.metrics?.vibe_tag ?? 'Tần Số Đồng Điệu 🔥';
  const entertainmentNote = coupleReading?.result.metrics?.entertainment_note ?? 'Chỉ số mang tính chất giải trí';

  return (
    <div className="space-y-8 select-none">
      {/* ============================================================== */}
      {/* 1. MÀN HÌNH CHỌN CHẾ ĐỘ (2 THẺ BÀI VISUAL V2)                   */}
      {/* ============================================================== */}
      {viewStep === 'mode_select' && !coupleReading && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-[#12101B]/90 border border-[#C9A24A]/40 p-6 sm:p-8 space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
        >
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#E5C687] font-bold inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1C182A] border border-[#C9A24A]/30">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              BÓI ĐÔI TAROTCOUPLE V2 • SOI TẦN SỐ ĐÔI
            </span>
            <h1 className="font-display text-2xl sm:text-4xl font-black text-[#F8F5F0]">
              Chọn Trải Nghiệm Tình Duyên
            </h1>
            <p className="text-xs sm:text-sm text-[#A9A1BC] leading-relaxed">
              Dù bạn muốn tự soi bí mật một mình hay cùng người ấy rút bài đối thoại, Tarot sẽ bóc tách chân thực độ hợp cạ & hóa giải mọi khúc mắc.
            </p>
          </div>

          {/* 2 Visual Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* THẺ 1: BÓI BÍ MẬT 1 MÌNH */}
            <div
              onClick={() => {
                soundManager.playCrispClick();
                setSubTab('solo_couple');
                setViewStep('form');
              }}
              className="p-6 rounded-3xl bg-gradient-to-b from-[#1C172B] to-[#120F1D] border-2 border-[#C9A24A]/40 hover:border-[#C9A24A] shadow-[0_10px_35px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(201,162,74,0.3)] transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 px-3.5 py-1 rounded-bl-2xl bg-[#C9A24A]/20 border-b border-l border-[#C9A24A]/50 text-[10px] font-bold text-[#E5C687] uppercase tracking-wider">
                Bảo Mật 100% 🔒
              </div>

              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/30 to-[#C9A24A]/20 border border-[#C9A24A]/40 flex items-center justify-center text-2xl shadow-md group-hover:scale-105 transition-transform">
                  🔮
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-display text-xl font-bold text-[#F8F5F0] group-hover:text-[#E5C687] transition-colors">
                    Bói Bí Mật 1 Mình
                  </h3>
                  <p className="text-xs text-[#A9A1BC] leading-relaxed">
                    Tự nhập tên cả hai & câu hỏi băn khoăn. Bạn tự rút bài để soi trước tâm tư crush/người yêu mà đối phương hoàn toàn không hay biết.
                  </p>
                </div>

                <div className="space-y-2 text-[11px] text-[#D8D2E7] pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Không cần gửi link hay thông báo cho đối phương</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Tự bốc 2 lá đại diện & 1 lá cầu nối định mệnh</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Nhận ngay Love Language & Lời khuyên bí mật</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="w-full py-3 px-4 rounded-xl bg-[#262038] group-hover:bg-gradient-to-r group-hover:from-[#C9A24A] group-hover:to-[#E5C687] text-[#E5C687] group-hover:text-[#09080D] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md">
                  <span>Bắt Đầu Soi Bí Mật</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* THẺ 2: PHÒNG HẸN HÒ 2 NGƯỜI */}
            <div
              onClick={() => {
                soundManager.playCrispClick();
                setSubTab('coop_room');
                setCoopViewMode('create');
                setViewStep('form');
              }}
              className="p-6 rounded-3xl bg-gradient-to-b from-[#241A2D] to-[#14101F] border-2 border-[#E879A8]/50 hover:border-rose-400 shadow-[0_10px_35px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(232,121,168,0.35)] transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 px-3.5 py-1 rounded-bl-2xl bg-rose-500/20 border-b border-l border-rose-400/50 text-[10px] font-bold text-rose-300 uppercase tracking-wider">
                Trending Gen Z 🔥
              </div>

              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/30 to-[#8B5CF6]/20 border border-rose-400/40 flex items-center justify-center text-2xl shadow-md group-hover:scale-105 transition-transform">
                  💞
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-display text-xl font-bold text-[#F8F5F0] group-hover:text-rose-300 transition-colors">
                    Phòng Hẹn Hò 2 Người
                  </h3>
                  <p className="text-xs text-[#A9A1BC] leading-relaxed">
                    Tạo phòng hẹn hò riêng 48h. Gửi link hoặc quét mã QR khi ngồi cạnh nhau cafe. Mỗi người tự rút 1 lá bài, kết nối sợi chỉ đỏ để mở khóa kết quả chung.
                  </p>
                </div>

                <div className="space-y-2 text-[11px] text-[#D8D2E7] pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Trải nghiệm lật bài song song thời gian thực</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Câu hỏi riêng tư của người tạo phòng được ẩn 100%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Xuất Hóa Đơn Tình Duyên Vintage Retro PNG</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="w-full py-3 px-4 rounded-xl bg-[#2D1F35] group-hover:bg-gradient-to-r group-hover:from-rose-500 group-hover:to-[#E879A8] text-rose-300 group-hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md">
                  <span>Khai Mở Phòng Hẹn Hò</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Join With Code Link */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                soundManager.playCrispClick();
                setSubTab('coop_room');
                setCoopViewMode('join');
                setViewStep('form');
              }}
              className="text-xs text-[#A9A1BC] hover:text-[#E5C687] transition cursor-pointer underline decoration-dotted"
            >
              🔑 Bạn đã có mã phòng từ người ấy? Bấm vào đây để nhập mã tham gia ngay &rarr;
            </button>
          </div>
        </motion.div>
      )}

      {/* ============================================================== */}
      {/* 2. FORM & LIVE ROOM VIEW                                       */}
      {/* ============================================================== */}
      {viewStep === 'form' && !coupleReading && (
        <div className="rounded-3xl bg-[#12101B] border border-[#C9A24A]/35 p-6 sm:p-8 space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
          {/* Header Bar & Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  soundManager.playCrispClick();
                  setViewStep('mode_select');
                  setActiveRoom(null);
                  setErrorMsg(null);
                }}
                className="text-xs text-[#A9A1BC] hover:text-[#E5C687] flex items-center gap-1 transition cursor-pointer mb-1"
              >
                &larr; Quay lại chọn chế độ khác
              </button>

              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F8F5F0]">
                {subTab === 'solo_couple'
                  ? '🔮 Bói Bí Mật 1 Mình'
                  : '💞 Phòng Hẹn Hò 2 Người (48h)'}
              </h2>
            </div>

            {/* Quick Switcher Button */}
            <div className="inline-flex rounded-2xl bg-[#09080D] border border-[#C9A24A]/30 p-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundManager.playCrispClick();
                  setSubTab('solo_couple');
                  setErrorMsg(null);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  subTab === 'solo_couple'
                    ? 'bg-[#C9A24A] text-[#09080D] shadow'
                    : 'text-[#A39BB5] hover:text-[#F8F5F0]'
                }`}
              >
                Tự Soi Bí Mật
              </button>
              <button
                type="button"
                onClick={() => {
                  soundManager.playCrispClick();
                  setSubTab('coop_room');
                  setErrorMsg(null);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  subTab === 'coop_room'
                    ? 'bg-[#C9A24A] text-[#09080D] shadow'
                    : 'text-[#A39BB5] hover:text-[#F8F5F0]'
                }`}
              >
                Phòng Hẹn Hò 2 Người
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg ? (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-400/40 text-xs sm:text-sm text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : null}

          {/* ================= SUB-TAB 1: SOLO COUPLE CHECK ================= */}
          {subTab === 'solo_couple' && (
            <div className="space-y-6">
              {/* Nicknames */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="owner-nickname-input" className="block text-xs font-bold uppercase tracking-wider text-[#E5C687]">
                    1. Biệt danh của bạn (Lá số 1)
                  </label>
                  <input
                    id="owner-nickname-input"
                    aria-label="Biệt danh của bạn"
                    type="text"
                    maxLength={35}
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Ví dụ: Mèo Đêm"
                    className="w-full px-4 py-3 rounded-2xl bg-[#09080D] border border-[#C9A24A]/35 text-sm text-[#F8F5F0] focus:outline-none focus:border-[#E5C687]"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="partner-nickname-input" className="block text-xs font-bold uppercase tracking-wider text-[#E5C687]">
                    2. Biệt danh người ấy (Lá số 2)
                  </label>
                  <input
                    id="partner-nickname-input"
                    aria-label="Biệt danh người ấy"
                    type="text"
                    maxLength={35}
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="Ví dụ: Cún Con"
                    className="w-full px-4 py-3 rounded-2xl bg-[#09080D] border border-[#C9A24A]/35 text-sm text-[#F8F5F0] focus:outline-none focus:border-[#E5C687]"
                  />
                </div>
              </div>

              {/* Relationship Status Pills */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#E5C687]">
                  3. Giai đoạn mối quan hệ hiện tại
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {RELATIONSHIP_OPTIONS.map((item) => {
                    const isSelected = relationshipStatus === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          soundManager.playCrispClick();
                          setRelationshipStatus(item.id);
                        }}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#261E33] border-[#C9A24A] text-[#F8F5F0] shadow-[0_0_15px_rgba(201,162,74,0.3)]'
                            : 'bg-[#09080D] border-[#262235] text-[#A39BB5] hover:border-white/20'
                        }`}
                      >
                        <span className="text-xl mb-1">{item.icon}</span>
                        <span className="text-xs font-bold block">{item.label}</span>
                        <span className="text-[10px] text-[#A39BB5] line-clamp-1 mt-0.5">{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Persona Reader Selector */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#E5C687]">
                  4. Chọn Nhân Vật Reader Luận Giải
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {READERS.map((r) => {
                    const isSelected = selectedReaderId === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          soundManager.playCrispClick();
                          onSelectReaderId(r.id);
                        }}
                        className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-[#261E33] border-[#C9A24A] shadow'
                            : 'bg-[#09080D] border-[#262235] hover:border-white/20'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold shadow"
                          style={{ backgroundColor: `${r.accent_color}33`, color: r.accent_color }}
                        >
                          {r.name.slice(0, 1)}
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-bold text-[#F8F5F0] block truncate">{r.name}</span>
                          <span className="text-[9px] text-[#A39BB5] block truncate">{r.badge}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question Input */}
              <div className="space-y-2">
                <label htmlFor="couple-question-input" className="block text-xs font-bold uppercase tracking-wider text-[#E5C687]">
                  5. Nỗi niềm hoặc câu hỏi bạn muốn soi chiếu
                </label>
                <textarea
                  id="couple-question-input"
                  aria-label="Câu hỏi bói đôi"
                  rows={2}
                  maxLength={250}
                  value={coupleQuestion}
                  onChange={(e) => setCoupleQuestion(e.target.value)}
                  placeholder="Nhập câu hỏi bạn băn khoăn về người ấy..."
                  className="w-full px-4 py-3 rounded-2xl bg-[#09080D] border border-[#C9A24A]/35 text-sm text-[#F8F5F0] focus:outline-none focus:border-[#E5C687] resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="button"
                disabled={isLoadingSoloCouple}
                onClick={() => void handleRunSoloCoupleCheck()}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#C9A24A] via-[#E5C687] to-[#C9A24A] text-[#09080D] font-bold text-sm sm:text-base shadow-[0_10px_30px_rgba(201,162,74,0.35)] hover:brightness-110 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoadingSoloCouple ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{SOLO_LOADING_MESSAGES[loadingPhaseIndex]}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Khai Mở Bói Đôi & Rút 3 Lá Bài (Tốn 1 Lượt / 3 Sao)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ================= SUB-TAB 2: CO-OP LIVE ROOM ================= */}
          {subTab === 'coop_room' && (
            <div className="space-y-6">
              {/* Co-op View Sub-Mode Switcher: Create vs Join */}
              {!activeRoom && (
                <div className="flex border-b border-white/10 pb-4 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playCrispClick();
                      setCoopViewMode('create');
                    }}
                    className={`text-xs font-bold pb-2 transition cursor-pointer ${
                      coopViewMode === 'create'
                        ? 'text-[#E5C687] border-b-2 border-[#C9A24A]'
                        : 'text-[#A39BB5] hover:text-[#F8F5F0]'
                    }`}
                  >
                    1. Tạo Phòng Mới &amp; Mời Người Ấy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playCrispClick();
                      setCoopViewMode('join');
                    }}
                    className={`text-xs font-bold pb-2 transition cursor-pointer ${
                      coopViewMode === 'join'
                        ? 'text-[#E5C687] border-b-2 border-[#C9A24A]'
                        : 'text-[#A39BB5] hover:text-[#F8F5F0]'
                    }`}
                  >
                    2. Tham Gia Phòng Có Sẵn Bằng Mã
                  </button>
                </div>
              )}

              {/* CREATE ROOM FLOW */}
              {coopViewMode === 'create' && !activeRoom && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="coop-owner-input" className="block text-xs font-bold uppercase tracking-wider text-[#E5C687]">
                        Biệt danh của bạn (Người A)
                      </label>
                      <input
                        id="coop-owner-input"
                        aria-label="Biệt danh của bạn"
                        type="text"
                        maxLength={35}
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="Ví dụ: Bạn"
                        className="w-full px-4 py-3 rounded-2xl bg-[#09080D] border border-[#C9A24A]/35 text-sm text-[#F8F5F0] focus:outline-none focus:border-[#E5C687]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="coop-partner-input" className="block text-xs font-bold uppercase tracking-wider text-[#E5C687]">
                        Biệt danh người ấy (Người B)
                      </label>
                      <input
                        id="coop-partner-input"
                        aria-label="Biệt danh người ấy"
                        type="text"
                        maxLength={35}
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        placeholder="Ví dụ: Người ấy"
                        className="w-full px-4 py-3 rounded-2xl bg-[#09080D] border border-[#C9A24A]/35 text-sm text-[#F8F5F0] focus:outline-none focus:border-[#E5C687]"
                      />
                    </div>
                  </div>

                  {/* Relationship Status Pills */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#E5C687]">
                      Mối quan hệ hiện tại
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {RELATIONSHIP_OPTIONS.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setRelationshipStatus(item.id)}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer text-xs font-bold ${
                            relationshipStatus === item.id
                              ? 'bg-[#261E33] border-[#C9A24A] text-[#F8F5F0]'
                              : 'bg-[#09080D] border-[#262235] text-[#A39BB5]'
                          }`}
                        >
                          <span className="mr-1">{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Privacy Alert */}
                  <div className="p-3.5 rounded-2xl bg-[#14111C] border border-white/10 text-xs text-[#A9A1BC] flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#C9A24A] shrink-0" />
                    <span>
                      Phòng riêng tư có thời hạn 48 giờ. Câu hỏi riêng của bạn không bao giờ hiển thị trên máy của người ấy.
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isRoomBusy}
                    onClick={() => void handleCreateCoopRoom()}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-[#E879A8] to-[#C9A24A] text-[#09080D] font-bold text-sm sm:text-base shadow-[0_10px_30px_rgba(232,121,168,0.35)] hover:brightness-110 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isRoomBusy ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Đang Tạo Phòng &amp; Rút Lá Số 1...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Khai Mở Phòng Hẹn Hò &amp; Rút Lá Số 1 Của Bạn</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* ACTIVE LIVE ROOM (WAITING PARTNER) */}
              {activeRoom && activeRoom.status === 'waiting_partner' && (
                <div className="space-y-6">
                  {/* Room Code Banner */}
                  <div className="p-4 rounded-3xl bg-gradient-to-r from-[#1C172B] via-[#241B33] to-[#1C172B] border border-[#C9A24A]/50 text-center space-y-1 relative">
                    <span className="text-[10px] uppercase font-bold text-[#A39BB5] tracking-widest">
                      MÃ PHÒNG HẸN HÒ RIÊNG TƯ (LƯU 48H)
                    </span>
                    <div className="flex items-center justify-center gap-3">
                      <span className="font-mono text-3xl font-black text-[#F8F5F0] tracking-widest text-[#E5C687]">
                        {activeRoom.roomCode}
                      </span>
                      <button
                        type="button"
                        onClick={handleShareInvite}
                        className="px-3 py-1.5 rounded-xl bg-[#2D243F] hover:bg-[#3B3054] text-[#E5C687] text-xs font-bold border border-[#C9A24A]/40 flex items-center gap-1 transition cursor-pointer"
                      >
                        {copiedInvite ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Đã chép link!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Chép Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* VISUAL 2 GHẾ HẸN HÒ & SỢI CHỈ ĐỎ ĐỊNH MỆNH */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-[#09080D]/90 border border-[#262235] relative overflow-hidden">
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center text-center">
                      {/* Cột 1: Ghế Người A */}
                      <div className="space-y-2 flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#C9A24A]/30 to-[#8B5CF6]/30 border-2 border-[#C9A24A] flex items-center justify-center text-xl shadow-lg relative">
                          👤
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#09080D] flex items-center justify-center text-[8px] text-white">
                            ✓
                          </span>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#F8F5F0] block truncate max-w-[90px]">
                            {activeRoom.ownerNickname || 'Bạn'}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold block">
                            Đã rút bài ✓
                          </span>
                        </div>

                        {/* Card 1 Mini Preview */}
                        <div className="w-14 h-20 rounded-xl bg-gradient-to-br from-[#1D1829] to-[#09080D] border border-[#C9A24A]/60 flex flex-col items-center justify-center p-1 shadow-md">
                          <span className="text-xs text-[#C9A24A]">✦</span>
                          <span className="text-[8px] text-[#A9A1BC] mt-1 uppercase font-bold">Lá Số 1</span>
                        </div>
                      </div>

                      {/* Cột 2: Sợi Chỉ Đỏ & Lá Cầu Nối Số 3 Ở Giữa */}
                      <div className="flex flex-col items-center justify-center space-y-2 relative">
                        {/* Red Thread Wave */}
                        <div className="relative w-full h-8 flex items-center justify-center">
                          <div className="w-full h-0.5 bg-gradient-to-r from-[#C9A24A] via-rose-500 to-rose-400/50 shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-pulse" />
                          <span className="absolute bg-[#09080D] px-2 text-base text-rose-400">
                            💖
                          </span>
                        </div>

                        {/* Resonance Bridge Center Slot */}
                        <div className="w-16 h-24 rounded-xl border-2 border-dashed border-[#C9A24A]/50 bg-[#14111C]/60 flex flex-col items-center justify-center p-1.5 shadow-[0_0_20px_rgba(201,162,74,0.15)] relative">
                          <span className="animate-spin text-xs text-[#C9A24A]">✦</span>
                          <span className="text-[8px] text-[#E5C687] font-bold text-center mt-1 uppercase leading-tight">
                            Lá Cầu Nối Định Mệnh
                          </span>
                        </div>
                      </div>

                      {/* Cột 3: Ghế Người B */}
                      <div className="space-y-2 flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-[#1C182A] border-2 border-dashed border-rose-400/50 flex items-center justify-center text-xl shadow-lg relative">
                          <span className="opacity-60">💌</span>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-20" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#F8F5F0] block truncate max-w-[90px]">
                            {activeRoom.partnerNickname || 'Người ấy'}
                          </span>
                          <span className="text-[10px] text-amber-300 font-semibold block animate-pulse">
                            Đang đợi vào...
                          </span>
                        </div>

                        {/* Card 2 Slot (Dotted) */}
                        <div className="w-14 h-20 rounded-xl border border-dashed border-[#3A334F] bg-[#14111C]/40 flex flex-col items-center justify-center p-1">
                          <span className="text-[9px] text-[#6E6782] text-center leading-tight">Chờ rút lá 2</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QR Code & Direct Scan Section */}
                  <div className="p-4 rounded-3xl bg-[#14111C] border border-[#C9A24A]/40 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-28 h-28 p-2 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-lg">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                          typeof window !== 'undefined'
                            ? `${window.location.origin}/couple/${activeRoom.roomCode}`
                            : `https://tarotcouple.vercel.app/couple/${activeRoom.roomCode}`
                        )}&color=09080d&bgcolor=ffffff`}
                        alt={`QR Code phòng ${activeRoom.roomCode}`}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="space-y-1.5 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-[#E5C687]">
                        <QrCode className="w-4 h-4 text-[#C9A24A]" />
                        <span>Quét mã QR trực tiếp từ Camera</span>
                      </div>
                      <p className="text-xs text-[#A9A1BC] leading-relaxed">
                        Nếu đang ngồi cafe cạnh nhau, hãy giơ màn hình này để người ấy mở camera quét vào phòng rút bài ngay tức thì!
                      </p>
                      <button
                        type="button"
                        onClick={handleShareInvite}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#262038] hover:bg-[#342B4D] border border-[#C9A24A]/30 text-xs text-[#E5C687] font-semibold transition cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Chia sẻ link qua Messenger / Zalo / Story</span>
                      </button>
                    </div>
                  </div>

                  {/* Auto polling status */}
                  <div className="p-3 rounded-2xl bg-[#09080D] border border-[#262235] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-[#A9A1BC]">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A24A] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C9A24A]" />
                      </span>
                      <span>Đang tự động kiểm tra mỗi 3s khi người ấy rút bài...</span>
                    </div>

                    <button
                      type="button"
                      disabled={isCheckingPartner}
                      onClick={() => void fetchExistingRoom(activeRoom.roomCode, false)}
                      className="px-3 py-1.5 rounded-xl bg-[#1D1829] hover:bg-[#282238] border border-[#C9A24A]/40 text-[#E5C687] font-semibold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    >
                      {isCheckingPartner ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      <span>Kiểm tra thủ công</span>
                    </button>
                  </div>

                  {/* Shortcut to switch to Person B view on same device */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRoomCodeInput(activeRoom.roomCode);
                        setCoopViewMode('join');
                      }}
                      className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-[#09080D] font-bold text-xs sm:text-sm shadow-md hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>🎭 Người ấy đang ngồi cạnh? Chuyển sang góc nhìn Người B để rút lá 2 ngay</span>
                    </button>
                  </div>
                </div>
              )}

              {/* JOIN EXISTING ROOM (PERSON B FLOW) */}
              {coopViewMode === 'join' && !activeRoom?.readingResult && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-400/40 flex items-center gap-3 text-xs sm:text-sm text-emerald-100">
                    <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <strong>🔒 Bảo mật tuyệt đối:</strong> Bạn chỉ cần nhập mã phòng do người ấy gửi và tự tay rút lá bài của chính mình. Kết quả sẽ được mở khóa đồng thời cho cả hai người.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="join-room-code-input" className="block text-xs font-bold uppercase tracking-wider text-[#E5C687]">
                        Mã phòng 6 ký tự
                      </label>
                      <input
                        id="join-room-code-input"
                        aria-label="Mã phòng 6 ký tự"
                        type="text"
                        value={roomCodeInput}
                        onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                        placeholder="Ví dụ: LUV892"
                        className="w-full px-4 py-3 rounded-2xl bg-[#09080D] border border-[#C9A24A]/45 text-sm font-mono uppercase text-[#E5C687] focus:outline-none focus:border-[#E5C687]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="join-partner-nickname-input" className="block text-xs font-bold uppercase tracking-wider text-[#E5C687]">
                        Biệt danh của bạn (Người B)
                      </label>
                      <input
                        id="join-partner-nickname-input"
                        aria-label="Biệt danh của bạn"
                        type="text"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        placeholder="Nhập tên của bạn..."
                        className="w-full px-4 py-3 rounded-2xl bg-[#09080D] border border-[#C9A24A]/45 text-sm text-[#F8F5F0] focus:outline-none focus:border-[#E5C687]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isRoomBusy}
                    onClick={() => void handleJoinCoopRoom()}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#C9A24A] via-[#E5C687] to-[#C9A24A] text-[#09080D] font-bold text-sm sm:text-base shadow-[0_10px_30px_rgba(201,162,74,0.35)] hover:brightness-110 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isRoomBusy ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Đang Rút Lá Bài Của Bạn &amp; Mở Khóa Kết Quả...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>💞 Rút Lá Thứ 2 Của Bạn &amp; Xem Kết Quả Chung</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. MÀN KẾT QUẢ BÓI ĐÔI V2 (COMPREHENSIVE RESULTS VIEW)          */}
      {/* ============================================================== */}
      {coupleReading && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header & Quick Action Buttons */}
          <div className="rounded-3xl bg-gradient-to-b from-[#1C162A] to-[#120F1D] border-2 border-[#C9A24A] p-6 sm:p-8 space-y-6 shadow-[0_20px_60px_rgba(201,162,74,0.22)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#C9A24A]/20 border border-[#E5C687] text-xs font-bold text-[#E5C687]">
                    ✦ {vibeTag}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#A9A1BC]">
                    {entertainmentNote}
                  </span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5F0] pt-1">
                  Kết Quả Bói Đôi: {coupleReading.nickname}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playCrispClick();
                    setShowReceiptModal(true);
                  }}
                  className="px-4 py-3 rounded-2xl bg-[#1C182A] hover:bg-[#27223B] border border-[#C9A24A]/40 text-[#E5C687] font-bold text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Receipt className="w-4 h-4 text-[#C9A24A]" />
                  <span>🧾 Hóa Đơn Tình Duyên</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playCrispClick();
                    onOpenStoryModal(coupleReading);
                  }}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#C9A24A] via-[#E5C687] to-[#C9A24A] text-[#09080D] font-bold text-xs sm:text-sm shadow-[0_8px_25px_rgba(201,162,74,0.35)] hover:brightness-110 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  <span>✨ Xuất Ảnh Story 9:16</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playCrispClick();
                    setCoupleReading(null);
                    setViewStep('mode_select');
                    setActiveRoom(null);
                  }}
                  className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#D8D2E7] transition cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Soi Cặp Khác</span>
                </button>
              </div>
            </div>

            {/* AI Voice Reader Bar */}
            <AIVoiceReaderBar
              readerId={selectedReaderId || 'ba_ngoai'}
              nickname={coupleReading.nickname}
              topicLabel={`Bói Đôi • ${RELATIONSHIP_STATUS_LABELS[relationshipStatus]}`}
              overallVerdict={coupleReading.result.overall_verdict}
              savageQuote={coupleReading.result.shareable_card.savage_quote}
              cards={coupleReading.drawnCards.map((d) => ({
                name_vi: d.card.name_vi,
                reversed: d.reversed,
                position_label: d.position_label,
              }))}
              className="my-3"
            />

            {/* Dual Gauges: Độ Hợp Cạ (%) & Máy Đo Red Flag (🚩 %) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Gauge 1: Compatibility */}
              <div className="p-5 rounded-2xl bg-[#09080D]/85 border border-emerald-400/40 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                    Độ Hợp Cạ Tần Số (Compatibility)
                  </span>
                  <strong className="font-display text-3xl font-black text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]">
                    {compatScore}%
                  </strong>
                </div>

                <div className="relative w-full h-4 rounded-full bg-[#171424] overflow-hidden p-0.5 border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${compatScore}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-[#C9A24A] relative shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                  >
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_8px_#ffffff]" />
                  </motion.div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-[#A39BB5] pt-0.5">
                  <span>0% (Khác biệt)</span>
                  <span className="text-[#E5C687] font-bold">50% (Hài hòa)</span>
                  <span>100% (Tri kỷ)</span>
                </div>
              </div>

              {/* Gauge 2: Red Flag */}
              <div className="p-5 rounded-2xl bg-[#09080D]/85 border border-rose-400/40 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-500" />
                    Máy Đo Red Flag 🚩 (Nguy Cơ Lệch Pha)
                  </span>
                  <strong className="font-display text-3xl font-black text-rose-300 drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]">
                    {redFlagLevel}%
                  </strong>
                </div>

                <div className="relative w-full h-4 rounded-full bg-[#171424] overflow-hidden p-0.5 border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${redFlagLevel}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-red-600 relative shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                  >
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_8px_#ffffff]" />
                  </motion.div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-[#A39BB5] pt-0.5">
                  <span>0% (An toàn)</span>
                  <span className="text-amber-300 font-bold">50% (Cần lưu ý)</span>
                  <span>100% (Cảnh báo đỏ)</span>
                </div>
              </div>
            </div>

            {/* 3 Lá Bài Visual & Sợi Chỉ Đỏ */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#E5C687] text-center">
                3 Lá Bài Định Mệnh Cặp Đôi
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {coupleReading.drawnCards.map((drawn, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#09080D]/90 border border-[#262235] space-y-3 text-center relative overflow-hidden"
                  >
                    <span className="text-[10px] uppercase font-bold text-[#C9A24A] block">
                      {drawn.position_label}
                    </span>

                    <div className="w-32 h-52 mx-auto relative">
                      <TarotCardVisual
                        card={drawn.card}
                        reversed={drawn.reversed}
                        isFlipped={flippedCards[idx]}
                        className="w-full h-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-display text-sm font-bold text-[#F8F5F0]">
                        {drawn.card.name_vi}
                      </h4>
                      <p className="text-[11px] text-[#A9A1BC] line-clamp-2">
                        {drawn.reversed ? 'Năng lượng Chiều Ngược' : 'Năng lượng Chiều Xuôi'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Couple 3D Resonance Bridge */}
            <div className="py-2">
              <CoupleResonanceBridge3D
                ownerCard={coupleReading.drawnCards[0].card}
                partnerCard={coupleReading.drawnCards[1].card}
                bridgeCard={coupleReading.drawnCards[2].card}
                compatibilityScore={compatScore}
                redFlagLevel={redFlagLevel}
              />
            </div>
          </div>

          {/* ================= KHỐI LUẬN GIẢI CHÍNH ================= */}
          <div className="rounded-3xl bg-[#12101B] border border-[#262235] p-6 sm:p-8 space-y-5">
            <h3 className="font-display text-xl font-bold text-[#F8F5F0] flex items-center gap-2">
              <span>🔮 Lời Luận Giải Tổng Quan Của Reader</span>
            </h3>

            <p className="text-sm text-[#D8D2E7] leading-relaxed whitespace-pre-line bg-[#09080D]/60 p-4 rounded-2xl border border-white/5">
              {coupleReading.result.overall_verdict}
            </p>

            {/* Actionable Next Step */}
            {coupleReading.result.actionable_next_step && (
              <div className="p-4 rounded-2xl bg-[#1C182A] border border-[#C9A24A]/40 space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#E5C687] flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-[#C9A24A]" />
                  Hành Động Khuyến Nghị Cho Cặp Đôi
                </span>
                <p className="text-xs sm:text-sm text-[#F8F5F0] leading-relaxed">
                  {coupleReading.result.actionable_next_step}
                </p>
              </div>
            )}
          </div>

          {/* ================= KHỐI CHIÊM TINH: MA TRẬN 4 NGUYÊN TỐ TAROT ================= */}
          {interpretationBundle?.elementalResonance && (
            <div className="rounded-3xl bg-[#12101B] border border-[#C9A24A]/40 p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-widest text-[#E5C687] font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C9A24A]" />
                    CHIÊM TINH HỌC TAROT • MA TRẬN 4 NGUYÊN TỐ
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F8F5F0]">
                    Tương Tác Nguyên Tố (Elemental Synergy)
                  </h3>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-[#C9A24A]/10 border border-[#C9A24A]/40 text-[#E5C687] font-bold text-xs flex items-center gap-1.5">
                  <span>Hòa Hợp</span>
                  <span className="font-mono text-sm">{interpretationBundle.elementalResonance.synergyScore}%</span>
                </div>
              </div>

              {/* 2 Elemental Profiles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nguyên tố bạn */}
                <div className="p-4 rounded-2xl bg-[#09080D] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#A9A1BC] uppercase font-bold">
                      Nguyên tố của @{ownerName}
                    </span>
                    <span className="text-2xl">
                      {interpretationBundle.elementalResonance.ownerElement.icon}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-display text-base font-bold text-[#E5C687] flex items-center gap-2">
                      <span>{interpretationBundle.elementalResonance.ownerElement.nameVi}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1C172B] text-[#A39BB5] border border-white/10 font-normal">
                        {interpretationBundle.elementalResonance.ownerElement.badge}
                      </span>
                    </h4>
                  </div>
                  <p className="text-xs text-[#D8D2E7] leading-relaxed">
                    {interpretationBundle.elementalResonance.ownerElement.nature}
                  </p>
                  <div className="pt-1 text-[11px] text-[#A9A1BC] bg-[#14111C] p-2.5 rounded-xl border border-white/5 space-y-1">
                    <div>✨ <strong>Điểm mạnh:</strong> {interpretationBundle.elementalResonance.ownerElement.strengths}</div>
                    <div>⚠️ <strong>Lưu ý:</strong> {interpretationBundle.elementalResonance.ownerElement.tendency}</div>
                  </div>
                </div>

                {/* Nguyên tố người ấy */}
                <div className="p-4 rounded-2xl bg-[#09080D] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#A9A1BC] uppercase font-bold">
                      Nguyên tố của @{partnerName}
                    </span>
                    <span className="text-2xl">
                      {interpretationBundle.elementalResonance.partnerElement.icon}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-display text-base font-bold text-rose-300 flex items-center gap-2">
                      <span>{interpretationBundle.elementalResonance.partnerElement.nameVi}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1C172B] text-[#A39BB5] border border-white/10 font-normal">
                        {interpretationBundle.elementalResonance.partnerElement.badge}
                      </span>
                    </h4>
                  </div>
                  <p className="text-xs text-[#D8D2E7] leading-relaxed">
                    {interpretationBundle.elementalResonance.partnerElement.nature}
                  </p>
                  <div className="pt-1 text-[11px] text-[#A9A1BC] bg-[#14111C] p-2.5 rounded-xl border border-white/5 space-y-1">
                    <div>✨ <strong>Điểm mạnh:</strong> {interpretationBundle.elementalResonance.partnerElement.strengths}</div>
                    <div>⚠️ <strong>Lưu ý:</strong> {interpretationBundle.elementalResonance.partnerElement.tendency}</div>
                  </div>
                </div>
              </div>

              {/* Nhận định kết hợp nguyên tố */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#1C162A] border border-[#C9A24A]/30 space-y-2">
                <div className="text-xs sm:text-sm font-bold text-[#E5C687] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C9A24A]" />
                  <span>{interpretationBundle.elementalResonance.synergyTitle}</span>
                </div>
                <p className="text-xs sm:text-sm text-[#D8D2E7] leading-relaxed">
                  {interpretationBundle.elementalResonance.description}
                </p>
                <div className="pt-2 border-t border-white/10 text-xs text-[#A9A1BC]">
                  🌱 <strong>Bí quyết vun đắp:</strong> {interpretationBundle.elementalResonance.growthAdvice}
                </div>
              </div>
            </div>
          )}

          {/* ================= KHỐI MỚI 1: LOVE LANGUAGE ANALYSIS ================= */}
          {interpretationBundle && (
            <div className="rounded-3xl bg-[#12101B] border border-rose-500/30 p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-widest text-rose-300 font-bold flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                    BỘ TÍNH NĂNG MỚI • TƯƠNG THÍCH CẢM XÚC
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F8F5F0]">
                    Phân Tích Ngôn Ngữ Tình Yêu (Love Language)
                  </h3>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-400/30 text-rose-300 font-bold text-xs">
                  Đồng điệu {interpretationBundle.loveLanguage.matchScore}%
                </div>
              </div>

              {/* 2 Love Language Profiles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profile Bạn */}
                <div className="p-4 rounded-2xl bg-[#09080D] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#A9A1BC] uppercase font-bold">
                      Ngôn ngữ của @{ownerName}
                    </span>
                    <span className="text-xl">
                      {interpretationBundle.loveLanguage.ownerProfile.icon}
                    </span>
                  </div>
                  <h4 className="font-display text-base font-bold text-[#E5C687]">
                    {interpretationBundle.loveLanguage.ownerProfile.nameVi}
                  </h4>
                  <p className="text-xs text-[#D8D2E7] leading-relaxed">
                    {interpretationBundle.loveLanguage.ownerProfile.description}
                  </p>
                  <div className="pt-1 text-[11px] text-[#A9A1BC] bg-[#14111C] p-2.5 rounded-xl border border-white/5">
                    💡 <strong>Gợi ý:</strong> {interpretationBundle.loveLanguage.ownerProfile.expressionTip}
                  </div>
                </div>

                {/* Profile Người Ấy */}
                <div className="p-4 rounded-2xl bg-[#09080D] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#A9A1BC] uppercase font-bold">
                      Ngôn ngữ của @{partnerName}
                    </span>
                    <span className="text-xl">
                      {interpretationBundle.loveLanguage.partnerProfile.icon}
                    </span>
                  </div>
                  <h4 className="font-display text-base font-bold text-rose-300">
                    {interpretationBundle.loveLanguage.partnerProfile.nameVi}
                  </h4>
                  <p className="text-xs text-[#D8D2E7] leading-relaxed">
                    {interpretationBundle.loveLanguage.partnerProfile.description}
                  </p>
                  <div className="pt-1 text-[11px] text-[#A9A1BC] bg-[#14111C] p-2.5 rounded-xl border border-white/5">
                    💡 <strong>Gợi ý:</strong> {interpretationBundle.loveLanguage.partnerProfile.expressionTip}
                  </div>
                </div>
              </div>

              {/* Lời khuyên hòa hợp ngôn ngữ */}
              <div className="p-4 rounded-2xl bg-[#1C162A] border border-[#8B5CF6]/40 text-xs sm:text-sm text-[#D8D2E7] leading-relaxed">
                <strong>✦ Nhận định hòa hợp:</strong> {interpretationBundle.loveLanguage.advice}
              </div>
            </div>
          )}

          {/* ================= KHỐI MỚI 2: LỜI DẶN BÍ MẬT CHO TỪNG NGƯỜI ================= */}
          {interpretationBundle && (
            <div className="rounded-3xl bg-[#12101B] border border-[#C9A24A]/40 p-6 sm:p-8 space-y-5">
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-widest text-[#E5C687] font-bold">
                  GÓC NHÌN THẤU CẢM • ĐIỀU NGƯỜI ẤY NGẠI NÓI
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F8F5F0]">
                  Lời Dặn Bí Mật Riêng Cho Từng Người
                </h3>
              </div>

              {/* Switcher Tab: For Owner vs For Partner */}
              <div className="flex rounded-2xl bg-[#09080D] border border-white/10 p-1">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playCrispClick();
                    setSecretAdviceTab('owner');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    secretAdviceTab === 'owner'
                      ? 'bg-[#C9A24A] text-[#09080D] shadow'
                      : 'text-[#A39BB5] hover:text-[#F8F5F0]'
                  }`}
                >
                  Dành riêng cho @{ownerName}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playCrispClick();
                    setSecretAdviceTab('partner');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    secretAdviceTab === 'partner'
                      ? 'bg-[#C9A24A] text-[#09080D] shadow'
                      : 'text-[#A39BB5] hover:text-[#F8F5F0]'
                  }`}
                >
                  Dành riêng cho @{partnerName}
                </button>
              </div>

              {/* Content Panel */}
              <div className="p-5 rounded-2xl bg-[#09080D] border border-white/10 space-y-4">
                {secretAdviceTab === 'owner' ? (
                  <>
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#E5C687] uppercase tracking-wider block">
                        Điều @{partnerName} đang âm thầm mong đợi từ bạn:
                      </span>
                      <p className="text-xs sm:text-sm text-[#D8D2E7] leading-relaxed">
                        {interpretationBundle.secretAdvice.forOwner.whatPartnerExpects}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                        Lời khuyên hành động thực tế:
                      </span>
                      <p className="text-xs sm:text-sm text-[#D8D2E7] leading-relaxed">
                        {interpretationBundle.secretAdvice.forOwner.advice}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                        Cảnh báo điều tối kỵ cần tránh:
                      </span>
                      <p className="text-xs sm:text-sm text-rose-200 leading-relaxed">
                        {interpretationBundle.secretAdvice.forOwner.caution}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#E5C687] uppercase tracking-wider block">
                        Điều @{ownerName} đang âm thầm mong đợi từ bạn:
                      </span>
                      <p className="text-xs sm:text-sm text-[#D8D2E7] leading-relaxed">
                        {interpretationBundle.secretAdvice.forPartner.whatOwnerExpects}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                        Lời khuyên hành động thực tế:
                      </span>
                      <p className="text-xs sm:text-sm text-[#D8D2E7] leading-relaxed">
                        {interpretationBundle.secretAdvice.forPartner.advice}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                        Cảnh báo điều tối kỵ cần tránh:
                      </span>
                      <p className="text-xs sm:text-sm text-rose-200 leading-relaxed">
                        {interpretationBundle.secretAdvice.forPartner.caution}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ================= KHỐI MỚI 3: THỬ THÁCH HẸN HÒ 7 NGÀY ================= */}
          {interpretationBundle && (
            <div className="rounded-3xl bg-[#12101B] border border-[#262235] p-6 sm:p-8 space-y-5">
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-widest text-[#E5C687] font-bold">
                  HÓA GIẢI RED FLAG • KẾT NỐI SÂU SẮC
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F8F5F0]">
                  Thử Thách Cặp Đôi 7 Ngày (Couple Quests)
                </h3>
                <p className="text-xs text-[#A9A1BC]">
                  3 nhiệm vụ nhỏ cùng thực hiện trong tuần này để nuôi dưỡng năng lượng tích cực cho mối quan hệ.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {interpretationBundle.coupleQuests.map((quest, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-4 rounded-2xl bg-[#09080D] border border-white/10 space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-[#A9A1BC] font-bold uppercase">
                        <span>{quest.dayLabel}</span>
                        <span className="text-base">{quest.icon}</span>
                      </div>
                      <h4 className="font-display text-sm font-bold text-[#E5C687]">
                        {quest.title}
                      </h4>
                      <p className="text-xs text-[#D8D2E7] leading-relaxed">
                        {quest.mission}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5 text-[10px] text-[#A9A1BC]">
                      🎯 <strong>Mục đích:</strong> {quest.purpose}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                soundManager.playCrispClick();
                setShowReceiptModal(true);
              }}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#C9A24A] via-[#E5C687] to-[#C9A24A] text-[#09080D] font-bold text-xs sm:text-sm shadow-[0_8px_25px_rgba(201,162,74,0.35)] hover:brightness-110 transition cursor-pointer flex items-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              <span>🧾 Xem &amp; Tải Hóa Đơn Tình Duyên (PNG)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playCrispClick();
                onOpenStoryModal(coupleReading);
              }}
              className="px-6 py-3.5 rounded-2xl bg-[#1C182A] hover:bg-[#28223B] border border-[#C9A24A]/40 text-[#E5C687] font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Xuất Ảnh Story 9:16</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ============================================================== */}
      {/* 4. MODALS: DATING RECEIPT, OUT OF QUOTA & PAYOS                */}
      {/* ============================================================== */}
      {coupleReading && (
        <CoupleDatingReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          ownerNickname={ownerName || 'Bạn'}
          partnerNickname={partnerName || 'Người ấy'}
          relationshipLabel={RELATIONSHIP_STATUS_LABELS[relationshipStatus]}
          compatScore={compatScore}
          redFlagLevel={redFlagLevel}
          readerName={coupleReading.readerDisplayName || 'Bà Cố Mở Hồn'}
          vibeTag={vibeTag}
          verdictSnippet={coupleReading.result.overall_verdict}
          savageQuote={coupleReading.result.shareable_card.savage_quote}
          c1Name={coupleReading.drawnCards[0]?.card.name_vi || 'Lá 1'}
          c2Name={coupleReading.drawnCards[1]?.card.name_vi || 'Lá 2'}
          c3Name={coupleReading.drawnCards[2]?.card.name_vi || 'Lá 3'}
        />
      )}

      {/* Out of Quota Sheet (Đổi 3 Sao hoặc nạp 5k VietQR) */}
      <OutOfQuotaDrawSheet
        isOpen={isOutOfQuotaOpen}
        onClose={() => setIsOutOfQuotaOpen(false)}
        currentStars={starsBalance}
        onDrawUnlocked={() => {
          void refreshQuota();
          if (subTab === 'solo_couple') {
            void handleRunSoloCoupleCheck();
          } else {
            void handleCreateCoopRoom();
          }
        }}
        onOpenPayOS={() => {
          setIsOutOfQuotaOpen(false);
          setIsPayOSModalOpen(true);
        }}
      />

      {/* Wallet PayOS Modal */}
      <WalletPayOSModal
        isOpen={isPayOSModalOpen}
        onClose={() => setIsPayOSModalOpen(false)}
        birthYear={birthYear}
        quota={quota}
        onQuotaUpdated={updateQuota}
      />
    </div>
  );
}

export default CoupleModeView;
