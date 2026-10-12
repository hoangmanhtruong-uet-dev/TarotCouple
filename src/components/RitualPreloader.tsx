'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RitualPreloaderProps {
  onComplete?: () => void;
}

export function RitualPreloader({ onComplete }: RitualPreloaderProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if preloader already ran in this session so navigation back is fast
    try {
      const done = sessionStorage.getItem('tc_ritual_preloader_done');
      if (done === '1') {
        setProgress(100);
        setIsVisible(false);
        onComplete?.();
        return;
      }
    } catch {
      // ignore storage errors
    }

    let rafId = 0;
    const startTime = performance.now();
    const durationMs = 1150;

    const updateCounter = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      // Cubic ease-out for ceremonial progress counter
      const eased = 1 - Math.pow(1 - t, 3);
      const currentPct = Math.round(eased * 100);
      setProgress(currentPct);

      if (t < 1) {
        rafId = requestAnimationFrame(updateCounter);
      } else {
        try {
          sessionStorage.setItem('tc_ritual_preloader_done', '1');
        } catch {
          // ignore
        }
        setTimeout(() => {
          setIsVisible(false);
          onComplete?.();
        }, 220);
      }
    };

    rafId = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(rafId);
  }, [onComplete]);

  // Draw Sacred Geometry Octagram on 2D Canvas while loading
  useEffect(() => {
    if (!isVisible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let angle = 0;

    const renderMandala = () => {
      angle += 0.018;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = 64;

      ctx.save();
      ctx.translate(cx, cy);

      // Outer Dashed Ring
      ctx.save();
      ctx.rotate(angle);
      ctx.strokeStyle = 'rgba(201, 162, 74, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Sacred Octagram (Two Counter-Rotating Squares)
      for (let s = 0; s < 2; s++) {
        ctx.save();
        ctx.rotate(-angle * 1.2 + (s * Math.PI) / 4);
        ctx.strokeStyle = 'rgba(229, 198, 135, 0.78)';
        ctx.lineWidth = 1.4;
        const box = radius * 0.68;
        ctx.strokeRect(-box / 2, -box / 2, box, box);
        ctx.restore();
      }

      // Inner Glowing Core
      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 28);
      grad.addColorStop(0, 'rgba(243, 229, 171, 0.9)');
      grad.addColorStop(0.5, 'rgba(201, 162, 74, 0.35)');
      grad.addColorStop(1, 'rgba(9, 8, 13, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      animId = requestAnimationFrame(renderMandala);
    };

    animId = requestAnimationFrame(renderMandala);
    return () => cancelAnimationFrame(animId);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          key="ritual-preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(12px)' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] bg-[#09080D] flex flex-col items-center justify-center select-none pointer-events-auto"
        >
          <canvas
            ref={canvasRef}
            width={180}
            height={180}
            className="w-36 h-36 sm:w-44 sm:h-44 mb-4"
          />

          <div className="text-[10px] uppercase tracking-[0.34em] text-[#C9A24A] font-semibold mb-2">
            KHỞI TẠO KHÔNG GIAN 3D & SHADERS
          </div>

          <div className="font-display text-5xl sm:text-6xl font-bold text-[#F8F5F0] tracking-tight tabular-nums">
            {String(progress).padStart(2, '0')}
            <span className="text-[#C9A24A] text-2xl sm:text-3xl ml-1">%</span>
          </div>

          {/* Minimal Progress Track */}
          <div className="w-48 sm:w-56 h-[2px] bg-white/10 rounded-full overflow-hidden mt-5">
            <div
              className="h-full bg-gradient-to-r from-[#8B5CF6] via-[#C9A24A] to-[#E879A8] transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
