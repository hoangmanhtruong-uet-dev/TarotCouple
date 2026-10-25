import { NextResponse } from 'next/server';
import { getCachedReading } from '@/lib/quota-store';
import { READER_VOICE_PROFILES } from '@/lib/voice-engine';
import { READERS_BY_ID } from '@/data/tarot-cards';
import type { ReaderId } from '@/lib/schemas';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      readingId,
      readerId: rawReaderId,
      nickname = 'bạn',
      topicLabel = 'Tình Yêu & Kết Nối',
      overallVerdict,
      savageQuote,
      cards = [],
    } = body;

    let resolvedVerdict = overallVerdict;
    let resolvedQuote = savageQuote;
    let resolvedReaderId: ReaderId = (rawReaderId as ReaderId) || 'ba_ngoai';
    let resolvedCards = cards;

    if (readingId) {
      const cached = getCachedReading(readingId);
      if (cached) {
        resolvedVerdict = cached.result.overall_verdict;
        resolvedQuote = cached.result.shareable_card.savage_quote;
        resolvedReaderId = cached.readerId;
        resolvedCards = cached.drawnCards.map((c) => ({
          name_vi: c.card.name_vi,
          reversed: c.reversed,
          position_label: c.position_label,
        }));
      }
    }

    const readerObj = READERS_BY_ID[resolvedReaderId] || READERS_BY_ID.ba_ngoai;
    const voiceProfile = READER_VOICE_PROFILES[resolvedReaderId] || READER_VOICE_PROFILES.ba_ngoai;

    // Build podcast monologue
    const script: string[] = [];
    const cuePoints: Array<{ label: string; sentenceIndex: number }> = [];

    // Cue 1: Intro
    script.push(voiceProfile.introPhrase);
    cuePoints.push({ label: 'Mở đầu & Nạp năng lượng', sentenceIndex: 0 });

    // Cue 2: Context
    script.push(`Chào ${nickname}. Hôm nay chúng ta cùng soi chiếu câu chuyện về ${topicLabel}.`);

    // Cue 3: The Cards
    if (resolvedCards.length > 0) {
      const cardsSummary = resolvedCards
        .map((c: any) => `${c.position_label || 'Lá bài'}: ${c.name_vi} ${c.reversed ? '(ngược)' : '(xuôi)'}`)
        .join(', ');
      script.push(`Trải bài của bạn hiện ra: ${cardsSummary}. Năng lượng đang chuyển dịch rất rõ ràng.`);
      cuePoints.push({ label: 'Phân tích các lá bài', sentenceIndex: script.length - 1 });
    }

    // Cue 4: Verdict
    if (resolvedVerdict) {
      script.push(resolvedVerdict);
      cuePoints.push({ label: 'Lời khuyên cốt lõi', sentenceIndex: script.length - 1 });
    }

    // Cue 5: Savage / Closing quote
    if (resolvedQuote) {
      script.push(`Câu chốt hạ dành cho bạn: "${resolvedQuote}"`);
      cuePoints.push({ label: 'Thông điệp thức tỉnh', sentenceIndex: script.length - 1 });
    }

    script.push(`Chúc ${nickname} luôn vững vàng với lựa chọn của chính mình. Hãy thở đều và cảm nhận sự an yên nhé.`);

    const fullText = script.join(' ');
    // Average speaking speed in Vietnamese: ~2.5 words per second
    const totalWords = fullText.split(/\s+/).length;
    const estimatedDurationSeconds = Math.round(totalWords / 2.5);

    return NextResponse.json({
      status: 'ok',
      readerId: resolvedReaderId,
      readerName: readerObj.name,
      script,
      fullText,
      estimatedDurationSeconds,
      cuePoints,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error?.message || 'Không thể tạo kịch bản giọng đọc AI.',
      },
      { status: 500 }
    );
  }
}
