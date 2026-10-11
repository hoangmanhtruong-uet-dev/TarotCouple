'use client';

import React from 'react';
import { FunnelAnalyticsModal } from '@/components/FunnelAnalyticsModal';
import { useRouter } from 'next/navigation';

export default function AdminFunnelPage() {
  const router = useRouter();

  return (
    <div>
      <FunnelAnalyticsModal
        isOpen={true}
        onClose={() => router.push('/')}
      />
    </div>
  );
}
