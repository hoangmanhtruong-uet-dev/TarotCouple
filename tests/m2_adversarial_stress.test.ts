import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkSupabaseHealth,
  fetchCoupleRoomFromSupabase,
  getSupabaseConfigStatus,
  syncCoupleRoomHybrid,
} from '../src/lib/supabase-hybrid';
import { GET as getHealth } from '../src/app/api/health/route';
import { GET as getCouple, POST as postCouple } from '../src/app/api/couple/route';
import {
  getCoupleRoom,
  saveCoupleRoom,
  resetAllQuotaStoreForTesting,
  type StoredCoupleRoom,
} from '../src/lib/quota-store';
import { MAJOR_ARCANA } from '../src/data/tarot-cards';

describe('Milestone 2 Adversarial Stress & Edge Case Test Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    resetAllQuotaStoreForTesting();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe('1. checkSupabaseHealth() Adversarial Resilience & Edge Cases', () => {
    it('1.1 Handles unconfigured / empty credentials safely without network activity', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const health = await checkSupabaseHealth();
      expect(health).toEqual({
        mode: 'memory-only',
        connected: false,
        tablesReady: false,
        missingTables: ['profiles', 'readings', 'couple_rooms'],
      });
    });

    it('1.2 Handles invalid non-http URL safely as memory-only', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'ftp://invalid-host.com';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_key_123';

      const health = await checkSupabaseHealth();
      expect(health.mode).toBe('memory-only');
      expect(health.connected).toBe(false);
      expect(health.tablesReady).toBe(false);
    });

    it('1.3 Handles network connection refused, timeout, or DNS failure without throwing', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.test';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_secret_key';

      // Mock fetch rejection (e.g. ECONNREFUSED)
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
        new Error('fetch failed: ECONNREFUSED')
      );

      const health = await checkSupabaseHealth();
      expect(health).toEqual({
        mode: 'hybrid',
        connected: false,
        tablesReady: false,
        missingTables: ['profiles', 'readings', 'couple_rooms'],
      });
    });

    it('1.4 Handles HTTP error responses (401, 500, 502, 503) from PostgREST', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.test';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_secret_key';

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Unauthorized', { status: 401 })
      );

      const health401 = await checkSupabaseHealth();
      expect(health401.connected).toBe(false);
      expect(health401.tablesReady).toBe(false);

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Bad Gateway', { status: 502 })
      );

      const health502 = await checkSupabaseHealth();
      expect(health502.connected).toBe(false);
      expect(health502.tablesReady).toBe(false);
    });

    it('1.5 Handles malformed / non-JSON responses from PostgREST without crashing', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.test';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_secret_key';

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('<html><body>Cloudflare Error</body></html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        })
      );

      const health = await checkSupabaseHealth();
      expect(health.connected).toBe(false);
      expect(health.tablesReady).toBe(false);
      expect(health.missingTables).toEqual(['profiles', 'readings', 'couple_rooms']);
    });

    it('1.6 Accurately parses OpenAPI 3.0 schemas (components.schemas)', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.test';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_secret_key';

      const mockOpenApi3 = {
        openapi: '3.0.0',
        components: {
          schemas: {
            profiles: { type: 'object' },
            readings: { type: 'object' },
            couple_rooms: { type: 'object' },
            orders: { type: 'object' },
          },
        },
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockOpenApi3), { status: 200 })
      );

      const health = await checkSupabaseHealth();
      expect(health.mode).toBe('hybrid');
      expect(health.connected).toBe(true);
      expect(health.tablesReady).toBe(true);
      expect(health.missingTables).toEqual([]);
    });

    it('1.7 Accurately parses Swagger 2.0 definitions', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.test';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_secret_key';

      const mockSwagger2 = {
        swagger: '2.0',
        definitions: {
          profiles: { type: 'object' },
          readings: { type: 'object' },
          couple_rooms: { type: 'object' },
        },
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockSwagger2), { status: 200 })
      );

      const health = await checkSupabaseHealth();
      expect(health.connected).toBe(true);
      expect(health.tablesReady).toBe(true);
      expect(health.missingTables).toEqual([]);
    });

    it('1.8 Accurately identifies partial missing tables', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.test';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_secret_key';

      const mockPartialSpec = {
        definitions: {
          profiles: { type: 'object' },
          // readings and couple_rooms are missing
        },
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockPartialSpec), { status: 200 })
      );

      const health = await checkSupabaseHealth();
      expect(health.connected).toBe(true);
      expect(health.tablesReady).toBe(false);
      expect(health.missingTables).toEqual(['readings', 'couple_rooms']);
    });
  });

  describe('2. fetchCoupleRoomFromSupabase() Adversarial Edge Cases & Boundaries', () => {
    it('2.1 Rejects empty, whitespace, null, or malformed roomCode without calling network', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      expect(await fetchCoupleRoomFromSupabase('')).toBeNull();
      expect(await fetchCoupleRoomFromSupabase('   ')).toBeNull();
      // @ts-expect-error test non-string input
      expect(await fetchCoupleRoomFromSupabase(null)).toBeNull();
      // @ts-expect-error test non-string input
      expect(await fetchCoupleRoomFromSupabase(undefined)).toBeNull();
      // @ts-expect-error test non-string input
      expect(await fetchCoupleRoomFromSupabase(12345)).toBeNull();

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('2.2 Safely escapes SQL injection and special character attacks in roomCode', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.test';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_secret_key';

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify([]), { status: 200 })
      );

      const maliciousCode = "LUV123' OR '1'='1; DROP TABLE couple_rooms;--";
      const result = await fetchCoupleRoomFromSupabase(maliciousCode);
      expect(result).toBeNull();

      expect(fetchSpy).toHaveBeenCalled();
      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      expect(calledUrl).toContain('room_code=eq.');
      // Ensure raw unencoded single quotes or semicolons are safely encoded
      expect(calledUrl).not.toContain("' OR '1'='1");
      expect(calledUrl).toContain(encodeURIComponent(maliciousCode.trim().toUpperCase()));
    });

    it('2.3 Reconstructs valid room with complete domain entities from DB row', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.test';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_secret_key';

      const mockDbRow = {
        room_code: 'ROMANCE777',
        owner_id: 'client_owner_123',
        owner_nickname: 'Anh Long',
        owner_birth_year: 2000,
        owner_question_text: 'Có nên tỏ tình tuần này không?',
        owner_card_id: 1, // The Magician
        owner_reversed: false,
        partner_nickname: 'Em Mai',
        partner_birth_year: 2002,
        partner_card_id: 2, // The High Priestess
        partner_reversed: true,
        bridge_card_id: 6, // The Lovers
        bridge_reversed: false,
        reader_id: 'ba_ngoai',
        status: 'completed',
        compatibility_score: 92,
        red_flag_level: 12,
        full_reading: {
          status: 'ok',
          readingId: 'reading_couple_test_01',
          result: {
            overall_verdict: 'Hai bạn có sự bù trừ tuyệt vời.',
            cards_analysis: [
              { position_index: 0, interpretation: 'Năng lượng chủ động.' },
              { position_index: 1, interpretation: 'Năng lượng bí ẩn.' },
              { position_index: 2, interpretation: 'Kết nối sâu sắc.' },
            ],
            advice: 'Hãy mở lời chân thành.',
            savage_quote: 'Đừng đợi đến mùa quýt mới tỏ tình nha!',
          },
          relationshipStatus: 'crush',
          deckMode: 'major_22',
        },
        created_at: '2026-10-12T10:00:00.000Z',
        expires_at: '2026-10-14T10:00:00.000Z',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify([mockDbRow]), { status: 200 })
      );

      const room = await fetchCoupleRoomFromSupabase('romance777');
      expect(room).not.toBeNull();
      expect(room?.roomCode).toBe('ROMANCE777');
      expect(room?.ownerNickname).toBe('Anh Long');
      expect(room?.ownerCard.card.name_en).toBe('The Magician');
      expect(room?.partnerCard?.card.name_en).toBe('The High Priestess');
      expect(room?.partnerCard?.reversed).toBe(true);
      expect(room?.connectionCard?.card.name_en).toBe('The Lovers');
      expect(room?.status).toBe('completed');
      expect(room?.relationshipStatus).toBe('crush');
      expect(room?.relationshipLabel).toBe('Crush đơn phương');
      expect(room?.readingResult?.metrics?.compatibility_score).toBe(92);
      expect(room?.readingResult?.metrics?.entertainment_note).toBe('Chỉ để giải trí');
    });

    it('2.4 Handles obsolete / non-canonical reader IDs and corrupted card IDs gracefully', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.test';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_secret_key';

      const mockDbRow = {
        room_code: 'LEGACY123',
        owner_id: 'owner_legacy',
        owner_nickname: 'Test User',
        owner_birth_year: 2001,
        owner_question_text: '',
        owner_card_id: 9999, // Out of bounds ID -> fallback
        owner_reversed: false,
        reader_id: 'ba_co_mo_hon', // Obsolete reader ID -> canonicalizes to chi_dai
        status: 'waiting_partner',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify([mockDbRow]), { status: 200 })
      );

      const room = await fetchCoupleRoomFromSupabase('LEGACY123');
      expect(room).not.toBeNull();
      // Out of bounds card ID falls back to MAJOR_ARCANA[0]
      expect(room?.ownerCard.card.id).toBe(0);
      expect(room?.readerId).toBe('chi_dai');
      expect(room?.readerDisplayName).toBe('Chị Đại');
    });

    it('2.5 Automatically transitions expired rooms (past 48h TTL) to expired status', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.test';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_secret_key';

      const expiredDate = new Date(Date.now() - 10000).toISOString(); // 10s in the past
      const mockDbRow = {
        room_code: 'EXPIRED999',
        owner_id: 'owner_old',
        owner_nickname: 'Old Room',
        owner_birth_year: 2000,
        owner_question_text: 'Old question',
        owner_card_id: 0,
        owner_reversed: false,
        reader_id: 'ba_ngoai',
        status: 'waiting_partner', // was waiting_partner in DB, but expires_at has passed
        created_at: new Date(Date.now() - 200000000).toISOString(),
        expires_at: expiredDate,
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify([mockDbRow]), { status: 200 })
      );

      const room = await fetchCoupleRoomFromSupabase('EXPIRED999');
      expect(room).not.toBeNull();
      expect(room?.status).toBe('expired');
    });
  });

  describe('3. Production /api/health Endpoint Security & Output Verification', () => {
    it('3.1 Returns status ok, timestamp, correct AI model chain, and Supabase diagnostics', async () => {
      const res = await getHealth();
      expect(res.status).toBe(200);

      // Check Cache-Control header
      expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0');

      const data = await res.json();
      expect(data.status).toBe('ok');
      expect(typeof data.timestamp).toBe('string');
      expect(new Date(data.timestamp).getTime()).not.toBeNaN();

      // Verify AI section
      expect(data.ai).toBeDefined();
      expect(typeof data.ai.configuredKeysCount).toBe('number');
      expect(data.ai.primaryModel).toBe('gemini-3.5-flash-lite');
      expect(data.ai.modelChain).toEqual([
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-3.6-flash',
        'gemini-3-flash-preview',
      ]);

      // Verify Supabase section
      expect(data.supabase).toBeDefined();
      expect(['hybrid', 'memory-only']).toContain(data.supabase.mode);
      expect(typeof data.supabase.connected).toBe('boolean');
      expect(typeof data.supabase.tablesReady).toBe('boolean');
      expect(Array.isArray(data.supabase.missingTables)).toBe(true);
    });

    it('3.2 Security Audit: Zero secret tokens, API keys, or URLs are exposed in /api/health payload', async () => {
      process.env.GEMINI_API_KEY = 'AIzaSyAdversarialSecretKeyForTestingOnly12345';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.super_secret_service_key';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://secret-project-ref.supabase.co';

      const res = await getHealth();
      const rawText = await res.text();

      // Check that no secret key or token is leaked
      expect(rawText).not.toContain('AIzaSyAdversarialSecretKeyForTestingOnly12345');
      expect(rawText).not.toContain('super_secret_service_key');
      expect(rawText).not.toContain('secret-project-ref');

      const data = JSON.parse(rawText);
      expect(data.ai.configuredKeysCount).toBeGreaterThan(0);
    });
  });

  describe('4. Serverless Read-Through Fallback in /api/couple Routes', () => {
    it('4.1 GET /api/couple triggers Supabase read-through fallback and hydrates in-memory store', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.test';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_secret_key';

      const roomCode = 'FALLBACK01';
      expect(getCoupleRoom(roomCode)).toBeUndefined();

      const mockDbRow = {
        room_code: roomCode,
        owner_id: 'owner_serverless_A',
        owner_nickname: 'Chủ phòng',
        owner_birth_year: 2002,
        owner_question_text: 'Câu hỏi riêng tư',
        owner_card_id: 3,
        owner_reversed: false,
        reader_id: 'ba_ngoai',
        status: 'waiting_partner',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify([mockDbRow]), { status: 200 })
      );

      // GET /api/couple?roomCode=FALLBACK01
      const req = new Request(`http://localhost:3000/api/couple?roomCode=${roomCode}`);
      const res = await getCouple(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.status).toBe('ok');
      expect(json.room.roomCode).toBe(roomCode);
      expect(json.room.ownerNickname).toBe('Chủ phòng');
      // Crucial privacy check: ownerQuestionText must never leak to public view
      expect(json.room.ownerQuestionText).toBeUndefined();

      // Crucial hydration check: local memory store MUST now contain the hydrated room
      const hydratedRoom = getCoupleRoom(roomCode);
      expect(hydratedRoom).toBeDefined();
      expect(hydratedRoom?.roomCode).toBe(roomCode);
      expect(hydratedRoom?.ownerQuestionText).toBe('Câu hỏi riêng tư');
    });

    it('4.2 POST /api/couple (action: join_room) successfully hydrates from Supabase and allows Person B to join', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.test';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_secret_key';

      const roomCode = 'JOINREMOTE02';
      expect(getCoupleRoom(roomCode)).toBeUndefined();

      const mockDbRow = {
        room_code: roomCode,
        owner_id: 'owner_instance_A',
        owner_nickname: 'Người A',
        owner_birth_year: 2001,
        owner_question_text: 'Bí mật của A',
        owner_card_id: 4,
        owner_reversed: false,
        reader_id: 'ba_ngoai',
        status: 'waiting_partner',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      // Mock fetch for fetchCoupleRoomFromSupabase
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify([mockDbRow]), { status: 200 })
      );

      const joinPayload = {
        action: 'join_room',
        roomCode,
        partnerNickname: 'Người B',
        consentShare: true,
      };

      const req = new Request('http://localhost:3000/api/couple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(joinPayload),
      });

      const res = await postCouple(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.status).toBe('ok');
      expect(json.room.status).toBe('completed');
      expect(json.room.partnerNickname).toBe('Người B');
      expect(json.reading).toBeDefined();

      // Verify the in-memory room is now completed
      const finalRoom = getCoupleRoom(roomCode);
      expect(finalRoom?.status).toBe('completed');
    });

    it('4.3 POST /api/couple (action: consent_share) hydrates from Supabase on cache miss', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.test';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_secret_key';

      const roomCode = 'CONSENTREMOTE03';
      const mockDbRow = {
        room_code: roomCode,
        owner_id: 'owner_remote',
        owner_nickname: 'A',
        owner_birth_year: 2000,
        owner_question_text: 'Q',
        owner_card_id: 0,
        owner_reversed: false,
        reader_id: 'ba_ngoai',
        status: 'waiting_partner',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify([mockDbRow]), { status: 200 })
      );

      const consentPayload = {
        action: 'consent_share',
        roomCode,
        role: 'owner',
        consentShare: false,
      };

      const req = new Request('http://localhost:3000/api/couple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consentPayload),
      });

      const res = await postCouple(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('ok');
      expect(json.room.ownerConsentedShare).toBe(false);

      const localRoom = getCoupleRoom(roomCode);
      expect(localRoom?.ownerConsentedShare).toBe(false);
    });

    it('4.4 Returns 404 ROOM_NOT_FOUND when room does not exist in memory OR Supabase', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.test';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_secret_key';

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify([]), { status: 200 })
      );

      const req = new Request('http://localhost:3000/api/couple?roomCode=NONEXISTENT');
      const res = await getCouple(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.code).toBe('ROOM_NOT_FOUND');
    });

    it('4.5 Returns 410 ROOM_EXPIRED when room retrieved from Supabase has expired TTL', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.test';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_secret_key';

      const mockExpiredRow = {
        room_code: 'EXPIRED410',
        owner_id: 'owner_exp',
        owner_nickname: 'Old',
        owner_birth_year: 2000,
        owner_question_text: '',
        owner_card_id: 0,
        owner_reversed: false,
        reader_id: 'ba_ngoai',
        status: 'expired',
        created_at: new Date(Date.now() - 200000000).toISOString(),
        expires_at: new Date(Date.now() - 100000).toISOString(),
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify([mockExpiredRow]), { status: 200 })
      );

      const req = new Request('http://localhost:3000/api/couple?roomCode=EXPIRED410');
      const res = await getCouple(req);
      expect(res.status).toBe(410);
      const json = await res.json();
      expect(json.code).toBe('ROOM_EXPIRED');
    });
  });
});
