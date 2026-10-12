'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import gsap from 'gsap';
import { READERS, type ReaderPersona } from '@/data/tarot-cards';
import {
  READER_SLUG_MAP,
  normalizeCanonicalReaderId,
  type CanonicalReaderId,
} from '@/lib/reader-slugs';
import {
  attachWebGLContextLostGuard,
  detectHardwareTier,
  disposeThreeScene,
  getReaderAtmospherePalette,
} from '@/lib/three/core';
import {
  PERSONA_AURA_FRAGMENT_SHADER,
  PERSONA_AURA_VERTEX_SHADER,
  createProceduralSanctuaryEnvMap,
} from '@/lib/three/shaders';
import { createReaderAltarTotemGroup } from '@/components/HeroTarotDeck3D';
import { soundManager } from '@/lib/sound-effects';
import {
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  Quote,
  Compass,
  Volume2,
} from 'lucide-react';

interface ReaderIntroModalProps {
  isOpen: boolean;
  isCoupleMode?: boolean;
  onClose: () => void;
}

interface PersonaEditorialMeta {
  roman: string;
  arcanaTitle: string;
  frequencyHz: string;
  secondaryHex: string;
  totemLabel: string;
  stats: [
    { label: string; value: number },
    { label: string; value: number },
    { label: string; value: number },
  ];
}

const PERSONA_EDITORIAL_MAP: Record<CanonicalReaderId, PersonaEditorialMeta> = {
  ba_ngoai: {
    roman: 'I',
    arcanaTitle: 'THE WARM GRANDMOTHER',
    frequencyHz: '432 Hz • Hổ Phách Chữa Lành',
    secondaryHex: '#451A03',
    totemLabel: 'Vật tổ 3D: Đèn Trà Sen Gốm Cổ',
    stats: [
      { label: 'Độ Ấm Áp & Vỗ Về', value: 98 },
      { label: 'Trải Nghiệm Đời Thường', value: 92 },
      { label: 'Độ Sắc Lạnh', value: 25 },
    ],
  },
  chi_dai: {
    roman: 'II',
    arcanaTitle: 'THE EMPRESS SISTER',
    frequencyHz: '528 Hz • Hồng Ngọc Tỉnh Thức',
    secondaryHex: '#4C0519',
    totemLabel: 'Vật tổ 3D: Ly Pha Lê Ruby Đỏ',
    stats: [
      { label: 'Độ Thẳng Thắn & Thực Tế', value: 99 },
      { label: 'Năng Lượng Bảo Vệ', value: 90 },
      { label: 'Độ Vòng Vo', value: 12 },
    ],
  },
  ban_than: {
    roman: 'III',
    arcanaTitle: 'THE SOUL CONFIDANT',
    frequencyHz: '639 Hz • Thạch Anh Đồng Cảm',
    secondaryHex: '#4A044E',
    totemLabel: 'Vật tổ 3D: Tinh Cầu Sao Hồng',
    stats: [
      { label: 'Độ Đồng Cảm & Không Phán Xét', value: 97 },
      { label: 'Khiếu Hài Hước Gen Z', value: 95 },
      { label: 'Khoảng Cách Thế Hệ', value: 10 },
    ],
  },
  thay_cu_meo: {
    roman: 'IV',
    arcanaTitle: 'THE NIGHT OWL SAGE',
    frequencyHz: '741 Hz • Lam Ngọc Minh Triết',
    secondaryHex: '#172554',
    totemLabel: 'Vật tổ 3D: Thiên Cầu Nghi Đồng Thau',
    stats: [
      { label: 'Chiều Sâu Phân Tích Logic', value: 99 },
      { label: 'Câu Hỏi Gợi Mở Tâm Lý', value: 94 },
      { label: 'Cảm Tính Ngẫu Hứng', value: 18 },
    ],
  },
};

export default function ReaderIntroModal({
  isOpen,
  isCoupleMode = false,
  onClose,
}: ReaderIntroModalProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [currentIdx, setCurrentIdx] = useState(0);

  // Refs for Zero-Rerender 3D WebGL Stage & Direct DOM Tilt/GSAP Choreography
  const webglMountRef = useRef<HTMLDivElement | null>(null);
  const portraitCardRef = useRef<HTMLDivElement | null>(null);
  const foilGlareRef = useRef<HTMLDivElement | null>(null);
  const dossierContentRef = useRef<HTMLDivElement | null>(null);
  const progressValueRef = useRef<HTMLSpanElement | null>(null);
  const lastWheelAtRef = useRef<number>(0);
  const touchStartXRef = useRef<number | null>(null);

  // Shared transient bridge between mouse/React and the single Three.js RAF loop
  const pointerBridgeRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const sceneRef = useRef<THREE.Scene | null>(null);
  const totemGroupRef = useRef<THREE.Group | null>(null);
  const pointLightRef = useRef<THREE.PointLight | null>(null);
  const targetAccentColorRef = useRef<THREE.Color>(new THREE.Color('#D4A853'));
  const targetSecondaryColorRef = useRef<THREE.Color>(new THREE.Color('#451A03'));
  const targetPersonaIdxRef = useRef<number>(0);

  const canonicalReaders = READERS.slice(0, 4);
  const reader: ReaderPersona =
    canonicalReaders[currentIdx] || canonicalReaders[0]!;
  const canonicalId = normalizeCanonicalReaderId(reader.id);
  const editorialMeta = PERSONA_EDITORIAL_MAP[canonicalId];
  const isLast = currentIdx === canonicalReaders.length - 1;

  // Go to specific Reader slide with spatial chord + GSAP transition
  const goToSlide = useCallback(
    (nextIndex: number) => {
      const clamped = Math.max(
        0,
        Math.min(canonicalReaders.length - 1, nextIndex)
      );
      if (clamped === currentIdx) return;
      const nextReader = canonicalReaders[clamped];
      if (nextReader) {
        soundManager.playReaderPersonaChord(nextReader.id);
      }
      setCurrentIdx(clamped);
    },
    [canonicalReaders, currentIdx]
  );

  const handleNextOrFinish = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (isLast) {
        soundManager.playMysticChime();
        onClose();
        const query = isCoupleMode ? '?mode=couple' : '';
        router.push(`/reading/reader${query}`);
      } else {
        goToSlide(currentIdx + 1);
      }
    },
    [currentIdx, goToSlide, isCoupleMode, isLast, onClose, router]
  );

  const handlePrev = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (currentIdx > 0) {
        goToSlide(currentIdx - 1);
      }
    },
    [currentIdx, goToSlide]
  );

  const handleSkip = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose();
      const query = isCoupleMode ? '?mode=couple' : '';
      router.push(`/reading/reader${query}`);
    },
    [isCoupleMode, onClose, router]
  );

  // Direct Quick-Select for the currently previewed Reader
  const handleSelectCurrentReader = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      soundManager.playMysticChime();
      onClose();
      const slug = READER_SLUG_MAP[canonicalId] || 'ba-ngoai';
      const query = isCoupleMode ? '?mode=couple' : '';
      router.push(`/reading/reader/${slug}${query}`);
    },
    [canonicalId, isCoupleMode, onClose, router]
  );

  // Play initial Reader 1/4 chord when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setCurrentIdx(0);
    soundManager.playReaderPersonaChord('ba_ngoai');
  }, [isOpen]);

  // 1. SINGLE-INSTANCE THREE.JS 3D STAGE (Initializes ONCE per modal open, ZERO re-init on 1/4 -> 4/4)
  useEffect(() => {
    if (!isOpen || shouldReduceMotion) return;
    const container = webglMountRef.current;
    if (!container) return;

    const tierConfig = detectHardwareTier();
    if (!tierConfig.enableWebGL) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: tierConfig.tier === 'tier1',
        powerPreference: 'high-performance',
        stencil: false,
      });
    } catch {
      return;
    }

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 420;
    // Cap DPR at 1.25 for locked 60 FPS
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 30);
    camera.position.set(0, 0.05, 2.85);

    try {
      scene.environment = createProceduralSanctuaryEnvMap(renderer);
    } catch {
      // Safe fallback
    }

    const detachContextGuard = attachWebGLContextLostGuard(
      renderer.domElement,
      () => {}
    );

    // PBR Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xf8f5f0, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.45);
    keyLight.position.set(1.5, 2.2, 2.5);
    scene.add(keyLight);

    const personaLight = new THREE.PointLight(0xd4a853, 1.8, 7);
    personaLight.position.set(0, 0.8, 1.4);
    scene.add(personaLight);
    pointLightRef.current = personaLight;

    // Custom GLSL Persona Aura Shader Plane (16x16 lightweight mesh)
    const auraUniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uAccentColor: { value: new THREE.Color('#D4A853') },
      uSecondaryColor: { value: new THREE.Color('#451A03') },
      uPersonaIndex: { value: 0.0 },
    };

    const auraShaderMat = new THREE.ShaderMaterial({
      uniforms: auraUniforms,
      vertexShader: PERSONA_AURA_VERTEX_SHADER,
      fragmentShader: PERSONA_AURA_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const auraPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 3.4, 16, 16),
      auraShaderMat
    );
    auraPlane.position.set(0, 0.05, -0.55);
    scene.add(auraPlane);

    // 3D PBR Sacred Totem Group (positioned at top-right of the Tarot Portrait Stage)
    const initialTotem = createReaderAltarTotemGroup('ba_ngoai');
    initialTotem.position.set(0, 0.68, 0.25);
    initialTotem.scale.setScalar(0.88);
    scene.add(initialTotem);
    totemGroupRef.current = initialTotem;

    // THREE.InstancedMesh: 40 Floating Persona Crystals (1 single GPU draw call)
    const crystalCount = 40;
    const crystalGeom = new THREE.OctahedronGeometry(0.022, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8f5f0,
      emissive: 0xd4a853,
      emissiveIntensity: 0.45,
      metalness: 0.85,
      roughness: 0.18,
    });
    const instancedCrystals = new THREE.InstancedMesh(
      crystalGeom,
      crystalMat,
      crystalCount
    );

    const dummyObj = new THREE.Object3D();
    const crystalSeeds = Array.from({ length: crystalCount }, (_, i) => ({
      angle: (i / crystalCount) * Math.PI * 2,
      radius: 0.65 + (i % 5) * 0.14,
      yOffset: (Math.random() - 0.5) * 1.5,
      speed: 0.35 + (i % 4) * 0.12,
      scale: 0.6 + (i % 3) * 0.25,
    }));
    scene.add(instancedCrystals);

    const handleResize = () => {
      if (!renderer || !container) return;
      const newW = container.clientWidth || 340;
      const newH = container.clientHeight || 420;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    let rafId: number | null = null;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (typeof document !== 'undefined' && document.hidden) return;

      const elapsed = clock.getElapsedTime();
      const ptr = pointerBridgeRef.current;

      // Smoothly interpolate GLSL shader uniforms & crystal emissive color toward active Reader
      auraUniforms.uTime.value = elapsed;
      auraUniforms.uMouse.value.lerp(new THREE.Vector2(ptr.x, ptr.y), 0.12);
      auraUniforms.uAccentColor.value.lerp(targetAccentColorRef.current, 0.1);
      auraUniforms.uSecondaryColor.value.lerp(
        targetSecondaryColorRef.current,
        0.1
      );
      auraUniforms.uPersonaIndex.value +=
        (targetPersonaIdxRef.current - auraUniforms.uPersonaIndex.value) * 0.1;

      crystalMat.emissive.lerp(targetAccentColorRef.current, 0.1);

      if (totemGroupRef.current) {
        totemGroupRef.current.rotation.y = elapsed * 0.85 + ptr.x * 0.45;
        totemGroupRef.current.rotation.x = ptr.y * 0.25;
        totemGroupRef.current.position.y =
          0.68 + Math.sin(elapsed * 2.0) * 0.035;
      }

      for (let i = 0; i < crystalCount; i++) {
        const seed = crystalSeeds[i]!;
        const angle = seed.angle + elapsed * seed.speed * 0.4;
        dummyObj.position.set(
          Math.cos(angle) * seed.radius + ptr.x * 0.08,
          seed.yOffset + Math.sin(elapsed * seed.speed + i) * 0.08,
          Math.sin(angle) * seed.radius * 0.45 - 0.15
        );
        dummyObj.rotation.set(elapsed * seed.speed, elapsed * 0.5, angle);
        dummyObj.scale.setScalar(seed.scale);
        dummyObj.updateMatrix();
        instancedCrystals.setMatrixAt(i, dummyObj.matrix);
      }
      instancedCrystals.instanceMatrix.needsUpdate = true;

      renderer?.render(scene, camera);
    };

    animate();

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      detachContextGuard();
      sceneRef.current = null;
      disposeThreeScene(scene, renderer);
    };
  }, [isOpen, shouldReduceMotion]);

  // 2. IN-PLACE READER TOTEM SWAP & GSAP KINETIC CHOREOGRAPHY (< 0.2ms, 0 WebGL Re-init)
  useEffect(() => {
    if (!isOpen) return;

    const palette = getReaderAtmospherePalette(canonicalId);
    targetAccentColorRef.current.set(reader.accent_color);
    targetSecondaryColorRef.current.set(editorialMeta.secondaryHex);
    targetPersonaIdxRef.current = currentIdx;

    // Swap 3D Totem in-place inside existing Scene
    const scene = sceneRef.current;
    if (scene) {
      if (pointLightRef.current) {
        pointLightRef.current.color.setHex(palette.rimLightHex);
      }
      if (totemGroupRef.current) {
        scene.remove(totemGroupRef.current);
      }
      const nextTotem = createReaderAltarTotemGroup(canonicalId);
      nextTotem.position.set(0, 0.68, 0.25);
      nextTotem.scale.setScalar(0.88);
      scene.add(nextTotem);
      totemGroupRef.current = nextTotem;
    }

    // GSAP Editorial Reveal + Progress Percentage Counter (GPU transform + opacity only)
    if (!shouldReduceMotion && dossierContentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          '[data-persona-reveal]',
          { opacity: 0, y: 14 },
          {
            opacity: 1,
            y: 0,
            duration: 0.38,
            stagger: 0.045,
            ease: 'power3.out',
            overwrite: 'auto',
          }
        );

        gsap.fromTo(
          '[data-persona-bar]',
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.55,
            stagger: 0.06,
            ease: 'power3.out',
            overwrite: 'auto',
          }
        );
      }, dossierContentRef);

      if (progressValueRef.current) {
        const targetPct = (currentIdx + 1) * 25;
        const counterObj = { val: Math.max(0, currentIdx * 25) };
        gsap.to(counterObj, {
          val: targetPct,
          duration: 0.4,
          ease: 'power2.out',
          onUpdate: () => {
            if (progressValueRef.current) {
              progressValueRef.current.textContent = `${Math.round(
                counterObj.val
              )}%`;
            }
          },
        });
      }

      return () => ctx.revert();
    }
  }, [
    canonicalId,
    currentIdx,
    editorialMeta.secondaryHex,
    isOpen,
    reader.accent_color,
    shouldReduceMotion,
  ]);

  // 3. KEYBOARD NAVIGATION (ArrowLeft / ArrowRight / Escape)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (currentIdx < canonicalReaders.length - 1) {
          goToSlide(currentIdx + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (currentIdx > 0) {
          goToSlide(currentIdx - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canonicalReaders.length, currentIdx, goToSlide, isOpen, onClose]);

  // 4. WHEEL SCROLL CHOREOGRAPHY (Smoothly scrub through 1/4 -> 4/4 with mouse wheel)
  const handleWheel = (e: React.WheelEvent) => {
    const now = performance.now();
    if (now - lastWheelAtRef.current < 420) return;
    if (Math.abs(e.deltaY) < 18) return;

    lastWheelAtRef.current = now;
    soundManager.playScrollHarmonic(e.deltaY * 0.05);

    if (e.deltaY > 0 && currentIdx < canonicalReaders.length - 1) {
      goToSlide(currentIdx + 1);
    } else if (e.deltaY < 0 && currentIdx > 0) {
      goToSlide(currentIdx - 1);
    }
  };

  // 5. DIRECT DOM 3D CARD TILT & FOIL GLARE (0 React Re-renders on mousemove)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const cardEl = portraitCardRef.current;
    if (!cardEl || shouldReduceMotion) return;

    const rect = cardEl.getBoundingClientRect();
    const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const normY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    pointerBridgeRef.current.x = Math.max(-1, Math.min(1, normX));
    pointerBridgeRef.current.y = Math.max(-1, Math.min(1, normY));

    const rotY = normX * 10;
    const rotX = normY * 8;
    cardEl.style.transform = `perspective(900px) rotateX(${rotX.toFixed(
      2
    )}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`;

    if (foilGlareRef.current) {
      const pctX = ((normX + 1) * 50).toFixed(1);
      const pctY = ((1 - normY) * 50).toFixed(1);
      foilGlareRef.current.style.opacity = '0.32';
      foilGlareRef.current.style.background = `radial-gradient(circle at ${pctX}% ${pctY}%, ${reader.accent_color}88 0%, transparent 65%)`;
    }
  };

  const handlePointerLeave = () => {
    pointerBridgeRef.current.x = 0;
    pointerBridgeRef.current.y = 0;
    if (portraitCardRef.current) {
      portraitCardRef.current.style.transform =
        'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
    if (foilGlareRef.current) {
      foilGlareRef.current.style.opacity = '0';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Giới thiệu Reader ${reader.name}`}
      onWheel={handleWheel}
      onTouchStart={(e) => {
        touchStartXRef.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartXRef.current === null) return;
        const diff =
          touchStartXRef.current -
          (e.changedTouches[0]?.clientX ?? touchStartXRef.current);
        if (Math.abs(diff) > 45) {
          if (diff > 0 && currentIdx < canonicalReaders.length - 1) {
            goToSlide(currentIdx + 1);
          } else if (diff < 0 && currentIdx > 0) {
            goToSlide(currentIdx - 1);
          }
        }
        touchStartXRef.current = null;
      }}
      onClick={handleNextOrFinish}
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-[radial-gradient(ellipse_at_center,rgba(20,18,31,0.94)_0%,rgba(9,8,13,0.98)_100%)] select-none overflow-y-auto"
    >
      {/* Khung Hồ Sơ Linh Hồn Bất Đối Xứng (Asymmetric 5/7 Editorial Dossier) */}
      <div
        onClick={(e) => e.stopPropagation()}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          borderColor: `${reader.accent_color}65`,
          boxShadow: `0 25px 70px rgba(0,0,0,0.85), 0 0 38px ${reader.accent_color}22`,
        }}
        className="relative w-full max-w-4xl rounded-[2rem] border bg-[#12101B] p-4 sm:p-7 text-left overflow-hidden transition-colors duration-300"
      >
        {/* ================= THANH ĐIỀU HƯỚNG NGHI THỨC TRÊN CÙNG ================= */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-white/10">
          {/* Cột Trái: Đồng hồ tiến độ Sacred Geometry (25% -> 100%) */}
          <div className="flex items-center gap-2.5">
            <div
              style={{
                borderColor: `${reader.accent_color}80`,
                color: reader.accent_color,
              }}
              className="w-9 h-9 rounded-full border flex items-center justify-center bg-[#09080D] text-[10px] font-bold tracking-tighter"
            >
              <span ref={progressValueRef}>{(currentIdx + 1) * 25}%</span>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-[0.24em] text-[#C9A24A]">
                GIỚI THIỆU READER {currentIdx + 1}/4
              </div>
              <div className="text-[10px] text-[#9E96B0] flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-[#C9A24A]" />
                <span>{editorialMeta.frequencyHz}</span>
              </div>
            </div>
          </div>

          {/* Giữa: 4 Nút Chuyển Nhanh Giữa 4 UI Reader */}
          <div className="flex items-center gap-1.5">
            {canonicalReaders.map((r, idx) => {
              const isActive = idx === currentIdx;
              const rMeta =
                PERSONA_EDITORIAL_MAP[normalizeCanonicalReaderId(r.id)];
              return (
                <button
                  key={r.id}
                  type="button"
                  data-cursor={`READER ${idx + 1}/4`}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToSlide(idx);
                  }}
                  style={
                    isActive
                      ? {
                          backgroundColor: `${r.accent_color}25`,
                          borderColor: r.accent_color,
                          color: '#F8F5F0',
                        }
                      : undefined
                  }
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border transition-all cursor-pointer ${
                    isActive
                      ? 'shadow-sm'
                      : 'bg-[#1A1626] border-white/10 text-[#9E96B0] hover:text-[#F8F5F0]'
                  }`}
                >
                  <span className="mr-1 opacity-75">{rMeta.roman}.</span>
                  <span className="hidden sm:inline">{r.name}</span>
                </button>
              );
            })}
          </div>

          {/* Cột Phải: Nút Bỏ Qua */}
          <button
            type="button"
            data-cursor="BỎ QUA"
            onClick={handleSkip}
            className="text-[11px] text-[#9E96B0] hover:text-[#F8F5F0] bg-[#1F1B2E] px-3 py-1.5 rounded-full border border-[#2D2842] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Bỏ qua</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ================= BỐ CỤC GRID BẤT ĐỐI XỨNG 2 CỘT (5/12 SÂN KHẤU 3D | 7/12 HỒ SƠ EDITORIAL) ================= */}
        <div
          ref={dossierContentRef}
          className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
        >
          {/* CỘT TRÁI (5/12): Sân Khấu Three.js Đơn Bản + Lá Bài Tarot Chân Dung 3D Tilt */}
          <div className="lg:col-span-5 relative flex flex-col items-center justify-center min-h-[290px] sm:min-h-[340px]">
            {/* Single-Instance Three.js WebGL Stage (GLSL Aura + PBR Totem + 40 InstancedMesh Crystals) */}
            <div
              ref={webglMountRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 w-full h-full z-0"
            />

            {/* Lá Bài Tarot Chân Dung 3D (Direct DOM Perspective Tilt, 0 React re-renders) */}
            <div
              ref={portraitCardRef}
              data-cursor="NGHIÊNG 3D"
              onClick={handleNextOrFinish}
              style={{
                borderColor: `${reader.accent_color}85`,
                boxShadow: `0 18px 45px rgba(0,0,0,0.75), 0 0 28px ${reader.accent_color}35`,
              }}
              className="relative z-10 w-48 sm:w-56 aspect-[3/4] rounded-2xl border-2 bg-[#09080D]/90 p-2.5 flex flex-col justify-between overflow-hidden cursor-pointer transition-transform duration-150 ease-out will-change-transform"
            >
              {/* Lớp Kim Tuyến Phản Xạ Theo Chuột (Holographic Foil Glare) */}
              <div
                ref={foilGlareRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-200"
              />

              {/* Đầu Lá Bài: Số La Mã & Danh Xưng Arcana */}
              <div className="relative z-10 flex items-center justify-between text-[9px] font-bold tracking-[0.2em] uppercase px-1.5 py-0.5 rounded bg-[#14111C]/90 border border-white/10">
                <span style={{ color: reader.accent_color }}>
                  {editorialMeta.roman}
                </span>
                <span className="text-[#F8F5F0]/90 truncate ml-1">
                  {editorialMeta.arcanaTitle}
                </span>
              </div>

              {/* Ảnh Chân Dung Reader */}
              <div className="relative my-1.5 flex-1 rounded-xl overflow-hidden border border-white/15 bg-[#14111C]">
                {reader.avatar_image ? (
                  <img
                    src={reader.avatar_image}
                    alt={reader.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-display text-4xl font-bold">
                    {reader.avatar_symbol}
                  </div>
                )}
              </div>

              {/* Chân Lá Bài: Nhãn Vật Tổ 3D */}
              <div className="relative z-10 text-center py-1 rounded bg-[#14111C]/90 border border-white/10">
                <span
                  style={{ color: reader.accent_color }}
                  className="text-[9px] font-semibold uppercase tracking-wider"
                >
                  {editorialMeta.totemLabel}
                </span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (7/12): Editorial Typography & Chỉ Số Tần Số Linh Hồn */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            {/* Badge & Tên Reader Cỡ Lớn (Editorial Serif) */}
            <div data-persona-reveal className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  style={{
                    backgroundColor: `${reader.accent_color}20`,
                    color: reader.accent_color,
                    borderColor: `${reader.accent_color}50`,
                  }}
                  className="inline-block px-3 py-0.5 rounded-full text-[10px] font-bold tracking-[0.18em] uppercase border"
                >
                  {reader.badge}
                </span>
                <span className="text-[10px] uppercase tracking-[0.22em] text-[#9E96B0]">
                  CHƯƠNG {editorialMeta.roman} / IV
                </span>
              </div>

              <h3 className="font-display text-3xl sm:text-5xl font-bold text-[#F8F5F0] leading-tight">
                {reader.name}
              </h3>

              <p
                style={{ color: reader.accent_color }}
                className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em]"
              >
                {reader.title}
              </p>
            </div>

            {/* Câu Quote Đặc Trưng (Editorial Pull-Quote) */}
            <div
              data-persona-reveal
              className="p-3.5 sm:p-4 rounded-2xl bg-[#09080D]/90 border border-white/10 relative"
            >
              <Quote
                style={{ color: reader.accent_color }}
                className="w-4 h-4 opacity-50 absolute top-3 left-3"
              />
              <p className="pl-6 text-sm sm:text-base italic text-[#F8F5F0] font-display leading-relaxed">
                &ldquo;{reader.sample_quote}&rdquo;
              </p>
            </div>

            {/* Mô tả phong cách & 3 Từ Khóa */}
            <div data-persona-reveal className="space-y-2.5">
              <p className="text-xs sm:text-sm text-[#9E96B0] leading-relaxed">
                {reader.tagline}
              </p>

              <div className="flex flex-wrap items-center gap-1.5">
                {reader.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2.5 py-0.5 rounded-lg bg-[#1A1626] border border-white/10 text-[10px] text-[#F8F5F0]/85"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>

            {/* 3 Thanh Chỉ Số Năng Lượng Reader (GSAP Animated Resonance Bars) */}
            <div
              data-persona-reveal
              className="space-y-2 pt-1 border-t border-white/10"
            >
              {editorialMeta.stats.map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#9E96B0]">
                    <span>{stat.label}</span>
                    <span
                      style={{ color: reader.accent_color }}
                      className="font-bold"
                    >
                      {stat.value}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#09080D] overflow-hidden">
                    <div
                      data-persona-bar
                      style={{
                        width: `${stat.value}%`,
                        backgroundColor: reader.accent_color,
                      }}
                      className="h-full rounded-full origin-left will-change-transform"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Cụm Nút Hành Động Kép: Chọn Trực Tiếp Reader Này hoặc Xem Tiếp (1/4 -> 4/4) */}
            <div
              data-persona-reveal
              className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5"
            >
              {/* Nút Chọn Thẳng Reader Đang Xem */}
              <button
                type="button"
                data-cursor={`CHỌN ${reader.name.toUpperCase()}`}
                onClick={handleSelectCurrentReader}
                style={{
                  borderColor: `${reader.accent_color}60`,
                  color: '#F8F5F0',
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1A1626] hover:bg-[#231D33] border text-xs font-bold transition-colors cursor-pointer"
              >
                <Compass
                  style={{ color: reader.accent_color }}
                  className="w-3.5 h-3.5"
                />
                <span>Chọn {reader.name} đọc bài ngay</span>
              </button>

              {/* Cụm Điều Hướng Lùi / Tiếp Theo */}
              <div className="flex items-center justify-end gap-2">
                {currentIdx > 0 && (
                  <button
                    type="button"
                    data-cursor="QUAY LẠI"
                    onClick={handlePrev}
                    className="p-2.5 rounded-xl bg-[#1A1626] hover:bg-[#231D33] border border-white/10 text-[#9E96B0] hover:text-[#F8F5F0] transition-colors cursor-pointer"
                    aria-label="Reader trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  data-cursor={isLast ? 'KHÁM PHÁ' : 'TIẾP THEO'}
                  onClick={handleNextOrFinish}
                  style={{
                    backgroundColor: reader.accent_color,
                    color: '#09080D',
                  }}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg hover:brightness-110 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {isLast
                      ? 'Khám phá ngay'
                      : `Tiếp theo (${currentIdx + 2}/4)`}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chỉ dẫn lăn chuột / chạm */}
            <div className="flex items-center justify-between text-[10px] text-[#9E96B0]/80 pt-0.5">
              <span className="text-[#C9A24A]">
                Chạm vào khung hoặc lăn chuột để chuyển Reader &rarr;
              </span>
              <span className="hidden sm:inline">
                Phím tắt: &larr; &rarr; hoặc ESC
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
