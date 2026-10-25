'use client';

import React, { useEffect, useState } from 'react';
import { Monitor } from 'lucide-react';

interface PhoneFrameContainerProps {
  children: React.ReactNode;
}

/**
 * H9: read the `frame`/`device` query param from `window.location` inside an
 * effect instead of `useSearchParams()`. `useSearchParams` at the root layout
 * opts the entire app into client navigation and, combined with a Suspense
 * fallback, double-mounts the whole tree (double SSG fetch). Reading the raw
 * location keeps `children` rendered exactly once and avoids the extra mount.
 */
function PhoneFrameContent({ children }: PhoneFrameContainerProps) {
  const [isFrameActive, setIsFrameActive] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const frameParam = params.get('frame');
    const deviceParam = params.get('device');

    if (frameParam === '1' || deviceParam === 'iphone') {
      setIsFrameActive(true);
    } else if (frameParam === '0') {
      setIsFrameActive(false);
    }
  }, []);

  if (!isFrameActive) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh bg-[#050408] sm:py-6 flex flex-col items-center justify-center relative">
      {/* Floating Toggle on Desktop */}
      <div className="hidden sm:flex justify-center mb-3 relative z-50">
        <button
          type="button"
          onClick={() => setIsFrameActive(false)}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#171424]/95 hover:bg-[#231D36] border border-[#C9A24A]/45 text-xs font-bold text-[#F3E5AB] shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-all cursor-pointer"
        >
          <Monitor className="w-3.5 h-3.5 text-[#C9A24A]" />
          <span>Thoát Khung ĐT (Toàn Màn Hình)</span>
        </button>
      </div>

      {/* iPhone 16 Pro Frame Wrapper */}
      <div className="w-full max-w-[420px] min-h-dvh sm:min-h-[852px] sm:max-h-[880px] bg-[#0B0A12] text-[#F8F5F0] flex flex-col justify-between relative sm:rounded-[48px] sm:border-[8px] sm:border-[#221F2D] sm:shadow-[0_0_80px_rgba(0,0,0,0.95)] overflow-x-hidden overflow-y-auto no-scrollbar">
        {/* Dynamic Island Notch (Only in Frame mode on Desktop) */}
        <div className="hidden sm:flex relative z-50 items-center justify-between px-6 pt-3 pb-1 bg-[#0B0A12] border-b border-white/5 select-none shrink-0">
          <span className="text-[11px] font-bold text-[#F8F5F0]/85 tracking-tight">
            9:41
          </span>
          <div className="h-5 w-28 rounded-full bg-black border border-white/15 shadow-inner flex items-center justify-end px-2.5">
            <span className="h-2 w-2 rounded-full bg-[#1A162B] ring-1 ring-emerald-400/50" />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#F8F5F0]/80">
            <span>5G</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
              100%
            </span>
          </div>
        </div>

        {/* Inner App Content */}
        <div className="flex-1 flex flex-col">{children}</div>
      </div>
    </div>
  );
}

export default function PhoneFrameContainer({ children }: PhoneFrameContainerProps) {
  return <PhoneFrameContent>{children}</PhoneFrameContent>;
}
