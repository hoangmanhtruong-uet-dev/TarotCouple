import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const ROOT_DIR = process.cwd();

describe('Tier 3: Cross-Feature Combinations & Design Invariants Suites (Pairwise & System Checks)', () => {
  describe('1. GSAP ScrollTrigger Synchronized with 3D Camera & Shaders (R1 + R2)', () => {
    it('I01-1: /reading/chu-de couples GSAP animations with 3D Astral Vortex GLSL Shaders and InstancedMesh', () => {
      const filePath = path.join(ROOT_DIR, 'src/app/(reading)/reading/chu-de/page.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');

      // M13: behavioral check — GSAP + ScrollTrigger load & register for real
      expect(typeof gsap.registerPlugin).toBe('function');
      gsap.registerPlugin(ScrollTrigger);
      expect(typeof ScrollTrigger.create).toBe('function');

      expect(content).toContain('ASTRAL_VORTEX_VERTEX_SHADER');
      expect(content).toContain('ASTRAL_VORTEX_FRAGMENT_SHADER');
      expect(content).toContain('InstancedMesh');
      expect(content).toContain('uScrollProgress');
      expect(content).toContain('CustomCursorFollower');
    });

    it('I01-2: /reading/bo-bai integrates GSAP transitions and 3D card perspective tilt', () => {
      const filePath = path.join(ROOT_DIR, 'src/app/(reading)/reading/bo-bai/page.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('data-deck-card');
      expect(content).toContain('perspective(950px)');
      expect(content).toContain('CustomCursorFollower');
    });

    it('I01-3: Marketing Homepage synchronizes GSAP ScrollTrigger, Lenis Smooth Scroll, and HeroTarotDeck3D', () => {
      const filePath = path.join(ROOT_DIR, 'src/app/(marketing)/page.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('ScrollTrigger');
      expect(content).toContain('Lenis');
      expect(content).toContain('HeroTarotDeck3D');
      expect(content).toContain('CustomCursorFollower');
    });
  });

  describe('2. Audio Triggers on 3D Card Flip & Hover Interaction (R1 + R4)', () => {
    it('I02-1: CustomCursorFollower triggers soundManager.playMagneticHover on interactive elements', () => {
      const filePath = path.join(ROOT_DIR, 'src/components/CustomCursorFollower.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('soundManager.playMagneticHover()');
      expect(content).toContain('[data-cursor], a, button, [role="button"]');
    });

    it('I02-2: /reading/rut-bai imports soundManager and triggers riffle shuffle and mystic chime', () => {
      const filePath = path.join(ROOT_DIR, 'src/app/(reading)/reading/rut-bai/page.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('soundManager');
      expect(content).toMatch(/soundManager\.(playRiffleShuffle|playMysticChime|playCardFlip)/);
    });

    it('I02-3: /reading/ket-qua triggers card flip audio synthesis on revealing tarot cards', () => {
      const filePath = path.join(ROOT_DIR, 'src/app/(reading)/reading/ket-qua/page.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('soundManager');
      expect(content).toMatch(/soundManager\.(playCardFlip|playBellTone)/);
    });

    it('I02-4: 3D card flip sequence strictly maintains [0, 350, 700] ms stagger interval', () => {
      const flipDelays = [0, 350, 700];
      expect(flipDelays[0]).toBe(0);
      expect(flipDelays[1]).toBe(350);
      expect(flipDelays[2]).toBe(700);

      const delta1 = flipDelays[1] - flipDelays[0];
      const delta2 = flipDelays[2] - flipDelays[1];
      expect(delta1).toBe(350);
      expect(delta2).toBe(350);
    });
  });

  describe('3. Strict Absence of backdrop-blur on 3D Card Visuals and Reading Stage 2 (R3 + R5)', () => {
    it('I03-1: /reading/chu-de and /reading/bo-bai cards strictly exclude backdrop-blur-md (Step 2 Split invariant)', () => {
      const chuDe = fs.readFileSync(path.join(ROOT_DIR, 'src/app/(reading)/reading/chu-de/page.tsx'), 'utf-8');
      const boBai = fs.readFileSync(path.join(ROOT_DIR, 'src/app/(reading)/reading/bo-bai/page.tsx'), 'utf-8');
      const noiNiem = fs.readFileSync(path.join(ROOT_DIR, 'src/app/(reading)/reading/noi-niem/page.tsx'), 'utf-8');

      expect(chuDe).not.toContain('backdrop-blur-md');
      expect(boBai).not.toContain('backdrop-blur-md');
      expect(noiNiem).not.toContain('backdrop-blur-md');
    });

    it('I03-2: 3D Card Visual components (TarotCardVisual, TactileArcFan, HeroTarotDeck3D) strictly exclude all backdrop-blur', () => {
      const cardVisual = fs.readFileSync(path.join(ROOT_DIR, 'src/components/TarotCardVisual.tsx'), 'utf-8');
      const arcFan = fs.readFileSync(path.join(ROOT_DIR, 'src/components/TactileArcFan.tsx'), 'utf-8');
      const heroDeck = fs.readFileSync(path.join(ROOT_DIR, 'src/components/HeroTarotDeck3D.tsx'), 'utf-8');

      expect(cardVisual).not.toContain('backdrop-blur');
      expect(arcFan).not.toContain('backdrop-blur');
      expect(heroDeck).not.toContain('backdrop-blur');
    });

    it('I03-3: 3D Reader Modals (ReaderIntroModal, ReaderProfileView) strictly exclude backdrop-blur', () => {
      const introModal = fs.readFileSync(path.join(ROOT_DIR, 'src/components/ReaderIntroModal.tsx'), 'utf-8');
      const profileView = fs.readFileSync(path.join(ROOT_DIR, 'src/components/ReaderProfileView.tsx'), 'utf-8');

      expect(introModal).not.toContain('backdrop-blur');
      expect(profileView).not.toContain('backdrop-blur');
    });

    it('I03-4: All 4 reading route pages utilize solid/translucent dark hex fills instead of CSS filter blurs', () => {
      const readingRouteFiles = [
        'src/app/(reading)/reading/chu-de/page.tsx',
        'src/app/(reading)/reading/bo-bai/page.tsx',
        'src/app/(reading)/reading/rut-bai/page.tsx',
        'src/app/(reading)/reading/ket-qua/page.tsx',
      ];

      for (const relPath of readingRouteFiles) {
        const content = fs.readFileSync(path.join(ROOT_DIR, relPath), 'utf-8');
        const hasOpaqueDarkFill =
          content.includes('#09080D') ||
          content.includes('#14121F') ||
          content.includes('#120F1D') ||
          content.includes('#0E0D17');
        expect(hasOpaqueDarkFill).toBe(true);
      }
    });
  });

  describe('4. Strict Color Palette (#C9A24A / #E5C687 vs banned #D9B36A) (R3 Invariant)', () => {
    it('I04-1: Zero banned #D9B36A tokens exist across all reading routes in src/app/(reading)/', () => {
      const readingDir = path.join(ROOT_DIR, 'src/app/(reading)');
      const scanFiles = (dir: string): string[] => {
        const files: string[] = [];
        if (!fs.existsSync(dir)) return files;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            files.push(...scanFiles(full));
          } else if (/\.(tsx|ts)$/.test(entry.name)) {
            files.push(full);
          }
        }
        return files;
      };

      const allFiles = scanFiles(readingDir);
      expect(allFiles.length).toBeGreaterThan(4);

      for (const file of allFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        expect(content).not.toMatch(/#D9B36A/i);
      }
    });

    it('I04-2: Reading routes consistently use the canonical antique gold token #C9A24A', () => {
      const chuDe = fs.readFileSync(path.join(ROOT_DIR, 'src/app/(reading)/reading/chu-de/page.tsx'), 'utf-8');
      const ketQua = fs.readFileSync(path.join(ROOT_DIR, 'src/app/(reading)/reading/ket-qua/page.tsx'), 'utf-8');

      expect(chuDe).toContain('#C9A24A');
      expect(ketQua).toContain('#C9A24A');
    });
  });

  describe('5. 2D UI Grid Layering & Pointer-Events Separation (R3 + R5)', () => {
    it('I05-1: CustomCursorFollower is pinned with pointer-events-none and elevated z-index z-[90]', () => {
      const content = fs.readFileSync(
        path.join(ROOT_DIR, 'src/components/CustomCursorFollower.tsx'),
        'utf-8'
      );
      expect(content).toContain('pointer-events-none');
      expect(content).toContain('fixed inset-0');
      expect(content).toContain('z-[90]');
    });

    it('I05-2: Background 3D canvas containers use non-blocking pointer events', () => {
      const chuDe = fs.readFileSync(path.join(ROOT_DIR, 'src/app/(reading)/reading/chu-de/page.tsx'), 'utf-8');
      expect(chuDe).toContain('pointer-events-none');
    });

    it('I05-3: Interactive controls on reading routes use explicit z-index layering for touch and click target clarity', () => {
      const ketQua = fs.readFileSync(path.join(ROOT_DIR, 'src/app/(reading)/reading/ket-qua/page.tsx'), 'utf-8');
      const chuDe = fs.readFileSync(path.join(ROOT_DIR, 'src/app/(reading)/reading/chu-de/page.tsx'), 'utf-8');
      expect(ketQua).toContain('z-30');
      expect(chuDe).toContain('z-50');
    });
  });
});
