'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {
  attachWebGLContextLostGuard,
  detectHardwareTier,
  disposeThreeScene,
  getReaderAtmospherePalette,
} from '@/lib/three/core';
import { create3DTarotCardMesh } from '@/lib/three/card-textures';
import {
  ASTRAL_VORTEX_FRAGMENT_SHADER,
  ASTRAL_VORTEX_VERTEX_SHADER,
  CHROMATIC_VIGNETTE_SHADER,
} from '@/lib/three/shaders';
import { soundManager } from '@/lib/sound-effects';

export interface HeroFanCardItem {
  roman: string;
  title: string;
  image: string;
  meaningSnippet: string;
  baseAngle: number;
  baseX: number;
  baseY: number;
  isFront?: boolean;
}

export interface ScrollBridgeState {
  progress: number;
  velocity: number;
}

interface HeroTarotDeck3DProps {
  cards: HeroFanCardItem[];
  activeCardIdx: number | null;
  selectedReaderId?: 'ba_ngoai' | 'chi_dai' | 'ban_than' | 'thay_cu_meo';
  scrollProgress?: number;
  scrollVelocity?: number;
  scrollStateRef?: React.MutableRefObject<ScrollBridgeState>;
  enablePostProcessing?: boolean;
  isPaused?: boolean;
  onSelectCard: (idx: number) => void;
  onFallbackRequested?: () => void;
}

/**
 * Builds the 3D Sacred Altar Totem for each of the 4 Canonical Readers using PBR MeshPhysicalMaterial:
 * - ba_ngoai: Đèn Trà Sen Gốm Cổ & Nến Ấm (#EAB308)
 * - chi_dai: Ly Rượu Vang Pha Lê & Hoa Hồng Đỏ (#E11D48)
 * - ban_than: Tinh Cầu Ngôi Sao Hồng Lấp Lánh (#EC4899)
 * - thay_cu_meo: La Bàn Thiên Văn Đồng Thau Armillary Sphere (#3B82F6)
 */
export function createReaderAltarTotemGroup(
  readerId: 'ba_ngoai' | 'chi_dai' | 'ban_than' | 'thay_cu_meo'
): THREE.Group {
  const group = new THREE.Group();
  const palette = getReaderAtmospherePalette(readerId);

  const goldMat = new THREE.MeshPhysicalMaterial({
    color: 0xc9a24a,
    metalness: 0.85,
    roughness: 0.22,
    clearcoat: 0.6,
  });

  const accentMat = new THREE.MeshPhysicalMaterial({
    color: palette.rimLightHex,
    emissive: palette.rimLightHex,
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 0.3,
    transparent: true,
    opacity: 0.92,
  });

  if (readerId === 'ba_ngoai') {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.24, 0.1, 16),
      goldMat
    );
    const flameCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.14, 0),
      accentMat
    );
    flameCore.position.y = 0.14;
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.012, 8, 24),
      goldMat
    );
    halo.rotation.x = Math.PI / 2.3;
    halo.position.y = 0.06;
    group.add(base, flameCore, halo);
  } else if (readerId === 'chi_dai') {
    const rubyCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.19, 0),
      accentMat
    );
    const crownRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.26, 0.014, 8, 24),
      goldMat
    );
    crownRing.rotation.x = Math.PI / 3;
    group.add(rubyCrystal, crownRing);
  } else if (readerId === 'ban_than') {
    const starCore = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.17, 0),
      accentMat
    );
    const orbit1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.25, 0.01, 8, 24),
      goldMat
    );
    const orbit2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.009, 8, 24),
      accentMat
    );
    orbit1.rotation.set(0.8, 0.4, 0);
    orbit2.rotation.set(-0.6, -0.5, 0.4);
    group.add(starCore, orbit1, orbit2);
  } else {
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), accentMat);
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.012, 8, 24),
      goldMat
    );
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.25, 0.012, 8, 24),
      goldMat
    );
    const ring3 = new THREE.Mesh(
      new THREE.TorusGeometry(0.29, 0.01, 8, 24),
      accentMat
    );
    ring1.rotation.x = Math.PI / 4;
    ring2.rotation.y = Math.PI / 3;
    ring3.rotation.z = Math.PI / 6;
    group.add(core, ring1, ring2, ring3);
  }

  group.scale.setScalar(0.76);
  group.position.set(0, 0.92, -0.32);
  return group;
}

export function HeroTarotDeck3D({
  cards,
  activeCardIdx,
  selectedReaderId = 'ba_ngoai',
  scrollProgress = 0,
  scrollVelocity = 0,
  scrollStateRef,
  enablePostProcessing = false,
  isPaused = false,
  onSelectCard,
  onFallbackRequested,
}: HeroTarotDeck3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const activeIdxRef = useRef<number | null>(activeCardIdx);
  const scrollProgressRef = useRef<number>(scrollProgress);
  const scrollVelocityRef = useRef<number>(scrollVelocity);
  const isPausedRef = useRef<boolean>(isPaused);
  const onSelectCardRef = useRef(onSelectCard);
  const onFallbackRef = useRef(onFallbackRequested);
  const initialCardsRef = useRef(cards);

  // References for in-place Reader switching without destroying WebGLRenderer
  const sceneRef = useRef<THREE.Scene | null>(null);
  const totemGroupRef = useRef<THREE.Group | null>(null);
  const rimLightRef = useRef<THREE.PointLight | null>(null);
  const candleLightRef = useRef<THREE.PointLight | null>(null);

  const [readerIdState, setReaderIdState] = useState<
    'ba_ngoai' | 'chi_dai' | 'ban_than' | 'thay_cu_meo'
  >(selectedReaderId);

  useEffect(() => {
    activeIdxRef.current = activeCardIdx;
  }, [activeCardIdx]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    scrollVelocityRef.current = scrollVelocity;
  }, [scrollVelocity]);

  useEffect(() => {
    onSelectCardRef.current = onSelectCard;
  }, [onSelectCard]);

  useEffect(() => {
    onFallbackRef.current = onFallbackRequested;
  }, [onFallbackRequested]);

  // In-place Reader Totem & Lighting swap (<0.2ms, zero WebGL re-initialization)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const palette = getReaderAtmospherePalette(readerIdState);
    if (rimLightRef.current) {
      rimLightRef.current.color.setHex(palette.rimLightHex);
    }
    if (candleLightRef.current) {
      candleLightRef.current.color.setHex(palette.candleLightHex);
    }

    if (totemGroupRef.current) {
      scene.remove(totemGroupRef.current);
    }
    const nextTotem = createReaderAltarTotemGroup(readerIdState);
    scene.add(nextTotem);
    totemGroupRef.current = nextTotem;
  }, [readerIdState]);

  // Main WebGL Scene Initialization — Runs ONCE on mount for butter-smooth 60 FPS
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const tierConfig = detectHardwareTier();
    if (!tierConfig.enableWebGL) {
      onFallbackRef.current?.();
      return;
    }

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: tierConfig.tier === 'tier1',
        powerPreference: 'high-performance',
        stencil: false,
      });
    } catch {
      onFallbackRef.current?.();
      return;
    }

    const width = container.clientWidth || 380;
    const height = container.clientHeight || 280;
    // Cap DPR at 1.25 max so Fragment Shader fill-rate stays ultra-fast on Retina/4K screens
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const detachContextGuard = attachWebGLContextLostGuard(
      renderer.domElement,
      () => {
        onFallbackRef.current?.();
      }
    );

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 25);
    camera.position.set(0, 0.08, 3.15);

    // Lighting Rig
    const palette = getReaderAtmospherePalette(readerIdState);
    const ambientLight = new THREE.AmbientLight(0x241c38, 1.85);
    scene.add(ambientLight);

    const keyGoldLight = new THREE.DirectionalLight(0xf3e5ab, 2.2);
    keyGoldLight.position.set(1.8, 2.5, 2.8);
    scene.add(keyGoldLight);

    const readerRimLight = new THREE.PointLight(palette.rimLightHex, 2.5, 8);
    readerRimLight.position.set(-1.6, 1.1, 1.5);
    scene.add(readerRimLight);
    rimLightRef.current = readerRimLight;

    const warmCandleLight = new THREE.PointLight(palette.candleLightHex, 1.7, 6);
    warmCandleLight.position.set(1.5, -1.0, 1.9);
    scene.add(warmCandleLight);
    candleLightRef.current = warmCandleLight;

    // 1. Custom GLSL Shader Backdrop (Lightweight 20x20 grid for 60fps vertex deformation)
    const shaderUniforms = {
      uTime: { value: 0 },
      uScrollProgress: { value: 0 },
      uVelocity: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uColorGold: { value: new THREE.Color(0xc9a24a) },
      uColorViolet: { value: new THREE.Color(0x8b5cf6) },
      uColorRose: { value: new THREE.Color(0xe879a8) },
    };

    const vortexShaderMat = new THREE.ShaderMaterial({
      uniforms: shaderUniforms,
      vertexShader: ASTRAL_VORTEX_VERTEX_SHADER,
      fragmentShader: ASTRAL_VORTEX_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const vortexPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(4.0, 4.0, 20, 20),
      vortexShaderMat
    );
    vortexPlane.position.set(0, 0.05, -0.75);
    scene.add(vortexPlane);

    // 2. Sacred PBR Golden Halo Ring
    const haloRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.12, 0.011, 10, 48),
      new THREE.MeshPhysicalMaterial({
        color: 0xc9a24a,
        metalness: 0.88,
        roughness: 0.2,
        clearcoat: 0.8,
        transparent: true,
        opacity: 0.55,
      })
    );
    haloRing.position.set(0, -0.02, -0.42);
    scene.add(haloRing);

    // 3. THREE.InstancedMesh: 64 Golden Astral Crystals in 1 single draw call
    const crystalCount = 64;
    const crystalGeom = new THREE.OctahedronGeometry(0.024, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xf3e5ab,
      emissive: 0xc9a24a,
      emissiveIntensity: 0.35,
      metalness: 0.85,
      roughness: 0.2,
    });
    const instancedCrystals = new THREE.InstancedMesh(
      crystalGeom,
      crystalMat,
      crystalCount
    );

    const dummyObj = new THREE.Object3D();
    const crystalSeeds = Array.from({ length: crystalCount }, (_, i) => ({
      angle: (i / crystalCount) * Math.PI * 2 * 2,
      radius: 0.85 + Math.random() * 1.1,
      yOffset: (Math.random() - 0.5) * 1.6,
      speed: 0.25 + Math.random() * 0.4,
      scale: 0.55 + Math.random() * 0.85,
    }));
    scene.add(instancedCrystals);

    // 4. Reader Altar Totem Group
    const totemGroup = createReaderAltarTotemGroup(readerIdState);
    scene.add(totemGroup);
    totemGroupRef.current = totemGroup;

    // 5. 5 Hero Fan Cards in 3D Space
    const deckGroup = new THREE.Group();
    scene.add(deckGroup);

    const cardMeshes: THREE.Mesh[] = [];
    const baseTransforms: Array<{
      x: number;
      y: number;
      z: number;
      rotY: number;
      rotZ: number;
    }> = [];

    initialCardsRef.current.slice(0, 5).forEach((card, idx) => {
      const normalized = idx - 2;
      const mesh = create3DTarotCardMesh({
        roman: card.roman,
        title: card.title,
        imageUrl: card.image,
        accentHex: palette.primaryHex,
      });

      const x = normalized * 0.42;
      const y = -Math.abs(normalized) * 0.08 - 0.1;
      const z = (2 - Math.abs(normalized)) * 0.08;
      const rotZ = -normalized * 0.16;
      const rotY = normalized * 0.14;

      mesh.position.set(x, y, z);
      mesh.rotation.set(0, rotY, rotZ);
      mesh.userData = { cardIdx: idx };

      deckGroup.add(mesh);
      cardMeshes.push(mesh);
      baseTransforms.push({ x, y, z, rotY, rotZ });
    });

    // Optional Post-Processing Pipeline (only when explicitly enabled to preserve 60fps default)
    let composer: EffectComposer | null = null;
    let chromaticPass: ShaderPass | null = null;

    if (enablePostProcessing && tierConfig.tier === 'tier1') {
      try {
        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        composer.addPass(
          new UnrealBloomPass(new THREE.Vector2(width / 2, height / 2), 0.3, 0.4, 0.82)
        );
        chromaticPass = new ShaderPass(CHROMATIC_VIGNETTE_SHADER);
        composer.addPass(chromaticPass);
      } catch {
        composer = null;
      }
    }

    // Throttled Raycaster for hover & click
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(0, 0);
    let hoveredIdx: number | null = null;
    let targetGroupRotX = 0;
    let targetGroupRotY = 0;
    let lastRaycastTime = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = renderer!.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      shaderUniforms.uMouse.value.set(pointer.x, pointer.y);
      targetGroupRotY = pointer.x * 0.22;
      targetGroupRotX = -pointer.y * 0.14;

      // Throttle raycasting to ~20Hz (every 50ms) so mousemove never blocks main thread
      const now = performance.now();
      if (now - lastRaycastTime < 50) return;
      lastRaycastTime = now;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(cardMeshes, false);
      if (intersects.length > 0) {
        const hitIdx = intersects[0]!.object.userData.cardIdx as number;
        if (hoveredIdx !== hitIdx) {
          hoveredIdx = hitIdx;
          soundManager.playCardSlide();
        }
        renderer!.domElement.style.cursor = 'pointer';
      } else {
        hoveredIdx = null;
        renderer!.domElement.style.cursor = 'grab';
      }
    };

    const handlePointerLeave = () => {
      hoveredIdx = null;
      targetGroupRotX = 0;
      targetGroupRotY = 0;
      shaderUniforms.uMouse.value.set(0, 0);
    };

    const handleClick = (e: MouseEvent) => {
      const rect = renderer!.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(cardMeshes, false);
      if (intersects.length > 0) {
        const clickedIdx = intersects[0]!.object.userData.cardIdx as number;
        soundManager.playCardFlip();
        onSelectCardRef.current(clickedIdx);
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    });
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave, {
      passive: true,
    });
    renderer.domElement.addEventListener('click', handleClick);

    // Pause rendering automatically when HeroTarotDeck3D is scrolled out of viewport
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
      const newW = container.clientWidth || 380;
      const newH = container.clientHeight || 280;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
      composer?.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    let rafId: number | null = null;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (
        isPausedRef.current ||
        !isInViewport ||
        (typeof document !== 'undefined' && document.hidden)
      ) {
        return;
      }

      const elapsed = clock.getElapsedTime();
      const sProg = scrollStateRef
        ? scrollStateRef.current.progress
        : scrollProgressRef.current;
      const sVel = scrollStateRef
        ? scrollStateRef.current.velocity
        : scrollVelocityRef.current;

      shaderUniforms.uTime.value = elapsed;
      shaderUniforms.uScrollProgress.value = sProg;
      shaderUniforms.uVelocity.value = sVel;

      if (chromaticPass?.uniforms?.uChromaticIntensity) {
        chromaticPass.uniforms.uChromaticIntensity.value =
          0.002 + Math.min(Math.abs(sVel) * 0.001, 0.006);
      }

      const targetCamZ = 3.15 - Math.sin(sProg * Math.PI) * 0.45;
      camera.position.z += (targetCamZ - camera.position.z) * 0.08;

      haloRing.rotation.z = elapsed * 0.15 + sProg * Math.PI;

      if (totemGroupRef.current) {
        totemGroupRef.current.rotation.y = elapsed * 0.7 + sProg * 2.0;
        totemGroupRef.current.position.y =
          0.92 + Math.sin(elapsed * 1.8) * 0.035;
      }

      // Update InstancedMesh 64 Golden Crystals
      for (let i = 0; i < crystalCount; i++) {
        const seed = crystalSeeds[i]!;
        const currentAngle =
          seed.angle + elapsed * seed.speed * 0.32 + sProg * 2.5;
        const radiusExpansion =
          seed.radius * (1 + Math.sin(sProg * Math.PI) * 0.25);

        dummyObj.position.set(
          Math.cos(currentAngle) * radiusExpansion,
          seed.yOffset + Math.sin(elapsed * seed.speed + i) * 0.1,
          Math.sin(currentAngle) * radiusExpansion * 0.5 - 0.3
        );
        dummyObj.rotation.set(elapsed * seed.speed, elapsed * 0.6, currentAngle);
        dummyObj.scale.setScalar(seed.scale);
        dummyObj.updateMatrix();
        instancedCrystals.setMatrixAt(i, dummyObj.matrix);
      }
      instancedCrystals.instanceMatrix.needsUpdate = true;

      deckGroup.rotation.x += (targetGroupRotX - deckGroup.rotation.x) * 0.08;
      deckGroup.rotation.y +=
        (targetGroupRotY +
          Math.sin(sProg * Math.PI * 2) * 0.18 -
          deckGroup.rotation.y) *
        0.08;

      for (let idx = 0; idx < cardMeshes.length; idx++) {
        const mesh = cardMeshes[idx]!;
        const base = baseTransforms[idx]!;
        const isSelected = activeIdxRef.current === idx;
        const isHovered = hoveredIdx === idx;
        const floatY = Math.sin(elapsed * 1.6 + idx * 1.1) * 0.028;
        const vortexSpread = Math.sin(sProg * Math.PI) * 0.18 * (idx - 2);

        const targetX = isSelected ? 0 : base.x + vortexSpread;
        const targetY = isSelected
          ? 0.08
          : isHovered
          ? base.y + 0.16 + floatY
          : base.y + floatY;
        const targetZ = isSelected
          ? 0.65
          : isHovered
          ? base.z + 0.22
          : base.z;
        const targetRotZ = isSelected ? 0 : base.rotZ;
        const targetRotY = isSelected ? 0 : base.rotY;
        const targetScale = isSelected ? 1.22 : isHovered ? 1.09 : 1.0;

        mesh.position.x += (targetX - mesh.position.x) * 0.14;
        mesh.position.y += (targetY - mesh.position.y) * 0.14;
        mesh.position.z += (targetZ - mesh.position.z) * 0.14;
        mesh.rotation.z += (targetRotZ - mesh.rotation.z) * 0.14;
        mesh.rotation.y += (targetRotY - mesh.rotation.y) * 0.14;

        const nextScale = mesh.scale.x + (targetScale - mesh.scale.x) * 0.14;
        mesh.scale.setScalar(nextScale);
      }

      if (composer) {
        composer.render();
      } else {
        renderer?.render(scene, camera);
      }
    };

    animate();

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer?.disconnect();
      window.removeEventListener('resize', handleResize);
      renderer?.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer?.domElement.removeEventListener(
        'pointerleave',
        handlePointerLeave
      );
      renderer?.domElement.removeEventListener('click', handleClick);
      detachContextGuard();
      composer?.dispose();
      sceneRef.current = null;
      disposeThreeScene(scene, renderer);
    };
  }, [enablePostProcessing, scrollStateRef]);

  const currentPalette = getReaderAtmospherePalette(readerIdState);

  return (
    <div className="relative w-full">
      {/* 4 Reader Altar Totem Switcher Pill Bar */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2 z-20 relative">
        {(
          [
            { id: 'ba_ngoai', label: '🏮 Bà Ngoại' },
            { id: 'chi_dai', label: '🍷 Chị Đại' },
            { id: 'ban_than', label: '✨ Bạn Thân' },
            { id: 'thay_cu_meo', label: '🦉 Thầy Cú Mèo' },
          ] as const
        ).map((item) => {
          const active = readerIdState === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-cursor="ĐỔI KHÍ QUYỂN"
              onClick={(e) => {
                e.stopPropagation();
                soundManager.playCardSlide();
                setReaderIdState(item.id);
              }}
              className={`px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer border ${
                active
                  ? 'bg-[#1D1829] text-[#F8F5F0] border-[#C9A24A] shadow-[0_0_14px_rgba(201,162,74,0.35)]'
                  : 'bg-[#09080D]/80 text-[#9E96B0] border-white/10 hover:text-[#F8F5F0]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* 3D WebGL Canvas Mount */}
      <div
        ref={mountRef}
        data-cursor="CHẠM LÁ BÀI 3D"
        aria-label="Không gian bộ bài Tarot 3D tương tác với GLSL Shaders"
        className="w-full h-64 sm:h-72 lg:h-80 relative mx-auto select-none"
      />

      {/* Totem Caption */}
      <div className="text-[10px] text-center text-[#9E96B0] -mt-1">
        Bảo vật 3D PBR:{' '}
        <span
          className="font-semibold"
          style={{ color: currentPalette.primaryHex }}
        >
          {currentPalette.totemName}
        </span>{' '}
        • Chạm vào lá bài 3D để soi thông điệp
      </div>
    </div>
  );
}
