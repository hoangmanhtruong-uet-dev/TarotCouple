'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useReadingStore } from '@/lib/reading-store';
import { classifyAgeTier, scanCrisisAndInjection } from '@/lib/safety';
import { CURRENT_REFERENCE_YEAR, type TopicId, type ReaderId } from '@/lib/schemas';
import { READERS } from '@/data/tarot-cards';
import {
  ArrowRight,
  ArrowLeft,
  Lock,
  Feather,
  Heart,
  X,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

const SAMPLE_QUESTIONS_BY_TOPIC: Record<TopicId, string[]> = {
  love: [
    'Người ấy im lặng 3 ngày nay là đang bận thật hay đang âm thầm ghost mình vậy?',
    'Mối quan hệ mập mờ hiện tại có cơ hội tiến tới chính thức trong tháng tới không?',
    'Mình nên chủ động nhắn tin trước hay lùi lại giữ giá để xem thái độ người ta?',
  ],
  career: [
    'Mình đang phân vân giữa việc nhảy việc sang môi trường mới hay ở lại chờ cơ hội?',
    'Dự án sắp tới của mình đang gặp điểm nghẽn gì cần tháo gỡ ngay?',
    'Làm sao để thoát khỏi cảm giác trì hoãn và mất động lực mỗi sáng thức dậy?',
  ],
  finance: [
    'Tình hình tài chính tháng này của mình cần lưu ý lỗ hổng chi tiêu nào nhất?',
    'Sắp tới mình có cơ hội tăng thu nhập hay công việc làm thêm nào khả quan không?',
    'Thói quen nào đang âm thầm cản trở vận may tiền bạc của mình lúc này?',
  ],
  crush_school: [
    'Bạn ngồi bàn bên dạo này hay nhìn mình cười, không biết bạn ấy nghĩ gì về mình nhỉ?',
    'Làm sao để tụi mình trong nhóm bạn thân hiểu nhau hơn và không còn giận dỗi vu vơ?',
    'Mình muốn bắt chuyện làm quen với crush cùng khối thì nên mở lời thế nào?',
  ],
  study: [
    'Kỳ thi học kỳ sắp tới mình nên tập trung ôn luyện thế nào để đạt điểm cao nhất?',
    'Mình hay bị mất tập trung khi ngồi vào bàn học, có bí kíp nào giúp mình bứt phá không?',
    'Môn học mình đang lo lắng nhất sẽ có chuyển biến tích cực nếu mình đổi cách học chứ?',
  ],
  daily_luck: [
    'Tuần mới của mình trên trường sẽ có niềm vui hay điều bất ngờ dễ thương nào?',
    'Năng lượng may mắn hôm nay nhắn nhủ mình nên làm một việc tốt gì để cả ngày rực rỡ?',
    'Hôm nay mình cần giữ tinh thần thế nào để thu hút toàn chuyện vui vẻ?',
  ],
};

const READER_QUESTION_PROMPTS: Record<ReaderId, string> = {
  ba_co_mo_hon:
    'Ghi chi tiết câu chuyện vào đây, càng thật thà thì Bà Cố mổ xẻ càng chuẩn, đừng giấu bài!',
  tien_tu_chua_lanh:
    'Trút hết những điều đang đè nặng trong lòng bạn vào đây nhé, vũ trụ luôn lắng nghe bạn...',
  tong_tai_ly_tri:
    'Liệt kê tình huống, rào cản hoặc bài toán bạn đang cần tối ưu hóa vào đây để lên chiến lược.',
  phap_su_toi_co:
    'Truyền năng lượng và phong ấn câu hỏi của bạn vào cõi vô thức trước khi rút bài...',
};

const TOPIC_LABELS: Record<TopicId, string> = {
  love: 'Tình duyên & Mập mờ',
  career: 'Học tập & Sự nghiệp',
  finance: 'Tài chính & Tiền tài',
  crush_school: 'Tình bạn & Crush học đường',
  study: 'Học tập & Thi cử',
  daily_luck: 'Vận may ngày mới',
};

export default function NoiNiemPage() {
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
    hideQuestionOnShare,
    setContextForm,
  } = useReadingStore();

  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Route guard: Nếu chưa điền thông tin hoặc chưa chọn chủ đề thì chuyển về bước còn thiếu
  useEffect(() => {
    if (!isHydrated) return;
    const hasProfile = hasFilledProfile && Boolean(nickname?.trim()) && Boolean(birthYear);
    if (!hasProfile) {
      router.replace('/reading/ve-ban');
      return;
    }
    if (!selectedTopic) {
      router.replace('/reading/chu-de');
      return;
    }
  }, [isHydrated, hasFilledProfile, nickname, birthYear, selectedTopic, router]);

  const activeReader = READERS.find((r) => r.id === selectedReaderId) || READERS[0]!;

  const agePolicy = useMemo(
    () => classifyAgeTier(birthYear, CURRENT_REFERENCE_YEAR, selectedReaderId),
    [birthYear, selectedReaderId]
  );

  const [isFocusedTextarea, setIsFocusedTextarea] = useState(false);
  const [usedSampleIdx, setUsedSampleIdx] = useState<number | null>(null);

  // Crisis check
  const crisisCheck = useMemo(() => {
    if (!questionText.trim()) return null;
    return scanCrisisAndInjection(questionText);
  }, [questionText]);

  // Typewriter effect
  const readerPrompt =
    READER_QUESTION_PROMPTS[selectedReaderId] || READER_QUESTION_PROMPTS.ba_co_mo_hon;
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

  const isQuestionEmpty = !questionText.trim();
  const isOverLimit = questionText.length > 300;

  const handleContinue = () => {
    if (isQuestionEmpty) return;
    router.push('/reading/bo-bai');
  };

  const handleSkip = () => {
    // Xóa nội dung ô để AI hiểu là đọc theo chủ đề tổng quan
    setContextForm({ questionText: '' });
    setUsedSampleIdx(null);
    router.push('/reading/bo-bai');
  };

  const topicSamples = SAMPLE_QUESTIONS_BY_TOPIC[selectedTopic] || [];

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={shouldReduceMotion ? {} : { opacity: 0, x: -16 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative max-w-xl mx-auto px-4 pt-4 sm:pt-6 pb-36 overflow-hidden"
    >
      {/* 1. Avatar nhỏ Reader + Câu mở đầu theo giọng Reader */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3.5 p-4 rounded-3xl bg-[#14121F]/90 border border-[#262235] mb-5 shadow-xl"
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
              href="/reading/chu-de"
              className="text-[11px] text-[#9E96B0] hover:text-[#E5C687] transition-colors truncate"
            >
              Chủ đề: <strong>{TOPIC_LABELS[selectedTopic] || selectedTopic}</strong> &rarr;
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

      {/* 2. Ô nhập lớn "Nỗi niềm phong ấn gửi vũ trụ" kèm viền thở breathing glow */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: 1,
          y: 0,
          boxShadow: isFocusedTextarea
            ? [
                `0 0 15px ${readerAccentColor}20`,
                `0 0 28px ${readerAccentColor}45`,
                `0 0 15px ${readerAccentColor}20`,
              ]
            : '0 0 0px rgba(0,0,0,0)',
        }}
        transition={{
          duration: isFocusedTextarea ? 2.2 : 0.3,
          repeat: isFocusedTextarea ? Infinity : 0,
          ease: 'easeInOut',
        }}
        className={`relative p-4 sm:p-5 rounded-2xl border transition-all mb-3 ${
          isFocusedTextarea ? 'bg-[#141021]' : 'bg-[#0B0A12]'
        }`}
        style={{
          borderColor: isFocusedTextarea ? readerAccentColor : '#262235',
        }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold text-[#D9B36A] uppercase tracking-wider flex items-center gap-1.5">
            <Feather className="w-3.5 h-3.5 text-[#D9B36A]" />
            <span>Nỗi Niềm Phong Ấn Gửi Vũ Trụ</span>
          </label>

          <div className="flex items-center gap-2">
            {questionText && (
              <button
                type="button"
                onClick={() => {
                  setContextForm({ questionText: '' });
                  setUsedSampleIdx(null);
                }}
                className="text-[11px] text-[#9E96B0] hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                title="Xóa nhanh nội dung ô"
              >
                <X className="w-3 h-3" />
                <span>Xóa ô</span>
              </button>
            )}
            <span
              className={`text-[11px] font-mono ${
                isOverLimit
                  ? 'text-rose-400 font-bold'
                  : questionText.length > 250
                  ? 'text-amber-400'
                  : 'text-[#9E96B0]'
              }`}
            >
              {questionText.length}/300
            </span>
          </div>
        </div>

        <textarea
          value={questionText}
          onFocus={(e) => {
            setIsFocusedTextarea(true);
            // Cuộn mượt để không bị bàn phím ảo iOS che khuất
            setTimeout(() => {
              e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
          }}
          onBlur={() => setIsFocusedTextarea(false)}
          onChange={(e) => {
            if (e.target.value.length <= 300) {
              setContextForm({ questionText: e.target.value });
            }
          }}
          placeholder="Kể chi tiết câu chuyện, tình huống mập mờ, phân vân hay bế tắc bạn đang gặp phải..."
          maxLength={300}
          rows={5}
          className="relative z-10 w-full bg-transparent text-sm text-[#F8F5F0] placeholder-[#5E5873] focus:outline-none resize-none leading-relaxed"
        />

        {/* Hạt sáng nhẹ trôi lên khi gõ/focus, không làm giật khi gõ */}
        {isFocusedTextarea && !shouldReduceMotion && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[0, 1, 2, 3].map((p) => (
              <motion.div
                key={p}
                initial={{ opacity: 0, y: 15 }}
                animate={{
                  opacity: [0, 0.45, 0],
                  y: [-5, -45],
                  x: [0, (p % 2 === 0 ? 8 : -8)],
                }}
                transition={{
                  duration: 2.4 + p * 0.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: p * 0.45,
                }}
                className="absolute bottom-3 w-1.5 h-1.5 rounded-full"
                style={{
                  left: `${20 + p * 22}%`,
                  backgroundColor: readerAccentColor,
                  boxShadow: `0 0 8px ${readerAccentColor}`,
                }}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* 3. Công tắc "Ẩn câu hỏi khi chia sẻ ảnh Story" đặt NGAY DƯỚI ô nhập, bật sẵn */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B0A12]/80 border border-[#262235] mb-5">
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-[#F8F5F0]">
              Ẩn câu hỏi khi chia sẻ ảnh Story
            </p>
            <p className="text-[10px] text-[#9E96B0]">
              Bảo mật tuyệt đối nỗi niềm riêng tư
            </p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={hideQuestionOnShare}
          onChange={(e) =>
            setContextForm({ hideQuestionOnShare: e.target.checked })
          }
          className="w-4 h-4 rounded cursor-pointer accent-[#D9B36A]"
        />
      </div>

      {/* 4. Gợi ý câu hỏi nhanh LỌC THEO CHỦ ĐỀ dạng chip (đánh dấu đã dùng) */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-[#D9B36A]" />
          <p className="text-[11px] font-semibold text-[#9E96B0] uppercase tracking-wider">
            Gợi ý câu hỏi ({TOPIC_LABELS[selectedTopic] || selectedTopic}):
          </p>
        </div>

        <div className="space-y-2">
          {topicSamples.map((sample, idx) => {
            const isUsed = usedSampleIdx === idx || questionText === sample;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setContextForm({ questionText: sample });
                  setUsedSampleIdx(idx);
                }}
                className={`w-full text-left text-xs p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  isUsed
                    ? 'bg-[#181429] text-[#F8F5F0] ring-1'
                    : 'bg-[#14121F]/80 text-[#9E96B0] hover:text-[#E5C687] hover:bg-[#181429]/60 border-[#262235]'
                }`}
                style={{
                  borderColor: isUsed ? readerAccentColor : '#262235',
                  boxShadow: isUsed
                    ? `0 0 12px ${readerAccentColor}25`
                    : undefined,
                }}
              >
                <span className="flex-1 min-w-0 italic font-serif">
                  &ldquo;{sample}&rdquo;
                </span>

                {isUsed && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: readerAccentColor }}
                    title="Đã điền vào ô"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cảnh báo hỗ trợ an toàn nếu phát hiện nội dung khủng hoảng */}
      {crisisCheck && crisisCheck.safetyFlag === 'crisis' && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-xs text-amber-200 mb-6 space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <Heart className="w-4 h-4 text-rose-400" />
            <span>Vũ Trụ luôn ở bên bạn</span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#E5C687]">
            Nếu bạn đang trải qua cảm xúc quá nặng nề, đừng ngần ngại gọi đến
            Tổng đài Quốc gia <strong>111</strong> hoặc Đường dây Ngày Mai{' '}
            <strong>096 306 1414</strong> (miễn phí) để được lắng nghe và vỗ về
            nhé.
          </p>
        </div>
      )}

      {/* 5. THANH ĐÁY CỐ ĐỊNH (CHỈ DUY NHẤT 1 CHỖ BỎ QUA Ở DƯỚI CÙNG) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0E0D17]/95 backdrop-blur-md border-t border-[#262235] p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-xl mx-auto flex flex-col gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Nút phụ: Đổi chủ đề */}
            <button
              type="button"
              onClick={() => router.push('/reading/chu-de')}
              className="py-3.5 px-4 rounded-2xl bg-[#14121F] hover:bg-[#1D192C] border border-[#262235] text-[#9E96B0] font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Đổi chủ đề</span>
            </button>

            {/* Nút chính: Tiếp tục sang màn Bộ bài (Mờ khi ô trống) */}
            <button
              type="button"
              onClick={handleContinue}
              disabled={isQuestionEmpty}
              className={`flex-1 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg whitespace-nowrap ${
                isQuestionEmpty
                  ? 'opacity-40 bg-[#1D192C] text-[#9E96B0] border border-[#262235] cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#D9B36A] to-[#C49A4D] hover:from-[#E5C687] hover:to-[#D9B36A] text-[#0B0A12] shadow-[0_4px_25px_rgba(217,179,106,0.35)] transform active:scale-98'
              }`}
            >
              <span>Tiếp tục chọn Bộ bài</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* CHỈ GIỮ DUY NHẤT 1 CHỖ BỎ QUA Ở ĐÂY */}
          <div className="text-center pt-0.5">
            <button
              type="button"
              onClick={handleSkip}
              className="text-[11px] text-[#9E96B0] hover:text-[#E5C687] underline cursor-pointer transition-colors"
            >
              Bạn chưa muốn viết? Bấm để <strong>Bỏ qua & AI đọc theo chủ đề</strong> &rarr;
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
