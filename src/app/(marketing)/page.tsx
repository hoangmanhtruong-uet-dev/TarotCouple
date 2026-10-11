'use client';

import React, { useEffect, useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Heart, ArrowRight, Shield, Zap, Star } from 'lucide-react';
import CelestialSkyCanvas from '@/components/CelestialSkyCanvas';
import { STAGGER_TIMINGS, TRANSITION_EASINGS, SPRINGS } from '@/lib/motion';
import { MAJOR_ARCANA } from '@/data/tarot-cards';

// 5 Fan Cards with official RWS 1909 artwork and fallbacks
const INITIAL_FAN_CARDS = [
  {
    roman: '0',
    title: 'Kẻ Khờ',
    baseAngle: -22,
    baseX: -95,
    baseY: 14,
    image: 'https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg',
    meaningSnippet: 'Khởi đầu mới, bước nhảy niềm tin và tinh thần tự do không sợ hãi.',
  },
  {
    roman: 'I',
    title: 'Pháp Sư',
    baseAngle: -11,
    baseX: -48,
    baseY: 5,
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg',
    meaningSnippet: 'Chủ động, đầy đủ nguồn lực và khả năng biến ý tưởng thành hiện thực.',
  },
  {
    roman: 'XIX',
    title: 'Mặt Trời',
    baseAngle: 0,
    baseX: 0,
    baseY: 0,
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg',
    isFront: true,
    meaningSnippet: 'Sáng rõ, ấm áp, niềm vui ngập tràn và sự minh bạch trong mọi lựa chọn.',
  },
  {
    roman: 'VI',
    title: 'Người Tình',
    baseAngle: 11,
    baseX: 48,
    baseY: 5,
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/RWS_Tarot_06_Lovers.jpg',
    meaningSnippet: 'Sự đồng điệu sâu sắc và lựa chọn cam kết từ đáy con tim.',
  },
  {
    roman: 'XXI',
    title: 'Thế Giới',
    baseAngle: 22,
    baseX: 95,
    baseY: 14,
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/RWS_Tarot_21_World.jpg',
    meaningSnippet: 'Chu kỳ trọn vẹn, thành tựu xứng đáng và mở ra một chương mới rực rỡ.',
  },
];

interface RipplePos {
  x: number;
  y: number;
}

interface HeartParticle {
  id: number;
  x: number;
  y: number;
}

export default function MarketingLandingPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [isPending, startTransition] = useTransition();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  // Navigation states with View Transitions support
  const [isNavigatingSolo, setIsNavigatingSolo] = useState(false);
  const [isNavigatingCouple, setIsNavigatingCouple] = useState(false);
  const [soloRipple, setSoloRipple] = useState<RipplePos | null>(null);
  const [coupleHearts, setCoupleHearts] = useState<HeartParticle[]>([]);

  // Part 3 Fan Interactivity
  const [isFanHovered, setIsFanHovered] = useState(false);
  const [activeCardIdx, setActiveCardIdx] = useState<number | null>(null);
  const [shiningCardIdx, setShiningCardIdx] = useState<number | null>(null);

  // Horizontal Drag Carousel through 22 Major Arcana cards
  const [majorCardOffset, setMajorCardOffset] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

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

  // Periodic Card Shine Sweep every 6-8s on a random card
  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * 5);
      setShiningCardIdx(randomIdx);
      setTimeout(() => {
        setShiningCardIdx(null);
      }, 900);
    }, 7000);

    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  const handleImageError = (roman: string) => {
    setImageErrors((prev) => ({ ...prev, [roman]: true }));
  };

  // Solo Button Click with View Transitions & Vibration
  const handleSoloClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (isNavigatingSolo || isNavigatingCouple) return;

    // Trigger ripple at click coordinates
    const rect = e.currentTarget.getBoundingClientRect();
    setSoloRipple({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    setIsNavigatingSolo(true);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {}
    }

    // Call router.push early around 250ms without waiting for full exit animation
    setTimeout(() => {
      if (typeof document !== 'undefined' && 'startViewTransition' in document) {
        (document as any).startViewTransition(() => {
          startTransition(() => {
            router.push('/reading/reader');
          });
        });
      } else {
        startTransition(() => {
          router.push('/reading/reader');
        });
      }
    }, 250);
  };

  // Couple Button Click with Floating Hearts & Background Hue Shift
  const handleCoupleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (isNavigatingSolo || isNavigatingCouple) return;

    // Generate 5-6 floating heart particles
    const newHearts: HeartParticle[] = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 80,
      y: -30 - Math.random() * 35,
    }));
    setCoupleHearts(newHearts);

    setIsNavigatingCouple(true);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {}
    }

    setTimeout(() => {
      if (typeof document !== 'undefined' && 'startViewTransition' in document) {
        (document as any).startViewTransition(() => {
          startTransition(() => {
            router.push('/couple');
          });
        });
      } else {
        startTransition(() => {
          router.push('/couple');
        });
      }
    }, 250);
  };

  // Horizontal Drag across 22 Major Arcana cards with inertia
  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartX(e.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStartX === null) return;
    const endX = e.changedTouches[0]?.clientX ?? dragStartX;
    const diff = dragStartX - endX;
    if (Math.abs(diff) > 40) {
      // Rotate by step
      setMajorCardOffset((prev) => (prev + (diff > 0 ? 1 : -1) + 22) % 22);
    }
    setDragStartX(null);
  };

  // Map 5 cards with circular offset from Major Arcana
  const displayedFanCards = INITIAL_FAN_CARDS.map((card, i) => {
    const cardId = (i + majorCardOffset) % 22;
    const majorData = MAJOR_ARCANA[cardId];
    return {
      ...card,
      roman: majorData?.roman || card.roman,
      title: majorData?.name_vi || card.title,
      image: majorData?.rws_image_url || card.image,
      meaningSnippet: majorData?.core_meaning_up || card.meaningSnippet,
    };
  });

  const animDelayFactor = isFirstVisit ? 1 : 0.4;

  return (
    <div
      onClick={() => {
        // Tap outside active card to reset selection
        if (activeCardIdx !== null) setActiveCardIdx(null);
      }}
      className={`relative overflow-hidden min-h-[calc(100vh-4rem)] transition-colors duration-400 ${
        isNavigatingCouple ? 'bg-[#1D0824]' : 'bg-[#0B0A12]'
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
                delay: 0.5 * animDelayFactor,
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

        {/* PHẦN 3: Bộ bài xòe quạt 5 lá tương tác đa năng */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseEnter={() => setIsFanHovered(true)}
          onMouseLeave={() => setIsFanHovered(false)}
          className="relative h-44 sm:h-52 lg:h-52 max-w-xs mx-auto my-2 sm:my-3 flex items-center justify-center shrink-0 select-none"
        >
          {displayedFanCards.map((card, idx) => {
            const isError = imageErrors[card.roman];
            const isSelected = activeCardIdx === idx;
            const isShining = shiningCardIdx === idx;

            // Fan spread widening (+8 deg) on hover/touch-hold
            const spreadMultiplier = isFanHovered ? 1.35 : 1;
            const calculatedAngle = card.baseAngle * spreadMultiplier;
            const calculatedX = card.baseX * spreadMultiplier;

            // Idle floating physics: +/-4px & +/-0.8 deg out-of-phase
            const idlePhase = (idx * 1.2) % 6;

            return (
              <motion.div
                key={`${card.roman}-${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveCardIdx(isSelected ? null : idx);
                }}
                initial={
                  shouldReduceMotion
                    ? { opacity: 1, rotate: calculatedAngle, x: calculatedX, y: card.baseY }
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
                        opacity: 0.9,
                        scale: 0.8,
                        rotate: 0,
                        x: 0,
                        y: 0,
                        transition: { duration: 0.35, ease: TRANSITION_EASINGS.smoothInOut },
                      }
                    : isSelected
                    ? {
                        opacity: 1,
                        scale: 1.22,
                        rotate: 0,
                        x: 0,
                        y: -24,
                        zIndex: 50,
                        transition: SPRINGS.snappy,
                      }
                    : {
                        opacity: 1,
                        scale: 1,
                        rotate: shouldReduceMotion
                          ? calculatedAngle
                          : [
                              calculatedAngle - 0.8,
                              calculatedAngle + 0.8,
                              calculatedAngle - 0.8,
                            ],
                        x: calculatedX,
                        y: shouldReduceMotion
                          ? card.baseY
                          : [card.baseY - 4, card.baseY + 4, card.baseY - 4],
                        transition: shouldReduceMotion
                          ? { duration: 0.3 }
                          : {
                              rotate: {
                                duration: 5.5 + idlePhase,
                                repeat: Infinity,
                                ease: 'easeInOut',
                              },
                              y: {
                                duration: 5 + idlePhase,
                                repeat: Infinity,
                                ease: 'easeInOut',
                              },
                            },
                      }
                }
                whileHover={
                  shouldReduceMotion
                    ? {}
                    : {
                        scale: 1.12,
                        y: card.baseY - 14,
                        zIndex: 40,
                        transition: SPRINGS.gentle,
                      }
                }
                className="absolute w-20 h-32 sm:w-26 sm:h-40 rounded-2xl p-1 sm:p-1.5 bg-gradient-to-b from-[#251D3A] via-[#161224] to-[#0B0A12] border border-[#D9B36A]/50 shadow-[0_8px_30px_rgba(0,0,0,0.85)] cursor-pointer flex flex-col justify-between"
                style={{ zIndex: isSelected ? 50 : card.isFront ? 30 : idx + 10 }}
              >
                <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#0B0A12] border border-[#D9B36A]/35 flex flex-col justify-between p-1 aspect-[2/3]">
                  {/* Top Bar trên lá bài */}
                  <div className="flex justify-between items-center text-[8px] sm:text-[9px] text-[#D9B36A] font-bold z-10 bg-black/75 px-1 py-0.5 rounded backdrop-blur-xs">
                    <span>{card.roman}</span>
                    {(card.isFront || isSelected) && (
                      <span className="text-[7.5px] sm:text-[8.5px] text-[#E5C687] font-medium tracking-tight truncate max-w-[55px]">
                        {card.title}
                      </span>
                    )}
                  </div>

                  {/* Artwork minh họa hoặc mặt sau fallback */}
                  <div className="absolute inset-0 opacity-90 overflow-hidden">
                    {!isError ? (
                      <img
                        src={card.image}
                        alt={card.title}
                        loading={idx === 0 ? 'eager' : 'lazy'}
                        onError={() => handleImageError(card.roman)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-[#2D1B4E] to-[#120F1D] flex flex-col items-center justify-center p-2 text-center">
                        <div className="w-7 h-7 rounded-full border border-[#D9B36A]/60 flex items-center justify-center shadow-[0_0_12px_rgba(217,179,106,0.4)] mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-[#E5C687]" />
                        </div>
                        <span className="text-[8px] text-[#D9B36A] font-serif font-bold">
                          {card.roman}
                        </span>
                      </div>
                    )}

                    {/* Vệt sáng quét qua mặt 1 lá ngẫu nhiên mỗi 6-8s */}
                    {isShining && !shouldReduceMotion && (
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-card-shine pointer-events-none" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />
                  </div>

                  {/* Sub-label */}
                  <div className="text-[7px] sm:text-[8px] text-center tracking-widest text-[#D9B36A]/80 font-bold uppercase z-10 mt-auto">
                    {card.roman}
                  </div>
                </div>

                {/* Popover chi tiết khi chạm 1 lá bài */}
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-48 sm:w-56 p-2 rounded-xl bg-[#14121F]/95 border border-[#D9B36A]/60 shadow-[0_10px_25px_rgba(0,0,0,0.9)] backdrop-blur-md text-[10px] text-[#F8F5F0] z-50 text-left pointer-events-none"
                  >
                    <div className="font-bold text-[#E5C687] text-[11px] mb-0.5">
                      {card.roman} • {card.title}
                    </div>
                    <p className="text-[9.5px] text-[#9E96B0] leading-tight line-clamp-2">
                      {card.meaningSnippet}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* PHẦN 4 & PHẦN 0.6: Hai nút chính với hiệu ứng vi tương tác đầy đủ */}
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
            aria-disabled={isNavigatingSolo}
            className={`group w-full sm:flex-1 h-14 inline-flex items-center justify-center gap-2 px-6 rounded-2xl bg-gradient-to-r from-[#D9B36A] via-[#E5C687] to-[#C49A4D] text-[#0B0A12] font-bold text-sm sm:text-base transition-transform active:scale-[0.97] cursor-pointer relative overflow-hidden select-none ${
              !shouldReduceMotion ? 'animate-breath-glow' : 'shadow-[0_4px_20px_rgba(217,179,106,0.35)]'
            }`}
          >
            {/* Vệt sáng quét qua mỗi 5s */}
            {!shouldReduceMotion && (
              <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-button-sweep pointer-events-none" />
            )}

            {/* Ripple expand từ điểm click */}
            {soloRipple && (
              <span
                className="absolute w-12 h-12 rounded-full bg-white/40 animate-ripple pointer-events-none"
                style={{ left: soloRipple.x - 24, top: soloRipple.y - 24 }}
              />
            )}

            <Sparkles className="w-4 h-4 text-[#0B0A12] shrink-0" />
            <span className="tracking-wide">Bốc Bài Cá Nhân</span>
            <ArrowRight className="w-4 h-4 ml-0.5 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

          {/* Nút phụ: Bói Đôi Cùng Người Ấy */}
          <Link
            href="/couple"
            onClick={handleCoupleClick}
            aria-disabled={isNavigatingCouple}
            className="group w-full sm:flex-1 h-14 inline-flex items-center justify-center gap-2 px-6 rounded-2xl bg-[#14121F]/90 hover:bg-[#1D192C] border-2 border-[#D9B36A]/60 text-[#F8F5F0] font-bold text-sm sm:text-base shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-all active:scale-[0.97] cursor-pointer relative overflow-hidden select-none"
          >
            {/* Floating hearts bung lên khi bấm */}
            {coupleHearts.map((h) => (
              <span
                key={h.id}
                className="absolute text-rose-400 animate-float-heart pointer-events-none"
                style={
                  {
                    '--tw-translate-x': `${h.x}px`,
                    '--tw-translate-y': `${h.y}px`,
                  } as React.CSSProperties
                }
              >
                ❤️
              </span>
            ))}

            <Heart className="w-4 h-4 text-rose-400 shrink-0 transition-transform group-hover:scale-110" />
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
