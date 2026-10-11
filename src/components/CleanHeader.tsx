'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Star } from 'lucide-react';

interface CleanHeaderProps {
  starsBalance?: number;
  remainingToday?: number;
}

export default function CleanHeader({
  starsBalance = 15,
  remainingToday = 3,
}: CleanHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[#D9B36A]/20 bg-[#0B0A12]/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto h-14 px-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-left group cursor-pointer shrink-0"
        >
          <div className="w-8 h-8 rounded-full bg-[#14121F] border border-[#D9B36A]/50 flex items-center justify-center text-[#E5C687] shadow-[0_0_15px_rgba(217,179,106,0.2)] group-hover:border-[#E5C687] transition-colors">
            <Sparkles className="w-4 h-4 text-[#D9B36A]" />
          </div>
          <div>
            <span className="font-display text-base font-bold tracking-wider text-[#F8F5F0] block leading-none">
              TAROT COUPLE
            </span>
            <span className="text-[8px] tracking-[0.16em] uppercase text-[#D9B36A]">
              Tarot AI
            </span>
          </div>
        </Link>

        {/* 2 Chips: Ví Sao & Lượt (Clicks redirect to /me) */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/me"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#14121F] hover:bg-[#1D192C] border border-[#D9B36A]/40 text-xs font-semibold text-[#E5C687] transition-all cursor-pointer shadow-sm"
            title="Ví Sao"
          >
            <Star className="w-3.5 h-3.5 fill-[#D9B36A] text-[#D9B36A]" />
            <span>{starsBalance} Sao</span>
          </Link>

          <Link
            href="/me"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#14121F] hover:bg-[#1D192C] border border-[#262235] text-xs font-medium text-[#9E96B0] hover:text-[#F8F5F0] transition-colors cursor-pointer"
            title="Lượt trải bài hôm nay"
          >
            <span>🔮 {remainingToday} lượt</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
