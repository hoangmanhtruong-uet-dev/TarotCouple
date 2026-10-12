'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  Sparkles,
  Heart,
  ArrowRight,
  Star,
  Volume2,
  VolumeX,
  Compass,
} from 'lucide-react';
import CelestialSkyCanvas from '@/components/CelestialSkyCanvas';
import ReaderIntroModal from '@/components/ReaderIntroModal';
import {
  HeroTarotDeck3D,
  type ScrollBridgeState,
} from '@/components/HeroTarotDeck3D';
import { CustomCursorFollower } from '@/components/CustomCursorFollower';
import { RitualPreloader } from '@/components/RitualPreloader';
import { STAGGER_TIMINGS, TRANSITION_EASINGS, SPRINGS } from '@/lib/motion';
import { MAJOR_ARCANA } from '@/data/tarot-cards';
import { soundManager } from '@/lib/sound-effects';

// 5 Fan Cards with official RWS 1909 artwork and fallbacks
const INITIAL_FAN_CARDS = [
  {
    roman: '0',
    title: 'Kẻ Khờ',
    baseAngle: -22,
    baseX: -95,
    baseY: 14,
    image:
      'https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg',
    meaningSnippet:
      'Khởi đầu mới, bước nhảy niềm tin và tinh thần tự do không sợ hãi.',
  },
  {
    roman: 'I',
    title: 'Pháp Sư',
    baseAngle: -11,
    baseX: -48,
    baseY: 5,
    image:
      'https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg',
    meaningSnippet:
      'Chủ động, đầy đủ nguồn lực và khả năng biến ý tưởng thành hiện thực.',
  },
  {
    roman: 'XIX',
    title: 'Mặt Trời',
    baseAngle: 0,
    baseX: 0,
    baseY: 0,
    image:
      'https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg',
    isFront: true,
    meaningSnippet:
      'Sáng rõ, ấm áp, niềm vui ngập tràn và sự minh bạch trong mọi lựa chọn.',
  },
  {
    roman: 'VI',
    title: 'Người Tình',
    baseAngle: 11,
    baseX: 48,
    baseY: 5,
    image:
      'https://upload.wikimedia.org/wikipedia/commons/d/d8/RWS_Tarot_06_Lovers.jpg',
    meaningSnippet:
      'Sự đồng điệu sâu sắc và lựa chọn cam kết từ đáy con tim.',
  },
  {
    roman: 'XXI',
    title: 'Thế Giới',
    baseAngle: 22,
    baseX: 95,
    baseY: 14,
    image:
      'https://upload.wikimedia.org/wikipedia/commons/f/ff/RWS_Tarot_21_World.jpg',
    meaningSnippet:
      'Chu kỳ trọn vẹn, thành tựu xứng đáng và mở ra một chương mới rực rỡ.',
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
  const shouldReduceMotion = useReducedMotion();
  const rootContainerRef = useRef<HTMLDivElement | null>(null);
  // Zero-rerender transient scroll bridge shared directly with Three.js RAF loop
  const scrollStateRef = useRef<ScrollBridgeState>({
    progress: 0,
    velocity: 0,
  });

  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  // Navigation & Micro-interaction states
  const [isNavigatingSolo] = useState(false);
  const [isNavigatingCouple] = useState(false);
  const [soloRipple, setSoloRipple] = useState<RipplePos | null>(null);
  const [coupleHearts, setCoupleHearts] = useState<HeartParticle[]>([]);

  // Hybrid 3D WebGL + 2D Fallback
  const [use3DHeroDeck, setUse3DHeroDeck] = useState(true);
  const [isFanHovered, setIsFanHovered] = useState(false);
  const [activeCardIdx, setActiveCardIdx] = useState<number | null>(null);
  const [shiningCardIdx, setShiningCardIdx] = useState<number | null>(null);
  const [isAmbientOn, setIsAmbientOn] = useState(false);

  // Horizontal Drag Carousel through 22 Major Arcana cards
  const [majorCardOffset, setMajorCardOffset] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  // Reader Intro Modal State
  const [showReaderIntro, setShowReaderIntro] = useState(false);
  const [introIsCoupleMode, setIntroIsCoupleMode] = useState(false);

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

  // Initialize Lenis Smooth Scroll + GSAP ScrollTrigger Choreography (Zero React Re-renders)
  useEffect(() => {
    if (typeof window === 'undefined' || shouldReduceMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1.0,
    });

    lenis.on('scroll', (e: { progress?: number; velocity?: number }) => {
      ScrollTrigger.update();
      const prog = typeof e.progress === 'number' ? e.progress : 0;
      const vel = typeof e.velocity === 'number' ? e.velocity : 0;
      scrollStateRef.current.progress = prog;
      scrollStateRef.current.velocity = vel;

      if (Math.abs(vel) > 3.8) {
        soundManager.playScrollHarmonic(vel);
      }
    });

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // GPU-Composited Editorial Reveal Animations (transform + opacity only, NO blur filter lag)
    const ctx = gsap.context(() => {
      const editorialBlocks = gsap.utils.toArray<HTMLElement>('[data-gsap-reveal]');
      editorialBlocks.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, rootContainerRef);

    return () => {
      ctx.revert();
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, [shouldReduceMotion]);

  // Cleanup ambient drone on unmount
  useEffect(() => {
    return () => {
      soundManager.toggleAmbientDrone(false);
    };
  }, []);

  // Periodic Card Shine Sweep every 7s (only when in 2D mode)
  useEffect(() => {
    if (shouldReduceMotion || use3DHeroDeck) return;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * 5);
      setShiningCardIdx(randomIdx);
      setTimeout(() => {
        setShiningCardIdx(null);
      }, 900);
    }, 7000);

    return () => clearInterval(interval);
  }, [shouldReduceMotion, use3DHeroDeck]);

  const handleImageError = useCallback((roman: string) => {
    setImageErrors((prev) => ({ ...prev, [roman]: true }));
  }, []);

  const handleSelectCard = useCallback((idx: number) => {
    setActiveCardIdx((prev) => (prev === idx ? null : idx));
  }, []);

  const handleFallbackTo2D = useCallback(() => {
    setUse3DHeroDeck(false);
  }, []);

  // Solo Button Click with Ripple & Haptic
  const handleSoloClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (isNavigatingSolo || isNavigatingCouple) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setSoloRipple({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    soundManager.playMysticChime();

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {}
    }

    setIntroIsCoupleMode(false);
    setShowReaderIntro(true);
  };

  // Couple Button Click with Floating Hearts & Haptic
  const handleCoupleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (isNavigatingSolo || isNavigatingCouple) return;

    const newHearts: HeartParticle[] = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 80,
      y: -30 - Math.random() * 35,
    }));
    setCoupleHearts(newHearts);

    soundManager.playMysticChime();

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {}
    }

    setIntroIsCoupleMode(true);
    setShowReaderIntro(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartX(e.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStartX === null) return;
    const endX = e.changedTouches[0]?.clientX ?? dragStartX;
    const diff = dragStartX - endX;
    if (Math.abs(diff) > 40) {
      setMajorCardOffset((prev) => (prev + (diff > 0 ? 1 : -1) + 22) % 22);
    }
    setDragStartX(null);
  };

  const displayedFanCards = useMemo(
    () =>
      INITIAL_FAN_CARDS.map((card, i) => {
        const cardId = (i + majorCardOffset) % 22;
        const majorData = MAJOR_ARCANA[cardId];
        return {
          ...card,
          roman: majorData?.roman || card.roman,
          title: majorData?.name_vi || card.title,
          image: majorData?.rws_image_url || card.image,
          meaningSnippet: majorData?.core_meaning_up || card.meaningSnippet,
        };
      }),
    [majorCardOffset]
  );

  const animDelayFactor = isFirstVisit ? 1 : 0.4;

  return (
    <div
      ref={rootContainerRef}
      onClick={() => {
        if (activeCardIdx !== null) setActiveCardIdx(null);
      }}
      className={`relative overflow-x-hidden min-h-screen transition-colors duration-500 ${
        isNavigatingCouple ? 'bg-[#1D0824]' : 'bg-[#09080D]'
      }`}
    >
      {/* Màn hình chờ Nghi thức (Sacred Geometry Canvas 2D + 00% -> 100%) */}
      <RitualPreloader />

      {/* Con trỏ chuột từ tính (Magnetic Cursor Follower - 0 React re-renders) */}
      <CustomCursorFollower />

      {/* Nền Gradient Tối Ưu GPU (0 blur filter, 0 mix-blend-overlay lag) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,rgba(201,162,74,0.12)_0%,rgba(29,24,41,0.45)_40%,rgba(9,8,13,1)_90%)]"
      />

      <CelestialSkyCanvas reducedMotion={Boolean(shouldReduceMotion)} />

      {/* ================= CHƯƠNG I: KHAI MỞ ĐỊNH MỆNH (ACT I — THE ASTRAL THRESHOLD) ================= */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pt-4 sm:pt-6 pb-16 min-h-[calc(100vh-4rem)] flex flex-col justify-between">
        {/* Editorial Top Micro-Bar: Index + 3 Free Readings Pill + Spatial Audio Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-[#9E96B0] font-semibold">
            <span className="text-[#C9A24A]">01 / KHỞI NGUYÊN</span>
            <span className="hidden sm:inline">
              • SANCTUARY OF SELF-REFLECTION
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: STAGGER_TIMINGS.headerPill * animDelayFactor,
              ease: TRANSITION_EASINGS.smoothOut,
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#14111C]/90 border border-[#C9A24A]/40 text-[11px] text-[#E5C687] shadow-[0_2px_15px_rgba(201,162,74,0.15)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C9A24A]" />
            <span className="font-medium tracking-wide">
              3 lượt miễn phí mỗi ngày
            </span>
          </motion.div>

          <button
            type="button"
            data-cursor="ÂM THANH 432HZ"
            onClick={(e) => {
              e.stopPropagation();
              const playing = soundManager.toggleAmbientDrone();
              setIsAmbientOn(playing);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.18em] font-semibold border transition-all cursor-pointer ${
              isAmbientOn
                ? 'bg-[#C9A24A]/20 border-[#C9A24A] text-[#F8F5F0]'
                : 'bg-[#14111C]/80 border-white/10 text-[#9E96B0] hover:text-[#F8F5F0]'
            }`}
          >
            {isAmbientOn ? (
              <Volume2 className="w-3.5 h-3.5 text-[#C9A24A]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span>
              {isAmbientOn ? 'Ambient 432Hz: Bật' : 'Ambient 432Hz: Tắt'}
            </span>
          </button>
        </div>

        {/* Editorial Hero Typography */}
        <div className="text-center mt-4 sm:mt-6 mb-2">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.34em] text-[#C9A24A] font-semibold mb-2">
            NGHI THỨC BÓI BÀI TƯƠNG TÁC 3D • RWS 1909
          </p>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#F8F5F0] leading-[1.06] mb-3">
            Có chuyện gì trong lòng?
            <br />
            <motion.span
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.2 * animDelayFactor,
                ease: TRANSITION_EASINGS.smoothOut,
              }}
              className="shimmer-sweep font-display italic font-normal inline-block mt-1 text-[#C9A24A]"
            >
              Rút một lá nghe thử.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.45,
              delay: 0.35 * animDelayFactor,
              ease: TRANSITION_EASINGS.smoothOut,
            }}
            className="max-w-xl mx-auto text-xs sm:text-sm text-[#9E96B0] leading-relaxed font-sans"
          >
            Bốn Reader, ba lá bài, một câu soi lòng — miễn phí mỗi ngày. Không
            phải dự đoán tương lai, mà là một khoảng lặng để bạn hiểu rõ lòng
            mình hơn.
          </motion.p>
        </div>

        {/* Sân khấu 3D WebGL (Zero React Re-render Scroll Bridge) */}
        <div className="relative max-w-lg w-full mx-auto my-2 select-none">
          <div className="flex items-center justify-center mb-1.5">
            <button
              type="button"
              data-cursor="ĐỔI 3D / 2D"
              onClick={(e) => {
                e.stopPropagation();
                setUse3DHeroDeck((prev) => !prev);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#14111C]/90 border border-[#C9A24A]/35 text-[10px] font-semibold text-[#C9A24A] hover:border-[#C9A24A] transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>
                {use3DHeroDeck && !shouldReduceMotion
                  ? 'Không gian 3D Shader • Đổi sang 2D'
                  : 'Chế độ 2D Cổ điển • Bật 3D WebGL'}
              </span>
            </button>
          </div>

          {use3DHeroDeck && !shouldReduceMotion ? (
            <div onClick={(e) => e.stopPropagation()} className="relative">
              <HeroTarotDeck3D
                cards={displayedFanCards}
                activeCardIdx={activeCardIdx}
                scrollStateRef={scrollStateRef}
                isPaused={showReaderIntro}
                onSelectCard={handleSelectCard}
                onFallbackRequested={handleFallbackTo2D}
              />
              {activeCardIdx !== null && displayedFanCards[activeCardIdx] && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="mx-auto mt-1.5 w-64 sm:w-72 p-3 rounded-2xl bg-[#14111C]/95 border border-[#C9A24A]/60 shadow-[0_10px_25px_rgba(0,0,0,0.9)] text-[11px] text-[#F8F5F0] z-50 text-left"
                >
                  <div className="font-bold text-[#C9A24A] text-xs mb-0.5">
                    {displayedFanCards[activeCardIdx].roman} •{' '}
                    {displayedFanCards[activeCardIdx].title}
                  </div>
                  <p className="text-[10px] text-[#9E96B0] leading-snug line-clamp-2">
                    {displayedFanCards[activeCardIdx].meaningSnippet}
                  </p>
                </motion.div>
              )}
            </div>
          ) : (
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseEnter={() => setIsFanHovered(true)}
              onMouseLeave={() => setIsFanHovered(false)}
              className="relative h-44 sm:h-52 max-w-xs mx-auto flex items-center justify-center"
            >
              {displayedFanCards.map((card, idx) => {
                const isError = imageErrors[card.roman];
                const isSelected = activeCardIdx === idx;
                const isShining = shiningCardIdx === idx;
                const spreadMultiplier = isFanHovered ? 1.35 : 1;
                const calculatedAngle = card.baseAngle * spreadMultiplier;
                const calculatedX = card.baseX * spreadMultiplier;

                return (
                  <motion.div
                    key={`${card.roman}-${idx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveCardIdx(isSelected ? null : idx);
                    }}
                    initial={{
                      opacity: 1,
                      rotate: calculatedAngle,
                      x: calculatedX,
                      y: card.baseY,
                    }}
                    animate={
                      isSelected
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
                            rotate: calculatedAngle,
                            x: calculatedX,
                            y: card.baseY,
                          }
                    }
                    className="absolute w-20 h-32 sm:w-26 sm:h-40 rounded-2xl p-1 sm:p-1.5 bg-gradient-to-b from-[#251D3A] via-[#161224] to-[#09080D] border border-[#C9A24A]/50 shadow-[0_8px_30px_rgba(0,0,0,0.85)] cursor-pointer flex flex-col justify-between"
                    style={{
                      zIndex: isSelected ? 50 : card.isFront ? 30 : idx + 10,
                    }}
                  >
                    <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#09080D] border border-[#C9A24A]/35 flex flex-col justify-between p-1 aspect-[2/3]">
                      <div className="flex justify-between items-center text-[8px] sm:text-[9px] text-[#C9A24A] font-bold z-10 bg-black/75 px-1 py-0.5 rounded">
                        <span>{card.roman}</span>
                        {(card.isFront || isSelected) && (
                          <span className="text-[7.5px] sm:text-[8.5px] text-[#E5C687] font-medium truncate max-w-[55px]">
                            {card.title}
                          </span>
                        )}
                      </div>

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
                            <Sparkles className="w-3.5 h-3.5 text-[#E5C687] mb-1" />
                            <span className="text-[8px] text-[#C9A24A] font-serif font-bold">
                              {card.roman}
                            </span>
                          </div>
                        )}

                        {isShining && !shouldReduceMotion && (
                          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-card-shine pointer-events-none" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Hai nút Magnetic CTA chính */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.45,
            delay: 0.45 * animDelayFactor,
            ease: TRANSITION_EASINGS.smoothOut,
          }}
          className="w-full max-w-md mx-auto my-3 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/reading/reader"
            data-cursor="KHAI MỞ"
            onClick={handleSoloClick}
            aria-disabled={isNavigatingSolo}
            className="group w-full sm:flex-1 h-14 inline-flex items-center justify-center gap-2 px-6 rounded-2xl bg-gradient-to-r from-[#C9A24A] via-[#E5C687] to-[#C9A24A] text-[#09080D] font-bold text-sm sm:text-base shadow-[0_6px_25px_rgba(201,162,74,0.35)] transition-transform active:scale-[0.97] cursor-pointer relative overflow-hidden select-none"
          >
            {soloRipple && (
              <span
                className="absolute w-12 h-12 rounded-full bg-white/40 animate-ripple pointer-events-none"
                style={{ left: soloRipple.x - 24, top: soloRipple.y - 24 }}
              />
            )}

            <Sparkles className="w-4 h-4 text-[#09080D] shrink-0" />
            <span className="tracking-wide">Bắt đầu rút bài</span>
            <ArrowRight className="w-4 h-4 ml-0.5 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

          <Link
            href="/reading/reader?mode=couple"
            data-cursor="BÓI ĐÔI"
            onClick={handleCoupleClick}
            aria-disabled={isNavigatingCouple}
            className="group w-full sm:flex-1 h-14 inline-flex items-center justify-center gap-2 px-6 rounded-2xl bg-[#14111C]/95 hover:bg-[#1D1829] border-2 border-[#C9A24A]/60 text-[#F8F5F0] font-bold text-sm sm:text-base shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-all active:scale-[0.97] cursor-pointer relative overflow-hidden select-none"
          >
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

        {/* Scroll Indicator */}
        <div className="text-center pt-2">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#9E96B0]/80">
            ↓ Cuộn mượt để khám phá không gian 3D ↓
          </span>
        </div>
      </section>

      {/* ================= CHƯƠNG II: VÒNG XOÁY GIÁC QUAN (ACT II — ASYMMETRIC EDITORIAL GRID) ================= */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 py-20 sm:py-28 border-t border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Cột Trái (7/12): Oversized Editorial Serif Typography */}
          <div
            data-gsap-reveal
            className="lg:col-span-7 space-y-5 text-left will-change-transform"
          >
            <div className="text-[10px] uppercase tracking-[0.32em] text-[#C9A24A] font-semibold">
              02 / CHIỀU SÂU XÚC GIÁC • GLSL & PHYSICAL MATERIALS
            </div>

            <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold text-[#F8F5F0] leading-[1.08]">
              Mỗi lá bài là một{' '}
              <span className="italic font-normal text-[#C9A24A]">
                tấm gương phản chiếu
              </span>{' '}
              tần số thật trong tim bạn.
            </h2>

            <p className="text-sm sm:text-base text-[#9E96B0] leading-relaxed max-w-xl">
              Không gian nghi thức được chế tác bằng vật liệu 3D phản xạ ánh nến
              thực tế, vòng cung xòe bài Parabol có quán tính xúc giác và sóng
              năng lượng biến thiên theo từng nhịp chạm của bạn.
            </p>
          </div>

          {/* Cột Phải (5/12): Bố cục lệch tầng (Asymmetric Staggered Cards) */}
          <div
            data-gsap-reveal
            className="lg:col-span-5 lg:mt-16 space-y-5 text-left will-change-transform"
          >
            <div className="p-6 rounded-3xl bg-[#14111C]/95 border border-[#C9A24A]/35 shadow-[0_20px_50px_rgba(0,0,0,0.7)] space-y-2">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-[#C9A24A]">
                <span>NGHI THỨC 01</span>
                <span>RIFFLE & PARABOLIC ARC</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-[#F8F5F0]">
                Xáo Bài Riffle 3D & Rút Bài Quỹ Đạo Bézier
              </h3>
              <p className="text-xs sm:text-sm text-[#9E96B0] leading-relaxed">
                Lướt ngón tay qua 78 lá bài RWS 1909 xếp trên mặt trụ Parabol 3D,
                cảm nhận phản hồi rung Haptic và lắng nghe âm thanh mép giấy cổ
                chân thực.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#14111C]/95 border border-[#8B5CF6]/35 shadow-[0_20px_50px_rgba(0,0,0,0.7)] space-y-2 lg:translate-x-4">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-[#E879A8]">
                <span>NGHI THỨC 02</span>
                <span>COUPLE RESONANCE BRIDGE</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-[#F8F5F0]">
                Cầu Năng Lượng Bói Đôi 48 Giờ Bảo Mật
              </h3>
              <p className="text-xs sm:text-sm text-[#9E96B0] leading-relaxed">
                Kết nối lá bài của bạn và người ấy qua luồng hạt ánh sáng 3D mà
                vẫn giữ kín 100% câu hỏi riêng tư của người tạo phòng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CHƯƠNG III: ĐÀI TRIỆU HỒI ĐỊNH MỆNH (ACT III — THE RESONANCE PORTAL) ================= */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 py-16 sm:py-24 border-t border-white/10 text-center">
        <div
          data-gsap-reveal
          className="rounded-[2rem] bg-gradient-to-b from-[#1D1829]/95 to-[#14111C]/98 border border-[#C9A24A]/45 p-8 sm:p-12 shadow-[0_25px_80px_rgba(0,0,0,0.85)] space-y-6 will-change-transform"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#09080D]/80 border border-[#C9A24A]/40 text-[10px] uppercase tracking-[0.28em] text-[#C9A24A] font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>03 / CỔNG VÀO NGHI THỨC</span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-bold text-[#F8F5F0] leading-tight max-w-2xl mx-auto">
            Sẵn sàng lắng nghe thông điệp dành riêng cho bạn đêm nay?
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 max-w-lg mx-auto">
            <Link
              href="/reading/reader"
              data-cursor="RÚT BÀI NGAY"
              onClick={handleSoloClick}
              className="w-full sm:flex-1 h-14 inline-flex items-center justify-center gap-2 px-6 rounded-2xl bg-gradient-to-r from-[#C9A24A] via-[#E5C687] to-[#C9A24A] text-[#09080D] font-bold text-sm sm:text-base shadow-[0_10px_30px_rgba(201,162,74,0.35)] hover:brightness-110 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Bắt đầu rút bài</span>
            </Link>

            <Link
              href="/reading/reader?mode=couple"
              data-cursor="MỜI NGƯỜI ẤY"
              onClick={handleCoupleClick}
              className="w-full sm:flex-1 h-14 inline-flex items-center justify-center gap-2 px-6 rounded-2xl bg-[#09080D]/90 hover:bg-[#14111C] border border-[#C9A24A]/50 text-[#F8F5F0] font-bold text-sm sm:text-base transition-all cursor-pointer"
            >
              <Heart className="w-4 h-4 text-rose-400" />
              <span>Bói Đôi 48h</span>
            </Link>
          </div>

          {/* Dải thông tin đặc trưng tối giản */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] sm:text-xs text-[#9E96B0] border-t border-white/10 pt-5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A24A]" />
              <span>4 Reader đa góc nhìn</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>Chế độ bói đôi & check hợp cạ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span>Trọn bộ 78 lá chuẩn RWS 1909</span>
            </div>
          </div>
        </div>
      </section>

      {/* Reader Showcase Sequence Modal (1 -> 2 -> 3 -> 4 -> /reading/reader) */}
      <ReaderIntroModal
        isOpen={showReaderIntro}
        isCoupleMode={introIsCoupleMode}
        onClose={() => setShowReaderIntro(false)}
      />
    </div>
  );
}
