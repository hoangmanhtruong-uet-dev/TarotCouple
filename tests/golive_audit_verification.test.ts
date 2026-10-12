import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  buildTikTokCarouselKits,
  buildSpiritualWrappedForClient,
  resetAllQuotaStoreForTesting,
} from '../src/lib/quota-store';
import {
  getSupabaseConfigStatus,
  syncStarTransactionHybrid,
} from '../src/lib/supabase-hybrid';

function collectTsFiles(dirPath: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dirPath)) return results;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTsFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Go-Live Final Polish & Production Database Readiness Audit', () => {
  it('1. Zero legacy #D9B36A color tokens remain across src/app and src/components', () => {
    const rootDir = process.cwd();
    const targetFiles = [
      ...collectTsFiles(path.join(rootDir, 'src', 'app')),
      ...collectTsFiles(path.join(rootDir, 'src', 'components')),
    ];

    expect(targetFiles.length).toBeGreaterThan(35);

    const filesWithLegacyToken: string[] = [];
    for (const filePath of targetFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (/#D9B36A/i.test(content)) {
        filesWithLegacyToken.push(path.relative(rootDir, filePath));
      }
    }

    expect(filesWithLegacyToken).toEqual([]);
  });

  it('2. Growth Engine (buildTikTokCarouselKits, buildSpiritualWrappedForClient & TikTokStudioModal) uses 100% canonical 4 Readers', () => {
    resetAllQuotaStoreForTesting();
    const canonicalIds = new Set(['ba_ngoai', 'chi_dai', 'ban_than', 'thay_cu_meo']);
    const canonicalNames = new Set(['Bà Ngoại', 'Chị Đại', 'Bạn Thân', 'Thầy Cú Mèo']);

    const kits = buildTikTokCarouselKits();
    expect(kits.length).toBe(4);
    for (const kit of kits) {
      expect(canonicalIds.has(kit.readerId)).toBe(true);
      expect(canonicalNames.has(kit.readerName)).toBe(true);
    }

    const wrapped = buildSpiritualWrappedForClient('audit_client_01');
    expect(canonicalIds.has(wrapped.favoriteReaderId)).toBe(true);
    expect(canonicalNames.has(wrapped.favoriteReaderName)).toBe(true);

    const studioContent = fs.readFileSync(
      path.join(process.cwd(), 'src', 'components', 'TikTokStudioModal.tsx'),
      'utf-8'
    );
    expect(studioContent).toContain("readerId: 'chi_dai'");
    expect(studioContent).toContain("readerId: 'thay_cu_meo'");
    expect(studioContent).toContain("readerId: 'ba_ngoai'");
    expect(studioContent).not.toContain('ba_co_mo_hon');
    expect(studioContent).not.toContain('tong_tai_ly_tri');
    expect(studioContent).not.toContain('tien_tu_chua_lanh');
  });

  it('3. Supabase Production SQL Migration contains all 6 core tables, append-only trigger, RLS policies, and atomic_star_transaction RPC', () => {
    const sqlPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      '001_tarot_couple_golive_schema.sql'
    );
    expect(fs.existsSync(sqlPath)).toBe(true);

    const sql = fs.readFileSync(sqlPath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.profiles');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.quota_usage');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.wallet_ledger');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.orders');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.readings');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.couple_rooms');

    // Append-only trigger on wallet_ledger
    expect(sql).toContain('prevent_wallet_ledger_mutation');
    expect(sql).toContain('trg_wallet_ledger_append_only');

    // Atomic RPC function with FOR UPDATE row lock & idempotency_key
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.atomic_star_transaction');
    expect(sql).toContain('FOR UPDATE');
    expect(sql).toContain('idempotency_key');

    // Row Level Security enabled on all 6 tables
    expect(sql).toContain('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE public.quota_usage ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE public.couple_rooms ENABLE ROW LEVEL SECURITY');
  });

  it('4. Hybrid Supabase Adapter & .env.example operate cleanly in local_memory fallback mode', async () => {
    const envExamplePath = path.join(process.cwd(), '.env.example');
    expect(fs.existsSync(envExamplePath)).toBe(true);
    const envExample = fs.readFileSync(envExamplePath, 'utf-8');
    expect(envExample).toContain('GEMINI_API_KEY');
    expect(envExample).toContain('PAYOS_CLIENT_ID');
    expect(envExample).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(envExample).toContain('SUPABASE_SERVICE_ROLE_KEY');

    const status = getSupabaseConfigStatus();
    expect(status.mode).toBe('local_memory');

    const txResult = await syncStarTransactionHybrid({
      userId: 'local_test_user',
      deltaStars: 5,
      reason: 'DAILY_STREAK_DAY7',
      idempotencyKey: 'idem_local_test_001',
    });
    expect(txResult.success).toBe(true);
    expect(txResult.syncedToSupabase).toBe(false);
  });
});
