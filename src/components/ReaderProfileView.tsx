'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { READERS, type ReaderPersona } from '@/data/tarot-cards';
import { useReadingStore } from '@/lib/reading-store';
import { classifyAgeTier } from '@/lib/safety';
import { CURRENT_REFERENCE_YEAR, type ReaderId } from '@/lib/schemas';
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
import { CustomCursorFollower } from '@/components/CustomCursorFollower';
import { soundManager } from '@/lib/sound-effects';
import { ReaderVoicePreview, ReaderReviewCarousel } from '@/components/reader';
import {
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  ShieldCheck,
  ThumbsDown,
  Quote,
  Volume2,
  Compass,
  Eye,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

interface ReaderProfileViewProps {
  readerId: ReaderId;
  currentSlug: string;
}

interface SanctuaryPersonaSpec {
  roman: string;
  arcanaName: string;
  signatureCardTitle: string;
  signatureCardImage: string;
  totemName: string;
  frequencyLabel: string;
  spreadStyle: string;
  secondaryHex: string;
  baseAffinity: number;
  moodPillLabel: string;
  moodEmoji: string;
  topicMastery: [
    { topic: string; score: number },
    { topic: string; score: number },
    { topic: string; score: number },
  ];
}

const SANCTUARY_SPEC_MAP: Record<CanonicalReaderId, SanctuaryPersonaSpec> = {
  ba_ngoai: {
    roman: 'I',
    arcanaName: 'XIX • THE SUN',
    signatureCardTitle: 'Lá Mặt Trời (The Sun)',
    signatureCardImage:
      'https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg',
    totemName: 'Đèn Trà Sen Gốm Cổ',
    frequencyLabel: '432 Hz • Sóng Âm Chữa Lành',
    spreadStyle: '3 Lá Tâm Sự Đời Thường',
    secondaryHex: '#451A03',
    baseAffinity: 96,
    moodPillLabel: 'Đang mệt mỏi, cần vỗ về',
    moodEmoji: '🥺',
    topicMastery: [
      { topic: 'Chữa Lành Tâm Hồn & Gia Đình', score: 99 },
      { topic: 'Tình Cảm & Sự Bao Dung', score: 95 },
      { topic: 'Học Tập & Nhịp Sống Bình Yên', score: 90 },
    ],
  },
  chi_dai: {
    roman: 'II',
    arcanaName: 'XV • THE DEVIL (REV)',
    signatureCardTitle: 'Lá Ác Quỷ Đảo Chiều (The Devil)',
    signatureCardImage:
      'https://upload.wikimedia.org/wikipedia/commons/5/55/RWS_Tarot_15_Devil.jpg',
    totemName: 'Ly Pha Lê Ruby Đỏ',
    frequencyLabel: '528 Hz • Sóng Âm Tỉnh Thức',
    spreadStyle: '3 Lá Bóc Trần Sự Thật',
    secondaryHex: '#4C0519',
    baseAffinity: 94,
    moodPillLabel: 'Đang lụy / mập mờ, cần mắng tỉnh',
    moodEmoji: '🔥',
    topicMastery: [
      { topic: 'Soi Kèo Mập Mờ & Thoát Lụy Tình', score: 99 },
      { topic: 'Bản Lĩnh Cá Nhân & Tự Trọng', score: 97 },
      { topic: 'Quyết Đoán Sự Nghiệp & Tài Chính', score: 91 },
    ],
  },
  ban_than: {
    roman: 'III',
    arcanaName: '0 • THE FOOL',
    signatureCardTitle: 'Lá Kẻ Khờ (The Fool)',
    signatureCardImage:
      'https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg',
    totemName: 'Tinh Cầu Sao Hồng',
    frequencyLabel: '639 Hz • Sóng Âm Đồng Cảm',
    spreadStyle: '3 Lá Không Phán Xét',
    secondaryHex: '#4A044E',
    baseAffinity: 95,
    moodPillLabel: 'Muốn xả stress, tâm sự lầy lội',
    moodEmoji: '😂',
    topicMastery: [
      { topic: 'Tâm Sự Thầm Kín Không Phán Xét', score: 99 },
      { topic: 'Chuyện Crush, Bạn Bè & Gen Z Vibe', score: 96 },
      { topic: 'Giải Tỏa Áp Lực Tinh Thần', score: 93 },
    ],
  },
  thay_cu_meo: {
    roman: 'IV',
    arcanaName: 'IV • THE EMPEROR',
    signatureCardTitle: 'Lá Hoàng Đế (The Emperor)',
    signatureCardImage:
      'https://upload.wikimedia.org/wikipedia/commons/c/c3/RWS_Tarot_04_Emperor.jpg',
    totemName: 'Thiên Cầu Nghi Đồng Thau',
    frequencyLabel: '741 Hz • Sóng Âm Minh Triết',
    spreadStyle: '3 Lá Phân Tích Nhân Quả',
    secondaryHex: '#172554',
    baseAffinity: 97,
    moodPillLabel: 'Đang rối bời, cần phân tích logic',
    moodEmoji: '🧭',
    topicMastery: [
      { topic: 'Định Hướng Sự Nghiệp & Học Tập', score: 99 },
      { topic: 'Phân Tích Tài Chính & Kế Hoạch', score: 97 },
      { topic: 'Gỡ Rối Quyết Định Khó Khăn', score: 95 },
    ],
  },
};

export default function ReaderProfileView({
  readerId,
  currentSlug,
}: ReaderProfileViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const isCoupleMode = mode === 'couple';
  const shouldReduceMotion = useReducedMotion();

  const selectedReaderId = useReadingStore((state) => state.selectedReaderId);
  const setSelectedReaderId = useReadingStore(
    (state) => state.setSelectedReaderId
  );
  const hasFilledProfile = useReadingStore((state) => state.hasFilledProfile);
  const nickname = useReadingStore((state) => state.nickname);
  const birthYear = useReadingStore((state) => state.birthYear);

  // Canonical 4 Readers for the sanctuary
  const canonicalReaders = READERS.slice(0, 4);
  const initialCanonicalId = normalizeCanonicalReaderId(readerId);
  const initialFoundIdx = canonicalReaders.findIndex(
    (r) => r.id === initialCanonicalId
  );

  // Instant 0ms client-side active Reader index (avoids slow network route reloads)
  const [activeIdx, setActiveIdx] = useState<number>(
    initialFoundIdx >= 0 ? initialFoundIdx : 0
  );
  const [selectedMoodId, setSelectedMoodId] =
    useState<CanonicalReaderId | null>(null);
  const [isSampleCardFlipped, setIsSampleCardFlipped] = useState(false);
  const [isEnteringTent, setIsEnteringTent] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Refs for Zero-Rerender 3D WebGL Stage, Direct DOM Tilt & GSAP
  const webglMountRef = useRef<HTMLDivElement | null>(null);
  const portraitCardRef = useRef<HTMLDivElement | null>(null);
  const foilGlareRef = useRef<HTMLDivElement | null>(null);
  const dossierContainerRef = useRef<HTMLDivElement | null>(null);
  const readinessPctRef = useRef<HTMLSpanElement | null>(null);
  const lastWheelAtRef = useRef<number>(0);

  // Transient pointer & 3D scene references (0 React re-renders on mousemove)
  const pointerBridgeRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const sceneRef = useRef<THREE.Scene | null>(null);
  const totemGroupRef = useRef<THREE.Group | null>(null);
  const pointLightRef = useRef<THREE.PointLight | null>(null);
  const targetAccentColorRef = useRef<THREE.Color>(new THREE.Color('#EAB308'));
  const targetSecondaryColorRef = useRef<THREE.Color>(
    new THREE.Color('#451A03')
  );
  const targetPersonaIdxRef = useRef<number>(0);

  const reader: ReaderPersona =
    canonicalReaders[activeIdx] || canonicalReaders[0]!;
  const canonicalId = normalizeCanonicalReaderId(reader.id);
  const spec = SANCTUARY_SPEC_MAP[canonicalId];
  const activeSlug = READER_SLUG_MAP[canonicalId] || currentSlug || 'ba-ngoai';

  // Age policy (đổi tên phù hợp cho 10-15t)
  const agePolicy = classifyAgeTier(
    birthYear,
    CURRENT_REFERENCE_YEAR,
    reader.id
  );
  const isKidTeen = agePolicy.isKidTeenSafeMode;

  const displayName = isKidTeen ? reader.teen_safe_name : reader.name;
  const displayTagline = isKidTeen ? reader.teen_tagline : reader.tagline;
  const displayNotSuitable = isKidTeen
    ? reader.teen_not_suitable_for
    : reader.not_suitable_for;

  // Dynamic affinity score (boosts to 99% when user selects matching mood)
  const affinityScore =
    selectedMoodId === canonicalId ? 99 : spec.baseAffinity;

  // Sync Zustand store & browser URL bar in 0ms without triggering Next.js RSC network reload
  useEffect(() => {
    if (selectedReaderId !== reader.id) {
      setSelectedReaderId(reader.id, reader.accent_color);
    }
    if (typeof window !== 'undefined') {
      const query = isCoupleMode ? '?mode=couple' : '';
      const targetUrl = `/reading/reader/${activeSlug}${query}`;
      if (window.location.pathname !== `/reading/reader/${activeSlug}`) {
        window.history.replaceState(null, '', targetUrl);
      }
    }
  }, [
    activeSlug,
    isCoupleMode,
    reader.accent_color,
    reader.id,
    selectedReaderId,
    setSelectedReaderId,
  ]);

  // Instant 0ms Reader Switcher with Spatial Audio Chord
  const switchReaderInstantly = useCallback(
    (targetIdx: number, fromMood?: CanonicalReaderId) => {
      const safeIdx =
        (targetIdx + canonicalReaders.length) % canonicalReaders.length;
      const targetReader = canonicalReaders[safeIdx]!;
      soundManager.playReaderPersonaChord(targetReader.id);
      setIsSampleCardFlipped(false);
      if (fromMood) {
        setSelectedMoodId(fromMood);
      }
      setActiveIdx(safeIdx);
    },
    [canonicalReaders]
  );

  const handlePrev = useCallback(
    () => switchReaderInstantly(activeIdx - 1),
    [activeIdx, switchReaderInstantly]
  );
  const handleNext = useCallback(
    () => switchReaderInstantly(activeIdx + 1),
    [activeIdx, switchReaderInstantly]
  );

  // 1. LENIS SMOOTH SCROLL + GSAP SCROLLTRIGGER INITIALIZATION
  useEffect(() => {
    if (typeof window === 'undefined' || shouldReduceMotion) return;
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1.0,
    });

    lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    const tickerFn = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerFn);
      lenis.destroy();
    };
  }, [shouldReduceMotion]);

  // 2. SINGLE-INSTANCE THREE.JS 3D SANCTUARY STAGE (Initializes ONCE on mount, 0 Re-init on Reader Switch)
  useEffect(() => {
    if (shouldReduceMotion) return;
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
    const height = container.clientHeight || 400;
    // Cap DPR at 1.25 for locked 60 FPS
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const detachContextGuard = attachWebGLContextLostGuard(
      renderer.domElement,
      () => {}
    );

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 25);
    camera.position.set(0, 0.06, 2.9);

    try {
      scene.environment = createProceduralSanctuaryEnvMap(renderer);
    } catch {
      // Safe fallback
    }

    // Sanctuary Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xf8f5f0, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.5);
    keyLight.position.set(1.6, 2.4, 2.6);
    scene.add(keyLight);

    const personaLight = new THREE.PointLight(0xeab308, 1.85, 7);
    personaLight.position.set(0, 0.85, 1.4);
    scene.add(personaLight);
    pointLightRef.current = personaLight;

    // Custom GLSL Persona Aura Shader Plane (16x16 ultra-fast mesh)
    const auraUniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uAccentColor: { value: new THREE.Color(reader.accent_color) },
      uSecondaryColor: { value: new THREE.Color(spec.secondaryHex) },
      uPersonaIndex: { value: activeIdx },
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
      new THREE.PlaneGeometry(3.5, 3.5, 16, 16),
      auraShaderMat
    );
    auraPlane.position.set(0, 0.04, -0.55);
    scene.add(auraPlane);

    // 3D PBR Sacred Totem Group (Elevated above the card so it is clearly visible on Mobile & Desktop)
    const initialTotem = createReaderAltarTotemGroup(canonicalId);
    initialTotem.position.set(0, 0.84, 0.28);
    initialTotem.scale.setScalar(0.96);
    scene.add(initialTotem);
    totemGroupRef.current = initialTotem;

    // THREE.InstancedMesh: 48 Floating Sanctuary Crystals (1 single GPU draw call)
    const crystalCount = 48;
    const crystalGeom = new THREE.OctahedronGeometry(0.022, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8f5f0,
      emissive: new THREE.Color(reader.accent_color),
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
      radius: 0.68 + (i % 5) * 0.14,
      yOffset: (Math.random() - 0.5) * 1.55,
      speed: 0.32 + (i % 4) * 0.12,
      scale: 0.58 + (i % 3) * 0.25,
    }));
    scene.add(instancedCrystals);

    // Pause rendering automatically if scrolled out of viewport
    let isInViewport = true;
    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              isInViewport = entries[0]?.isIntersecting ?? true;
            },
            { threshold: 0.05 }
          )
        : null;
    observer?.observe(container);

    const handleResize = () => {
      if (!renderer || !container) return;
      const newW = container.clientWidth || 340;
      const newH = container.clientHeight || 400;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    let rafId: number | null = null;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (
        !isInViewport ||
        (typeof document !== 'undefined' && document.hidden)
      ) {
        return;
      }

      const elapsed = clock.getElapsedTime();
      const ptr = pointerBridgeRef.current;

      // Mobile-First Autonomous 3D Choreography when finger/mouse is idle
      const isIdle = Math.abs(ptr.x) < 0.02 && Math.abs(ptr.y) < 0.02;
      const effX = isIdle ? Math.sin(elapsed * 1.35) * 0.62 : ptr.x;
      const effY = isIdle ? Math.cos(elapsed * 0.95) * 0.48 : ptr.y;

      auraUniforms.uTime.value = elapsed;
      auraUniforms.uMouse.value.lerp(new THREE.Vector2(effX, effY), 0.12);
      auraUniforms.uAccentColor.value.lerp(targetAccentColorRef.current, 0.1);
      auraUniforms.uSecondaryColor.value.lerp(
        targetSecondaryColorRef.current,
        0.1
      );
      auraUniforms.uPersonaIndex.value +=
        (targetPersonaIdxRef.current - auraUniforms.uPersonaIndex.value) * 0.1;

      crystalMat.emissive.lerp(targetAccentColorRef.current, 0.1);

      if (totemGroupRef.current) {
        totemGroupRef.current.rotation.y = elapsed * 0.95 + effX * 0.6;
        totemGroupRef.current.rotation.x = effY * 0.35;
        totemGroupRef.current.position.y =
          0.84 + Math.sin(elapsed * 2.1) * 0.045;
      }

      // Autonomous 3D Tarot Card Tilt & Holographic Foil Glare Sweep on Mobile/Idle
      if (isIdle && portraitCardRef.current) {
        const autoRotY = effX * 9.5;
        const autoRotX = effY * 7.5;
        portraitCardRef.current.style.transform = `perspective(950px) rotateX(${autoRotX.toFixed(
          2
        )}deg) rotateY(${autoRotY.toFixed(2)}deg) scale3d(1.01, 1.01, 1.01)`;

        if (foilGlareRef.current) {
          const pctX = ((effX + 1) * 50).toFixed(1);
          const pctY = ((1 - effY) * 50).toFixed(1);
          const hexColor = `#${targetAccentColorRef.current.getHexString()}`;
          foilGlareRef.current.style.opacity = '0.36';
          foilGlareRef.current.style.background = `radial-gradient(circle at ${pctX}% ${pctY}%, ${hexColor}95 0%, transparent 65%)`;
        }
      }

      for (let i = 0; i < crystalCount; i++) {
        const seed = crystalSeeds[i]!;
        const angle = seed.angle + elapsed * seed.speed * 0.38;
        dummyObj.position.set(
          Math.cos(angle) * seed.radius + effX * 0.08,
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
      observer?.disconnect();
      window.removeEventListener('resize', handleResize);
      detachContextGuard();
      sceneRef.current = null;
      disposeThreeScene(scene, renderer);
    };
    // Only run ONCE on mount for 60 FPS
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldReduceMotion]);

  // 3. IN-PLACE 3D TOTEM SWAP & GSAP KINETIC REVEAL (< 0.2ms, 0 WebGL Re-init)
  useEffect(() => {
    const palette = getReaderAtmospherePalette(canonicalId);
    targetAccentColorRef.current.set(reader.accent_color);
    targetSecondaryColorRef.current.set(spec.secondaryHex);
    targetPersonaIdxRef.current = activeIdx;

    const scene = sceneRef.current;
    if (scene) {
      if (pointLightRef.current) {
        pointLightRef.current.color.setHex(palette.rimLightHex);
      }
      if (totemGroupRef.current) {
        scene.remove(totemGroupRef.current);
      }
      const nextTotem = createReaderAltarTotemGroup(canonicalId);
      nextTotem.position.set(0, 0.84, 0.28);
      nextTotem.scale.setScalar(0.96);
      scene.add(nextTotem);
      totemGroupRef.current = nextTotem;
    }

    if (!shouldReduceMotion && dossierContainerRef.current) {
      const ctx = gsap.context(() => {
        if (portraitCardRef.current) {
          gsap.fromTo(
            portraitCardRef.current,
            { rotationY: -28, scale: 0.94 },
            {
              rotationY: 0,
              scale: 1,
              duration: 0.48,
              ease: 'back.out(1.5)',
              overwrite: 'auto',
            }
          );
        }

        gsap.fromTo(
          '[data-sanctuary-reveal]',
          { opacity: 0, y: 14 },
          {
            opacity: 1,
            y: 0,
            duration: 0.38,
            stagger: 0.04,
            ease: 'power3.out',
            overwrite: 'auto',
          }
        );

        gsap.fromTo(
          '[data-sanctuary-bar]',
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.55,
            stagger: 0.06,
            ease: 'power3.out',
            overwrite: 'auto',
          }
        );
      }, dossierContainerRef);

      if (readinessPctRef.current) {
        const counterObj = { val: 75 };
        gsap.to(counterObj, {
          val: affinityScore,
          duration: 0.45,
          ease: 'power2.out',
          onUpdate: () => {
            if (readinessPctRef.current) {
              readinessPctRef.current.textContent = `${Math.round(
                counterObj.val
              )}% TƯƠNG THÍCH`;
            }
          },
        });
      }

      return () => ctx.revert();
    }
  }, [
    activeIdx,
    affinityScore,
    canonicalId,
    reader.accent_color,
    shouldReduceMotion,
    spec.secondaryHex,
  ]);

  // 4. KEYBOARD NAVIGATION (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // 5. DIRECT DOM 3D CARD TILT & FOIL GLARE (0 React Re-renders on mousemove & touchmove)
  const apply3DCardTiltFromClientCoords = (clientX: number, clientY: number) => {
    const cardEl = portraitCardRef.current;
    if (!cardEl || shouldReduceMotion) return;

    const rect = cardEl.getBoundingClientRect();
    const normX = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width) * 2 - 1));
    const normY = Math.max(-1, Math.min(1, -((clientY - rect.top) / rect.height) * 2 + 1));

    pointerBridgeRef.current.x = normX;
    pointerBridgeRef.current.y = normY;

    const rotY = normX * 13;
    const rotX = normY * 10;
    cardEl.style.transform = `perspective(950px) rotateX(${rotX.toFixed(
      2
    )}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;

    if (foilGlareRef.current) {
      const pctX = ((normX + 1) * 50).toFixed(1);
      const pctY = ((1 - normY) * 50).toFixed(1);
      foilGlareRef.current.style.opacity = '0.42';
      foilGlareRef.current.style.background = `radial-gradient(circle at ${pctX}% ${pctY}%, ${reader.accent_color}99 0%, transparent 65%)`;
    }
  };

  const handleCardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    apply3DCardTiltFromClientCoords(e.clientX, e.clientY);
  };

  const handleCardTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    apply3DCardTiltFromClientCoords(touch.clientX, touch.clientY);
  };

  const handleCardPointerLeave = () => {
    pointerBridgeRef.current.x = 0;
    pointerBridgeRef.current.y = 0;
  };

  // Horizontal Wheel / Trackpad Scrub on the Dossier Card
  const handleDossierWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) < 24) return;
    const now = performance.now();
    if (now - lastWheelAtRef.current < 420) return;
    lastWheelAtRef.current = now;
    soundManager.playScrollHarmonic(e.deltaX * 0.05);
    if (e.deltaX > 0) handleNext();
    else handlePrev();
  };

  // Touch Swipe Gestures
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0]?.clientX ?? null);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    pointerBridgeRef.current.x = 0;
    pointerBridgeRef.current.y = 0;
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0]?.clientX ?? 0;
    const diff = touchStartX - touchEndX;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    setTouchStartX(null);
  };

  // Flip Signature Sample Card to preview sample_reading_snippet
  const handleToggleSampleCard = () => {
    soundManager.playCardFlip();
    setIsSampleCardFlipped((prev) => !prev);
  };

  // CTA proceed into Reader's Tent
  const handleSelectAndProceed = () => {
    soundManager.playMysticChime();
    setSelectedReaderId(reader.id, reader.accent_color);
    setIsEnteringTent(true);
    setTimeout(
      () => {
        if (isCoupleMode) {
          router.push('/couple');
          return;
        }
        if (hasFilledProfile && nickname && nickname.trim() && birthYear) {
          router.push('/reading/chu-de');
        } else {
          router.push('/reading/ve-ban');
        }
      },
      shouldReduceMotion ? 50 : 380
    );
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onWheel={handleDossierWheel}
      className="relative w-full max-w-6xl mx-auto px-4 pt-3 sm:pt-5 pb-32 sm:pb-36 overflow-hidden flex flex-col justify-start min-h-[calc(100dvh-4rem)]"
    >
      {/* Con trỏ chuột từ tính (Magnetic Cursor Follower - 0 React re-renders) */}
      <CustomCursorFollower />

      {/* Tent Curtain Transition Overlay */}
      <AnimatePresence>
        {isEnteringTent && !shouldReduceMotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none flex"
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              className="w-1/2 h-full bg-[#120F1D] border-r border-[#C9A24A]/40 shadow-[10px_0_40px_rgba(0,0,0,0.8)]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              className="w-1/2 h-full bg-[#120F1D] border-l border-[#C9A24A]/40 shadow-[-10px_0_40px_rgba(0,0,0,0.8)]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= HEADER & TÍNH NĂNG MỚI 1: BỘ LỌC TÂM TRẠNG 1-CHẠM ================= */}
      <div className="text-center mb-4 sm:mb-5 shrink-0 space-y-2.5">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-[10px] font-bold tracking-[0.26em] text-[#C9A24A] uppercase">
            BƯỚC 1 · CHỌN NĂNG LƯỢNG ({activeIdx + 1}/4)
          </span>
          {isKidTeen && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-semibold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              <ShieldCheck className="w-3 h-3" />
              <span>Chế độ học đường (10-15t)</span>
            </span>
          )}
        </div>

        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-[#F8F5F0]">
          {isCoupleMode
            ? 'Chọn Reader Soi Kèo Mối Quan Hệ'
            : 'Chọn Người Giải Mã Vận Mệnh'}
        </h1>

        <p className="text-xs sm:text-sm text-[#9E96B0] max-w-xl mx-auto">
          {isCoupleMode
            ? 'Mỗi Reader có lăng kính độc đáo về tình cảm. Chọn tâm trạng của hai bạn hoặc chọn vị Reader hợp gu nhất.'
            : 'Chạm vào tâm trạng hiện tại của bạn để hệ thống gợi ý vị Reader đồng điệu nhất đêm nay.'}
        </p>

        {/* TÍNH NĂNG MỚI 1: Mood Matcher Bar (4 Nút Tâm Trạng 1-Chạm) */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1 max-w-3xl mx-auto">
          {canonicalReaders.map((r, idx) => {
            const rCanId = normalizeCanonicalReaderId(r.id);
            const rSpec = SANCTUARY_SPEC_MAP[rCanId];
            const isMoodSelected = selectedMoodId === rCanId;
            const isCurrentReader = idx === activeIdx;

            return (
              <button
                key={r.id}
                type="button"
                data-cursor={`HỢP VỚI ${r.name.toUpperCase()}`}
                onClick={() => switchReaderInstantly(idx, rCanId)}
                style={
                  isCurrentReader
                    ? {
                        backgroundColor: `${r.accent_color}22`,
                        borderColor: r.accent_color,
                        color: '#F8F5F0',
                      }
                    : undefined
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                  isCurrentReader
                    ? 'shadow-sm font-semibold'
                    : 'bg-[#14111C] border-[#262235] text-[#9E96B0] hover:text-[#F8F5F0] hover:border-white/25'
                }`}
              >
                <span>{rSpec.moodEmoji}</span>
                <span>{rSpec.moodPillLabel}</span>
                {isMoodSelected && (
                  <CheckCircle2
                    style={{ color: r.accent_color }}
                    className="w-3.5 h-3.5 shrink-0"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Thanh 4 Tab Reader Trực Tiếp & Nút Mũi Tên */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 pt-1">
          <button
            type="button"
            aria-label="Reader trước"
            data-cursor="TRƯỚC"
            onClick={handlePrev}
            className="w-8 h-8 rounded-full bg-[#14121F] hover:bg-[#1D192C] border border-[#262235] text-[#9E96B0] hover:text-[#F8F5F0] flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5">
            {canonicalReaders.map((r, idx) => {
              const isCurrent = idx === activeIdx;
              const rSpec =
                SANCTUARY_SPEC_MAP[normalizeCanonicalReaderId(r.id)];
              const tabName = isKidTeen ? r.teen_safe_name : r.name;
              return (
                <button
                  key={r.id}
                  type="button"
                  aria-label={`Xem ${tabName}`}
                  data-cursor={`LỀU ${rSpec.roman}/IV`}
                  onClick={() => switchReaderInstantly(idx)}
                  style={
                    isCurrent
                      ? {
                          backgroundColor: r.accent_color,
                          color: '#09080D',
                        }
                      : undefined
                  }
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'shadow-md'
                      : 'bg-[#1A1626] text-[#9E96B0] hover:text-[#F8F5F0] border border-white/10'
                  }`}
                >
                  <span className="mr-1 opacity-75">{rSpec.roman}.</span>
                  <span>{tabName}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            aria-label="Reader kế tiếp"
            data-cursor="TIẾP THEO"
            onClick={handleNext}
            className="w-8 h-8 rounded-full bg-[#14121F] hover:bg-[#1D192C] border border-[#262235] text-[#9E96B0] hover:text-[#F8F5F0] flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ================= KHUNG HỒ SƠ LỀU 3D BẤT ĐỐI XỨNG (5/12 SÂN KHẤU 3D | 7/12 EDITORIAL DOSSIER) ================= */}
      <div
        ref={dossierContainerRef}
        className="flex-1 w-full max-w-5xl mx-auto flex items-center justify-center"
      >
        <div
          style={{
            borderColor: `${reader.accent_color}60`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.82), 0 0 36px ${reader.accent_color}20`,
          }}
          className="w-full rounded-[2rem] p-5 sm:p-7 md:p-8 border bg-[#12101B] relative overflow-hidden transition-colors duration-300"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* ================= CỘT TRÁI (5/12): SÂN KHẤU THREE.JS ĐƠN BẢN + LÁ BÀI TAROT 3D TILT & LẬT BÀI MẪU ================= */}
            <div
              onPointerMove={handleCardPointerMove}
              onPointerLeave={handleCardPointerLeave}
              onTouchMove={handleCardTouchMove}
              className="lg:col-span-5 relative flex flex-col items-center justify-center pt-14 sm:pt-16 pb-3 min-h-[380px] sm:min-h-[430px]"
            >
              {/* Single-Instance Three.js WebGL Stage (GLSL Aura + PBR Totem + 48 InstancedMesh Crystals) */}
              <div
                ref={webglMountRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 w-full h-full z-0"
              />

              {/* Lá Bài Tarot Hoàng Gia 3D (Mặt Trước: Chân Dung Reader | Mặt Sau: Lá Bài Hộ Mệnh & Lời Giải Mẫu) */}
              <div
                ref={portraitCardRef}
                data-cursor={
                  isSampleCardFlipped ? 'XEM CHÂN DUNG' : 'LẬT BÀI MẪU'
                }
                onClick={handleToggleSampleCard}
                style={{
                  borderColor: `${reader.accent_color}95`,
                  boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 38px ${reader.accent_color}55`,
                }}
                className="relative z-10 w-48 sm:w-56 aspect-[3/4] rounded-2xl border-2 bg-[#09080D]/72 p-3 flex flex-col justify-between overflow-hidden cursor-pointer transition-transform duration-150 ease-out will-change-transform select-none"
              >
                {/* Lớp Kim Tuyến Phản Xạ Theo Chuột (Holographic Foil Glare) */}
                <div
                  ref={foilGlareRef}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-200"
                />

                {/* Đầu Lá Bài */}
                <div className="relative z-10 flex items-center justify-between text-[9px] font-bold tracking-[0.18em] uppercase px-2 py-1 rounded-lg bg-[#14111C] border border-white/10">
                  <span style={{ color: reader.accent_color }}>
                    LỀU {spec.roman}/IV
                  </span>
                  <span className="text-[#F8F5F0]/90 truncate ml-1">
                    {isSampleCardFlipped ? spec.arcanaName : reader.badge}
                  </span>
                </div>

                {/* Thân Lá Bài: Chuyển đổi mượt giữa Chân Dung Reader và Lá Bài Hộ Mệnh RWS 1909 */}
                <div className="relative my-2 flex-1 rounded-xl overflow-hidden border border-white/15 bg-[#14111C]">
                  {!isSampleCardFlipped ? (
                    reader.avatar_image ? (
                      <img
                        src={reader.avatar_image}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-display text-5xl font-bold">
                        {reader.avatar_symbol}
                      </div>
                    )
                  ) : (
                    <div className="relative w-full h-full flex flex-col justify-end">
                      <img
                        src={spec.signatureCardImage}
                        alt={spec.signatureCardTitle}
                        className="absolute inset-0 w-full h-full object-cover opacity-35"
                      />
                      <div className="relative z-10 p-3 bg-gradient-to-t from-[#09080D] via-[#09080D]/90 to-transparent space-y-1.5 text-left">
                        <div
                          style={{ color: reader.accent_color }}
                          className="text-[10px] font-bold uppercase tracking-wider"
                        >
                          ✦ {spec.signatureCardTitle}
                        </div>
                        <p className="text-[11px] sm:text-xs text-[#F8F5F0] italic font-serif leading-relaxed">
                          &ldquo;{reader.sample_reading_snippet}&rdquo;
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chân Lá Bài: Nút Lật Thử Lá Bài Hộ Mệnh */}
                <div className="relative z-10 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#14111C] border border-white/10 text-[10px] font-bold">
                  {isSampleCardFlipped ? (
                    <>
                      <RotateCcw
                        style={{ color: reader.accent_color }}
                        className="w-3 h-3"
                      />
                      <span className="text-[#F8F5F0]">
                        Quay lại chân dung {displayName}
                      </span>
                    </>
                  ) : (
                    <>
                      <Eye
                        style={{ color: reader.accent_color }}
                        className="w-3 h-3"
                      />
                      <span style={{ color: reader.accent_color }}>
                        Chạm để lật xem lời luận mẫu
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* 3 Từ khóa đặc trưng bên dưới Lá Bài 3D */}
              <div className="relative z-10 flex flex-wrap items-center justify-center gap-1.5 mt-3">
                {reader.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2.5 py-0.5 rounded-lg bg-[#09080D] border border-white/10 text-[10px] text-[#C9A24A] font-medium"
                  >
                    ✦ {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* ================= CỘT PHẢI (7/12): EDITORIAL DOSSIER, THÔNG TIN NGHI THỨC & 3 THANH CHUYÊN MÔN ================= */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
              {/* Tiêu đề Editorial Serif + Trạng thái Sẵn Sàng */}
              <div data-sanctuary-reveal className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F8F5F0] leading-tight">
                    {displayName}
                  </h2>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                    ● Sẵn Sàng Tiếp Đón
                  </span>
                </div>
                <p
                  style={{ color: reader.accent_color }}
                  className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em]"
                >
                  {reader.title}
                </p>
              </div>

              {/* TÍNH NĂNG MỚI 3: 3 Thẻ Thông Số Lều Nghi Thức (Vật Tổ 3D • Tần Số Âm Thanh • Trải Bài) */}
              <div
                data-sanctuary-reveal
                className="grid grid-cols-1 sm:grid-cols-3 gap-2"
              >
                <div className="p-2.5 rounded-xl bg-[#09080D]/90 border border-white/10">
                  <div className="text-[9px] uppercase tracking-wider text-[#9E96B0]">
                    Vật Tổ 3D Trấn Lều
                  </div>
                  <div
                    style={{ color: reader.accent_color }}
                    className="text-xs font-bold mt-0.5 truncate"
                  >
                    {spec.totemName}
                  </div>
                </div>

                <button
                  type="button"
                  data-cursor="NGHE TẦN SỐ"
                  onClick={() => soundManager.playReaderPersonaChord(reader.id)}
                  className="p-2.5 rounded-xl bg-[#09080D]/90 hover:bg-[#1A1626] border border-white/10 text-left transition-colors cursor-pointer"
                >
                  <div className="text-[9px] uppercase tracking-wider text-[#9E96B0] flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-[#C9A24A]" />
                    <span>Tần Số Cộng Hưởng (Bấm nghe)</span>
                  </div>
                  <div className="text-xs font-bold text-[#F8F5F0] mt-0.5 truncate">
                    {spec.frequencyLabel}
                  </div>
                </button>

                <div className="p-2.5 rounded-xl bg-[#09080D]/90 border border-white/10">
                  <div className="text-[9px] uppercase tracking-wider text-[#9E96B0]">
                    Phong Cách Trải Bài
                  </div>
                  <div className="text-xs font-bold text-[#F8F5F0] mt-0.5 truncate">
                    {spec.spreadStyle}
                  </div>
                </div>
              </div>

              {/* Câu trích dẫn đặc trưng & Nút Xem Giọng Luận Mẫu */}
              <div
                data-sanctuary-reveal
                className="p-3.5 rounded-2xl bg-[#09080D]/90 border border-[#262235] space-y-2 relative"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="relative pl-5">
                    <Quote
                      style={{ color: reader.accent_color }}
                      className="w-3.5 h-3.5 opacity-60 absolute top-0.5 left-0"
                    />
                    <p className="text-xs sm:text-sm italic text-[#F8F5F0] font-serif leading-relaxed">
                      &ldquo;{reader.sample_quote}&rdquo;
                    </p>
                  </div>

                  <button
                    type="button"
                    data-cursor="GIỌNG ĐỌC MẪU"
                    onClick={handleToggleSampleCard}
                    style={{
                      borderColor: `${reader.accent_color}50`,
                      color: reader.accent_color,
                    }}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#14111C] border text-[10px] font-bold hover:brightness-110 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>
                      {isSampleCardFlipped ? 'Ẩn lời mẫu' : 'Thử giọng đọc'}
                    </span>
                  </button>
                </div>

                {/* Hiển thị luôn đoạn trích luận giải mẫu (sample_reading_snippet) khi mở rộng */}
                {isSampleCardFlipped && reader.sample_reading_snippet && (
                  <div
                    style={{ borderColor: `${reader.accent_color}40` }}
                    className="pt-2 mt-2 border-t text-xs text-[#E5C687] leading-relaxed"
                  >
                    <span className="font-bold uppercase text-[10px] tracking-wider block mb-0.5">
                      🔮 Lời giải mẫu ({spec.signatureCardTitle}):
                    </span>
                    <span>{reader.sample_reading_snippet}</span>
                  </div>
                )}
              </div>

              {/* Cặp Thẻ Đối Chiếu: Hợp Với vs Không Hợp Nếu */}
              <div
                data-sanctuary-reveal
                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
              >
                <div className="p-3 rounded-xl bg-[#09080D]/70 border border-[#262235] text-xs space-y-1">
                  <div className="font-bold text-[#E5C687] flex items-center gap-1">
                    <span>✓ Hợp với bạn nếu:</span>
                  </div>
                  <p className="text-[#9E96B0] leading-relaxed">
                    {displayTagline}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#1C1217]/60 border border-rose-900/40 text-xs space-y-1">
                  <div className="font-bold text-rose-400 flex items-center gap-1">
                    <ThumbsDown className="w-3 h-3 text-rose-400" />
                    <span>Không hợp nếu:</span>
                  </div>
                  <p className="text-[#B59AA3] leading-relaxed">
                    {displayNotSuitable}
                  </p>
                </div>
              </div>

              {/* 3 Thanh Chuyên Môn Chủ Đề + Chỉ Số Tương Thích Trực Giác Động */}
              <div
                data-sanctuary-reveal
                className="p-3.5 rounded-2xl bg-[#09080D]/80 border border-white/10 space-y-2.5"
              >
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-[#9E96B0] flex items-center gap-1">
                    <Compass
                      style={{ color: reader.accent_color }}
                      className="w-3.5 h-3.5"
                    />
                    <span>CHỈ SỐ CHUYÊN MÔN & TƯƠNG THÍCH TRỰC GIÁC</span>
                  </span>
                  <span
                    ref={readinessPctRef}
                    style={{ color: reader.accent_color }}
                  >
                    {affinityScore}% TƯƠNG THÍCH
                  </span>
                </div>

                <div className="space-y-2">
                  {spec.topicMastery.map((item) => (
                    <div key={item.topic} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#F8F5F0]/85">{item.topic}</span>
                        <span
                          style={{ color: reader.accent_color }}
                          className="font-bold"
                        >
                          {item.score}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#1D192C] overflow-hidden">
                        <div
                          data-sanctuary-bar
                          style={{
                            width: `${item.score}%`,
                            backgroundColor: reader.accent_color,
                          }}
                          className="h-full rounded-full origin-left will-change-transform"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TÍNH NĂNG MỚI: Thử chất giọng AI Voice Reader */}
              <ReaderVoicePreview
                readerId={reader.id}
                readerName={displayName}
                accentColor={reader.accent_color}
              />

              {/* TÍNH NĂNG MỚI: Đánh giá từ khách đã trải bài */}
              <ReaderReviewCarousel
                readerId={reader.id}
                accentColor={reader.accent_color}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================= THANH ĐÁY CỐ ĐỊNH (ZERO BACKDROP-BLUR LAG, 60 FPS) ================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0E0D17]/98 border-t border-[#262235] p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.85)]">
        <div className="max-w-xl mx-auto flex flex-col items-center gap-2">
          <button
            type="button"
            data-cursor={`VÀO LỀU ${displayName.toUpperCase()}`}
            onClick={handleSelectAndProceed}
            className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#C9A24A] via-[#E5C687] to-[#C9A24A] hover:brightness-110 text-[#0B0A12] font-bold text-sm sm:text-base shadow-[0_4px_25px_rgba(217,179,106,0.35)] transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isCoupleMode
                ? `Chọn ${displayName} & Bắt Đầu Bói Đôi`
                : `Vào Lều ${displayName}`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {!isCoupleMode && (
            <Link
              href={`/reading/reader/${activeSlug}?mode=couple`}
              data-cursor="CHẾ ĐỘ BÓI ĐÔI"
              className="inline-flex items-center gap-1.5 text-xs text-[#9E96B0] hover:text-[#E5C687] transition-colors"
            >
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>
                Muốn bói cùng người ấy? Chuyển sang <strong>Bói Đôi</strong>{' '}
                &rarr;
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
