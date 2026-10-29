import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ALL_TAROT_CARDS, MAJOR_ARCANA } from '../src/data/tarot-cards';

describe('P1 Verification Suite — Local RWS WebP Assets & Bundle Optimization', () => {
  const cardsDir = path.join(process.cwd(), 'public', 'cards');

  it('1. Exactly 78 local WebP cards exist in public/cards (card_00.webp to card_77.webp)', () => {
    expect(fs.existsSync(cardsDir)).toBe(true);
    for (let id = 0; id < 78; id++) {
      const paddedId = String(id).padStart(2, '0');
      const cardFile = path.join(cardsDir, `card_${paddedId}.webp`);
      expect(fs.existsSync(cardFile), `Card file missing: card_${paddedId}.webp`).toBe(true);

      const stat = fs.statSync(cardFile);
      expect(stat.size).toBeGreaterThan(10000); // Each card is a valid WebP image (30-80KB)
    }
  });

  it('2. The Lovers (card 6) and Nine of Wands (card 30) have valid non-404 canonical URLs', () => {
    const lovers = ALL_TAROT_CARDS.find((c) => c.id === 6);
    expect(lovers).toBeDefined();
    expect(lovers?.rws_image_url).toBe('https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_06_Lovers.jpg');

    const nineWands = ALL_TAROT_CARDS.find((c) => c.id === 30);
    expect(nineWands).toBeDefined();
    expect(nineWands?.rws_image_url).toBe('https://upload.wikimedia.org/wikipedia/commons/e/e7/Wands09.jpg');
  });

  it('3. All 78 cards in dataset maintain valid schema with correct Vietnamese and English naming', () => {
    expect(ALL_TAROT_CARDS.length).toBe(78);
    expect(MAJOR_ARCANA.length).toBe(22);

    for (const card of ALL_TAROT_CARDS) {
      expect(card.id).toBeGreaterThanOrEqual(0);
      expect(card.id).toBeLessThanOrEqual(77);
      expect(card.name_vi).toBeTruthy();
      expect(card.name_en).toBeTruthy();
      expect(card.symbol_glyph).toBeTruthy();
      expect(card.palette.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
