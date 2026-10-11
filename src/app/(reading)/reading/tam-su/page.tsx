'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TamSuRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Bước 2 đã được tách thành luồng: /chu-de -> /noi-niem -> /bo-bai
    router.replace('/reading/chu-de');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center text-xs text-[#9E96B0]">
      <span>Đang chuyển tiếp tới bước chọn Chủ đề...</span>
    </div>
  );
}
