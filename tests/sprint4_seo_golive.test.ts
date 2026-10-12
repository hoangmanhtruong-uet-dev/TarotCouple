import { describe, it, expect } from 'vitest';
import {
  ALL_TAROT_CARDS,
  getCardSlug,
  getCardBySlug,
  TAROT_CARDS_BY_SLUG,
} from '@/data/tarot-cards';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import { generateStaticParams, generateMetadata } from '@/app/(app)/cards/[slug]/page';
import { CRISIS_SUPPORT_DATA, classifyAgeTier } from '@/lib/safety';

describe('Sprint 4: P22 78-Card SEO SSG, Sitemap, Robots & P24 Go-Live Hardening', () => {
  it('1. Generates 78 unique SEO-friendly slugs for all 78 Tarot cards and resolves by slug or numeric ID', () => {
    expect(ALL_TAROT_CARDS).toHaveLength(78);

    const slugs = ALL_TAROT_CARDS.map((card) => getCardSlug(card));
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(78);

    // Check specific canonical slugs
    expect(getCardBySlug('the-fool')?.id).toBe(0);
    expect(getCardBySlug('the-lovers')?.id).toBe(6);
    expect(getCardBySlug('the-sun')?.id).toBe(19);
    expect(getCardBySlug('king-of-pentacles')?.id).toBe(77);

    // Check numeric ID string fallback
    expect(getCardBySlug('0')?.name_en).toBe('The Fool');
    expect(getCardBySlug('77')?.name_en).toBe('King of Pentacles');
    expect(getCardBySlug('non-existent-card')).toBeUndefined();
    expect(Object.keys(TAROT_CARDS_BY_SLUG)).toHaveLength(78);
  });

  it('2. generateStaticParams returns all 78 card slugs and generateMetadata builds Vietnamese SEO metadata', async () => {
    const paramsList = await generateStaticParams();
    expect(paramsList).toHaveLength(78);
    expect(paramsList[0]).toEqual({ slug: 'the-fool' });

    const meta = await generateMetadata({
      params: Promise.resolve({ slug: 'the-lovers' }),
    });
    expect(meta.title).toContain('The Lovers');
    expect(meta.description).toContain('Rider-Waite-Smith 1909');
    expect(meta.openGraph?.type).toBe('article');
  });

  it('3. sitemap() includes all 78 card detail URLs plus core static routes (>= 83 URLs)', () => {
    const entries = sitemap();
    expect(entries.length).toBeGreaterThanOrEqual(83);

    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.endsWith('/cards/the-fool'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/cards/king-of-pentacles'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/couple'))).toBe(true);
  });

  it('4. robots() allows public crawling while disallowing /admin/, /api/, and /studio/', () => {
    const rulesObj = robots();
    expect(rulesObj.sitemap).toContain('/sitemap.xml');
    const rules = Array.isArray(rulesObj.rules) ? rulesObj.rules[0] : rulesObj.rules;
    expect(rules?.disallow).toContain('/admin/');
    expect(rules?.disallow).toContain('/api/');
  });

  it('5. Go-Live Safety & Legal Guardrails: National Child Hotline 111 and <11yo payment block are active', () => {
    const hotlinesText = JSON.stringify(CRISIS_SUPPORT_DATA.hotlines);
    expect(hotlinesText).toContain('111');
    expect(hotlinesText).toContain('115');
    expect(hotlinesText).toContain('096 306 1414');

    // <11yo payment block (birthYear 2016 in 2026 -> 10yo)
    const kidPolicy = classifyAgeTier(2016, 2026, 'chi_dai');
    expect(kidPolicy.age).toBe(10);
    expect(kidPolicy.paymentEnabled).toBe(false);

    // >=11yo payment enabled (birthYear 2015 in 2026 -> 11yo)
    const preTeenPolicy = classifyAgeTier(2015, 2026, 'chi_dai');
    expect(preTeenPolicy.age).toBe(11);
    expect(preTeenPolicy.paymentEnabled).toBe(true);
    expect(preTeenPolicy.dailySpendCapVnd).toBe(50000);
  });
});
