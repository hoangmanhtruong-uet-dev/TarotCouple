'use client';

import React from 'react';
import { SpiritualWrappedModal } from '@/components/SpiritualWrappedModal';
import { useRouter } from 'next/navigation';

export default function WrappedStandalonePage() {
  const router = useRouter();

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <SpiritualWrappedModal
        isOpen={true}
        onClose={() => router.push('/me')}
        nickname="Linh"
        readerId="ba_ngoai"
      />
    </div>
  );
}
