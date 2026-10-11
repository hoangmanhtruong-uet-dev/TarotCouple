'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useReadingStore } from '@/lib/reading-store';
import { classifyAgeTier } from '@/lib/safety';
import { CURRENT_REFERENCE_YEAR, type TopicId } from '@/lib/schemas';
import { READERS } from '@/data/tarot-cards';
import { Sparkles, ArrowRight, ArrowLeft, Lock, Feather } from 'lucide-react';
import { ZodiacWheelSelector } from '@/components/ZodiacWheelSelector';

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

const BIRTH_YEAR_OPTIONS = Array.from(
  { length: 2016 - 1970 + 1 },
  (_, i) => 2016 - i
);

export default function TamSuContextPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const {
    selectedReaderId,
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

  const [formError, setFormError] = useState<string | null>(null);
  const [isDissolving, setIsDissolving] = useState(false);
  const [isFocusedTextarea, setIsFocusedTextarea] = useState(false);

  const handleProceed = () => {
    setFormError(null);
    if (!questionText.trim()) {
      setFormError('Hãy nhập câu hỏi hoặc chọn một câu gợi ý bên dưới để Vũ Trụ bắt sóng nhé!');
      return;
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

  return (
    <div className="relative max-w-2xl mx-auto px-4 py-8">
      {/* Golden Particle Dissolve Overlay on Submit */}
      <AnimatePresence>
        {isDissolving && !shouldReduceMotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-[#0B0A12]/80 backdrop-blur-sm"
          >
            <div className="relative">
              {[...Array(18)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{
                    x: (Math.random() - 0.5) * 260,
                    y: (Math.random() - 0.5) * 260,
                    scale: 0,
                    opacity: 0,
                  }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  className="absolute w-2.5 h-2.5 rounded-full bg-[#D9B36A] shadow-[0_0_12px_#D9B36A]"
                />
              ))}
              <span className="text-sm font-bold text-[#E5C687] tracking-widest uppercase">
                Vũ Trụ Đang Xáo Bài...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#D9B36A] uppercase block mb-1">
          BƯỚC 2B • TÂM SỰ CÙNG VŨ TRỤ
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5F0]">
          Kể Chuyện Cho {activeReader.name}
        </h1>
        <div className="flex items-center justify-center gap-2 mt-1">
          <p className="text-xs sm:text-sm text-[#9E96B0]">
            Chào <strong>{nickname || 'bạn'}</strong> ({2026 - birthYear} tuổi, {zodiacSign || 'Vũ Trụ'}).
          </p>
          <button
            type="button"
            onClick={() => router.push('/reading/ve-ban')}
            className="text-xs text-[#D9B36A] hover:underline underline-offset-2 ml-1"
          >
            (Sửa hồ sơ)
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-[#14121F]/80 border border-[#262235] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl mb-8"
      >
        {/* Row 1: Deck Mode */}
        <div>
          <label className="block text-xs font-semibold text-[#D9B36A] mb-1.5 uppercase tracking-wider">
            Quy Mô Bộ Bài
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setContextForm({ deckMode: 'full_78' })}
              className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                deckMode === 'full_78'
                  ? 'bg-[#1E1933] border-[#D9B36A] text-[#E5C687]'
                  : 'bg-[#0B0A12] border-[#262235] text-[#9E96B0]'
              }`}
            >
              Trọn bộ 78 Lá (RWS 1909)
            </button>
            <button
              type="button"
              onClick={() => setContextForm({ deckMode: 'major_22' })}
              className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                deckMode === 'major_22'
                  ? 'bg-[#1E1933] border-[#D9B36A] text-[#E5C687]'
                  : 'bg-[#0B0A12] border-[#262235] text-[#9E96B0]'
              }`}
            >
              22 Lá Ẩn Chính (Major Arcana)
            </button>
          </div>
        </div>

        {/* Row 2: Topic Pills */}
        <div>
          <label className="block text-xs font-semibold text-[#D9B36A] mb-2 uppercase tracking-wider">
            Chủ Đề Trải Bài
          </label>
          <div className="grid grid-cols-3 gap-2">
            {agePolicy.allowedTopics.map((top) => {
              const isSelected = selectedTopic === top.id;
              return (
                <button
                  key={top.id}
                  type="button"
                  onClick={() => {
                    setContextForm({ selectedTopic: top.id });
                    const samples = SAMPLE_QUESTIONS_BY_TOPIC[top.id];
                    if (samples && samples[0]) {
                      setContextForm({ questionText: samples[0] });
                    }
                  }}
                  className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-[#D9B36A]/20 border-[#D9B36A] text-[#E5C687] shadow-sm'
                      : 'bg-[#0B0A12] border-[#262235] text-[#9E96B0] hover:text-[#F8F5F0]'
                  }`}
                >
                  {top.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Sealed Parchment Letter (Hộp Thư Phong Ấn Tâm Sự) */}
        <div
          className={`relative p-4 rounded-2xl border transition-all ${
            isFocusedTextarea
              ? 'bg-[#141021] border-[#D9B36A] shadow-[0_0_25px_rgba(217,179,106,0.2)]'
              : 'bg-[#0B0A12] border-[#262235]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-[#D9B36A] uppercase tracking-wider flex items-center gap-1.5">
              <Feather className="w-3.5 h-3.5 text-[#D9B36A]" />
              <span>Nỗi Niềm Phong Ấn Gửi Vũ Trụ</span>
            </label>
            <span className="text-[11px] text-[#9E96B0]">
              {questionText.length}/300 ký tự
            </span>
          </div>
          <textarea
            value={questionText}
            onFocus={() => setIsFocusedTextarea(true)}
            onBlur={() => setIsFocusedTextarea(false)}
            onChange={(e) => setContextForm({ questionText: e.target.value })}
            placeholder="Kể chi tiết câu chuyện, tình huống mập mờ, bế tắc hoặc phân vân bạn đang gặp phải..."
            maxLength={300}
            rows={4}
            className="w-full bg-transparent text-sm text-[#F8F5F0] placeholder-[#5E5873] focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Row 4: Suggested Questions */}
        <div>
          <p className="text-[11px] font-semibold text-[#9E96B0] mb-2 uppercase tracking-wider">
            Gợi ý câu hỏi nhanh:
          </p>
          <div className="space-y-1.5">
            {(SAMPLE_QUESTIONS_BY_TOPIC[selectedTopic] || []).map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setContextForm({ questionText: sample })}
                className="w-full text-left text-xs p-2.5 rounded-lg bg-[#0B0A12]/60 hover:bg-[#1D192C] text-[#9E96B0] hover:text-[#E5C687] border border-[#262235]/60 transition-colors cursor-pointer"
              >
                &ldquo;{sample}&rdquo;
              </button>
            ))}
          </div>
        </div>

        {/* Row 5: Privacy Switch */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B0A12]/80 border border-[#262235]">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-xs font-semibold text-[#F8F5F0]">Ẩn câu hỏi khi chia sẻ ảnh Story</p>
              <p className="text-[10px] text-[#9E96B0]">Bảo mật nội dung riêng tư của bạn</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={hideQuestionOnShare}
            onChange={(e) => setContextForm({ hideQuestionOnShare: e.target.checked })}
            className="w-4 h-4 accent-[#D9B36A] rounded cursor-pointer"
          />
        </div>

        {/* Error */}
        {formError && (
          <p className="text-xs text-rose-400 text-center font-medium">{formError}</p>
        )}
      </motion.div>

      {/* Buttons */}
      <div className="flex items-center gap-3 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => router.push('/reading/ve-ban')}
          className="flex-1 py-4 rounded-2xl bg-[#14121F] hover:bg-[#1D192C] border border-[#262235] text-[#9E96B0] font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Hồ Sơ (Về Bạn)</span>
        </button>

        <button
          type="button"
          onClick={handleProceed}
          disabled={isDissolving}
          className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#D9B36A] to-[#C49A4D] hover:from-[#E5C687] hover:to-[#D9B36A] text-[#0B0A12] font-bold text-sm shadow-[0_4px_25px_rgba(217,179,106,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Xáo & Rút Bài</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
