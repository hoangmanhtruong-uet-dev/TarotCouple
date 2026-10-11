'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CleanHeader from '@/components/CleanHeader';
import { CheckCircle2 } from 'lucide-react';
import { useReadingStore } from '@/lib/reading-store';

const STEPS = [
  { step: 1, label: 'Chọn Reader', path: '/reading/reader' },
  { step: 2, label: 'Tâm sự', path: '/reading/tam-su' },
  { step: 3, label: 'Rút 3 lá', path: '/reading/rut-bai' },
  { step: 4, label: 'Kết quả', path: '/reading/ket-qua' },
];

export default function ReadingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const readerAccentColor = useReadingStore((state) => state.readerAccentColor);

  // Determine current step index
  let currentStepIdx = 1;
  if (pathname.includes('/reading/ve-ban') || pathname.includes('/reading/tam-su')) currentStepIdx = 2;
  else if (pathname.includes('/reading/rut-bai')) currentStepIdx = 3;
  else if (pathname.includes('/reading/ket-qua') || pathname.includes('/reading/story')) currentStepIdx = 4;

  return (
    <div
      className="min-h-dvh bg-[#0B0A12] text-[#F8F5F0] flex flex-col justify-between selection:bg-[#D9B36A]/30 selection:text-[#E5C687]"
      style={{
        // Set reader accent CSS variable for subtle branding
        ['--reader-accent' as string]: readerAccentColor,
      }}
    >
      <CleanHeader />

      {/* Stepper (Only visible in /reading flow) */}
      <div className="w-full border-b border-[#262235] bg-[#0E0D17]/80 backdrop-blur sticky top-14 z-30">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          {STEPS.map((s, idx) => {
            const isCompleted = currentStepIdx > s.step;
            const isCurrent = currentStepIdx === s.step;

            return (
              <React.Fragment key={s.step}>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-[#D9B36A] text-[#0B0A12] ring-2 ring-[#D9B36A]/40'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-[#1D192C] text-[#9E96B0] border border-[#262235]'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.step}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:inline ${
                      isCurrent
                        ? 'text-[#F8F5F0] font-bold'
                        : isCompleted
                        ? 'text-[#9E96B0]'
                        : 'text-[#5E5873]'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>

                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${
                      currentStepIdx > s.step ? 'bg-emerald-500/40' : 'bg-[#262235]'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <main className="flex-1 pb-16">{children}</main>
    </div>
  );
}
