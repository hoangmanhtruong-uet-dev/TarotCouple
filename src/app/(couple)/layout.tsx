import React from 'react';
import CleanHeader from '@/components/CleanHeader';
import AppBottomNav from '@/components/AppBottomNav';

export default function CoupleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#0B0A12] text-[#F8F5F0] flex flex-col justify-between selection:bg-[#C9A24A]/30 selection:text-[#E5C687]">
      <CleanHeader />
      <main className="flex-1 pb-24">{children}</main>
      <AppBottomNav />
    </div>
  );
}
