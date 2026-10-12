'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ALL_TAROT_CARDS,
  getCardSlug,
  type TarotCard,
} from '@/data/tarot-cards';
import { Search, Filter, Eye, ArrowLeft, BookOpen } from 'lucide-react';
import { SingleCardRevealModal } from '@/components/SingleCardRevealModal';

type FilterType = 'all' | 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

export default function CardsCodexPage() {
  const shouldReduceMotion = useReducedMotion();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);

  // Filter cards
  const filteredCards = ALL_TAROT_CARDS.filter((card) => {
    // Suit/Arcana filter
    if (activeFilter === 'major' && card.arcana !== 'major') return false;
    if (
      activeFilter === 'wands' ||
      activeFilter === 'cups' ||
      activeFilter === 'swords' ||
      activeFilter === 'pentacles'
    ) {
      if (card.suit !== activeFilter) return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNameVi = card.name_vi.toLowerCase().includes(q);
      const matchNameEn = card.name_en.toLowerCase().includes(q);
      const matchRoman = card.roman.toLowerCase() === q;
      return matchNameVi || matchNameEn || matchRoman;
    }

    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Modal View for Single Card */}
      {selectedCard && (
        <SingleCardRevealModal
          isOpen={selectedCard !== null}
          onClose={() => setSelectedCard(null)}
          card={selectedCard}
          reversed={false}
          positionLabel={`Thư Viện Rider-Waite-Smith • ${selectedCard.roman}`}
          readerName="Thư Viện Bài Tarot 1909"
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/me"
          className="inline-flex items-center gap-1.5 text-xs text-[#9E96B0] hover:text-[#C9A24A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về trang Tôi</span>
        </Link>
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#C9A24A] uppercase">
          GRIMOIRE CODEX • 78 LÁ BÀI
        </span>
      </div>

      <div className="text-center mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F8F5F0] mb-2">
          Từ Điển 78 Lá Bài Tarot
        </h1>
        <p className="text-xs sm:text-sm text-[#9E96B0] max-w-lg mx-auto">
          Khám phá trọn bộ 78 lá Rider-Waite-Smith 1909. Chạm vào ảnh để lật nhanh 3D hoặc bấm &ldquo;Chi tiết&rdquo; để đọc bài phân tích chuyên sâu.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#14111C]/90 border border-[#262235] rounded-3xl p-4 sm:p-5 mb-8 space-y-3 shadow-xl">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E96B0]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên lá bài (VD: Kẻ Khờ, The Fool, Mặt Trời, Gậy...)"
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#09080D] border border-[#262235] text-xs sm:text-sm text-[#F8F5F0] focus:border-[#C9A24A] focus:outline-none transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <Filter className="w-3.5 h-3.5 text-[#C9A24A] shrink-0" />
          {[
            { id: 'all', label: 'Tất cả (78)' },
            { id: 'major', label: 'Ẩn Chính (22)' },
            { id: 'wands', label: 'Bộ Gậy 🔥' },
            { id: 'cups', label: 'Bộ Cốc 💧' },
            { id: 'swords', label: 'Bộ Kiếm ⚔️' },
            { id: 'pentacles', label: 'Bộ Tiền 🪙' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as FilterType)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-[#C9A24A] text-[#09080D] shadow-sm font-bold'
                  : 'bg-[#1D1829] text-[#9E96B0] hover:text-[#F8F5F0] border border-[#262235]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3.5">
        {filteredCards.map((card) => {
          const slug = getCardSlug(card);
          return (
            <motion.div
              key={card.id}
              whileHover={shouldReduceMotion ? {} : { scale: 1.03, y: -4 }}
              className="p-2.5 rounded-2xl bg-[#14111C]/90 border border-[#262235] hover:border-[#C9A24A]/50 transition-all flex flex-col items-center shadow-sm group"
            >
              {/* Card Thumbnail (Click to open 3D quick modal) */}
              <div
                onClick={() => setSelectedCard(card)}
                className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-[#09080D] border border-[#C9A24A]/30 mb-2 cursor-pointer"
              >
                <img
                  src={card.rws_image_url}
                  alt={card.name_vi}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-black/75 text-[#E5C687]">
                  {card.roman}
                </span>
              </div>

              <p
                onClick={() => setSelectedCard(card)}
                className="text-xs font-bold text-[#F8F5F0] text-center line-clamp-1 group-hover:text-[#E5C687] transition-colors cursor-pointer"
              >
                {card.name_vi}
              </p>
              <span className="text-[9px] text-[#9E96B0] text-center line-clamp-1 uppercase mb-2">
                {card.name_en}
              </span>

              <div className="w-full grid grid-cols-2 gap-1 pt-1 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setSelectedCard(card)}
                  className="py-1 rounded-lg bg-[#1D1829] hover:bg-[#282238] text-[10px] text-[#9E96B0] hover:text-[#F8F5F0] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Eye className="w-2.5 h-2.5" />
                  <span>Lật 3D</span>
                </button>
                <Link
                  href={`/cards/${slug}`}
                  className="py-1 rounded-lg bg-[#C9A24A]/15 hover:bg-[#C9A24A]/25 border border-[#C9A24A]/30 text-[10px] text-[#E5C687] font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <BookOpen className="w-2.5 h-2.5" />
                  <span>Chi tiết</span>
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredCards.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-[#9E96B0]">Không tìm thấy lá bài nào khớp với từ khóa.</p>
        </div>
      )}
    </div>
  );
}
