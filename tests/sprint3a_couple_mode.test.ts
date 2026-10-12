import { describe, it, expect, beforeEach } from 'vitest';
import { GET as getCouple, POST as postCouple } from '@/app/api/couple/route';
import { resetAllQuotaStoreForTesting } from '@/lib/quota-store';

describe('Sprint 3A: Couple Mode Verification Suite (P12-P15)', () => {
  beforeEach(() => {
    resetAllQuotaStoreForTesting();
  });

  it('1. Person A creates a 48h Co-op room, gets 6-char code, and keeps private question hidden from response', async () => {
    const clientHeaders = {
      'Content-Type': 'application/json',
      'x-client-id': 'person_a_client_3a',
    };

    const secretQuestion = 'Người ấy có thật lòng muốn cam kết lâu dài hay chỉ đang tìm chỗ trốn tạm thời?';

    const createReq = new Request('http://localhost:3000/api/couple', {
      method: 'POST',
      headers: clientHeaders,
      body: JSON.stringify({
        action: 'create_room',
        ownerNickname: 'Thu Thảo',
        partnerNickname: 'Đức Huy',
        birthYear: 2003,
        readerId: 'chi_dai',
        relationshipStatus: 'dating',
        questionText: secretQuestion,
        deckMode: 'full_78',
      }),
    });

    const createRes = await postCouple(createReq);
    expect(createRes.status).toBe(200);
    const createJson = await createRes.json();

    expect(createJson.status).toBe('ok');
    expect(createJson.room.roomCode).toMatch(/^[A-Z0-9]{6}$/);
    expect(createJson.room.status).toBe('waiting_partner');
    expect(createJson.room.ownerNickname).toBe('Thu Thảo');
    expect(createJson.room.ownerCard).toBeDefined();
    expect(createJson.room.ownerCard.card.id).toBeDefined();

    // CRITICAL PRIVACY GUARDRAIL: Private question MUST NEVER be leaked in public room view
    expect(JSON.stringify(createJson.room)).not.toContain(secretQuestion);
    expect((createJson.room as Record<string, unknown>).ownerQuestionText).toBeUndefined();
  });

  it('2. Person B queries GET /api/couple?roomCode=... and does NOT receive Person A secret question', async () => {
    // 1. Create room
    const createReq = new Request('http://localhost:3000/api/couple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-client-id': 'person_a_3a_2' },
      body: JSON.stringify({
        action: 'create_room',
        ownerNickname: 'An',
        partnerNickname: 'Bình',
        birthYear: 2002,
        readerId: 'ban_than',
        relationshipStatus: 'crush',
        questionText: 'Tôi đang crush bạn cùng bàn bí mật tuyệt đối',
      }),
    });
    const createRes = await postCouple(createReq);
    const createJson = await createRes.json();
    const roomCode = createJson.room.roomCode;

    // 2. Person B calls GET
    const getReq = new Request(`http://localhost:3000/api/couple?roomCode=${roomCode}`, {
      method: 'GET',
      headers: { 'x-client-id': 'person_b_3a_2' },
    });
    const getRes = await getCouple(getReq);
    expect(getRes.status).toBe(200);
    const getJson = await getRes.json();

    expect(getJson.status).toBe('ok');
    expect(getJson.room.roomCode).toBe(roomCode);
    expect(getJson.room.status).toBe('waiting_partner');
    expect(JSON.stringify(getJson.room)).not.toContain('crush bạn cùng bàn bí mật');
  });

  it('3. Person B joins room, draws Card 2, AI analyzes compatibility, and GET returns completed reading to Person A polling', async () => {
    // 1. Create room
    const createReq = new Request('http://localhost:3000/api/couple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-client-id': 'person_a_3a_3' },
      body: JSON.stringify({
        action: 'create_room',
        ownerNickname: 'Khánh',
        partnerNickname: 'Linh',
        birthYear: 2001,
        readerId: 'thay_cu_meo',
        relationshipStatus: 'situationship',
        questionText: 'Hai đứa có thể tiến tới quan hệ chính thức không?',
      }),
    });
    const createRes = await postCouple(createReq);
    const createJson = await createRes.json();
    const roomCode = createJson.room.roomCode;

    // 2. Person B joins
    const joinReq = new Request('http://localhost:3000/api/couple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-client-id': 'person_b_3a_3' },
      body: JSON.stringify({
        action: 'join_room',
        roomCode,
        partnerNickname: 'Linh',
        birthYear: 2002,
        selected_index: 12,
      }),
    });
    const joinRes = await postCouple(joinReq);
    expect(joinRes.status).toBe(200);
    const joinJson = await joinRes.json();

    expect(joinJson.status).toBe('ok');
    expect(joinJson.room.status).toBe('completed');
    expect(joinJson.reading).toBeDefined();
    expect(joinJson.reading.drawnCards).toHaveLength(3);
    expect(joinJson.reading.result.metrics.compatibility_score).toBeGreaterThanOrEqual(0);
    expect(joinJson.reading.result.metrics.red_flag_level).toBeGreaterThanOrEqual(0);

    // 3. Person A polls GET /api/couple?roomCode=... and receives completed status & full reading
    const pollReq = new Request(`http://localhost:3000/api/couple?roomCode=${roomCode}`, {
      method: 'GET',
      headers: { 'x-client-id': 'person_a_3a_3' },
    });
    const pollRes = await getCouple(pollReq);
    expect(pollRes.status).toBe(200);
    const pollJson = await pollRes.json();

    expect(pollJson.room.status).toBe('completed');
    expect(pollJson.reading).toBeDefined();
    expect(pollJson.reading.drawnCards).toHaveLength(3);
    expect(pollJson.reading.result.metrics.compatibility_score).toBe(
      joinJson.reading.result.metrics.compatibility_score
    );
  });

  it('4. Solo Couple Check runs directly with 3 cards (Owner, Partner, Future Connection) and returns compatibility metrics', async () => {
    const soloReq = new Request('http://localhost:3000/api/couple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-client-id': 'solo_tester_3a' },
      body: JSON.stringify({
        action: 'solo_couple',
        ownerNickname: 'Tuấn',
        partnerNickname: 'Mai',
        birthYear: 2000,
        readerId: 'ba_ngoai',
        relationshipStatus: 'dating',
        questionText: 'Hai đứa sắp kỷ niệm 1 năm, năng lượng sắp tới thế nào bà ơi?',
        selected_indices: [2, 9, 15],
      }),
    });

    const soloRes = await postCouple(soloReq);
    expect(soloRes.status).toBe(200);
    const soloJson = await soloRes.json();

    expect(soloJson.status).toBe('ok');
    expect(soloJson.reading).toBeDefined();
    expect(soloJson.reading.drawnCards).toHaveLength(3);
    expect(soloJson.reading.drawnCards[0].position_label).toContain('Tuấn');
    expect(soloJson.reading.drawnCards[1].position_label).toContain('Mai');
    expect(soloJson.reading.result.metrics.compatibility_score).toBeGreaterThanOrEqual(40);
    expect(soloJson.reading.result.metrics.vibe_tag).toBeDefined();
    expect(soloJson.reading.result.actionable_next_step).toBeDefined();
  });
});
