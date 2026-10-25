'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { SanctuaryPersonaSpec } from '@/data/sanctuary-specs';

interface ReaderMoodBarProps {
  spec: SanctuaryPersonaSpec;
  accentColor: string;
  displayName: string;
}

export function ReaderMoodBar({ spec, accentColor, displayName }: ReaderMoodBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="w-full max-w-xl mx-auto px-4"
    >
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-2xl border bg-[#09080D]/80"
        style={{ borderColor: `${accentColor}30` }}
      >
        <span className="text-base flex-shrink-0">{spec.moodEmoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-[#9E96B0] leading-tight">
            {displayName} hợp nhất khi bạn:
          </p>
          <p
            className="text-xs font-medium truncate"
            style={{ color: accentColor }}
          >
            {spec.moodPillLabel}
          </p>
        </div>
        <div
          className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
          style={{ backgroundColor: accentColor }}
        />
      </div>
    </motion.div>
  );
}