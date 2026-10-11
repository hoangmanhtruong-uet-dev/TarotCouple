'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Heart, ArrowRight, Shield, Zap, Star } from 'lucide-react';
import CelestialSkyCanvas from '@/components/CelestialSkyCanvas';
import { STAGGER_TIMINGS, TRANSITION_EASINGS, SPRINGS } from '@/lib/motion';

// 5 Fan Cards with official RWS 1909 artwork and fallbacks
const FAN_CARDS = [
  {
    roman: '0',
    title: 'Kẻ Khờ',
    angle: -22,
    x: -95,
    y: 14,
    image: 'https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg',
  },
  {
    roman: 'I',
    title: 'Pháp Sư',
    angle: -11,
    x: -48,
    y: 5,
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg',
  },
  {
    roman: 'XIX',
    title: 'Mặt Trời',
    angle: 0,
    x: 0,
    y: 0,
    // Lá trung tâm ở phía trước
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg',
    isFront: true,
  },
  {
    roman: 'VI',
    title: 'Người Tình',
    angle: 11,
    x: 48,
    y: 5,
    // Sửa link Lovers chuẩn Wikimedia Commons (tránh lỗi 404 ô '?' xanh)
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/RWS_Tarot_06_Lovers.jpg',
  },
  {
    roman: 'XXI',
    title: 'Thế Giới',
    angle: 22,
    x: 95,
    y: 14,
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/RWS_Tarot_21_World.jpg',
  },
];

export default function MarketingLandingPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [isPending, startTransition] = useTransition();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [isNavigatingSolo, setIsNavigatingSolo] = useState(false);
  const [isNavigatingCouple, setIsNavigatingCouple] = useState(false);

  // Check sessionStorage for fast entry animation on revisit
  useEffect(() => {
    try {
      const hasVisited = sessionStorage.getItem('tc_visited_landing');
      if (hasVisited) {
        setIsFirstVisit(false);
      } else {
        sessionStorage.setItem('tc_visited_landing', 'true');
      }
    } catch {
      // Ignore in private browsing mode
    }
  }, []);

  const handleImageError = (roman: string) => {
    setImageErrors((prev) => ({ ...prev, [roman]: true }));
  };

  const handleSoloClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isNavigatingSolo || isNavigatingCouple) return;
    setIsNavigatingSolo(true);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {}
    }

    // Call router.push early around 250ms without waiting for full exit animation
    setTimeout(() => {
      startTransition(() => {
        router.push('/reading/reader');
      });
    }, 250);
  };

  const handleCoupleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isNavigatingSolo || isNavigatingCouple) return;
    setIsNavigatingCouple(true);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {}
    }

    setTimeout(() => {
      startTransition(() => {
        router.push('/couple');
      });
    }, 250);
  };

  const animDelayFactor = isFirstVisit ? 1 : 0.4;

  return (
    <div
      className={`relative overflow-hidden min-h-[calc(100vh-4rem)] transition-colors duration-400 ${
        isNavigatingCouple ? 'bg-[#18091E]' : 'bg-[#0B0A12]'
      }`}
    >
      {/* PHẦN 1: Nền Aurora Gradient trôi chậm & Film Grain Noise */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Lớp Aurora 1 (Tím sâu) */}
        <div
          className={`absolute -top-32 -left-32 w-96 h-96 sm:w-[500px] sm:h-[500px] rounded-full blur-[90px] bg-gradient-to-br from-[#4A154B]/30 via-[#2A103C]/20 to-transparent ${
            !shouldReduceMotion ? 'animate-aurora-1' : 'opacity-25'
          }`}
        />
        {/* Lớp Aurora 2 (Xanh ngọc pha hoàng kim) */}
        <div
          className={`absolute top-1/4 -right-24 w-80 h-80 sm:w-[450px] sm:h-[450px] rounded-full blur-[85px] bg-gradient-to-bl from-[#0D3B3A]/25 via-[#D9B36A]/15 to-transparent ${
            !shouldReduceMotion ? 'animate-aurora-2' : 'opacity-20'
          }`}
        />
        {/* Radial vignette che cạnh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(217,179,106,0.12)_0%,rgba(11,10,18,0.7)_55%,rgba(11,10,18,1)_95%)]" />
        {/* Lớp Noise / Grain 3-4% */}
        <div className="absolute inset-0 bg-noise pointer-events-none opacity-40 mix-blend-overlay" />
      </div>

      {/* PHẦN 1: Bầu trời sao Canvas Parallax 2 lớp + Sao băng (tắt khi reduce-motion) */}
      <CelestialSkyCanvas reducedMotion={Boolean(shouldReduceMotion)} />

      {/* Main Content Layout */}
      <div className="relative max-w-5xl mx-auto px-4 py-4 sm:py-6 lg:py-4 flex flex-col justify-between min-h-[calc(100vh-8.5rem)] text-center z-10">
        {/* PHẦN 2: Top Pill (0.1s fade + slide) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: STAGGER_TIMINGS.headerPill * animDelayFactor,
            ease: TRANSITION_EASINGS.smoothOut,
          }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#14121F]/90 border border-[#D9B36A]/40 text-[11px] sm:text-xs text-[#E5C687] mx-auto mb-2 sm:mb-3 shadow-[0_2px_15px_rgba(217,179,106,0.12)] shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D9B36A] animate-pulse" />
          <span className="font-medium tracking-wide">Tarot AI Phản Chiếu Tâm Lý</span>
        </motion.div>

        {/* PHẦN 2: Tiêu đề & Mô tả */}
        <div className="shrink-0 mb-3 sm:mb-4">
          <h1 className="font-display text-3xl sm:text-5xl lg:text-5xl font-bold tracking-tight text-[#F8F5F0] leading-tight mb-2.5">
            <span className="inline-block">
              {['Vũ', 'Trụ', 'Không', 'Trả', 'Lời', 'Sai,'].map((word, wIdx) => (
                <motion.span
                  key={wIdx}
                  initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{
                    duration: 0.45,
                    delay: (0.15 + wIdx * 0.05) * animDelayFactor,
                    ease: TRANSITION_EASINGS.smoothOut,
                  }}
                  className="inline-block mr-1.5 sm:mr-2"
                >
                  {word}
                </motion.span>
              ))}
            </span>
            <br />
            <motion.span
              initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                duration: 0.6,
                delay: (0.5) * animDelayFactor,
                ease: TRANSITION_EASINGS.smoothOut,
              }}
              className="shimmer-sweep font-display italic inline-block mt-0.5"
            >
              Chỉ Bạn Đang Tự Lừa Mình
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.45 * animDelayFactor,
              ease: TRANSITION_EASINGS.smoothOut,
            }}
            className="max-w-xl mx-auto text-xs sm:text-sm text-[#9E96B0] leading-relaxed font-sans"
          >
            Bốc bài Tarot cá nhân hoặc bói đôi cùng người ấy. Chọn Reader hợp gu, nhận câu chốt hạ sắc bén và xuất ảnh Story 9:16 để khoe. Miễn phí 3 lượt mỗi ngày.
          </motion.p>
        </div>

        {/* PHẦN 3: Bộ bài xòe quạt 5 lá */}
        <div className="relative h-38 sm:h-46 lg:h-46 max-w-xs mx-auto my-2 sm:my-3 flex items-center justify-center shrink-0">
          {FAN_CARDS.map((card, idx) => {
            const isError = imageErrors[card.roman];
            return (
              <motion.div
                key={card.roman}
                initial={
                  shouldReduceMotion
                    ? { opacity: 1, rotate: card.angle, x: card.x, y: card.y }
                    : {
                        opacity: 0,
                        scale: 0.7,
                        rotate: 0,
                        x: 0,
                        y: 30,
                      }
                }
                animate={
                  isNavigatingSolo
                    ? {
                        opacity: 0.8,
                        scale: 0.85,
                        rotate: 0,
                        x: 0,
                        y: 0,
                        transition: { duration: 0.35, ease: TRANSITION_EASINGS.smoothInOut },
                      }
                    : {
                        opacity: 1,
                        scale: 1,
                        rotate: card.angle,
                        x: card.x,
                        y: card.y,
                      }
                }
                whileHover={
                  shouldReduceMotion
                    ? {}
                    : {
                        scale: 1.1,
                        y: card.y - 14,
                        zIndex: 40,
                        transition: SPRINGS.gentle,
                      }
                }
                transition={{
                  duration: 0.65,
                  delay: (0.35 + idx * 0.07) * animDelayFactor,
                  ease: TRANSITION_EASINGS.smoothOut,
                }}
                className="absolute w-20 h-32 sm:w-26 sm:h-40 rounded-2xl p-1 sm:p-1.5 bg-gradient-to-b from-[#251D3A] via-[#161224] to-[#0B0A12] border border-[#D9B36A]/50 shadow-[0_8px_30px_rgba(0,0,0,0.85)] cursor-pointer flex flex-col justify-between"
                style={{ zIndex: card.isFront ? 30 : idx + 10 }}
              >
                <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#0B0A12] border border-[#D9B36A]/35 flex flex-col justify-between p-1 aspect-[2/3]">
                  {/* Top Bar trên lá bài */}
                  <div className="flex justify-between items-center text-[8px] sm:text-[9px] text-[#D9B36A] font-bold z-10 bg-black/70 px-1 py-0.5 rounded backdrop-blur-xs">
                    <span>{card.roman}</span>
                    {/* Chỉ lá ở phía trước mới hiện tên đầy đủ per requirement Phần 0.3 */}
                    {card.isFront && (
                      <span className="text-[7.5px] sm:text-[8.5px] text-[#E5C687] font-medium tracking-tight">
                        {card.title}
                      </span>
                    )}
                  </div>

                  {/* Artwork minh họa hoặc mặt sau fallback */}
                  <div className="absolute inset-0 opacity-90">
                    {!isError ? (
                      <img
                        src={card.image}
                        alt={card.title}
                        loading={idx === 0 ? 'eager' : 'lazy'}
                        onError={() => handleImageError(card.roman)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      // Fallback mặt sau phát sáng huyền ảo khi ảnh mạng lỗi
                      <div className="w-full h-full bg-gradient-to-b from-[#2D1B4E] to-[#120F1D] flex flex-col items-center justify-center p-2 text-center">
                        <div className="w-7 h-7 rounded-full border border-[#D9B36A]/60 flex items-center justify-center shadow-[0_0_12px_rgba(217,179,106,0.4)] mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-[#E5C687]" />
                        </div>
                        <span className="text-[8px] text-[#D9B36A] font-serif font-bold">
                          {card.roman}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />
                  </div>

                  {/* Sub-label */}
                  <div className="text-[7px] sm:text-[8px] text-center tracking-widest text-[#D9B36A]/80 font-bold uppercase z-10 mt-auto">
                    {card.roman}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* PHẦN 4 & PHẦN 0.6: Hai nút chính rộng chuẩn (trừ lề 20px, cao 56px) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.65 * animDelayFactor,
            ease: TRANSITION_EASINGS.smoothOut,
          }}
          className="w-full max-w-[calc(100%-40px)] sm:max-w-md mx-auto my-3 sm:my-4 flex flex-col sm:flex-row items-center justify-center gap-3 shrink-0"
        >
          {/* Nút chính: Bốc Bài Cá Nhân */}
          <Link
            href="/reading/reader"
            onClick={handleSoloClick}
            className={`w-full sm:flex-1 h-14 inline-flex items-center justify-center gap-2 px-6 rounded-2xl bg-gradient-to-r from-[#D9B36A] via-[#E5C687] to-[#C49A4D] text-[#0B0A12] font-bold text-sm sm:text-base transition-all transform active:scale-95 cursor-pointer relative overflow-hidden select-none ${
              !shouldReduceMotion ? 'animate-breath-glow' : 'shadow-[0_4px_20px_rgba(217,179,106,0.35)]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#0B0A12] shrink-0" />
            <span className="tracking-wide">Bốc Bài Cá Nhân</span>
            <ArrowRight className="w-4 h-4 ml-0.5 shrink-0 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Nút phụ: Bói Đôi Cùng Người Ấy */}
          <Link
            href="/couple"
            onClick={handleCoupleClick}
            className="w-full sm:flex-1 h-14 inline-flex items-center justify-center gap-2 px-6 rounded-2xl bg-[#14121F]/90 hover:bg-[#1D192C] border-2 border-[#D9B36A]/60 text-[#F8F5F0] font-bold text-sm sm:text-base shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-all transform active:scale-95 cursor-pointer select-none"
          >
            <Heart className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
            <span className="tracking-wide">Bói Đôi Cùng Người Ấy</span>
          </Link>
        </motion.div>

        {/* PHẦN 0.2 & 0.5: Dải tin cậy chuẩn copy, không bị cắt chữ ở 360px */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 * animDelayFactor }}
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] sm:text-xs text-[#9E96B0] border-t border-[#262235]/60 pt-3 sm:pt-4 px-2 shrink-0"
        >
          <div className="flex items-center gap-1.5 shrink-0">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ẩn danh hóa trước khi gửi AI</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Zap className="w-3.5 h-3.5 text-[#D9B36A]" />
            <span>Xáo bài ngẫu nhiên thật</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span>Trọn bộ 78 lá RWS</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
