import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET as getHealthRoute, type HealthResponse } from '@/lib/../app/api/health/route';
import {
  checkSupabaseHealth,
  fetchCoupleRoomFromSupabase,
} from '@/lib/supabase-hybrid';
import {
  getCoupleRoom,
  saveCoupleRoom,
  type StoredCoupleRoom,
} from '@/lib/quota-store';
import { GET as getCoupleRoute, POST as postCoupleRoute } from '@/lib/../app/api/couple/route';

describe('Milestone 2 Forensic Integrity Audit', () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('1. Security & Zero Secret Leakage in /api/health', () => {
    it('never leaks GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY, or tokens in /api/health JSON payload', async () => {
      process.env.GEMINI_API_KEY = 'AIzaSySecretFakeKey1234567890';
      process.env.GEMINI_API_KEY_1 = 'AIzaSySecretFakeKeySecondary99';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SecretServiceRolePayload.Signature';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SecretAnonPayload.Signature';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fake-project-id.supabase.co';

      // Mock fetch for Supabase health check
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          definitions: { profiles: {}, readings: {}, couple_rooms: {} },
        }),
      } as unknown as Response);

      const response = await getHealthRoute();
      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0');

      const data = (await response.json()) as HealthResponse;
      const jsonString = JSON.stringify(data);

      // Verify strict structure
      expect(data.status).toBe('ok');
      expect(typeof data.timestamp).toBe('string');
      expect(data.ai.configuredKeysCount).toBeGreaterThanOrEqual(1);
      expect(data.ai.primaryModel).toBe('gemini-3.5-flash-lite');
      expect(data.ai.modelChain).toEqual([
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-3.6-flash',
        'gemini-3-flash-preview',
      ]);
      expect(data.supabase.mode).toBe('hybrid');
      expect(data.supabase.connected).toBe(true);
      expect(data.supabase.tablesReady).toBe(true);
      expect(data.supabase.missingTables).toEqual([]);

      // FORENSIC KEY LEAK CHECKS
      expect(jsonString).not.toContain('AIzaSySecretFakeKey1234567890');
      expect(jsonString).not.toContain('AIzaSySecretFakeKeySecondary99');
      expect(jsonString).not.toContain('SecretServiceRolePayload');
      expect(jsonString).not.toContain('SecretAnonPayload');
      expect(jsonString).not.toContain('Bearer');
      expect(jsonString).not.toContain('eyJhbGci');
      expect(jsonString).not.toContain('fake-project-id'); // URL not leaked in health
    });
  });

  describe('2. Authenticity & Behavior of checkSupabaseHealth()', () => {
    it('returns memory-only and reports all core tables missing when unconfigured', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const health = await checkSupabaseHealth();
      expect(health).toEqual({
        mode: 'memory-only',
        connected: false,
        tablesReady: false,
        missingTables: ['profiles', 'readings', 'couple_rooms'],
      });
    });

    it('accurately parses OpenAPI Swagger definitions and marks tablesReady: true', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test';

      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        expect(url).toBe('https://empirical-test.supabase.co/rest/v1/');
        return {
          ok: true,
          json: async () => ({
            definitions: {
              profiles: { type: 'object' },
              readings: { type: 'object' },
              couple_rooms: { type: 'object' },
              other_table: { type: 'object' },
            },
          }),
        } as Response;
      });

      const health = await checkSupabaseHealth();
      expect(health).toEqual({
        mode: 'hybrid',
        connected: true,
        tablesReady: true,
        missingTables: [],
      });
    });

    it('accurately detects missing tables when only a subset of tables exists', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test';

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          definitions: {
            profiles: { type: 'object' },
            // missing readings and couple_rooms
          },
        }),
      } as unknown as Response);

      const health = await checkSupabaseHealth();
      expect(health.mode).toBe('hybrid');
      expect(health.connected).toBe(true);
      expect(health.tablesReady).toBe(false);
      expect(health.missingTables).toEqual(['readings', 'couple_rooms']);
    });

    it('supports OpenAPI 3.0 components.schemas and paths formats', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test';

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          components: {
            schemas: {
              profiles: {},
            },
          },
          paths: {
            '/readings': {},
            couple_rooms: {},
          },
        }),
      } as unknown as Response);

      const health = await checkSupabaseHealth();
      expect(health.connected).toBe(true);
      expect(health.tablesReady).toBe(true);
      expect(health.missingTables).toEqual([]);
    });

    it('handles HTTP error responses (e.g. 500 internal server error) gracefully without throwing', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test';

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as unknown as Response);

      const health = await checkSupabaseHealth();
      expect(health).toEqual({
        mode: 'hybrid',
        connected: false,
        tablesReady: false,
        missingTables: ['profiles', 'readings', 'couple_rooms'],
      });
    });

    it('handles network failure / timeout gracefully without throwing', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test';

      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection timed out'));

      const health = await checkSupabaseHealth();
      expect(health).toEqual({
        mode: 'hybrid',
        connected: false,
        tablesReady: false,
        missingTables: ['profiles', 'readings', 'couple_rooms'],
      });
    });
  });

  describe('3. Authenticity & Reconstruction of fetchCoupleRoomFromSupabase()', () => {
    it('returns null for blank or invalid roomCode without executing fetch', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test';

      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy;

      expect(await fetchCoupleRoomFromSupabase('')).toBeNull();
      expect(await fetchCoupleRoomFromSupabase('   ')).toBeNull();
      // @ts-expect-error test invalid type
      expect(await fetchCoupleRoomFromSupabase(null)).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('returns null when Supabase is unconfigured', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy;

      const result = await fetchCoupleRoomFromSupabase('ROOM123');
      expect(result).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('authentically queries PostgREST and reconstructs full StoredCoupleRoom entity for waiting_partner', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test';

      const mockDbRow = {
        room_code: 'TEST99',
        owner_id: 'user_owner_abc',
        owner_nickname: 'Ngọc Lan',
        owner_birth_year: 2002,
        owner_question_text: 'Tụi mình có hợp nhau không?',
        owner_card_id: 1, // Magician
        owner_reversed: false,
        reader_id: 'ban_than',
        status: 'waiting_partner',
        created_at: '2026-10-12T10:00:00Z',
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      };

      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        expect(url).toContain('couple_rooms?room_code=eq.TEST99&select=*');
        return {
          ok: true,
          json: async () => [mockDbRow],
        } as Response;
      });

      const room = await fetchCoupleRoomFromSupabase('test99');
      expect(room).not.toBeNull();
      if (!room) return;

      expect(room.roomCode).toBe('TEST99');
      expect(room.ownerNickname).toBe('Ngọc Lan');
      expect(room.ownerCard.card.id).toBe(1);
      expect(room.ownerCard.reversed).toBe(false);
      expect(room.readerId).toBe('ban_than');
      expect(room.status).toBe('waiting_partner');
      expect(room.mode).toBe('coop_invite');
    });

    it('marks room as expired if expires_at is past now even if DB says waiting_partner', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test';

      const mockDbRow = {
        room_code: 'EXPIRED1',
        owner_id: 'user_1',
        owner_nickname: 'An',
        owner_birth_year: 2000,
        owner_card_id: 0,
        owner_reversed: false,
        reader_id: 'chi_dai',
        status: 'waiting_partner',
        expires_at: new Date(Date.now() - 10000).toISOString(), // Past
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockDbRow],
      } as unknown as Response);

      const room = await fetchCoupleRoomFromSupabase('EXPIRED1');
      expect(room).not.toBeNull();
      expect(room?.status).toBe('expired');
    });

    it('reconstructs completed room with partner card, metrics, and fullReading', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test';

      const mockDbRow = {
        room_code: 'COMPLETED1',
        owner_id: 'user_1',
        owner_nickname: 'An',
        owner_birth_year: 2000,
        owner_card_id: 0,
        owner_reversed: false,
        partner_nickname: 'Bình',
        partner_birth_year: 1999,
        partner_card_id: 6, // Lovers
        partner_reversed: true,
        bridge_card_id: 19, // Sun
        bridge_reversed: false,
        reader_id: 'ba_ngoai',
        status: 'completed',
        compatibility_score: 88,
        red_flag_level: 1,
        full_reading: {
          status: 'ok',
          readingId: 'rd_couple_123',
          relationshipStatus: 'dating',
          deckMode: 'major_22',
          result: {
            overall_verdict: 'Rất hợp nhau',
            cards_analysis: [],
            actionable_advice: ['Giao tiếp cởi mở'],
            reflection_prompts: ['Cả hai trân trọng điều gì?'],
            safety_notes: [],
            metrics: {
              compatibility_score: 88,
              red_flag_level: 1,
              vibe_tag: 'tri_ky',
              entertainment_note: 'Chỉ để giải trí',
            },
          },
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockDbRow],
      } as unknown as Response);

      const room = await fetchCoupleRoomFromSupabase('COMPLETED1');
      expect(room).not.toBeNull();
      expect(room?.status).toBe('completed');
      expect(room?.partnerNickname).toBe('Bình');
      expect(room?.partnerCard?.card.id).toBe(6);
      expect(room?.partnerCard?.reversed).toBe(true);
      expect(room?.connectionCard?.card.id).toBe(19);
      expect(room?.readingResult?.metrics?.compatibility_score).toBe(88);
      expect(room?.relationshipStatus).toBe('dating');
      expect(room?.fullReading?.readingId).toBe('rd_couple_123');
    });
  });

  describe('4. Serverless Read-Through Fallback in /api/couple Routes', () => {
    it('hydrates memory store and succeeds when room is missing locally in GET /api/couple', async () => {
      const roomCode = 'READTHRU1';
      // Ensure local memory has no such room
      expect(getCoupleRoom(roomCode)).toBeUndefined();

      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test';

      const mockDbRow = {
        room_code: roomCode,
        owner_id: 'owner_rt1',
        owner_nickname: 'Hoàng',
        owner_birth_year: 2001,
        owner_question_text: 'Secret question from Person A',
        owner_card_id: 3,
        owner_reversed: false,
        reader_id: 'chi_dai',
        status: 'waiting_partner',
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockDbRow],
      } as unknown as Response);

      const req = new Request(`https://test.local/api/couple?roomCode=${roomCode}`);
      const res = await getCoupleRoute(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('ok');
      expect(body.room.roomCode).toBe(roomCode);
      expect(body.room.ownerNickname).toBe('Hoàng');

      // Crucial: check that memory store was hydrated
      const hydratedRoom = getCoupleRoom(roomCode);
      expect(hydratedRoom).toBeDefined();
      expect(hydratedRoom?.ownerNickname).toBe('Hoàng');

      // Check that Person A private question was not exposed in public view
      expect(body.room.ownerQuestionText).toBeUndefined();
    });

    it('hydrates memory store and allows joining room when room is missing locally in POST /api/couple join_room', async () => {
      const roomCode = 'JOINTHRU2';
      expect(getCoupleRoom(roomCode)).toBeUndefined();

      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test';

      const mockDbRow = {
        room_code: roomCode,
        owner_id: 'owner_rt2',
        owner_nickname: 'Quang',
        owner_birth_year: 1998,
        owner_question_text: 'Chuyện tương lai',
        owner_card_id: 4,
        owner_reversed: false,
        reader_id: 'ba_ngoai',
        status: 'waiting_partner',
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
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
          roomCode: roomCode,
          partnerNickname: 'Mai',
          partnerBirthYear: 2000,
          partnerCardId: 10,
          partnerReversed: false,
        }),
      });

      const res = await postCoupleRoute(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('ok');
      expect(body.room.status).toBe('completed');
      expect(body.room.partnerNickname).toBe('Mai');

      // Memory store was hydrated and updated
      const inMem = getCoupleRoom(roomCode);
      expect(inMem?.status).toBe('completed');
      expect(inMem?.partnerNickname).toBe('Mai');
    });
  });
});
