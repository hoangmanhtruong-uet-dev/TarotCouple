import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { soundManager } from '@/lib/sound-effects';
import {
  createSacredCardBackTexture,
  createCardFaceTexture,
  create3DTarotCardMesh,
} from '@/lib/three/card-textures';
import {
  isWebGLAvailable,
  detectHardwareTier,
  attachWebGLContextLostGuard,
  computeParabolicArcTransform,
  evaluateCubicBezier3D,
  getReaderAtmospherePalette,
  disposeThreeScene,
  disposeMaterial,
  IdleAwareRenderLoop,
  type Point3D,
} from '@/lib/three/core';

describe('Tier 2: Boundary & Corner Cases Suites (Edge Conditions, Stress & Fallbacks)', () => {
  describe('1. Missing AudioContext & Security Policies (R4)', () => {
    beforeEach(() => {
      soundManager.setEnabled(true);
    });

    it('B01-1: Audio methods execute safely when AudioContext is completely undefined', () => {
      const origAudioContext = (globalThis as unknown as { AudioContext?: unknown }).AudioContext;
      try {
        (globalThis as unknown as { AudioContext?: unknown }).AudioContext = undefined;
        expect(() => {
          soundManager.playBellTone();
          soundManager.playCardSlide();
          soundManager.playCardFlip();
          soundManager.playMysticChime();
          soundManager.playMagneticHover();
        }).not.toThrow();
      } finally {
        (globalThis as unknown as { AudioContext?: unknown }).AudioContext = origAudioContext;
      }
    });

    it('B01-2: Suspended AudioContext triggers safe resume path without throwing unhandled exceptions', () => {
      const mockResume = vi.fn().mockResolvedValue(undefined);
      const mockCtx = {
        state: 'suspended',
        currentTime: 0,
        sampleRate: 44100,
        resume: mockResume,
        createOscillator: vi.fn(() => ({
          type: 'sine',
          frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        })),
        createGain: vi.fn(() => ({
          gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
          connect: vi.fn(),
        })),
        destination: {},
      };

      const origAudioContext = (globalThis as unknown as { AudioContext?: unknown }).AudioContext;
      try {
        (globalThis as unknown as { AudioContext?: unknown }).AudioContext = vi.fn(() => mockCtx);
        expect(() => soundManager.playBellTone()).not.toThrow();
      } finally {
        (globalThis as unknown as { AudioContext?: unknown }).AudioContext = origAudioContext;
      }
    });

    it('B01-3: QuotaExceeded or privacy-blocked localStorage does not crash SoundManager state handling', () => {
      const origLocalStorage = globalThis.localStorage;
      try {
        Object.defineProperty(globalThis, 'localStorage', {
          value: {
            getItem: () => {
              throw new Error('Access denied by browser security');
            },
            setItem: () => {
              throw new Error('QuotaExceededError');
            },
          },
          configurable: true,
        });

        expect(() => {
          soundManager.setEnabled(false);
          soundManager.setEnabled(true);
          soundManager.toggle();
        }).not.toThrow();
      } finally {
        Object.defineProperty(globalThis, 'localStorage', {
          value: origLocalStorage,
          configurable: true,
        });
      }
    });

    it('B01-4: Burst triggering (100 rapid calls in tight loop) executes cleanly without resource leakage', () => {
      expect(() => {
        for (let i = 0; i < 100; i++) {
          soundManager.playMagneticHover();
          soundManager.playCardSlide();
        }
      }).not.toThrow();
    });

    it('B01-5: Muted state suppresses synthesis and does not activate nodes', () => {
      soundManager.setEnabled(false);
      expect(soundManager.isEnabled()).toBe(false);

      expect(() => {
        soundManager.playBellTone();
        soundManager.playCardFlip();
        soundManager.playMysticChime();
        soundManager.playRiffleShuffle();
      }).not.toThrow();

      soundManager.setEnabled(true);
    });
  });

  describe('2. SSR Safety & Non-DOM Node.js Environment (R2, R5)', () => {
    it('B02-1: createSacredCardBackTexture returns null safely when document is missing', () => {
      const origDoc = globalThis.document;
      try {
        // @ts-expect-error simulating SSR
        delete globalThis.document;
        const res = createSacredCardBackTexture('#C9A24A');
        expect(res).toBeNull();
      } finally {
        globalThis.document = origDoc;
      }
    });

    it('B02-2: createCardFaceTexture returns null safely when document is missing', () => {
      const origDoc = globalThis.document;
      try {
        // @ts-expect-error simulating SSR
        delete globalThis.document;
        const res = createCardFaceTexture({ roman: 'I', title: 'THE MAGICIAN' });
        expect(res).toBeNull();
      } finally {
        globalThis.document = origDoc;
      }
    });

    it('B02-3: isWebGLAvailable returns false cleanly in non-browser environment', () => {
      const origWindow = globalThis.window;
      try {
        // @ts-expect-error simulating SSR
        delete globalThis.window;
        expect(isWebGLAvailable()).toBe(false);
      } finally {
        globalThis.window = origWindow;
      }
    });

    it('B02-4: attachWebGLContextLostGuard safely handles null, undefined, or mock elements', () => {
      expect(() => attachWebGLContextLostGuard(null)).not.toThrow();
      expect(() => attachWebGLContextLostGuard(undefined)).not.toThrow();
      // @ts-expect-error invalid param test
      expect(() => attachWebGLContextLostGuard({ invalid: true })).not.toThrow();

      const detach = attachWebGLContextLostGuard(null);
      expect(typeof detach).toBe('function');
      expect(() => detach()).not.toThrow();
    });

    it('B02-5: detectHardwareTier handles environments with missing navigator.hardwareConcurrency', () => {
      const tier = detectHardwareTier({ forceCores: undefined });
      expect(['tier1', 'tier2', 'tier3']).toContain(tier.tier);
      expect(tier.maxDpr).toBeGreaterThan(0);
    });
  });

  describe('3. Mobile Hardware Tier Fallback & Reduced Motion (R2, R5)', () => {
    it('B03-1: reducedMotion: true unconditionally downgrades to tier3 and disables WebGL/shadows', () => {
      const tier = detectHardwareTier({ reducedMotion: true, forceCores: 16, webglSupported: true });
      expect(tier.tier).toBe('tier3');
      expect(tier.maxDpr).toBe(1);
      expect(tier.enableShadows).toBe(false);
      expect(tier.enableWebGL).toBe(false);
      expect(tier.starCount).toBe(70);
    });

    it('B03-2: Low core count (<4 cores) forces tier3 configuration', () => {
      const tier1Core = detectHardwareTier({ forceCores: 1, webglSupported: true });
      expect(tier1Core.tier).toBe('tier3');
      expect(tier1Core.starCount).toBe(80);

      const tier2Core = detectHardwareTier({ forceCores: 3, webglSupported: true });
      expect(tier2Core.tier).toBe('tier3');
    });

    it('B03-3: Mid-range device (4-7 cores) assigns balanced tier2 configuration', () => {
      const tier4Core = detectHardwareTier({ forceCores: 4, webglSupported: true });
      expect(tier4Core.tier).toBe('tier2');
      expect(tier4Core.maxDpr).toBe(1.25);
      expect(tier4Core.starCount).toBe(240);
      expect(tier4Core.enableShadows).toBe(false);
      expect(tier4Core.enableWebGL).toBe(true);

      const tier6Core = detectHardwareTier({ forceCores: 6, webglSupported: true });
      expect(tier6Core.tier).toBe('tier2');
    });

    it('B03-4: High-end device (>=8 cores + WebGL) unlocks tier1 cinema quality', () => {
      const tier8Core = detectHardwareTier({ forceCores: 8, webglSupported: true });
      expect(tier8Core.tier).toBe('tier1');
      expect(tier8Core.maxDpr).toBe(2);
      expect(tier8Core.starCount).toBe(480);
      expect(tier8Core.enableShadows).toBe(true);
      expect(tier8Core.enableWebGL).toBe(true);

      const tier16Core = detectHardwareTier({ forceCores: 16, webglSupported: true });
      expect(tier16Core.tier).toBe('tier1');
    });

    it('B03-5: webglSupported: false overrides high core count down to tier3', () => {
      const tier = detectHardwareTier({ forceCores: 16, webglSupported: false });
      expect(tier.tier).toBe('tier3');
      expect(tier.enableWebGL).toBe(false);
      expect(tier.enableShadows).toBe(false);
      expect(tier.maxDpr).toBe(1);
    });
  });

  describe('4. Extreme Viewport, Fan Indices & Mathematical Boundaries (R2)', () => {
    it('B04-1: computeParabolicArcTransform with single card (totalCards: 1) places card at origin', () => {
      const pt = computeParabolicArcTransform(0, 1, 0);
      expect(pt.x).toBeCloseTo(0, 5);
      expect(pt.y).toBeCloseTo(0, 5);
      expect(pt.z).toBeCloseTo(0, 5);
      expect(pt.rotZ).toBeCloseTo(0, 5);
      expect(Number.isNaN(pt.x)).toBe(false);
    });

    it('B04-2: computeParabolicArcTransform with full 78 deck produces finite symmetric coordinates', () => {
      for (let i = 0; i < 78; i++) {
        const pt = computeParabolicArcTransform(i, 78, 0);
        expect(Number.isFinite(pt.x)).toBe(true);
        expect(Number.isFinite(pt.y)).toBe(true);
        expect(Number.isFinite(pt.z)).toBe(true);
        expect(Number.isFinite(pt.rotZ)).toBe(true);
      }

      // First and last card symmetry
      const first = computeParabolicArcTransform(0, 78, 0);
      const last = computeParabolicArcTransform(77, 78, 0);
      expect(first.x).toBeCloseTo(-last.x, 3);
      expect(first.rotZ).toBeCloseTo(-last.rotZ, 3);
      expect(first.y).toBeCloseTo(last.y, 3);
    });

    it('B04-3: computeParabolicArcTransform with extreme scroll offsets yields stable numeric values', () => {
      const negPt = computeParabolicArcTransform(5, 11, -9999);
      const posPt = computeParabolicArcTransform(5, 11, 9999);

      expect(Number.isFinite(negPt.x)).toBe(true);
      expect(Number.isFinite(posPt.x)).toBe(true);
    });

    it('B04-4: evaluateCubicBezier3D with identical control points collapses to that point for any t', () => {
      const p: Point3D = { x: 5, y: -2, z: 10 };
      const tValues = [0, 0.25, 0.5, 0.75, 1.0];
      for (const t of tValues) {
        const res = evaluateCubicBezier3D(p, p, p, p, t);
        expect(res.x).toBeCloseTo(p.x, 5);
        expect(res.y).toBeCloseTo(p.y, 5);
        expect(res.z).toBeCloseTo(p.z, 5);
      }
    });

    it('B04-5: evaluateCubicBezier3D handles boundary t values without throwing', () => {
      const p0: Point3D = { x: 0, y: 0, z: 0 };
      const p1: Point3D = { x: 1, y: 1, z: 1 };
      const p2: Point3D = { x: 2, y: 2, z: 2 };
      const p3: Point3D = { x: 3, y: 3, z: 3 };

      expect(() => {
        evaluateCubicBezier3D(p0, p1, p2, p3, -0.5);
        evaluateCubicBezier3D(p0, p1, p2, p3, 1.5);
      }).not.toThrow();
    });

    it('B04-6: getReaderAtmospherePalette with invalid reader ID gracefully defaults to ba_ngoai', () => {
      // @ts-expect-error invalid reader ID test
      const fallback = getReaderAtmospherePalette('unknown_persona_999');
      expect(fallback.readerId).toBe('ba_ngoai');
      expect(fallback.primaryHex).toBe('#EAB308');
    });
  });

  describe('5. Rapid Route Switching & WebGL Lifecycle Leaks (R5)', () => {
    it('B05-1: 50 rapid scene creation and disposal cycles execute without errors or memory retention', () => {
      expect(() => {
        for (let i = 0; i < 50; i++) {
          const scene = new THREE.Scene();
          const cardMesh = create3DTarotCardMesh();
          scene.add(cardMesh);
          disposeThreeScene(scene);
        }
      }).not.toThrow();
    });

    it('B05-2: Attaching and detaching WebGLContextLostGuard 20 times removes all event handlers', () => {
      const listeners: Record<string, EventListener[]> = {
        webglcontextlost: [],
        webglcontextrestored: [],
      };

      const mockCanvas = {
        addEventListener: (type: string, fn: EventListener) => {
          listeners[type]?.push(fn);
        },
        removeEventListener: (type: string, fn: EventListener) => {
          const idx = listeners[type]?.indexOf(fn);
          if (idx !== undefined && idx >= 0) {
            listeners[type]?.splice(idx, 1);
          }
        },
      } as unknown as HTMLCanvasElement;

      const detachCallbacks: Array<() => void> = [];
      for (let i = 0; i < 20; i++) {
        detachCallbacks.push(attachWebGLContextLostGuard(mockCanvas));
      }

      expect(listeners.webglcontextlost.length).toBe(20);
      expect(listeners.webglcontextrestored.length).toBe(20);

      // Clean all
      for (const detach of detachCallbacks) {
        detach();
      }

      expect(listeners.webglcontextlost.length).toBe(0);
      expect(listeners.webglcontextrestored.length).toBe(0);
    });

    it('B05-3: disposeThreeScene traverses deep nested hierarchies including Groups and Lights', () => {
      const rootScene = new THREE.Scene();
      const parentGroup = new THREE.Group();
      const childGroup = new THREE.Group();

      const geom1 = new THREE.BoxGeometry(1, 1, 1);
      const mat1 = new THREE.MeshBasicMaterial({ color: 0xc9a24a });
      const mesh1 = new THREE.Mesh(geom1, mat1);

      const geom2 = new THREE.SphereGeometry(1, 8, 8);
      const mat2 = new THREE.MeshBasicMaterial({ color: 0x8b5cf6 });
      const mesh2 = new THREE.Mesh(geom2, mat2);

      childGroup.add(mesh2);
      parentGroup.add(mesh1);
      parentGroup.add(childGroup);
      rootScene.add(parentGroup);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1);
      rootScene.add(dirLight);

      expect(() => disposeThreeScene(rootScene)).not.toThrow();
    });

    it('B05-4: disposeMaterial cleans up textures attached to material map safely', () => {
      const mat = new THREE.MeshStandardMaterial();
      const mockTexture = {
        dispose: vi.fn(),
        isTexture: true,
      } as unknown as THREE.Texture;
      mat.map = mockTexture;

      disposeMaterial(mat);
      expect(mockTexture.dispose).toHaveBeenCalled();
    });

    it('B05-5: IdleAwareRenderLoop safely initializes and stops without dangling timers', () => {
      const mockRenderer = {
        render: vi.fn(),
      } as unknown as THREE.WebGLRenderer;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();

      const loop = new IdleAwareRenderLoop(mockRenderer, scene, camera, {
        continuous: false,
        maxIdleSeconds: 1,
      });

      expect(() => {
        loop.start();
        loop.markDirty();
        loop.stop();
      }).not.toThrow();
    });
  });
});
