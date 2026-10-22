import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST as postGrowth, GET as getGrowth } from '../src/app/api/growth/route';
import { POST as postCouple } from '../src/app/api/couple/route';
import {
  consumeQuota,
  getQuotaStatus,
  resetAllQuotaStoreForTesting,
} from '../src/lib/quota-store';

const BASE_URL = 'http://localhost:3000';

function jsonRequest(path: string, clientId: string, body: unknown) {
  return new Request(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': clientId,
    },
    body: JSON.stringify(body),
  });
}

async function registerReferralCode(clientId: string): Promise<string> {
  const res = await getGrowth(
    new Request(`${BASE_URL}/api/growth`, {
      headers: { 'x-client-id': clientId },
    })
  );
  expect(res.status).toBe(200);
  const data = await res.json();
  return data.referral.referralCode as string;
}

const SOLO_COUPLE_PAYLOAD = {
  action: 'solo_couple',
  ownerNickname: 'Linh',
  partnerNickname: 'Anh Ấy',
  birthYear: 1998,
  readerId: 'ba_co_mo_hon',
  relationshipStatus: 'situationship',
  questionText: 'Tụi mình có hợp nhau không?',
};

describe('Phase 2 — Economic abuse locks (referral + AI quota)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetAllQuotaStoreForTesting();
    process.env = { ...originalEnv };
    delete process.env.ADMIN_SECRET;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('H4 — referral codes must exist and belong to someone else', () => {
    it('rejects a fabricated code instead of minting free Stars', async () => {
      const res = await postGrowth(
        jsonRequest('/api/growth', 'ref_cheater_01', {
          action: 'claim_referral',
          referralCode: 'TC-AAAAA',
        })
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.status).toBe('error');
      expect(data.reason).toBe('INVALID_CODE');

      // Wallet untouched: the default signup balance is 10 Stars.
      expect(getQuotaStatus('ref_cheater_01').starsBalance).toBe(10);
    });

    it('rejects several fabricated codes in a row (no farm loop)', async () => {
      for (const code of ['TC-AAAAA', 'TC-BBBBB', 'TC-CCCCC', 'TC-DDDDD']) {
        const res = await postGrowth(
          jsonRequest('/api/growth', 'ref_cheater_02', {
            action: 'claim_referral',
            referralCode: code,
          })
        );
        expect(res.status).toBe(400);
      }
      expect(getQuotaStatus('ref_cheater_02').starsBalance).toBe(10);
      expect(getQuotaStatus('ref_cheater_02').bonusDraws).toBe(0);
    });

    it('still rewards a real referrer and the invitee once', async () => {
      const code = await registerReferralCode('ref_real_owner');
      expect(code).toMatch(/^TC-/);

      const res = await postGrowth(
        jsonRequest('/api/growth', 'ref_real_invitee', {
          action: 'claim_referral',
          referralCode: code,
        })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.starsAwarded).toBe(5);
      expect(data.quota.starsBalance).toBe(15);
      expect(data.quota.bonusDraws).toBe(1);

      // Referrer also receives the bonus.
      expect(getQuotaStatus('ref_real_owner').starsBalance).toBe(15);

      // Replay of the same code is refused.
      const replay = await postGrowth(
        jsonRequest('/api/growth', 'ref_real_invitee', {
          action: 'claim_referral',
          referralCode: code,
        })
      );
      expect(replay.status).toBe(400);
      expect(getQuotaStatus('ref_real_invitee').starsBalance).toBe(15);
    });

    it('rejects self-referral without awarding anything', async () => {
      const code = await registerReferralCode('ref_self_owner');

      const res = await postGrowth(
        jsonRequest('/api/growth', 'ref_self_owner', {
          action: 'claim_referral',
          referralCode: code,
        })
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.reason).toBe('SELF_REFERRAL');
      expect(getQuotaStatus('ref_self_owner').starsBalance).toBe(10);
    });
  });

  describe('C7/H11 — /api/couple is metered like any other AI route', () => {
    it('rejects the Couple AI call when the daily quota is exhausted', async () => {
      // FREE_DAILY_READINGS === 3
      for (let i = 0; i < 3; i += 1) {
        consumeQuota('couple_exhausted', 0, 0, 'major_22');
      }
      expect(getQuotaStatus('couple_exhausted').remainingToday).toBe(0);

      const res = await postCouple(
        jsonRequest('/api/couple', 'couple_exhausted', SOLO_COUPLE_PAYLOAD)
      );

      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.code).toBe('QUOTA_EXCEEDED');
      // No extra usage was recorded by the rejected call.
      expect(getQuotaStatus('couple_exhausted').usedToday).toBe(3);
    });

    it('consumes exactly one quota unit on a successful Couple reading', async () => {
      const before = getQuotaStatus('couple_metered').usedToday;

      const res = await postCouple(
        jsonRequest('/api/couple', 'couple_metered', SOLO_COUPLE_PAYLOAD)
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('ok');
      expect(data.reading.ownerId).toBe('couple_metered');
      expect(data.reading.shareToken).toMatch(/^sh_/);
      expect(getQuotaStatus('couple_metered').usedToday).toBe(before + 1);
    });

    it('refuses a non-owner trying to change room sharing consent', async () => {
      // Owner creates a room.
      const createRes = await postCouple(
        jsonRequest('/api/couple', 'room_owner_1', {
          action: 'create_room',
          ownerNickname: 'Chủ Phòng',
          birthYear: 1998,
          readerId: 'ba_co_mo_hon',
          relationshipStatus: 'dating',
          questionText: 'Anh ấy có yêu mình thật lòng?',
        })
      );
      expect(createRes.status).toBe(200);
      const createData = await createRes.json();
      const roomCode = createData.room.roomCode as string;
      expect(roomCode).toBeTruthy();

      // A stranger cannot flip the owner's consent.
      const res = await postCouple(
        jsonRequest('/api/couple', 'room_stranger_1', {
          action: 'consent_share',
          roomCode,
          role: 'owner',
          consentShare: true,
        })
      );
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('FORBIDDEN_READING_ACCESS');

      // The real owner can.
      const ownerRes = await postCouple(
        jsonRequest('/api/couple', 'room_owner_1', {
          action: 'consent_share',
          roomCode,
          consentShare: true,
        })
      );
      expect(ownerRes.status).toBe(200);
      const ownerData = await ownerRes.json();
      expect(ownerData.room.ownerConsentedShare).toBe(true);
    });
  });
});
