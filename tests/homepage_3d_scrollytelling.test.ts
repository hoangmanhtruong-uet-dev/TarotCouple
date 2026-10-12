import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  ASTRAL_VORTEX_VERTEX_SHADER,
  ASTRAL_VORTEX_FRAGMENT_SHADER,
  CHROMATIC_VIGNETTE_SHADER,
  PERSONA_AURA_VERTEX_SHADER,
  PERSONA_AURA_FRAGMENT_SHADER,
  createProceduralSanctuaryEnvMap,
} from '@/lib/three/shaders';
import { soundManager } from '@/lib/sound-effects';

const ROOT_DIR = process.cwd();

describe('Homepage 3D Scrollytelling, GLSL Shaders, Post-Processing & Audio Suite', () => {
  it('1. verifies 3 static sections (Bốn Reader Đồng Hành, Cách Hoạt Động, Câu Hỏi Thường Gặp) are completely removed from Homepage', () => {
    const pageContent = fs.readFileSync(
      path.join(ROOT_DIR, 'src/app/(marketing)/page.tsx'),
      'utf-8'
    );

    expect(pageContent).not.toContain('Bốn Reader Đồng Hành');
    expect(pageContent).not.toContain('Cách Hoạt Động');
    expect(pageContent).not.toContain('Câu Hỏi Thường Gặp');
  });

  it('2. verifies Homepage integrates GSAP ScrollTrigger, Lenis Smooth Scroll, CustomCursorFollower, and RitualPreloader', () => {
    const pageContent = fs.readFileSync(
      path.join(ROOT_DIR, 'src/app/(marketing)/page.tsx'),
      'utf-8'
    );

    expect(pageContent).toContain('gsap');
    expect(pageContent).toContain('ScrollTrigger');
    expect(pageContent).toContain('Lenis');
    expect(pageContent).toContain('CustomCursorFollower');
    expect(pageContent).toContain('RitualPreloader');
  });

  it('3. verifies Custom GLSL Vertex/Fragment Shaders and Chromatic Aberration + Vignette Post-Processing Shader exist', () => {
    expect(ASTRAL_VORTEX_VERTEX_SHADER).toContain('uScrollProgress');
    expect(ASTRAL_VORTEX_VERTEX_SHADER).toContain('uMouse');
    expect(ASTRAL_VORTEX_FRAGMENT_SHADER).toContain('gl_FragColor');
    expect(PERSONA_AURA_VERTEX_SHADER).toContain('uPersonaIndex');
    expect(PERSONA_AURA_FRAGMENT_SHADER).toContain('uAccentColor');
    expect(CHROMATIC_VIGNETTE_SHADER.uniforms.uChromaticIntensity.value).toBeGreaterThan(0);
    expect(typeof createProceduralSanctuaryEnvMap).toBe('function');
  });

  it('4. verifies HeroTarotDeck3D uses PBR MeshPhysicalMaterial, THREE.InstancedMesh, and Post-Processing EffectComposer + UnrealBloomPass', () => {
    const heroDeckContent = fs.readFileSync(
      path.join(ROOT_DIR, 'src/components/HeroTarotDeck3D.tsx'),
      'utf-8'
    );

    expect(heroDeckContent).toContain('MeshPhysicalMaterial');
    expect(heroDeckContent).toContain('InstancedMesh');
    expect(heroDeckContent).toContain('EffectComposer');
    expect(heroDeckContent).toContain('UnrealBloomPass');
    expect(heroDeckContent).toContain('CHROMATIC_VIGNETTE_SHADER');
  });

  it('5. verifies Spatial & Micro-Audio methods on soundManager execute safely in SSR/test environment', () => {
    expect(typeof soundManager.playMagneticHover).toBe('function');
    expect(typeof soundManager.playScrollHarmonic).toBe('function');
    expect(typeof soundManager.toggleAmbientDrone).toBe('function');
    expect(typeof soundManager.playReaderPersonaChord).toBe('function');

    expect(() => soundManager.playMagneticHover()).not.toThrow();
    expect(() => soundManager.playScrollHarmonic(4.2)).not.toThrow();
    expect(() => soundManager.toggleAmbientDrone(false)).not.toThrow();
    expect(() => soundManager.playReaderPersonaChord('ba_ngoai')).not.toThrow();
    expect(() => soundManager.playReaderPersonaChord('chi_dai')).not.toThrow();
    expect(() => soundManager.playReaderPersonaChord('ban_than')).not.toThrow();
    expect(() => soundManager.playReaderPersonaChord('thay_cu_meo')).not.toThrow();
  });

  it('6. verifies ReaderIntroModal (4 Reader UI Cards) integrates Single-Instance Three.js Stage, GLSL Persona Aura Shader, InstancedMesh, GSAP Kinetic Reveal, and Zero backdrop-blur lag', () => {
    const modalContent = fs.readFileSync(
      path.join(ROOT_DIR, 'src/components/ReaderIntroModal.tsx'),
      'utf-8'
    );

    expect(modalContent).toContain('PERSONA_AURA_VERTEX_SHADER');
    expect(modalContent).toContain('PERSONA_AURA_FRAGMENT_SHADER');
    expect(modalContent).toContain('InstancedMesh');
    expect(modalContent).toContain('createReaderAltarTotemGroup');
    expect(modalContent).toContain('gsap.fromTo');
    expect(modalContent).toContain('playReaderPersonaChord');
    expect(modalContent).toContain('data-cursor=');
    expect(modalContent).not.toContain('backdrop-blur');
  });

  it('7. verifies attachWebGLContextLostGuard safely handles both HTMLCanvasElement and THREE.WebGLRenderer without throwing canvas.addEventListener error', async () => {
    const { attachWebGLContextLostGuard } = await import('@/lib/three/core');

    // Should not throw when passed null/undefined or an object without addEventListener
    expect(() => attachWebGLContextLostGuard(null)).not.toThrow();
    expect(() => attachWebGLContextLostGuard(undefined)).not.toThrow();

    const listeners: Record<string, EventListener> = {};
    const mockCanvas = {
      addEventListener: (type: string, fn: EventListener) => {
        listeners[type] = fn;
      },
      removeEventListener: (type: string) => {
        delete listeners[type];
      },
    } as unknown as HTMLCanvasElement;

    // Passing a mock WebGLRenderer object with domElement
    const detach = attachWebGLContextLostGuard({
      domElement: mockCanvas,
    } as unknown as import('three').WebGLRenderer);

    expect(typeof listeners.webglcontextlost).toBe('function');
    detach();
    expect(listeners.webglcontextlost).toBeUndefined();
  });

  it('8. verifies ReaderProfileView (4 Step-1 Reader Selection Pages) integrates Single-Instance Three.js Stage, Lenis, GSAP, Mood Matcher, Sample Reading Flip, and 0ms history.replaceState', () => {
    const profileContent = fs.readFileSync(
      path.join(ROOT_DIR, 'src/components/ReaderProfileView.tsx'),
      'utf-8'
    );

    expect(profileContent).toContain('PERSONA_AURA_VERTEX_SHADER');
    expect(profileContent).toContain('PERSONA_AURA_FRAGMENT_SHADER');
    expect(profileContent).toContain('InstancedMesh');
    expect(profileContent).toContain('createReaderAltarTotemGroup');
    expect(profileContent).toContain('Lenis');
    expect(profileContent).toContain('gsap.fromTo');
    expect(profileContent).toContain('CustomCursorFollower');
    expect(profileContent).toContain('sample_reading_snippet');
    expect(profileContent).toContain('window.history.replaceState');
    expect(profileContent).not.toContain('backdrop-blur');
  });
});



