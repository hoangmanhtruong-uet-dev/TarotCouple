'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Star, Volume2, VolumeX } from 'lucide-react';
import { useQuotaSync } from '@/lib/use-quota';
import { soundManager } from '@/lib/sound-effects';

interface CleanHeaderProps {
  starsBalance?: number;
  remainingToday?: number;
}

export default function CleanHeader({
  starsBalance: propStars,
  remainingToday: propRemaining,
}: CleanHeaderProps) {
  const pathname = usePathname();
  const { starsBalance: syncedStars, remainingToday: syncedRemaining } = useQuotaSync();

  const effectiveStars = propStars !== undefined ? propStars : syncedStars;
  const effectiveRemaining = propRemaining !== undefined ? propRemaining : syncedRemaining;

  // Flash highlight effect when stars balance increases/changes
  const [isStarGlowing, setIsStarGlowing] = useState(false);
  const [prevStars, setPrevStars] = useState(effectiveStars);
  const [isSoundOn, setIsSoundOn] = useState(true);

  useEffect(() => {
    setIsSoundOn(soundManager.isEnabled());
  }, []);

  const handleToggleSound = () => {
    const next = soundManager.toggle();
    setIsSoundOn(next);
  };

  useEffect(() => {
    if (effectiveStars !== prevStars) {
      setIsStarGlowing(true);
      const timer = setTimeout(() => setIsStarGlowing(false), 1200);
      setPrevStars(effectiveStars);
      return () => clearTimeout(timer);
    }
  }, [effectiveStars, prevStars]);

  return (
    <header className="sticky top-0 z-40 border-b border-[#C9A24A]/20 bg-[#0B0A12]/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto h-14 px-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-left group cursor-pointer shrink-0"
        >
          <div className="w-8 h-8 rounded-full bg-[#14121F] border border-[#C9A24A]/50 flex items-center justify-center text-[#E5C687] shadow-[0_0_15px_rgba(217,179,106,0.2)] group-hover:border-[#E5C687] transition-colors">
            <Sparkles className="w-4 h-4 text-[#C9A24A]" />
          </div>
          <div>
            <span className="font-display text-base font-bold tracking-wider text-[#F8F5F0] block leading-none">
              TAROT COUPLE
            </span>
            <span className="text-[8px] tracking-[0.16em] uppercase text-[#C9A24A]">
              Tarot AI
            </span>
          </div>
        </Link>

        {/* Action Controls: Nút Âm thanh + Ví Sao & Lượt */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sound Toggle Button */}
          <button
            type="button"
            onClick={handleToggleSound}
            aria-label={isSoundOn ? 'Tắt âm thanh nghi thức' : 'Bật âm thanh nghi thức'}
            title={isSoundOn ? 'Âm thanh: Đang bật' : 'Âm thanh: Đang tắt'}
            className="w-8 h-8 rounded-full bg-[#14121F] hover:bg-[#1D192C] border border-[#C9A24A]/30 text-[#C9A24A] flex items-center justify-center transition-all cursor-pointer hover:border-[#C9A24A]"
          >
            {isSoundOn ? (
              <Volume2 className="w-4 h-4 text-[#C9A24A]" />
            ) : (
              <VolumeX className="w-4 h-4 text-[#9E96B0]" />
            )}
          </button>

          <Link
            href="/me"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer shadow-sm ${
              isStarGlowing
                ? 'bg-[#C9A24A]/30 border-[#C9A24A] text-white ring-2 ring-[#C9A24A]/50 scale-105'
                : 'bg-[#14121F] hover:bg-[#1D192C] border-[#C9A24A]/40 text-[#E5C687]'
            }`}
            title="Ví Sao"
          >
            <Star className={`w-3.5 h-3.5 fill-[#C9A24A] text-[#C9A24A] ${isStarGlowing ? 'animate-bounce' : ''}`} />
            <span>{effectiveStars} Sao</span>
          </Link>

          <Link
            href="/me"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#14121F] hover:bg-[#1D192C] border border-[#262235] text-xs font-medium text-[#9E96B0] hover:text-[#F8F5F0] transition-colors cursor-pointer"
            title="Lượt trải bài hôm nay"
          >
            <span>🔮 {effectiveRemaining} lượt</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
