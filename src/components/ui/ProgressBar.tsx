'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  className?: string;
  height?: number;
  showLabel?: boolean;
  glowColor?: string;
  animated?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  className = '',
  height = 6,
  showLabel = false,
  glowColor = 'rgba(201, 162, 74, 0.4)',
  animated = true,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`relative w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-[#9E96B0]">Tiến trình</span>
          <span className="text-xs font-medium text-[#C9A24A]">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div
        className="w-full bg-[#1A1726] rounded-full overflow-hidden"
        style={{ height }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${Math.round(percentage)}% hoàn thành`}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#C9A24A] to-[#E5C687]"
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: animated ? 0.6 : 0,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{
            boxShadow: percentage > 0 ? `0 0 12px ${glowColor}` : 'none',
          }}
        />
      </div>
    </div>
  );
}