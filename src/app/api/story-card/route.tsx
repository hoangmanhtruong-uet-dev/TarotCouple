import React from 'react';
import { ImageResponse } from 'next/og';
import { MAJOR_ARCANA, TAROT_CARDS_BY_ID, type TarotCard } from '@/data/tarot-cards';
import { getCachedReading, recordFunnelEvent } from '@/lib/quota-store';
import type { EffectivePersona } from '@/lib/schemas';

export const runtime = 'nodejs';

interface StoryCardSlot {
  card: TarotCard;
  reversed: boolean;
  positionLabel: string;
}

let cachedFontBold: ArrayBuffer | null = null;
let cachedFontMedium: ArrayBuffer | null = null;

/**
 * Fetch Vietnamese-capable TTF font (Be Vietnam Pro) with in-memory caching & fast timeout fallback
 */
async function loadVietnameseFonts(): Promise<
  Array<{ name: string; data: ArrayBuffer; weight: 500 | 700; style: 'normal' }>
> {
  const fonts: Array<{
    name: string;
    data: ArrayBuffer;
    weight: 500 | 700;
    style: 'normal';
  }> = [];

  try {
    if (!cachedFontBold || !cachedFontMedium) {
      const [boldRes, mediumRes] = await Promise.all([
        fetch(
          'https://cdn.jsdelivr.net/fontsource/fonts/be-vietnam-pro@latest/vietnamese-700-normal.ttf',
          { signal: AbortSignal.timeout(2500) }
        ),
        fetch(
          'https://cdn.jsdelivr.net/fontsource/fonts/be-vietnam-pro@latest/vietnamese-500-normal.ttf',
          { signal: AbortSignal.timeout(2500) }
        ),
      ]);

      if (boldRes.ok) {
        cachedFontBold = await boldRes.arrayBuffer();
      }
      if (mediumRes.ok) {
        cachedFontMedium = await mediumRes.arrayBuffer();
      }
    }

    if (cachedFontBold) {
      fonts.push({
        name: 'BeVietnamPro',
        data: cachedFontBold,
        weight: 700,
        style: 'normal',
      });
    }
    if (cachedFontMedium) {
      fonts.push({
        name: 'BeVietnamPro',
        data: cachedFontMedium,
        weight: 500,
        style: 'normal',
      });
    }
  } catch {
    // Graceful fallback to system font if offline or CDN unreachable
  }

  return fonts;
}

function parseCardsParam(
  cardsParam: string | null,
  defaultLabels: [string, string, string]
): [StoryCardSlot, StoryCardSlot, StoryCardSlot] {
  const defaultIds: [number, number, number] = [0, 6, 19];
  if (!cardsParam) {
    return [
      { card: TAROT_CARDS_BY_ID[0] ?? MAJOR_ARCANA[0]!, reversed: false, positionLabel: defaultLabels[0] },
      { card: TAROT_CARDS_BY_ID[6] ?? MAJOR_ARCANA[6]!, reversed: false, positionLabel: defaultLabels[1] },
      { card: TAROT_CARDS_BY_ID[19] ?? MAJOR_ARCANA[19]!, reversed: false, positionLabel: defaultLabels[2] },
    ];
  }

  const parts = cardsParam.split(',').slice(0, 3);
  const slots: StoryCardSlot[] = [0, 1, 2].map((idx) => {
    const raw = parts[idx]?.trim() || `${defaultIds[idx]}:0`;
    const [idStr, revStr] = raw.split(':');
    const parsedId = Number.parseInt(idStr || '0', 10);
    const validId = Number.isNaN(parsedId)
      ? defaultIds[idx]!
      : Math.max(0, Math.min(77, parsedId));
    const reversed = revStr === '1' || revStr === 'true' || revStr === 'rev';
    return {
      card: TAROT_CARDS_BY_ID[validId] ?? MAJOR_ARCANA[0]!,
      reversed,
      positionLabel: defaultLabels[idx] || `Lá số ${idx + 1}`,
    };
  });

  return [slots[0]!, slots[1]!, slots[2]!];
}

function getPersonaTheme(persona: EffectivePersona) {
  if (persona === 'ba_ngoai') {
    return {
      badgeText: 'BÀ NGOẠI • GÓC BẾP ẤM ÁP',
      accentPrimary: '#EAB308',
      accentSecondary: '#FEF08A',
      borderGlow: 'rgba(234, 179, 8, 0.45)',
      pillBg: 'rgba(234, 179, 8, 0.18)',
      bgGradient: 'linear-gradient(180deg, #0D0A14 0%, #1F1726 48%, #09080D 100%)',
    };
  }
  if (persona === 'chi_dai') {
    return {
      badgeText: 'CHỊ ĐẠI • THẲNG MÀ THƯƠNG',
      accentPrimary: '#E11D48',
      accentSecondary: '#FDA4AF',
      borderGlow: 'rgba(225, 29, 72, 0.45)',
      pillBg: 'rgba(225, 29, 72, 0.18)',
      bgGradient: 'linear-gradient(180deg, #0F0712 0%, #26101E 48%, #09080D 100%)',
    };
  }
  if (persona === 'ban_than') {
    return {
      badgeText: 'BẠN THÂN • HỘI BÀ TÁM ĐÊM KHUYA',
      accentPrimary: '#EC4899',
      accentSecondary: '#FBCFE8',
      borderGlow: 'rgba(236, 72, 153, 0.45)',
      pillBg: 'rgba(236, 72, 153, 0.18)',
      bgGradient: 'linear-gradient(180deg, #0E0714 0%, #24112B 48%, #09080D 100%)',
    };
  }
  if (persona === 'thay_cu_meo') {
    return {
      badgeText: 'THẦY CÚ MÈO • GÓC NHÌN THÔNG THÁI',
      accentPrimary: '#3B82F6',
      accentSecondary: '#BFDBFE',
      borderGlow: 'rgba(59, 130, 246, 0.45)',
      pillBg: 'rgba(59, 130, 246, 0.18)',
      bgGradient: 'linear-gradient(180deg, #070B19 0%, #0F1B33 48%, #070A14 100%)',
    };
  }
  if (persona === 'tien_tu_chua_lanh') {
    return {
      badgeText: 'TIÊN TỬ CHỮA LÀNH • TRẠM DỪNG TÂM HỒN',
      accentPrimary: '#8CE0C9',
      accentSecondary: '#D1FAE5',
      borderGlow: 'rgba(140, 224, 201, 0.45)',
      pillBg: 'rgba(16, 185, 129, 0.16)',
      bgGradient: 'linear-gradient(180deg, #090714 0%, #0F1F26 48%, #090A14 100%)',
    };
  }
  if (persona === 'tong_tai_ly_tri') {
    return {
      badgeText: 'TỔNG TÀI LÝ TRÍ • PHÂN TÍCH CHIẾN LƯỢC',
      accentPrimary: '#60A5FA',
      accentSecondary: '#DBEAFE',
      borderGlow: 'rgba(96, 165, 250, 0.45)',
      pillBg: 'rgba(59, 130, 246, 0.18)',
      bgGradient: 'linear-gradient(180deg, #070B19 0%, #0F1B33 48%, #070A14 100%)',
    };
  }
  if (persona === 'phap_su_toi_co') {
    return {
      badgeText: 'PHÁP SƯ TỐI CỔ • MẬT NGỮ TINH HÀ',
      accentPrimary: '#C084FC',
      accentSecondary: '#F3E8FF',
      borderGlow: 'rgba(192, 132, 252, 0.45)',
      pillBg: 'rgba(168, 85, 247, 0.18)',
      bgGradient: 'linear-gradient(180deg, #090514 0%, #1B0F30 48%, #080512 100%)',
    };
  }
  if (persona === 'ba_ngoai_vui_tinh') {
    return {
      badgeText: 'BÀ NGOẠI VUI TÍNH • GÓC HỌC ĐƯỜNG',
      accentPrimary: '#FBBF24',
      accentSecondary: '#FEF3C7',
      borderGlow: 'rgba(251, 191, 36, 0.45)',
      pillBg: 'rgba(245, 158, 11, 0.18)',
      bgGradient: 'linear-gradient(180deg, #0D0A1A 0%, #1E1638 48%, #0B0816 100%)',
    };
  }
  return {
    badgeText: 'BÀ CỐ MỎ HỖN • CHECK VAR VŨ TRỤ',
    accentPrimary: '#C9A24A',
    accentSecondary: '#FDE68A',
    borderGlow: 'rgba(201, 162, 74, 0.48)',
    pillBg: 'rgba(201, 162, 74, 0.16)',
    bgGradient: 'linear-gradient(180deg, #08060C 0%, #19102C 48%, #08060C 100%)',
  };
}

const DEFAULT_QUOTES_BY_PERSONA: Record<EffectivePersona, [string, string, string]> = {
  ba_ngoai: [
    'Ngồi xuống đây con, kể bà nghe. Ăn chén cơm ấm rồi lòng sẽ bình yên.',
    'Chuyện gì rồi cũng sẽ qua, thương lấy thân mình trước đã nghen con.',
    'Bà thương con nhiều, đừng ôm một mình mà nặng lòng.',
  ],
  chi_dai: [
    'Nói thẳng nha, đừng vòng vo. Tỉnh mộng đi cưng, người ta bận rep đứa khác rồi!',
    'Vũ trụ bật đèn xanh cho mày bước tiếp, đứng đó khóc lóc làm gì?',
    'Biết yêu bản thân thì ngẩng cao đầu lên, giá trị của mày không nằm ở sự thương hại.',
  ],
  ban_than: [
    'Kể đi, tao nghe hết, không phán xét. Đêm nay có tao thức cùng mày!',
    'Lại overthinking đúng không? Thôi ngủ đi mai còn dậy kiếm tiền bồ ơi!',
    'Dù cả thế giới có quay lưng thì tao vẫn ở đây, yên tâm đi!',
  ],
  thay_cu_meo: [
    'Hãy bắt đầu từ điều khiến con bận tâm nhất. Dữ liệu không nói dối.',
    'Cắt lỗ cảm xúc đúng lúc là quyết định thông thái nhất của bạn.',
    'Khi góc nhìn thay đổi, bài toán khó nhất cũng sẽ có lời giải.',
  ],
  ba_co_mo_hon: [
    'Người ta cho con sự mập mờ, còn con tự viết nguyên bộ tiểu thuyết bi kịch lúc hai giờ sáng.',
    'Vũ trụ bật đèn sáng trưng qua ba lá bài, chỉ có con tự nhắm mắt kêu tối!',
    'Thay vì ngồi đoán tâm ý thiên hạ, hãy đắp mặt nạ đi ngủ và yêu lấy chính mình trước.',
  ],
  tien_tu_chua_lanh: [
    'Trái tim bạn xứng đáng nhận được sự dịu dàng mà bạn vẫn thường trao đi cho thế giới.',
    'Mọi khoảng lặng hôm nay đều đang âm thầm chuẩn bị cho một chương mới bình yên hơn.',
    'Hãy thở chậm lại một nhịp, bạn đã làm rất tốt trong hành trình của riêng mình rồi.',
  ],
  tong_tai_ly_tri: [
    'Đừng tiếp tục rót vốn cảm xúc vào một dự án chỉ trả cổ tức bằng những lời hứa suông.',
    'Quản trị tốt ranh giới cá nhân chính là khoản đầu tư sinh lời cao nhất của bạn.',
    'Khi dữ liệu hành động không khớp với lời nói, hãy tin vào số liệu thực tế trước mắt.',
  ],
  phap_su_toi_co: [
    'Khi tần số nội tâm của ngươi thăng hoa, những nhân duyên lệch nhịp sẽ tự khắc rời đi.',
    'Mọi biến cố trước mắt đều là tấm gương phản chiếu bài học trưởng thành của linh hồn.',
    'Hãy giữ tâm bất biến giữa dòng xoáy nhân gian, câu trả lời sẽ tự hiển lộ.',
  ],
  ba_ngoai_vui_tinh: [
    'Học hết sức, chơi hết mình, năng lượng tích cực của cháu chính là ngôi sao sáng nhất lớp!',
    'Mỗi thử thách trên trường lớp chỉ là bước đệm để cháu khám phá siêu năng lực của bản thân.',
    'Bà Ngoại chấm mười điểm cho sự cố gắng của cháu, cứ tự tin tỏa sáng theo cách riêng nhé!',
  ],
};

function parseOptionalPercent(
  paramVal: string | null,
  fallbackVal?: number
): number | null {
  if (paramVal !== null && paramVal.trim() !== '') {
    const num = Number.parseInt(paramVal, 10);
    if (!Number.isNaN(num)) {
      return Math.max(0, Math.min(100, num));
    }
  }
  if (typeof fallbackVal === 'number' && !Number.isNaN(fallbackVal)) {
    return Math.max(0, Math.min(100, Math.round(fallbackVal)));
  }
  return null;
}

/**
 * GET /api/story-card
 * Server-side 1080 x 1920 (9:16) PNG Story Card Renderer v2 via Satori (`next/og`).
 * Strict compliance with PLAN.md Section 5:
 * - 1080 x 1920 px resolution
 * - Top & bottom safe zones (~210px) for Instagram Story / TikTok overlays
 * - Header (15%): Nickname pill + Reader Persona badge + Privacy-first question status (default `hideQuestion=1`)
 * - Cards Section (35%): 3 Tarot cards (78-card RWS support) + optional Couple Meter Bar (`💞 Độ Hợp Cạ: X% | 🚩 Red Flag: Y% • Chỉ để giải trí`)
 * - Viral Punchline (35%): High-contrast editorial `savage_quote` + `sub_advice` + `lucky_item`
 * - Footer (15%): Stylized QR matrix + `tarotcouple.vercel.app` + CTA + entertainment disclaimer
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const readingId = url.searchParams.get('readingId');
  const cached = getCachedReading(readingId);

  const rawQuoteIdx = Number.parseInt(url.searchParams.get('quoteIndex') || '0', 10);
  const quoteIndex: 0 | 1 | 2 =
    rawQuoteIdx === 1 ? 1 : rawQuoteIdx === 2 ? 2 : 0;

  // Privacy-by-default: hideQuestion defaults to '1' per PLAN.md Section 5
  const hideQuestionParam = url.searchParams.get('hideQuestion');
  const hideQuestion = hideQuestionParam !== '0';

  if (url.searchParams.get('download') === '1') {
    recordFunnelEvent('share_story', {
      readingId: readingId || 'stateless',
      quoteIndex,
      hideQuestion,
    });
  }

  const personaParam = url.searchParams.get('persona');
  const effectivePersona: EffectivePersona =
    personaParam === 'tien_tu_chua_lanh' ||
    personaParam === 'tong_tai_ly_tri' ||
    personaParam === 'phap_su_toi_co' ||
    personaParam === 'ba_ngoai_vui_tinh' ||
    personaParam === 'ba_co_mo_hon'
      ? personaParam
      : cached?.effectivePersona || 'ba_co_mo_hon';

  const theme = getPersonaTheme(effectivePersona);

  const nickname = (
    url.searchParams.get('nickname') ||
    cached?.nickname ||
    'Bạn Ẩn Danh'
  )
    .trim()
    .slice(0, 32);

  const topicLabel = (
    url.searchParams.get('topicLabel') ||
    cached?.topicLabel ||
    'Tình duyên & Mập mờ'
  )
    .trim()
    .slice(0, 48);

  const questionText = (
    url.searchParams.get('question') ||
    cached?.questionText ||
    ''
  )
    .trim()
    .slice(0, 140);

  const badgeTitle = (
    url.searchParams.get('badge') ||
    cached?.result.shareable_card.headline_badge ||
    theme.badgeText
  )
    .trim()
    .slice(0, 60);

  const defaultQuotes = DEFAULT_QUOTES_BY_PERSONA[effectivePersona];
  const savageQuote = (
    url.searchParams.get('quote') ||
    cached?.result.shareable_card.savage_quotes?.[quoteIndex] ||
    cached?.result.shareable_card.savage_quote ||
    defaultQuotes[quoteIndex]
  )
    .trim()
    .slice(0, 220);

  const subAdvice = (
    url.searchParams.get('subAdvice') ||
    cached?.result.shareable_card.sub_advice ||
    'Khi bạn biết trân trọng năng lượng của chính mình, vũ trụ sẽ tự khắc sắp đặt đúng người đúng thời điểm.'
  )
    .trim()
    .slice(0, 180);

  const luckyItem = (
    url.searchParams.get('luckyItem') ||
    cached?.result.shareable_card.lucky_item ||
    'Một tách trà ấm & giấc ngủ ngon trước 12h đêm'
  )
    .trim()
    .slice(0, 80);

  // Optional Couple Meter metrics (from cached reading.result.metrics or query params)
  const compatScore = parseOptionalPercent(
    url.searchParams.get('compatScore') ??
      url.searchParams.get('compatibility_score'),
    cached?.result.metrics?.compatibility_score
  );
  const redFlagLevel = parseOptionalPercent(
    url.searchParams.get('redFlagLevel') ??
      url.searchParams.get('red_flag_level'),
    cached?.result.metrics?.red_flag_level
  );
  const vibeTag = (
    url.searchParams.get('vibeTag') ||
    url.searchParams.get('vibe_tag') ||
    cached?.result.metrics?.vibe_tag ||
    ''
  )
    .trim()
    .slice(0, 64);

  const showCoupleMeter = compatScore !== null || redFlagLevel !== null;

  const cardSlots: [StoryCardSlot, StoryCardSlot, StoryCardSlot] = cached
    ? [
        {
          card: cached.drawnCards[0].card,
          reversed: cached.drawnCards[0].reversed,
          positionLabel: cached.drawnCards[0].position_label,
        },
        {
          card: cached.drawnCards[1].card,
          reversed: cached.drawnCards[1].reversed,
          positionLabel: cached.drawnCards[1].position_label,
        },
        {
          card: cached.drawnCards[2].card,
          reversed: cached.drawnCards[2].reversed,
          positionLabel: cached.drawnCards[2].position_label,
        },
      ]
    : parseCardsParam(url.searchParams.get('cards'), [
        'Năng lượng của bạn',
        'Suy nghĩ đối phương',
        'Kết cục gần',
      ]);

  const fonts = await loadVietnameseFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: '1080px',
          height: '1920px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: theme.bgGradient,
          color: '#F4EFE6',
          fontFamily: fonts.length > 0 ? 'BeVietnamPro, sans-serif' : 'sans-serif',
          paddingTop: '205px',
          paddingBottom: '205px',
          paddingLeft: '64px',
          paddingRight: '64px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Outer Celestial Gold Frame */}
        <div
          style={{
            position: 'absolute',
            top: '175px',
            bottom: '175px',
            left: '36px',
            right: '36px',
            border: `2px solid ${theme.borderGlow}`,
            borderRadius: '36px',
            display: 'flex',
          }}
        />

        {/* 1. HEADER SECTION (~15%) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: theme.pillBg,
              border: `1.5px solid ${theme.accentPrimary}`,
              borderRadius: '999px',
              padding: '10px 28px',
            }}
          >
            <span
              style={{
                fontSize: '21px',
                fontWeight: 700,
                color: theme.accentPrimary,
                letterSpacing: '2px',
              }}
            >
              ✦ {badgeTitle} ✦
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
            }}
          >
            <span
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: '#F4EFE6',
              }}
            >
              VŨ TRỤ GỬI ĐẾN @{nickname.toUpperCase()}
            </span>
            <span
              style={{
                fontSize: '20px',
                color: '#A39BB5',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                padding: '6px 18px',
                borderRadius: '999px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              {topicLabel}
            </span>
          </div>

          {/* Privacy-by-default Question Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(19, 15, 30, 0.85)',
              border: '1px solid rgba(229, 184, 105, 0.25)',
              borderRadius: '18px',
              padding: '10px 24px',
              maxWidth: '880px',
            }}
          >
            <span
              style={{
                fontSize: '19px',
                color: hideQuestion ? '#A39BB5' : '#FCE7F3',
                textAlign: 'center',
              }}
            >
              {hideQuestion || !questionText
                ? 'Câu hỏi bí mật đã được phong ấn (Chế độ Riêng Tư)'
                : `“${questionText}”`}
            </span>
          </div>
        </div>

        {/* 2. DRAWN 3 TAROT CARDS + OPTIONAL COUPLE METER SECTION (~35%) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            gap: '16px',
            marginTop: '8px',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'stretch',
              width: '100%',
              gap: '24px',
            }}
          >
            {cardSlots.map((slot, idx) => {
              const activeKw = slot.reversed
                ? slot.card.keywords_rev[0]
                : slot.card.keywords_up[0];
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flex: 1,
                    backgroundColor: '#130F1E',
                    border: `2px solid ${theme.accentPrimary}`,
                    borderRadius: '26px',
                    padding: showCoupleMeter ? '18px 16px' : '22px 18px',
                    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65)',
                  }}
                >
                  {/* Position Label + Roman Numeral */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      width: '100%',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '15px',
                        color: '#A39BB5',
                        textAlign: 'center',
                      }}
                    >
                      {slot.positionLabel}
                    </span>
                    <span
                      style={{
                        fontSize: '19px',
                        fontWeight: 700,
                        color: theme.accentPrimary,
                        letterSpacing: '1.5px',
                      }}
                    >
                      • {slot.card.roman} •
                    </span>
                  </div>

                  {/* Symbolic Centerpiece Medallion */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: showCoupleMeter ? '112px' : '128px',
                      height: showCoupleMeter ? '112px' : '128px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(229, 184, 105, 0.09)',
                      border: `2px solid ${theme.borderGlow}`,
                      marginTop: '10px',
                      marginBottom: '10px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: slot.card.roman.length > 5 ? '22px' : '38px',
                        fontWeight: 700,
                        color: theme.accentSecondary,
                        textAlign: 'center',
                      }}
                    >
                      {slot.card.roman}
                    </span>
                    <span
                      style={{
                        fontSize: '13px',
                        color: theme.accentPrimary,
                        marginTop: '4px',
                      }}
                    >
                      {slot.card.arcana === 'minor' ? 'MINOR' : 'ARCANA'}
                    </span>
                  </div>

                  {/* Card Names & Orientation Badge */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      width: '100%',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '22px',
                        fontWeight: 700,
                        color: '#F4EFE6',
                        textAlign: 'center',
                      }}
                    >
                      {slot.card.name_vi}
                    </span>
                    <span
                      style={{
                        fontSize: '14px',
                        color: '#A39BB5',
                        textAlign: 'center',
                      }}
                    >
                      {slot.card.name_en}
                    </span>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: slot.reversed
                          ? 'rgba(244, 63, 94, 0.22)'
                          : 'rgba(16, 185, 129, 0.22)',
                        border: slot.reversed
                          ? '1px solid #FB7185'
                          : '1px solid #34D399',
                        borderRadius: '999px',
                        padding: '4px 16px',
                        marginTop: '2px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: slot.reversed ? '#FDA4AF' : '#6EE7B7',
                        }}
                      >
                        {slot.reversed ? 'CHIỀU NGƯỢC ↺' : 'CHIỀU XUÔI ↑'}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '14px',
                        color: theme.accentSecondary,
                        textAlign: 'center',
                        marginTop: '2px',
                      }}
                    >
                      “{activeKw}”
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sleek Couple Meter Bar when compatScore or redFlagLevel is present (PLAN.md Section 4.3, 5 & 8.2) */}
          {showCoupleMeter && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(19, 15, 30, 0.92)',
                border: `1.5px solid ${theme.accentPrimary}`,
                borderRadius: '20px',
                padding: '12px 26px',
                width: '100%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '18px',
                }}
              >
                <span
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#6EE7B7',
                  }}
                >
                  💞 Độ Hợp Cạ: {compatScore ?? 78}%
                </span>
                <span
                  style={{
                    fontSize: '18px',
                    color: '#A39BB5',
                  }}
                >
                  |
                </span>
                <span
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#FDA4AF',
                  }}
                >
                  🚩 Red Flag: {redFlagLevel ?? 24}%
                </span>
              </div>

              <span
                style={{
                  fontSize: '16px',
                  color: theme.accentSecondary,
                }}
              >
                {vibeTag ? `${vibeTag} • Chỉ để giải trí` : 'Chỉ để giải trí'}
              </span>
            </div>
          )}
        </div>

        {/* 3. VIRAL PUNCHLINE SECTION (~35%) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(19, 15, 30, 0.92)',
            border: `2px solid ${theme.accentPrimary}`,
            borderRadius: '32px',
            padding: '34px 44px',
            width: '100%',
            gap: '20px',
          }}
        >
          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: theme.accentPrimary,
              letterSpacing: '3px',
            }}
          >
            ✦ THÔNG ĐIỆP CHỐT HẠ TỪ VŨ TRỤ ✦
          </span>

          <span
            style={{
              fontSize: '40px',
              fontWeight: 700,
              color: '#FFFFFF',
              textAlign: 'center',
              lineHeight: 1.32,
            }}
          >
            “{savageQuote}”
          </span>

          <div
            style={{
              display: 'flex',
              width: '180px',
              height: '2px',
              backgroundColor: theme.borderGlow,
            }}
          />

          <span
            style={{
              fontSize: '21px',
              color: '#D8D2E7',
              textAlign: 'center',
              lineHeight: 1.4,
            }}
          >
            {subAdvice}
          </span>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(229, 184, 105, 0.14)',
              border: `1px solid ${theme.borderGlow}`,
              borderRadius: '999px',
              padding: '10px 28px',
            }}
          >
            <span
              style={{
                fontSize: '19px',
                fontWeight: 700,
                color: theme.accentSecondary,
              }}
            >
              ★ Vật phẩm độ mệnh: {luckyItem}
            </span>
          </div>
        </div>

        {/* 4. FOOTER SECTION (~15%) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(19, 15, 30, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '24px',
            padding: '20px 32px',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxWidth: '720px',
            }}
          >
            <span
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: theme.accentPrimary,
              }}
            >
              tarotcouple.vercel.app
            </span>
            <span
              style={{
                fontSize: '19px',
                color: '#F4EFE6',
              }}
            >
              Quét mã để xem Vũ Trụ nhắn gì với bạn đêm nay →
            </span>
            <span
              style={{
                fontSize: '14px',
                color: '#A39BB5',
              }}
            >
              Tarot là hình thức giải trí và tự phản chiếu, không thay thế tư vấn chuyên môn.
            </span>
          </div>

          {/* Privacy-safe Landing QR Matrix Badge */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '108px',
              height: '108px',
              backgroundColor: '#F4EFE6',
              borderRadius: '18px',
              padding: '10px',
              border: `2px solid ${theme.accentPrimary}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                width: '100%',
                height: '100%',
                border: '4px solid #08060C',
                padding: '6px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', width: '18px', height: '18px', backgroundColor: '#08060C' }} />
                <div style={{ display: 'flex', width: '10px', height: '18px', backgroundColor: '#08060C' }} />
                <div style={{ display: 'flex', width: '18px', height: '18px', backgroundColor: '#08060C' }} />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#08060C',
                  }}
                >
                  TAROT
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', width: '18px', height: '18px', backgroundColor: '#08060C' }} />
                <div style={{ display: 'flex', width: '14px', height: '10px', backgroundColor: '#08060C' }} />
                <div style={{ display: 'flex', width: '18px', height: '18px', backgroundColor: '#08060C' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      ...(fonts.length > 0 ? { fonts } : {}),
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    }
  );
}
