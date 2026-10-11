'use client';

import React, { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface TactileArcFanProps {
  totalCards: number;
  selectedIndices: number[];
  onPickCard: (index: number) => void;
  disabled?: boolean;
}

export function TactileArcFan({
  totalCards,
  selectedIndices,
  onPickCard,
  disabled = false,
}: TactileArcFanProps) {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate card arc fan
  const cards = Array.from({ length: totalCards }, (_, i) => i);

  return (
    <div className="relative py-4 select-none">
      {/* Scrollable Fan Container with touch snap */}
      <div
        ref={containerRef}
        className="flex items-end justify-start sm:justify-center overflow-x-auto no-scrollbar py-6 px-4 gap-1.5 sm:gap-2.5"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {cards.map((cardIndex) => {
          const isSelected = selectedIndices.includes(cardIndex);

          // Calculate gentle tilt based on position
          const centerOffset = cardIndex - totalCards / 2;
          const rotateAngle = Math.max(-18, Math.min(18, centerOffset * 0.8));

          return (
            <motion.div
              key={cardIndex}
              whileHover={
                shouldReduceMotion || isSelected || disabled
                  ? {}
                  : { y: -22, scale: 1.08, zIndex: 40 }
              }
              whileTap={
                shouldReduceMotion || isSelected || disabled
                  ? {}
                  : { scale: 0.94 }
              }
              onClick={() => {
                if (!isSelected && !disabled && selectedIndices.length < 3) {
                  onPickCard(cardIndex);
                }
              }}
              className={`relative shrink-0 w-14 h-24 sm:w-16 sm:h-28 rounded-xl border transition-all cursor-pointer flex flex-col justify-between p-1.5 ${
                isSelected
                  ? 'bg-[#D9B36A] border-[#F3E5AB] opacity-30 cursor-not-allowed scale-90'
                  : 'bg-gradient-to-b from-[#221B33] via-[#151121] to-[#0B0A12] border-[#D9B36A]/40 hover:border-[#D9B36A] shadow-[0_4px_20px_rgba(0,0,0,0.8)]'
              }`}
              style={{
                transform: shouldReduceMotion ? undefined : `rotate(${rotateAngle}deg)`,
                zIndex: isSelected ? 1 : 10,
              }}
            >
              <div className="flex justify-between items-center text-[8px] text-[#D9B36A] font-bold">
                <span>#{cardIndex + 1}</span>
                <Sparkles className="w-2 h-2 opacity-60" />
              </div>

              {/* Card Back Geometric Celestial Emblem */}
              <div className="my-auto mx-auto w-6 h-6 rounded-full border border-[#D9B36A]/30 flex items-center justify-center text-[8px] text-[#D9B36A]/60">
                ✦
              </div>

              <div className="text-[7px] text-center tracking-widest text-[#9E96B0]/70 uppercase">
                RWS
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="text-[11px] text-center text-[#9E96B0] mt-2">
        👉 Vuốt ngang qua bộ bài và chạm vào lá bạn cảm thấy rung động nhất
      </p>
    </div>
  );
}
