import React from 'react';
import HamsterLoader from '@/components/HamsterLoader';

export default function GlobalLoading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <HamsterLoader
        message="Vũ trụ đang vận hành..."
        subMessage="Đang tải dữ liệu và chuẩn bị không gian bốc bài cho bạn"
      />
    </div>
  );
}
