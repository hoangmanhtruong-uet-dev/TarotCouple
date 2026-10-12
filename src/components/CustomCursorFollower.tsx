'use client';

import React, { useEffect, useRef, useState } from 'react';
import { soundManager } from '@/lib/sound-effects';

export function CustomCursorFollower() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const [isFinePointer, setIsFinePointer] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(pointer: fine)');
    if (!mql.matches) return;
    setIsFinePointer(true);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let rafId = 0;
    let isLoopRunning = false;
    let idleFrames = 0;
    let lastInteractiveEl: HTMLElement | null = null;

    const animateRing = () => {
      const dx = mouseX - ringX;
      const dy = mouseY - ringY;
      ringX += dx * 0.22;
      ringY += dy * 0.22;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX.toFixed(1)}px, ${ringY.toFixed(1)}px, 0)`;
      }

      if (Math.abs(dx) < 0.2 && Math.abs(dy) < 0.2) {
        idleFrames++;
      } else {
        idleFrames = 0;
      }

      // Automatically pause RAF loop when mouse stops moving to save 100% CPU
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
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }

      idleFrames = 0;
      if (!isLoopRunning) {
        isLoopRunning = true;
        rafId = requestAnimationFrame(animateRing);
      }
    };

    // Event delegation on mouseover (only fires when entering a new element, ZERO cost on mousemove)
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

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseover', handleMouseOver, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!isFinePointer) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[90] overflow-hidden hidden md:block"
    >
      {/* Center Sacred Gold Spark Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 -ml-1.5 -mt-1.5 w-3 h-3 rounded-full bg-[#C9A24A] will-change-transform"
      />

      {/* Magnetic Outer Halo Ring (DOM data-attribute driven, 0 React re-renders) */}
      <div
        ref={ringRef}
        data-active="false"
        className="fixed top-0 left-0 flex items-center justify-center rounded-full border border-[#C9A24A]/45 w-10 h-10 -ml-5 -mt-5 transition-[width,height,margin,background-color,border-color] duration-150 will-change-transform data-[active=true]:w-20 data-[active=true]:h-20 data-[active=true]:-ml-10 data-[active=true]:-mt-10 data-[active=true]:border-[#C9A24A] data-[active=true]:bg-[#C9A24A]/15"
      >
        <span
          ref={labelRef}
          className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#F8F5F0] text-center px-1 leading-tight"
        />
      </div>
    </div>
  );
}
