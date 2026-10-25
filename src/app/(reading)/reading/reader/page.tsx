'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Filter,
  Volume2,
  Check,
  Compass,
  Heart,
  Star,
  Eye,
  Radio,
} from 'lucide-react';
import { READERS, type ReaderPersona } from '@/data/tarot-cards';
import { READER_SLUG_MAP, type CanonicalReaderId } from '@/lib/reader-slugs';
import { SANCTUARY_SPEC_MAP } from '@/data/sanctuary-specs';
import { useReadingStore } from '@/lib/reading-store';
import { soundManager } from '@/lib/sound-effects';
import { ReaderVoicePreview } from '@/components/reader/ReaderVoicePreview';
import { CustomCursorFollower } from '@/components/CustomCursorFollower';

type FilterCategory = 'all' | 'savage' | 'healing' | 'genz' | 'rational';

interface FilterOption {
  id: FilterCategory;
  label: string;
  emoji: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'Tất cả Reader', emoji: '🔮' },
  { id: 'savage', label: 'Đanh đá / Nói thẳng', emoji: '🔥' },
  { id: 'healing', label: 'Chữa lành / Dịu êm', emoji: '🌿' },
  { id: 'genz', label: 'Gen Z / Bạn thân', emoji: '✨' },
  { id: 'rational', label: 'Triết lý / Thực tế', emoji: '🦉' },
];

const READER_CATEGORY_MAP: Record<string, FilterCategory> = {
  ba_ngoai: 'savage',
  chi_dai: 'savage',
  ban_than: 'genz',
  thay_cu_meo: 'healing',
  ba_co_mo_hon: 'savage',
  tien_tu_chua_lanh: 'healing',
  tong_tai_ly_tri: 'rational',
  phap_su_toi_co: 'rational',
};

export default function ReaderGalleryPage() {
  const router = useRouter();
  const selectedReaderId = useReadingStore((state) => state.selectedReaderId);
  const setSelectedReaderId = useReadingStore((state) => state.setSelectedReaderId);

  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [hoveredReaderId, setHoveredReaderId] = useState<string | null>(null);

  const filteredReaders = useMemo(() => {
    if (activeCategory === 'all') return READERS;
    return READERS.filter((r) => READER_CATEGORY_MAP[r.id] === activeCategory);
  }, [activeCategory]);

  const handleSelectReader = (reader: ReaderPersona) => {
    soundManager.playCrispClick();
    setSelectedReaderId(reader.id);
    const slug = READER_SLUG_MAP[reader.id as CanonicalReaderId] || 'ba-ngoai';
    router.push(`/reading/reader/${slug}`);
  };

  const handleQuickEnterSanctuary = (reader: ReaderPersona, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playMysticChime();
    setSelectedReaderId(reader.id);
    router.push('/reading/chu-de');
  };

  return (
    <div className="min-h-screen bg-[#09080D] text-[#F8F5F0] pt-6 pb-24 px-4 sm:px-6">
      <CustomCursorFollower />

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Gallery Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A24A]/10 border border-[#C9A24A]/30 text-[#E6CA65] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LẦU THẦY BÓI • TAROT SANCTUARY</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#F8F5F0]">
            Chọn Reader Hợp Tần Số
          </h1>

          <p className="max-w-xl mx-auto text-xs sm:text-sm text-[#9E96B0] leading-relaxed">
            Mỗi vị Thầy Bói mang một trường năng lượng và góc nhìn riêng biệt. Bạn cần nghe sự thật cay đắng, lời vỗ về ấm áp hay một cuộc trò chuyện không phán xét?
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {FILTER_OPTIONS.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  soundManager.playCrispClick();
                  setActiveCategory(cat.id);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#C9A24A] text-[#09080D] font-bold shadow-[0_0_15px_rgba(201,162,74,0.35)]'
                    : 'bg-[#14111E] text-[#9E96B0] hover:text-[#F8F5F0] hover:bg-[#1C182A] border border-white/5'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Reader Cards Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
        >
          <AnimatePresence>
            {filteredReaders.map((reader) => {
              const slug = READER_SLUG_MAP[reader.id as CanonicalReaderId] || 'ba-ngoai';
              const spec = SANCTUARY_SPEC_MAP[reader.id as CanonicalReaderId];
              const isSelected = selectedReaderId === reader.id;

              return (
                <motion.div
                  layout
                  key={reader.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  onMouseEnter={() => setHoveredReaderId(reader.id)}
                  onMouseLeave={() => setHoveredReaderId(null)}
                  onClick={() => handleSelectReader(reader)}
                  className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#1C172E] to-[#120F1D] border-[#C9A24A] shadow-[0_0_30px_rgba(201,162,74,0.25)]'
                      : 'bg-gradient-to-b from-[#14111F] via-[#100E19] to-[#0A0912] border-white/10 hover:border-white/20 hover:shadow-xl'
                  }`}
                >
                  {/* Subtle Background Accent Gradient */}
                  <div
                    className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none"
                    style={{ backgroundColor: reader.accent_color }}
                  />

                  <div>
                    {/* Top Header: Badge & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border"
                        style={{
                          borderColor: `${reader.accent_color}50`,
                          backgroundColor: `${reader.accent_color}18`,
                          color: reader.accent_color,
                        }}
                      >
                        ✦ {reader.badge}
                      </span>

                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Sẵn sàng tiếp đón</span>
                      </div>
                    </div>

                    {/* Reader Name & Title */}
                    <div className="space-y-1 mb-3">
                      <h3 className="font-display text-2xl font-bold text-[#F8F5F0]">
                        {reader.name}
                      </h3>
                      <p className="text-xs text-[#9E96B0] line-clamp-1 font-serif">
                        {reader.title}
                      </p>
                    </div>

                    {/* Signature Card Snippet & Mood */}
                    {spec && (
                      <div className="p-3 rounded-2xl bg-[#09080D]/70 border border-white/5 flex items-center gap-3 mb-4">
                        <div className="w-12 h-16 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black">
                          <img
                            src={spec.signatureCardImage}
                            alt={spec.signatureCardTitle}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-[#9E96B0] uppercase font-bold tracking-wider">
                            Lá bài hộ mệnh
                          </p>
                          <p className="text-xs font-bold text-[#F3E5AB] truncate">
                            {spec.signatureCardTitle}
                          </p>
                          <p className="text-[11px] text-[#9E96B0] truncate mt-0.5">
                            Hợp: {spec.moodPillLabel}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Voice Preview Bar */}
                    <div className="mb-4" onClick={(e) => e.stopPropagation()}>
                      <ReaderVoicePreview
                        readerId={reader.id}
                        readerName={reader.name}
                        accentColor={reader.accent_color}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleQuickEnterSanctuary(reader, e)}
                      className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-[#09080D] transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95"
                      style={{ backgroundColor: reader.accent_color }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Vào Lều Xem Bài</span>
                    </button>

                    <Link
                      href={`/reading/reader/${slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="py-2.5 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#D8D2E7] transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>Hồ sơ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Back link to Home */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="text-xs text-[#9E96B0] hover:text-[#E6CA65] transition-colors"
          >
            &larr; Trở về Trang chủ Tarot Couple
          </Link>
        </div>
      </div>
    </div>
  );
}
