'use client';

import React from 'react';
import { CoupleModeView } from '@/components/CoupleModeView';
import { useRouter } from 'next/navigation';

export default function CoupleIndexPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <CoupleModeView
        nickname="Linh"
        birthYear={2004}
        selectedReaderId="ba_co_mo_hon"
        onSelectReaderId={() => {}}
        deckMode="full_78"
        onOpenStoryModal={(reading) => {
          // Can redirect or open
        }}
      />
    </div>
  );
}
