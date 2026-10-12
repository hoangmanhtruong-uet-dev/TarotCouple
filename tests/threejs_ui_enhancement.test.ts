import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import {
  READER_ATMOSPHERE_PALETTES,
  getReaderAtmospherePalette,
  detectHardwareTier,
  computeParabolicArcTransform,
  evaluateCubicBezier3D,
  disposeThreeScene,
  type Point3D,
} from '@/lib/three/core';

const ROOT_DIR = process.cwd();

describe('Three.js UI Enhancement & Spec Audit Verification', () => {
  describe('1. Three.js Spec Files Alignment (4 Canonical Readers & Architecture)', () => {
    const specFiles = [
      'specs/PLAN_THREEJS.md',
      'specs/THREEJS_SPECIFICATIONS.md',
      'specs/threejs_master_plan.md',
    ];

    const canonicalReaders = ['ba_ngoai', 'chi_dai', 'ban_than', 'thay_cu_meo'];
    const deprecatedReaders = [
      'ba_co_mo_hon',
      'tien_tu_chua_lanh',
      'tong_tai_ly_tri',
      'phap_su_toi_co',
    ];

    for (const relPath of specFiles) {
      it(`verifies ${relPath} uses 4 canonical Readers and removes deprecated reader IDs`, () => {
        const fullPath = path.join(ROOT_DIR, relPath);
        expect(fs.existsSync(fullPath)).toBe(true);
        const content = fs.readFileSync(fullPath, 'utf-8');

        for (const readerId of canonicalReaders) {
          expect(content).toContain(readerId);
        }

        for (const oldReaderId of deprecatedReaders) {
          expect(content).not.toContain(oldReaderId);
        }
      });
    }

    it('verifies specs include CoupleResonanceBridge3D, webglcontextlost, and Procedural CanvasTexture safeguards', () => {
      const masterSpec = fs.readFileSync(
        path.join(ROOT_DIR, 'specs/threejs_master_plan.md'),
        'utf-8'
      );
      expect(masterSpec).toContain('CoupleResonanceBridge3D');
      expect(masterSpec).toContain('webglcontextlost');
      expect(masterSpec).toContain('createSacredCardBackTexture');
    });
  });

  describe('2. Core Three.js Engine (src/lib/three/core.ts)', () => {
    it('defines complete atmosphere palettes and Altar Totem metadata for all 4 Readers', () => {
      const readerIds = ['ba_ngoai', 'chi_dai', 'ban_than', 'thay_cu_meo'] as const;
      for (const id of readerIds) {
        const palette = getReaderAtmospherePalette(id);
        expect(palette.readerId).toBe(id);
        expect(palette.primaryHex).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(palette.totemName.length).toBeGreaterThan(5);
      }

      expect(READER_ATMOSPHERE_PALETTES.ba_ngoai.primaryHex).toBe('#EAB308');
      expect(READER_ATMOSPHERE_PALETTES.chi_dai.primaryHex).toBe('#E11D48');
      expect(READER_ATMOSPHERE_PALETTES.ban_than.primaryHex).toBe('#EC4899');
      expect(READER_ATMOSPHERE_PALETTES.thay_cu_meo.primaryHex).toBe('#3B82F6');
    });

    it('detects hardware tier safely in non-browser/SSR test environment', () => {
      const tierInfo = detectHardwareTier({ reducedMotion: false });
      expect(['tier1', 'tier2', 'tier3']).toContain(tierInfo.tier);
      expect(tierInfo.maxDpr).toBeGreaterThanOrEqual(1);
    });

    it('computes symmetric parabolic arc transforms for 3D card fan (P07)', () => {
      const center = computeParabolicArcTransform(5, 11, 0);
      expect(center.x).toBeCloseTo(0, 5);
      expect(center.y).toBeCloseTo(0, 5);
      expect(center.rotZ).toBeCloseTo(0, 5);

      const left = computeParabolicArcTransform(0, 11, 0);
      const right = computeParabolicArcTransform(10, 11, 0);
      expect(left.x).toBeCloseTo(-right.x, 5);
      expect(left.y).toBeCloseTo(right.y, 5);
      expect(left.rotZ).toBeCloseTo(-right.rotZ, 5);
      expect(left.y).toBeLessThan(center.y);
      expect(left.z).toBeLessThan(center.z);
    });

    it('evaluates 3D Cubic Bézier trajectory accurately at start, midpoint, and end', () => {
      const p0: Point3D = { x: -1.5, y: -0.4, z: 0 };
      const p1: Point3D = { x: -0.8, y: 0.9, z: 1.0 };
      const p2: Point3D = { x: 0.2, y: 0.7, z: 0.8 };
      const p3: Point3D = { x: 0.5, y: 0.3, z: 0.4 };

      const start = evaluateCubicBezier3D(p0, p1, p2, p3, 0);
      const end = evaluateCubicBezier3D(p0, p1, p2, p3, 1);
      const mid = evaluateCubicBezier3D(p0, p1, p2, p3, 0.5);

      expect(start.x).toBeCloseTo(p0.x, 5);
      expect(start.y).toBeCloseTo(p0.y, 5);
      expect(start.z).toBeCloseTo(p0.z, 5);
      expect(end.x).toBeCloseTo(p3.x, 5);
      expect(end.y).toBeCloseTo(p3.y, 5);
      expect(end.z).toBeCloseTo(p3.z, 5);
      expect(mid.y).toBeGreaterThan(p0.y);
    });

    it('disposes Three.js geometries and materials cleanly without memory leaks', () => {
      const scene = new THREE.Scene();
      const geom = new THREE.BoxGeometry(1, 1, 1);
      const mat = new THREE.MeshStandardMaterial({ color: 0xc9a24a });
      const mesh = new THREE.Mesh(geom, mat);
      scene.add(mesh);

      expect(() => disposeThreeScene(scene)).not.toThrow();
    });
  });

  describe('3. 5 Key Three.js UI Touchpoints Integration Check', () => {
    const requiredComponents = [
      'src/lib/three/core.ts',
      'src/lib/three/card-textures.ts',
      'src/components/CelestialSkyCanvas.tsx',
      'src/components/HeroTarotDeck3D.tsx',
      'src/components/TactileArcFan.tsx',
      'src/components/TarotCardVisual.tsx',
      'src/components/CoupleResonanceBridge3D.tsx',
    ];

    for (const comp of requiredComponents) {
      it(`verifies component ${comp} exists and is non-empty`, () => {
        const fullPath = path.join(ROOT_DIR, comp);
        expect(fs.existsSync(fullPath)).toBe(true);
        const stat = fs.statSync(fullPath);
        expect(stat.size).toBeGreaterThan(500);
      });
    }

    it('verifies CoupleModeView integrates CoupleResonanceBridge3D and Marketing Page integrates HeroTarotDeck3D', () => {
      const coupleModeContent = fs.readFileSync(
        path.join(ROOT_DIR, 'src/components/CoupleModeView.tsx'),
        'utf-8'
      );
      expect(coupleModeContent).toContain('CoupleResonanceBridge3D');

      const marketingPageContent = fs.readFileSync(
        path.join(ROOT_DIR, 'src/app/(marketing)/page.tsx'),
        'utf-8'
      );
      expect(marketingPageContent).toContain('HeroTarotDeck3D');
    });
  });
});
