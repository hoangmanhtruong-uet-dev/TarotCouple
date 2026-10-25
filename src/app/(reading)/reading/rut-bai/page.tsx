'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useReadingStore } from '@/lib/reading-store';
import { resolveReader } from '@/data/tarot-cards';
import { getSpreadPositionsForTopic } from '@/lib/safety';
import { Sparkles, Wand2, RefreshCw, Eye, RotateCcw, X, CheckCircle2 } from 'lucide-react';
import { TactileArcFan } from '@/components/TactileArcFan';
import { CustomCursorFollower } from '@/components/CustomCursorFollower';
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
  ba_co_mo_hon: [
    'Bà Cố đang soi căn duyên tiền định cho con đây...',
    'Đừng có giấu Bà Cố, các lá bài hiện rõ mồn một rồi...',
    'Tâm thành thì ứng, định mệnh chuẩn bị mở lối...',
    'Xong rồi đó, để Bà Cố phán cho nghe nghe chưa con!',
  ],
  tien_tu_chua_lanh: [
    'Thả lỏng hơi thở, để năng lượng vũ trụ bao bọc bạn...',
    'Những tổn thương cũ đang dần được các lá bài vỗ về...',
    'Ánh sáng chữa lành đang chiếu rọi vào từng nút thắt...',
    'Thông điệp bình yên và nguồn cảm hứng đã thành hình...',
  ],
  tong_tai_ly_tri: [
    'Đang phân tích các biến số và ma trận xác suất...',
    'Lọc bỏ yếu tố cảm tính, tập trung vào dữ kiện thực tế...',
    'Chiến lược tối ưu đang dần được định hình rõ nét...',
    'Báo cáo chiến lược định mệnh đã sẵn sàng bàn giao...',
  ],
  phap_su_toi_co: [
    'Vòng tròn ma thuật đang phong ấn các dòng năng lượng...',
    'Các cổ tự bắt đầu cộng hưởng với trực giác của bạn...',
    'Màn sương bí ẩn đang tan dần trước mắt ta...',
    'Lời sấm truyền ngàn năm đã được khai mở trọn vẹn...',
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

  // Dọn dẹp timer riffle & route audio khi unmount
  useEffect(() => {
    return () => {
      if (riffleIntervalRef.current) clearInterval(riffleIntervalRef.current);
      soundManager.cleanupRouteAudio();
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

  // 2. CHỌN HOẶC BỎ CHỌN BÀI TỪ XÒE QUẠT
  const handlePickCard = (idx: number) => {
    if (stage !== 'fan') return;

    // Nếu lá bài này đã được chọn -> Bỏ chọn nó để chọn lại lá khác
    if (selectedFanIndices.includes(idx)) {
      soundManager.playCrispClick();
      setSelectedFanIndices(selectedFanIndices.filter((item) => item !== idx));
      return;
    }

    if (selectedFanIndices.length >= 3) {
      return;
    }

    const updated = [...selectedFanIndices, idx];
    setSelectedFanIndices(updated);
  };

  // Bỏ chọn 1 ô cụ thể trong 3 slot phía trên
  const handleRemoveSlotCard = (slotIndex: number) => {
    if (stage !== 'fan') return;
    soundManager.playCrispClick();
    const updated = selectedFanIndices.filter((_, idx) => idx !== slotIndex);
    setSelectedFanIndices(updated);
  };

  // Xóa toàn bộ 3 lá đã chọn để chọn lại từ đầu
  const handleClearSelection = () => {
    if (stage !== 'fan' || selectedFanIndices.length === 0) return;
    soundManager.playCardSlide();
    setSelectedFanIndices([]);
  };

  // Vũ trụ chọn hộ 3 lá (hoặc đổi 3 lá ngẫu nhiên khác)
  const handleQuickPickThree = () => {
    if (stage !== 'fan') return;

    soundManager.playCardSlide();
    const pool = Array.from({ length: totalDeckCards }, (_, idx) => idx);
    const picked: number[] = [];
    while (picked.length < 3) {
      const randIdx = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(randIdx, 1)[0]!);
    }
    setSelectedFanIndices(picked);
  };

  // Vũ trụ chọn hộ & Bốc ngay từ giai đoạn Riffle (Fast-Track)
  const handleQuickDrawAndReveal = () => {
    soundManager.playCardSlide();
    const pool = Array.from({ length: totalDeckCards }, (_, idx) => idx);
    const picked: number[] = [];
    while (picked.length < 3) {
      const randIdx = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(randIdx, 1)[0]!);
    }
    const tuple: [number, number, number] = [picked[0]!, picked[1]!, picked[2]!];
    setSelectedFanIndices(tuple);
    startRevealSequence(tuple);
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
      const timeoutId = setTimeout(() => controller.abort(), 28000);

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
      setErrorMsg('Mất kết nối mạng tạm thời. Vũ trụ đang lưu giữ lá bài, bạn hãy bấm tiếp tục nhé!');
      setStage('fan');
      // Giữ nguyên 3 lá để người dùng không phải chọn lại từ đầu nếu gặp lỗi mạng
      setSelectedFanIndices(indices);
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

            {/* Thanh tiến trình huyền bí & 3 Bước Giải Mã AI */}
            <div className="w-56 h-1.5 bg-[#1D1829] rounded-full overflow-hidden mt-5 mb-4">
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-1/2 h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, transparent, ${reader.accent_color}, transparent)`,
                }}
              />
            </div>

            <div className="max-w-xs w-full space-y-2 text-left bg-[#14111C]/90 border border-[#262235] rounded-2xl p-3.5 mb-2">
              {[
                '1. Kết nối tần số năng lượng & câu hỏi',
                '2. Phân tích chiều sâu 3 lá bài định mệnh',
                '3. Đúc kết thông điệp & lời khuyên hành động',
              ].map((stepLabel, sIdx) => {
                const isDone = decodingQuoteIndex > sIdx;
                const isActive = decodingQuoteIndex === sIdx || (sIdx === 2 && decodingQuoteIndex >= 2);
                return (
                  <div
                    key={sIdx}
                    className={`flex items-center gap-2 text-[11px] transition-colors ${
                      isDone
                        ? 'text-emerald-400 font-semibold'
                        : isActive
                        ? 'text-[#E5C687] font-bold'
                        : 'text-[#6E6782]'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isDone
                          ? 'text-emerald-400'
                          : isActive
                          ? 'text-[#C9A24A] animate-pulse'
                          : 'text-[#3A334F]'
                      }`}
                    />
                    <span>{stepLabel}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-[#9E96B0]">
              Vũ trụ đang giải mã trải bài 3 lá dành riêng cho bạn...
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
        <span className="text-[11px] font-bold tracking-[0.25em] text-[#E5C687] uppercase block mb-1.5 text-gold-luxury">
          BƯỚC 3 / 4 • NGHI THỨC RÚT BÀI
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F5F0] text-gold-luxury tracking-wide">
          {stage === 'riffle' ? 'Nghi Thức Xáo Bài 3D' : 'Rút 3 Lá Bài Định Mệnh'}
        </h1>
        <p className="text-xs sm:text-sm text-[#A9A1BC] mt-1.5 max-w-md mx-auto leading-relaxed">
          {stage === 'riffle'
            ? 'Hít một hơi thật sâu, nghĩ về điều bạn đang băn khoăn và chạm xáo để kích hoạt dòng năng lượng.'
            : selectedFanIndices.length === 3
            ? 'Đã chọn đủ 3 lá! Bạn có thể chạm vào lá bài để đổi lá khác, hoặc bấm "Lật Mở 3 Lá" ngay.'
            : 'Lần lượt chạm chọn 3 lá bài theo trực giác (chạm lại vào lá đã chọn nếu muốn đổi lá khác).'}
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

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleQuickDrawAndReveal}
                className="px-4 py-2 rounded-xl bg-[#14111C] hover:bg-[#1D1829] border border-[#C9A24A]/40 text-xs font-semibold text-[#C9A24A] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Vũ Trụ Chọn Hộ &amp; Bốc Ngay &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => setStage('fan')}
                className="text-xs text-[#9E96B0] hover:text-[#C9A24A] transition-colors cursor-pointer"
              >
                Tự tay xòe bài &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2 & 3. GIAI ĐOẠN XÒE QUẠT & LẬT BÀI 3D XEN KẼ 350MS */}
      {(stage === 'fan' || stage === 'revealing') && (
        <div className="space-y-5">
          {/* 3 Slot Bài (Hỗ trợ chạm để bỏ chọn từng lá & lật bài 3D xen kẽ 350ms) */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
            {spreadPositions.map((posLabel, idx) => {
              const pickedFanIdx = selectedFanIndices[idx];
              const isFilled = pickedFanIdx !== undefined;
              const isRevealed = stage === 'revealing' && revealedCount > idx;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (isFilled && stage === 'fan') {
                      handleRemoveSlotCard(idx);
                    }
                  }}
                  title={isFilled && stage === 'fan' ? 'Chạm để bỏ chọn lá bài này' : undefined}
                  className={`p-3 rounded-2xl border text-center transition-all relative ${
                    isFilled
                      ? 'bg-[#1D1829] border-[#C9A24A] shadow-[0_0_20px_rgba(201,162,74,0.25)] cursor-pointer hover:border-rose-400/80 group'
                      : 'bg-[#14111C]/80 border-[#262235]'
                  }`}
                >
                  {isFilled && stage === 'fan' && (
                    <span
                      aria-label={`Bỏ chọn lá ${idx + 1}`}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#262038] border border-[#C9A24A]/60 group-hover:bg-rose-500 group-hover:border-rose-400 text-[#E5C687] group-hover:text-white flex items-center justify-center shadow-md transition-colors z-20"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  )}

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
                          <span className="text-[7px] text-[#9E96B0] group-hover:text-rose-300 uppercase transition-colors">
                            {stage === 'fan' ? 'Chạm đổi lá' : 'RWS'}
                          </span>
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

          {/* Thanh Công Cụ: Vũ Trụ Chọn Hộ + Chọn Lại + Lật Mở 3 Lá */}
          {stage === 'fan' && (
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={handleQuickPickThree}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#14111C] hover:bg-[#1D1829] border border-[#C9A24A]/40 text-xs font-semibold text-[#C9A24A] transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{selectedFanIndices.length === 3 ? 'Đổi 3 Lá Ngẫu Nhiên Khác' : 'Vũ Trụ Chọn Hộ 3 Lá'}</span>
              </button>

              {selectedFanIndices.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#14111C] hover:bg-rose-950/40 border border-[#322B45] hover:border-rose-500/50 text-xs font-semibold text-[#A9A1BC] hover:text-rose-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Chọn Lại Từ Đầu ({selectedFanIndices.length}/3)</span>
                </button>
              )}

              {selectedFanIndices.length === 3 && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() =>
                    startRevealSequence([
                      selectedFanIndices[0]!,
                      selectedFanIndices[1]!,
                      selectedFanIndices[2]!,
                    ])
                  }
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A24A] via-[#E5C687] to-[#C9A24A] text-[#09080D] font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(201,162,74,0.5)] hover:brightness-110 transition-all cursor-pointer animate-pulse"
                >
                  <Eye className="w-4 h-4" />
                  <span>Xác Nhận & Lật Mở 3 Lá &rarr;</span>
                </motion.button>
              )}
            </div>
          )}

          {/* Vòng Cung Xòe Quạt TactileArcFan */}
          <div className="bg-[#14111C]/80 border border-[#262235] rounded-3xl p-3 sm:p-5">
            <TactileArcFan
              totalCards={totalDeckCards}
              selectedIndices={selectedFanIndices}
              onPickCard={handlePickCard}
              disabled={stage !== 'fan'}
            />
          </div>

          {/* Thông báo lỗi */}
          {errorMsg && (
            <p className="text-xs text-rose-400 text-center font-medium">{errorMsg}</p>
          )}

          {/* Điều hướng dưới cùng */}
          <div className="flex items-center justify-between max-w-md mx-auto pt-2">
            <button
              type="button"
              onClick={() => router.push('/reading/chu-de?step=3')}
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

      {/* CustomCursorFollower */}
      <CustomCursorFollower />
    </div>
  );
}
