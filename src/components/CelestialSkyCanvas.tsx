'use client';

import React, { useEffect, useRef } from 'react';

interface CelestialSkyCanvasProps {
  reducedMotion?: boolean;
}

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  layer: number; // 1 = background (slow parallax), 2 = foreground (faster parallax)
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  alpha: number;
  active: boolean;
}

export default function CelestialSkyCanvas({ reducedMotion = false }: CelestialSkyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    let lastTime = performance.now();
    let shootingStarTimer = 0;
    let nextShootingStarInterval = 14000; // 14s

    // Parallax mouse position
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;

    // Detect device concurrency & low power mode
    const concurrency = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    const isLowPower = concurrency <= 4;
    const starCount = isLowPower ? 38 : 70;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Initialize stars
    const stars: Star[] = Array.from({ length: starCount }, () => {
      const baseAlpha = 0.2 + Math.random() * 0.7;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.6 + 0.6,
        baseAlpha,
        alpha: baseAlpha,
        twinkleSpeed: (Math.random() * 0.002 + 0.001) * (Math.random() > 0.5 ? 1 : -1),
        layer: Math.random() > 0.6 ? 2 : 1,
      };
    });

    const shootingStar: ShootingStar = {
      x: 0,
      y: 0,
      length: 0,
      speed: 0,
      angle: (Math.PI / 4) + (Math.random() * 0.2 - 0.1),
      alpha: 0,
      active: false,
    };

    const handleResize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Reposition stars inside bounds
      stars.forEach((s) => {
        s.x = Math.random() * width;
        s.y = Math.random() * height;
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (reducedMotion) return;
      const normX = (e.clientX / width - 0.5) * 2;
      const normY = (e.clientY / height - 0.5) * 2;
      targetParallaxX = normX * 16;
      targetParallaxY = normY * 16;
    };

    const handleScroll = () => {
      if (reducedMotion) return;
      targetParallaxY = (window.scrollY / 400) * 14;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // IntersectionObserver to pause rendering when hero is out of view
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry ? entry.isIntersecting : true;
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    // Tab visibility handling
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisible = false;
      } else {
        isVisible = true;
        lastTime = performance.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const spawnShootingStar = () => {
      shootingStar.active = true;
      shootingStar.x = Math.random() * (width * 0.7);
      shootingStar.y = Math.random() * (height * 0.35);
      shootingStar.length = 60 + Math.random() * 60;
      shootingStar.speed = 10 + Math.random() * 6;
      shootingStar.angle = Math.PI / 4 + (Math.random() * 0.2 - 0.1);
      shootingStar.alpha = 1;
    };

    // Render loop
    const render = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      if (isVisible && !reducedMotion) {
        ctx.clearRect(0, 0, width, height);

        // Smooth parallax lerp
        currentParallaxX += (targetParallaxX - currentParallaxX) * 0.05;
        currentParallaxY += (targetParallaxY - currentParallaxY) * 0.05;

        // Draw Stars
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i]!;
          s.alpha += s.twinkleSpeed * delta;
          if (s.alpha > 0.95 || s.alpha < 0.15) {
            s.twinkleSpeed = -s.twinkleSpeed;
          }

          const parallaxMultiplier = s.layer === 2 ? 1.0 : 0.4;
          const px = (s.x + currentParallaxX * parallaxMultiplier + width) % width;
          const py = (s.y + currentParallaxY * parallaxMultiplier + height) % height;

          ctx.beginPath();
          ctx.arc(px, py, s.size, 0, Math.PI * 2);
          // Gold / Champagne tint for astral stars
          ctx.fillStyle = s.layer === 2 ? `rgba(229, 198, 135, ${s.alpha})` : `rgba(248, 245, 240, ${s.alpha})`;
          ctx.fill();
        }

        // Shooting star timer
        shootingStarTimer += delta;
        if (!shootingStar.active && shootingStarTimer > nextShootingStarInterval) {
          spawnShootingStar();
          shootingStarTimer = 0;
          nextShootingStarInterval = 14000 + Math.random() * 8000; // 14-22s
        }

        // Draw Shooting Star
        if (shootingStar.active) {
          shootingStar.x += Math.cos(shootingStar.angle) * shootingStar.speed;
          shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed;
          shootingStar.alpha -= 0.015;

          if (shootingStar.alpha <= 0 || shootingStar.x > width || shootingStar.y > height) {
            shootingStar.active = false;
          } else {
            const tailX = shootingStar.x - Math.cos(shootingStar.angle) * shootingStar.length;
            const tailY = shootingStar.y - Math.sin(shootingStar.angle) * shootingStar.length;

            const grad = ctx.createLinearGradient(tailX, tailY, shootingStar.x, shootingStar.y);
            grad.addColorStop(0, 'rgba(217, 179, 106, 0)');
            grad.addColorStop(0.7, `rgba(229, 198, 135, ${shootingStar.alpha * 0.6})`);
            grad.addColorStop(1, `rgba(255, 255, 255, ${shootingStar.alpha})`);

            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(shootingStar.x, shootingStar.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    if (!reducedMotion) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      // Static rendering if reduced motion
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < 30; i++) {
        const s = stars[i]!;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(229, 198, 135, 0.4)`;
        ctx.fill();
      }
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-80"
      aria-hidden="true"
    />
  );
}
