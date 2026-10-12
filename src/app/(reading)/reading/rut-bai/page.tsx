'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useReadingStore } from '@/lib/reading-store';
import { getSpreadPositionsForTopic } from '@/lib/safety';
import { Sparkles, Wand2 } from 'lucide-react';
import { TactileArcFan } from '@/components/TactileArcFan';
import HamsterLoader from '@/components/HamsterLoader';
import { useQuotaSync } from '@/lib/use-quota';
import { saveJournalEntry } from '@/lib/journal-store';
import type { ReadingApiResponse } from '@/lib/api-types';

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

  const totalDeckCards = deckMode === 'full_78' ? 78 : 22;
  const spreadPositions = useMemo(
    () => getSpreadPositionsForTopic(selectedTopic),
    [selectedTopic]
  );

  const [shuffleStage, setShuffleStage] = useState<'charge' | 'fan'>('charge');
  const [chargeProgress, setChargeProgress] = useState<number>(0);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const chargeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ritual 3A: Energy Charge with pulse and vibration
  const startEnergyCharge = () => {
    if (shuffleStage === 'fan' || isCharging) return;
    setIsCharging(true);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 60, 40, 80, 120]);
    }

    if (chargeIntervalRef.current) clearInterval(chargeIntervalRef.current);

    chargeIntervalRef.current = setInterval(() => {
      setChargeProgress((prev) => {
        const next = prev + 5;
        if (next >= 100) {
          if (chargeIntervalRef.current) clearInterval(chargeIntervalRef.current);
          setIsCharging(false);
          setShuffleStage('fan');
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([90, 50, 140]);
          }
          return 100;
        }
        return next;
      });
    }, 70);
  };

  useEffect(() => {
    return () => {
      if (chargeIntervalRef.current) clearInterval(chargeIntervalRef.current);
    };
  }, []);

  // Handle Pick Card from Fan with flight animation
  const handlePickCard = (idx: number) => {
    if (isSubmitting || selectedFanIndices.includes(idx) || selectedFanIndices.length >= 3) return;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }

    const updated = [...selectedFanIndices, idx];
    setSelectedFanIndices(updated);

    if (updated.length === 3) {
      void submitDraw([updated[0]!, updated[1]!, updated[2]!]);
    }
  };

  // Quick Pick 3
  const handleQuickPickThree = () => {
    if (isSubmitting) return;
    const pool = Array.from({ length: totalDeckCards }, (_, idx) => idx);
    const picked: number[] = [];
    while (picked.length < 3) {
      const randIdx = Math.floor(Math.random() * pool.length);
      const val = pool.splice(randIdx, 1)[0]!;
      picked.push(val);
    }
    setSelectedFanIndices(picked);
    void submitDraw([picked[0]!, picked[1]!, picked[2]!]);
  };

  // Submit to POST /api/reading
  const submitDraw = async (indices: [number, number, number]) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

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
      setErrorMsg('Mất kết nối mạng tạm thời. Vui lòng bấm chọn lại nhé!');
      setSelectedFanIndices(selectedFanIndices.slice(0, 2));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 relative">
      {/* Loading Overlay with Hamster Wheel */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-[#0B0A12]/95 backdrop-blur-md flex items-center justify-center">
          <HamsterLoader
            message="Đang giải mã trải bài..."
            subMessage="Các vị tinh tú và Reader đang chắt lọc thông điệp dành riêng cho bạn"
          />
        </div>
      )}

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#D9B36A] uppercase block mb-1">
          BƯỚC 3 / 4 • RÚT 3 LÁ BÀI
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5F0]">
          {shuffleStage === 'charge' ? 'Xáo Bài & Truyền Năng Lượng' : 'Rút 3 Lá Bài Định Mệnh'}
        </h1>
        <p className="text-xs sm:text-sm text-[#9E96B0] mt-1 max-w-md mx-auto">
          {shuffleStage === 'charge'
            ? 'Tĩnh tâm, nghĩ về điều bạn vừa tâm sự và chạm giữ để kích hoạt từ trường bộ bài.'
            : 'Vuốt qua bộ bài xòe quạt và chạm chọn lần lượt 3 lá bài theo trực giác mách bảo.'}
        </p>
      </motion.div>

      {/* Stage 3A: Energy Charge Orb */}
      {shuffleStage === 'charge' && (
        <div className="flex flex-col items-center justify-center py-12">
          <motion.button
            type="button"
            onClick={startEnergyCharge}
            disabled={isCharging}
            whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
            className="group relative w-44 h-44 rounded-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#1E1933] to-[#110E1C] border-2 border-[#D9B36A]/50 shadow-[0_0_50px_rgba(217,179,106,0.25)] hover:border-[#D9B36A] transition-all cursor-pointer"
          >
            {/* Circular Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="88"
                cy="88"
                r="82"
                stroke="#262235"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="88"
                cy="88"
                r="82"
                stroke="#D9B36A"
                strokeWidth="4"
                fill="none"
                strokeDasharray="515"
                strokeDashoffset={515 - (515 * chargeProgress) / 100}
                className="transition-all duration-75"
              />
            </svg>

            <Wand2 className="w-8 h-8 text-[#D9B36A] mb-2 animate-pulse" />
            <span className="text-xs font-bold text-[#F8F5F0] text-center uppercase tracking-wider">
              {isCharging ? `${chargeProgress}%` : 'Chạm Để Xáo Bài'}
            </span>
            <span className="text-[10px] text-[#9E96B0] mt-1">Truyền năng lượng</span>
          </motion.button>

          <button
            type="button"
            onClick={() => setShuffleStage('fan')}
            className="mt-6 text-xs text-[#9E96B0] hover:text-[#E5C687] underline cursor-pointer"
          >
            Bỏ qua nghi thức &rarr;
          </button>
        </div>
      )}

      {/* Stage 3B: Arc Fan Selection */}
      {shuffleStage === 'fan' && (
        <div className="space-y-6">
          {/* 3 Selected Slots with Snap Fly In */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
            {spreadPositions.map((posLabel, idx) => {
              const pickedFanIdx = selectedFanIndices[idx];
              const isFilled = pickedFanIdx !== undefined;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    isFilled
                      ? 'bg-[#1D192C] border-[#D9B36A] shadow-[0_0_20px_rgba(217,179,106,0.2)]'
                      : 'bg-[#0E0D17]/80 border-[#262235]'
                  }`}
                >
                  <span className="text-[10px] font-bold text-[#D9B36A] block mb-1 uppercase">
                    LÁ {idx + 1}
                  </span>
                  <p className="text-xs font-medium text-[#F8F5F0] line-clamp-1 mb-2">
                    {posLabel}
                  </p>
                  <div
                    className={`h-16 rounded-xl flex items-center justify-center border overflow-hidden ${
                      isFilled
                        ? 'bg-gradient-to-br from-[#D9B36A]/20 to-[#14121F] border-[#D9B36A]/40 text-[#E5C687] font-bold text-xs'
                        : 'border-dashed border-[#262235] text-[#5E5873] text-[10px]'
                    }`}
                  >
                    {isFilled ? (
                      <motion.span
                        initial={shouldReduceMotion ? {} : { scale: 0.5, y: 15 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      >
                        Lá #{pickedFanIdx + 1}
                      </motion.span>
                    ) : (
                      'Chờ rút...'
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick pick button */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleQuickPickThree}
              disabled={isSubmitting || selectedFanIndices.length === 3}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#14121F] hover:bg-[#1D192C] border border-[#D9B36A]/40 text-xs font-semibold text-[#E5C687] transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Vũ Trụ Chọn Hộ 3 Lá</span>
            </button>
          </div>

          {/* New Tactile Arc Fan (Swipable curved cards) */}
          <div className="bg-[#14121F]/80 border border-[#262235] rounded-3xl p-3 sm:p-5">
            <TactileArcFan
              totalCards={totalDeckCards}
              selectedIndices={selectedFanIndices}
              onPickCard={handlePickCard}
              disabled={isSubmitting}
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <p className="text-xs text-rose-400 text-center font-medium">{errorMsg}</p>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-between max-w-md mx-auto pt-4">
            <button
              type="button"
              onClick={() => router.push('/reading/bo-bai')}
              className="px-4 py-3 rounded-xl bg-[#14121F] hover:bg-[#1D192C] border border-[#262235] text-xs font-semibold text-[#9E96B0] transition-colors cursor-pointer"
            >
              &larr; Sửa Bộ Bài
            </button>

            <button
              type="button"
              disabled={selectedFanIndices.length < 3 || isSubmitting}
              onClick={() => {
                if (selectedFanIndices.length === 3) {
                  void submitDraw([selectedFanIndices[0]!, selectedFanIndices[1]!, selectedFanIndices[2]!]);
                }
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#D9B36A] to-[#C49A4D] hover:from-[#E5C687] hover:to-[#D9B36A] text-[#0B0A12] font-bold text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? 'Đang Giải Mã...' : 'Giải Mã 3 Lá &rarr;'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
