'use client';

import React from 'react';
import { TikTokStudioModal } from '@/components/TikTokStudioModal';
import { useRouter } from 'next/navigation';

export default function StudioPage() {
  const router = useRouter();

  return (
    <div>
      <TikTokStudioModal
        isOpen={true}
        onClose={() => router.push('/')}
      />
    </div>
  );
}
