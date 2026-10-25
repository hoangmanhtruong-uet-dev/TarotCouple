'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Heart } from 'lucide-react';
import { GlowButton } from '@/components/ui';

interface ReaderBottomCTAProps {
  displayName: string;
  accentColor: string;
  activeSlug: string;
  isCoupleMode: boolean;
  onSelectAndProceed: () => void;
}

export function ReaderBottomCTA({
  displayName,
  accentColor,
  activeSlug,
  isCoupleMode,
  onSelectAndProceed,
}: ReaderBottomCTAProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0E0D17]/98 border-t border-[#262235] p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.85)]">
      <div className="max-w-xl mx-auto flex flex-col items-center gap-2">
        <GlowButton
          variant="primary"
          size="lg"
          fullWidth
          glowColor={`${accentColor}50`}
          icon={<Sparkles className="w-4 h-4" />}
          onClick={onSelectAndProceed}
        >
          <span>
            {isCoupleMode
              ? `Chọn ${displayName} & Bắt Đầu Bói Đôi`
              : `Vào Lều ${displayName}`}
          </span>
          <ArrowRight className="w-4 h-4" />
        </GlowButton>

        {!isCoupleMode && (
          <Link
            href={`/reading/reader/${activeSlug}?mode=couple`}
            className="inline-flex items-center gap-1.5 text-xs text-[#9E96B0] hover:text-[#E5C687] transition-colors"
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>
              Muốn bói cùng người ấy? Chuyển sang <strong>Bói Đôi</strong>{' '}
              &rarr;
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}