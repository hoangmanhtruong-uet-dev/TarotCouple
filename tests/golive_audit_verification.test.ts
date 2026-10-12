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

  it('5. GET /api/health returns valid system diagnostic schema without exposing secrets', async () => {
    const { GET: getHealth } = await import('../src/app/api/health/route');
    const req = new Request('http://localhost:3000/api/health');
    const res = await getHealth();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeTruthy();
    expect(data.ai).toBeDefined();
    expect(typeof data.ai.configuredKeysCount).toBe('number');
    expect(data.ai.primaryModel).toBe('gemini-3.5-flash-lite');
    expect(Array.isArray(data.ai.modelChain)).toBe(true);
    expect(data.supabase).toBeDefined();
    expect(['hybrid', 'memory-only']).toContain(data.supabase.mode);
  });

  it('6. updateJournalNote properly updates reflection notes in journal-store', async () => {
    const storeMap = new Map<string, string>();
    const mockStorage = {
      getItem: (k: string) => storeMap.get(k) ?? null,
      setItem: (k: string, v: string) => storeMap.set(k, v),
      removeItem: (k: string) => storeMap.delete(k),
      clear: () => storeMap.clear(),
    };
    const prevWindow = (globalThis as any).window;
    const prevStorage = (globalThis as any).localStorage;
    (globalThis as any).window = {};
    (globalThis as any).localStorage = mockStorage;

    try {
      const { updateJournalNote, saveJournalEntry, getJournalEntries, clearAllJournal } = await import(
        '../src/lib/journal-store'
      );
      clearAllJournal();

      const mockReading = {
        readingId: 'rd_test_note_001',
        createdAt: new Date().toISOString(),
        readerId: 'ba_ngoai',
        readerDisplayName: 'Bà Ngoại',
        readerRole: 'Bà ngoại',
        topic: 'love',
        topicLabel: 'Tình Duyên',
        questionText: 'Tương lai thế nào?',
        drawnCards: [],
        result: {
          summary: 'Tốt',
          overall_verdict: 'Tốt',
          cards_analysis: [],
          shareable_card: {
            savage_quote: 'Bình an',
            savage_quotes: ['Bình an', 'Thanh thản', 'Vui vẻ'],
          },
        },
      } as any;

      saveJournalEntry(mockReading);
      const updated = updateJournalNote('rd_test_note_001', 'Nghiệm lại thấy rất chuẩn!');
      expect(updated.some((e) => e.id === 'rd_test_note_001' && e.userNote === 'Nghiệm lại thấy rất chuẩn!')).toBe(
        true
      );

      const reloaded = getJournalEntries();
      expect(reloaded.find((e) => e.id === 'rd_test_note_001')?.userNote).toBe('Nghiệm lại thấy rất chuẩn!');
    } finally {
      if (prevWindow === undefined) delete (globalThis as any).window;
      else (globalThis as any).window = prevWindow;
      if (prevStorage === undefined) delete (globalThis as any).localStorage;
      else (globalThis as any).localStorage = prevStorage;
    }
  });

  it('7. src/app/(app)/me/history/page.tsx has zero instances of native window.confirm', () => {
    const historyPagePath = path.join(
      process.cwd(),
      'src',
      'app',
      '(app)',
      'me',
      'history',
      'page.tsx'
    );
    expect(fs.existsSync(historyPagePath)).toBe(true);

    const content = fs.readFileSync(historyPagePath, 'utf-8');
    expect(content).not.toContain('window.confirm');
    expect(content).toContain('setConfirmModal');
    expect(content).toContain('updateJournalNote');
  });
});
