import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import {
  cleanupThreeInstance,
  disposeThreeScene,
  getTierRenderSettings,
  createTierAdaptiveRenderer,
  type ThreeInstanceToCleanup,
} from '@/lib/three/core';
import {
  create3DTarotCardMesh,
  createSacredCardBackTexture,
  createCardFaceTexture,
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
  createProceduralSanctuaryEnvMap,
} from '@/lib/three/shaders';

describe('Three.js PBR Materials, Lifecycle Disposal & Tier Helpers (Milestone 1)', () => {
  describe('1. cleanupThreeInstance & WebGL Lifecycle Guard', () => {
    it('disposes geometries, materials, textures, composer passes, and invokes forceContextLoss and cancelAnimationFrame', () => {
      const scene = new THREE.Scene();
      const geom = new THREE.BoxGeometry(1, 1, 1);
      const texture = new THREE.DataTexture(new Uint8Array([255, 0, 0, 255]), 1, 1);
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0xc9a24a,
        map: texture,
        metalness: 0.85,
        roughness: 0.25,
      });
      const mesh = new THREE.Mesh(geom, mat);
      scene.add(mesh);

      // Environment & Background
      const envTex = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1);
      const bgTex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
      scene.environment = envTex;
      scene.background = bgTex;

      const geomSpy = vi.spyOn(geom, 'dispose');
      const matSpy = vi.spyOn(mat, 'dispose');
      const texSpy = vi.spyOn(texture, 'dispose');
      const envSpy = vi.spyOn(envTex, 'dispose');
      const bgSpy = vi.spyOn(bgTex, 'dispose');

      let contextLossCalled = false;
      let rendererDisposed = false;
      const fakeCanvas = {
        parentElement: {
          removeChild: vi.fn(),
        },
      };

      const fakeRenderer = {
        domElement: fakeCanvas as unknown as HTMLCanvasElement,
        forceContextLoss: () => {
          contextLossCalled = true;
        },
        dispose: () => {
          rendererDisposed = true;
        },
        renderLists: {
          dispose: vi.fn(),
        },
      } as unknown as THREE.WebGLRenderer;

      let passDisposed = false;
      let composerDisposed = false;
      const fakeComposer = {
        passes: [
          {
            dispose: () => {
              passDisposed = true;
            },
          },
        ],
        dispose: () => {
          composerDisposed = true;
        },
      };

      const originalCancel = global.cancelAnimationFrame;
      let cancelCalledWith: number | null = null;
      global.cancelAnimationFrame = (id: number) => {
        cancelCalledWith = id;
      };

      try {
        cleanupThreeInstance({
          scene,
          renderer: fakeRenderer,
          camera: new THREE.PerspectiveCamera(),
          animationFrameId: 9988,
          composer: fakeComposer as any,
        });

        expect(geomSpy).toHaveBeenCalled();
        expect(matSpy).toHaveBeenCalled();
        expect(texSpy).toHaveBeenCalled();
        expect(envSpy).toHaveBeenCalled();
        expect(bgSpy).toHaveBeenCalled();
        expect(scene.environment).toBeNull();
        expect(scene.background).toBeNull();
        expect(scene.children.length).toBe(0);
        expect(passDisposed).toBe(true);
        expect(composerDisposed).toBe(true);
        expect(contextLossCalled).toBe(true);
        expect(rendererDisposed).toBe(true);
        expect(cancelCalledWith).toBe(9988);
        expect(fakeCanvas.parentElement.removeChild).toHaveBeenCalledWith(fakeCanvas);
      } finally {
        global.cancelAnimationFrame = originalCancel;
      }
    });

    it('handles empty, null, or partial instances gracefully without throwing', () => {
      expect(() => cleanupThreeInstance({})).not.toThrow();
      expect(() =>
        cleanupThreeInstance({
          scene: null,
          renderer: null,
          camera: null,
          composer: null,
        })
      ).not.toThrow();
    });

    it('backward compatibility: disposeThreeScene delegates to cleanupThreeInstance safely', () => {
      const scene = new THREE.Scene();
      const geom = new THREE.SphereGeometry(1);
      const mat = new THREE.MeshBasicMaterial();
      scene.add(new THREE.Mesh(geom, mat));

      const geomSpy = vi.spyOn(geom, 'dispose');
      expect(() => disposeThreeScene(scene)).not.toThrow();
      expect(geomSpy).toHaveBeenCalled();
    });
  });

  describe('2. PBR Gold Foil Card Materials (create3DTarotCardMesh)', () => {
    it('creates MeshPhysicalMaterial with calibrated gold foil parameters when usePhysicalMaterial is true', () => {
      const mesh = create3DTarotCardMesh({
        roman: 'XIX',
        title: 'THE SUN',
        accentHex: '#C9A24A',
        usePhysicalMaterial: true,
      });

      expect(mesh).toBeInstanceOf(THREE.Mesh);
      expect(Array.isArray(mesh.material)).toBe(true);
      const materials = mesh.material as THREE.Material[];
      expect(materials.length).toBe(6);

      // Edge material (index 0)
      const edge = materials[0] as THREE.MeshPhysicalMaterial;
      expect(edge.isMeshPhysicalMaterial).toBe(true);
      expect(edge.metalness).toBe(0.85);
      expect(edge.roughness).toBe(0.25);
      expect(edge.clearcoat).toBe(0.7);
      expect(edge.clearcoatRoughness).toBe(0.15);
      expect(edge.color.getHexString().toUpperCase()).toBe('C9A24A');

      // Front & Back materials
      const front = materials[4] as THREE.MeshPhysicalMaterial;
      const back = materials[5] as THREE.MeshPhysicalMaterial;
      expect(front.isMeshPhysicalMaterial).toBe(true);
      expect(back.isMeshPhysicalMaterial).toBe(true);
    });

    it('falls back to enhanced MeshStandardMaterial when tier is tier2 or usePhysicalMaterial is false', () => {
      const mesh = create3DTarotCardMesh({
        roman: '0',
        title: 'THE FOOL',
        tier: 'tier2',
        usePhysicalMaterial: false,
      });

      const materials = mesh.material as THREE.Material[];
      const edge = materials[0] as THREE.MeshStandardMaterial;
      expect(edge.isMeshStandardMaterial).toBe(true);
      expect((edge as any).isMeshPhysicalMaterial).toBeFalsy();
      expect(edge.metalness).toBe(0.85);
      expect(edge.roughness).toBe(0.25);
    });

    it('attaches envMap to all 6 materials when provided in options', () => {
      const fakeEnvMap = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
      const mesh = create3DTarotCardMesh({
        envMap: fakeEnvMap,
      });

      const materials = mesh.material as THREE.MeshStandardMaterial[];
      for (const mat of materials) {
        expect(mat.envMap).toBe(fakeEnvMap);
      }
    });

    it('executes safely in SSR/Node without document without throwing', () => {
      expect(() => create3DTarotCardMesh()).not.toThrow();
    });
  });

  describe('3. Procedural Textures Generation (SSR & Mock DOM)', () => {
    it('returns null safely in SSR when document is undefined', () => {
      expect(createSacredCardBackTexture()).toBeNull();
      expect(createCardFaceTexture({ title: 'THE FOOL' })).toBeNull();
    });
  });

  describe('4. Tier-Adaptive Rendering Helper (getTierRenderSettings)', () => {
    it('configures Tier 1 with post-processing, physical materials, antialiasing, and maxDpr 1.5', () => {
      const s1 = getTierRenderSettings({
        tier: 'tier1',
        maxDpr: 2,
        starCount: 480,
        enableShadows: true,
        enableWebGL: true,
      });
      expect(s1.tier).toBe('tier1');
      expect(s1.usePostProcessing).toBe(true);
      expect(s1.usePhysicalMaterial).toBe(true);
      expect(s1.antialias).toBe(true);
      expect(s1.maxDpr).toBe(1.5);
    });

    it('configures Tier 2 (Mobile 60 FPS) with disabled post-processing, no MSAA, and maxDpr 1.25', () => {
      const s2 = getTierRenderSettings({
        tier: 'tier2',
        maxDpr: 1.25,
        starCount: 240,
        enableShadows: false,
        enableWebGL: true,
      });
      expect(s2.tier).toBe('tier2');
      expect(s2.usePostProcessing).toBe(false);
      expect(s2.usePhysicalMaterial).toBe(false);
      expect(s2.antialias).toBe(false);
      expect(s2.maxDpr).toBe(1.25);
      expect(s2.toneMappingExposure).toBe(1.15);
    });

    it('configures Tier 3 (Fallback) safely', () => {
      const s3 = getTierRenderSettings({
        tier: 'tier3',
        maxDpr: 1,
        starCount: 70,
        enableShadows: false,
        enableWebGL: false,
      });
      expect(s3.tier).toBe('tier3');
      expect(s3.usePostProcessing).toBe(false);
      expect(s3.usePhysicalMaterial).toBe(false);
      expect(s3.maxDpr).toBe(1.0);
    });

    it('createTierAdaptiveRenderer returns null safely in SSR', () => {
      const result = createTierAdaptiveRenderer({} as HTMLElement);
      expect(result).toBeNull();
    });
  });

  describe('5. GLSL Shaders & Uniform Helpers Verification', () => {
    it('MYSTICAL_MIST shaders compile valid strings with uniform declarations', () => {
      expect(MYSTICAL_MIST_VERTEX_SHADER).toContain('uniform float uTime;');
      expect(MYSTICAL_MIST_VERTEX_SHADER).toContain('uniform vec2 uMouse;');
      expect(MYSTICAL_MIST_FRAGMENT_SHADER).toContain('uniform float uMistDensity;');
      expect(MYSTICAL_MIST_FRAGMENT_SHADER).toContain('fbm2');

      const uniforms = createMysticalMistUniforms();
      expect(uniforms).toHaveProperty('uTime');
      expect(uniforms).toHaveProperty('uMouse');
      expect(uniforms).toHaveProperty('uColorBase');
      expect(uniforms).toHaveProperty('uColorAccent');
      expect(uniforms).toHaveProperty('uMistDensity');
      expect(uniforms.uColorAccent.value.getHexString().toUpperCase()).toBe('C9A24A');
    });

    it('ENERGY_WAVE shaders compile valid strings with ripple displacement math', () => {
      expect(ENERGY_WAVE_VERTEX_SHADER).toContain('uniform vec2 uTouchOrigin;');
      expect(ENERGY_WAVE_VERTEX_SHADER).toContain('uniform float uTouchStartTime;');
      expect(ENERGY_WAVE_VERTEX_SHADER).toContain('uniform float uWaveSpeed;');
      expect(ENERGY_WAVE_FRAGMENT_SHADER).toContain('uniform vec3 uColorWave;');
      expect(ENERGY_WAVE_FRAGMENT_SHADER).toContain('uniform vec3 uColorCrest;');

      const uniforms = createEnergyWaveUniforms();
      expect(uniforms).toHaveProperty('uTouchOrigin');
      expect(uniforms).toHaveProperty('uTouchStartTime');
      expect(uniforms.uWaveSpeed.value).toBe(2.4);
      expect(uniforms.uWaveFrequency.value).toBe(16.0);
    });

    it('LUMINESCENT_PARTICLES shaders compile valid strings for GPU point sprites', () => {
      expect(LUMINESCENT_PARTICLES_VERTEX_SHADER).toContain('attribute float aScale;');
      expect(LUMINESCENT_PARTICLES_VERTEX_SHADER).toContain('attribute float aPhase;');
      expect(LUMINESCENT_PARTICLES_VERTEX_SHADER).toContain('uniform float uPixelRatio;');
      expect(LUMINESCENT_PARTICLES_FRAGMENT_SHADER).toContain('gl_PointCoord');

      const uniforms = createLuminescentParticlesUniforms({ pixelRatio: 2.0 });
      expect(uniforms.uPixelRatio.value).toBe(2.0);
      expect(uniforms.uBaseSize.value).toBe(24.0);
    });

    it('creates ShaderMaterial instances without error using the new shaders and uniforms', () => {
      const mistMat = new THREE.ShaderMaterial({
        vertexShader: MYSTICAL_MIST_VERTEX_SHADER,
        fragmentShader: MYSTICAL_MIST_FRAGMENT_SHADER,
        uniforms: createMysticalMistUniforms() as any,
        transparent: true,
      });
      expect(mistMat).toBeInstanceOf(THREE.ShaderMaterial);
      mistMat.dispose();

      const waveMat = new THREE.ShaderMaterial({
        vertexShader: ENERGY_WAVE_VERTEX_SHADER,
        fragmentShader: ENERGY_WAVE_FRAGMENT_SHADER,
        uniforms: createEnergyWaveUniforms() as any,
        transparent: true,
      });
      expect(waveMat).toBeInstanceOf(THREE.ShaderMaterial);
      waveMat.dispose();

      const particleMat = new THREE.ShaderMaterial({
        vertexShader: LUMINESCENT_PARTICLES_VERTEX_SHADER,
        fragmentShader: LUMINESCENT_PARTICLES_FRAGMENT_SHADER,
        uniforms: createLuminescentParticlesUniforms() as any,
        transparent: true,
      });
      expect(particleMat).toBeInstanceOf(THREE.ShaderMaterial);
      particleMat.dispose();
    });
  });
});
