'use client';

import dynamic from 'next/dynamic';
import type { ReaderId } from '@/lib/schemas';

// H7: ReaderProfileView pulls in three.js, gsap & lenis (~400KB total).
// Lazy-load it client-side only, so those heavy libraries never enter the
// server-rendered reading route bundle until the reader actually mounts.
const ReaderProfileView = dynamic(
  () => import('@/components/ReaderProfileView'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#09080D] flex items-center justify-center text-[#C9A24A] text-sm font-medium">
        Đang chuẩn bị lều Reader...
      </div>
    ),
  }
);

export default function ReaderProfileViewLazy({
  readerId,
  currentSlug,
}: {
  readerId: ReaderId;
  currentSlug: string;
}) {
  return <ReaderProfileView readerId={readerId} currentSlug={currentSlug} />;
}
