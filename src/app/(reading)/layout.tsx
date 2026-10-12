'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CleanHeader from '@/components/CleanHeader';
import { CheckCircle2 } from 'lucide-react';
import { useReadingStore } from '@/lib/reading-store';

const STEPS = [
  { step: 1, label: 'Chọn Reader', path: '/reading/reader' },
  { step: 2, label: 'Tâm sự', path: '/reading/chu-de' },
  { step: 3, label: 'Rút 3 lá', path: '/reading/rut-bai' },
  { step: 4, label: 'Kết quả', path: '/reading/ket-qua' },
];

const SUB_STEPS = [
  { id: 'chu-de', label: 'Chủ đề', path: '/reading/chu-de' },
  { id: 'noi-niem', label: 'Nỗi niềm', path: '/reading/noi-niem' },
  { id: 'bo-bai', label: 'Bộ bài', path: '/reading/bo-bai' },
];

export default function ReadingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const readerAccentColor = useReadingStore((state) => state.readerAccentColor);

  // Determine current step index
  const isStep2 =
    pathname.includes('/reading/ve-ban') ||
    pathname.includes('/reading/tam-su') ||
    pathname.includes('/reading/chu-de') ||
    pathname.includes('/reading/noi-niem') ||
    pathname.includes('/reading/bo-bai');

  let currentStepIdx = 1;
  if (isStep2) currentStepIdx = 2;
  else if (pathname.includes('/reading/rut-bai')) currentStepIdx = 3;
  else if (pathname.includes('/reading/ket-qua') || pathname.includes('/reading/story')) currentStepIdx = 4;

  let currentSubStep = 1;
  if (pathname.includes('/reading/noi-niem')) currentSubStep = 2;
  else if (pathname.includes('/reading/bo-bai')) currentSubStep = 3;

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
                <Link
                  href={s.path}
                  className={`flex items-center gap-1.5 sm:gap-2 transition-transform active:scale-95 ${
                    isCompleted || isCurrent ? 'cursor-pointer hover:opacity-90' : 'cursor-default pointer-events-none'
                  }`}
                >
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
                </Link>

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

        {/* 3 Chấm nhỏ chỉ vị trí con của Bước 2: Chủ đề • Nỗi niềm • Bộ bài */}
        {isStep2 && !pathname.includes('/reading/ve-ban') && (
          <div className="border-t border-[#262235]/60 bg-[#0B0A12]/80 py-1 px-4">
            <div className="max-w-xl mx-auto flex items-center justify-center gap-4 text-[10px]">
              {SUB_STEPS.map((sub, idx) => {
                const stepNum = idx + 1;
                const isSubActive = currentSubStep === stepNum;
                const isSubDone = currentSubStep > stepNum;

                return (
                  <div key={sub.id} className="flex items-center gap-1.5">
                    <div
                      className={`rounded-full transition-all duration-300 ${
                        isSubActive
                          ? 'w-4 h-1.5 bg-[#D9B36A] shadow-[0_0_8px_rgba(217,179,106,0.6)]'
                          : isSubDone
                          ? 'w-1.5 h-1.5 bg-emerald-400'
                          : 'w-1.5 h-1.5 bg-[#3B354D]'
                      }`}
                      style={{
                        backgroundColor: isSubActive ? readerAccentColor : undefined,
                        boxShadow: isSubActive ? `0 0 8px ${readerAccentColor}` : undefined,
                      }}
                    />
                    <span
                      className={`transition-colors ${
                        isSubActive
                          ? 'text-[#F8F5F0] font-bold'
                          : isSubDone
                          ? 'text-[#9E96B0]'
                          : 'text-[#5E5873]'
                      }`}
                    >
                      {sub.label}
                    </span>
                    {idx < SUB_STEPS.length - 1 && (
                      <span className="text-[#3B354D] text-[9px] ml-1.5">&bull;</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <main className="flex-1 pb-16">{children}</main>
    </div>
  );
}
