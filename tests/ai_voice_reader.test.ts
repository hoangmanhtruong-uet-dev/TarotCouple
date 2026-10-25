import { describe, expect, it } from 'vitest';
import {
  aiVoiceEngine,
  READER_VOICE_PROFILES,
} from '../src/lib/voice-engine';
import { POST } from '../src/app/api/voice/route';
import type { ReaderId } from '../src/lib/schemas';

describe('AI Voice Reader Engine & API Suite', () => {
  it('configures distinct voice profiles for all 8 readers', () => {
    const readerIds: ReaderId[] = [
      'ba_ngoai',
      'chi_dai',
      'ban_than',
      'thay_cu_meo',
      'ba_co_mo_hon',
      'tien_tu_chua_lanh',
      'tong_tai_ly_tri',
      'phap_su_toi_co',
    ];

    for (const id of readerIds) {
      const profile = READER_VOICE_PROFILES[id];
      expect(profile).toBeDefined();
      expect(profile.lang).toBe('vi-VN');
      expect(profile.pitch).toBeGreaterThan(0.5);
      expect(profile.pitch).toBeLessThanOrEqual(1.5);
      expect(profile.rate).toBeGreaterThan(0.5);
      expect(profile.rate).toBeLessThanOrEqual(1.5);
      expect(profile.introPhrase.length).toBeGreaterThan(10);
    }
  });

  it('prepares formatted audio monologue sentences from raw text and removes markdown', () => {
    const raw = `### Thông điệp vũ trụ\n\nBạn đang đứng trước **ngã ba đường**. Hãy tỉnh táo! Đừng để cảm xúc lấn át lý trí.`;
    const sentences = aiVoiceEngine.prepareScript(raw, 'ba_ngoai', true);

    expect(sentences.length).toBeGreaterThanOrEqual(3);
    expect(sentences[0]).toContain('Cô Sáu');
    // Ensure markdown tags are stripped
    for (const s of sentences) {
      expect(s).not.toContain('###');
      expect(s).not.toContain('**');
    }
  });

  it('calculates progress and handles speed modification safely', () => {
    aiVoiceEngine.setSpeed(1.2);
    expect(aiVoiceEngine.getState().playbackRate).toBe(1.2);

    aiVoiceEngine.setSpeed(0.85);
    expect(aiVoiceEngine.getState().playbackRate).toBe(0.85);
  });

  it('POST /api/voice generates structured monologue with cue points and duration', async () => {
    const request = new Request('http://localhost:3000/api/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        readerId: 'thay_cu_meo',
        nickname: 'Minh Thảo',
        topicLabel: 'Chữa Lành & Thấu Cảm',
        overallVerdict: 'Mọi giông bão rồi sẽ qua đi khi bạn học cách buông bỏ những kỳ vọng không thực tế.',
        savageQuote: 'Bình an trong tâm hồn mới là thước đo đích thực của hạnh phúc.',
        cards: [
          { name_vi: 'Kẻ Khờ', reversed: false, position_label: 'Khởi đầu' },
          { name_vi: 'Mặt Trời', reversed: false, position_label: 'Hy vọng' },
        ],
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.readerId).toBe('thay_cu_meo');
    expect(data.script.length).toBeGreaterThanOrEqual(4);
    expect(data.fullText).toContain('Minh Thảo');
    expect(data.fullText).toContain('Kẻ Khờ');
    expect(data.estimatedDurationSeconds).toBeGreaterThan(5);
    expect(data.cuePoints.length).toBeGreaterThanOrEqual(3);
  });
});
