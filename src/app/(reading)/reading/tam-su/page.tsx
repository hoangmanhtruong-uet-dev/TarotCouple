'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useReadingStore } from '@/lib/reading-store';
import { classifyAgeTier, scanCrisisAndInjection } from '@/lib/safety';
import { CURRENT_REFERENCE_YEAR, type TopicId, type ReaderId } from '@/lib/schemas';
import { READERS } from '@/data/tarot-cards';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Lock,
  Feather,
  Heart,
  X,
  ChevronDown,
  ChevronUp,
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

const READER_GREETINGS: Record<ReaderId, string> = {
  ba_co_mo_hon:
    'Nào, đêm nay lại trăn trở chuyện gì nữa mà không ngủ? Khai thật với Bà Cố xem nào, đừng có tự lừa mình nữa!',
  tien_tu_chua_lanh:
    'Chào bạn thương, hít một hơi thật sâu nào. Bất kể bạn đang nặng lòng vì điều gì, hãy tâm sự cùng mình nhé...',
  tong_tai_ly_tri:
    'Đưa vấn đề của bạn vào đây. Chúng ta sẽ phân tích dữ liệu, bóc tách điểm nghẽn và lên kế hoạch xử lý dứt điểm.',
  phap_su_toi_co:
    'Những sợi tơ nghiệp duyên đã đưa bạn đến đây. Hãy mở khóa tầng sâu vô thức và phong ấn nỗi niềm vào vũ trụ...',
};

export default function TamSuContextPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const {
    selectedReaderId,
    readerAccentColor,
    nickname,
    zodiacSign,
    birthYear,
    selectedTopic,
    deckMode,
    questionText,
    hideQuestionOnShare,
    setContextForm,
  } = useReadingStore();

  const activeReader = READERS.find((r) => r.id === selectedReaderId) || READERS[0]!;

  const agePolicy = useMemo(
    () => classifyAgeTier(birthYear, CURRENT_REFERENCE_YEAR, selectedReaderId),
    [birthYear, selectedReaderId]
  );

  // Quota status check
  const [remainingQuota] = useState<number>(3);

  const [formError, setFormError] = useState<string | null>(null);
  const [isDissolving, setIsDissolving] = useState(false);
  const [isFocusedTextarea, setIsFocusedTextarea] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [usedSampleIdx, setUsedSampleIdx] = useState<number | null>(null);

  // Safety & Crisis scan on user input
  const crisisCheck = useMemo(() => {
    if (!questionText.trim()) return null;
    return scanCrisisAndInjection(questionText);
  }, [questionText]);

  // Ensure selected topic is valid within current allowed topics
  useEffect(() => {
    const isTopicAllowed = agePolicy.allowedTopics.some((t) => t.id === selectedTopic);
    if (!isTopicAllowed && agePolicy.allowedTopics[0]) {
      setContextForm({ selectedTopic: agePolicy.allowedTopics[0].id });
    }
  }, [agePolicy.allowedTopics, selectedTopic, setContextForm]);

  const handleProceed = (isSkip: boolean = false) => {
    setFormError(null);
    if (!isSkip) {
      if (!questionText.trim()) {
        setFormError('Hãy nhập câu hỏi hoặc chọn một câu gợi ý bên dưới để Vũ Trụ bắt sóng nhé!');
        return;
      }
    } else {
      if (!questionText.trim()) {
        setContextForm({
          questionText: 'Xin một thông điệp định hướng tổng quan từ Vũ Trụ cho năng lượng của tôi lúc này.',
        });
      }
    }

    if (questionText.trim().length > 300) {
      setFormError('Câu hỏi tối đa 300 ký tự.');
      return;
    }

    // Trigger golden particles dissolve effect
    setIsDissolving(true);
    setTimeout(() => {
      router.push('/reading/rut-bai');
    }, shouldReduceMotion ? 50 : 450);
  };

  const isOverLimit = questionText.length > 300;
  const isQuestionEmpty = !questionText.trim();
  const readerGreeting = READER_GREETINGS[selectedReaderId] || READER_GREETINGS.ba_co_mo_hon;

  // Typewriter effect for reader greeting
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
    }, 18);
    return () => clearInterval(timer);
  }, [readerGreeting, shouldReduceMotion]);

  return (
    <div className="relative max-w-2xl mx-auto px-4 pt-4 sm:pt-6 pb-36 overflow-hidden">
      {/* Golden Particle Dissolve Overlay on Submit */}
      <AnimatePresence>
        {isDissolving && !shouldReduceMotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-[#0B0A12]/85 backdrop-blur-sm"
          >
            <div className="relative text-center">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{
                    x: (Math.random() - 0.5) * 280,
                    y: (Math.random() - 0.5) * 280,
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
                className="text-sm font-bold tracking-widest uppercase block"
                style={{ color: readerAccentColor }}
              >
                Vũ Trụ Đang Xáo Bài...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Avatar Reader đã chọn + Câu mở đầu đúng giọng Reader (Typewriter) */}
      <div className="flex items-start gap-3.5 p-4 rounded-3xl bg-[#14121F]/90 border border-[#262235] mb-5 shadow-lg">
        <div
          className="w-13 h-13 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 shadow-inner"
          style={{
            backgroundColor: `${readerAccentColor}25`,
            border: `1.5px solid ${readerAccentColor}60`,
            color: readerAccentColor,
          }}
        >
          {activeReader.avatar_symbol}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h2 className="font-display text-sm font-bold text-[#F8F5F0]">
              {activeReader.name}
            </h2>
            <Link
              href="/reading/ve-ban"
              className="text-[11px] text-[#9E96B0] hover:text-[#E5C687] transition-colors"
            >
              Hồ sơ: <strong>{nickname || 'Bạn'}</strong> ({2026 - birthYear}t) &rarr;
            </Link>
          </div>
          <p className="text-xs text-[#E5C687] italic font-serif leading-relaxed min-h-[32px]">
            &ldquo;{displayedGreeting}&rdquo;
            {displayedGreeting.length < readerGreeting.length && (
              <span className="inline-block w-1.5 h-3 ml-0.5 bg-[#D9B36A] animate-pulse align-middle" />
            )}
          </p>
        </div>
      </div>

      {/* 2. Chip chủ đề dạng hàng ngang (thống nhất kiểu đang chọn viền + glow) */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-[#D9B36A] uppercase tracking-wider">
            Chủ Đề Trải Bài
          </label>
          {agePolicy.isKidTeenSafeMode && (
            <span className="text-[10px] text-amber-300 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
              * Chủ đề được chọn theo độ tuổi học đường
            </span>
          )}
        </div>

        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
          {agePolicy.allowedTopics.map((top) => {
            const isSelected = selectedTopic === top.id;
            return (
              <button
                key={top.id}
                type="button"
                onClick={() => {
                  setContextForm({ selectedTopic: top.id });
                  setUsedSampleIdx(null);
                  const samples = SAMPLE_QUESTIONS_BY_TOPIC[top.id];
                  if (samples && samples[0]) {
                    setContextForm({ questionText: samples[0] });
                    setUsedSampleIdx(0);
                  }
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border whitespace-nowrap cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[#181429] text-[#F8F5F0]'
                    : 'bg-[#0B0A12] border-[#262235] text-[#9E96B0] hover:text-[#F8F5F0]'
                }`}
                style={{
                  borderColor: isSelected ? readerAccentColor : undefined,
                  boxShadow: isSelected ? `0 0 15px ${readerAccentColor}35` : undefined,
                }}
              >
                {top.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Ô nhập lớn "Nỗi niềm phong ấn gửi vũ trụ" (nhãn, bộ đếm /300) */}
      <div
        className={`relative p-4 rounded-2xl border transition-all mb-3 ${
          isFocusedTextarea ? 'bg-[#141021]' : 'bg-[#0B0A12]'
        }`}
        style={{
          borderColor: isFocusedTextarea ? readerAccentColor : '#262235',
          boxShadow: isFocusedTextarea ? `0 0 20px ${readerAccentColor}25` : undefined,
        }}
      >
        <div className="flex items-center justify-between mb-2">
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
                title="Xóa nhanh nội dung"
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
          onFocus={() => setIsFocusedTextarea(true)}
          onBlur={() => setIsFocusedTextarea(false)}
          onChange={(e) => {
            if (e.target.value.length <= 300) {
              setContextForm({ questionText: e.target.value });
              if (formError) setFormError(null);
            }
          }}
          placeholder="Kể chi tiết câu chuyện, tình huống mập mờ, phân vân hay bế tắc bạn đang gặp phải..."
          maxLength={300}
          rows={4}
          className="w-full bg-transparent text-sm text-[#F8F5F0] placeholder-[#5E5873] focus:outline-none resize-none leading-relaxed"
        />
      </div>

      {/* 5. Công tắc "Ẩn câu hỏi khi chia sẻ ảnh Story" đặt NGAY DƯỚI ô nhập, bật sẵn */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B0A12]/80 border border-[#262235] mb-4">
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-[#F8F5F0]">Ẩn câu hỏi khi chia sẻ ảnh Story</p>
            <p className="text-[10px] text-[#9E96B0]">Bảo mật tuyệt đối nỗi niềm riêng tư</p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={hideQuestionOnShare}
          onChange={(e) => setContextForm({ hideQuestionOnShare: e.target.checked })}
          className="w-4 h-4 rounded cursor-pointer accent-[#D9B36A]"
        />
      </div>

      {/* 4. Gợi ý câu hỏi nhanh dạng chip dưới ô nhập (có đánh dấu đã dùng) */}
      <div className="mb-5">
        <p className="text-[11px] font-semibold text-[#9E96B0] mb-2 uppercase tracking-wider">
          Gợi ý câu hỏi nhanh (Chạm để điền):
        </p>
        <div className="flex flex-wrap gap-2">
          {(SAMPLE_QUESTIONS_BY_TOPIC[selectedTopic] || []).map((sample, idx) => {
            const isUsed = usedSampleIdx === idx || questionText === sample;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setContextForm({ questionText: sample });
                  setUsedSampleIdx(idx);
                  if (formError) setFormError(null);
                }}
                className={`text-left text-xs px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isUsed
                    ? 'bg-[#181429] text-[#F8F5F0]'
                    : 'bg-[#0B0A12]/80 text-[#9E96B0] hover:text-[#E5C687] border-[#262235]'
                }`}
                style={{
                  borderColor: isUsed ? readerAccentColor : undefined,
                  boxShadow: isUsed ? `0 0 10px ${readerAccentColor}30` : undefined,
                }}
              >
                {isUsed && (
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: readerAccentColor }}
                  />
                )}
                <span>&ldquo;{sample}&rdquo;</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cảnh báo hỗ trợ nhẹ nhàng nếu phát hiện nội dung nhạy cảm */}
      {crisisCheck && crisisCheck.safetyFlag === 'crisis' && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-xs text-amber-200 mb-4 space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <Heart className="w-4 h-4 text-rose-400" />
            <span>Vũ Trụ luôn ở bên bạn</span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#E5C687]">
            Nếu bạn đang trải qua cảm xúc quá nặng nề, đừng ngần ngại gọi đến Tổng đài Quốc gia <strong>111</strong> hoặc Đường dây Ngày Mai <strong>096 306 1414</strong> (miễn phí) để được lắng nghe và vỗ về nhé.
          </p>
        </div>
      )}

      {/* 6. "Nâng cao" (thu gọn mặc định): Quy mô bộ bài 78/22 lá (Mặc định 78 lá) */}
      <div className="mb-6 border border-[#262235] rounded-2xl bg-[#0B0A12]/70 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="w-full flex items-center justify-between p-3.5 text-xs font-semibold text-[#9E96B0] hover:text-[#F8F5F0] transition-colors cursor-pointer"
        >
          <span>Cài đặt nâng cao: Quy mô bộ bài ({deckMode === 'full_78' ? '78 Lá RWS' : '22 Lá Major'})</span>
          {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isAdvancedOpen && (
          <div className="p-3.5 pt-0 border-t border-[#262235]/60 space-y-2">
            <p className="text-[11px] text-[#9E96B0]">Chọn bộ bài để trải nghiệm:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setContextForm({ deckMode: 'full_78' })}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  deckMode === 'full_78' ? 'bg-[#181429] text-[#F8F5F0]' : 'bg-[#0B0A12] border-[#262235] text-[#9E96B0]'
                }`}
                style={{
                  borderColor: deckMode === 'full_78' ? readerAccentColor : undefined,
                }}
              >
                Trọn bộ 78 Lá (RWS 1909)
              </button>
              <button
                type="button"
                onClick={() => setContextForm({ deckMode: 'major_22' })}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  deckMode === 'major_22' ? 'bg-[#181429] text-[#F8F5F0]' : 'bg-[#0B0A12] border-[#262235] text-[#9E96B0]'
                }`}
                style={{
                  borderColor: deckMode === 'major_22' ? readerAccentColor : undefined,
                }}
              >
                22 Lá Ẩn Chính (Major Arcana)
              </button>
            </div>
          </div>
        )}
      </div>

      {formError && (
        <p className="text-xs text-rose-400 text-center font-medium mb-4">{formError}</p>
      )}

      {/* 7. THANH ĐÁY CỐ ĐỊNH: "Chọn lại Reader" (phụ), "Xáo bài" (chính), "Bỏ qua rút luôn" */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0E0D17]/95 backdrop-blur-md border-t border-[#262235] p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-xl mx-auto flex flex-col gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Nút phụ: Chọn lại Reader */}
            <button
              type="button"
              onClick={() => router.push('/reading/reader')}
              className="py-3.5 px-4 rounded-2xl bg-[#14121F] hover:bg-[#1D192C] border border-[#262235] text-[#9E96B0] font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Đổi Reader</span>
            </button>

            {/* Nút chính: Xáo bài (Mờ khi ô trống, hoặc thay bằng Mở khóa thêm lượt nếu hết lượt) */}
            {remainingQuota > 0 ? (
              <button
                type="button"
                onClick={() => handleProceed(false)}
                disabled={isQuestionEmpty || isDissolving}
                className={`flex-1 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                  isQuestionEmpty || isDissolving
                    ? 'opacity-40 bg-[#1D192C] text-[#9E96B0] border border-[#262235] cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#D9B36A] to-[#C49A4D] hover:from-[#E5C687] hover:to-[#D9B36A] text-[#0B0A12] shadow-[0_4px_25px_rgba(217,179,106,0.35)] transform active:scale-98'
                }`}
              >
                <span>Xáo Bài</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <Link
                href="/me"
                className="flex-1 py-3.5 sm:py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-[#0B0A12] flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Mở Khóa Thêm Lượt &rarr;</span>
              </Link>
            )}
          </div>

          {/* Nút phụ: Bỏ qua, rút luôn cho người không muốn viết */}
          {isQuestionEmpty && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => handleProceed(true)}
                className="text-[11px] text-[#9E96B0] hover:text-[#E5C687] underline cursor-pointer transition-colors"
              >
                Bạn chưa muốn nhập? Bấm để <strong>Bỏ qua & Rút bài luôn</strong> &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
