'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useReadingStore } from '@/lib/reading-store';
import { classifyAgeTier } from '@/lib/safety';
import { CURRENT_REFERENCE_YEAR, type TopicId, type ReaderId } from '@/lib/schemas';
import { READERS } from '@/data/tarot-cards';
import {
  ArrowLeft,
  Heart,
  Briefcase,
  Coins,
  Sparkles,
  GraduationCap,
  Sun,
  ShieldCheck,
  Check,
} from 'lucide-react';

// Mystical Tarot Card SVG Artworks for each topic (matches reference artwork style)
function MysticLoveCardArt() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer subtle cosmic burst */}
      <circle cx="80" cy="110" r="50" stroke="#C9A24A" strokeWidth="0.7" strokeDasharray="2 3" opacity="0.4" />
      <circle cx="80" cy="110" r="68" stroke="#C9A24A" strokeWidth="0.5" opacity="0.25" />
      
      {/* Top Left Crescent Moon */}
      <path
        d="M60 25 C78 25, 88 40, 84 58 C72 56, 52 48, 50 38 C48 30, 52 26, 60 25 Z"
        fill="#C9A24A"
        opacity="0.9"
      />
      {/* Moon profile nose & face */}
      <circle cx="62" cy="38" r="1.5" fill="#14121F" />
      <path d="M58 45 Q64 48 60 52" stroke="#14121F" strokeWidth="1" fill="none" />

      {/* Center Radiant Sun */}
      <g transform="translate(80, 110)">
        {/* Sun rays */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <path
            key={deg}
            d="M0 -30 L4 -20 L0 -16 L-4 -20 Z"
            fill="#C9A24A"
            transform={`rotate(${deg})`}
            opacity="0.85"
          />
        ))}
        {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((deg) => (
          <line
            key={deg}
            x1="0"
            y1="-18"
            x2="0"
            y2="-26"
            stroke="#C9A24A"
            strokeWidth="1.2"
            transform={`rotate(${deg})`}
            opacity="0.6"
          />
        ))}
        {/* Sun core circle */}
        <circle cx="0" cy="0" r="15" fill="#C9A24A" />
        {/* Sun serene face */}
        <circle cx="-5" cy="-3" r="1.2" fill="#14121F" />
        <circle cx="5" cy="-3" r="1.2" fill="#14121F" />
        <path d="M-4 4 Q0 8 4 4" stroke="#14121F" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <circle cx="-7" cy="1" r="1.5" fill="#C9A24A" opacity="0.6" />
        <circle cx="7" cy="1" r="1.5" fill="#C9A24A" opacity="0.6" />
      </g>

      {/* Bottom Right Crescent Moon */}
      <path
        d="M100 195 C82 195, 72 180, 76 162 C88 164, 108 172, 110 182 C112 190, 108 194, 100 195 Z"
        fill="#C9A24A"
        opacity="0.9"
      />
      <circle cx="98" cy="182" r="1.5" fill="#14121F" />
      <path d="M102 175 Q96 172 100 168" stroke="#14121F" strokeWidth="1" fill="none" />

      {/* Twinkling stars & celestial dots */}
      <circle cx="32" cy="75" r="1.5" fill="#C9A24A" opacity="0.7" />
      <circle cx="45" cy="85" r="1" fill="#C9A24A" opacity="0.5" />
      <circle cx="125" cy="65" r="1.5" fill="#C9A24A" opacity="0.8" />
      <circle cx="135" cy="95" r="1" fill="#C9A24A" opacity="0.6" />
      <circle cx="35" cy="155" r="1.5" fill="#C9A24A" opacity="0.7" />
      <circle cx="128" cy="145" r="1" fill="#C9A24A" opacity="0.6" />
      {/* 4-point sparkle */}
      <path d="M115 45 Q115 50 120 50 Q115 50 115 55 Q115 50 110 50 Q115 50 115 45 Z" fill="#C9A24A" opacity="0.8" />
      <path d="M40 125 Q40 129 44 129 Q40 129 40 133 Q40 129 36 129 Q40 129 40 125 Z" fill="#C9A24A" opacity="0.7" />
    </svg>
  );
}

function MysticCareerCardArt() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cosmic background rings & infinity loops */}
      <ellipse cx="80" cy="110" rx="55" ry="70" stroke="#C9A24A" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.35" />
      <path
        d="M45 70 C45 35, 115 35, 115 70 C115 105, 45 115, 45 150 C45 185, 115 185, 115 150"
        stroke="#C9A24A"
        strokeWidth="0.8"
        opacity="0.3"
      />
      <path
        d="M115 70 C115 35, 45 35, 45 70 C45 105, 115 115, 115 150 C115 185, 45 185, 45 150"
        stroke="#C9A24A"
        strokeWidth="0.8"
        opacity="0.3"
      />

      {/* Hourglass Frame */}
      <g transform="translate(80, 110)">
        {/* Top & Bottom base plates */}
        <rect x="-38" y="-72" width="76" height="6" rx="2" fill="#C9A24A" opacity="0.9" />
        <rect x="-32" y="-66" width="64" height="3" fill="#C9A24A" opacity="0.7" />
        <rect x="-38" y="66" width="76" height="6" rx="2" fill="#C9A24A" opacity="0.9" />
        <rect x="-32" y="63" width="64" height="3" fill="#C9A24A" opacity="0.7" />

        {/* Hourglass Glass Silhouette */}
        <path
          d="M-30 -63 C-28 -20, -6 -6, 0 0 C6 -6, 28 -20, 30 -63 Z"
          stroke="#C9A24A"
          strokeWidth="2"
          fill="#14121F"
          fillOpacity="0.4"
        />
        <path
          d="M-30 63 C-28 20, -6 6, 0 0 C6 6, 28 20, 30 63 Z"
          stroke="#C9A24A"
          strokeWidth="2"
          fill="#14121F"
          fillOpacity="0.4"
        />

        {/* Top Chamber: Radiant Sun within the sand */}
        <g transform="translate(0, -34)">
          <circle cx="0" cy="0" r="10" fill="#C9A24A" opacity="0.9" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="0"
              y1="-12"
              x2="0"
              y2="-17"
              stroke="#C9A24A"
              strokeWidth="1.5"
              transform={`rotate(${deg})`}
              opacity="0.8"
            />
          ))}
          <circle cx="-3" cy="-2" r="1" fill="#14121F" />
          <circle cx="3" cy="-2" r="1" fill="#14121F" />
          <path d="M-2 3 Q0 5 2 3" stroke="#14121F" strokeWidth="1" fill="none" />
        </g>

        {/* Bottom Chamber: Mystic Moon resting in the sand */}
        <g transform="translate(0, 34)">
          <path
            d="M-5 -12 C8 -12, 14 -2, 10 12 C1 10, -10 3, -11 -4 C-12 -9, -9 -11, -5 -12 Z"
            fill="#C9A24A"
            opacity="0.9"
          />
          <circle cx="-4" cy="-2" r="1" fill="#14121F" />
          {/* Subtle sand stipples */}
          <circle cx="-12" cy="18" r="0.8" fill="#C9A24A" opacity="0.7" />
          <circle cx="-4" cy="20" r="0.8" fill="#C9A24A" opacity="0.7" />
          <circle cx="6" cy="19" r="0.8" fill="#C9A24A" opacity="0.7" />
          <circle cx="14" cy="17" r="0.8" fill="#C9A24A" opacity="0.7" />
        </g>

        {/* Flowing Sand Particles down the neck */}
        <circle cx="0" cy="-3" r="1.2" fill="#C9A24A" />
        <circle cx="0" cy="3" r="1" fill="#C9A24A" opacity="0.8" />
        <circle cx="0" cy="10" r="1" fill="#C9A24A" opacity="0.8" />
      </g>

      {/* Surrounding constellation stars */}
      <circle cx="28" cy="45" r="1.5" fill="#C9A24A" opacity="0.7" />
      <circle cx="132" cy="48" r="1.2" fill="#C9A24A" opacity="0.6" />
      <circle cx="26" cy="175" r="1.2" fill="#C9A24A" opacity="0.6" />
      <circle cx="134" cy="172" r="1.5" fill="#C9A24A" opacity="0.7" />
      <path d="M130 110 Q130 114 134 114 Q130 114 130 118 Q130 114 126 114 Q130 114 130 110 Z" fill="#C9A24A" opacity="0.75" />
    </svg>
  );
}

function MysticFinanceCardArt() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sacred geometry triangles (Merkaba / Star of David / Alchemy) */}
      <g transform="translate(80, 110)">
        {/* Upward alchemy triangle */}
        <polygon points="0,-72 62,36 -62,36" stroke="#C9A24A" strokeWidth="1" opacity="0.4" fill="none" />
        <polygon points="0,-64 54,30 -54,30" stroke="#C9A24A" strokeWidth="0.5" opacity="0.25" fill="none" />
        {/* Downward alchemy triangle */}
        <polygon points="0,72 62,-36 -62,-36" stroke="#C9A24A" strokeWidth="1" opacity="0.4" fill="none" />
        <polygon points="0,64 54,-30 -54,-30" stroke="#C9A24A" strokeWidth="0.5" opacity="0.25" fill="none" />

        {/* Outer radial rays */}
        {[0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345].map((deg) => (
          <path
            key={deg}
            d="M0 -42 L5 -32 L0 -26 L-5 -32 Z"
            fill="#C9A24A"
            transform={`rotate(${deg})`}
            opacity={deg % 30 === 0 ? '0.9' : '0.6'}
          />
        ))}

        {/* Center Golden Radiant Sun Face */}
        <circle cx="0" cy="0" r="26" fill="#C9A24A" />
        {/* Ornate facial details */}
        <circle cx="-8" cy="-5" r="2" fill="#14121F" />
        <circle cx="8" cy="-5" r="2" fill="#14121F" />
        <path d="M-12 -9 Q-8 -12 -4 -9" stroke="#14121F" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M4 -9 Q8 -12 12 -9" stroke="#14121F" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        {/* Nose & benevolent lips */}
        <path d="M0 -4 L0 2 Q-2 4 0 5 Q2 4 0 2" stroke="#14121F" strokeWidth="1" fill="none" />
        <path d="M-6 9 Q0 15 6 9" stroke="#14121F" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <path d="M-4 10 Q0 13 4 10" stroke="#14121F" strokeWidth="1" strokeLinecap="round" fill="none" />
        {/* Rosy cheek stipples */}
        <circle cx="-14" cy="2" r="1.5" fill="#14121F" opacity="0.4" />
        <circle cx="-16" cy="4" r="1" fill="#14121F" opacity="0.3" />
        <circle cx="14" cy="2" r="1.5" fill="#14121F" opacity="0.4" />
        <circle cx="16" cy="4" r="1" fill="#14121F" opacity="0.3" />
      </g>

      {/* Radiating corner sparkles */}
      <circle cx="28" cy="30" r="1.5" fill="#C9A24A" opacity="0.8" />
      <circle cx="132" cy="30" r="1.5" fill="#C9A24A" opacity="0.8" />
      <circle cx="28" cy="190" r="1.5" fill="#C9A24A" opacity="0.8" />
      <circle cx="132" cy="190" r="1.5" fill="#C9A24A" opacity="0.8" />
      <path d="M80 18 Q80 22 84 22 Q80 22 80 26 Q80 22 76 22 Q80 22 80 18 Z" fill="#C9A24A" opacity="0.85" />
      <path d="M80 194 Q80 198 84 198 Q80 198 80 202 Q80 198 76 198 Q80 198 80 194 Z" fill="#C9A24A" opacity="0.85" />
    </svg>
  );
}

function MysticHealthCardArt() {
  return (
    <svg viewBox="0 0 160 220" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background celestial rays */}
      <circle cx="80" cy="110" r="60" stroke="#C9A24A" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />
      
      {/* Mystical Serpent Coiling (Ouroboros / Asclepius Caduceus Rod) */}
      <g transform="translate(80, 110)">
        {/* Serpent body coils */}
        <path
          d="M-5 -75 C-12 -65, -8 -50, 2 -40 C14 -28, 22 -10, 10 5 C-2 20, -18 35, -4 55 C6 68, -2 80, 0 85"
          stroke="#C9A24A"
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
        {/* Dark inner spinal ribbing */}
        <path
          d="M-5 -75 C-12 -65, -8 -50, 2 -40 C14 -28, 22 -10, 10 5 C-2 20, -18 35, -4 55 C6 68, -2 80, 0 85"
          stroke="#14121F"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="2 3"
          fill="none"
        />

        {/* Serpent Head & Crown */}
        <path
          d="M-5 -75 C-10 -78, -12 -86, -6 -90 C-1 -94, 2 -90, 4 -86 C5 -81, 0 -76, -5 -75 Z"
          fill="#C9A24A"
        />
        <circle cx="-5" cy="-86" r="1.3" fill="#14121F" />
        {/* Serpent Tongue flick */}
        <path d="M-3 -92 L-3 -98 L-6 -101 M-3 -98 L0 -101" stroke="#C9A24A" strokeWidth="1" strokeLinecap="round" />

        {/* Serpent Tail rattle */}
        <path d="M0 85 L2 92 M0 87 L-2 90" stroke="#C9A24A" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Twinkling stars around the serpent */}
      <circle cx="35" cy="55" r="1.5" fill="#C9A24A" opacity="0.8" />
      <circle cx="48" cy="72" r="1" fill="#C9A24A" opacity="0.6" />
      <circle cx="122" cy="60" r="1.5" fill="#C9A24A" opacity="0.8" />
      <circle cx="130" cy="80" r="1" fill="#C9A24A" opacity="0.6" />
      <circle cx="32" cy="150" r="1.5" fill="#C9A24A" opacity="0.8" />
      <circle cx="124" cy="155" r="1.2" fill="#C9A24A" opacity="0.7" />
      <path d="M125 110 Q125 114 129 114 Q125 114 125 118 Q125 114 121 114 Q125 114 125 110 Z" fill="#C9A24A" opacity="0.8" />
    </svg>
  );
}

// Map each TopicId to its Tarot Card display metadata & artwork
const TAROT_TOPIC_CONFIG: Record<
  TopicId,
  {
    titleVi: string;
    description: string;
    artwork: React.ComponentType;
  }
> = {
  love: {
    titleVi: 'TÌNH CẢM',
    description: 'Tình duyên, crush, mập mờ hoặc người thương hiện tại',
    artwork: MysticLoveCardArt,
  },
  career: {
    titleVi: 'CÔNG VIỆC',
    description: 'Định hướng sự nghiệp, công việc, tháo gỡ trì hoãn',
    artwork: MysticCareerCardArt,
  },
  finance: {
    titleVi: 'TÀI CHÍNH',
    description: 'Dòng tiền tài lộc, cơ hội sắp tới và tích lũy',
    artwork: MysticFinanceCardArt,
  },
  crush_school: {
    titleVi: 'TÌNH BẠN & CRUSH',
    description: 'Chuyện bạn bè, crush trường lớp trong sáng',
    artwork: MysticLoveCardArt,
  },
  study: {
    titleVi: 'HỌC TẬP',
    description: 'Thi cử, bài vở, phương pháp học tập bứt phá',
    artwork: MysticCareerCardArt,
  },
  daily_luck: {
    titleVi: 'VẬN MAY',
    description: 'Năng lượng ngày mới, niềm vui và sự tích cực',
    artwork: MysticFinanceCardArt,
  },
};

const SAMPLE_PROMPT_BY_TOPIC: Record<TopicId, string> = {
  love: 'Người ấy im lặng 3 ngày nay là đang bận thật hay đang âm thầm ghost mình vậy?',
  career: 'Mình đang phân vân giữa việc nhảy việc sang môi trường mới hay ở lại chờ cơ hội?',
  finance: 'Tình hình tài chính tháng này của mình cần lưu ý lỗ hổng chi tiêu nào nhất?',
  crush_school: 'Bạn ngồi bàn bên dạo này hay nhìn mình cười, không biết bạn ấy nghĩ gì về mình nhỉ?',
  study: 'Kỳ thi học kỳ sắp tới mình nên tập trung ôn luyện thế nào để đạt điểm cao nhất?',
  daily_luck: 'Tuần mới của mình trên trường sẽ có niềm vui hay điều bất ngờ dễ thương nào?',
};

const READER_GREETINGS: Record<ReaderId, string> = {
  ba_ngoai:
    'Hôm nay điều gì đang nằm trong lòng con? Kể bà nghe một chút nào.',
  chi_dai:
    'Nói thẳng nha, đừng vòng vo. Đang vướng mắc chuyện gì thì chọn chủ đề đi!',
  ban_than:
    'Kể đi, tao nghe hết, không phán xét đâu. Đang vướng drama gì chọn lẹ nào bồ!',
  thay_cu_meo:
    'Hãy bắt đầu từ điều khiến con bận tâm nhất. Chọn chủ đề cốt lõi để cùng phân tích.',
  ba_co_mo_hon:
    'Nào, đêm nay muốn soi chuyện gì? Chọn một chủ đề để Bà Cố mổ xẻ tận gốc rễ nào!',
  tien_tu_chua_lanh:
    'Chào bạn thương. Hãy lắng nghe trái tim bạn đang rung động vì chủ đề nào nhất nhé...',
  tong_tai_ly_tri:
    'Xác định bài toán chính cần giải quyết. Hãy chọn một chủ đề trọng tâm để bắt đầu phân tích.',
  phap_su_toi_co:
    'Vũ trụ đang lắng nghe tần số của bạn. Hãy chọn cánh cổng chủ đề dẫn lối định mệnh...',
};

export default function ChuDeSelectionPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const {
    selectedReaderId,
    readerAccentColor,
    hasFilledProfile,
    nickname,
    birthYear,
    selectedTopic,
    questionText,
    setContextForm,
  } = useReadingStore();

  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Route guard: Nếu chưa điền thông tin Về Bạn thì chuyển về /reading/ve-ban
  useEffect(() => {
    if (!isHydrated) return;
    const hasProfile = hasFilledProfile && Boolean(nickname?.trim()) && Boolean(birthYear);
    if (!hasProfile) {
      router.replace('/reading/ve-ban');
    }
  }, [isHydrated, hasFilledProfile, nickname, birthYear, router]);

  const activeReader = READERS.find((r) => r.id === selectedReaderId) || READERS[0]!;

  const agePolicy = useMemo(
    () => classifyAgeTier(birthYear, CURRENT_REFERENCE_YEAR, selectedReaderId),
    [birthYear, selectedReaderId]
  );

  const [tappedTopicId, setTappedTopicId] = useState<TopicId | null>(null);

  // Typewriter greeting
  const readerGreeting = READER_GREETINGS[selectedReaderId] || READER_GREETINGS.ba_ngoai;
  const [displayedGreeting, setDisplayedGreeting] = useState('');
  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayedGreeting(readerGreeting);
      return;
    }
    setDisplayedGreeting('');
    let idx = 0;
    const timer = setInterval(() => {
      idx++;
      setDisplayedGreeting(readerGreeting.slice(0, idx));
      if (idx >= readerGreeting.length) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [readerGreeting, shouldReduceMotion]);

  // Ensure current topic is allowed
  useEffect(() => {
    const isTopicAllowed = agePolicy.allowedTopics.some((t) => t.id === selectedTopic);
    if (!isTopicAllowed && agePolicy.allowedTopics[0]) {
      setContextForm({ selectedTopic: agePolicy.allowedTopics[0].id });
    }
  }, [agePolicy.allowedTopics, selectedTopic, setContextForm]);

  const handleSelectTopic = (topId: TopicId) => {
    setTappedTopicId(topId);
    setContextForm({ selectedTopic: topId });

    // Auto preset default question if current question is empty
    if (!questionText.trim()) {
      const samplePrompt = SAMPLE_PROMPT_BY_TOPIC[topId];
      if (samplePrompt) {
        setContextForm({ questionText: samplePrompt });
      }
    }

    // Sáng viền 250ms rồi tự động chuyển sang màn kế (2b: nỗi niềm)
    setTimeout(() => {
      router.push('/reading/noi-niem');
    }, shouldReduceMotion ? 40 : 250);
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={shouldReduceMotion ? {} : { opacity: 0, x: -16 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative max-w-xl mx-auto px-4 py-6 sm:py-8"
    >
      {/* Header: Avatar nhỏ Reader + Câu mở đầu theo giọng Reader */}
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
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className="font-display text-sm font-bold text-[#F8F5F0] truncate">
                {agePolicy.effectivePersona === 'ba_ngoai_vui_tinh'
                  ? 'Bà Ngoại Vui Tính'
                  : activeReader.name}
              </h2>
              {agePolicy.isKidTeenSafeMode ? (
                <span className="text-[9px] font-semibold text-pink-300 bg-pink-500/15 border border-pink-500/30 px-1.5 py-0.5 rounded-full shrink-0">
                  Học đường 10–15t
                </span>
              ) : (
                <span className="text-[9px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-full shrink-0">
                  16+
                </span>
              )}
            </div>
            <Link
              href="/reading/ve-ban"
              className="text-[11px] text-[#9E96B0] hover:text-[#E5C687] transition-colors truncate shrink-0"
            >
              <strong>{nickname || 'Bạn'}</strong> ({CURRENT_REFERENCE_YEAR - birthYear}t) &rarr;
            </Link>
          </div>
          <p className="text-xs text-[#E5C687] italic font-serif leading-relaxed min-h-[30px]">
            &ldquo;{displayedGreeting}&rdquo;
            {displayedGreeting.length < readerGreeting.length && (
              <span className="inline-block w-1.5 h-3 ml-0.5 bg-[#C9A24A] animate-pulse align-middle" />
            )}
          </p>
        </div>
      </motion.div>

      {/* Title & Filter badge */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-[#F8F5F0]">
            Chọn Chủ Đề Trải Bài
          </h1>
          <p className="text-xs text-[#9E96B0] mt-0.5">
            Chạm vào một lá bài tarot để gửi gắm nỗi niềm
          </p>
        </div>

        {agePolicy.isKidTeenSafeMode && (
          <span className="text-[10px] text-amber-300 font-medium bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1 shrink-0">
            <ShieldCheck className="w-3 h-3 text-amber-300" />
            <span>Chủ đề theo tuổi</span>
          </span>
        )}
      </div>

      {/* LƯỚI 2 CỘT: CÁC LÁ BÀI TAROT HUYỀN BÍ (CHUẨN THEO UI THAM KHẢO) */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-5 mb-8">
        {agePolicy.allowedTopics.map((top) => {
          const config = TAROT_TOPIC_CONFIG[top.id] || {
            titleVi: top.label.toUpperCase(),
            description: top.description,
            artwork: MysticLoveCardArt,
          };
          const ArtworkComp = config.artwork;
          const isSelected = selectedTopic === top.id;
          const isTapped = tappedTopicId === top.id;

          return (
            <motion.button
              key={top.id}
              type="button"
              animate={isTapped ? { scale: 1.03 } : isSelected ? { scale: 1.01 } : { scale: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              whileHover={shouldReduceMotion ? {} : { scale: 1.02, y: -3 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
              onClick={() => handleSelectTopic(top.id)}
              className={`group relative text-center rounded-2xl sm:rounded-3xl p-3 sm:p-4.5 border transition-all cursor-pointer flex flex-col justify-between aspect-[9/14] sm:aspect-[9/13.5] overflow-hidden select-none ${
                isTapped || isSelected
                  ? 'bg-[#12101E] ring-2'
                  : 'bg-[#0E0D18] hover:bg-[#131120] border-[#2B263D]'
              }`}
              style={{
                borderColor:
                  isTapped || isSelected ? readerAccentColor : '#2B263D',
                boxShadow:
                  isTapped || isSelected
                    ? `0 0 30px ${readerAccentColor}40, inset 0 0 25px ${readerAccentColor}18`
                    : '0 8px 24px rgba(0,0,0,0.45)',
              }}
            >
              {/* Ornate Double Tarot Card Border */}
              <div className="absolute inset-1.5 sm:inset-2.5 rounded-[14px] sm:rounded-[20px] border border-[#C9A24A]/40 pointer-events-none transition-colors group-hover:border-[#C9A24A]/70" />
              <div className="absolute inset-2.5 sm:inset-3.5 rounded-[10px] sm:rounded-[16px] border border-[#C9A24A]/20 pointer-events-none" />

              {/* 4 Ornate Corners (Moon & Diamond star glyphs) */}
              <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 text-[8px] sm:text-[10px] text-[#C9A24A]/70 pointer-events-none">
                ☾
              </div>
              <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 text-[8px] sm:text-[10px] text-[#C9A24A]/70 pointer-events-none">
                ✦
              </div>
              <div className="absolute bottom-2.5 left-2.5 sm:bottom-3.5 sm:left-3.5 text-[8px] sm:text-[10px] text-[#C9A24A]/70 pointer-events-none">
                ✦
              </div>
              <div className="absolute bottom-2.5 right-2.5 sm:bottom-3.5 sm:right-3.5 text-[8px] sm:text-[10px] text-[#C9A24A]/70 pointer-events-none">
                ☽
              </div>

              {/* Card Centerpiece Artwork */}
              <div className="flex-1 w-full flex items-center justify-center p-2 sm:p-3 relative z-10 transition-transform duration-300 group-hover:scale-105">
                <ArtworkComp />
              </div>

              {/* Card Bottom Title Banner */}
              <div className="relative z-10 pt-1 pb-1">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="w-2 h-[1px] bg-[#C9A24A]/40" />
                  <span className="text-[7px] text-[#C9A24A]/60">✧</span>
                  <span className="w-2 h-[1px] bg-[#C9A24A]/40" />
                </div>
                <h3 className="font-serif tracking-widest text-xs sm:text-sm md:text-base font-extrabold text-[#C9A24A] uppercase transition-colors group-hover:text-[#F3E5AB]">
                  {config.titleVi}
                </h3>
              </div>

              {/* Active Selection Glow Ring Indicator */}
              {(isSelected || isTapped) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-3.5 right-3.5 z-20 w-5 h-5 rounded-full flex items-center justify-center text-[#0B0A12] font-bold shadow-md"
                  style={{ backgroundColor: readerAccentColor }}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Nút quay lại & gợi ý */}
      <div className="flex items-center justify-between max-w-md mx-auto pt-2">
        <button
          type="button"
          onClick={() => router.push('/reading/ve-ban')}
          className="py-2.5 px-4 rounded-2xl bg-[#14121F] hover:bg-[#1D192C] border border-[#262235] text-[#9E96B0] hover:text-[#F8F5F0] font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Sửa thông tin cá nhân</span>
        </button>

        <span className="text-[11px] text-[#C9A24A]/80 font-serif italic">
          ✦ Chạm lá bài để mở khóa tâm sự
        </span>
      </div>
    </motion.div>
  );
}
