'use client';

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { gsap } from 'gsap';
import * as THREE from 'three';
import {
  detectHardwareTier,
  disposeThreeScene,
  attachWebGLContextLostGuard,
} from '@/lib/three/core';
import {
  ASTRAL_VORTEX_VERTEX_SHADER,
  ASTRAL_VORTEX_FRAGMENT_SHADER,
} from '@/lib/three/shaders';
import { CustomCursorFollower } from '@/components/CustomCursorFollower';
import { soundManager } from '@/lib/sound-effects';
import { useReadingStore } from '@/lib/reading-store';
import { classifyAgeTier, scanCrisisAndInjection } from '@/lib/safety';
import { CURRENT_REFERENCE_YEAR, type TopicId, type ReaderId } from '@/lib/schemas';
import { READERS } from '@/data/tarot-cards';
import {
  ArrowRight,
  ArrowLeft,
  Lock,
  Feather,
  Heart,
  X,
  Sparkles,
  HelpCircle,
  Shuffle,
  Activity,
  ShieldCheck,
  Check,
} from 'lucide-react';

const SAMPLE_QUESTIONS_BY_TOPIC: Record<TopicId, string[]> = {
  love: [
    'Người ấy im lặng 3 ngày nay là đang bận thật hay đang âm thầm ghost mình vậy?',
    'Mối quan hệ mập mờ hiện tại có cơ hội tiến tới chính thức trong tháng tới không?',
    'Mình nên chủ động nhắn tin trước hay lùi lại giữ giá để xem thái độ người ta?',
  ],
  career: [
    'Mình đang phân vân giữa việc nhảy việc sang môi trường mới hay ở lại chờ cơ hội?',
    'Dự án sắp tới của mình đang gặp điểm nghẽn gì cần tháo gỡ ngay?',
    'Làm sao để thoát khỏi cảm giác trì hoãn và mất động lực mỗi sáng thức dậy?',
  ],
  finance: [
    'Tình hình tài chính tháng này của mình cần lưu ý lỗ hổng chi tiêu nào nhất?',
    'Sắp tới mình có cơ hội tăng thu nhập hay công việc làm thêm nào khả quan không?',
    'Thói quen nào đang âm thầm cản trở vận may tiền bạc của mình lúc này?',
  ],
  crush_school: [
    'Bạn ngồi bàn bên dạo này hay nhìn mình cười, không biết bạn ấy nghĩ gì về mình nhỉ?',
    'Làm sao để tụi mình trong nhóm bạn thân hiểu nhau hơn và không còn giận dỗi vu vơ?',
    'Mình muốn bắt chuyện làm quen với crush cùng khối thì nên mở lời thế nào?',
  ],
  study: [
    'Kỳ thi học kỳ sắp tới mình nên tập trung ôn luyện thế nào để đạt điểm cao nhất?',
    'Mình hay bị mất tập trung khi ngồi vào bàn học, có bí kíp nào giúp mình bứt phá không?',
    'Môn học mình đang lo lắng nhất sẽ có chuyển biến tích cực nếu mình đổi cách học chứ?',
  ],
  daily_luck: [
    'Tuần mới của mình trên trường sẽ có niềm vui hay điều bất ngờ dễ thương nào?',
    'Năng lượng may mắn hôm nay nhắn nhủ mình nên làm một việc tốt gì để cả ngày rực rỡ?',
    'Hôm nay mình cần giữ tinh thần thế nào để thu hút toàn chuyện vui vẻ?',
  ],
};

const READER_QUESTION_PROMPTS: Record<ReaderId, string> = {
  ba_ngoai:
    'Kể bà nghe... không cần hay, cứ thật là được. Điều gì đang làm con trĩu lòng?',
  chi_dai:
    'Nói thẳng vào vấn đề, đang khúc mắc chuyện gì? Viết thật rõ để Chị Đại chỉ điểm!',
  ban_than:
    'Bắn hết nỗi niềm ra đây, dài ngắn gì tao cũng đọc. Đang lấn cấn chuyện gì nói nghe coi?',
  thay_cu_meo:
    'Ghi lại chi tiết bối cảnh, câu hỏi hoặc quyết định khó khăn bạn đang đối mặt để cùng phân tích.',
  ba_co_mo_hon:
    'Ghi chi tiết câu chuyện vào đây, càng thật thà thì Bà Cố mổ xẻ càng chuẩn, đừng giấu bài!',
  tien_tu_chua_lanh:
    'Trút hết những điều đang đè nặng trong lòng bạn vào đây nhé, vũ trụ luôn lắng nghe bạn...',
  tong_tai_ly_tri:
    'Liệt kê tình huống, rào cản hoặc bài toán bạn đang cần tối ưu hóa vào đây để lên chiến lược.',
  phap_su_toi_co:
    'Truyền năng lượng và phong ấn câu hỏi của bạn vào cõi vô thức trước khi rút bài...',
};

const TOPIC_LABELS: Record<TopicId, string> = {
  love: 'Tình duyên & Mập mờ',
  career: 'Học tập & Sự nghiệp',
  finance: 'Tài chính & Tiền tài',
  crush_school: 'Tình bạn & Crush học đường',
  study: 'Học tập & Thi cử',
  daily_luck: 'Vận may ngày mới',
};

export default function NoiNiemPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const {
    selectedReaderId,
    readerAccentColor,
    hasFilledProfile,
    nickname,
    birthYear,
    selectedTopic,
    questionText,
    hideQuestionOnShare,
    setContextForm,
  } = useReadingStore();

  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Route guard: Nếu chưa điền thông tin hoặc chưa chọn chủ đề thì chuyển về bước còn thiếu
  useEffect(() => {
    if (!isHydrated) return;
    const hasProfile = hasFilledProfile && Boolean(nickname?.trim()) && Boolean(birthYear);
    if (!hasProfile) {
      router.replace('/reading/ve-ban');
      return;
    }
    if (!selectedTopic) {
      router.replace('/reading/chu-de');
      return;
    }
  }, [isHydrated, hasFilledProfile, nickname, birthYear, selectedTopic, router]);

  const activeReader = READERS.find((r) => r.id === selectedReaderId) || READERS[0]!;

  const agePolicy = useMemo(
    () => classifyAgeTier(birthYear, CURRENT_REFERENCE_YEAR, selectedReaderId),
    [birthYear, selectedReaderId]
  );

  const [isFocusedTextarea, setIsFocusedTextarea] = useState(false);
  const [usedSampleIdx, setUsedSampleIdx] = useState<number | null>(null);
  const [sampleShuffleOffset, setSampleShuffleOffset] = useState(0);

  // Refs for 3D Stage & Direct DOM Tilt
  const webglMountRef = useRef<HTMLDivElement | null>(null);
  const altarBoxRef = useRef<HTMLDivElement | null>(null);
  const foilGlareRef = useRef<HTMLDivElement | null>(null);
  const pointerBridgeRef = useRef({ x: 0, y: 0 });
  const idleRafRef = useRef<number | null>(null);

  // Single-Instance Three.js Cosmic Astral Vortex Stage (60 FPS, 48 InstancedMesh Crystals)
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

    const w = container.clientWidth || window.innerWidth || 800;
    const h = container.clientHeight || window.innerHeight || 900;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setSize(w, h);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const detachContextGuard = attachWebGLContextLostGuard(
      renderer.domElement,
      () => {}
    );

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 20);
    camera.position.set(0, 0, 4.2);

    // GLSL Astral Vortex Plane
    const vortexGeom = new THREE.PlaneGeometry(6.4, 6.4, 28, 28);
    const vortexUniforms = {
      uTime: { value: 0 },
      uScrollProgress: { value: 0 },
      uVelocity: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uColorGold: { value: new THREE.Color(readerAccentColor) },
      uColorViolet: { value: new THREE.Color(0x38195a) },
      uColorRose: { value: new THREE.Color(0xd43f68) },
    };

    const vortexMat = new THREE.ShaderMaterial({
      vertexShader: ASTRAL_VORTEX_VERTEX_SHADER,
      fragmentShader: ASTRAL_VORTEX_FRAGMENT_SHADER,
      uniforms: vortexUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const vortexMesh = new THREE.Mesh(vortexGeom, vortexMat);
    vortexMesh.position.set(0, 0, -1.2);
    scene.add(vortexMesh);

    // 48 Floating Sacred Crystals (1 Single GPU Draw Call)
    const crystalCount = 48;
    const crystalGeom = new THREE.OctahedronGeometry(0.045, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8f5f0,
      emissive: new THREE.Color(readerAccentColor),
      emissiveIntensity: 0.55,
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
      angle: (i / crystalCount) * Math.PI * 2,
      radius: 1.1 + (i % 5) * 0.3,
      yOffset: (Math.random() - 0.5) * 3.0,
      speed: 0.25 + (i % 4) * 0.12,
      scale: 0.45 + (i % 3) * 0.3,
    }));
    scene.add(instancedCrystals);

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
      const newW = container.clientWidth || window.innerWidth;
      const newH = container.clientHeight || window.innerHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    let rafId: number | null = null;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isInViewport || (typeof document !== 'undefined' && document.hidden)) {
        return;
      }

      const elapsed = clock.getElapsedTime();
      const ptr = pointerBridgeRef.current;

      vortexUniforms.uTime.value = elapsed;
      vortexUniforms.uMouse.value.lerp(new THREE.Vector2(ptr.x, ptr.y), 0.08);

      for (let i = 0; i < crystalCount; i++) {
        const seed = crystalSeeds[i]!;
        const angle = seed.angle + elapsed * seed.speed * 0.35;
        dummyObj.position.set(
          Math.cos(angle) * seed.radius + ptr.x * 0.12,
          seed.yOffset + Math.sin(elapsed * seed.speed + i) * 0.12,
          Math.sin(angle) * seed.radius * 0.4 - 0.5
        );
        dummyObj.rotation.set(elapsed * seed.speed, elapsed * 0.45, angle);
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
      disposeThreeScene(scene, renderer);
    };
  }, [readerAccentColor, shouldReduceMotion]);

  // GSAP Kinetic Stagger Reveal on Mount
  useEffect(() => {
    if (shouldReduceMotion) return;
    gsap.fromTo(
      '[data-noi-niem-reveal]',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power3.out' }
    );
  }, [shouldReduceMotion]);

  // Autonomous Mobile Idle 3D Tilt on the Altar Box
  useEffect(() => {
    const isTouchDevice =
      typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;
    if (!isTouchDevice || shouldReduceMotion) return;

    const loop = () => {
      const now = Date.now();
      const rotX = Math.sin(now / 1600) * 3.2;
      const rotY = Math.cos(now / 1300) * 3.8;
      if (altarBoxRef.current && !isFocusedTextarea) {
        altarBoxRef.current.style.transform = `perspective(950px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
      }
      idleRafRef.current = requestAnimationFrame(loop);
    };
    idleRafRef.current = requestAnimationFrame(loop);

    return () => {
      if (idleRafRef.current !== null) cancelAnimationFrame(idleRafRef.current);
    };
  }, [isFocusedTextarea, shouldReduceMotion]);

  // Direct DOM 3D Tilt & Holographic Foil Glare on Pointer/Touch
  const handleAltarPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const box = altarBoxRef.current;
      if (!box || shouldReduceMotion) return;
      const rect = box.getBoundingClientRect();
      const normX = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
      const normY = Math.max(-1, Math.min(1, -((e.clientY - rect.top) / rect.height) * 2 + 1));
      pointerBridgeRef.current = { x: normX, y: normY };

      box.style.transform = `perspective(950px) rotateX(${(normY * 8).toFixed(2)}deg) rotateY(${(normX * 10).toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`;

      if (foilGlareRef.current) {
        const pctX = ((normX + 1) * 50).toFixed(1);
        const pctY = ((1 - normY) * 50).toFixed(1);
        foilGlareRef.current.style.opacity = '0.36';
        foilGlareRef.current.style.background = `radial-gradient(circle at ${pctX}% ${pctY}%, ${readerAccentColor}90 0%, transparent 65%)`;
      }
    },
    [readerAccentColor, shouldReduceMotion]
  );

  const handleAltarPointerLeave = useCallback(() => {
    if (altarBoxRef.current) altarBoxRef.current.style.transform = '';
    if (foilGlareRef.current) foilGlareRef.current.style.opacity = '0';
    pointerBridgeRef.current = { x: 0, y: 0 };
  }, []);

  const handleAltarTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      if (!touch) return;
      const box = altarBoxRef.current;
      if (!box || shouldReduceMotion) return;
      const rect = box.getBoundingClientRect();
      const normX = Math.max(-1, Math.min(1, ((touch.clientX - rect.left) / rect.width) * 2 - 1));
      const normY = Math.max(-1, Math.min(1, -((touch.clientY - rect.top) / rect.height) * 2 + 1));
      pointerBridgeRef.current = { x: normX, y: normY };

      box.style.transform = `perspective(950px) rotateX(${(normY * 8).toFixed(2)}deg) rotateY(${(normX * 10).toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`;

      if (foilGlareRef.current) {
        const pctX = ((normX + 1) * 50).toFixed(1);
        const pctY = ((1 - normY) * 50).toFixed(1);
        foilGlareRef.current.style.opacity = '0.36';
        foilGlareRef.current.style.background = `radial-gradient(circle at ${pctX}% ${pctY}%, ${readerAccentColor}90 0%, transparent 65%)`;
      }
    },
    [readerAccentColor, shouldReduceMotion]
  );

  // Tính toán Tần Số Năng Lượng Cảm Xúc (Emotional Resonance Hz)
  const emotionalResonance = useMemo(() => {
    const len = questionText.trim().length;
    if (len === 0) return { hz: 432, label: 'Tần số thanh tịnh sẵn sàng đón nhận' };
    if (len < 50) return { hz: 528, label: 'Tần số rung động chuyển hóa cảm xúc' };
    if (len < 120) return { hz: 639, label: 'Tần số kết nối & gỡ nút thắt tâm tư' };
    return { hz: 741, label: 'Tần số giải phóng & khai mở định mệnh' };
  }, [questionText]);

  // Crisis check
  const crisisCheck = useMemo(() => {
    if (!questionText.trim()) return null;
    return scanCrisisAndInjection(questionText);
  }, [questionText]);

  // Typewriter effect
  const readerPrompt =
    READER_QUESTION_PROMPTS[selectedReaderId] || READER_QUESTION_PROMPTS.ba_ngoai;
  const [displayedPrompt, setDisplayedPrompt] = useState('');
  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayedPrompt(readerPrompt);
      return;
    }
    setDisplayedPrompt('');
    let idx = 0;
    const timer = setInterval(() => {
      idx++;
      setDisplayedPrompt(readerPrompt.slice(0, idx));
      if (idx >= readerPrompt.length) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [readerPrompt, shouldReduceMotion]);

  const isQuestionEmpty = !questionText.trim();
  const isOverLimit = questionText.length > 300;

  const handleContinue = () => {
    if (isQuestionEmpty) return;
    router.push('/reading/bo-bai');
  };

  const handleSkip = () => {
    // Xóa nội dung ô để AI hiểu là đọc theo chủ đề tổng quan
    setContextForm({ questionText: '' });
    setUsedSampleIdx(null);
    router.push('/reading/bo-bai');
  };

  const topicSamples = SAMPLE_QUESTIONS_BY_TOPIC[selectedTopic] || [];

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={shouldReduceMotion ? {} : { opacity: 0, x: -16 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative max-w-xl mx-auto px-4 pt-4 sm:pt-6 pb-36 overflow-hidden"
    >
      {/* Single-Instance Three.js Cosmic Astral Vortex Stage (GLSL Shader + 48 InstancedMesh Crystals) */}
      <div
        ref={webglMountRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 w-full h-full z-0 opacity-75"
      />

      {/* 1. Avatar nhỏ Reader + Câu mở đầu theo giọng Reader */}
      <motion.div
        data-noi-niem-reveal
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-start gap-3.5 p-4 rounded-3xl bg-[#14121F]/90 border border-[#262235] mb-5 shadow-xl"
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 shadow-inner"
          style={{
            backgroundColor: `${readerAccentColor}25`,
            border: `1.5px solid ${readerAccentColor}60`,
            color: readerAccentColor,
          }}
        >
          {activeReader.avatar_symbol}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className="font-display text-sm font-bold text-[#F8F5F0] truncate">
                {agePolicy.effectivePersona === 'ba_ngoai_vui_tinh'
                  ? 'Bà Ngoại Vui Tính'
                  : activeReader.name}
              </h2>
              {agePolicy.isKidTeenSafeMode ? (
                <span className="text-[9px] font-semibold text-pink-300 bg-pink-500/15 border border-pink-500/30 px-1.5 py-0.5 rounded-full shrink-0">
                  Học đường 10–15t
                </span>
              ) : (
                <span className="text-[9px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-full shrink-0">
                  16+
                </span>
              )}
            </div>
            <Link
              href="/reading/chu-de"
              data-cursor="ĐỔI CHỦ ĐỀ"
              className="text-[11px] text-[#9E96B0] hover:text-[#E5C687] transition-colors truncate shrink-0"
            >
              Chủ đề: <strong>{TOPIC_LABELS[selectedTopic] || selectedTopic}</strong> &rarr;
            </Link>
          </div>
          <p className="text-xs text-[#E5C687] italic font-serif leading-relaxed min-h-[30px]">
            &ldquo;{displayedPrompt}&rdquo;
            {displayedPrompt.length < readerPrompt.length && (
              <span className="inline-block w-1.5 h-3 ml-0.5 bg-[#C9A24A] animate-pulse align-middle" />
            )}
          </p>
        </div>
      </motion.div>

      {/* 2. ĐÀI PHONG ẤN NỖI NIỀM 3D (Direct DOM Tilt + Holographic Foil Glare) */}
      <div
        ref={altarBoxRef}
        data-noi-niem-reveal
        onPointerMove={handleAltarPointerMove}
        onPointerLeave={handleAltarPointerLeave}
        onTouchMove={handleAltarTouchMove}
        className="relative z-10 p-4 sm:p-5 rounded-2xl border transition-all mb-3 bg-[#0B0A12]/92 shadow-2xl overflow-hidden will-change-transform select-none"
        style={{
          borderColor: isFocusedTextarea ? readerAccentColor : `${readerAccentColor}60`,
          boxShadow: isFocusedTextarea
            ? `0 0 35px ${readerAccentColor}40, 0 16px 40px rgba(0,0,0,0.85)`
            : `0 0 20px ${readerAccentColor}20, 0 12px 30px rgba(0,0,0,0.75)`,
        }}
      >
        {/* Lớp Kim Tuyến Phản Xạ Theo Chuột & Chạm (Holographic Foil Glare) */}
        <div
          ref={foilGlareRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-200"
        />

        <div className="relative z-30 flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold text-[#C9A24A] uppercase tracking-wider flex items-center gap-1.5">
            <Feather className="w-3.5 h-3.5 text-[#C9A24A]" />
            <span>Nỗi Niềm Phong Ấn Gửi Vũ Trụ</span>
          </label>

          <div className="flex items-center gap-2">
            {questionText && (
              <button
                type="button"
                data-cursor="XÓA"
                onClick={() => {
                  setContextForm({ questionText: '' });
                  setUsedSampleIdx(null);
                }}
                className="text-[11px] text-[#9E96B0] hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                title="Xóa nhanh nội dung ô"
              >
                <X className="w-3 h-3" />
                <span>Xóa ô</span>
              </button>
            )}
            <span
              className={`text-[11px] font-mono ${
                isOverLimit
                  ? 'text-rose-400 font-bold'
                  : questionText.length > 250
                  ? 'text-amber-400'
                  : 'text-[#9E96B0]'
              }`}
            >
              {questionText.length}/300
            </span>
          </div>
        </div>

        <textarea
          value={questionText}
          data-cursor="GÕ NỖI NIỀM"
          onFocus={(e) => {
            setIsFocusedTextarea(true);
            setTimeout(() => {
              e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
          }}
          onBlur={() => setIsFocusedTextarea(false)}
          onChange={(e) => {
            if (e.target.value.length <= 300) {
              setContextForm({ questionText: e.target.value });
            }
          }}
          placeholder="Kể chi tiết câu chuyện, tình huống mập mờ, phân vân hay bế tắc bạn đang gặp phải..."
          maxLength={300}
          rows={5}
          className="relative z-30 w-full bg-transparent text-sm text-[#F8F5F0] placeholder-[#5E5873] focus:outline-none resize-none leading-relaxed"
        />

        {/* Thanh Đo Tần Số Cảm Xúc (Emotional Resonance Meter) */}
        <div className="relative z-30 mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px]">
          <span className="flex items-center gap-1.5 text-[#9E96B0]">
            <Activity className="w-3 h-3 text-[#C9A24A]" />
            <span>Tần số năng lượng:</span>
            <strong style={{ color: readerAccentColor }}>{emotionalResonance.hz} Hz</strong>
          </span>
          <span className="text-[#C9A24A]/90 italic truncate max-w-[240px]">
            {emotionalResonance.label}
          </span>
        </div>
      </div>

      {/* 3. Công tắc "Ẩn câu hỏi khi chia sẻ ảnh Story" đặt NGAY DƯỚI ô nhập */}
      <div
        data-noi-niem-reveal
        className="relative z-10 flex items-center justify-between p-3.5 rounded-xl bg-[#0B0A12]/80 border border-[#262235] mb-5"
      >
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-[#F8F5F0]">
              Ẩn câu hỏi khi chia sẻ ảnh Story
            </p>
            <p className="text-[10px] text-[#9E96B0]">
              Bảo mật tuyệt đối nỗi niềm riêng tư
            </p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={hideQuestionOnShare}
          onChange={(e) =>
            setContextForm({ hideQuestionOnShare: e.target.checked })
          }
          className="w-4 h-4 rounded cursor-pointer accent-[#C9A24A]"
        />
      </div>

      {/* 4. Gợi ý câu hỏi nhanh LỌC THEO CHỦ ĐỀ dạng chip (Kèm nút Shuffle đổi gợi ý) */}
      <div data-noi-niem-reveal className="relative z-10 mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A24A]" />
            <p className="text-[11px] font-semibold text-[#9E96B0] uppercase tracking-wider">
              Gợi ý câu hỏi ({TOPIC_LABELS[selectedTopic] || selectedTopic}):
            </p>
          </div>

          <button
            type="button"
            data-cursor="ĐỔI GỢI Ý"
            onClick={() => {
              soundManager.playMagneticHover();
              setSampleShuffleOffset((prev) => (prev + 1) % Math.max(1, topicSamples.length));
            }}
            className="text-[10px] text-[#C9A24A] hover:text-[#F8F5F0] flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#14121F] border border-[#262235] transition-colors cursor-pointer"
          >
            <Shuffle className="w-2.5 h-2.5" />
            <span>Đổi gợi ý</span>
          </button>
        </div>

        <div className="space-y-2">
          {topicSamples.map((sample, idx) => {
            const displayIdx = (idx + sampleShuffleOffset) % topicSamples.length;
            const currentSample = topicSamples[displayIdx] || sample;
            const isUsed = usedSampleIdx === displayIdx || questionText === currentSample;

            return (
              <button
                key={`${displayIdx}-${currentSample}`}
                type="button"
                data-cursor="CHỌN GỢI Ý"
                onClick={() => {
                  soundManager.playMagneticHover();
                  setContextForm({ questionText: currentSample });
                  setUsedSampleIdx(displayIdx);
                }}
                className={`w-full text-left text-xs p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  isUsed
                    ? 'bg-[#181429] text-[#F8F5F0] ring-1'
                    : 'bg-[#14121F]/80 text-[#9E96B0] hover:text-[#E5C687] hover:bg-[#181429]/60 border-[#262235]'
                }`}
                style={{
                  borderColor: isUsed ? readerAccentColor : '#262235',
                  boxShadow: isUsed
                    ? `0 0 12px ${readerAccentColor}25`
                    : undefined,
                }}
              >
                <span className="flex-1 min-w-0 italic font-serif">
                  &ldquo;{currentSample}&rdquo;
                </span>

                {isUsed && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: readerAccentColor }}
                    title="Đã điền vào ô"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cảnh báo hỗ trợ an toàn nếu phát hiện nội dung khủng hoảng */}
      {crisisCheck && crisisCheck.safetyFlag === 'crisis' && (
        <div className="relative z-10 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-xs text-amber-200 mb-6 space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <Heart className="w-4 h-4 text-rose-400" />
            <span>Vũ Trụ luôn ở bên bạn</span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#E5C687]">
            Nếu bạn đang trải qua cảm xúc quá nặng nề, đừng ngần ngại gọi đến
            Tổng đài Quốc gia <strong>111</strong> hoặc Đường dây Ngày Mai{' '}
            <strong>096 306 1414</strong> (miễn phí) để được lắng nghe và vỗ về
            nhé.
          </p>
        </div>
      )}

      {/* 5. THANH ĐÁY CỐ ĐỊNH (Tối ưu GPU 60 FPS) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0E0D17]/95 border-t border-[#262235] p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-xl mx-auto flex flex-col gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Nút phụ: Đổi chủ đề */}
            <button
              type="button"
              data-cursor="QUAY LẠI"
              onClick={() => router.push('/reading/chu-de')}
              className="py-3.5 px-4 rounded-2xl bg-[#14121F] hover:bg-[#1D192C] border border-[#262235] text-[#9E96B0] font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Đổi chủ đề</span>
            </button>

            {/* Nút chính: Tiếp tục sang màn Bộ bài */}
            <button
              type="button"
              data-cursor={isQuestionEmpty ? 'CHƯA NHẬP' : 'CHỌN BỘ BÀI'}
              onClick={handleContinue}
              disabled={isQuestionEmpty}
              className={`flex-1 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg whitespace-nowrap ${
                isQuestionEmpty
                  ? 'opacity-40 bg-[#1D192C] text-[#9E96B0] border border-[#262235] cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#C9A24A] to-[#C49A4D] hover:from-[#E5C687] hover:to-[#C9A24A] text-[#0B0A12] shadow-[0_4px_25px_rgba(217,179,106,0.35)] transform active:scale-98'
              }`}
            >
              <span>Tiếp tục chọn Bộ bài</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* CHỈ GIỮ DUY NHẤT 1 CHỖ BỎ QUA Ở ĐÂY */}
          <div className="text-center pt-0.5">
            <button
              type="button"
              data-cursor="BỎ QUA"
              onClick={handleSkip}
              className="text-[11px] text-[#9E96B0] hover:text-[#E5C687] underline cursor-pointer transition-colors"
            >
              Bạn chưa muốn viết? Bấm để <strong>Bỏ qua & AI đọc theo chủ đề</strong> &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* CustomCursorFollower */}
      <CustomCursorFollower />
    </motion.div>
  );
}
