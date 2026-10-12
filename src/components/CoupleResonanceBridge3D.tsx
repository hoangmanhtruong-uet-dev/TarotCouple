'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  attachWebGLContextLostGuard,
  detectHardwareTier,
  disposeThreeScene,
} from '@/lib/three/core';
import { create3DTarotCardMesh } from '@/lib/three/card-textures';
import type { TarotCard } from '@/data/tarot-cards';

interface CoupleResonanceBridge3DProps {
  ownerCard: TarotCard;
  partnerCard: TarotCard;
  bridgeCard: TarotCard;
  compatibilityScore: number;
  redFlagLevel: number;
}

export function CoupleResonanceBridge3D({
  ownerCard,
  partnerCard,
  bridgeCard,
  compatibilityScore,
  redFlagLevel,
}: CoupleResonanceBridge3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    if (webglFailed) return;
    const container = mountRef.current;
    if (!container) return;

    const tierConfig = detectHardwareTier();
    if (!tierConfig.enableWebGL) {
      setWebglFailed(true);
      return;
    }

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 200;
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, tierConfig.maxDpr)
    );
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const detachGuard = attachWebGLContextLostGuard(
      renderer.domElement,
      () => {
        setWebglFailed(true);
      }
    );

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 20);
    camera.position.set(0, 0.15, 3.4);

    // Ambient & Key Lights
    scene.add(new THREE.AmbientLight(0x1d1829, 1.5));

    const leftVioletLight = new THREE.PointLight(0x8b5cf6, 2.2, 8);
    leftVioletLight.position.set(-1.4, 0.8, 2.0);
    scene.add(leftVioletLight);

    const rightRoseLight = new THREE.PointLight(0xe879a8, 2.2, 8);
    rightRoseLight.position.set(1.4, 0.8, 2.0);
    scene.add(rightRoseLight);

    const centerGoldLight = new THREE.PointLight(0xc9a24a, 2.5, 8);
    centerGoldLight.position.set(0, 1.0, 2.2);
    scene.add(centerGoldLight);

    // 3 Tarot Card 3D Meshes: Owner (-1.15), Bridge (0), Partner (+1.15)
    const meshA = create3DTarotCardMesh({
      roman: ownerCard.roman,
      title: ownerCard.name_vi,
      imageUrl: ownerCard.rws_image_url,
      accentHex: '#8B5CF6',
      width: 0.62,
      height: 1.08,
      thickness: 0.015,
    });
    meshA.position.set(-1.12, -0.04, 0);
    meshA.rotation.y = 0.24;
    scene.add(meshA);

    const meshBridge = create3DTarotCardMesh({
      roman: bridgeCard.roman,
      title: bridgeCard.name_vi,
      imageUrl: bridgeCard.rws_image_url,
      accentHex: '#C9A24A',
      width: 0.68,
      height: 1.18,
      thickness: 0.018,
    });
    meshBridge.position.set(0, 0.08, 0.22);
    scene.add(meshBridge);

    const meshB = create3DTarotCardMesh({
      roman: partnerCard.roman,
      title: partnerCard.name_vi,
      imageUrl: partnerCard.rws_image_url,
      accentHex: '#E879A8',
      width: 0.62,
      height: 1.08,
      thickness: 0.015,
    });
    meshB.position.set(1.12, -0.04, 0);
    meshB.rotation.y = -0.24;
    scene.add(meshB);

    // Laser Particle Ribbon Bridge connecting (-1.12, 0, 0) -> (0, 0.12, 0.25) -> (1.12, 0, 0)
    const particleCount = 72;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const cViolet = new THREE.Color('#8B5CF6');
    const cGold = new THREE.Color(
      redFlagLevel > 70 ? '#E5566D' : '#C9A24A'
    );
    const cRose = new THREE.Color('#E879A8');

    for (let i = 0; i < particleCount; i++) {
      const t = i / (particleCount - 1);
      const x = (t - 0.5) * 2.24;
      const y = Math.sin(t * Math.PI) * 0.26;
      const z = Math.sin(t * Math.PI) * 0.32;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const mixed =
        t < 0.5
          ? cViolet.clone().lerp(cGold, t * 2)
          : cGold.clone().lerp(cRose, (t - 0.5) * 2);
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    const ribbonGeom = new THREE.BufferGeometry();
    ribbonGeom.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    ribbonGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const ribbonMat = new THREE.PointsMaterial({
      size: 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const ribbonPoints = new THREE.Points(ribbonGeom, ribbonMat);
    scene.add(ribbonPoints);

    const pulseSpeed = 1.8 + (compatibilityScore / 100) * 2.4;

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 200;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let rafId = 0;
    let elapsed = 0;
    let lastTime = performance.now();

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      if (document.hidden) return;

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      elapsed += dt;

      meshA.position.y = -0.04 + Math.sin(elapsed * 2.0) * 0.04;
      meshB.position.y = -0.04 + Math.cos(elapsed * 2.0) * 0.04;
      meshBridge.position.y = 0.08 + Math.sin(elapsed * 2.6) * 0.05;
      meshBridge.rotation.y = Math.sin(elapsed * 1.1) * 0.12;

      const posAttr = ribbonGeom.getAttribute(
        'position'
      ) as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        const t = i / (particleCount - 1);
        const wave =
          Math.sin(t * Math.PI * 3 - elapsed * pulseSpeed) * 0.05;
        posAttr.setY(i, Math.sin(t * Math.PI) * 0.24 + wave);
      }
      posAttr.needsUpdate = true;

      renderer?.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      detachGuard();
      window.removeEventListener('resize', handleResize);
      disposeThreeScene(scene, renderer);
    };
  }, [
    bridgeCard,
    compatibilityScore,
    ownerCard,
    partnerCard,
    redFlagLevel,
    webglFailed,
  ]);

  if (webglFailed) return null;

  return (
    <div className="relative rounded-2xl bg-gradient-to-b from-[#14111C]/90 to-[#09080D]/95 border border-[#C9A24A]/35 p-2 overflow-hidden">
      <div className="flex items-center justify-between px-2 pt-1 text-[10px] font-semibold text-[#C9A24A]">
        <span>🌌 Cầu Năng Lượng Cộng Hưởng 3D (The Resonance Bridge)</span>
        <span>Tần số Hợp Cạ: {compatibilityScore}%</span>
      </div>
      <div
        ref={mountRef}
        className="w-full h-44 sm:h-52 select-none"
        aria-label="Cầu năng lượng Bói Đôi 3D nối 3 lá bài"
      />
    </div>
  );
}
