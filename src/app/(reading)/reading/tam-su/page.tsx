'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useReadingStore } from '@/lib/reading-store';
import { classifyAgeTier } from '@/lib/safety';
import { CURRENT_REFERENCE_YEAR, type TopicId } from '@/lib/schemas';
import { READERS } from '@/data/tarot-cards';
import { Sparkles, ArrowRight, ArrowLeft, Lock } from 'lucide-react';

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
              {[...Array(16)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{
                    x: (Math.random() - 0.5) * 220,
                    y: (Math.random() - 0.5) * 220,
                    scale: 0,
                    opacity: 0,
                  }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  className="absolute w-2.5 h-2.5 rounded-full bg-[#D9B36A] shadow-[0_0_10px_#D9B36A]"
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
        className="text-center mb-8"
      >
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#D9B36A] uppercase block mb-1">
          BƯỚC 2 / 4 • TÂM SỰ & CHỌN CHỦ ĐỀ
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5F0]">
          Kể Chuyện Cho {activeReader.name}
        </h1>
        <p className="text-xs sm:text-sm text-[#9E96B0] mt-1">
          Chia sẻ năng lượng hiện tại để các lá bài hội tụ chuẩn xác nhất.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-[#14121F]/80 border border-[#262235] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl mb-8"
      >
        {/* Row 1: Nickname & Birth Year */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#D9B36A] mb-1.5 uppercase tracking-wider">
              Biệt Danh Của Bạn
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setContextForm({ nickname: e.target.value })}
              placeholder="VD: Linh, Mây, Bé Heo..."
              maxLength={30}
              className="w-full px-4 py-3 rounded-xl bg-[#0B0A12] border border-[#262235] text-sm text-[#F8F5F0] focus:border-[#D9B36A] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#D9B36A] mb-1.5 uppercase tracking-wider">
              Năm Sinh (Xác định độ tuổi)
            </label>
            <select
              value={birthYear}
              onChange={(e) => setContextForm({ birthYear: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl bg-[#0B0A12] border border-[#262235] text-sm text-[#F8F5F0] focus:border-[#D9B36A] focus:outline-none transition-colors"
            >
              {BIRTH_YEAR_OPTIONS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr} ({2026 - yr} tuổi)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Zodiac Sign & Deck Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#D9B36A] mb-1.5 uppercase tracking-wider">
              Cung Hoàng Đạo (Tùy chọn)
            </label>
            <select
              value={zodiacSign}
              onChange={(e) => setContextForm({ zodiacSign: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-[#0B0A12] border border-[#262235] text-sm text-[#F8F5F0] focus:border-[#D9B36A] focus:outline-none transition-colors"
            >
              <option value="">-- Chọn cung hoàng đạo --</option>
              {ZODIAC_SIGNS.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#D9B36A] mb-1.5 uppercase tracking-wider">
              Quy Mô Bộ Bài
            </label>
            <select
              value={deckMode}
              onChange={(e) => setContextForm({ deckMode: e.target.value as any })}
              className="w-full px-4 py-3 rounded-xl bg-[#0B0A12] border border-[#262235] text-sm text-[#F8F5F0] focus:border-[#D9B36A] focus:outline-none transition-colors"
            >
              <option value="full_78">Trọn bộ 78 Lá (Rider-Waite-Smith)</option>
              <option value="major_22">22 Lá Ẩn Chính (Major Arcana)</option>
            </select>
          </div>
        </div>

        {/* Topic Pills */}
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

        {/* Question Textarea with character counter */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[#D9B36A] uppercase tracking-wider">
              Câu Hỏi Hoặc Nỗi Niềm Của Bạn
            </label>
            <span className="text-[11px] text-[#9E96B0]">
              {questionText.length}/300 ký tự
            </span>
          </div>
          <textarea
            value={questionText}
            onChange={(e) => setContextForm({ questionText: e.target.value })}
            placeholder="Kể chi tiết câu chuyện, tình huống mập mờ, bế tắc hoặc phân vân bạn đang gặp phải..."
            maxLength={300}
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-[#0B0A12] border border-[#262235] text-sm text-[#F8F5F0] focus:border-[#D9B36A] focus:outline-none transition-colors"
          />
        </div>

        {/* Suggested Questions */}
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
                className="w-full text-left text-xs p-2.5 rounded-lg bg-[#0B0A12]/60 hover:bg-[#1D192C] text-[#9E96B0] hover:text-[#E5C687] border border-[#262235]/60 transition-colors"
              >
                &ldquo;{sample}&rdquo;
              </button>
            ))}
          </div>
        </div>

        {/* Privacy Switch */}
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
          onClick={() => router.push('/reading/reader')}
          className="flex-1 py-4 rounded-2xl bg-[#14121F] hover:bg-[#1D192C] border border-[#262235] text-[#9E96B0] font-semibold text-sm transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Chọn Lại Reader</span>
        </button>

        <button
          type="button"
          onClick={handleProceed}
          disabled={isDissolving}
          className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#D9B36A] to-[#C49A4D] hover:from-[#E5C687] hover:to-[#D9B36A] text-[#0B0A12] font-bold text-sm shadow-[0_4px_25px_rgba(217,179,106,0.3)] transition-all flex items-center justify-center gap-2"
        >
          <span>Tiến Hành Rút Bài</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
