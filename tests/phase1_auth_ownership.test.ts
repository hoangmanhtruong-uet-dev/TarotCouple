import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST as postReading, GET as getReading } from '../src/app/api/reading/route';
import { GET as getFollowup, POST as postFollowup } from '../src/app/api/reading/[id]/followup/route';
import { POST as postClarifier } from '../src/app/api/clarifier/route';
import { POST as postCouple, GET as getCouple } from '../src/app/api/couple/route';
import {
  createSignedSessionValue,
  verifySessionValue,
  resolveSignedSession,
  buildSessionCookieHeader,
  extractAuthenticatedUserId,
} from '../src/lib/session';
import {
  resetAllQuotaStoreForTesting,
  resolveClientKey,
  isAdminRequest,
  saveCoupleRoom,
} from '../src/lib/quota-store';

describe('Phase 1 Auth, Ownership & Gating Test Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetAllQuotaStoreForTesting();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('1. Signed Anonymous Session Management (tc_sid)', () => {
    it('generates HMAC-SHA256 signed session cookie and verifies authentic signatures', () => {
      const sessionId = 'test_session_opaque_id_12345';
      const cookieValue = createSignedSessionValue(sessionId);

      expect(cookieValue).toContain(`${sessionId}.`);

      // Verify authentic cookie
      const verified = verifySessionValue(cookieValue);
      expect(verified).toBe(sessionId);

      // Reject tampered cookie payload
      const tampered = `${sessionId}.invalid_tampered_signature_xyz`;
      expect(verifySessionValue(tampered)).toBeNull();

      // Reject malformed cookie without separator
      expect(verifySessionValue('just_an_id_without_signature')).toBeNull();
      expect(verifySessionValue(null)).toBeNull();
    });

    it('builds secure, httpOnly, sameSite=Lax cookie header', () => {
      const cookieVal = createSignedSessionValue('session_cookie_test');
      process.env.NODE_ENV = 'production';
      const prodHeader = buildSessionCookieHeader(cookieVal);
      expect(prodHeader).toContain('HttpOnly');
      expect(prodHeader).toContain('SameSite=Lax');
      expect(prodHeader).toContain('Secure');
      expect(prodHeader).toContain(`tc_sid=${cookieVal}`);

      process.env.NODE_ENV = 'development';
      const devHeader = buildSessionCookieHeader(cookieVal);
      expect(devHeader).toContain('HttpOnly');
      expect(devHeader).not.toContain('Secure');
    });

    it('extracts Supabase authenticated user ID from Bearer token', () => {
      // Mock simple JWT with { sub: 'usr_supabase_999' }
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: 'usr_supabase_999' })).toString('base64url');
      const fakeJwt = `${header}.${payload}.sig`;

      const req = new Request('http://localhost:3000/api/reading', {
        headers: { Authorization: `Bearer ${fakeJwt}` },
      });

      expect(extractAuthenticatedUserId(req)).toBe('usr_supabase_999');
      expect(resolveClientKey(req)).toBe('user_usr_supabase_999');
    });
  });

  describe('2. Reading Ownership & Data Privacy (H1, H2)', () => {
    it('allows User A (owner) to view their reading, blocks User B (403), and provides sanitized view via shareToken', async () => {
      const userAId = 'user_alice_123';
      const userBId = 'user_bob_456';

      // 1. User A creates a reading
      const createReq = new Request('http://localhost:3000/api/reading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': userAId,
        },
        body: JSON.stringify({
          nickname: 'Alice',
          birth_year: 2000,
          reader_id: 'ba_co_mo_hon',
          topic: 'love',
          question_text: 'Bí mật riêng tư của Alice không muốn ai biết',
          selected_indices: [2, 5, 10],
        }),
      });

      const createRes = await postReading(createReq);
      expect(createRes.status).toBe(200);
      const readingJson = await createRes.json();
      const readingId = readingJson.readingId;
      const shareToken = readingJson.shareToken;

      expect(readingId).toBeDefined();
      expect(shareToken).toBeDefined();
      expect(readingJson.ownerId).toBe(userAId);
      expect(readingJson.questionText).toBe('Bí mật riêng tư của Alice không muốn ai biết');

      // 2. User A fetches their reading -> 200 OK with full questionText
      const userAFetchReq = new Request(`http://localhost:3000/api/reading?readingId=${readingId}`, {
        method: 'GET',
        headers: { 'x-client-id': userAId },
      });
      const userAFetchRes = await getReading(userAFetchReq);
      expect(userAFetchRes.status).toBe(200);
      const userAData = await userAFetchRes.json();
      expect(userAData.reading.questionText).toBe('Bí mật riêng tư của Alice không muốn ai biết');

      // 3. User B (stranger) attempts to snoop User A\'s reading without shareToken -> 403 Forbidden!
      const userBFetchReq = new Request(`http://localhost:3000/api/reading?readingId=${readingId}`, {
        method: 'GET',
        headers: { 'x-client-id': userBId },
      });
      const userBFetchRes = await getReading(userBFetchReq);
      expect(userBFetchRes.status).toBe(403);
      const userBData = await userBFetchRes.json();
      expect(userBData.code).toBe('FORBIDDEN_READING_ACCESS');

      // 4. User B accesses via valid shareToken -> 200 OK with SANITIZED public view (no questionText!)
      const sharedReq = new Request(
        `http://localhost:3000/api/reading?readingId=${readingId}&shareToken=${shareToken}`,
        {
          method: 'GET',
          headers: { 'x-client-id': userBId },
        }
      );
      const sharedRes = await getReading(sharedReq);
      expect(sharedRes.status).toBe(200);
      const sharedData = await sharedRes.json();
      expect(sharedData.reading.isSharedView).toBe(true);
      expect(sharedData.reading.questionText).toBeUndefined(); // Filtered!
      expect(sharedData.reading.drawnCards).toBeDefined();
      expect(sharedData.reading.result).toBeDefined();
    });
  });

  describe('3. Followup Access & Mutation Ownership', () => {
    it('blocks User B from viewing or asking followups on User A\'s reading', async () => {
      const userAId = 'owner_carol_789';
      const userBId = 'attacker_dave_000';

      // Create reading owned by Carol
      const createRes = await postReading(
        new Request('http://localhost:3000/api/reading', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': userAId,
          },
          body: JSON.stringify({
            nickname: 'Carol',
            birth_year: 2001,
            reader_id: 'ban_than',
            topic: 'career',
            question_text: 'Chuyện sự nghiệp công ty riêng',
            selected_indices: [0, 4, 7],
          }),
        })
      );
      const { readingId } = await createRes.json();

      // User B tries to view Carol\'s followups -> 403
      const getFollowupRes = await getFollowup(
        new Request(`http://localhost:3000/api/reading/${readingId}/followup`, {
          headers: { 'x-client-id': userBId },
        }),
        { params: Promise.resolve({ id: readingId }) }
      );
      expect(getFollowupRes.status).toBe(403);
      const getJson = await getFollowupRes.json();
      expect(getJson.code).toBe('FORBIDDEN_READING_ACCESS');

      // User B tries to ask a followup on Carol\'s reading -> 403
      const postFollowupRes = await postFollowup(
        new Request(`http://localhost:3000/api/reading/${readingId}/followup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': userBId,
          },
          body: JSON.stringify({ question: 'Can I probe your career secret?' }),
        }),
        { params: Promise.resolve({ id: readingId }) }
      );
      expect(postFollowupRes.status).toBe(403);
      const postJson = await postFollowupRes.json();
      expect(postJson.code).toBe('FORBIDDEN_READING_ACCESS');
    });
  });

  describe('4. Admin Gate & Funnel Isolation (H3)', () => {
    it('fails closed when ADMIN_SECRET is not configured', () => {
      delete process.env.ADMIN_SECRET;

      // Without ADMIN_SECRET, even ?admin=1 or x-admin-mode: 1 are strictly rejected
      const req1 = new Request('http://localhost:3000/api/reading?admin=1');
      expect(isAdminRequest(req1)).toBe(false);

      const req2 = new Request('http://localhost:3000/api/reading', {
        headers: { 'x-admin-mode': '1' },
      });
      expect(isAdminRequest(req2)).toBe(false);
    });

    it('hides funnel analytics & AI budget from public GET /api/reading', async () => {
      delete process.env.ADMIN_SECRET;

      const publicReq = new Request('http://localhost:3000/api/reading', {
        method: 'GET',
        headers: { 'x-client-id': 'public_visitor' },
      });
      const publicRes = await getReading(publicReq);
      expect(publicRes.status).toBe(200);
      const json = await publicRes.json();

      expect(json.quota).toBeDefined();
      expect(json.funnel).toBeUndefined(); // Protected!
      expect(json.budget).toBeUndefined(); // Protected!
    });

    it('returns funnel analytics & AI budget only when authorized with ADMIN_SECRET', async () => {
      process.env.ADMIN_SECRET = 'super_secret_admin_token_2026';

      const adminReq = new Request('http://localhost:3000/api/reading', {
        method: 'GET',
        headers: {
          'x-client-id': 'founder_client',
          'x-admin-secret': 'super_secret_admin_token_2026',
        },
      });
      const adminRes = await getReading(adminReq);
      expect(adminRes.status).toBe(200);
      const json = await adminRes.json();

      expect(json.quota).toBeDefined();
      expect(json.funnel).toBeDefined(); // Revealed to admin!
      expect(json.budget).toBeDefined(); // Revealed to admin!
    });
  });

  describe('5. Couple Mode Security (C7)', () => {
    it('blocks join_room when room status is already completed', async () => {
      // Create a completed room
      const completedRoom = saveCoupleRoom({
        roomCode: 'COMPLETED123',
        ownerId: 'user_first_owner',
        ownerNickname: 'FirstPerson',
        ownerBirthYear: 2000,
        readerId: 'ba_co_mo_hon',
        readerDisplayName: 'Bà Cô Mỏ Hỗn',
        relationshipStatus: 'situationship',
        relationshipLabel: 'Đang mập mờ',
        deckMode: 'major_22',
        ownerQuestionText: 'Hợp không?',
        ownerCard: {
          card: { id: 1, name: 'The Magician', vietnamese: 'Ảo thuật gia', arcana: 'major', suit: null, number: 1, element: 'fire', keywords: ['Ý chí'], upright: 'Khởi đầu', reversed: 'Lừa dối', meaning: 'Hành động' },
          reversed: false,
        },
        ownerConsentedShare: true,
        partnerNickname: 'SecondPerson',
        partnerBirthYear: 2001,
        partnerConsentedShare: true,
        status: 'completed',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
      });

      expect(completedRoom.status).toBe('completed');

      // Attempt to join already completed room
      const joinReq = new Request('http://localhost:3000/api/couple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join_room',
          roomCode: 'COMPLETED123',
          partnerNickname: 'Intruder',
        }),
      });

      const res = await postCouple(joinReq);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe('ROOM_COMPLETED');
    });
  });

  describe('6. Zod Validation on Mutating Routes (M7)', () => {
    it('rejects invalid request payloads with 400 VALIDATION_ERROR on clarifier', async () => {
      const invalidReq = new Request('http://localhost:3000/api/clarifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // missing followup_question / followupQuestion
          nickname: 'User',
        }),
      });

      const res = await postClarifier(invalidReq);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe('VALIDATION_ERROR');
    });
  });
});
