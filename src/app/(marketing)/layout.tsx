import React from 'react';
import CleanHeader from '@/components/CleanHeader';
import AppBottomNav from '@/components/AppBottomNav';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Preload 5 hero fan cards to prevent layout shift */}
      <link rel="preload" as="image" href="https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg" />
      <link rel="preload" as="image" href="https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg" />
      <link rel="preload" as="image" href="https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg" />
      <link rel="preload" as="image" href="https://upload.wikimedia.org/wikipedia/commons/d/d8/RWS_Tarot_06_Lovers.jpg" />
      <link rel="preload" as="image" href="https://upload.wikimedia.org/wikipedia/commons/f/ff/RWS_Tarot_21_World.jpg" />

      <div className="min-h-dvh bg-[#0B0A12] text-[#F8F5F0] flex flex-col justify-between relative selection:bg-[#D9B36A]/30 selection:text-[#E5C687]">
        <CleanHeader />
        <main className="flex-1 pb-24">{children}</main>
        <AppBottomNav />
      </div>
    </>
  );
}
