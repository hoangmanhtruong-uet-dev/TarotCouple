'use client';

import React, { useEffect, useRef } from 'react';
import { soundManager } from '@/lib/sound-effects';

/**
 * Dual-Mode Interactive Cursor & Mobile Touch Aura Follower (Zero React Re-renders):
 * - Desktop (pointer: fine): Magnetic Gold Dot + Expanding Halo Ring with [data-cursor] label.
 * - Mobile / Tablet (touchstart / touchmove): Glowing Sacred Gold Touch Ripple + Finger Trail Aura
 *   so every tap or swipe on mobile screens produces unmistakable visual feedback at 60 FPS.
 */
export function CustomCursorFollower() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const touchBurstRef = useRef<HTMLDivElement | null>(null);
  const touchSparkRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let rafId = 0;
    let isLoopRunning = false;
    let idleFrames = 0;
    let lastInteractiveEl: HTMLElement | null = null;
    let touchHideTimeout: ReturnType<typeof setTimeout> | null = null;

    const animateRing = () => {
      const dx = mouseX - ringX;
      const dy = mouseY - ringY;
      ringX += dx * 0.22;
      ringY += dy * 0.22;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX.toFixed(
          1
        )}px, ${ringY.toFixed(1)}px, 0)`;
      }

      if (Math.abs(dx) < 0.2 && Math.abs(dy) < 0.2) {
        idleFrames++;
      } else {
        idleFrames = 0;
      }

      if (idleFrames < 15) {
        rafId = requestAnimationFrame(animateRing);
      } else {
        isLoopRunning = false;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (dotRef.current) {
        dotRef.current.style.opacity = '1';
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }
      if (ringRef.current) {
        ringRef.current.style.opacity = '1';
      }

      idleFrames = 0;
      if (!isLoopRunning) {
        isLoopRunning = true;
        rafId = requestAnimationFrame(animateRing);
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const interactiveEl = target?.closest(
        '[data-cursor], a, button, [role="button"]'
      ) as HTMLElement | null;

      if (interactiveEl === lastInteractiveEl) return;
      lastInteractiveEl = interactiveEl;

      const ringEl = ringRef.current;
      const labelEl = labelRef.current;
      if (!ringEl || !labelEl) return;

      if (interactiveEl) {
        const customText = interactiveEl.getAttribute('data-cursor') || '';
        labelEl.textContent = customText;
        ringEl.dataset.active = 'true';
        soundManager.playMagneticHover();
      } else {
        labelEl.textContent = '';
        ringEl.dataset.active = 'false';
      }
    };

    // Mobile Touch Burst & Finger Trail Aura (Zero React state, direct GPU transform)
    const updateTouchAura = (clientX: number, clientY: number, isStart: boolean) => {
      const burstEl = touchBurstRef.current;
      const sparkEl = touchSparkRef.current;
      if (!burstEl || !sparkEl) return;

      if (touchHideTimeout) clearTimeout(touchHideTimeout);

      sparkEl.style.opacity = '1';
      sparkEl.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) scale(1)`;

      burstEl.style.opacity = '1';
      burstEl.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) scale(${
        isStart ? '1.35' : '1.1'
      })`;

      if (isStart) {
        soundManager.playMagneticHover();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      updateTouchAura(touch.clientX, touch.clientY, true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      updateTouchAura(touch.clientX, touch.clientY, false);
    };

    const handleTouchEnd = () => {
      if (touchHideTimeout) clearTimeout(touchHideTimeout);
      touchHideTimeout = setTimeout(() => {
        if (touchBurstRef.current) {
          touchBurstRef.current.style.opacity = '0';
          touchBurstRef.current.style.transform += ' scale(0.5)';
        }
        if (touchSparkRef.current) {
          touchSparkRef.current.style.opacity = '0';
        }
      }, 220);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      if (touchHideTimeout) clearTimeout(touchHideTimeout);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[90] overflow-hidden"
    >
      {/* Desktop Magnetic Cursor Dot */}
      <div
        ref={dotRef}
        className="hidden md:block fixed top-0 left-0 -ml-1.5 -mt-1.5 w-3 h-3 rounded-full bg-[#C9A24A] opacity-0 will-change-transform"
      />

      {/* Desktop Magnetic Outer Halo Ring */}
      <div
        ref={ringRef}
        data-active="false"
        className="hidden md:flex fixed top-0 left-0 items-center justify-center rounded-full border border-[#C9A24A]/45 w-10 h-10 -ml-5 -mt-5 opacity-0 transition-[width,height,margin,background-color,border-color,opacity] duration-150 will-change-transform data-[active=true]:w-20 data-[active=true]:h-20 data-[active=true]:-ml-10 data-[active=true]:-mt-10 data-[active=true]:border-[#C9A24A] data-[active=true]:bg-[#C9A24A]/15"
      >
        <span
          ref={labelRef}
          className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#F8F5F0] text-center px-1 leading-tight"
        />
      </div>

      {/* Mobile Touch Golden Ripple Ring & Star Sparkle Trail */}
      <div
        ref={touchSparkRef}
        className="md:hidden fixed top-0 left-0 -ml-2 -mt-2 w-4 h-4 rounded-full bg-[#F3E5AB] shadow-[0_0_16px_#C9A24A] opacity-0 transition-opacity duration-150 will-change-transform"
      />
      <div
        ref={touchBurstRef}
        className="md:hidden fixed top-0 left-0 -ml-7 -mt-7 w-14 h-14 rounded-full border-2 border-[#C9A24A]/80 bg-[radial-gradient(circle,rgba(201,162,74,0.32)_0%,transparent_70%)] opacity-0 transition-[transform,opacity] duration-200 will-change-transform flex items-center justify-center"
      >
        <span className="text-[10px] text-[#F3E5AB]">✦</span>
      </div>
    </div>
  );
}
