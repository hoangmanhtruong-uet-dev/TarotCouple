'use client';

import React from 'react';
import {
  Quote,
  Sparkles,
  ThumbsDown,
  Compass,
  Volume2,
  Eye,
} from 'lucide-react';
import { FadeInView } from '@/components/ui';
import type { SanctuaryPersonaSpec } from '@/data/sanctuary-specs';
import { soundManager } from '@/lib/sound-effects';

interface ReaderDossierPanelProps {
  readerId: string;
  displayName: string;
  title: string;
  accentColor: string;
  sampleQuote: string;
  sampleReadingSnippet?: string;
  tagline: string;
  notSuitableText: string;
  spec: SanctuaryPersonaSpec;
  isSampleCardFlipped: boolean;
  affinityScore: number;
  onToggleSampleCard: () => void;
  readinessPctRef?: React.RefObject<HTMLSpanElement | null>;
}

export function ReaderDossierPanel({
  readerId,
  displayName,
  title,
  accentColor,
  sampleQuote,
  sampleReadingSnippet,
  tagline,
  notSuitableText,
  spec,
  isSampleCardFlipped,
  affinityScore,
  onToggleSampleCard,
  readinessPctRef,
}: ReaderDossierPanelProps) {
  return (
    <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
      {/* Header: Name + Ready Status */}
      <FadeInView delay={0.1}>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F8F5F0] leading-tight">
              {displayName}
            </h2>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              ● Sẵn Sàng Tiếp Đón
            </span>
          </div>
          <p
            style={{ color: accentColor }}
            className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em]"
          >
            {title}
          </p>
        </div>
      </FadeInView>

      {/* 3 Ritual Stat Cards */}
      <FadeInView delay={0.2}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-[#09080D]/90 border border-white/10">
            <div className="text-[9px] uppercase tracking-wider text-[#9E96B0]">
              Vật Tổ 3D Trấn Lều
            </div>
            <div
              style={{ color: accentColor }}
              className="text-xs font-bold mt-0.5 truncate"
            >
              {spec.totemName}
            </div>
          </div>

          <button
            type="button"
            onClick={() => soundManager.playReaderPersonaChord(readerId)}
            className="p-2.5 rounded-xl bg-[#09080D]/90 hover:bg-[#1A1626] border border-white/10 text-left transition-colors cursor-pointer"
          >
            <div className="text-[9px] uppercase tracking-wider text-[#9E96B0] flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-[#C9A24A]" />
              <span>Tần Số Cộng Hưởng (Bấm nghe)</span>
            </div>
            <div className="text-xs font-bold text-[#F8F5F0] mt-0.5 truncate">
              {spec.frequencyLabel}
            </div>
          </button>

          <div className="p-2.5 rounded-xl bg-[#09080D]/90 border border-white/10">
            <div className="text-[9px] uppercase tracking-wider text-[#9E96B0]">
              Phong Cách Trải Bài
            </div>
            <div className="text-xs font-bold text-[#F8F5F0] mt-0.5 truncate">
              {spec.spreadStyle}
            </div>
          </div>
        </div>
      </FadeInView>

      {/* Quote + Sample Reading Toggle */}
      <FadeInView delay={0.3}>
        <div className="p-3.5 rounded-2xl bg-[#09080D]/90 border border-[#262235] space-y-2 relative">
          <div className="flex items-start justify-between gap-2">
            <div className="relative pl-5">
              <Quote
                style={{ color: accentColor }}
                className="w-3.5 h-3.5 opacity-60 absolute top-0.5 left-0"
              />
              <p className="text-xs sm:text-sm italic text-[#F8F5F0] font-serif leading-relaxed">
                &ldquo;{sampleQuote}&rdquo;
              </p>
            </div>

            <button
              type="button"
              onClick={onToggleSampleCard}
              style={{
                borderColor: `${accentColor}50`,
                color: accentColor,
              }}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#14111C] border text-[10px] font-bold hover:brightness-110 transition-all cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>
                {isSampleCardFlipped ? 'Ẩn lời mẫu' : 'Thử giọng đọc'}
              </span>
            </button>
          </div>

          {isSampleCardFlipped && sampleReadingSnippet && (
            <div
              style={{ borderColor: `${accentColor}40` }}
              className="pt-2 mt-2 border-t text-xs text-[#E5C687] leading-relaxed"
            >
              <span className="font-bold uppercase text-[10px] tracking-wider block mb-0.5">
                🔮 Lời giải mẫu ({spec.signatureCardTitle}):
              </span>
              <span>{sampleReadingSnippet}</span>
            </div>
          )}
        </div>
      </FadeInView>

      {/* Fit vs Not Fit Cards */}
      <FadeInView delay={0.35}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-[#09080D]/70 border border-[#262235] text-xs space-y-1">
            <div className="font-bold text-[#E5C687] flex items-center gap-1">
              <span>✓ Hợp với bạn nếu:</span>
            </div>
            <p className="text-[#9E96B0] leading-relaxed">{tagline}</p>
          </div>

          <div className="p-3 rounded-xl bg-[#1C1217]/60 border border-rose-900/40 text-xs space-y-1">
            <div className="font-bold text-rose-400 flex items-center gap-1">
              <ThumbsDown className="w-3 h-3 text-rose-400" />
              <span>Không hợp nếu:</span>
            </div>
            <p className="text-[#B59AA3] leading-relaxed">{notSuitableText}</p>
          </div>
        </div>
      </FadeInView>

      {/* Topic Mastery Bars + Affinity */}
      <FadeInView delay={0.4}>
        <div className="p-3.5 rounded-2xl bg-[#09080D]/80 border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
            <span className="text-[#9E96B0] flex items-center gap-1">
              <Compass
                style={{ color: accentColor }}
                className="w-3.5 h-3.5"
              />
              <span>CHỈ SỐ CHUYÊN MÔN & TƯƠNG THÍCH TRỰC GIÁC</span>
            </span>
            <span ref={readinessPctRef} style={{ color: accentColor }}>
              {affinityScore}% TƯƠNG THÍCH
            </span>
          </div>

          <div className="space-y-2">
            {spec.topicMastery.map((item) => (
              <div key={item.topic} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#F8F5F0]/85">{item.topic}</span>
                  <span
                    style={{ color: accentColor }}
                    className="font-bold"
                  >
                    {item.score}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#1D192C] overflow-hidden">
                  <div
                    style={{
                      width: `${item.score}%`,
                      backgroundColor: accentColor,
                    }}
                    className="h-full rounded-full origin-left will-change-transform transition-all duration-700"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeInView>
    </div>
  );
}