'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Box } from 'lucide-react';
import { soundManager } from '@/lib/sound-effects';
import {
  attachWebGLContextLostGuard,
  computeParabolicArcTransform,
  detectHardwareTier,
  disposeThreeScene,
  evaluateCubicBezier3D,
} from '@/lib/three/core';
import { create3DTarotCardMesh } from '@/lib/three/card-textures';

interface TactileArcFanProps {
  totalCards: number;
  selectedIndices: number[];
  onPickCard: (index: number) => void;
  disabled?: boolean;
}

export function TactileArcFan({
  totalCards,
  selectedIndices,
  onPickCard,
  disabled = false,
}: TactileArcFanProps) {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const threeMountRef = useRef<HTMLDivElement>(null);
  const [use3DMode, setUse3DMode] = useState(true);

  const selectedRef = useRef<number[]>(selectedIndices);
  selectedRef.current = selectedIndices;

  const disabledRef = useRef<boolean>(disabled);
  disabledRef.current = disabled;

  const onPickRef = useRef(onPickCard);
  onPickRef.current = onPickCard;

  const cards = Array.from({ length: totalCards }, (_, i) => i);

  // Three.js 3D Parabolic Arc Fan & Cubic Bézier Flight Controller
  useEffect(() => {
    if (!use3DMode || shouldReduceMotion) return;
    const mountEl = threeMountRef.current;
    if (!mountEl) return;

    const tierConfig = detectHardwareTier({
      reducedMotion: Boolean(shouldReduceMotion),
    });
    if (!tierConfig.enableWebGL) {
      setUse3DMode(false);
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
      setUse3DMode(false);
      return;
    }

    const width = mountEl.clientWidth || 360;
    const height = mountEl.clientHeight || 220;
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, tierConfig.maxDpr)
    );
    renderer.setSize(width, height);
    mountEl.innerHTML = '';
    mountEl.appendChild(renderer.domElement);

    const detachGuard = attachWebGLContextLostGuard(
      renderer.domElement,
      () => {
        setUse3DMode(false);
      }
    );

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 20);
    camera.position.set(0, 0.32, 3.1);
    camera.lookAt(0, -0.05, 0);

    const ambientLight = new THREE.AmbientLight(0x1d1829, 1.4);
    scene.add(ambientLight);

    const candleLight = new THREE.PointLight(0xffa64d, 2.5, 12);
    candleLight.position.set(0, 1.4, 2.2);
    scene.add(candleLight);

    const rimLight = new THREE.DirectionalLight(0xc9a24a, 1.3);
    rimLight.position.set(2.0, 2.5, 1.5);
    scene.add(rimLight);

    const fanGroup = new THREE.Group();
    scene.add(fanGroup);

    // Build 3D Card Meshes along the parabolic arc
    const cardMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < totalCards; i++) {
      const mesh = create3DTarotCardMesh({
        roman: `#${i + 1}`,
        title: `LÁ #${i + 1}`,
        accentHex: '#C9A24A',
        width: 0.44,
        height: 0.77,
        thickness: 0.012,
      });
      // Show Sacred Card Back facing camera (+Z rotated 180 deg around Y)
      mesh.rotation.y = Math.PI;
      mesh.userData = { cardIndex: i, flightProgress: 0 };
      fanGroup.add(mesh);
      cardMeshes.push(mesh);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    let scrollOffset = 0;
    let scrollVelocity = 0;
    let isDragging = false;
    let dragStartClientX = 0;
    let lastClientX = 0;
    let hoveredIndex: number | null = null;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      dragStartClientX = e.clientX;
      lastClientX = e.clientX;
      scrollVelocity = 0;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = renderer!.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const dx = e.clientX - lastClientX;
        lastClientX = e.clientX;
        const deltaNorm = (dx / rect.width) * 1.45;
        scrollOffset = Math.max(-0.85, Math.min(0.85, scrollOffset - deltaNorm));
        scrollVelocity = -deltaNorm;
        return;
      }

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(cardMeshes, false);
      const topHit = hits[0]?.object?.userData?.cardIndex;
      if (typeof topHit === 'number' && topHit !== hoveredIndex) {
        hoveredIndex = topHit;
        if (!selectedRef.current.includes(topHit) && !disabledRef.current) {
          soundManager.playCardSlide();
        }
      } else if (hits.length === 0) {
        hoveredIndex = null;
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const totalMove = Math.abs(e.clientX - dragStartClientX);
      isDragging = false;

      if (totalMove < 10 && !disabledRef.current && selectedRef.current.length < 3) {
        const rect = renderer!.domElement.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(cardMeshes, false);
        const pickedIdx = hits[0]?.object?.userData?.cardIndex;

        if (
          typeof pickedIdx === 'number' &&
          !selectedRef.current.includes(pickedIdx)
        ) {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate(25);
            } catch {}
          }
          soundManager.playCardFlip();
          onPickRef.current(pickedIdx);
        }
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', handlePointerDown);
    domEl.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);

    const handleResize = () => {
      if (!mountEl || !renderer) return;
      const w = mountEl.clientWidth || 360;
      const h = mountEl.clientHeight || 220;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let rafId = 0;
    let lastTime = performance.now();

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      if (document.hidden) return;

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (!isDragging && Math.abs(scrollVelocity) > 0.0005) {
        scrollOffset = Math.max(
          -0.85,
          Math.min(0.85, scrollOffset + scrollVelocity)
        );
        scrollVelocity *= 0.92;
      }

      const selectedList = selectedRef.current;

      cardMeshes.forEach((mesh, i) => {
        const arc = computeParabolicArcTransform(i, totalCards, scrollOffset);
        const selSlotIdx = selectedList.indexOf(i);
        const isSelected = selSlotIdx !== -1;
        const isHovered = hoveredIndex === i && !isSelected;

        if (isSelected) {
          // Animate along Cubic Bézier trajectory to Altar Slot (-0.7, 0, +0.7)
          const prevProg = Number(mesh.userData.flightProgress || 0);
          const nextProg = Math.min(1, prevProg + dt * 2.2);
          mesh.userData.flightProgress = nextProg;

          const slotX = (selSlotIdx - 1) * 0.68;
          const p0 = { x: arc.x, y: arc.y, z: arc.z };
          const p1 = { x: arc.x * 0.5, y: arc.y + 0.55, z: arc.z + 0.65 };
          const p2 = { x: slotX, y: 0.48, z: 0.45 };
          const p3 = { x: slotX, y: 0.36, z: 0.32 };

          const bez = evaluateCubicBezier3D(p0, p1, p2, p3, nextProg);
          mesh.position.set(bez.x, bez.y, bez.z);
          mesh.rotation.y += (Math.PI - mesh.rotation.y) * 0.15;
          mesh.rotation.z += (0 - mesh.rotation.z) * 0.15;
          mesh.scale.setScalar(0.82);
        } else {
          mesh.userData.flightProgress = 0;
          const liftY = isHovered ? 0.24 : 0;
          const liftZ = isHovered ? 0.28 : 0;
          const targetScale = isHovered ? 1.12 : 1.0;

          mesh.position.x += (arc.x - mesh.position.x) * 0.16;
          mesh.position.y += (arc.y + liftY - mesh.position.y) * 0.16;
          mesh.position.z += (arc.z + liftZ - mesh.position.z) * 0.16;
          mesh.rotation.y += (Math.PI + arc.rotY - mesh.rotation.y) * 0.16;
          mesh.rotation.z += (arc.rotZ - mesh.rotation.z) * 0.16;
          mesh.scale.setScalar(
            mesh.scale.x + (targetScale - mesh.scale.x) * 0.16
          );
        }
      });

      renderer?.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      detachGuard();
      domEl.removeEventListener('pointerdown', handlePointerDown);
      domEl.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      disposeThreeScene(scene, renderer);
    };
  }, [shouldReduceMotion, totalCards, use3DMode]);

  return (
    <div className="relative py-2 select-none">
      {/* Mode Switcher Header */}
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-[11px] font-medium text-[#9E96B0]">
          Bộ bài {totalCards} lá • Đã chọn {selectedIndices.length}/3
        </span>
        <button
          type="button"
          onClick={() => setUse3DMode((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#14111C] border border-[#C9A24A]/40 hover:border-[#C9A24A] text-[10px] font-semibold text-[#C9A24A] transition-colors cursor-pointer"
        >
          <Box className="w-3 h-3" />
          <span>
            {use3DMode && !shouldReduceMotion
              ? 'Vòng cung 3D WebGL • Đổi sang 2D'
              : 'Dải bài 2D • Bật 3D WebGL'}
          </span>
        </button>
      </div>

      {/* 3D Parabolic Arc Fan Viewport (Active when use3DMode && !shouldReduceMotion) */}
      {use3DMode && !shouldReduceMotion && (
        <div
          ref={threeMountRef}
          className="w-full h-52 sm:h-60 rounded-2xl bg-gradient-to-b from-[#14111C]/60 to-[#09080D]/80 border border-[#C9A24A]/25 shadow-inner mb-2 cursor-grab active:cursor-grabbing overflow-hidden"
          aria-label="Bàn xòe bài hình cung 3D tương tác"
        />
      )}

      {/* Tactile 2D Accessible Fan Strip (Always available for rapid tap & screen readers) */}
      <div
        ref={containerRef}
        className="flex items-end justify-start sm:justify-center overflow-x-auto no-scrollbar py-4 px-4 gap-1.5 sm:gap-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {cards.map((cardIndex) => {
          const isSelected = selectedIndices.includes(cardIndex);
          const centerOffset = cardIndex - totalCards / 2;
          const rotateAngle = Math.max(-18, Math.min(18, centerOffset * 0.8));

          return (
            <motion.div
              key={cardIndex}
              onMouseEnter={() => {
                if (!isSelected && !disabled) {
                  soundManager.playCardSlide();
                }
              }}
              whileHover={
                shouldReduceMotion || isSelected || disabled
                  ? {}
                  : { y: -18, scale: 1.08, zIndex: 40 }
              }
              whileTap={
                shouldReduceMotion || isSelected || disabled
                  ? {}
                  : { scale: 0.94 }
              }
              onClick={() => {
                if (!isSelected && !disabled && selectedIndices.length < 3) {
                  if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    try {
                      navigator.vibrate(25);
                    } catch {}
                  }
                  soundManager.playCardFlip();
                  onPickCard(cardIndex);
                }
              }}
              className={`relative shrink-0 w-12 h-20 sm:w-14 sm:h-24 rounded-xl border transition-all cursor-pointer flex flex-col justify-between p-1.5 ${
                isSelected
                  ? 'bg-[#C9A24A] border-[#E8C872] opacity-25 cursor-not-allowed scale-90'
                  : 'bg-gradient-to-b from-[#1D1829] via-[#14111C] to-[#09080D] border-[#C9A24A]/40 hover:border-[#C9A24A] shadow-[0_4px_20px_rgba(0,0,0,0.8)]'
              }`}
              style={{
                transform: shouldReduceMotion
                  ? undefined
                  : `rotate(${rotateAngle}deg)`,
                zIndex: isSelected ? 1 : 10,
              }}
            >
              <div className="flex justify-between items-center text-[8px] text-[#C9A24A] font-bold">
                <span>#{cardIndex + 1}</span>
                <Sparkles className="w-2 h-2 opacity-60" />
              </div>

              <div className="my-auto mx-auto w-5 h-5 rounded-full border border-[#C9A24A]/30 flex items-center justify-center text-[8px] text-[#C9A24A]/60">
                ✦
              </div>

              <div className="text-[7px] text-center tracking-widest text-[#9E96B0]/70 uppercase">
                RWS
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="text-[11px] text-center text-[#9E96B0] mt-1">
        👉 Vuốt xoay vòng cung 3D hoặc chạm trực tiếp vào lá bài bạn cảm thấy rung động nhất
      </p>
    </div>
  );
}
