'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Eye } from 'lucide-react';

interface CascadeProphecyTextProps {
  paragraphs: Array<{
    title: string;
    body: string;
    tag?: string;
    highlight?: string;
  }>;
  staggerDelay?: number;
}

export function CascadeProphecyText({
  paragraphs,
  staggerDelay = 0.22,
}: CascadeProphecyTextProps) {
  const shouldReduceMotion = useReducedMotion();
  const [showAllInstant, setShowAllInstant] = useState(false);

  return (
    <div className="space-y-4">
      {paragraphs.map((para, idx) => (
        <motion.div
          key={idx}
          initial={
            shouldReduceMotion || showAllInstant
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 15 }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: showAllInstant || shouldReduceMotion ? 0 : idx * staggerDelay,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="p-4 rounded-2xl bg-[#0B0A12]/70 border border-[#262235]/80 hover:border-[#C9A24A]/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#E5C687]">
              {para.title}
            </span>
            {para.tag && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1C172B] text-[#9E96B0]">
                {para.tag}
              </span>
            )}
          </div>
          <p className="text-xs text-[#9E96B0] leading-relaxed mb-2 font-sans">
            {para.body}
          </p>
          {para.highlight && (
            <p className="text-xs italic text-[#C9A24A] font-serif border-t border-[#262235]/60 pt-2">
              &ldquo;{para.highlight}&rdquo;
            </p>
          )}
        </motion.div>
      ))}

      {paragraphs.length > 2 && !showAllInstant && !shouldReduceMotion && (
        <div className="text-right">
          <button
            type="button"
            onClick={() => setShowAllInstant(true)}
            className="inline-flex items-center gap-1 text-[11px] text-[#9E96B0] hover:text-[#E5C687] transition-colors cursor-pointer"
          >
            <Eye className="w-3 h-3" />
            <span>Hiện tất cả ngay</span>
          </button>
        </div>
      )}
    </div>
  );
}
