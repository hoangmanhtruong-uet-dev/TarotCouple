'use client';

import React from 'react';
import { LegalPrivacyModal } from '@/components/LegalPrivacyModal';
import { useRouter } from 'next/navigation';

export default function LegalStandalonePage() {
  const router = useRouter();

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <LegalPrivacyModal
        isOpen={true}
        onClose={() => router.push('/')}
        onClearHistory={() => {
          try {
            localStorage.clear();
          } catch {}
        }}
        onResetSession={() => {
          try {
            sessionStorage.clear();
          } catch {}
        }}
      />
    </div>
  );
}
