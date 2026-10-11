'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useReadingStore } from '@/lib/reading-store';
import { READER_SLUG_MAP } from '@/lib/reader-slugs';

function ReaderIndexRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedReaderId = useReadingStore((state) => state.selectedReaderId);

  useEffect(() => {
    const slug = READER_SLUG_MAP[selectedReaderId] || 'ba-co-mo-hon';
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    router.replace(`/reading/reader/${slug}${query}`);
  }, [router, searchParams, selectedReaderId]);

  return (
    <div className="min-h-screen bg-[#09080D] flex items-center justify-center text-[#D9B36A] text-sm font-medium">
      Đang chuẩn bị lều Reader...
    </div>
  );
}

export default function ReaderSelectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09080D] flex items-center justify-center text-[#D9B36A] text-sm font-medium">Đang chuyển tới Reader...</div>}>
      <ReaderIndexRedirect />
    </Suspense>
  );
}
