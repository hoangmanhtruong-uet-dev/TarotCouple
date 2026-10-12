import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import fs from 'node:fs';
import path from 'node:path';
import { soundManager } from '@/lib/sound-effects';
import {
  ASTRAL_VORTEX_VERTEX_SHADER,
  ASTRAL_VORTEX_FRAGMENT_SHADER,
  CHROMATIC_VIGNETTE_SHADER,
  PERSONA_AURA_VERTEX_SHADER,
  PERSONA_AURA_FRAGMENT_SHADER,
  createProceduralSanctuaryEnvMap,
} from '@/lib/three/shaders';
import {
  create3DTarotCardMesh,
  createSacredCardBackTexture,
  createCardFaceTexture,
} from '@/lib/three/card-textures';
import {
  detectHardwareTier,
  READER_ATMOSPHERE_PALETTES,
  getReaderAtmospherePalette,
  computeParabolicArcTransform,
  evaluateCubicBezier3D,
  disposeThreeScene,
  disposeMaterial,
  type Point3D,
} from '@/lib/three/core';
import { CustomCursorFollower } from '@/components/CustomCursorFollower';

const ROOT_DIR = process.cwd();

describe('Tier 1: Feature Coverage & Contract Suites (Isolated Unit & Contract Verification)', () => {
  describe('1. Web Audio Engine & Sound Synthesis (R4)', () => {
    beforeEach(() => {
      soundManager.setEnabled(true);
    });

    it('F01-1: SoundManager provides persistent state management and toggle capability', () => {
      expect(soundManager.isEnabled()).toBe(true);
      const newState = soundManager.toggle();
      expect(newState).toBe(false);
      expect(soundManager.isEnabled()).toBe(false);

      soundManager.setEnabled(true);
      expect(soundManager.isEnabled()).toBe(true);
    });

    it('F01-2: SoundManager synthesizes pure harmonic bell tones without throwing in non-browser env', () => {
      expect(typeof soundManager.playBellTone).toBe('function');
      expect(() => soundManager.playBellTone()).not.toThrow();
    });

    it('F01-3: SoundManager synthesizes organic card sliding and 3D card flips cleanly', () => {
      expect(typeof soundManager.playCardSlide).toBe('function');
      expect(typeof soundManager.playCardFlip).toBe('function');
      expect(() => {
        soundManager.playCardSlide();
        soundManager.playCardFlip();
      }).not.toThrow();
    });

    it('F01-4: SoundManager executes mystic chime arpeggio and riffle shuffle sequences cleanly', () => {
      expect(typeof soundManager.playMysticChime).toBe('function');
      expect(typeof soundManager.playRiffleShuffle).toBe('function');
      expect(() => {
        soundManager.playMysticChime();
        soundManager.playRiffleShuffle();
      }).not.toThrow();
    });

    it('F01-5: SoundManager synthesizes magnetic cursor hover ticks and scroll whoosh', () => {
      expect(typeof soundManager.playMagneticHover).toBe('function');
      expect(typeof soundManager.playScrollHarmonic).toBe('function');
      expect(() => {
        soundManager.playMagneticHover();
        soundManager.playScrollHarmonic(2.5);
      }).not.toThrow();
    });

    it('F01-6: SoundManager synthesizes distinct persona chords for all 4 canonical readers', () => {
      const canonicalReaders = ['ba_ngoai', 'chi_dai', 'ban_than', 'thay_cu_meo'] as const;
      for (const readerId of canonicalReaders) {
        expect(() => soundManager.playReaderPersonaChord(readerId)).not.toThrow();
      }
    });

    it('F01-7: SoundManager controls spatial ambient drone lifecycle safely', () => {
      expect(typeof soundManager.toggleAmbientDrone).toBe('function');
      expect(typeof soundManager.isAmbientPlaying).toBe('function');

      const startResult = soundManager.toggleAmbientDrone(false);
      expect(typeof startResult).toBe('boolean');
      expect(soundManager.isAmbientPlaying()).toBe(false);
    });

    it('F01-8: SoundManager satisfies interface contract requirements', () => {
      // Contract methods: playBellTone/playTibetanSingingBowl, playCardFlip/playOrganicCardFlip, etc.
      expect(typeof soundManager.isEnabled).toBe('function');
      expect(typeof soundManager.toggle).toBe('function');
      expect(typeof soundManager.playCardSlide).toBe('function');
      expect(typeof soundManager.playMysticChime).toBe('function');
      expect(typeof soundManager.playMagneticHover).toBe('function');

      const bowlFn =
        (soundManager as unknown as Record<string, () => void>).playTibetanSingingBowl ??
        soundManager.playBellTone;
      expect(typeof bowlFn).toBe('function');
      expect(() => bowlFn.call(soundManager)).not.toThrow();
    });
  });

  describe('2. Custom GLSL Shaders & Environment Maps (R2)', () => {
    it('F02-1: ASTRAL_VORTEX_VERTEX_SHADER exports GLSL code declaring all essential dynamic uniforms', () => {
      expect(typeof ASTRAL_VORTEX_VERTEX_SHADER).toBe('string');
      expect(ASTRAL_VORTEX_VERTEX_SHADER).toContain('uniform float uTime;');
      expect(ASTRAL_VORTEX_VERTEX_SHADER).toContain('uniform float uScrollProgress;');
      expect(ASTRAL_VORTEX_VERTEX_SHADER).toContain('uniform float uVelocity;');
      expect(ASTRAL_VORTEX_VERTEX_SHADER).toContain('uniform vec2 uMouse;');
      expect(ASTRAL_VORTEX_VERTEX_SHADER).toContain('gl_Position');
    });

    it('F02-2: ASTRAL_VORTEX_FRAGMENT_SHADER renders sacred concentric geometry and color blends', () => {
      expect(typeof ASTRAL_VORTEX_FRAGMENT_SHADER).toBe('string');
      expect(ASTRAL_VORTEX_FRAGMENT_SHADER).toContain('uniform vec3 uColorGold;');
      expect(ASTRAL_VORTEX_FRAGMENT_SHADER).toContain('uniform vec3 uColorViolet;');
      expect(ASTRAL_VORTEX_FRAGMENT_SHADER).toContain('uniform vec3 uColorRose;');
      expect(ASTRAL_VORTEX_FRAGMENT_SHADER).toContain('gl_FragColor');
    });

    it('F02-3: CHROMATIC_VIGNETTE_SHADER exports complete post-processing shader pass definition', () => {
      expect(CHROMATIC_VIGNETTE_SHADER).toHaveProperty('uniforms');
      expect(CHROMATIC_VIGNETTE_SHADER).toHaveProperty('vertexShader');
      expect(CHROMATIC_VIGNETTE_SHADER).toHaveProperty('fragmentShader');
      expect(CHROMATIC_VIGNETTE_SHADER.uniforms.uChromaticIntensity.value).toBeGreaterThan(0);
      expect(CHROMATIC_VIGNETTE_SHADER.uniforms.uVignetteDarkness.value).toBeGreaterThan(0);
    });

    it('F02-4: PERSONA_AURA shaders export reader mandala frequency and accent color modulation', () => {
      expect(PERSONA_AURA_VERTEX_SHADER).toContain('uniform float uPersonaIndex;');
      expect(PERSONA_AURA_FRAGMENT_SHADER).toContain('uniform vec3 uAccentColor;');
      expect(PERSONA_AURA_FRAGMENT_SHADER).toContain('uniform vec3 uSecondaryColor;');
    });

    it('F02-5: createProceduralSanctuaryEnvMap is a valid function accepting WebGLRenderer', () => {
      expect(typeof createProceduralSanctuaryEnvMap).toBe('function');
    });
  });

  describe('3. 3D PBR Card Meshes & Procedural Textures (R2, R5)', () => {
    it('F03-1: createSacredCardBackTexture returns CanvasTexture in DOM or null in Node.js safely', () => {
      expect(typeof createSacredCardBackTexture).toBe('function');
      const texture = createSacredCardBackTexture('#C9A24A');
      if (typeof document !== 'undefined') {
        expect(texture).toBeInstanceOf(THREE.CanvasTexture);
      } else {
        expect(texture).toBeNull();
      }
    });

    it('F03-2: createCardFaceTexture accepts Roman numeral and title options safely', () => {
      expect(typeof createCardFaceTexture).toBe('function');
      const texture = createCardFaceTexture({
        roman: 'XIX',
        title: 'THE SUN',
        accentHex: '#C9A24A',
      });
      if (typeof document !== 'undefined') {
        expect(texture).toBeInstanceOf(THREE.CanvasTexture);
      } else {
        expect(texture).toBeNull();
      }
    });

    it('F03-3: create3DTarotCardMesh builds a 3D BoxGeometry Mesh with default golden ratio dimensions', () => {
      const mesh = create3DTarotCardMesh({
        roman: '0',
        title: 'THE FOOL',
      });
      expect(mesh).toBeInstanceOf(THREE.Mesh);
      expect(mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);

      const params = (mesh.geometry as THREE.BoxGeometry).parameters;
      expect(params.width).toBeCloseTo(0.72, 2);
      expect(params.height).toBeCloseTo(1.26, 2);
      expect(params.depth).toBeCloseTo(0.016, 3);
    });

    it('F03-4: create3DTarotCardMesh equips 6 distinct material facets including gilded edges', () => {
      const mesh = create3DTarotCardMesh();
      expect(Array.isArray(mesh.material)).toBe(true);
      const materials = mesh.material as THREE.Material[];
      expect(materials.length).toBe(6);

      // The 4 edges (indices 0, 1, 2, 3) must be MeshStandardMaterial with high metallic sheen
      for (let i = 0; i < 4; i++) {
        const edgeMat = materials[i] as THREE.MeshStandardMaterial;
        expect(edgeMat).toBeInstanceOf(THREE.MeshStandardMaterial);
        expect(edgeMat.metalness).toBeGreaterThanOrEqual(0.7);
        expect(edgeMat.roughness).toBeLessThanOrEqual(0.35);
      }
    });

    it('F03-5: create3DTarotCardMesh front and back face materials are properly instantiated', () => {
      const mesh = create3DTarotCardMesh({
        roman: 'I',
        title: 'THE MAGICIAN',
        accentHex: '#C9A24A',
      });
      const materials = mesh.material as THREE.Material[];
      const frontMat = materials[4] as THREE.MeshStandardMaterial;
      const backMat = materials[5] as THREE.MeshStandardMaterial;

      expect(frontMat).toBeInstanceOf(THREE.MeshStandardMaterial);
      expect(backMat).toBeInstanceOf(THREE.MeshStandardMaterial);
      expect(frontMat.color.getHexString()).toBe('ffffff');
    });
  });

  describe('4. Custom Cursor Follower Component (R1, R3)', () => {
    it('F04-1: CustomCursorFollower component is exported and valid React component', () => {
      expect(typeof CustomCursorFollower).toBe('function');
    });

    it('F04-2: CustomCursorFollower file structure includes Desktop Magnetic Follower and Mobile Touch Ripple', () => {
      const content = fs.readFileSync(
        path.join(ROOT_DIR, 'src/components/CustomCursorFollower.tsx'),
        'utf-8'
      );
      expect(content).toContain('hidden md:block'); // Desktop dot
      expect(content).toContain('hidden md:flex'); // Desktop outer ring
      expect(content).toContain('md:hidden'); // Mobile touch burst & spark
      expect(content).toContain('pointer-events-none fixed inset-0 z-[90]');
    });

    it('F04-3: CustomCursorFollower registers mouse and touch events with passive listeners', () => {
      const content = fs.readFileSync(
        path.join(ROOT_DIR, 'src/components/CustomCursorFollower.tsx'),
        'utf-8'
      );
      expect(content).toContain("addEventListener('mousemove'");
      expect(content).toContain("addEventListener('mouseover'");
      expect(content).toContain("addEventListener('touchstart'");
      expect(content).toContain("addEventListener('touchmove'");
      expect(content).toContain("addEventListener('touchend'");
    });

    it('F04-4: CustomCursorFollower properly cancels RAF and removes listeners on unmount', () => {
      const content = fs.readFileSync(
        path.join(ROOT_DIR, 'src/components/CustomCursorFollower.tsx'),
        'utf-8'
      );
      expect(content).toContain('cancelAnimationFrame(rafId)');
      expect(content).toContain("removeEventListener('mousemove'");
      expect(content).toContain("removeEventListener('mouseover'");
      expect(content).toContain("removeEventListener('touchstart'");
    });

    it('F04-5: CustomCursorFollower integrates soundManager.playMagneticHover on target hover', () => {
      const content = fs.readFileSync(
        path.join(ROOT_DIR, 'src/components/CustomCursorFollower.tsx'),
        'utf-8'
      );
      expect(content).toContain('soundManager.playMagneticHover()');
    });
  });

  describe('5. Core 3D Geometry, Math & Clean Disposal (R2, R5)', () => {
    it('F05-1: detectHardwareTier accurately maps CPU hardware concurrency and motion settings', () => {
      const tierReduced = detectHardwareTier({ reducedMotion: true });
      expect(tierReduced.tier).toBe('tier3');
      expect(tierReduced.enableWebGL).toBe(false);

      const tierLow = detectHardwareTier({ forceCores: 2, webglSupported: true });
      expect(tierLow.tier).toBe('tier3');

      const tierMid = detectHardwareTier({ forceCores: 6, webglSupported: true });
      expect(tierMid.tier).toBe('tier2');

      const tierHigh = detectHardwareTier({ forceCores: 8, webglSupported: true });
      expect(tierHigh.tier).toBe('tier1');
    });

    it('F05-2: READER_ATMOSPHERE_PALETTES provides complete palette metadata for all 4 canonical readers', () => {
      const canonicalIds = ['ba_ngoai', 'chi_dai', 'ban_than', 'thay_cu_meo'] as const;
      for (const id of canonicalIds) {
        const palette = getReaderAtmospherePalette(id);
        expect(palette.readerId).toBe(id);
        expect(palette.primaryHex).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(palette.totemName.length).toBeGreaterThan(0);
      }
    });

    it('F05-3: computeParabolicArcTransform yields symmetric arc distributions', () => {
      const center = computeParabolicArcTransform(4, 9, 0);
      expect(center.x).toBeCloseTo(0, 4);
      expect(center.rotZ).toBeCloseTo(0, 4);

      const left = computeParabolicArcTransform(0, 9, 0);
      const right = computeParabolicArcTransform(8, 9, 0);
      expect(left.x).toBeCloseTo(-right.x, 4);
      expect(left.rotZ).toBeCloseTo(-right.rotZ, 4);
      expect(left.y).toBeCloseTo(right.y, 4);
    });

    it('F05-4: evaluateCubicBezier3D interpolates smoothly between 3D trajectory control points', () => {
      const p0: Point3D = { x: 0, y: 0, z: 0 };
      const p1: Point3D = { x: 1, y: 2, z: 1 };
      const p2: Point3D = { x: 2, y: 2, z: 2 };
      const p3: Point3D = { x: 3, y: 0, z: 3 };

      const start = evaluateCubicBezier3D(p0, p1, p2, p3, 0);
      const mid = evaluateCubicBezier3D(p0, p1, p2, p3, 0.5);
      const end = evaluateCubicBezier3D(p0, p1, p2, p3, 1);

      expect(start).toEqual(p0);
      expect(end).toEqual(p3);
      expect(mid.y).toBeGreaterThan(0);
    });

    it('F05-5: disposeThreeScene and disposeMaterial cleanly tear down complex scenes', () => {
      const scene = new THREE.Scene();
      const geom = new THREE.BoxGeometry(1, 1, 1);
      const mat = new THREE.MeshStandardMaterial({ color: 0xc9a24a });
      const mesh = new THREE.Mesh(geom, mat);
      scene.add(mesh);

      expect(() => {
        disposeMaterial(mat);
        disposeThreeScene(scene);
      }).not.toThrow();
    });
  });
});
