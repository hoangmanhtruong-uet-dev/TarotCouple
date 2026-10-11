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

const TOPIC_DETAILS: Record<
  TopicId,
  {
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    samplePrompt: string;
  }
> = {
  love: {
    icon: Heart,
    description: 'Khám phá suy nghĩ đối phương, gỡ rối mập mờ và xu hướng kết nối sắp tới.',
    samplePrompt: 'Người ấy im lặng 3 ngày nay là đang bận thật hay đang âm thầm ghost mình vậy?',
  },
  career: {
    icon: Briefcase,
    description: 'Tìm gốc rễ điểm nghẽn, tháo gỡ trì hoãn và định hướng bước đi bứt phá.',
    samplePrompt: 'Mình đang phân vân giữa việc nhảy việc sang môi trường mới hay ở lại chờ cơ hội?',
  },
  finance: {
    icon: Coins,
    description: 'Soi dòng tiền tài lộc, nhận diện thói quen rò rỉ và nắm bắt cơ hội mới.',
    samplePrompt: 'Tình hình tài chính tháng này của mình cần lưu ý lỗ hổng chi tiêu nào nhất?',
  },
  crush_school: {
    icon: Heart,
    description: 'Góc nhìn crush, thấu hiểu bạn bè và mở lời tự nhiên trong sáng tuổi học trò.',
    samplePrompt: 'Bạn ngồi bàn bên dạo này hay nhìn mình cười, không biết bạn ấy nghĩ gì về mình nhỉ?',
  },
  study: {
    icon: GraduationCap,
    description: 'Giải tỏa áp lực thi cử, tìm lại động lực và phương pháp học tập tối ưu.',
    samplePrompt: 'Kỳ thi học kỳ sắp tới mình nên tập trung ôn luyện thế nào để đạt điểm cao nhất?',
  },
  daily_luck: {
    icon: Sun,
    description: 'Nhận thông điệp tích cực, thu hút niềm vui và mở khóa may mắn hôm nay.',
    samplePrompt: 'Tuần mới của mình trên trường sẽ có niềm vui hay điều bất ngờ dễ thương nào?',
  },
};

const READER_GREETINGS: Record<ReaderId, string> = {
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
    nickname,
    birthYear,
    selectedTopic,
    questionText,
    setContextForm,
  } = useReadingStore();

  const activeReader = READERS.find((r) => r.id === selectedReaderId) || READERS[0]!;

  const agePolicy = useMemo(
    () => classifyAgeTier(birthYear, CURRENT_REFERENCE_YEAR, selectedReaderId),
    [birthYear, selectedReaderId]
  );

  const [tappedTopicId, setTappedTopicId] = useState<TopicId | null>(null);

  // Typewriter greeting
  const readerGreeting = READER_GREETINGS[selectedReaderId] || READER_GREETINGS.ba_co_mo_hon;
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
      const detail = TOPIC_DETAILS[topId];
      if (detail?.samplePrompt) {
        setContextForm({ questionText: detail.samplePrompt });
      }
    }

    // Sáng viền 250ms rồi tự động chuyển sang màn kế (2b: nỗi niềm)
    setTimeout(() => {
      router.push('/reading/noi-niem');
    }, shouldReduceMotion ? 40 : 250);
  };

  return (
    <div className="relative max-w-xl mx-auto px-4 py-6 sm:py-8">
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
            <h2 className="font-display text-sm font-bold text-[#F8F5F0]">
              {activeReader.name}
            </h2>
            <Link
              href="/reading/ve-ban"
              className="text-[11px] text-[#9E96B0] hover:text-[#E5C687] transition-colors truncate"
            >
              Hồ sơ: <strong>{nickname || 'Bạn'}</strong> ({2026 - birthYear}t) &rarr;
            </Link>
          </div>
          <p className="text-xs text-[#E5C687] italic font-serif leading-relaxed min-h-[30px]">
            &ldquo;{displayedGreeting}&rdquo;
            {displayedGreeting.length < readerGreeting.length && (
              <span className="inline-block w-1.5 h-3 ml-0.5 bg-[#D9B36A] animate-pulse align-middle" />
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
            Chạm vào một chủ đề để mở cánh cổng tâm sự
          </p>
        </div>

        {agePolicy.isKidTeenSafeMode && (
          <span className="text-[10px] text-amber-300 font-medium bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1 shrink-0">
            <ShieldCheck className="w-3 h-3 text-amber-300" />
            <span>Chủ đề được chọn theo độ tuổi của bạn</span>
          </span>
        )}
      </div>

      {/* Danh sách thẻ lớn xếp dọc */}
      <div className="space-y-3 mb-8">
        {agePolicy.allowedTopics.map((top) => {
          const detail = TOPIC_DETAILS[top.id] || {
            icon: Sparkles,
            description: 'Khám phá thông điệp sâu sắc từ các lá bài Tarot.',
            samplePrompt: '',
          };
          const IconComp = detail.icon;
          const isSelected = selectedTopic === top.id;
          const isTapped = tappedTopicId === top.id;

          return (
            <motion.button
              key={top.id}
              type="button"
              whileHover={shouldReduceMotion ? {} : { scale: 1.015, y: -2 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.985 }}
              onClick={() => handleSelectTopic(top.id)}
              className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 relative overflow-hidden ${
                isTapped || isSelected
                  ? 'bg-[#181429] shadow-lg ring-1'
                  : 'bg-[#14121F]/80 hover:bg-[#181429]/60 border-[#262235]'
              }`}
              style={{
                borderColor:
                  isTapped || isSelected ? readerAccentColor : '#262235',
                boxShadow:
                  isTapped || isSelected
                    ? `0 0 25px ${readerAccentColor}35`
                    : undefined,
              }}
            >
              {/* Icon avatar */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform"
                style={{
                  backgroundColor: `${readerAccentColor}18`,
                  border: `1.5px solid ${readerAccentColor}45`,
                  color: readerAccentColor,
                }}
              >
                <IconComp className="w-6 h-6" />
              </div>

              {/* Topic details */}
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display text-base font-bold text-[#F8F5F0] truncate">
                    {top.label}
                  </h3>
                </div>
                <p className="text-xs text-[#9E96B0] leading-relaxed line-clamp-2">
                  {detail.description}
                </p>
              </div>

              {/* Check indicator */}
              {(isSelected || isTapped) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 absolute right-4"
                  style={{ backgroundColor: readerAccentColor }}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Nút quay lại */}
      <div className="flex items-center justify-between max-w-md mx-auto">
        <button
          type="button"
          onClick={() => router.push('/reading/ve-ban')}
          className="py-3 px-5 rounded-2xl bg-[#14121F] hover:bg-[#1D192C] border border-[#262235] text-[#9E96B0] hover:text-[#F8F5F0] font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Sửa thông tin cá nhân</span>
        </button>

        <span className="text-[11px] text-[#5E5873]">
          Chạm thẻ để sang màn Kể Nỗi Niềm
        </span>
      </div>
    </div>
  );
}
