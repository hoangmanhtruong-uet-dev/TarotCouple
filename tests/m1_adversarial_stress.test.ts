import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { soundManager, SoundManager } from '@/lib/sound-effects';
import {
  cleanupThreeInstance,
  disposeThreeScene,
  disposeMaterial,
  detectHardwareTier,
  getTierRenderSettings,
  createTierAdaptiveRenderer,
  attachWebGLContextLostGuard,
  IdleAwareRenderLoop,
  computeParabolicArcTransform,
  evaluateCubicBezier3D,
} from '@/lib/three/core';
import {
  create3DTarotCardMesh,
  createCardFaceTexture,
  createSacredCardBackTexture,
} from '@/lib/three/card-textures';
import {
  MYSTICAL_MIST_VERTEX_SHADER,
  MYSTICAL_MIST_FRAGMENT_SHADER,
  ENERGY_WAVE_VERTEX_SHADER,
  ENERGY_WAVE_FRAGMENT_SHADER,
  LUMINESCENT_PARTICLES_VERTEX_SHADER,
  LUMINESCENT_PARTICLES_FRAGMENT_SHADER,
  createMysticalMistUniforms,
  createEnergyWaveUniforms,
  createLuminescentParticlesUniforms,
  CHROMATIC_VIGNETTE_SHADER,
  createProceduralSanctuaryEnvMap,
} from '@/lib/three/shaders';

describe('Milestone 1 Adversarial Stress Test Suite', () => {
  describe('Adversarial Test 1: SoundManager Concurrency, Rapid Invocation & Muted Edge States', () => {
    let mockContext: any;
    let createdOscillators: any[];
    let createdGains: any[];
    let createdBuffers: any[];
    let createdBufferSources: any[];
    let createdFilters: any[];
    let mockLocalStorage: Record<string, string>;

    beforeEach(() => {
      createdOscillators = [];
      createdGains = [];
      createdBuffers = [];
      createdBufferSources = [];
      createdFilters = [];
      mockLocalStorage = {};

      mockContext = {
        currentTime: 0,
        sampleRate: 44100,
        state: 'running',
        destination: { connect: vi.fn(), disconnect: vi.fn() },
        suspend: vi.fn().mockImplementation(() => {
          mockContext.state = 'suspended';
          return Promise.resolve();
        }),
        resume: vi.fn().mockImplementation(() => {
          mockContext.state = 'running';
          return Promise.resolve();
        }),
        createOscillator: vi.fn().mockImplementation(() => {
          const osc = {
            type: 'sine',
            frequency: {
              setValueAtTime: vi.fn(),
              exponentialRampToValueAtTime: vi.fn(),
              linearRampToValueAtTime: vi.fn(),
            },
            connect: vi.fn(),
            disconnect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
          };
          createdOscillators.push(osc);
          return osc;
        }),
        createGain: vi.fn().mockImplementation(() => {
          const gain = {
            gain: {
              setValueAtTime: vi.fn(),
              exponentialRampToValueAtTime: vi.fn(),
              linearRampToValueAtTime: vi.fn(),
              setTargetAtTime: vi.fn(),
            },
            connect: vi.fn(),
            disconnect: vi.fn(),
          };
          createdGains.push(gain);
          return gain;
        }),
        createBiquadFilter: vi.fn().mockImplementation(() => {
          const filter = {
            type: 'bandpass',
            frequency: {
              setValueAtTime: vi.fn(),
              exponentialRampToValueAtTime: vi.fn(),
            },
            Q: { setValueAtTime: vi.fn() },
            connect: vi.fn(),
            disconnect: vi.fn(),
          };
          createdFilters.push(filter);
          return filter;
        }),
        createBuffer: vi.fn().mockImplementation((channels: number, length: number, sampleRate: number) => {
          const buf = {
            getChannelData: vi.fn().mockReturnValue(new Float32Array(length)),
            duration: length / sampleRate,
            length,
            sampleRate,
          };
          createdBuffers.push(buf);
          return buf;
        }),
        createBufferSource: vi.fn().mockImplementation(() => {
          const bs = {
            buffer: null,
            connect: vi.fn(),
            disconnect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
          };
          createdBufferSources.push(bs);
          return bs;
        }),
      };

      const mockWindow = {
        AudioContext: vi.fn().mockImplementation(() => mockContext),
        localStorage: {
          getItem: vi.fn((key: string) => mockLocalStorage[key] ?? null),
          setItem: vi.fn((key: string, value: string) => {
            mockLocalStorage[key] = value;
          }),
        },
      };

      vi.stubGlobal('window', mockWindow);
      vi.stubGlobal('localStorage', mockWindow.localStorage);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it('1.1 Rapid consecutive calls (100x) to playTibetanSingingBowl() without throwing or corrupting state', () => {
      const manager = new SoundManager();
      manager.setEnabled(true);

      expect(() => {
        for (let i = 0; i < 100; i++) {
          mockContext.currentTime += 0.01;
          manager.playTibetanSingingBowl();
        }
      }).not.toThrow();

      // 6 oscillators per bowl * 100 calls = 600 oscillators
      expect(createdOscillators.length).toBe(600);
      expect((manager as any).activeVoices.size).toBe(100);

      // Now call cleanupRouteAudio and verify all 100 voices are stopped and cleared
      expect(() => manager.cleanupRouteAudio()).not.toThrow();
      expect((manager as any).activeVoices.size).toBe(0);

      for (const osc of createdOscillators) {
        expect(osc.stop).toHaveBeenCalled();
        expect(osc.disconnect).toHaveBeenCalled();
      }
    });

    it('1.2 Rapid consecutive calls (100x) to playCrispClick() and playOrganicCardFlip()', () => {
      const manager = new SoundManager();
      manager.setEnabled(true);

      expect(() => {
        for (let i = 0; i < 50; i++) {
          mockContext.currentTime += 0.005;
          manager.playCrispClick();
          manager.playOrganicCardFlip();
        }
      }).not.toThrow();

      expect((manager as any).activeVoices.size).toBe(100);
      manager.cleanupRouteAudio();
      expect((manager as any).activeVoices.size).toBe(0);
      expect(mockContext.suspend).toHaveBeenCalled();
    });

    it('1.3 Muted state: verify strict zero-work bypass when disabled', () => {
      const manager = new SoundManager();
      manager.setEnabled(false);
      expect(manager.isEnabled()).toBe(false);

      // Reset mock spies
      createdOscillators = [];
      createdBuffers = [];

      for (let i = 0; i < 50; i++) {
        manager.playTibetanSingingBowl();
        manager.playCrispClick();
        manager.playOrganicCardFlip();
        manager.playCardSlide();
        manager.playMysticChime();
        manager.playRiffleShuffle();
        manager.playMagneticHover();
        manager.playScrollHarmonic(3);
        manager.playReaderPersonaChord('chi_dai');
      }

      expect(createdOscillators.length).toBe(0);
      expect(createdBuffers.length).toBe(0);
      expect((manager as any).activeVoices.size).toBe(0);
    });

    it('1.4 cleanupRouteAudio() idempotence under uninitialized and double-invoke states', () => {
      const manager = new SoundManager();
      // Uninitialized state: getContext() never called, ctx is null
      expect((manager as any).ctx).toBeNull();

      expect(() => {
        manager.cleanupRouteAudio();
        manager.cleanupRouteAudio();
        manager.cleanupRouteAudio();
      }).not.toThrow();

      expect((manager as any).activeVoices.size).toBe(0);
      expect((manager as any).ambientNodes).toBeNull();
    });

    it('1.5 cleanupRouteAudio() handles throwing stop/disconnect methods gracefully', () => {
      const manager = new SoundManager();
      manager.playTibetanSingingBowl();

      // Sabotage oscillators and gains to throw on stop/disconnect
      for (const osc of createdOscillators) {
        osc.stop = vi.fn().mockImplementation(() => {
          throw new Error('Oscillator already stopped');
        });
        osc.disconnect = vi.fn().mockImplementation(() => {
          throw new Error('Oscillator already disconnected');
        });
      }
      for (const gain of createdGains) {
        gain.disconnect = vi.fn().mockImplementation(() => {
          throw new Error('Gain already disconnected');
        });
      }

      expect(() => manager.cleanupRouteAudio()).not.toThrow();
      expect((manager as any).activeVoices.size).toBe(0);
    });

    it('1.6 toggle() 50x back and forth toggles cleanly and saves state', () => {
      const manager = new SoundManager();
      let state = manager.isEnabled();

      for (let i = 0; i < 50; i++) {
        const next = manager.toggle();
        expect(next).toBe(!state);
        state = next;
      }
      expect(mockLocalStorage['tc_sound_enabled']).toBe(String(state));
    });
  });

  describe('Adversarial Test 2: Three.js cleanupThreeInstance() Deep Hierarchies, Nulls & Edge Conditions', () => {
    it('2.1 Deeply nested scene graph (10 levels) with mixed objects, materials and shadow maps', () => {
      const scene = new THREE.Scene();
      let currentParent: THREE.Object3D = scene;

      const disposedGeometries: THREE.BufferGeometry[] = [];
      const disposedMaterials: THREE.Material[] = [];
      const disposedTextures: THREE.Texture[] = [];

      for (let level = 0; level < 10; level++) {
        const group = new THREE.Group();
        group.name = `Level_${level}`;

        // Add a mesh with multi-materials
        const geom = new THREE.BoxGeometry(1, 1, 1);
        const tex = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
        const mat1 = new THREE.MeshPhysicalMaterial({ map: tex });
        const mat2 = new THREE.MeshStandardMaterial();
        const mesh = new THREE.Mesh(geom, [mat1, mat2]);

        // Add an instanced mesh
        const instGeom = new THREE.SphereGeometry(0.5);
        const instMat = new THREE.MeshBasicMaterial();
        const instMesh = new THREE.InstancedMesh(instGeom, instMat, 5);

        // Add a spot light with shadow map
        const light = new THREE.SpotLight(0xffffff);
        light.shadow.map = { dispose: vi.fn() } as any;

        group.add(mesh);
        group.add(instMesh);
        group.add(light);

        currentParent.add(group);
        currentParent = group;

        disposedGeometries.push(geom, instGeom);
        disposedMaterials.push(mat1, mat2, instMat);
        disposedTextures.push(tex);
      }

      // Spies
      const geomSpies = disposedGeometries.map((g) => vi.spyOn(g, 'dispose'));
      const matSpies = disposedMaterials.map((m) => vi.spyOn(m, 'dispose'));
      const texSpies = disposedTextures.map((t) => vi.spyOn(t, 'dispose'));

      expect(() => {
        cleanupThreeInstance({ scene });
      }).not.toThrow();

      geomSpies.forEach((spy) => expect(spy).toHaveBeenCalled());
      matSpies.forEach((spy) => expect(spy).toHaveBeenCalled());
      texSpies.forEach((spy) => expect(spy).toHaveBeenCalled());
      expect(scene.children.length).toBe(0);
    });

    it('2.2 ShaderMaterial with nested uniforms and null/undefined uniform values', () => {
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTex1: { value: new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1) },
          uTexNull: { value: null },
          uPrimitive: { value: 42 },
          uVector: { value: new THREE.Vector2(1, 2) },
          uColor: { value: new THREE.Color(0xff0000) },
          uBroken: { value: { dispose: () => { throw new Error('Disposal failed'); } } },
        },
      });

      const texSpy = vi.spyOn(mat.uniforms.uTex1.value as THREE.Texture, 'dispose');

      expect(() => {
        disposeMaterial(mat);
      }).not.toThrow();

      expect(texSpy).toHaveBeenCalled();
    });

    it('2.3 Renderer with missing or throwing properties does not crash cleanupThreeInstance', () => {
      const throwingRenderer = {
        domElement: {
          parentElement: {
            removeChild: () => {
              throw new Error('DOM detached error');
            },
          },
        },
        forceContextLoss: () => {
          throw new Error('WEBGL_lose_context unavailable');
        },
        renderLists: {
          dispose: () => {
            throw new Error('renderLists disposal failure');
          },
        },
        dispose: () => {
          throw new Error('dispose failure');
        },
      } as unknown as THREE.WebGLRenderer;

      expect(() => {
        cleanupThreeInstance({ renderer: throwingRenderer });
      }).not.toThrow();
    });

    it('2.4 Double invocation (calling cleanupThreeInstance twice on the same scene)', () => {
      const scene = new THREE.Scene();
      const geom = new THREE.BoxGeometry(1, 1, 1);
      const mat = new THREE.MeshBasicMaterial();
      scene.add(new THREE.Mesh(geom, mat));

      expect(() => {
        cleanupThreeInstance({ scene });
        cleanupThreeInstance({ scene });
      }).not.toThrow();

      expect(scene.children.length).toBe(0);
    });

    it('2.5 Composer with null passes and throwing passes', () => {
      const brokenComposer = {
        passes: [
          null,
          undefined,
          { dispose: () => { throw new Error('Pass error'); } },
          { dispose: vi.fn() },
        ],
        dispose: () => {
          throw new Error('Composer dispose error');
        },
      };

      expect(() => {
        cleanupThreeInstance({ composer: brokenComposer as any });
      }).not.toThrow();

      expect((brokenComposer.passes[3] as any).dispose).toHaveBeenCalled();
    });
  });

  describe('Adversarial Test 3: create3DTarotCardMesh() Boundary & Invalid Options', () => {
    it('3.1 Generates card mesh safely with undefined, null, or empty options', () => {
      expect(() => create3DTarotCardMesh(undefined)).not.toThrow();
      expect(() => create3DTarotCardMesh({})).not.toThrow();

      const mesh = create3DTarotCardMesh({});
      expect(mesh).toBeInstanceOf(THREE.Mesh);
      expect((mesh.material as THREE.Material[]).length).toBe(6);
    });

    it('3.2 Extreme, zero, negative dimensions', () => {
      // Dimensions with zero or very small values
      expect(() => {
        const meshZero = create3DTarotCardMesh({
          width: 0,
          height: 0,
          thickness: 0,
        });
        expect(meshZero).toBeInstanceOf(THREE.Mesh);
      }).not.toThrow();

      // Negative dimensions
      expect(() => {
        const meshNeg = create3DTarotCardMesh({
          width: -0.5,
          height: -1.0,
          thickness: -0.02,
        });
        expect(meshNeg).toBeInstanceOf(THREE.Mesh);
      }).not.toThrow();
    });

    it('3.3 Extreme string lengths, special symbols, and XSS-like payloads in titles/romans', () => {
      const longTitle = 'A'.repeat(5000);
      const xssTitle = '<script>alert("XSS")</script>&quot;`\'';
      const unicodeTitle = '✦ 🔮 Nữ Hoàng Ánh Sáng 🌟 🎴 🂠 🃞';

      expect(() => {
        const mesh1 = create3DTarotCardMesh({ title: longTitle, roman: 'MMXXIV' });
        expect(mesh1).toBeInstanceOf(THREE.Mesh);

        const mesh2 = create3DTarotCardMesh({ title: xssTitle, roman: '<tag>' });
        expect(mesh2).toBeInstanceOf(THREE.Mesh);

        const mesh3 = create3DTarotCardMesh({ title: unicodeTitle, roman: 'XXI' });
        expect(mesh3).toBeInstanceOf(THREE.Mesh);
      }).not.toThrow();
    });

    it('3.4 Invalid / malformed color strings (fallback to default color)', () => {
      expect(() => {
        const mesh1 = create3DTarotCardMesh({ accentHex: 'nonsense' });
        expect(mesh1).toBeInstanceOf(THREE.Mesh);

        const mesh2 = create3DTarotCardMesh({ accentHex: '' });
        expect(mesh2).toBeInstanceOf(THREE.Mesh);

        const mesh3 = create3DTarotCardMesh({ accentHex: '#12' });
        expect(mesh3).toBeInstanceOf(THREE.Mesh);
      }).not.toThrow();
    });

    it('3.5 Tier selection edge cases (tier3, undefined tier, invalid tier string)', () => {
      const meshTier3 = create3DTarotCardMesh({ tier: 'tier3' });
      const materials3 = meshTier3.material as THREE.Material[];
      // Tier 3 falls back to MeshStandardMaterial
      expect((materials3[0] as THREE.MeshStandardMaterial).isMeshStandardMaterial).toBe(true);

      const meshInvalidTier = create3DTarotCardMesh({ tier: 'tier99' as any });
      expect(meshInvalidTier).toBeInstanceOf(THREE.Mesh);
    });

    it('3.6 EnvMap options with invalid objects', () => {
      expect(() => {
        const meshNullEnv = create3DTarotCardMesh({ envMap: null });
        expect(meshNullEnv).toBeInstanceOf(THREE.Mesh);

        const meshUndefEnv = create3DTarotCardMesh({ envMap: undefined });
        expect(meshUndefEnv).toBeInstanceOf(THREE.Mesh);
      }).not.toThrow();
    });
  });

  describe('Adversarial Test 4: GLSL Shaders, Math Utilities & Hardware Tier Detection', () => {
    it('4.1 computeParabolicArcTransform handles extreme indices and card counts', () => {
      // 0 cards
      expect(() => computeParabolicArcTransform(0, 0)).not.toThrow();

      // Negative index or index > total
      const p1 = computeParabolicArcTransform(-5, 22);
      expect(Number.isFinite(p1.x)).toBe(true);
      expect(Number.isFinite(p1.y)).toBe(true);
      expect(Number.isFinite(p1.z)).toBe(true);

      const p2 = computeParabolicArcTransform(100, 22);
      expect(Number.isFinite(p2.x)).toBe(true);
      expect(Number.isFinite(p2.y)).toBe(true);
      expect(Number.isFinite(p2.z)).toBe(true);

      // 1 card
      const pSingle = computeParabolicArcTransform(0, 1);
      expect(pSingle.x).toBeCloseTo(0, 2);
    });

    it('4.2 evaluateCubicBezier3D handles out-of-range t (<0 or >1)', () => {
      const p0 = { x: 0, y: 0, z: 0 };
      const p1 = { x: 1, y: 2, z: 3 };
      const p2 = { x: 2, y: 4, z: 6 };
      const p3 = { x: 3, y: 6, z: 9 };

      const below = evaluateCubicBezier3D(p0, p1, p2, p3, -10);
      expect(below.x).toBe(0);
      expect(below.y).toBe(0);
      expect(below.z).toBe(0);

      const above = evaluateCubicBezier3D(p0, p1, p2, p3, 100);
      expect(above.x).toBe(3);
      expect(above.y).toBe(6);
      expect(above.z).toBe(9);
    });

    it('4.3 detectHardwareTier handles reducedMotion, missing webgl, and varied core counts', () => {
      const rm = detectHardwareTier({ reducedMotion: true });
      expect(rm.tier).toBe('tier3');
      expect(rm.enableWebGL).toBe(false);

      const noGl = detectHardwareTier({ webglSupported: false });
      expect(noGl.tier).toBe('tier3');
      expect(noGl.enableWebGL).toBe(false);

      const lowCores = detectHardwareTier({ forceCores: 2, webglSupported: true });
      expect(lowCores.tier).toBe('tier3');

      const midCores = detectHardwareTier({ forceCores: 4, webglSupported: true });
      expect(midCores.tier).toBe('tier2');
      expect(midCores.enableWebGL).toBe(true);

      const highCores = detectHardwareTier({ forceCores: 8, webglSupported: true });
      expect(highCores.tier).toBe('tier1');
      expect(highCores.enableWebGL).toBe(true);
      expect(highCores.enableShadows).toBe(true);
    });

    it('4.4 Uniform factories handle invalid / extreme numerical parameters without throwing', () => {
      expect(() => {
        createMysticalMistUniforms({ density: -99, accentHex: 'bad', baseHex: 'bad' });
      }).not.toThrow();

      expect(() => {
        createEnergyWaveUniforms({
          speed: -5,
          frequency: 0,
          decayRate: -1,
          intensity: 100,
          baseHex: 'bad',
        });
      }).not.toThrow();

      expect(() => {
        createLuminescentParticlesUniforms({ baseSize: -10, pixelRatio: 0 });
      }).not.toThrow();
    });

    it('4.5 attachWebGLContextLostGuard works with null, undefined, or mock canvas', () => {
      const detach1 = attachWebGLContextLostGuard(null);
      expect(typeof detach1).toBe('function');
      detach1();

      const mockCanvas = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as HTMLCanvasElement;

      const detach2 = attachWebGLContextLostGuard(mockCanvas);
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('webglcontextlost', expect.any(Function), false);
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('webglcontextrestored', expect.any(Function), false);

      detach2();
      expect(mockCanvas.removeEventListener).toHaveBeenCalledWith('webglcontextlost', expect.any(Function), false);
      expect(mockCanvas.removeEventListener).toHaveBeenCalledWith('webglcontextrestored', expect.any(Function), false);
    });
  });
});
