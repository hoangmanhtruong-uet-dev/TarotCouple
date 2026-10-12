'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { CoupleModeView } from '@/components/CoupleModeView';
import { useReadingStore } from '@/lib/reading-store';

interface CoupleRoomPageProps {
  params: Promise<{
    roomCode: string;
  }>;
}

export default function CoupleRoomDynamicPage({ params }: CoupleRoomPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const roomCode = resolvedParams.roomCode?.toUpperCase();

  const selectedReaderId = useReadingStore((state) => state.selectedReaderId);
  const setSelectedReaderId = useReadingStore((state) => state.setSelectedReaderId);
  const nickname = useReadingStore((state) => state.nickname) || 'Người B';
  const birthYear = useReadingStore((state) => state.birthYear) || 2004;
  const setReadingSuccess = useReadingStore((state) => state.setReadingSuccess);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <CoupleModeView
        initialRoomCode={roomCode}
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
    </div>
  );
}
