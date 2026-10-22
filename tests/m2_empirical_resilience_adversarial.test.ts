import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchCoupleRoomFromSupabase, checkSupabaseHealth } from '@/lib/supabase-hybrid';
import {
  getCoupleRoom,
  saveCoupleRoom,
  resetAllQuotaStoreForTesting,
  type StoredCoupleRoom,
} from '@/lib/quota-store';
import { GET as getCoupleRoute, POST as postCoupleRoute } from '@/app/api/couple/route';
import { TAROT_CARDS_BY_ID, MAJOR_ARCANA } from '@/data/tarot-cards';

describe('Milestone 2 Empirical Challenger Adversarial Stress Suite', () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
    resetAllQuotaStoreForTesting();
    // Configure mock Supabase environment for hybrid operations
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://empirical-m2.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-empirical-key';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // =========================================================================
  // SECTION 1: Normalization of Room Codes
  // =========================================================================
  describe('1. Normalization of Room Codes in fetchCoupleRoomFromSupabase', () => {
    it('1.1 trims leading, trailing, and internal whitespace/newlines and queries PostgREST with uppercase code', async () => {
      let interceptedUrl = '';
      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        interceptedUrl = url;
        return {
          ok: true,
          json: async () => [
            {
              room_code: 'LUV892',
              owner_id: 'user_123',
              owner_nickname: 'Thảo',
              owner_card_id: 0,
              owner_reversed: false,
              reader_id: 'chi_dai',
              status: 'waiting_partner',
              expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            },
          ],
        } as Response;
      });

      const inputs = [
        '  luv892  ',
        '\tluv892\n',
        'Luv892',
        '   LUV892   ',
      ];

      for (const input of inputs) {
        const room = await fetchCoupleRoomFromSupabase(input);
        expect(room).not.toBeNull();
        expect(room?.roomCode).toBe('LUV892');
        expect(interceptedUrl).toContain('couple_rooms?room_code=eq.LUV892&select=*');
      }
    });

    it('1.2 safely URL-encodes special characters in room code without corrupting query string', async () => {
      let interceptedUrl = '';
      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        interceptedUrl = url;
        return {
          ok: true,
          json: async () => [],
        } as Response;
      });

      await fetchCoupleRoomFromSupabase('LUV+99&x=1');
      expect(interceptedUrl).toContain('room_code=eq.LUV%2B99%26X%3D1');
    });

    it('1.3 rejects blank, whitespace-only, and non-string inputs immediately without network calls', async () => {
      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy;

      expect(await fetchCoupleRoomFromSupabase('')).toBeNull();
      expect(await fetchCoupleRoomFromSupabase('   ')).toBeNull();
      expect(await fetchCoupleRoomFromSupabase('\t\n  \r')).toBeNull();
      // @ts-expect-error test non-string types
      expect(await fetchCoupleRoomFromSupabase(null)).toBeNull();
      // @ts-expect-error test undefined
      expect(await fetchCoupleRoomFromSupabase(undefined)).toBeNull();
      // @ts-expect-error test number
      expect(await fetchCoupleRoomFromSupabase(123456)).toBeNull();
      // @ts-expect-error test object
      expect(await fetchCoupleRoomFromSupabase({ code: 'LUV123' })).toBeNull();

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('1.4 returns null if Supabase environment variables are missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy;

      const room = await fetchCoupleRoomFromSupabase('LUV892');
      expect(room).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // SECTION 2: Card Mapping and Fallbacks
  // =========================================================================
  describe('2. Card Mapping and Fallback if Card ID is Missing or Invalid', () => {
    it('2.1 accurately maps valid Major Arcana card IDs and orientation booleans', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            room_code: 'CARDMAP1',
            owner_id: 'owner_1',
            owner_nickname: 'Bảo',
            owner_card_id: 0, // The Fool
            owner_reversed: true,
            partner_nickname: 'Ngân',
            partner_card_id: 6, // The Lovers
            partner_reversed: false,
            bridge_card_id: 19, // The Sun
            bridge_reversed: true,
            reader_id: 'ban_than',
            status: 'completed',
            expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          },
        ],
      } as unknown as Response);

      const room = await fetchCoupleRoomFromSupabase('CARDMAP1');
      expect(room).not.toBeNull();
      expect(room?.ownerCard.card.id).toBe(0);
      expect(room?.ownerCard.card.name_en).toBe('The Fool');
      expect(room?.ownerCard.reversed).toBe(true);

      expect(room?.partnerCard?.card.id).toBe(6);
      expect(room?.partnerCard?.card.name_en).toBe('The Lovers');
      expect(room?.partnerCard?.reversed).toBe(false);

      expect(room?.connectionCard?.card.id).toBe(19);
      expect(room?.connectionCard?.card.name_en).toBe('The Sun');
      expect(room?.connectionCard?.reversed).toBe(true);
    });

    it('2.2 falls back owner_card_id to The Fool (id 0) when missing, null, or out of range', async () => {
      const testCases = [
        { owner_card_id: null },
        { owner_card_id: undefined },
        { owner_card_id: 'not_a_number' },
        { owner_card_id: 9999 }, // Out of bounds
        { owner_card_id: -5 },   // Negative
      ];

      for (const [idx, tc] of testCases.entries()) {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => [
            {
              room_code: `OWNERFALLBACK_${idx}`,
              owner_id: 'owner_1',
              owner_nickname: 'Bảo',
              ...tc,
              owner_reversed: false,
              reader_id: 'ba_ngoai',
              status: 'waiting_partner',
              expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
            },
          ],
        } as unknown as Response);

        const room = await fetchCoupleRoomFromSupabase(`OWNERFALLBACK_${idx}`);
        expect(room).not.toBeNull();
        expect(room?.ownerCard.card.id).toBe(0);
        expect(room?.ownerCard.card.name_en).toBe('The Fool');
      }
    });

    it('2.3 keeps partnerCard and connectionCard undefined when partner/bridge IDs are not provided', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            room_code: 'NOPARTNER',
            owner_id: 'owner_1',
            owner_nickname: 'Bảo',
            owner_card_id: 1, // Magician
            owner_reversed: false,
            // partner_card_id and bridge_card_id omitted
            reader_id: 'chi_dai',
            status: 'waiting_partner',
            expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          },
        ],
      } as unknown as Response);

      const room = await fetchCoupleRoomFromSupabase('NOPARTNER');
      expect(room).not.toBeNull();
      expect(room?.ownerCard.card.id).toBe(1);
      expect(room?.partnerCard).toBeUndefined();
      expect(room?.connectionCard).toBeUndefined();
    });

    it('2.4 falls back partner_card_id to The Lovers (id 6) and bridge_card_id to The Sun (id 19) when out of bounds', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            room_code: 'OOB_CARDS',
            owner_id: 'owner_1',
            owner_nickname: 'Bảo',
            owner_card_id: 0,
            partner_card_id: 9999, // Out of bounds partner
            partner_reversed: true,
            bridge_card_id: 8888,  // Out of bounds bridge
            bridge_reversed: false,
            reader_id: 'ba_ngoai',
            status: 'completed',
            expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          },
        ],
      } as unknown as Response);

      const room = await fetchCoupleRoomFromSupabase('OOB_CARDS');
      expect(room).not.toBeNull();
      expect(room?.partnerCard?.card.id).toBe(6);
      expect(room?.partnerCard?.card.name_en).toBe('The Lovers');
      expect(room?.partnerCard?.reversed).toBe(true);

      expect(room?.connectionCard?.card.id).toBe(19);
      expect(room?.connectionCard?.card.name_en).toBe('The Sun');
      expect(room?.connectionCard?.reversed).toBe(false);
    });

    it('2.5 accurately maps Minor Arcana cards and elevates deckMode to full_78', async () => {
      // Find a minor arcana card from dictionary
      const minorCard = Object.values(TAROT_CARDS_BY_ID).find(c => c.arcana === 'minor');
      const minorCardId = minorCard ? minorCard.id : 50;

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            room_code: 'MINOR78',
            owner_id: 'owner_1',
            owner_nickname: 'Bảo',
            owner_card_id: minorCardId,
            owner_reversed: false,
            reader_id: 'chi_dai',
            status: 'waiting_partner',
            expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          },
        ],
      } as unknown as Response);

      const room = await fetchCoupleRoomFromSupabase('MINOR78');
      expect(room).not.toBeNull();
      expect(room?.ownerCard.card.id).toBe(minorCardId);
      expect(room?.deckMode).toBe('full_78');
    });
  });

  // =========================================================================
  // SECTION 3: Expiry Calculation (48h TTL)
  // =========================================================================
  describe('3. Expiry Calculation & 48h TTL State Transition', () => {
    it('3.1 transitions waiting_partner to expired when expires_at has passed (> 48h)', async () => {
      const pastTime = new Date(Date.now() - 3600 * 1000).toISOString(); // 1 hour ago

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            room_code: 'EXPIRED_WAITING',
            owner_id: 'owner_1',
            owner_nickname: 'Bảo',
            owner_card_id: 0,
            reader_id: 'ban_than',
            status: 'waiting_partner', // DB still has waiting_partner
            expires_at: pastTime,
          },
        ],
      } as unknown as Response);

      const room = await fetchCoupleRoomFromSupabase('EXPIRED_WAITING');
      expect(room).not.toBeNull();
      expect(room?.status).toBe('expired');
    });

    it('3.2 keeps waiting_partner active when expires_at is in the future', async () => {
      const futureTime = new Date(Date.now() + 20 * 3600 * 1000).toISOString(); // 20 hours ahead

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            room_code: 'ACTIVE_WAITING',
            owner_id: 'owner_1',
            owner_nickname: 'Bảo',
            owner_card_id: 0,
            reader_id: 'ban_than',
            status: 'waiting_partner',
            expires_at: futureTime,
          },
        ],
      } as unknown as Response);

      const room = await fetchCoupleRoomFromSupabase('ACTIVE_WAITING');
      expect(room).not.toBeNull();
      expect(room?.status).toBe('waiting_partner');
    });

    it('3.3 preserves completed status even if expires_at has elapsed', async () => {
      const pastTime = new Date(Date.now() - 72 * 3600 * 1000).toISOString(); // 3 days ago

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            room_code: 'COMPLETED_OLD',
            owner_id: 'owner_1',
            owner_nickname: 'Bảo',
            owner_card_id: 0,
            partner_nickname: 'Hà',
            partner_card_id: 6,
            reader_id: 'ban_than',
            status: 'completed',
            expires_at: pastTime,
          },
        ],
      } as unknown as Response);

      const room = await fetchCoupleRoomFromSupabase('COMPLETED_OLD');
      expect(room).not.toBeNull();
      // Completed rooms remain completed so participants can view their reading
      expect(room?.status).toBe('completed');
    });

    it('3.4 provides fallback 48h expiresAt when DB expires_at is null or malformed', async () => {
      const nowBefore = Date.now();
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            room_code: 'NULL_EXPIRES',
            owner_id: 'owner_1',
            owner_nickname: 'Bảo',
            owner_card_id: 0,
            reader_id: 'ban_than',
            status: 'waiting_partner',
            expires_at: null, // Null in DB
          },
        ],
      } as unknown as Response);

      const room = await fetchCoupleRoomFromSupabase('NULL_EXPIRES');
      expect(room).not.toBeNull();
      expect(room?.status).toBe('waiting_partner');
      const expiresMs = new Date(room!.expiresAt).getTime();
      expect(expiresMs).toBeGreaterThanOrEqual(nowBefore + 47 * 3600 * 1000);
    });

    it('3.5 GET /api/couple returns HTTP 410 ROOM_EXPIRED for expired rooms', async () => {
      const pastTime = new Date(Date.now() - 5000).toISOString();

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            room_code: 'API_EXPIRED',
            owner_id: 'owner_1',
            owner_nickname: 'Bảo',
            owner_card_id: 0,
            reader_id: 'chi_dai',
            status: 'waiting_partner',
            expires_at: pastTime,
          },
        ],
      } as unknown as Response);

      const req = new Request('https://test.local/api/couple?roomCode=API_EXPIRED');
      const res = await getCoupleRoute(req);

      expect(res.status).toBe(410);
      const data = await res.json();
      expect(data.code).toBe('ROOM_EXPIRED');
      expect(data.room.status).toBe('expired');
    });

    it('3.6 POST /api/couple join_room returns HTTP 410 ROOM_EXPIRED when joining an expired room', async () => {
      const pastTime = new Date(Date.now() - 5000).toISOString();

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            room_code: 'JOIN_EXPIRED',
            owner_id: 'owner_1',
            owner_nickname: 'Bảo',
            owner_card_id: 0,
            reader_id: 'chi_dai',
            status: 'waiting_partner',
            expires_at: pastTime,
          },
        ],
      } as unknown as Response);

      const req = new Request('https://test.local/api/couple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join_room',
          roomCode: 'JOIN_EXPIRED',
          partnerNickname: 'Lan',
        }),
      });

      const res = await postCoupleRoute(req);
      expect(res.status).toBe(410);
      const data = await res.json();
      expect(data.code).toBe('ROOM_EXPIRED');
    });
  });

  // =========================================================================
  // SECTION 4: Read-Through Fallback & Cache Hydration in /api/couple
  // =========================================================================
  describe('4. Serverless Read-Through Fallback & Memory Cache Hydration', () => {
    it('4.1 simulates cache miss in quotaStore, fetches from Supabase, and hydrates memory store', async () => {
      const roomCode = 'HYDRATE101';
      // Step 1: verify memory store miss
      expect(getCoupleRoom(roomCode)).toBeUndefined();

      let supabaseGetCount = 0;
      let supabasePostCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        if (url.includes('couple_rooms')) {
          if (init?.method === 'POST') {
            supabasePostCount++;
            return { ok: true, json: async () => ({}) } as Response;
          } else {
            supabaseGetCount++;
            return {
              ok: true,
              json: async () => [
                {
                  room_code: roomCode,
                  owner_id: 'client_owner_abc',
                  owner_nickname: 'Khải',
                  owner_birth_year: 2001,
                  owner_question_text: 'Tụi mình có thể đi đường dài?',
                  owner_card_id: 2, // High Priestess
                  owner_reversed: false,
                  reader_id: 'chi_dai',
                  status: 'waiting_partner',
                  expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
                },
              ],
            } as Response;
          }
        }
        return { ok: true, json: async () => ({}) } as Response;
      });

      // Step 2: First request: Cache Miss -> calls Supabase GET -> saves to quotaStore (which triggers sync POST)
      const req1 = new Request(`https://test.local/api/couple?roomCode=${roomCode}`);
      const res1 = await getCoupleRoute(req1);

      expect(res1.status).toBe(200);
      const data1 = await res1.json();
      expect(data1.status).toBe('ok');
      expect(data1.room.roomCode).toBe(roomCode);
      expect(data1.room.ownerNickname).toBe('Khải');
      expect(supabaseGetCount).toBe(1);

      // Step 3: Verify quotaStore is now hydrated in memory!
      const inMemoryRoom = getCoupleRoom(roomCode);
      expect(inMemoryRoom).toBeDefined();
      expect(inMemoryRoom?.roomCode).toBe(roomCode);
      expect(inMemoryRoom?.ownerNickname).toBe('Khải');
      expect(inMemoryRoom?.ownerCard.card.id).toBe(2);

      // Step 4: Second request: Cache Hit -> served strictly from memory without any GET to Supabase!
      const req2 = new Request(`https://test.local/api/couple?roomCode=${roomCode}`);
      const res2 = await getCoupleRoute(req2);
      expect(res2.status).toBe(200);
      expect(supabaseGetCount).toBe(1); // Exactly 1 GET across both requests
    });

    it('4.2 hydrates memory store when Person B joins room from a fresh serverless instance', async () => {
      const roomCode = 'JOININSTANCE';
      expect(getCoupleRoom(roomCode)).toBeUndefined();

      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('couple_rooms')) {
          return {
            ok: true,
            json: async () => [
              {
                room_code: roomCode,
                owner_id: 'client_owner_xyz',
                owner_nickname: 'Nam',
                owner_birth_year: 2000,
                owner_question_text: 'Bí mật của A',
                owner_card_id: 1,
                owner_reversed: false,
                reader_id: 'ba_ngoai',
                status: 'waiting_partner',
                expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
              },
            ],
          } as Response;
        }
        return { ok: true, json: async () => ({}) } as Response;
      });

      const joinReq = new Request('https://test.local/api/couple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join_room',
          roomCode: roomCode,
          partnerNickname: 'Trang',
        }),
      });

      const joinRes = await postCoupleRoute(joinReq);
      expect(joinRes.status).toBe(200);
      const joinData = await joinRes.json();
      expect(joinData.status).toBe('ok');
      expect(joinData.room.status).toBe('completed');
      expect(joinData.room.partnerNickname).toBe('Trang');

      // Verify in-memory store now contains completed room
      const hydrated = getCoupleRoom(roomCode);
      expect(hydrated).toBeDefined();
      expect(hydrated?.status).toBe('completed');
      expect(hydrated?.partnerNickname).toBe('Trang');
    });

    it('4.3 hydrates memory store during consent_share action', async () => {
      const roomCode = 'CONSENTHYDRATE';
      expect(getCoupleRoom(roomCode)).toBeUndefined();

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            room_code: roomCode,
            owner_id: 'client_owner_cons',
            owner_nickname: 'Việt',
            owner_birth_year: 1999,
            owner_card_id: 3,
            reader_id: 'chi_dai',
            status: 'completed',
            expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          },
        ],
      } as unknown as Response);

      const consentReq = new Request('https://test.local/api/couple', {
        method: 'POST',
        // Phase 1 ownership: consent must come from the room owner.
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': 'client_owner_cons',
        },
        body: JSON.stringify({
          action: 'consent_share',
          roomCode: roomCode,
          role: 'owner',
          consentShare: false,
        }),
      });

      const res = await postCoupleRoute(consentReq);
      expect(res.status).toBe(200);

      // Quota store hydrated
      const stored = getCoupleRoom(roomCode);
      expect(stored).toBeDefined();
      expect(stored?.ownerConsentedShare).toBe(false);
    });

    it('4.4 gracefully handles Supabase network failure without unhandled rejections', async () => {
      expect(getCoupleRoom('NETFAIL')).toBeUndefined();

      // Simulate network crash
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error: connect ECONNREFUSED'));

      const req = new Request('https://test.local/api/couple?roomCode=NETFAIL');
      const res = await getCoupleRoute(req);

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.code).toBe('ROOM_NOT_FOUND');
    });

    it('4.5 gracefully handles Supabase HTTP 500 error', async () => {
      expect(getCoupleRoom('HTTP500')).toBeUndefined();

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as unknown as Response);

      const req = new Request('https://test.local/api/couple?roomCode=HTTP500');
      const res = await getCoupleRoute(req);

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.code).toBe('ROOM_NOT_FOUND');
    });
  });

  // =========================================================================
  // SECTION 5: Persona Mapping, Data Integrity & Privacy
  // =========================================================================
  describe('5. Persona Mapping, Data Integrity & Privacy Guardrails', () => {
    it('5.1 maps legacy and non-canonical reader IDs to canonical persona profiles', async () => {
      const personaMapppings = [
        { dbReader: 'ba_co_mo_hon', expectedReader: 'chi_dai' },
        { dbReader: 'ba_ngoai_vui_tinh', expectedReader: 'ba_ngoai' },
        { dbReader: 'tong_tai_ly_tri', expectedReader: 'thay_cu_meo' },
        { dbReader: 'phap_su_toi_co', expectedReader: 'thay_cu_meo' },
        { dbReader: 'unknown_reader_xyz', expectedReader: 'ban_than' },
      ];

      for (const [idx, m] of personaMapppings.entries()) {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => [
            {
              room_code: `PERSONA_${idx}`,
              owner_id: 'user_1',
              owner_nickname: 'Khách',
              owner_card_id: 0,
              reader_id: m.dbReader,
              status: 'waiting_partner',
              expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
            },
          ],
        } as unknown as Response);

        const room = await fetchCoupleRoomFromSupabase(`PERSONA_${idx}`);
        expect(room?.readerId).toBe(m.expectedReader);
        expect(typeof room?.readerDisplayName).toBe('string');
        expect(room?.readerDisplayName.length).toBeGreaterThan(0);
      }
    });

    it('5.2 never leaks Person A private question in public view after Supabase hydration', async () => {
      const privateSecret = 'Tôi đang giấu đối phương một khoản nợ riêng?';

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            room_code: 'PRIVACY99',
            owner_id: 'user_privacy',
            owner_nickname: 'Bảo',
            owner_question_text: privateSecret,
            owner_card_id: 0,
            reader_id: 'chi_dai',
            status: 'waiting_partner',
            expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          },
        ],
      } as unknown as Response);

      const req = new Request('https://test.local/api/couple?roomCode=PRIVACY99');
      const res = await getCoupleRoute(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(JSON.stringify(data.room)).not.toContain(privateSecret);
      expect(data.room.ownerQuestionText).toBeUndefined();
    });
  });
});
