'use client';

import React, { Suspense } from 'react';
import { CoupleModeView } from '@/components/CoupleModeView';
import { CustomCursorFollower } from '@/components/CustomCursorFollower';
import { useRouter, useSearchParams } from 'next/navigation';
import { useReadingStore } from '@/lib/reading-store';

function CoupleIndexContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCodeParam = searchParams.get('coupleRoom') || searchParams.get('room');

  const selectedReaderId = useReadingStore((state) => state.selectedReaderId);
  const setSelectedReaderId = useReadingStore((state) => state.setSelectedReaderId);
  const nickname = useReadingStore((state) => state.nickname) || 'Bạn';
  const birthYear = useReadingStore((state) => state.birthYear) || 2004;

  const setReadingSuccess = useReadingStore((state) => state.setReadingSuccess);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <CoupleModeView
        initialRoomCode={roomCodeParam}
        nickname={nickname}
        birthYear={birthYear}
        selectedReaderId={selectedReaderId}
        onSelectReaderId={(readerId) => setSelectedReaderId(readerId)}
        deckMode="full_78"
        onOpenStoryModal={(reading) => {
          setReadingSuccess(reading);
          router.push('/reading/story');
        }}
      />
      <CustomCursorFollower />
    </div>
  );
}

export default function CoupleIndexPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-8 text-center text-xs text-[#9E96B0]">Đang tải phòng Bói Đôi...</div>}>
      <CoupleIndexContent />
    </Suspense>
  );
}
