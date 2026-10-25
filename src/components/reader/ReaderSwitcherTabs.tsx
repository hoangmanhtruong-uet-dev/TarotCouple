'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { READERS } from '@/data/tarot-cards';
import { READER_SLUG_MAP } from '@/lib/reader-slugs';
import type { CanonicalReaderId } from '@/lib/reader-slugs';
import { SANCTUARY_SPEC_MAP } from '@/data/sanctuary-specs';

interface ReaderSwitcherTabsProps {
  activeReaderId: CanonicalReaderId;
  activeSlug: string;
}

export function ReaderSwitcherTabs({ activeReaderId, activeSlug }: ReaderSwitcherTabsProps) {
  return (
    <nav
      className="w-full border-b border-[#262235] bg-[#0E0D17]/90 backdrop-blur-md sticky top-[56px] z-30"
      aria-label="Chọn Reader"
    >
      <div className="max-w-2xl mx-auto px-3 flex items-center gap-0.5 overflow-x-auto scrollbar-none py-2">
        {READERS.map((r) => {
          const slug = READER_SLUG_MAP[r.id as CanonicalReaderId];
          const spec = SANCTUARY_SPEC_MAP[r.id as CanonicalReaderId];
          const isActive = r.id === activeReaderId;

          return (
            <Link
              key={r.id}
              href={`/reading/reader/${slug}`}
              className={`
                relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
                whitespace-nowrap transition-all duration-200
                ${isActive
                  ? 'text-[#F8F5F0] bg-[#14111C]'
                  : 'text-[#9E96B0] hover:text-[#F8F5F0] hover:bg-[#14111C]/50'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="reader-tab-indicator"
                  className="absolute inset-0 rounded-xl border"
                  style={{ borderColor: `${r.accent_color}60` }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: r.accent_color }}
                />
                <span>{r.name}</span>
                {spec && (
                  <span className="text-[9px] text-[#5E5873] font-mono">
                    {spec.roman}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}