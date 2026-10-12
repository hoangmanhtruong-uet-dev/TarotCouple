'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useReadingStore } from '@/lib/reading-store';
import { resolveReader } from '@/data/tarot-cards';
import { getSpreadPositionsForTopic } from '@/lib/safety';
import { Sparkles, Wand2, RefreshCw, Eye } from 'lucide-react';
import { TactileArcFan } from '@/components/TactileArcFan';
import { useQuotaSync } from '@/lib/use-quota';
import { saveJournalEntry } from '@/lib/journal-store';
import { soundManager } from '@/lib/sound-effects';
import type { ReadingApiResponse } from '@/lib/api-types';

type RitualStage = 'riffle' | 'fan' | 'revealing' | 'decoding';

// Bộ thông điệp giải mã đổi nhịp 2s theo Persona Reader đã chọn
const DECODING_QUOTES_BY_READER: Record<string, string[]> = {
  ba_ngoai: [
    'Bà đang đeo kính ngắm các lá bài nha con...',
    'Để bà xoa đầu con cái đã, đừng lo lắng quá...',
    'Mọi nút thắt trong lòng rồi sẽ có cách gỡ thôi con...',
    'Bà thấy thông điệp ấm áp dành riêng cho con rồi nè...',
  ],
  chi_dai: [
    'Chị đang nhìn thẳng vào năng lượng của em đây...',
    'Thẳng thắn nhé, các lá bài không nói dối được chị đâu...',
    'Uống ngụm nước đi rồi nghe chị bóc tách từng lá nè...',
    'Sắp xong rồi, chuẩn bị đón nhận sự thật nha cưng...',
  ],
  ban_than: [
    'Ê coi bộ trải bài này có biến nha bà...',
    'Tui đang soi kỹ từng chi tiết cho bà đây nè...',
    'Bình tĩnh ngồi xuống, có tui ở đây nghe bà tâm sự!',
    'Xong rồi nè! Để tui dịch nghĩa cho bà nghe nha...',
  ],
  thay_cu_meo: [
    'Thầy đang quan sát biểu tượng ẩn sau từng lá bài...',
    'Mỗi lá bài là một tấm gương phản chiếu tâm thức...',
    'Trật tự vũ trụ đang dần hiển lộ qua các vì sao...',
    'Thông điệp minh triết đã được đúc kết hoàn chỉnh...',
  ],
};

export default function RutBaiPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { updateQuota } = useQuotaSync();

  const {
    selectedReaderId,
    nickname,
    birthYear,
    selectedTopic,
    deckMode,
    questionText,
    selectedFanIndices,
    setSelectedFanIndices,
    setReadingSuccess,
  } = useReadingStore();

  const reader = useMemo(
    () => resolveReader(selectedReaderId, birthYear),
    [selectedReaderId, birthYear]
  );

  const totalDeckCards = deckMode === 'full_78' ? 78 : 22;
  const spreadPositions = useMemo(
    () => getSpreadPositionsForTopic(selectedTopic),
    [selectedTopic]
  );

  // Ritual Stages: 'riffle' -> 'fan' -> 'revealing' -> 'decoding'
  const [stage, setStage] = useState<RitualStage>('riffle');
  const [isRiffling, setIsRiffling] = useState<boolean>(false);
  const [riffleProgress, setRiffleProgress] = useState<number>(0);
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [decodingQuoteIndex, setDecodingQuoteIndex] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const riffleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const quoteTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Quotes cho Persona hiện tại
  const decodingQuotes = useMemo(() => {
    return (
      DECODING_QUOTES_BY_READER[reader.id] ||
      DECODING_QUOTES_BY_READER.ba_ngoai || [
        'Đang kết nối từ trường các lá bài...',
        'Reader đang tập trung suy ngẫm giải mã...',
        'Thông điệp dành riêng cho bạn đang thành hình...',
      ]
    );
  }, [reader.id]);

  // Luân chuyển câu thoại decoding mỗi 2.2 giây
  useEffect(() => {
    if (stage === 'decoding') {
      quoteTimerRef.current = setInterval(() => {
        setDecodingQuoteIndex((prev) => (prev + 1) % decodingQuotes.length);
      }, 2200);
    }
    return () => {
      if (quoteTimerRef.current) clearInterval(quoteTimerRef.current);
    };
  }, [stage, decodingQuotes.length]);

  // Dọn dẹp timer riffle khi unmount
  useEffect(() => {
    return () => {
      if (riffleIntervalRef.current) clearInterval(riffleIntervalRef.current);
    };
  }, []);

  // 1. NGHI THỨC XÁO BÀI RIFFLE 3D (1.2 Giây kèm Rung Haptic & Web Audio)
  const triggerRiffleShuffle = () => {
    if (isRiffling) return;
    setIsRiffling(true);
    setRiffleProgress(0);

    // Kích hoạt âm thanh xáo bài chân thực bằng Web Audio API
    soundManager.playRiffleShuffle();

    // Rung haptic ngắt quãng mô phỏng lá bài miết vào nhau
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([35, 45, 35, 45, 35, 60, 100]);
    }

    if (riffleIntervalRef.current) clearInterval(riffleIntervalRef.current);

    const startTime = Date.now();
    const duration = 1200; // 1.2s

    riffleIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setRiffleProgress(pct);

      if (pct >= 100) {
        if (riffleIntervalRef.current) clearInterval(riffleIntervalRef.current);
        setIsRiffling(false);
        soundManager.playMysticChime();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([80, 50, 120]);
        }
        // Chuyển sang màn xòe quạt
        setTimeout(() => {
          setStage('fan');
        }, 300);
      }
    }, 40);
  };

  // 2. CHỌN BÀI TỪ XÒE QUẠT
  const handlePickCard = (idx: number) => {
    if (stage !== 'fan' || selectedFanIndices.includes(idx) || selectedFanIndices.length >= 3) {
      return;
    }

    const updated = [...selectedFanIndices, idx];
    setSelectedFanIndices(updated);

    // Khi đã đủ 3 lá: Kích hoạt chuỗi lật bài 3D xen kẽ 350ms
    if (updated.length === 3) {
      startRevealSequence([updated[0]!, updated[1]!, updated[2]!]);
    }
  };

  // Vũ trụ chọn hộ 3 lá
  const handleQuickPickThree = () => {
    if (stage !== 'fan' || selectedFanIndices.length === 3) return;

    soundManager.playCardSlide();
    const pool = Array.from({ length: totalDeckCards }, (_, idx) => idx);
    const picked: number[] = [];
    while (picked.length < 3) {
      const randIdx = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(randIdx, 1)[0]!);
    }
    setSelectedFanIndices(picked);
    startRevealSequence([picked[0]!, picked[1]!, picked[2]!]);
  };

  // 3. HIỆU ỨNG LẬT BÀI 3D XEN KẼ 350ms (0ms -> 350ms -> 700ms)
  const startRevealSequence = (indices: [number, number, number]) => {
    setStage('revealing');
    setRevealedCount(0);

    // Lá 1 lật lúc t = 0ms
    soundManager.playCardFlip();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
    setRevealedCount(1);

    // Lá 2 lật lúc t = 350ms
    setTimeout(() => {
      soundManager.playCardFlip();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30);
      }
      setRevealedCount(2);
    }, 350);

    // Lá 3 lật lúc t = 700ms
    setTimeout(() => {
      soundManager.playMysticChime();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([50, 60, 120]);
      }
      setRevealedCount(3);
    }, 700);

    // Sau khi 3 lá bừng sáng hoàn tất (t = 1350ms) -> chuyển sang Decoding & Gọi API
    setTimeout(() => {
      setStage('decoding');
      void submitDraw(indices);
    }, 1350);
  };

  // 4. GỬI KẾT QUẢ ĐẾN POST /api/reading
  const submitDraw = async (indices: [number, number, number]) => {
    setErrorMsg(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);

      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          nickname: nickname.trim() || 'Bạn Ẩn Danh',
          birth_year: birthYear,
          reader_id: selectedReaderId,
          topic: selectedTopic,
          deck_mode: deckMode,
          question_text: questionText.trim() || 'Định hướng cho tôi trong thời gian tới',
          selected_indices: indices,
        }),
      });
      clearTimeout(timeoutId);

      const data = (await res.json()) as ReadingApiResponse;

      if (data.status === 'error') {
        setErrorMsg(data.message);
        setStage('fan');
        setSelectedFanIndices([]);
        return;
      }

      if (data.status === 'ok') {
        if (data.quota) updateQuota(data.quota);
        saveJournalEntry(data);
        setReadingSuccess(data);
        router.push('/reading/ket-qua');
      } else if (data.status === 'crisis') {
        setReadingSuccess(null);
        router.push('/reading/ket-qua');
      }
    } catch {
      setErrorMsg('Mất kết nối mạng tạm thời. Vui lòng bấm thử lại nhé!');
      setStage('fan');
      setSelectedFanIndices(selectedFanIndices.slice(0, 2));
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 relative select-none">
      {/* 4. OVERLAY CHỜ GIẢI MÃ (ĐỔI CÂU THOẠI 2S THEO READER) */}
      <AnimatePresence>
        {stage === 'decoding' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#09080D]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
          >
            {/* Vòng hào quang breathing vàng/tím */}
            <div className="relative mb-6">
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute -inset-4 rounded-full blur-2xl"
                style={{
                  background: `radial-gradient(circle, ${reader.accent_color}66 0%, rgba(139,92,246,0.2) 70%, transparent 100%)`,
                }}
              />
              <div
                className="relative w-28 h-28 rounded-full border-2 p-1 flex items-center justify-center bg-[#14111C] shadow-2xl"
                style={{ borderColor: reader.accent_color }}
              >
                <div className="w-full h-full rounded-full bg-gradient-to-b from-[#1D1829] to-[#09080D] flex flex-col items-center justify-center text-center p-2">
                  <span className="text-2xl mb-1">🔮</span>
                  <span
                    className="text-[11px] font-bold tracking-wider uppercase line-clamp-1"
                    style={{ color: reader.accent_color }}
                  >
                    {reader.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Câu thoại luân chuyển mượt mà mỗi 2s */}
            <div className="h-16 flex items-center justify-center max-w-md mx-auto">
              <AnimatePresence mode="wait">
                <motion.p
                  key={decodingQuoteIndex}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="font-display text-base sm:text-lg font-bold text-[#F8F5F0] leading-snug px-4"
                >
                  "{decodingQuotes[decodingQuoteIndex]}"
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Thanh tiến trình huyền bí */}
            <div className="w-48 h-1 bg-[#1D1829] rounded-full overflow-hidden mt-6 mb-2">
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-1/2 h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, transparent, ${reader.accent_color}, transparent)`,
                }}
              />
            </div>
            <p className="text-[11px] text-[#9E96B0]">
              Đang kết nối năng lượng trải bài 3 lá...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header chỉ mục */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#C9A24A] uppercase block mb-1">
          BƯỚC 3 / 4 • NGHI THỨC RÚT BÀI
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5F0]">
          {stage === 'riffle' ? 'Nghi Thức Xáo Bài Riffle 3D' : 'Rút 3 Lá Bài Định Mệnh'}
        </h1>
        <p className="text-xs sm:text-sm text-[#9E96B0] mt-1 max-w-md mx-auto">
          {stage === 'riffle'
            ? 'Hít một hơi thật sâu, nghĩ về điều bạn đang băn khoăn và chạm xáo để kích hoạt dòng năng lượng.'
            : 'Lần lượt chạm chọn 3 lá bài theo trực giác mách bảo để chuẩn bị lật bài.'}
        </p>
      </motion.div>

      {/* 1. GIAI ĐOẠN RIFFLE SHUFFLE 3D */}
      {stage === 'riffle' && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative w-72 h-56 flex items-center justify-center perspective-[1000px]">
            {/* Hai nửa cọc bài Riffle 3D */}
            <motion.div
              animate={
                isRiffling && !shouldReduceMotion
                  ? {
                      rotateZ: [-8, -14, -6, -10, 0],
                      x: [-45, -20, -35, -15, 0],
                      y: [0, -10, 0, -5, 0],
                    }
                  : { rotateZ: -6, x: -35 }
              }
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="absolute w-28 h-44 rounded-2xl bg-gradient-to-br from-[#1D1829] via-[#14111C] to-[#09080D] border border-[#C9A24A]/60 shadow-[0_8px_30px_rgba(0,0,0,0.8)] flex flex-col items-center justify-between p-2"
            >
              <div className="w-full flex justify-between text-[9px] text-[#C9A24A]">
                <span>✦</span>
                <span>RWS</span>
              </div>
              <div className="w-10 h-10 rounded-full border border-[#C9A24A]/40 flex items-center justify-center text-[#C9A24A]/70 text-xs">
                ☾
              </div>
              <span className="text-[8px] text-[#9E96B0] uppercase tracking-widest">Left Deck</span>
            </motion.div>

            <motion.div
              animate={
                isRiffling && !shouldReduceMotion
                  ? {
                      rotateZ: [8, 14, 6, 10, 0],
                      x: [45, 20, 35, 15, 0],
                      y: [0, -10, 0, -5, 0],
                    }
                  : { rotateZ: 6, x: 35 }
              }
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="absolute w-28 h-44 rounded-2xl bg-gradient-to-br from-[#1D1829] via-[#14111C] to-[#09080D] border border-[#C9A24A]/60 shadow-[0_8px_30px_rgba(0,0,0,0.8)] flex flex-col items-center justify-between p-2"
            >
              <div className="w-full flex justify-between text-[9px] text-[#C9A24A]">
                <span>RWS</span>
                <span>✦</span>
              </div>
              <div className="w-10 h-10 rounded-full border border-[#C9A24A]/40 flex items-center justify-center text-[#C9A24A]/70 text-xs">
                ☉
              </div>
              <span className="text-[8px] text-[#9E96B0] uppercase tracking-widest">Right Deck</span>
            </motion.div>

            {/* Hiệu ứng tia bụi sao khi xáo bài */}
            {isRiffling && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1.2 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Sparkles className="w-12 h-12 text-[#C9A24A] animate-spin" />
              </motion.div>
            )}
          </div>

          {/* Nút bấm kích hoạt Xáo Bài Riffle */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <motion.button
              type="button"
              onClick={triggerRiffleShuffle}
              disabled={isRiffling}
              whileHover={shouldReduceMotion ? {} : { scale: 1.04 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#C9A24A] via-[#E879A8] to-[#8B5CF6] text-[#09080D] font-bold text-sm shadow-[0_0_25px_rgba(201,162,74,0.35)] flex items-center gap-2 cursor-pointer transition-all disabled:opacity-75"
            >
              {isRiffling ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang Xáo Riffle 3D ({riffleProgress}%)...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Chạm Xáo Bài 3D & Truyền Năng Lượng</span>
                </>
              )}
            </motion.button>

            <button
              type="button"
              onClick={() => setStage('fan')}
              className="text-xs text-[#9E96B0] hover:text-[#C9A24A] transition-colors cursor-pointer"
            >
              Bỏ qua nghi thức, xòe bài ngay &rarr;
            </button>
          </div>
        </div>
      )}

      {/* 2 & 3. GIAI ĐOẠN XÒE QUẠT & LẬT BÀI 3D XEN KẼ 350MS */}
      {(stage === 'fan' || stage === 'revealing') && (
        <div className="space-y-6">
          {/* 3 Slot Bài (Hỗ trợ lật bài 3D xen kẽ 350ms) */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
            {spreadPositions.map((posLabel, idx) => {
              const pickedFanIdx = selectedFanIndices[idx];
              const isFilled = pickedFanIdx !== undefined;
              const isRevealed = stage === 'revealing' && revealedCount > idx;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    isFilled
                      ? 'bg-[#1D1829] border-[#C9A24A] shadow-[0_0_20px_rgba(201,162,74,0.25)]'
                      : 'bg-[#14111C]/80 border-[#262235]'
                  }`}
                >
                  <span className="text-[10px] font-bold text-[#C9A24A] block mb-1 uppercase tracking-wider">
                    LÁ {idx + 1}
                  </span>
                  <p className="text-xs font-medium text-[#F8F5F0] line-clamp-1 mb-2">
                    {posLabel}
                  </p>

                  {/* Khung bài 3D Flip Card */}
                  <div
                    className="h-20 sm:h-24 rounded-xl flex items-center justify-center overflow-hidden relative"
                    style={{ perspective: '1000px' }}
                  >
                    {isFilled ? (
                      <motion.div
                        className="w-full h-full relative"
                        style={{ transformStyle: 'preserve-3d' }}
                        animate={
                          shouldReduceMotion
                            ? { opacity: 1 }
                            : { rotateY: isRevealed ? 180 : 0 }
                        }
                        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                      >
                        {/* Mặt Sau (Lưng bài úp) */}
                        <div
                          className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#1D1829] to-[#09080D] border border-[#C9A24A]/60 flex flex-col items-center justify-center p-1.5 shadow-md"
                          style={{ backfaceVisibility: 'hidden' }}
                        >
                          <span className="text-[10px] text-[#C9A24A] font-bold">
                            #{pickedFanIdx + 1}
                          </span>
                          <span className="text-xs text-[#C9A24A]/70 my-auto">✦</span>
                          <span className="text-[8px] text-[#9E96B0] uppercase">RWS</span>
                        </div>

                        {/* Mặt Trước (Lật mở bừng sáng 3D) */}
                        <div
                          className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#C9A24A]/30 via-[#1D1829] to-[#8B5CF6]/30 border-2 border-[#C9A24A] flex flex-col items-center justify-center p-1.5 shadow-[0_0_25px_rgba(201,162,74,0.6)]"
                          style={{
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                          }}
                        >
                          <Sparkles className="w-4 h-4 text-[#C9A24A] mb-1 animate-pulse" />
                          <span className="text-[11px] font-bold text-[#F8F5F0]">
                            Lá #{pickedFanIdx + 1}
                          </span>
                          <span className="text-[9px] text-[#C9A24A] uppercase tracking-wide">
                            Đã Lật Mở
                          </span>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="w-full h-full border border-dashed border-[#262235] rounded-xl flex items-center justify-center text-[#5E5873] text-[10px]">
                        Chờ rút...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nút Vũ Trụ Chọn Hộ */}
          {stage === 'fan' && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleQuickPickThree}
                disabled={selectedFanIndices.length === 3}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#14111C] hover:bg-[#1D1829] border border-[#C9A24A]/40 text-xs font-semibold text-[#C9A24A] transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Vũ Trụ Chọn Hộ 3 Lá</span>
              </button>
            </div>
          )}

          {/* Vòng Cung Xòe Quạt TactileArcFan */}
          <div className="bg-[#14111C]/80 border border-[#262235] rounded-3xl p-3 sm:p-5">
            <TactileArcFan
              totalCards={totalDeckCards}
              selectedIndices={selectedFanIndices}
              onPickCard={handlePickCard}
              disabled={stage !== 'fan' || selectedFanIndices.length >= 3}
            />
          </div>

          {/* Thông báo lỗi */}
          {errorMsg && (
            <p className="text-xs text-rose-400 text-center font-medium">{errorMsg}</p>
          )}

          {/* Điều hướng dưới cùng */}
          <div className="flex items-center justify-between max-w-md mx-auto pt-4">
            <button
              type="button"
              onClick={() => router.push('/reading/bo-bai')}
              disabled={stage === 'revealing'}
              className="px-4 py-3 rounded-xl bg-[#14111C] hover:bg-[#1D1829] border border-[#262235] text-xs font-semibold text-[#9E96B0] transition-colors cursor-pointer disabled:opacity-50"
            >
              &larr; Sửa Bộ Bài
            </button>

            {stage === 'fan' && selectedFanIndices.length === 3 && (
              <button
                type="button"
                onClick={() =>
                  startRevealSequence([
                    selectedFanIndices[0]!,
                    selectedFanIndices[1]!,
                    selectedFanIndices[2]!,
                  ])
                }
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#E879A8] text-[#09080D] font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                <span>Lật Mở 3 Lá &rarr;</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
