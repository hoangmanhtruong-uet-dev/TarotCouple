'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useReadingStore } from '@/lib/reading-store';
import { READERS } from '@/data/tarot-cards';
import { ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';

const BIRTH_YEAR_OPTIONS = Array.from(
  { length: 2016 - 1970 + 1 },
  (_, i) => 2016 - i
);

const ZODIAC_OPTIONS = [
  { value: '', label: 'Chưa chọn cung hoàng đạo' },
  { value: 'Bạch Dương (♈)', label: 'Bạch Dương (♈ - 21/3 - 19/4)' },
  { value: 'Kim Ngưu (♉)', label: 'Kim Ngưu (♉ - 20/4 - 20/5)' },
  { value: 'Song Tử (♊)', label: 'Song Tử (♊ - 21/5 - 21/6)' },
  { value: 'Cự Giải (♋)', label: 'Cự Giải (♋ - 22/6 - 22/7)' },
  { value: 'Sư Tử (♌)', label: 'Sư Tử (♌ - 23/7 - 22/8)' },
  { value: 'Xử Nữ (♍)', label: 'Xử Nữ (♍ - 23/8 - 22/9)' },
  { value: 'Thiên Bình (♎)', label: 'Thiên Bình (♎ - 23/9 - 23/10)' },
  { value: 'Bọ Cạp (♏)', label: 'Bọ Cạp (♏ - 24/10 - 22/11)' },
  { value: 'Nhân Mã (♐)', label: 'Nhân Mã (♐ - 23/11 - 21/12)' },
  { value: 'Ma Kết (♑)', label: 'Ma Kết (♑ - 22/12 - 19/1)' },
  { value: 'Bảo Bình (♒)', label: 'Bảo Bình (♒ - 20/1 - 18/2)' },
  { value: 'Song Ngư (♓)', label: 'Song Ngư (♓ - 19/2 - 20/3)' },
];

export default function VeBanProfilePage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const {
    selectedReaderId,
    readerAccentColor,
    nickname,
    zodiacSign,
    birthYear,
    setContextForm,
  } = useReadingStore();

  const activeReader = READERS.find((r) => r.id === selectedReaderId) || READERS[0]!;
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<'nickname' | 'birthYear' | 'zodiacSign' | null>(null);
  const [fromMe, setFromMe] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isFromMe =
        window.location.search.includes('from=me') ||
        document.referrer.includes('/me');
      setFromMe(isFromMe);
    }
  }, []);

  const handleSaveAndContinue = () => {
    if (!nickname.trim()) {
      setErrorMsg('Vui lòng nhập biệt danh của bạn để Vũ Trụ gọi tên.');
      return;
    }
    setErrorMsg(null);
    setContextForm({ hasFilledProfile: true });
    if (fromMe) {
      router.push('/me');
    } else {
      router.push('/reading/tam-su');
    }
  };

  return (
    <div className="relative max-w-xl mx-auto px-4 py-6 sm:py-8">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5F0]">
          Bạn Là Ai Giữa Vũ Trụ Này?
        </h1>
        <p className="text-xs sm:text-sm text-[#9E96B0] mt-1 max-w-md mx-auto">
          Thông tin được lưu trên thiết bị của bạn. Chỉ cần điền một lần, từ lần sau sẽ đi thẳng vào trải bài!
        </p>
      </motion.div>

      {/* Card Form */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-[#14121F]/90 border border-[#262235] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl mb-6"
      >
        {/* Nickname */}
        <div>
          <label className="block text-xs font-semibold text-[#D9B36A] mb-1.5 uppercase tracking-wider">
            Biệt Danh Của Bạn *
          </label>
          <input
            type="text"
            value={nickname}
            onFocus={() => setFocusedField('nickname')}
            onBlur={() => setFocusedField(null)}
            onChange={(e) => {
              setContextForm({ nickname: e.target.value });
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="VD: Linh, Mây, Bé Heo..."
            maxLength={30}
            className="w-full px-4 py-3 rounded-xl bg-[#0B0A12] border border-[#262235] text-sm text-[#F8F5F0] focus:outline-none transition-colors"
            style={{
              borderColor: focusedField === 'nickname' ? readerAccentColor : undefined,
              boxShadow: focusedField === 'nickname' ? `0 0 15px ${readerAccentColor}25` : undefined,
            }}
          />
        </div>

        {/* Birth Year (Bắt buộc kèm dòng giải thích rõ ràng) */}
        <div>
          <label className="block text-xs font-semibold text-[#D9B36A] mb-1.5 uppercase tracking-wider">
            Năm Sinh Của Bạn *
          </label>
          <select
            value={birthYear}
            onFocus={() => setFocusedField('birthYear')}
            onBlur={() => setFocusedField(null)}
            onChange={(e) => setContextForm({ birthYear: Number(e.target.value) })}
            className="w-full px-4 py-3 rounded-xl bg-[#0B0A12] border border-[#262235] text-sm text-[#F8F5F0] focus:outline-none transition-colors cursor-pointer"
            style={{
              borderColor: focusedField === 'birthYear' ? readerAccentColor : undefined,
              boxShadow: focusedField === 'birthYear' ? `0 0 15px ${readerAccentColor}25` : undefined,
            }}
          >
            {BIRTH_YEAR_OPTIONS.map((yr) => (
              <option key={yr} value={yr}>
                Năm {yr} ({2026 - yr} tuổi)
              </option>
            ))}
          </select>
          <p className="text-[11px] text-[#9E96B0] mt-1.5 leading-relaxed">
            * Dùng để chọn giọng Reader và chủ đề phù hợp theo độ tuổi của bạn (theo chính sách an toàn).
          </p>
        </div>

        {/* Cung Hoàng Đạo: Dropdown gọn, mặc định KHÔNG chọn, có nút Bỏ chọn */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[#D9B36A] uppercase tracking-wider">
              Cung Hoàng Đạo (Tùy chọn)
            </label>
            {zodiacSign && (
              <button
                type="button"
                onClick={() => setContextForm({ zodiacSign: '' })}
                className="text-[11px] text-[#9E96B0] hover:text-[#E5C687] underline cursor-pointer"
              >
                Bỏ chọn
              </button>
            )}
          </div>
          <select
            value={zodiacSign}
            onFocus={() => setFocusedField('zodiacSign')}
            onBlur={() => setFocusedField(null)}
            onChange={(e) => setContextForm({ zodiacSign: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-[#0B0A12] border border-[#262235] text-sm text-[#F8F5F0] focus:outline-none transition-colors cursor-pointer"
            style={{
              borderColor: focusedField === 'zodiacSign' ? readerAccentColor : undefined,
              boxShadow: focusedField === 'zodiacSign' ? `0 0 15px ${readerAccentColor}25` : undefined,
            }}
          >
            {ZODIAC_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-400 text-center font-medium">{errorMsg}</p>
        )}
      </motion.div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-3 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => {
            if (fromMe) {
              router.push('/me');
            } else {
              router.push('/reading/reader');
            }
          }}
          className="flex-1 py-4 rounded-2xl bg-[#14121F] hover:bg-[#1D192C] border border-[#262235] text-[#9E96B0] font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>{fromMe ? 'Quay lại Hồ sơ' : 'Đổi Reader'}</span>
        </button>

        <button
          type="button"
          onClick={handleSaveAndContinue}
          className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#D9B36A] to-[#C49A4D] hover:from-[#E5C687] hover:to-[#D9B36A] text-[#0B0A12] font-bold text-sm shadow-[0_4px_25px_rgba(217,179,106,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <span>{fromMe ? 'Lưu thay đổi' : 'Tiếp tục'}</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </div>
  );
}
