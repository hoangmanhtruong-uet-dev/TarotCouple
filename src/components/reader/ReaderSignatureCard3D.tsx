'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RotateCw, Eye } from 'lucide-react';
import { soundManager } from '@/lib/sound-effects';

export interface ReaderSignatureCard3DProps {
  cardTitle: string;
  cardImage: string;
  arcanaName: string;
  accentColor: string;
  meaningSnippet?: string;
  keywords?: string[];
}

export function ReaderSignatureCard3D({
  cardTitle,
  cardImage,
  arcanaName,
  accentColor,
  meaningSnippet = 'Lá bài mang năng lượng chủ đạo soi sáng toàn bộ trải nghiệm tại lều của Reader.',
  keywords = ['Khởi sắc', 'Định mệnh', 'Tỉnh thức'],
}: ReaderSignatureCard3DProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    soundManager.playCrispClick();
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-56 sm:w-64 h-84 sm:h-96 cursor-pointer select-none [perspective:1000px]"
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleFlip();
          }
        }}
        aria-label={`Thẻ bài hộ mệnh 3D: ${cardTitle}. Nhấn để lật xem ý nghĩa.`}
      >
        <motion.div
          className="relative w-full h-full rounded-2xl [transform-style:preserve-3d] shadow-2xl transition-shadow duration-500 hover:shadow-[0_0_35px_rgba(201,162,74,0.3)]"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* FRONT FACE (Card Artwork) */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden [backface-visibility:hidden] border-2 bg-[#120F1D] flex flex-col"
            style={{ borderColor: accentColor }}
          >
            {/* Roman Badge */}
            <div className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono tracking-wider font-bold text-[#F3E5AB] border border-white/10">
              {arcanaName}
            </div>

            {/* Flip hint button */}
            <div className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white/80 hover:text-white transition">
              <RotateCw className="w-3.5 h-3.5" />
            </div>

            {/* Artwork Image */}
            <div className="relative flex-1 w-full bg-[#09080D] overflow-hidden">
              <img
                src={cardImage}
                alt={cardTitle}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                loading="eager"
              />
            </div>

            {/* Bottom Label */}
            <div className="p-3 bg-gradient-to-t from-[#0E0C17] via-[#14111E] to-[#120F1D] border-t border-white/10 text-center">
              <p className="text-xs font-bold text-[#F8F5F0] truncate font-serif tracking-wide">
                {cardTitle}
              </p>
              <p className="text-[10px] text-[#9E96B0] mt-0.5 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-[#C9A24A]" />
                <span>Chạm để lật mặt sau</span>
              </p>
            </div>
          </div>

          {/* BACK FACE (Meaning & Keywords) */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] border-2 bg-gradient-to-b from-[#1C172E] via-[#120F1D] to-[#0A0812] p-5 flex flex-col justify-between text-left"
            style={{ borderColor: accentColor }}
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#E6CA65]">
                  BÍ MẬT LÁ BÀI
                </span>
                <span className="text-[10px] font-mono text-[#9E96B0]">
                  {arcanaName}
                </span>
              </div>

              <h4 className="font-serif text-sm font-bold text-[#F8F5F0] mt-3">
                {cardTitle}
              </h4>

              <p className="text-xs text-[#D8D2E7] leading-relaxed mt-2 italic font-serif">
                "{meaningSnippet}"
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#9E96B0] mb-1.5">
                Năng lượng cộng hưởng:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-[#251F3D] border border-white/10 text-[10px] font-medium text-[#F3E5AB]"
                  >
                    ✦ {kw}
                  </span>
                ))}
              </div>
              <p className="text-[9px] text-[#716A85] text-center mt-3">
                Chạm lần nữa để trở về mặt trước
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
