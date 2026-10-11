'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useReadingStore } from '@/lib/reading-store';
import { READERS } from '@/data/tarot-cards';
import { ArrowRight, ArrowLeft, UserCheck, Sparkles } from 'lucide-react';
import { ZodiacWheelSelector } from '@/components/ZodiacWheelSelector';

const BIRTH_YEAR_OPTIONS = Array.from(
  { length: 2016 - 1970 + 1 },
  (_, i) => 2016 - i
);

export default function VeBanProfilePage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const {
    selectedReaderId,
    nickname,
    zodiacSign,
    birthYear,
    setContextForm,
  } = useReadingStore();

  const activeReader = READERS.find((r) => r.id === selectedReaderId) || READERS[0]!;
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSaveAndContinue = () => {
    if (!nickname.trim()) {
      setErrorMsg('Vui lòng nhập biệt danh của bạn để Vũ Trụ gọi tên.');
      return;
    }
    setErrorMsg(null);
    router.push('/reading/tam-su');
  };

  return (
    <div className="relative max-w-xl mx-auto px-4 py-6 sm:py-8">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#D9B36A] uppercase block mb-1">
          BƯỚC 2A • VỀ BẠN (HỒ SƠ TÂM LINH)
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5F0]">
          Bạn Là Ai Giữa Vũ Trụ Này?
        </h1>
        <p className="text-xs sm:text-sm text-[#9E96B0] mt-1 max-w-md mx-auto">
          Thông tin được lưu an toàn trên thiết bị của bạn. Chỉ cần điền một lần, từ lần bốc sau hệ thống sẽ tự động nhớ hồ sơ!
        </p>
      </motion.div>

      {/* Card Form */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-[#14121F]/90 border border-[#262235] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl mb-6"
      >
        {/* Nickname & Birth Year */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#D9B36A] mb-1.5 uppercase tracking-wider">
              Biệt Danh Của Bạn *
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
              Năm Sinh *
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

        {/* Zodiac Selector */}
        <ZodiacWheelSelector
          selectedSign={zodiacSign}
          onSelectSign={(sign) => setContextForm({ zodiacSign: sign })}
        />

        {errorMsg && (
          <p className="text-xs text-rose-400 text-center font-medium">{errorMsg}</p>
        )}
      </motion.div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-3 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => router.push('/reading/reader')}
          className="flex-1 py-4 rounded-2xl bg-[#14121F] hover:bg-[#1D192C] border border-[#262235] text-[#9E96B0] font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Đổi Reader</span>
        </button>

        <button
          type="button"
          onClick={handleSaveAndContinue}
          className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#D9B36A] to-[#C49A4D] hover:from-[#E5C687] hover:to-[#D9B36A] text-[#0B0A12] font-bold text-sm shadow-[0_4px_25px_rgba(217,179,106,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Tiếp Tục (Đặt Câu Hỏi)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
