'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useReadingStore } from '@/lib/reading-store';
import { READERS } from '@/data/tarot-cards';
import { ArrowRight, ArrowLeft, Check, Sparkles, ShieldCheck, Info, X } from 'lucide-react';
import { CURRENT_REFERENCE_YEAR } from '@/lib/schemas';
import { classifyAgeTier } from '@/lib/safety';

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
  const [showAgeHelpModal, setShowAgeHelpModal] = useState(false);

  const agePolicy = classifyAgeTier(birthYear, CURRENT_REFERENCE_YEAR, selectedReaderId);
  const isKidTeenSafeMode = agePolicy.isKidTeenSafeMode;

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
      router.push('/reading/chu-de');
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
          <label className="block text-xs font-semibold text-[#C9A24A] mb-1.5 uppercase tracking-wider">
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

        {/* Birth Year (Bắt buộc kèm badge phân tầng lứa tuổi trực quan) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[#C9A24A] uppercase tracking-wider">
              Năm Sinh Của Bạn *
            </label>
            <button
              type="button"
              onClick={() => setShowAgeHelpModal(true)}
              className="text-[11px] text-[#9E96B0] hover:text-[#E5C687] flex items-center gap-1 underline cursor-pointer"
            >
              <Info className="w-3 h-3" />
              <span>Chính sách lứa tuổi</span>
            </button>
          </div>
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
                Năm {yr} ({CURRENT_REFERENCE_YEAR - yr} tuổi)
              </option>
            ))}
          </select>

          {/* Badge phân tầng lứa tuổi động */}
          <div className="mt-2.5">
            {isKidTeenSafeMode ? (
              <div className="p-3 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-start gap-2.5">
                <span className="text-base shrink-0">🌸</span>
                <div className="text-[11px] text-[#F8F5F0] leading-relaxed">
                  <span className="font-bold text-pink-300">Chế độ Học Đường Trong Sáng (10–15 tuổi):</span>{' '}
                  <span>
                    Reader <strong className="text-pink-300">{activeReader.teen_safe_name || activeReader.name}</strong> sẽ đồng hành nhẹ nhàng, ấm áp cùng các chủ đề học tập, tình bạn và vận may ngày mới.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-[#F8F5F0] leading-relaxed">
                  <span className="font-bold text-emerald-300">Chế độ Trưởng Thành (16+ tuổi):</span>{' '}
                  Mở khóa trọn vẹn phong cách xưng hô của{' '}
                  <strong style={{ color: readerAccentColor }}>{activeReader.name}</strong> cùng các chủ đề tình cảm, sự nghiệp, tài chính và phân tích sâu sắc.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cung Hoàng Đạo: Dropdown gọn, mặc định KHÔNG chọn, có nút Bỏ chọn */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[#C9A24A] uppercase tracking-wider">
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
          className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#C9A24A] to-[#C49A4D] hover:from-[#E5C687] hover:to-[#C9A24A] text-[#0B0A12] font-bold text-sm shadow-[0_4px_25px_rgba(217,179,106,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <span>{fromMe ? 'Lưu thay đổi' : 'Tiếp tục'}</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </button>
      </div>

      {/* Modal giải thích chính sách an toàn lứa tuổi */}
      {showAgeHelpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowAgeHelpModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#14121F] border border-[#C9A24A]/40 rounded-3xl p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowAgeHelpModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[#9E96B0] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <ShieldCheck className="w-5 h-5 text-[#C9A24A]" />
              <h3 className="font-display text-base font-bold text-[#F8F5F0]">
                Chính Sách Phân Tầng Độ Tuổi
              </h3>
            </div>

            <p className="text-xs text-[#9E96B0] leading-relaxed mb-4">
              Tarot Couple xây dựng chính sách phân tầng nhằm bảo vệ tâm lý thanh thiếu niên và tuân thủ các quy định an toàn nội dung số (Nghị định 13/2023/NĐ-CP):
            </p>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3 rounded-2xl bg-pink-500/10 border border-pink-500/20">
                <p className="font-bold text-pink-300 mb-1">
                  🌸 Nhóm 10–15 tuổi (Học đường trong sáng)
                </p>
                <p className="text-[#F8F5F0]">
                  • Giọng Reader chuyển thành <strong>Bà Ngoại Vui Tính</strong> (xưng hô Bà Ngoại - cháu, ấm áp, động viên).<br />
                  • Chủ đề tập trung vào học tập, thi cử, tình bạn, crush trường lớp.<br />
                  • Khóa hoàn toàn tính năng nạp tiền ngân hàng.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="font-bold text-emerald-300 mb-1">
                  🔥 Nhóm 16+ tuổi (Chế độ Trưởng thành)
                </p>
                <p className="text-[#F8F5F0]">
                  • Mở khóa trọn vẹn phong cách sắc sảo của <strong>Bà Cố Mỏ Hỗn</strong> (xưng Bà Cố - con), <strong>Tổng Tài Lý Trí</strong> và <strong>Pháp Sư Tối Cổ</strong>.<br />
                  • Trọn bộ chủ đề tình duyên sâu sắc, công việc, sự nghiệp và tài chính.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAgeHelpModal(false)}
              className="w-full mt-5 py-3 rounded-xl bg-[#C9A24A] hover:bg-[#E5C687] text-[#0B0A12] font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              Đã hiểu & Tiếp tục
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
