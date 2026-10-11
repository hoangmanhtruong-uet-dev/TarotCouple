'use client';

import React from 'react';
import { CoupleModeView } from '@/components/CoupleModeView';
import { useRouter } from 'next/navigation';
import { useReadingStore } from '@/lib/reading-store';

export default function CoupleIndexPage() {
  const router = useRouter();
  const selectedReaderId = useReadingStore((state) => state.selectedReaderId);
  const setSelectedReaderId = useReadingStore((state) => state.setSelectedReaderId);
  const nickname = useReadingStore((state) => state.nickname) || 'Bạn';
  const birthYear = useReadingStore((state) => state.birthYear) || 2004;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <CoupleModeView
        nickname={nickname}
        birthYear={birthYear}
        selectedReaderId={selectedReaderId}
        onSelectReaderId={(readerId) => setSelectedReaderId(readerId)}
        deckMode="full_78"
        onOpenStoryModal={(reading) => {
          // Can redirect or open
        }}
      />
    </div>
  );
}
