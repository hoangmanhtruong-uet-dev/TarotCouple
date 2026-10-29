'use client';

import React from 'react';
import { TikTokStudioModal } from '@/components/TikTokStudioModal';
import { AdminAuthGate } from '@/components/AdminAuthGate';
import { useRouter } from 'next/navigation';

export default function StudioPage() {
  const router = useRouter();

  return (
    <AdminAuthGate
      title="Tarot Couple — TikTok Creator Studio"
      description="Nhập mã bí mật ADMIN_SECRET để truy cập công cụ tạo carousel TikTok tâm linh."
    >
      <div>
        <TikTokStudioModal
          isOpen={true}
          onClose={() => router.push('/')}
        />
      </div>
    </AdminAuthGate>
  );
}
