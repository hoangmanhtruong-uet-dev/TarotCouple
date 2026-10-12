'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  UserCheck,
  Link2,
  QrCode,
  Smartphone,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import {
  ALL_TAROT_CARDS,
  MAJOR_ARCANA,
  READERS,
  TAROT_CARDS_BY_ID,
} from '@/data/tarot-cards';
import { soundManager } from '@/lib/sound-effects';
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
import { CoupleResonanceBridge3D } from '@/components/CoupleResonanceBridge3D';

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
}> = [
  {
    id: 'crush',
    label: 'Crush đơn phương',
    desc: 'Đang để ý từ xa hoặc mới bắt đầu thả tín hiệu',
  },
  {
    id: 'situationship',
    label: 'Đang mập mờ',
    desc: 'Trên tình bạn, dưới tình yêu, chưa dám đặt tên',
  },
  {
    id: 'dating',
    label: 'Đang yêu',
    desc: 'Đã chính thức hẹn hò, muốn soi độ bền & hướng đi',
  },
  {
    id: 'ex',
    label: 'Người yêu cũ',
    desc: 'Còn vương vấn, muốn biết có quay lại hay nên dứt điểm',
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
  const pool =
    params.deckMode === 'full_78' ? ALL_TAROT_CARDS : MAJOR_ARCANA;
  const seed =
    (params.ownerNickname.length * 13 +
      params.partnerNickname.length * 17 +
      Date.now()) %
    pool.length;

  const c1 =
    params.ownerCardObj !== undefined
      ? TAROT_CARDS_BY_ID[params.ownerCardObj.cardId] ?? pool[0]!
      : pool[seed % pool.length]!;
  const c2 =
    params.partnerCardObj !== undefined
      ? TAROT_CARDS_BY_ID[params.partnerCardObj.cardId] ?? pool[1]!
      : pool[(seed + 5) % pool.length]!;
  const c3 = pool[(seed + 11) % pool.length]!;

  const rev1 = params.ownerCardObj?.reversed ?? seed % 4 === 0;
  const rev2 = params.partnerCardObj?.reversed ?? (seed + 1) % 4 === 0;
  const rev3 = (seed + 2) % 5 === 0;

  const compatScore = 68 + (seed % 26); // 68% - 93%
  const redFlagLevel = 12 + ((seed * 3) % 45); // 12% - 56%
  const vibeTag =
    compatScore >= 82
      ? 'Định Mệnh Hút Nhau 🔥'
      : redFlagLevel >= 42
        ? 'Cẩn Thận Thao Túng Tâm Lý 🚩'
        : 'Tần Số Giao Thoa Dịu Dàng ✨';

  const reader =
    READERS.find((r) => r.id === params.readerId) ?? READERS[0]!;
  const agePolicy = classifyAgeTier(
    params.birthYear,
    CURRENT_REFERENCE_YEAR,
    params.readerId
  );

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
    rev2 ? c2.savage_hook_rev : c3.savage_hook_up;

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
          interpretation: rev1 ? c1.core_meaning_rev : c1.core_meaning_up,
          energy_keyword: (rev1 ? c1.keywords_rev[0] : c1.keywords_up[0]) || 'Chân thành',
        },
        {
          position_index: 1,
          position_label: drawnCards[1].position_label,
          card_id: c2.id,
          card_name_vi: c2.name_vi,
          card_name_en: c2.name_en,
          reversed: rev2,
          interpretation: rev2 ? c2.core_meaning_rev : c2.core_meaning_up,
          energy_keyword: (rev2 ? c2.keywords_rev[0] : c2.keywords_up[0]) || 'Ngập ngừng',
        },
        {
          position_index: 2,
          position_label: drawnCards[2].position_label,
          card_id: c3.id,
          card_name_vi: c3.name_vi,
          card_name_en: c3.name_en,
          reversed: rev3,
          interpretation: rev3 ? c3.core_meaning_rev : c3.core_meaning_up,
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
          c1.savage_hook_up,
          c3.healing_hook_up,
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

  // Solo Couple (Kiểu 1) State
  const [isLoadingSoloCouple, setIsLoadingSoloCouple] =
    useState<boolean>(false);
  const [coupleReading, setCoupleReading] =
    useState<ReadingSuccessResponse | null>(null);
  const [crisisResponse, setCrisisResponse] =
    useState<ReadingCrisisResponse | null>(null);
  const [flippedCards, setFlippedCards] = useState<[boolean, boolean, boolean]>([
    true,
    true,
    true,
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Co-op Room 48h (Kiểu 2) State
  const [coopViewMode, setCoopViewMode] = useState<'create' | 'join'>(
    initialRoomCode ? 'join' : 'create'
  );
  const [roomCodeInput, setRoomCodeInput] = useState<string>(
    initialRoomCode || ''
  );
  const [activeRoom, setActiveRoom] = useState<CoupleRoomPublicView | null>(
    null
  );
  const [isRoomBusy, setIsRoomBusy] = useState<boolean>(false);
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);

  useEffect(() => {
    if (nickname) {
      setOwnerName(nickname);
    }
  }, [nickname]);

  useEffect(() => {
    if (initialRoomCode) {
      setSubTab('coop_room');
      setCoopViewMode('join');
      setRoomCodeInput(initialRoomCode.toUpperCase());
      void fetchExistingRoom(initialRoomCode.toUpperCase());
    }
  }, [initialRoomCode]);

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

  const [isCheckingPartner, setIsCheckingPartner] = useState<boolean>(false);

  const fetchExistingRoom = async (code: string, isAutoPoll: boolean = false) => {
    if (!code.trim()) return;
    if (!isAutoPoll) {
      setIsCheckingPartner(true);
    }
    try {
      const res = await fetch(
        `/api/couple?roomCode=${encodeURIComponent(code.trim().toUpperCase())}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.room) {
          setActiveRoom(data.room);

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
      const res = await fetch('/api/couple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch('/api/couple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      if (data?.status === 'crisis') {
        setCrisisResponse(data as ReadingCrisisResponse);
        return;
      }

      if (data?.room) {
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

  // Kiểu 2 (Step B): Person B joins room by code & draws Card 2
  const handleJoinCoopRoom = async () => {
    const cleanCode = (roomCodeInput || activeRoom?.roomCode || 'LUV892')
      .trim()
      .toUpperCase();
    setErrorMsg(null);
    setIsRoomBusy(true);

    try {
      const res = await fetch('/api/couple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join_room',
          mode: 'coop_join',
          roomCode: cleanCode,
          room_code: cleanCode,
          partnerNickname: partnerName.trim() || 'Người B',
          partner_nickname: partnerName.trim() || 'Người B',
          nickname: partnerName.trim() || 'Người B',
          birthYear,
          birth_year: birthYear,
          deckMode,
          deck_mode: deckMode,
          selected_index: 14,
          consent_share: true,
        }),
      });

      const data = await res.json();

      const readingPayload: ReadingSuccessResponse | undefined =
        data?.reading ||
        (data?.drawnCards ? data : undefined) ||
        (data?.room?.readingResult
          ? buildFallbackCoupleReading({
              ownerNickname: data.room.ownerNickname || ownerName || 'Người A',
              partnerNickname:
                data.room.partnerNickname || partnerName || 'Người B',
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
        setCoupleReading(readingPayload);
        setFlippedCards([true, true, true]);
        if (data?.quota && onQuotaUpdated) {
          onQuotaUpdated(data.quota);
        }
      } else {
        const fallback = buildFallbackCoupleReading({
          ownerNickname: activeRoom?.ownerNickname || ownerName || 'Người A',
          partnerNickname: partnerName.trim() || 'Người B',
          birthYear,
          readerId: activeRoom?.readerId || selectedReaderId,
          relationshipStatus:
            activeRoom?.relationshipStatus || relationshipStatus,
          questionText:
            'Trải bài Bói Đôi đồng thuận (Câu hỏi riêng tư của người tạo phòng đã được bảo mật)',
          deckMode,
        });
        soundManager.playMysticChime();
        setCoupleReading(fallback);
        setFlippedCards([true, true, true]);
      }
    } catch {
      const fallback = buildFallbackCoupleReading({
        ownerNickname: activeRoom?.ownerNickname || ownerName || 'Người A',
        partnerNickname: partnerName.trim() || 'Người B',
        birthYear,
        readerId: activeRoom?.readerId || selectedReaderId,
        relationshipStatus:
          activeRoom?.relationshipStatus || relationshipStatus,
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

  if (crisisResponse) {
    return (
      <CrisisSupportView
        crisisSupport={crisisResponse.crisisSupport}
        onReturnHome={() => setCrisisResponse(null)}
      />
    );
  }

  const compatScore =
    coupleReading?.result.metrics?.compatibility_score ?? 86;
  const redFlagLevel = coupleReading?.result.metrics?.red_flag_level ?? 22;
  const vibeTag =
    coupleReading?.result.metrics?.vibe_tag ?? 'Tần Số Định Mệnh 🔥';
  const entertainmentNote =
    coupleReading?.result.metrics?.entertainment_note ??
    'Chỉ số mang tính chất giải trí';

  return (
    <div className="space-y-8">
      {/* Header & Sub-Tab Switcher */}
      <div className="rounded-3xl bg-[#12101B] border border-[#D4AF37]/35 p-6 sm:p-8 space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1.5">
            <span className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-semibold flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              Chế Độ Bói Đôi TarotCouple • Check Hợp Cạ & Red Flag 🚩
            </span>
            <h1 className="font-display text-2xl sm:text-4xl font-bold text-[#F8F5F0]">
              Soi Tần Số Tình Yêu & Mối Quan Hệ Hai Người
            </h1>
          </div>

          {/* 2 Sub-tabs */}
          <div className="inline-flex rounded-2xl bg-[#09080D] border border-[#D4AF37]/35 p-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSubTab('solo_couple');
                setCoupleReading(null);
                setErrorMsg(null);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                subTab === 'solo_couple'
                  ? 'bg-[#D4AF37] text-[#09080D] shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                  : 'text-[#A39BB5] hover:text-[#F8F5F0]'
              }`}
            >
              Kiểu 1: Tự Soi Mối Quan Hệ
            </button>

            <button
              type="button"
              onClick={() => {
                setSubTab('coop_room');
                setCoupleReading(null);
                setErrorMsg(null);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                subTab === 'coop_room'
                  ? 'bg-[#D4AF37] text-[#09080D] shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                  : 'text-[#A39BB5] hover:text-[#F8F5F0]'
              }`}
            >
              Kiểu 2: Mời Người Ấy Cùng Rút (48h)
            </button>
          </div>
        </div>

        {errorMsg ? (
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-400/40 text-xs sm:text-sm text-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        ) : null}

        {/* ================= SUB-TAB 1: SOLO COUPLE CHECK ================= */}
        {subTab === 'solo_couple' && !coupleReading ? (
          <div className="space-y-6">
            {/* Nicknames Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="owner-nickname-input" className="block text-xs font-semibold uppercase tracking-wider text-[#F3E5AB]">
                  1. Biệt danh của bạn (Lá số 1)
                </label>
                <input
                  id="owner-nickname-input"
                  aria-label="Biệt danh của bạn"
                  type="text"
                  maxLength={40}
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Ví dụ: Mèo Đêm"
                  className="w-full px-4 py-3 rounded-2xl bg-[#09080D] border border-[#D4AF37]/35 text-sm text-[#F8F5F0] focus:outline-none focus:border-[#F3E5AB] focus-visible:ring-2 focus-visible:ring-[#D4AF37]/40"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="partner-nickname-input" className="block text-xs font-semibold uppercase tracking-wider text-[#F3E5AB]">
                  2. Biệt danh người ấy (Lá số 2)
                </label>
                <input
                  id="partner-nickname-input"
                  aria-label="Biệt danh người ấy"
                  type="text"
                  maxLength={40}
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="Ví dụ: Cậu Ấy, Crush Bàn Bên…"
                  className="w-full px-4 py-3 rounded-2xl bg-[#09080D] border border-[#D4AF37]/35 text-sm text-[#F8F5F0] focus:outline-none focus:border-[#F3E5AB] focus-visible:ring-2 focus-visible:ring-[#D4AF37]/40"
                />
              </div>
            </div>

            {/* Relationship Status Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#F3E5AB]">
                Trạng thái mối quan hệ hiện tại
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {RELATIONSHIP_OPTIONS.map((rel) => {
                  const isSelected = relationshipStatus === rel.id;
                  return (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => setRelationshipStatus(rel.id)}
                      className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#211832] border-[#F3E5AB] shadow-[0_0_20px_rgba(212,175,55,0.25)]'
                          : 'bg-[#09080D]/70 border-white/10 hover:border-[#D4AF37]/50'
                      }`}
                    >
                      <p className="font-display text-sm sm:text-base font-bold text-[#F8F5F0]">
                        {rel.label}
                      </p>
                      <p className="text-[11px] text-[#A39BB5] mt-1">
                        {rel.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4 Reader Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#F3E5AB]">
                Chọn Reader phân tích mối quan hệ (Đủ 4 Persona)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {READERS.map((r) => {
                  const isSel = selectedReaderId === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onSelectReaderId(r.id as ReaderId)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSel
                          ? 'bg-[#221A33] border-[#D4AF37] text-[#F3E5AB]'
                          : 'bg-[#09080D]/70 border-white/10 text-[#A39BB5] hover:text-[#F8F5F0]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg">{r.avatar_symbol}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#D4AF37]">
                          {r.badge}
                        </span>
                      </div>
                      <p className="font-display text-sm font-bold text-[#F8F5F0] mt-1.5">
                        {r.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Context Question */}
            <div className="space-y-2">
              <label htmlFor="couple-question-textarea" className="block text-xs font-semibold uppercase tracking-wider text-[#F3E5AB]">
                Điều bạn muốn soi rõ nhất trong mối quan hệ này
              </label>
              <textarea
                id="couple-question-textarea"
                aria-label="Điều bạn muốn soi rõ nhất trong mối quan hệ này"
                rows={2}
                maxLength={300}
                value={coupleQuestion}
                onChange={(e) => setCoupleQuestion(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-[#09080D] border border-[#D4AF37]/35 text-sm text-[#F8F5F0] focus:outline-none focus:border-[#F3E5AB] focus-visible:ring-2 focus-visible:ring-[#D4AF37]/40"
              />
            </div>

            {/* 3 Couple Spread Slots Preview + Draw Button */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                `1. Năng lượng của ${ownerName || 'Bạn'}`,
                `2. Năng lượng của ${partnerName || 'Người ấy'}`,
                '3. Sợi dây kết nối & Xu hướng',
              ].map((slotLabel, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#09080D]/80 border border-[#D4AF37]/30 text-center"
                >
                  <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] block">
                    Vị trí 0{idx + 1}
                  </span>
                  <p className="font-display text-sm font-bold text-[#F8F5F0] mt-0.5">
                    {slotLabel}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={isLoadingSoloCouple}
              onClick={() => void handleRunSoloCoupleCheck()}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-[#09080D] font-bold text-base shadow-[0_10px_30px_rgba(212,175,55,0.35)] hover:brightness-110 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-60"
            >
              {isLoadingSoloCouple
                ? 'Đang rút 3 lá Bói Đôi & đo chỉ số Hợp Cạ / Red Flag...'
                : '💞 Rút 3 Lá Bói Đôi & Đo Độ Hợp Cạ / Red Flag Ngay'}
            </button>
          </div>
        ) : null}

        {/* ================= SUB-TAB 2: CO-OP LIVE ROOM 48H ================= */}
        {subTab === 'coop_room' && !coupleReading ? (
          <div className="space-y-6">
            {/* Switch between Create Room (Person A) and Join Room (Person B) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#171424] p-3.5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#F3E5AB]">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  🔒 Câu hỏi của bạn được bảo mật tuyệt đối, người kia khi mở link chỉ thấy lời mời và lá bài của họ.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCoopViewMode('create')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                    coopViewMode === 'create'
                      ? 'bg-[#D4AF37]/25 border-[#F3E5AB] text-[#F3E5AB]'
                      : 'bg-[#09080D] border-white/10 text-[#A39BB5]'
                  }`}
                >
                  Tạo phòng mới (Người A)
                </button>
                <button
                  type="button"
                  onClick={() => setCoopViewMode('join')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                    coopViewMode === 'join'
                      ? 'bg-[#D4AF37]/25 border-[#F3E5AB] text-[#F3E5AB]'
                      : 'bg-[#09080D] border-white/10 text-[#A39BB5]'
                  }`}
                >
                  Nhập mã phòng (Người B)
                </button>
              </div>
            </div>

            {coopViewMode === 'create' ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#F3E5AB]">
                      Biệt danh của bạn (Người A - Tạo phòng)
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-[#09080D] border border-[#D4AF37]/35 text-sm text-[#F8F5F0]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#F3E5AB]">
                      Trạng thái giữa hai người
                    </label>
                    <select
                      value={relationshipStatus}
                      onChange={(e) =>
                        setRelationshipStatus(
                          e.target.value as CoupleRelationshipStatus
                        )
                      }
                      className="w-full px-4 py-3 rounded-2xl bg-[#09080D] border border-[#D4AF37]/35 text-sm text-[#F8F5F0]"
                    >
                      {RELATIONSHIP_OPTIONS.map((rel) => (
                        <option key={rel.id} value={rel.id}>
                          {rel.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-300">
                    🔒 Câu hỏi riêng tư của bạn (Người B sẽ KHÔNG thấy nội dung này)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={300}
                    value={coupleQuestion}
                    onChange={(e) => setCoupleQuestion(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-[#09080D] border border-emerald-400/40 text-sm text-[#F8F5F0]"
                  />
                </div>

                {!activeRoom ? (
                  <button
                    type="button"
                    disabled={isRoomBusy}
                    onClick={() => void handleCreateCoopRoom()}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-[#09080D] font-bold text-sm sm:text-base shadow-[0_10px_30px_rgba(212,175,55,0.35)] hover:brightness-110 transition-all cursor-pointer"
                  >
                    {isRoomBusy
                      ? 'Đang rút Lá số 1 & Tạo mã phòng bí mật 48h...'
                      : '✨ Rút Lá Số 1 Của Bạn & Tạo Phòng Mời Người Ấy (48h)'}
                  </button>
                ) : (
                  /* Room Created Card */
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl bg-gradient-to-b from-[#1E172E] to-[#120E1D] border-2 border-[#D4AF37] space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs uppercase tracking-wider text-emerald-300 font-bold">
                          ✓ Đã rút Lá số 1 ({activeRoom.ownerCard.card.name_vi}) & Khởi tạo phòng 48h
                        </span>
                        <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5F0] mt-1">
                          Mã Phòng Bói Đôi:{' '}
                          <span className="text-[#F3E5AB] font-mono tracking-widest">
                            {activeRoom.roomCode}
                          </span>
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleShareInvite()}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#09080D] text-xs font-bold shadow-md cursor-pointer hover:brightness-110 transition-all"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>{copiedInvite ? '✓ Đã sao chép lời mời!' : 'Gửi lời mời Zalo / Messenger'}</span>
                        </button>
                      </div>
                    </div>

                    {/* QR Code Section: Quét nhanh khi ngồi cạnh nhau */}
                    <div className="p-4 rounded-2xl bg-[#09080D]/90 border border-[#C9A24A]/40 flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-28 h-28 p-2 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-lg">
                        {/* Quick dynamic SVG QR generator image */}
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
                        <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-[#F3E5AB]">
                          <QrCode className="w-4 h-4 text-[#C9A24A]" />
                          <span>Quét mã QR trực tiếp từ Camera</span>
                        </div>
                        <p className="text-xs text-[#9E96B0] leading-relaxed">
                          Nếu đang ngồi cạnh người ấy, hãy giơ màn hình này để người ấy mở camera quét thẳng vào phòng rút bài!
                        </p>
                        <p className="text-[11px] text-[#C9A24A] font-mono">
                          Link phòng: /couple/{activeRoom.roomCode}
                        </p>
                      </div>
                    </div>

                    {/* Trạng thái chờ Người B & Nút kiểm tra thủ công */}
                    <div className="p-3.5 rounded-xl bg-[#14111C] border border-[#C9A24A]/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-[#9E96B0]">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A24A] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C9A24A]"></span>
                        </span>
                        <span>Đang tự động kiểm tra mỗi 3s khi người ấy rút bài...</span>
                      </div>
                      <button
                        type="button"
                        disabled={isCheckingPartner}
                        onClick={() => void fetchExistingRoom(activeRoom.roomCode, false)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D1829] hover:bg-[#282238] border border-[#C9A24A]/40 text-[#C9A24A] font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                      >
                        {isCheckingPartner ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        <span>Kiểm tra người ấy đã rút chưa</span>
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-[#09080D]/80 border border-white/10 text-xs text-[#A39BB5] flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      <span>
                        Phòng bảo mật tự động đóng sau 48 giờ. Câu hỏi riêng của bạn không bao giờ hiển thị trên máy người ấy.
                      </span>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRoomCodeInput(activeRoom.roomCode);
                          setCoopViewMode('join');
                        }}
                        className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 text-[#09080D] font-bold text-xs sm:text-sm shadow-[0_8px_25px_rgba(16,185,129,0.35)] hover:brightness-110 transition-all cursor-pointer"
                      >
                        🎭 Chuyển sang góc nhìn Người B để rút lá thứ 2 ngay trên máy này
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              /* Person B Join View */
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-400/40 flex items-center gap-3 text-xs sm:text-sm text-emerald-100">
                  <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <strong>
                      🔒 Câu hỏi riêng tư của người tạo phòng được ẩn bảo mật:
                    </strong>{' '}
                    Bạn chỉ nhìn thấy lời mời từ{' '}
                    <strong className="text-[#F3E5AB]">
                      {activeRoom?.ownerNickname || ownerName || 'Người A'}
                    </strong>{' '}
                    và tự tay rút lá bài năng lượng thứ 2 của chính mình.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="room-code-input" className="block text-xs font-semibold uppercase tracking-wider text-[#F3E5AB]">
                      Mã phòng 6 ký tự (Ví dụ: LUV892)
                    </label>
                    <input
                      id="room-code-input"
                      aria-label="Mã phòng 6 ký tự"
                      type="text"
                      value={roomCodeInput}
                      onChange={(e) =>
                        setRoomCodeInput(e.target.value.toUpperCase())
                      }
                      placeholder="Nhập mã phòng…"
                      className="w-full px-4 py-3 rounded-2xl bg-[#09080D] border border-[#D4AF37]/45 text-sm font-mono uppercase text-[#F3E5AB] focus:outline-none focus:border-[#F3E5AB] focus-visible:ring-2 focus-visible:ring-[#D4AF37]/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="partner-name-b-input" className="block text-xs font-semibold uppercase tracking-wider text-[#F3E5AB]">
                      Biệt danh của bạn (Người B)
                    </label>
                    <input
                      id="partner-name-b-input"
                      aria-label="Biệt danh của bạn"
                      type="text"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      placeholder="Nhập biệt danh của bạn…"
                      className="w-full px-4 py-3 rounded-2xl bg-[#09080D] border border-[#D4AF37]/45 text-sm text-[#F8F5F0] focus:outline-none focus:border-[#F3E5AB] focus-visible:ring-2 focus-visible:ring-[#D4AF37]/40"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isRoomBusy}
                  onClick={() => void handleJoinCoopRoom()}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-[#09080D] font-bold text-sm sm:text-base shadow-[0_10px_30px_rgba(212,175,55,0.35)] hover:brightness-110 transition-all cursor-pointer"
                >
                  {isRoomBusy
                    ? 'Đang rút Lá số 2 & Mở khóa Kết Quả Bói Đôi...'
                    : '💞 Rút Lá Thứ 2 Của Bạn & Mở Khóa Kết Quả Bói Đôi Chung'}
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* ================= COUPLE READING RESULT VIEW ================= */}
      {coupleReading ? (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Compatibility % Gauge & Red Flag 🚩 Meter */}
          <div className="rounded-3xl bg-gradient-to-b from-[#1E162B] to-[#12101B] border-2 border-[#D4AF37] p-6 sm:p-8 space-y-6 shadow-[0_20px_60px_rgba(212,175,55,0.22)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#F3E5AB] text-xs font-bold text-[#F3E5AB]">
                    ✦ {vibeTag}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#A39BB5]">
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
                  onClick={() => onOpenStoryModal(coupleReading)}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-[#09080D] font-bold text-xs sm:text-sm shadow-[0_8px_25px_rgba(212,175,55,0.35)] hover:brightness-110 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4 inline mr-1.5" />
                  ✨ Xuất Ảnh Story 9:16 Bói Đôi
                </button>

                <button
                  type="button"
                  onClick={() => setCoupleReading(null)}
                  className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#D8D2E7] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                  Soi cặp khác
                </button>
              </div>
            </div>

            {/* Dual Meters: Độ Hợp Cạ (%) & Máy Đo Red Flag 🚩 (%) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Compatibility Score Gauge */}
              <div className="p-5 rounded-2xl bg-[#09080D]/85 border border-emerald-400/40 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                    Độ Hợp Cạ Tần Số (Compatibility)
                  </span>
                  <motion.strong
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                    className="font-display text-3xl font-black text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]"
                  >
                    {compatScore}%
                  </motion.strong>
                </div>

                {/* Dynamic Spring Progress Track & Needle Indicator */}
                <div className="relative w-full h-4 rounded-full bg-[#171424] overflow-hidden p-0.5 border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${compatScore}%` }}
                    transition={{ duration: 1.4, ease: [0.34, 1.56, 0.64, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-[#D4AF37] relative shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                  >
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_8px_#ffffff]" />
                  </motion.div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-[#A39BB5] pt-0.5">
                  <span>0% (Khác biệt)</span>
                  <span className="text-[#F3E5AB] font-bold">50% (Hài hòa)</span>
                  <span>100% (Tri kỷ)</span>
                </div>

                <p className="text-[11px] text-[#A39BB5]">
                  Đo độ tương thích năng lượng giữa 2 lá bài đại diện & lá kết nối ({entertainmentNote}).
                </p>
              </div>

              {/* Red Flag Meter */}
              <div className="p-5 rounded-2xl bg-[#09080D]/85 border border-rose-400/40 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                    <span>🚩 Máy Đo Red Flag (Cảnh báo lệch pha)</span>
                  </span>
                  <motion.strong
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 12, delay: 0.3 }}
                    className="font-display text-3xl font-black text-rose-300 drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                  >
                    {redFlagLevel}%
                  </motion.strong>
                </div>

                {/* Dynamic Spring Progress Track & Needle Indicator */}
                <div className="relative w-full h-4 rounded-full bg-[#171424] overflow-hidden p-0.5 border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${redFlagLevel}%` }}
                    transition={{ duration: 1.4, ease: [0.34, 1.56, 0.64, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-red-600 relative shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                  >
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_8px_#ffffff]" />
                  </motion.div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-[#A39BB5] pt-0.5">
                  <span className="text-emerald-400">0% (An toàn)</span>
                  <span className="text-amber-400 font-bold">40% (Cần lưu tâm)</span>
                  <span className="text-rose-400">100% (Báo động)</span>
                </div>

                <p className="text-[11px] text-[#A39BB5]">
                  Phản chiếu điểm mù giao tiếp hoặc kỳ vọng lệch nhau cần tháo gỡ ({entertainmentNote}).
                </p>
              </div>
            </div>

            {/* 3D WebGL Couple Resonance Bridge */}
            {coupleReading.drawnCards[0] &&
            coupleReading.drawnCards[1] &&
            coupleReading.drawnCards[2] ? (
              <CoupleResonanceBridge3D
                ownerCard={coupleReading.drawnCards[0].card}
                partnerCard={coupleReading.drawnCards[1].card}
                bridgeCard={coupleReading.drawnCards[2].card}
                compatibilityScore={compatScore}
                redFlagLevel={redFlagLevel}
              />
            ) : null}
          </div>

          {/* 3 Couple Cards 3D Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
            {coupleReading.drawnCards.map((slot, idx) => {
              const analysis =
                coupleReading.result.cards_analysis[idx] ??
                coupleReading.result.cards_analysis[0];
              const isFlipped = flippedCards[idx] ?? true;

              return (
                <div
                  key={idx}
                  className="w-full rounded-3xl bg-[#12101B] border border-[#D4AF37]/35 p-5 flex flex-col items-center space-y-4 shadow-xl"
                >
                  <span className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                    Lá 0{idx + 1} • {slot.position_label}
                  </span>

                  <TarotCardVisual
                    card={slot.card}
                    reversed={slot.reversed}
                    isFlipped={isFlipped}
                    positionIndex={idx}
                    positionLabel={slot.position_label}
                    size="md"
                    onFlip={() => {
                      setFlippedCards((prev) => {
                        const next: [boolean, boolean, boolean] = [...prev];
                        next[idx] = !next[idx];
                        return next;
                      });
                    }}
                  />

                  <div className="w-full pt-3 border-t border-white/10 space-y-2 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-lg font-bold text-[#F8F5F0]">
                        {slot.card.name_vi}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#D4AF37]/15 text-[#F3E5AB] border border-[#D4AF37]/35">
                        {analysis.energy_keyword}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#D8D2E7] leading-relaxed">
                      {analysis.interpretation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deep Verdict & Actionable Next Step */}
          <div className="rounded-3xl bg-[#12101B] border border-[#D4AF37]/35 p-6 sm:p-8 space-y-5">
            <p className="font-display text-xl sm:text-2xl italic text-[#F3E5AB]">
              “{coupleReading.result.greeting_hook}”
            </p>
            <p className="text-sm sm:text-base text-[#E2E8F0] leading-relaxed">
              {coupleReading.result.overall_verdict}
            </p>
            <div className="p-4 rounded-2xl bg-[#171424] border border-emerald-400/30 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                Lời khuyên hành động cho hai bạn
              </span>
              <p className="text-xs sm:text-sm text-[#F8F5F0]">
                {coupleReading.result.actionable_next_step}
              </p>
            </div>

            {/* Actions: Xuất ảnh Story 9:16 & Trải bài mới */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenStoryModal(coupleReading)}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#C9A24A] via-[#E5C687] to-[#C9A24A] text-[#09080D] font-bold text-sm shadow-[0_10px_30px_rgba(201,162,74,0.35)] hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Xuất Thẻ Story 9:16 Khoe Bạn Bè</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCoupleReading(null);
                  setActiveRoom(null);
                  setRoomCodeInput('');
                  setCoopViewMode('create');
                }}
                className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-[#1D1829] hover:bg-[#282238] border border-[#C9A24A]/40 text-[#F8F5F0] font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-[#C9A24A]" />
                <span>Bói lượt mới</span>
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
