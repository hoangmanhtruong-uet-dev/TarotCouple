'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Heart, Compass, User } from 'lucide-react';

export default function AppBottomNav() {
  const pathname = usePathname();

  // Hide on reading flow sub-steps, wrapped, or story
  const isHidden =
    pathname.startsWith('/reading/rut-bai') ||
    pathname.startsWith('/reading/ket-qua') ||
    pathname.startsWith('/reading/story') ||
    pathname.startsWith('/wrapped') ||
    pathname.includes('/couple/room');

  if (isHidden) return null;

  const isHome = pathname === '/';
  const isReading = pathname.startsWith('/reading');
  const isCouple = pathname.startsWith('/couple');
  const isMe = pathname.startsWith('/me');

  return (
    <nav
      aria-label="Thanh điều hướng chính"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#C9A24A]/20 bg-[#0B0A12]/95 backdrop-blur-xl pb-safe"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 items-center px-2 pt-1.5 pb-1">
        {/* Tab 1: Trang chủ */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 transition active:scale-95 ${
            isHome ? 'text-[#E5C687]' : 'text-[#9E96B0] hover:text-white'
          }`}
        >
          <div
            className={`flex h-7 w-12 items-center justify-center rounded-full transition ${
              isHome ? 'bg-[#C9A24A]/20 border border-[#C9A24A]/40' : ''
            }`}
          >
            <Compass className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-medium tracking-tight">Trang chủ</span>
        </Link>

        {/* Tab 2: Bốc bài */}
        <Link
          href="/reading/reader"
          className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 transition active:scale-95 ${
            isReading ? 'text-[#E5C687]' : 'text-[#9E96B0] hover:text-white'
          }`}
        >
          <div
            className={`flex h-7 w-12 items-center justify-center rounded-full transition ${
              isReading ? 'bg-[#C9A24A]/20 border border-[#C9A24A]/40' : ''
            }`}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-medium tracking-tight">Bốc bài</span>
        </Link>

        {/* Tab 3: Bói đôi */}
        <Link
          href="/couple"
          className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 transition active:scale-95 ${
            isCouple ? 'text-[#E5C687]' : 'text-[#9E96B0] hover:text-white'
          }`}
        >
          <div
            className={`flex h-7 w-12 items-center justify-center rounded-full transition ${
              isCouple ? 'bg-[#C9A24A]/20 border border-[#C9A24A]/40' : ''
            }`}
          >
            <Heart className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-medium tracking-tight">Bói đôi</span>
        </Link>

        {/* Tab 4: Tôi */}
        <Link
          href="/me"
          className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 transition active:scale-95 ${
            isMe ? 'text-[#E5C687]' : 'text-[#9E96B0] hover:text-white'
          }`}
        >
          <div
            className={`flex h-7 w-12 items-center justify-center rounded-full transition ${
              isMe ? 'bg-[#C9A24A]/20 border border-[#C9A24A]/40' : ''
            }`}
          >
            <User className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-medium tracking-tight">Tôi</span>
        </Link>
      </div>
    </nav>
  );
}
