import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  resolveClientKey,
  resolveClientContext,
  resetAllQuotaStoreForTesting,
  isAdminRequest,
} from '../src/lib/quota-store';
import {
  resolveSignedSession,
  createSignedSessionValue,
  verifySessionValue,
} from '../src/lib/session';
import { POST as postReading, GET as getReading } from '../src/app/api/reading/route';
import { GET as getGrowth } from '../src/app/api/growth/route';
import { GET as getStoryCard } from '../src/app/api/story-card/route';

const BASE_URL = 'http://localhost:3000';

function anonRequest(path: string, fingerprint = { ip: '203.0.113.9', ua: 'TarotTest/1.0' }) {
  return new Request(`${BASE_URL}${path}`, {
    headers: {
      'x-forwarded-for': fingerprint.ip,
      'user-agent': fingerprint.ua,
    },
  });
}

async function createReadingFor(clientId: string, nickname: string, question: string) {
  const res = await postReading(
    new Request(`${BASE_URL}/api/reading`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-client-id': clientId },
      body: JSON.stringify({
        nickname,
        birth_year: 1998,
        reader_id: 'ba_co_mo_hon',
        topic: 'love',
        question_text: question,
        selected_indices: [1, 6, 9],
      }),
    })
  );
  expect(res.status).toBe(200);
  return res.json() as Promise<{ readingId: string; shareToken: string; ownerId: string }>;
}

describe('Phase 1b — Session binding, growth gating & share-card privacy', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetAllQuotaStoreForTesting();
    process.env = { ...originalEnv };
    delete process.env.ADMIN_SECRET;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('1. Quota identity cannot be reset by dropping the cookie', () => {
    it('derives the same anonymous key for requests with identical fingerprints', () => {
      const first = resolveClientKey(anonRequest('/api/reading'));
      const second = resolveClientKey(anonRequest('/api/reading'));
      expect(first).toBe(second);
      expect(first.startsWith('anon_')).toBe(true);
    });

    it('separates different devices sharing an IP via the User-Agent signal', () => {
      const a = resolveClientKey(anonRequest('/api/reading', { ip: '203.0.113.9', ua: 'Device-A' }));
      const b = resolveClientKey(anonRequest('/api/reading', { ip: '203.0.113.9', ua: 'Device-B' }));
      expect(a).not.toBe(b);
    });

    it('keeps the same key once the issued cookie is sent back', () => {
      const issued = resolveSignedSession(anonRequest('/api/reading'));
      expect(issued.isNew).toBe(true);

      const withCookie = new Request(`${BASE_URL}/api/reading`, {
        headers: {
          'x-forwarded-for': '203.0.113.9',
          'user-agent': 'TarotTest/1.0',
          cookie: `tc_sid=${issued.cookieHeaderValue}`,
        },
      });

      const resumed = resolveSignedSession(withCookie);
      expect(resumed.isNew).toBe(false);
      expect(resumed.sessionId).toBe(issued.sessionId);
      expect(resolveClientKey(withCookie)).toBe(`anon_${issued.sessionId}`);
    });

    it('ignores a forged tc_sid cookie instead of trusting the attacker id', () => {
      const forged = new Request(`${BASE_URL}/api/reading`, {
        headers: {
          'x-forwarded-for': '198.51.100.7',
          'user-agent': 'Attacker/1.0',
          cookie: 'tc_sid=attacker_chosen_id_123456.forged_signature',
        },
      });
      expect(verifySessionValue('attacker_chosen_id_123456.forged_signature')).toBeNull();
      const key = resolveClientKey(forged);
      expect(key.startsWith('anon_')).toBe(true);
      expect(key).not.toContain('attacker_chosen_id');
    });

    it('resolveClientContext returns a key consistent with the issued signed session', () => {
      const context = resolveClientContext(anonRequest('/api/reading'));
      expect(context.signedSession).not.toBeNull();
      expect(context.clientKey).toBe(`anon_${context.signedSession!.sessionId}`);
      expect(verifySessionValue(context.signedSession!.cookieHeaderValue)).toBe(
        context.signedSession!.sessionId
      );
    });

    it('issues a Set-Cookie header so the browser persists the identity', async () => {
      const res = await getReading(anonRequest('/api/reading'));
      expect(res.status).toBe(200);
      const setCookie = res.headers.get('set-cookie') || '';
      expect(setCookie).toContain('tc_sid=');
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('SameSite=Lax');
    });
  });

  describe('2. Growth metrics gating', () => {
    it('hides internal unit economics from anonymous callers', async () => {
      const res = await getGrowth(anonRequest('/api/growth'));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.unitEconomics).toBeUndefined();
      expect(json.wrapped).toBeDefined();
      expect(json.quota).toBeDefined();
    });

    it('reveals unit economics only to an authorized admin', async () => {
      process.env.ADMIN_SECRET = 'admin_secret_for_tests_1234567890';
      const res = await getGrowth(
        new Request(`${BASE_URL}/api/growth`, {
          headers: { 'x-admin-secret': 'admin_secret_for_tests_1234567890' },
        })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.unitEconomics).toBeDefined();
      expect(typeof json.unitEconomics.arpuVnd).toBe('number');
    });

    it('admin gate fails closed when ADMIN_SECRET is missing', () => {
      expect(isAdminRequest(new Request(`${BASE_URL}/api/growth?admin=1`))).toBe(false);
      expect(
        isAdminRequest(
          new Request(`${BASE_URL}/api/growth`, { headers: { 'x-admin-mode': '1' } })
        )
      ).toBe(false);
    });
  });

  describe('3. Spiritual Wrapped is scoped to its owner (H2)', () => {
    it('does not leak another user\'s nickname or topic into the wrapped profile', async () => {
      await createReadingFor('owner_victim_001', 'VictimSecretName', 'Câu hỏi riêng tư của nạn nhân');

      const res = await getGrowth(anonRequest('/api/growth'));
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.wrapped.nickname).not.toBe('VictimSecretName');
      expect(JSON.stringify(json.wrapped)).not.toContain('VictimSecretName');
    });

    it('blocks building growth kits from another user\'s reading', async () => {
      const created = await createReadingFor('owner_victim_002', 'Victim2', 'Bí mật 2');

      const res = await getGrowth(
        new Request(`${BASE_URL}/api/growth?readingId=${created.readingId}`, {
          headers: { 'x-client-id': 'attacker_999' },
        })
      );
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.code).toBe('FORBIDDEN_READING_ACCESS');
    });
  });

  describe('4. Story card privacy (H1/H11)', () => {
    it('refuses to render another user\'s reading without a share token', async () => {
      const created = await createReadingFor('owner_story_003', 'StoryOwner', 'Bí mật story');

      const res = await getStoryCard(
        new Request(`${BASE_URL}/api/story-card?readingId=${created.readingId}`, {
          headers: { 'x-client-id': 'attacker_story' },
        })
      );
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.code).toBe('FORBIDDEN_READING_ACCESS');
    });
  });
});
