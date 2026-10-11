'use client';

import React from 'react';

interface HamsterLoaderProps {
  message?: string;
  subMessage?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function HamsterLoader({
  message = 'Đang kết nối từ trường vũ trụ...',
  subMessage = 'Các lá bài đang được giải mã theo dòng năng lượng của bạn',
  size = 'md',
}: HamsterLoaderProps) {
  const scale = size === 'sm' ? 'scale-75' : size === 'lg' ? 'scale-110' : 'scale-90 sm:scale-100';

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none">
      <div className={`transform ${scale} transition-transform`}>
        <div
          aria-label="Orange and tan hamster running in a metal wheel"
          role="img"
          className="wheel-and-hamster mx-auto"
        >
          <div className="wheel" />
          <div className="hamster">
            <div className="hamster__body">
              <div className="hamster__head">
                <div className="hamster__ear" />
                <div className="hamster__eye" />
                <div className="hamster__nose" />
              </div>
              <div className="hamster__limb hamster__limb--fr" />
              <div className="hamster__limb hamster__limb--fl" />
              <div className="hamster__limb hamster__limb--br" />
              <div className="hamster__limb hamster__limb--bl" />
              <div className="hamster__tail" />
            </div>
          </div>
          <div className="spoke" />
        </div>
      </div>

      {message && (
        <h3 className="font-display text-base sm:text-lg font-bold text-[#F8F5F0] mt-6 mb-1.5 tracking-wide">
          {message}
        </h3>
      )}

      {subMessage && (
        <p className="text-xs text-[#9E96B0] max-w-xs leading-relaxed font-sans">
          {subMessage}
        </p>
      )}
    </div>
  );
}
