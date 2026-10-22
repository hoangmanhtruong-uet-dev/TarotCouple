import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GET as getHealthRoute,
  type HealthResponse,
  dynamic as healthDynamic,
} from '@/app/api/health/route';
import {
  checkSupabaseHealth,
  fetchCoupleRoomFromSupabase,
  getSupabaseConfigStatus,
  type SupabaseHealthResult,
} from '@/lib/supabase-hybrid';
import {
  getCoupleRoom,
  saveCoupleRoom,
  resetAllQuotaStoreForTesting,
  type StoredCoupleRoom,
} from '@/lib/quota-store';
import {
  GET as getCoupleRoute,
  POST as postCoupleRoute,
} from '@/app/api/couple/route';
import { GEMINI_MODEL_CHAIN, getValidGeminiApiKeys } from '@/lib/ai-provider';

describe('Milestone 2 Empirical Challenger Stress & Verification Suite', () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
    resetAllQuotaStoreForTesting();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // =========================================================================
  // SUITE 1: checkSupabaseHealth() Under Offline, Valid & Adversarial Modes
  // =========================================================================
  describe('Suite 1: checkSupabaseHealth() Empirical Behavior & Edge Cases', () => {
    it('1.1 Returns valid offline/memory-only schema when unconfigured', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy;

      const result: SupabaseHealthResult = await checkSupabaseHealth();

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(result).toEqual({
        mode: 'memory-only',
        connected: false,
        tablesReady: false,
        missingTables: ['profiles', 'readings', 'couple_rooms'],
      });
    });

    it('1.2 Treats non-http URL as unconfigured memory-only mode', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'ftp://invalid-protocol.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-key';

      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy;

      const result = await checkSupabaseHealth();
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(result.mode).toBe('memory-only');
      expect(result.connected).toBe(false);
    });

    it('1.3 Successfully parses Swagger 2.0 definitions format', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          definitions: {
            profiles: { type: 'object' },
            readings: { type: 'object' },
            couple_rooms: { type: 'object' },
            unrelated_table: { type: 'object' },
          },
        }),
      } as unknown as Response);

      const result = await checkSupabaseHealth();
      expect(result).toEqual({
        mode: 'hybrid',
        connected: true,
        tablesReady: true,
        missingTables: [],
      });
    });

    it('1.4 Successfully parses OpenAPI 3.0 components.schemas format', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          components: {
            schemas: {
              profiles: {},
              readings: {},
              couple_rooms: {},
            },
          },
        }),
      } as unknown as Response);

      const result = await checkSupabaseHealth();
      expect(result.connected).toBe(true);
      expect(result.tablesReady).toBe(true);
      expect(result.missingTables).toEqual([]);
    });

    it('1.5 Successfully parses PostgREST paths format (with & without leading slash)', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          paths: {
            '/profiles': { get: {} },
            '/readings': { post: {} },
            couple_rooms: { get: {} }, // without leading slash
          },
        }),
      } as unknown as Response);

      const result = await checkSupabaseHealth();
      expect(result.connected).toBe(true);
      expect(result.tablesReady).toBe(true);
      expect(result.missingTables).toEqual([]);
    });

    it('1.6 Accurately identifies missing tables when only subset is present', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          definitions: {
            profiles: {},
            // readings and couple_rooms are missing
          },
        }),
      } as unknown as Response);

      const result = await checkSupabaseHealth();
      expect(result.connected).toBe(true);
      expect(result.tablesReady).toBe(false);
      expect(result.missingTables).toEqual(['readings', 'couple_rooms']);
    });

    it('1.7 Handles HTTP error statuses (401, 403, 500) gracefully without throwing', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      for (const status of [401, 403, 404, 500, 503]) {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status,
          statusText: 'Error',
        } as unknown as Response);

        const result = await checkSupabaseHealth();
        expect(result.mode).toBe('hybrid');
        expect(result.connected).toBe(false);
        expect(result.tablesReady).toBe(false);
        expect(result.missingTables).toEqual(['profiles', 'readings', 'couple_rooms']);
      }
    });

    it('1.8 Handles malformed JSON and primitive JSON returns without crashing', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      // Returning non-object JSON values like null, array, string
      for (const badJson of [null, [], 'plain text', 12345]) {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => badJson,
        } as unknown as Response);

        const result = await checkSupabaseHealth();
        expect(result.connected).toBe(true);
        expect(result.tablesReady).toBe(false);
        expect(result.missingTables).toEqual(['profiles', 'readings', 'couple_rooms']);
      }
    });

    it('1.9 Handles network abort, timeout, and exceptions without unhandled rejections', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      // Network error
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
      const netResult = await checkSupabaseHealth();
      expect(netResult.connected).toBe(false);
      expect(netResult.tablesReady).toBe(false);

      // Non-Error exception throw
      globalThis.fetch = vi.fn().mockRejectedValue('Raw string rejection');
      const strResult = await checkSupabaseHealth();
      expect(strResult.connected).toBe(false);
      expect(strResult.tablesReady).toBe(false);
    });
  });

  // =========================================================================
  // SUITE 2: fetchCoupleRoomFromSupabase() Adversarial Input & Reconstruction
  // =========================================================================
  describe('Suite 2: fetchCoupleRoomFromSupabase() Domain Reconstruction & Stress Testing', () => {
    it('2.1 Rejects empty, whitespace, and non-string roomCode without making network requests', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy;

      expect(await fetchCoupleRoomFromSupabase('')).toBeNull();
      expect(await fetchCoupleRoomFromSupabase('   ')).toBeNull();
      // @ts-expect-error test non-string types
      expect(await fetchCoupleRoomFromSupabase(null)).toBeNull();
      // @ts-expect-error test non-string types
      expect(await fetchCoupleRoomFromSupabase(undefined)).toBeNull();
      // @ts-expect-error test non-string types
      expect(await fetchCoupleRoomFromSupabase(12345)).toBeNull();

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('2.2 Properly URI-encodes roomCode containing special query characters', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      let requestedUrl = '';
      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        requestedUrl = url;
        return {
          ok: true,
          json: async () => [],
        } as unknown as Response;
      });

      await fetchCoupleRoomFromSupabase('ROOM&CODE=1?');
      expect(requestedUrl).toContain('eq.ROOM%26CODE%3D1%3F');
    });

    it('2.3 Accurately reconstructs Tarot cards, reader, and status for waiting_partner room', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      const mockRow = {
        room_code: 'LOVE77',
        owner_id: 'usr_emp_01',
        owner_nickname: 'Thanh Thảo',
        owner_birth_year: 2003,
        owner_question_text: 'Chuyện tương lai thế nào?',
        owner_card_id: 0, // The Fool
        owner_reversed: true,
        reader_id: 'ba_ngoai',
        status: 'waiting_partner',
        created_at: '2026-10-12T00:00:00.000Z',
        expires_at: new Date(Date.now() + 40 * 3600 * 1000).toISOString(),
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockRow],
      } as unknown as Response);

      const room = await fetchCoupleRoomFromSupabase('love77');
      expect(room).not.toBeNull();
      if (!room) return;

      expect(room.roomCode).toBe('LOVE77');
      expect(room.mode).toBe('coop_invite');
      expect(room.status).toBe('waiting_partner');
      expect(room.ownerNickname).toBe('Thanh Thảo');
      expect(room.ownerCard.card.id).toBe(0);
      expect(room.ownerCard.card.name_vi).toBe('Kẻ Khờ');
      expect(room.ownerCard.reversed).toBe(true);
      expect(room.readerId).toBe('ba_ngoai');
      expect(room.readerDisplayName).toBe('Bà Ngoại');
    });

    it('2.4 Maps legacy/alias reader IDs to canonical database readers', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      const testCases = [
        { dbReader: 'ba_co_mo_hon', expectedReader: 'chi_dai' },
        { dbReader: 'ba_ngoai_vui_tinh', expectedReader: 'ba_ngoai' },
        { dbReader: 'tong_tai_ly_tri', expectedReader: 'thay_cu_meo' },
        { dbReader: 'unknown_reader_xyz', expectedReader: 'ban_than' },
      ];

      for (const tc of testCases) {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => [
            {
              room_code: 'ALIAS1',
              owner_id: 'usr_1',
              owner_nickname: 'A',
              owner_card_id: 1,
              reader_id: tc.dbReader,
              status: 'waiting_partner',
            },
          ],
        } as unknown as Response);

        const room = await fetchCoupleRoomFromSupabase('ALIAS1');
        expect(room?.readerId).toBe(tc.expectedReader);
      }
    });

    it('2.5 Detects expired rooms when expires_at timestamp has passed in the real clock', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            room_code: 'EXPIR_9',
            owner_id: 'usr_1',
            owner_card_id: 1,
            status: 'waiting_partner',
            // Expired 5 seconds ago
            expires_at: new Date(Date.now() - 5000).toISOString(),
          },
        ],
      } as unknown as Response);

      const room = await fetchCoupleRoomFromSupabase('EXPIR_9');
      expect(room?.status).toBe('expired');
    });

    it('2.6 Reconstructs completed rooms with partner cards, entertainment metrics & fullReading', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      const mockRow = {
        room_code: 'COMP_88',
        owner_id: 'owner_usr',
        owner_nickname: 'Ngọc',
        owner_birth_year: 2001,
        owner_card_id: 2, // High Priestess
        owner_reversed: false,
        partner_nickname: 'Tuấn',
        partner_birth_year: 1999,
        partner_card_id: 6, // Lovers
        partner_reversed: false,
        bridge_card_id: 19, // Sun
        bridge_reversed: false,
        reader_id: 'ban_than',
        status: 'completed',
        compatibility_score: 92,
        red_flag_level: 0,
        full_reading: {
          status: 'ok',
          readingId: 'rd_couple_999888',
          relationshipStatus: 'dating',
          deckMode: 'major_22',
          result: {
            overall_verdict: 'Cực kỳ hòa hợp và thấu hiểu',
            cards_analysis: [],
            actionable_advice: ['Giữ vững sự chân thành'],
            reflection_prompts: ['Bạn thích điều gì nhất ở đối phương?'],
            safety_notes: [],
            metrics: {
              compatibility_score: 92,
              red_flag_level: 0,
              vibe_tag: 'tri_ky',
              entertainment_note: 'Chỉ để giải trí',
            },
          },
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockRow],
      } as unknown as Response);

      const room = await fetchCoupleRoomFromSupabase('COMP_88');
      expect(room).not.toBeNull();
      if (!room) return;

      expect(room.status).toBe('completed');
      expect(room.partnerNickname).toBe('Tuấn');
      expect(room.partnerCard?.card.id).toBe(6);
      expect(room.connectionCard?.card.id).toBe(19);
      expect(room.readingResult?.metrics?.compatibility_score).toBe(92);
      expect(room.readingResult?.metrics?.entertainment_note).toBe('Chỉ để giải trí');
      expect(room.fullReading?.readingId).toBe('rd_couple_999888');
      expect(room.relationshipStatus).toBe('dating');
    });

    it('2.7 Gracefully returns null on PostgREST network error or malformed payload', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      // Network error
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection reset'));
      expect(await fetchCoupleRoomFromSupabase('FAIL_1')).toBeNull();

      // Non-array JSON
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ error: 'Invalid query' }),
      } as unknown as Response);
      expect(await fetchCoupleRoomFromSupabase('FAIL_2')).toBeNull();

      // Empty array
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      } as unknown as Response);
      expect(await fetchCoupleRoomFromSupabase('FAIL_3')).toBeNull();
    });
  });

  // =========================================================================
  // SUITE 3: GET /api/health Strict Contract & Zero Secret Leak Invariant
  // =========================================================================
  describe('Suite 3: GET /api/health Contract & Security Leak Prevention', () => {
    it('3.1 Returns valid 200 JSON with exact expected schema structure', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const res = await getHealthRoute();
      expect(res.status).toBe(200);

      const data = (await res.json()) as HealthResponse;
      expect(data.status).toBe('ok');
      expect(typeof data.timestamp).toBe('string');
      expect(isNaN(Date.parse(data.timestamp))).toBe(false);

      expect(typeof data.ai.configuredKeysCount).toBe('number');
      expect(data.ai.primaryModel).toBe('gemini-3.5-flash-lite');
      expect(data.ai.modelChain).toEqual([
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-3.6-flash',
        'gemini-3-flash-preview',
      ]);

      expect(data.supabase).toBeDefined();
      expect(['hybrid', 'memory-only']).toContain(data.supabase.mode);
      expect(typeof data.supabase.connected).toBe('boolean');
      expect(typeof data.supabase.tablesReady).toBe('boolean');
      expect(Array.isArray(data.supabase.missingTables)).toBe(true);
    });

    it('3.2 Emits Cache-Control: no-store, max-age=0 header and exports dynamic = "force-dynamic"', async () => {
      expect(healthDynamic).toBe('force-dynamic');

      const res = await getHealthRoute();
      const cacheControl = res.headers.get('Cache-Control');
      expect(cacheControl).toBeDefined();
      expect(cacheControl).toContain('no-store');
      expect(cacheControl).toContain('max-age=0');
    });

    it('3.3 Rigorous Security Assertion: Zero occurrences of AIzaSy, service role keys, or tokens', async () => {
      const FAKE_GEMINI_PRIMARY = 'AIzaSyPrimarySecretKey_Test_1234567890';
      const FAKE_GEMINI_SECONDARY = 'AIzaSySecondarySecretKey_Test_0987654321';
      const FAKE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SuperSecretServicePayload.SecretSig99';
      const FAKE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.AnonPayload.AnonSig88';
      const FAKE_SUPABASE_URL = 'https://secret-project-db.supabase.co';

      process.env.GEMINI_API_KEY = FAKE_GEMINI_PRIMARY;
      process.env.GEMINI_API_KEY_2 = FAKE_GEMINI_SECONDARY;
      process.env.SUPABASE_SERVICE_ROLE_KEY = FAKE_SERVICE_ROLE_KEY;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = FAKE_ANON_KEY;
      process.env.NEXT_PUBLIC_SUPABASE_URL = FAKE_SUPABASE_URL;

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          definitions: { profiles: {}, readings: {}, couple_rooms: {} },
        }),
      } as unknown as Response);

      const res = await getHealthRoute();
      expect(res.status).toBe(200);

      const rawJson = await res.text();
      const parsed = JSON.parse(rawJson) as HealthResponse;

      // configuredKeysCount must count keys accurately
      expect(parsed.ai.configuredKeysCount).toBeGreaterThanOrEqual(2);
      expect(parsed.supabase.connected).toBe(true);

      // SECURITY ASSERTIONS: Zero secret substring exposure
      expect(rawJson).not.toContain('AIzaSy');
      expect(rawJson).not.toContain(FAKE_GEMINI_PRIMARY);
      expect(rawJson).not.toContain(FAKE_GEMINI_SECONDARY);
      expect(rawJson).not.toContain('SuperSecretServicePayload');
      expect(rawJson).not.toContain('SecretSig99');
      expect(rawJson).not.toContain('eyJhbGci');
      expect(rawJson).not.toContain('Bearer');
      expect(rawJson).not.toContain(FAKE_SUPABASE_URL);

      // Check response headers for secret leaks
      res.headers.forEach((value, key) => {
        expect(key.toLowerCase()).not.toContain('secret');
        expect(value).not.toContain('AIzaSy');
        expect(value).not.toContain('eyJhbGci');
      });
    });
  });

  // =========================================================================
  // SUITE 4: Serverless Read-Through Fallback in /api/couple Endpoints
  // =========================================================================
  describe('Suite 4: Serverless Read-Through Fallback in /api/couple', () => {
    it('4.1 GET /api/couple hydrates cache from Supabase on local cache miss', async () => {
      const roomCode = 'SERVERLESS_GET_1';
      expect(getCoupleRoom(roomCode)).toBeUndefined();

      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      const mockDbRow = {
        room_code: roomCode,
        owner_id: 'owner_user_99',
        owner_nickname: 'Minh',
        owner_birth_year: 2002,
        owner_question_text: 'Top secret private question',
        owner_card_id: 1, // Magician
        owner_reversed: false,
        reader_id: 'ba_ngoai',
        status: 'waiting_partner',
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockDbRow],
      } as unknown as Response);

      const req = new Request(`https://test.local/api/couple?roomCode=${roomCode}`);
      const res = await getCoupleRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.status).toBe('ok');
      expect(json.room.roomCode).toBe(roomCode);
      expect(json.room.ownerNickname).toBe('Minh');

      // Invariant: Person A's question is NEVER leaked in public view
      expect(json.room.ownerQuestionText).toBeUndefined();

      // Memory store was hydrated!
      const inMemory = getCoupleRoom(roomCode);
      expect(inMemory).toBeDefined();
      expect(inMemory?.ownerNickname).toBe('Minh');
    });

    it('4.2 POST consent_share hydrates cache from Supabase on local cache miss', async () => {
      const roomCode = 'SERVERLESS_CONSENT_2';
      expect(getCoupleRoom(roomCode)).toBeUndefined();

      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      const mockDbRow = {
        room_code: roomCode,
        owner_id: 'owner_user_88',
        owner_nickname: 'Khánh',
        owner_birth_year: 2000,
        owner_card_id: 0,
        owner_reversed: false,
        reader_id: 'chi_dai',
        status: 'waiting_partner',
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockDbRow],
      } as unknown as Response);

      const req = new Request('https://test.local/api/couple', {
        method: 'POST',
        // Phase 1 ownership: consent must come from the room owner.
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': 'owner_user_88',
        },
        body: JSON.stringify({
          action: 'consent_share',
          roomCode,
          consentShare: true,
          role: 'owner',
        }),
      });

      const res = await postCoupleRoute(req);
      expect(res.status).toBe(200);

      const inMemory = getCoupleRoom(roomCode);
      expect(inMemory).toBeDefined();
      expect(inMemory?.ownerConsentedShare).toBe(true);
    });

    it('4.3 POST join_room hydrates cache and completes reading on local cache miss', async () => {
      const roomCode = 'SERVERLESS_JOIN_3';
      expect(getCoupleRoom(roomCode)).toBeUndefined();

      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      const mockDbRow = {
        room_code: roomCode,
        owner_id: 'owner_user_77',
        owner_nickname: 'Anh',
        owner_birth_year: 2001,
        owner_question_text: 'Câu hỏi của A',
        owner_card_id: 0,
        owner_reversed: false,
        reader_id: 'ban_than',
        status: 'waiting_partner',
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockDbRow],
      } as unknown as Response);

      const req = new Request('https://test.local/api/couple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join_room',
          roomCode,
          partnerNickname: 'Em',
          partnerBirthYear: 2002,
        }),
      });

      const res = await postCoupleRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.status).toBe('ok');
      expect(json.room.status).toBe('completed');
      expect(json.room.partnerNickname).toBe('Em');
      expect(json.reading).toBeDefined();

      const inMemory = getCoupleRoom(roomCode);
      expect(inMemory).toBeDefined();
      expect(inMemory?.status).toBe('completed');
      expect(inMemory?.partnerNickname).toBe('Em');
    });

    it('4.4 Returns 404 ROOM_NOT_FOUND when room is missing in both memory and Supabase', async () => {
      const roomCode = 'NON_EXISTENT_99';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      } as unknown as Response);

      const req = new Request(`https://test.local/api/couple?roomCode=${roomCode}`);
      const res = await getCoupleRoute(req);
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.status).toBe('error');
      expect(json.code).toBe('ROOM_NOT_FOUND');
    });

    it('4.5 Returns 410 ROOM_EXPIRED when room retrieved from Supabase has expired', async () => {
      const roomCode = 'EXPIRED_REMOTE_88';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      const mockDbRow = {
        room_code: roomCode,
        owner_id: 'owner_user_66',
        owner_nickname: 'Cường',
        owner_birth_year: 1999,
        owner_card_id: 1,
        owner_reversed: false,
        reader_id: 'ba_ngoai',
        status: 'waiting_partner',
        expires_at: new Date(Date.now() - 60000).toISOString(), // expired 1 min ago
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockDbRow],
      } as unknown as Response);

      const req = new Request(`https://test.local/api/couple?roomCode=${roomCode}`);
      const res = await getCoupleRoute(req);
      expect(res.status).toBe(410);

      const json = await res.json();
      expect(json.status).toBe('error');
      expect(json.code).toBe('ROOM_EXPIRED');
    });
  });
});
