'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  attachWebGLContextLostGuard,
  detectHardwareTier,
  disposeThreeScene,
  getReaderAtmospherePalette,
} from '@/lib/three/core';
import { useReadingStore } from '@/lib/reading-store';

interface CelestialSkyCanvasProps {
  reducedMotion?: boolean;
  readerId?: string;
}

function createStarSpriteTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.35, 'rgba(248, 245, 240, 0.8)');
  grad.addColorStop(0.7, 'rgba(201, 162, 74, 0.2)');
  grad.addColorStop(1, 'rgba(9, 8, 13, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export default function CelestialSkyCanvas({
  reducedMotion = false,
  readerId,
}: CelestialSkyCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fallbackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const storeReaderId = useReadingStore((s) => s.selectedReaderId);
  const activeReaderId = readerId || storeReaderId || 'ba_ngoai';
  const [force2DFallback, setForce2DFallback] = useState(false);

  // 1. Three.js 3D Depth Starfield (Initializes ONCE, capped at DPR 1.0 & 30 FPS for zero lag)
  useEffect(() => {
    if (force2DFallback) return;
    const container = containerRef.current;
    if (!container) return;

    const tierConfig = detectHardwareTier({ reducedMotion });
    if (!tierConfig.enableWebGL) {
      setForce2DFallback(true);
      return;
    }

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: 'high-performance',
        depth: false,
        stencil: false,
      });
    } catch {
      setForce2DFallback(true);
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    // Cap background starfield at DPR 1.0 to save 75% GPU fill-rate
    renderer.setPixelRatio(1);
    renderer.setSize(width, height);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const detachContextGuard = attachWebGLContextLostGuard(
      renderer.domElement,
      () => {
        setForce2DFallback(true);
      }
    );

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 450);
    camera.position.set(0, 0, 10);

    const starSprite = createStarSpriteTexture();

    // Build 3 Z-depth star layers (Z = -240, -130, -35) with ultra-low vertex count
    const count = Math.min(tierConfig.starCount, 220);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const colorGold = new THREE.Color('#C9A24A');
    const colorWhite = new THREE.Color('#F8F5F0');
    const colorViolet = new THREE.Color('#8B5CF6');

    for (let i = 0; i < count; i++) {
      const layerPick = i % 3;
      const zDepth =
        layerPick === 0
          ? -240 - Math.random() * 40
          : layerPick === 1
          ? -130 - Math.random() * 30
          : -35 - Math.random() * 25;

      const spread = Math.abs(zDepth) * 1.45;
      positions[i * 3] = (Math.random() - 0.5) * spread * 1.8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 1.2;
      positions[i * 3 + 2] = zDepth;

      const c =
        i % 4 === 0 ? colorGold : i % 5 === 0 ? colorViolet : colorWhite;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 2.1,
      map: starSprite ?? undefined,
      vertexColors: true,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const starPoints = new THREE.Points(starGeometry, starMaterial);
    scene.add(starPoints);

    // 3D Meteor Trail Line
    const meteorGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -60),
      new THREE.Vector3(-8, 6, -60),
    ]);
    const meteorMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#F3E5AB'),
      transparent: true,
      opacity: 0,
    });
    const meteorLine = new THREE.Line(meteorGeom, meteorMat);
    scene.add(meteorLine);

    let targetCamX = 0;
    let targetCamY = 0;
    let meteorTimer = 0;
    let meteorActive = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (reducedMotion) return;
      targetCamX = (e.clientX / window.innerWidth - 0.5) * 3.8;
      targetCamY = -(e.clientY / window.innerHeight - 0.5) * 2.6;
    };

    const handleResize = () => {
      if (!renderer) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    let rafId = 0;
    let lastFrameTime = performance.now();
    const frameInterval = 1000 / 30; // 30 FPS cap for ambient background stars

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      if (document.hidden) return;

      const elapsedMs = now - lastFrameTime;
      if (elapsedMs < frameInterval) return;

      const dt = Math.min(elapsedMs / 1000, 0.1);
      lastFrameTime = now - (elapsedMs % frameInterval);

      camera.position.x += (targetCamX - camera.position.x) * 0.06;
      camera.position.y += (targetCamY - camera.position.y) * 0.06;
      starPoints.rotation.z += dt * 0.007;

      meteorTimer += dt;
      if (!meteorActive && meteorTimer >= 14) {
        meteorActive = true;
        meteorTimer = 0;
        meteorLine.position.set(
          (Math.random() - 0.2) * 35,
          15 + Math.random() * 12,
          0
        );
        meteorMat.opacity = 0.9;
      }

      if (meteorActive) {
        meteorLine.position.x += dt * 38;
        meteorLine.position.y -= dt * 28;
        meteorMat.opacity = Math.max(0, meteorMat.opacity - dt * 1.1);
        if (meteorMat.opacity <= 0.02) {
          meteorActive = false;
          meteorMat.opacity = 0;
        }
      }

      renderer?.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      detachContextGuard();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      disposeThreeScene(scene, renderer);
    };
  }, [force2DFallback, reducedMotion]);

  // 2. Lightweight 2D Canvas Fallback
  useEffect(() => {
    if (!force2DFallback) return;
    const canvas = fallbackCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const stars = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.4 + 0.5,
      a: 0.25 + Math.random() * 0.6,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 162, 74, ${s.a.toFixed(2)})`;
        ctx.fill();
      }
    };
    draw();

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      draw();
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [force2DFallback]);

  const palette = getReaderAtmospherePalette(activeReaderId);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 opacity-25 transition-colors duration-700"
        style={{
          background: `radial-gradient(circle at 50% 18%, ${palette.primaryHex}33 0%, ${palette.secondaryHex}14 42%, transparent 75%)`,
        }}
      />
      {force2DFallback ? (
        <canvas
          ref={fallbackCanvasRef}
          className="w-full h-full block opacity-80"
        />
      ) : (
        <div ref={containerRef} className="w-full h-full" />
      )}
    </div>
  );
}
