/**
 * Couple Interpretation Helper (TarotCouple V2)
 *
 * Deterministic generation of deep couple chemistry features:
 * 1. Love Language Prediction & Harmony Assessment
 * 2. Secret Advice for each partner (empathy perspective)
 * 3. 7-Day Couple Quest (Actionable bonding mini-missions)
 */

import { MAJOR_ARCANA } from '@/data/tarot-cards';
import type { CoupleRelationshipStatus } from '@/lib/schemas';

export type LoveLanguageType =
  | 'words_of_affirmation'
  | 'acts_of_service'
  | 'receiving_gifts'
  | 'quality_time'
  | 'physical_touch';

export interface LoveLanguageProfile {
  type: LoveLanguageType;
  nameVi: string;
  icon: string;
  percentage: number;
  description: string;
  expressionTip: string;
}

export interface CoupleLoveLanguageResult {
  ownerProfile: LoveLanguageProfile;
  partnerProfile: LoveLanguageProfile;
  matchScore: number;
  harmonyTitle: string;
  harmonyLevel: 'rat_dong_dieu' | 'can_thau_hieu' | 'lech_pha_can_chia_se';
  advice: string;
}

export interface CoupleSecretAdvice {
  forOwner: {
    title: string;
    whatPartnerExpects: string;
    advice: string;
    caution: string;
  };
  forPartner: {
    title: string;
    whatOwnerExpects: string;
    advice: string;
    caution: string;
  };
}

export interface CoupleQuestItem {
  dayLabel: string;
  title: string;
  icon: string;
  mission: string;
  purpose: string;
}

export type TarotElement = 'fire' | 'water' | 'air' | 'earth';

export interface ElementalProfile {
  element: TarotElement;
  nameVi: string;
  icon: string;
  badge: string;
  nature: string;
  strengths: string;
  tendency: string;
}

export interface CoupleElementalResonance {
  ownerElement: ElementalProfile;
  partnerElement: ElementalProfile;
  synergyType: 'dong_khi' | 'tuong_sinh' | 'can_bang_am_duong' | 'thach_thuc';
  synergyTitle: string;
  synergyScore: number;
  description: string;
  growthAdvice: string;
}

export interface CoupleInterpretationBundle {
  loveLanguage: CoupleLoveLanguageResult;
  secretAdvice: CoupleSecretAdvice;
  coupleQuests: CoupleQuestItem[];
  elementalResonance?: CoupleElementalResonance;
}

const LOVE_LANGUAGES: Record<LoveLanguageType, { nameVi: string; icon: string; desc: string; tip: string }> = {
  words_of_affirmation: {
    nameVi: 'Lời Nói Khẳng Định & Khen Ngợi',
    icon: '💬',
    desc: 'Cần nghe những lời động viên, khen ngợi và khẳng định tình cảm chân thành.',
    tip: 'Hãy gửi một tin nhắn cảm ơn hoặc khen ngợi một điều nhỏ mà người ấy làm hôm nay.',
  },
  acts_of_service: {
    nameVi: 'Hành Động Chăm Sóc Thực Tế',
    icon: '🍵',
    desc: 'Hành động cụ thể thay vạn lời nói — một cốc trà, sự giúp đỡ khi mệt mỏi.',
    tip: 'Hành động nhỏ như chuẩn bị bữa sáng hoặc chia sẻ việc nhỏ sẽ khiến người ấy ấm lòng.',
  },
  receiving_gifts: {
    nameVi: 'Món Quà Bất Ngờ & Kỷ Niệm',
    icon: '🎁',
    desc: 'Không cần đắt tiền, chỉ cần thể hiện bạn luôn nhớ đến họ trong từng khoảnh khắc.',
    tip: 'Tặng một món quà nhỏ gắn liền với kỷ niệm chung hoặc món ăn vặt họ yêu thích.',
  },
  quality_time: {
    nameVi: 'Thời Gian Trọn Vẹn Dành Cho Nhau',
    icon: '⏳',
    desc: 'Cùng nhau hiện diện 100%, không điện thoại hay sao nhãng, chỉ có hai tâm hồn.',
    tip: 'Dành 30 phút đi dạo hoặc trò chuyện đêm muộn không bật màn hình điện thoại.',
  },
  physical_touch: {
    nameVi: 'Cái Ôm & Chạm Vật Lý Ấm Áp',
    icon: '🫂',
    desc: 'Cái nắm tay nơi đông người, cái ôm siết khi gặp mặt là liều thuốc an tâm nhất.',
    tip: 'Một cái ôm bất ngờ kéo dài 20 giây sẽ hóa giải mọi căng thẳng tích tụ.',
  },
};

/**
 * Maps a card ID + reversed flag to a primary Love Language
 */
function resolveLoveLanguageFromCard(cardId: number, reversed: boolean): LoveLanguageProfile {
  // Elements map based on card index mod 5
  const languages: LoveLanguageType[] = [
    'words_of_affirmation',
    'acts_of_service',
    'receiving_gifts',
    'quality_time',
    'physical_touch',
  ];

  const index = (Math.abs(cardId * 7 + (reversed ? 3 : 1))) % 5;
  const langKey = languages[index] || 'quality_time';
  const meta = LOVE_LANGUAGES[langKey];

  // Dynamic percentage 65% - 95%
  const percentage = 68 + ((cardId * 13) % 27);

  return {
    type: langKey,
    nameVi: meta.nameVi,
    icon: meta.icon,
    percentage,
    description: meta.desc,
    expressionTip: meta.tip,
  };
}

/**
 * Computes full Love Language Analysis for couple
 */
export function computeCoupleLoveLanguage(
  c1Id: number,
  c1Rev: boolean,
  c2Id: number,
  c2Rev: boolean
): CoupleLoveLanguageResult {
  const ownerProfile = resolveLoveLanguageFromCard(c1Id, c1Rev);
  const partnerProfile = resolveLoveLanguageFromCard(c2Id, c2Rev);

  const isIdentical = ownerProfile.type === partnerProfile.type;
  let matchScore: number;
  let harmonyLevel: CoupleLoveLanguageResult['harmonyLevel'];
  let harmonyTitle: string;
  let advice: string;

  if (isIdentical) {
    matchScore = 94;
    harmonyLevel = 'rat_dong_dieu';
    harmonyTitle = 'Đồng Điệu Tuyệt Đối Về Ngôn Ngữ Yêu';
    advice = `Cả hai đều cùng nói ngôn ngữ "${ownerProfile.nameVi}". Điều này giúp hai bạn dễ dàng thấu hiểu và đáp ứng đúng mong đợi cảm xúc của nhau mà không cần giải thích nhiều.`;
  } else {
    // Check complementary pairs
    const compPair =
      (ownerProfile.type === 'words_of_affirmation' && partnerProfile.type === 'quality_time') ||
      (ownerProfile.type === 'acts_of_service' && partnerProfile.type === 'receiving_gifts') ||
      (ownerProfile.type === 'physical_touch' && partnerProfile.type === 'quality_time');

    if (compPair) {
      matchScore = 85;
      harmonyLevel = 'can_thau_hieu';
      harmonyTitle = 'Bù Trừ Hoàn Hảo & Hỗ Trợ Nhau';
      advice = `Bạn chuộng "${ownerProfile.nameVi}" trong khi người ấy lại rung động trước "${partnerProfile.nameVi}". Sự bù trừ này giúp mối quan hệ đa màu sắc nếu cả hai chịu học cách bày tỏ bằng ngôn ngữ của đối phương.`;
    } else {
      matchScore = 72;
      harmonyLevel = 'lech_pha_can_chia_se';
      harmonyTitle = 'Cần Đối Thoại Để Tránh Hiểu Lầm';
      advice = `Hai bạn có hai kênh tiếp nhận tình cảm khác nhau (${ownerProfile.nameVi} vs ${partnerProfile.nameVi}). Đôi khi một người đã nỗ lực yêu thương nhưng người kia chưa cảm nhận được. Hãy chủ động chia sẻ điều mình thật sự muốn!`;
    }
  }

  return {
    ownerProfile,
    partnerProfile,
    matchScore,
    harmonyTitle,
    harmonyLevel,
    advice,
  };
}

/**
 * Computes Secret Advice for both partners based on their respective drawn cards and relationship stage
 */
export function computeCoupleSecretAdvice(params: {
  ownerName: string;
  partnerName: string;
  c1Name: string;
  c1Rev: boolean;
  c2Name: string;
  c2Rev: boolean;
  c3Name: string;
  relationshipStatus: CoupleRelationshipStatus;
}): CoupleSecretAdvice {
  const { ownerName, partnerName, c1Name, c1Rev, c2Name, c2Rev, c3Name, relationshipStatus } = params;

  let whatPartnerExpects = '';
  let ownerAdvice = '';
  let ownerCaution = '';

  let whatOwnerExpects = '';
  let partnerAdvice = '';
  let partnerCaution = '';

  if (relationshipStatus === 'crush' || relationshipStatus === 'situationship') {
    whatPartnerExpects = `${partnerName} đang bị thu hút nhưng còn mang tâm lý dè chừng, sợ mình ngộ nhận nếu bạn chưa rõ ràng.`;
    ownerAdvice = `Hãy tạo một lý do tự nhiên để rủ ${partnerName} đi cafe riêng, bộc lộ sự quan tâm tinh tế thay vì chỉ thả tim vu vơ trên mạng xã hội.`;
    ownerCaution = `Đừng im lặng quá lâu (ghosting) sau khi đã thả thính, điều đó làm ${partnerName} nghĩ bạn không nghiêm túc.`;

    whatOwnerExpects = `${ownerName} đang rất mong một tín hiệu chủ động dứt khoát từ bạn, dù chỉ là một tin nhắn chúc ngày mới.`;
    partnerAdvice = `Đừng ngần ngại mở lời trước. Năng lượng lá ${c2Name} cho thấy ${ownerName} sẽ rất vui khi bạn là người bắt đầu cuộc trò chuyện.`;
    partnerCaution = `Tránh trả lời cộc lốc hoặc để tin nhắn trôi quá nửa ngày khiến ${ownerName} cảm thấy bất an.`;
  } else if (relationshipStatus === 'ex') {
    whatPartnerExpects = `${partnerName} vẫn thỉnh thoảng nhớ về những kỷ niệm đẹp nhưng rất sợ lặp lại những vết thương cũ.`;
    ownerAdvice = `Nếu muốn hàn gắn, hãy nói về sự thay đổi của hiện tại và tương lai thay vì lôi chuyện cũ ra phân bua đúng sai.`;
    ownerCaution = `Tuyệt đối không dò xét đời tư hay ghen tuông với những mối quan hệ mới của ${partnerName}.`;

    whatOwnerExpects = `${ownerName} cần sự tôn trọng và một câu trả lời dứt khoát để không còn phải sống trong trạng thái nửa muốn quên nửa muốn giữ.`;
    partnerAdvice = `Hãy thành thật với cảm xúc của mình. Nếu còn thương hãy cùng ngồi xuống gỡ bỏ nút thắt; nếu hết duyên hãy cho nhau sự giải thoát nhẹ nhàng.`;
    partnerCaution = `Không nên duy trì trạng thái mập mờ "bạn bè đặc biệt" nếu trong lòng chưa sẵn sàng bắt đầu lại.`;
  } else {
    // Dating
    whatPartnerExpects = `${partnerName} cần cảm giác được là ưu tiên và có một vị trí an toàn, vững chắc trong kế hoạch tương lai của bạn.`;
    ownerAdvice = `Lá ${c1Name} nhắc bạn lắng nghe nhiều hơn nói. Đôi khi ${partnerName} chỉ cần một cái ôm thấu hiểu hơn là một giải pháp logic.`;
    ownerCaution = `Tránh mang áp lực công việc hoặc sự bực dọc bên ngoài về trút lên không gian riêng của hai người.`;

    whatOwnerExpects = `${ownerName} mong muốn sự ghi nhận và lời khẳng định rằng tình cảm này vẫn luôn được trân trọng như ngày đầu.`;
    partnerAdvice = `Chủ động tạo ra những buổi hẹn bất ngờ hoặc chia sẻ những nỗi niềm nhỏ trong ngày để duy trì ngọn lửa gắn kết.`;
    partnerCaution = `Đừng xem sự chăm sóc của ${ownerName} là điều hiển nhiên mà quên mất những lời cảm ơn chân thành.`;
  }

  return {
    forOwner: {
      title: `Góc Nhìn Dành Cho ${ownerName}`,
      whatPartnerExpects,
      advice: ownerAdvice,
      caution: ownerCaution,
    },
    forPartner: {
      title: `Góc Nhìn Dành Cho ${partnerName}`,
      whatOwnerExpects,
      advice: partnerAdvice,
      caution: partnerCaution,
    },
  };
}

/**
 * Computes 7-Day Couple Quest (3 Mini-missions)
 */
export function computeCoupleQuests(
  ownerName: string,
  partnerName: string,
  relationshipStatus: CoupleRelationshipStatus
): CoupleQuestItem[] {
  if (relationshipStatus === 'crush' || relationshipStatus === 'situationship') {
    return [
      {
        dayLabel: 'Ngày 1 - 2 • Phá Băng',
        title: 'Bật Tín Hiệu Rõ Ràng',
        icon: '💌',
        mission: `Chủ động nhắn tin rủ đối phương cùng thưởng thức một món ăn vặt hoặc gửi bài hát bạn đang nghe.`,
        purpose: 'Chuyển hóa từ trạng thái quan sát từ xa sang tương tác thân mật trực tiếp.',
      },
      {
        dayLabel: 'Ngày 3 - 4 • Kết Nối Tâm Trí',
        title: '15 Phút Không Màn Hình',
        icon: '☕',
        mission: `Cùng nhau đi dạo hoặc ngồi cafe và hỏi nhau câu hỏi: "Điều gì khiến bạn thấy vui nhất trong tuần qua?"`,
        purpose: 'Khám phá thế giới nội tâm và cảm xúc sâu hơn ngoài những câu chào hỏi xã giao.',
      },
      {
        dayLabel: 'Ngày 5 - 7 • Khẳng Định Vị Trí',
        title: 'Lời Hẹn Của Hai Người',
        icon: '✨',
        mission: `Chốt một buổi hẹn vào cuối tuần có kế hoạch rõ ràng do một trong hai người chuẩn bị trước.`,
        purpose: 'Phá vỡ rào cản mập mờ, tạo bước chuyển mình sang một giai đoạn gắn kết vững vàng.',
      },
    ];
  }

  return [
    {
      dayLabel: 'Ngày 1 - 2 • Tiếp Năng Lượng',
      title: 'Hũ Gia Vị Ngọt Ngào',
      icon: '🍯',
      mission: `Gửi 1 tin nhắn bất ngờ khen ngợi điều nhỏ nhất mà đối phương đã làm cho bạn gần đây.`,
      purpose: 'Thổi bùng ngọn lửa yêu thương và xua tan những áp lực mỏi mệt thường nhật.',
    },
    {
      dayLabel: 'Ngày 3 - 4 • Lắng Nghe Chữa Lành',
      title: 'Khoảnh Khắc Trút Nỗi Niềm',
      icon: '🕯️',
      mission: `Ngồi cạnh nhau 20 phút, mỗi người nói 1 nỗi băn khoăn mà người kia chỉ lắng nghe và ôm, không phán xét.`,
      purpose: 'Hóa giải những hiểu lầm tiềm ẩn và nuôi dưỡng sự an toàn cảm xúc tối đa.',
    },
    {
      dayLabel: 'Ngày 5 - 7 • Khởi Tạo Kỷ Niệm Mới',
      title: 'Hẹn Hò Như Ngày Đầu',
      icon: '🥂',
      mission: `Đi đến một quán ăn hoặc địa điểm mới mà cả hai chưa từng đến trước đây.`,
      purpose: 'Làm mới năng lượng mối quan hệ và tạo thêm những ký ức rực rỡ bên nhau.',
    },
  ];
}

/**
 * High-level bundle generator for Couple Mode Results
 */
export function generateCoupleInterpretationBundle(params: {
  ownerName: string;
  partnerName: string;
  c1: { id: number; reversed: boolean; name_vi: string };
  c2: { id: number; reversed: boolean; name_vi: string };
  c3: { id: number; reversed: boolean; name_vi: string };
  relationshipStatus: CoupleRelationshipStatus;
}): CoupleInterpretationBundle {
  const loveLanguage = computeCoupleLoveLanguage(
    params.c1.id,
    params.c1.reversed,
    params.c2.id,
    params.c2.reversed
  );

  const secretAdvice = computeCoupleSecretAdvice({
    ownerName: params.ownerName,
    partnerName: params.partnerName,
    c1Name: params.c1.name_vi,
    c1Rev: params.c1.reversed,
    c2Name: params.c2.name_vi,
    c2Rev: params.c2.reversed,
    c3Name: params.c3.name_vi,
    relationshipStatus: params.relationshipStatus,
  });

  const coupleQuests = computeCoupleQuests(
    params.ownerName,
    params.partnerName,
    params.relationshipStatus
  );

  const elementalResonance = computeCoupleElementalResonance(
    params.c1.id,
    params.c1.name_vi,
    params.c2.id,
    params.c2.name_vi,
    params.ownerName,
    params.partnerName
  );

  return {
    loveLanguage,
    secretAdvice,
    coupleQuests,
    elementalResonance,
  };
}

const ELEMENT_METAS: Record<
  TarotElement,
  { nameVi: string; icon: string; badge: string; nature: string; strengths: string; tendency: string }
> = {
  fire: {
    nameVi: 'Lửa (Hỏa)',
    icon: '🔥',
    badge: 'Nhiệt Huyết & Tiên Phong',
    nature: 'Nồng nhiệt, chủ động, thẳng thắn và luôn hướng về phía trước.',
    strengths: 'Truyền cảm hứng, dũng cảm đối mặt khó khăn, yêu say đắm.',
    tendency: 'Dễ bốc đồng hoặc mất kiên nhẫn khi đối phương cần thời gian chậm lại.',
  },
  water: {
    nameVi: 'Nước (Thủy)',
    icon: '💧',
    badge: 'Thấu Cảm & Trực Giác',
    nature: 'Sâu sắc, thấu hiểu, giàu cảm xúc và kết nối tâm hồn bền chặt.',
    strengths: 'Chữa lành, lắng nghe không phán xét, chung thủy trọn vẹn.',
    tendency: 'Dễ suy nghĩ nhiều (overthinking) hoặc khép lòng khi cảm thấy bất an.',
  },
  air: {
    nameVi: 'Khí (Phong)',
    icon: '💨',
    badge: 'Trí Tuệ & Kết Nối',
    nature: 'Thông minh, rõ ràng, đề cao đối thoại và sự minh bạch trong tình cảm.',
    strengths: 'Giao tiếp cởi mở, công bằng, luôn có ý tưởng làm mới tình yêu.',
    tendency: 'Đôi lúc quá lý trí hoặc phân tích vấn đề bằng logic thay vì cảm nhận bằng tim.',
  },
  earth: {
    nameVi: 'Đất (Thổ)',
    icon: '🌱',
    badge: 'Bền Vững & Thực Tế',
    nature: 'Đáng tin cậy, vững chãi, hướng tới cam kết dài lâu và tổ ấm yên bình.',
    strengths: 'Chăm sóc chu đáo, là điểm tựa an toàn, trân trọng từng lời hứa.',
    tendency: 'Hơi chậm thay đổi hoặc bảo thủ trước những tình huống bất ngờ.',
  },
};

export function resolveElementFromCard(cardId: number, cardName: string): ElementalProfile {
  let el: TarotElement;

  if (cardId >= 22 && cardId <= 35) {
    el = 'fire'; // Wands
  } else if (cardId >= 36 && cardId <= 49) {
    el = 'water'; // Cups
  } else if (cardId >= 50 && cardId <= 63) {
    el = 'air'; // Swords
  } else if (cardId >= 64 && cardId <= 77) {
    el = 'earth'; // Pentacles
  } else {
    // Major Arcana astrological mapping
    const fireMajors = [4, 8, 14, 16, 19, 20];
    const waterMajors = [2, 7, 12, 13, 18];
    const airMajors = [0, 1, 6, 11, 17];
    const earthMajors = [3, 5, 9, 10, 15, 21];

    if (fireMajors.includes(cardId)) el = 'fire';
    else if (waterMajors.includes(cardId)) el = 'water';
    else if (airMajors.includes(cardId)) el = 'air';
    else if (earthMajors.includes(cardId)) el = 'earth';
    else {
      const fallbackElements: TarotElement[] = ['fire', 'water', 'air', 'earth'];
      el = fallbackElements[Math.abs(cardId) % 4];
    }
  }

  const meta = ELEMENT_METAS[el];
  return {
    element: el,
    nameVi: meta.nameVi,
    icon: meta.icon,
    badge: meta.badge,
    nature: meta.nature,
    strengths: meta.strengths,
    tendency: meta.tendency,
  };
}

export function computeCoupleElementalResonance(
  c1Id: number,
  c1Name: string,
  c2Id: number,
  c2Name: string,
  ownerName: string,
  partnerName: string
): CoupleElementalResonance {
  const ownerEl = resolveElementFromCard(c1Id, c1Name);
  const partnerEl = resolveElementFromCard(c2Id, c2Name);

  const pairKey = [ownerEl.element, partnerEl.element].sort().join('_');

  if (ownerEl.element === partnerEl.element) {
    return {
      ownerElement: ownerEl,
      partnerElement: partnerEl,
      synergyType: 'dong_khi',
      synergyTitle: `Song Hành Cùng Hệ ${ownerEl.nameVi}: Rung Động Tương Đồng`,
      synergyScore: 92,
      description: `Cả hai đều mang nguyên tố ${ownerEl.nameVi}. Hai bạn dễ dàng nắm bắt nhịp điệu của nhau, cùng tần số rung động và đồng điệu trong cách biểu đạt tình cảm.`,
      growthAdvice: `Vì quá giống nhau, khi xảy ra bất đồng hai bạn dễ cùng phản ứng một kiểu. Hãy chủ động nhường một bước để tránh xung đột kéo dài.`,
    };
  }

  // Tương sinh: Fire + Air hoặc Water + Earth
  if (pairKey === 'air_fire') {
    return {
      ownerElement: ownerEl,
      partnerElement: partnerEl,
      synergyType: 'tuong_sinh',
      synergyTitle: 'Lửa & Gió: Bùng Cháy Đam Mê & Cảm Hứng Vô Tận',
      synergyScore: 96,
      description: `Khí (Gió) tiếp thêm dưỡng khí cho ngọn Lửa bùng cháy rực rỡ! Trí tuệ và sự cởi mở giúp định hướng cho nhiệt huyết và hành động, tạo nên một cặp đôi đầy sức sống.`,
      growthAdvice: `Gió hãy bao dung với tính nóng vội của Lửa; còn Lửa hãy biết trân trọng những ý tưởng sâu sắc mà Gió mang lại.`,
    };
  }

  if (pairKey === 'earth_water') {
    return {
      ownerElement: ownerEl,
      partnerElement: partnerEl,
      synergyType: 'tuong_sinh',
      synergyTitle: 'Đất & Nước: Nuôi Dưỡng Mầm Sống & Cam Kết Bền Lâu',
      synergyScore: 98,
      description: `Nước tưới mát cho Đất màu mỡ, Đất tạo lòng hồ bình yên giữ trọn dòng nước! Đây là sự kết hợp bền chặt nhất giữa cảm xúc chân thành và sự che chở vững vàng.`,
      growthAdvice: `Nước hãy tin tưởng vào sự kiên định của Đất; Đất hãy thường xuyên bày tỏ sự dịu dàng để Nước luôn cảm thấy an toàn.`,
    };
  }

  // Âm Dương cân bằng bổ trợ: Fire + Water hoặc Air + Earth
  if (pairKey === 'fire_water') {
    return {
      ownerElement: ownerEl,
      partnerElement: partnerEl,
      synergyType: 'can_bang_am_duong',
      synergyTitle: 'Lửa & Nước: Hấp Dẫn Nghịch Chiều & Thăng Hoa Cảm Xúc',
      synergyScore: 86,
      description: `Lửa ấm áp xua tan giá lạnh, Nước dịu dàng xoa dịu những cơn giận. Hai bạn có sức hút mãnh liệt từ sự khác biệt bản năng, bù đắp hoàn hảo cho khoảng trống của nhau.`,
      growthAdvice: `Tránh để Nước dập tắt nhiệt huyết của Lửa, và Lửa không nên để sự bộc trực làm tổn thương tâm hồn nhạy cảm của Nước.`,
    };
  }

  if (pairKey === 'air_earth') {
    return {
      ownerElement: ownerEl,
      partnerElement: partnerEl,
      synergyType: 'can_bang_am_duong',
      synergyTitle: 'Khí & Đất: Lý Tưởng Gặp Hiện Thực & Vững Vàng Tương Lai',
      synergyScore: 88,
      description: `Khí mang lại tầm nhìn và những ước mơ bay bổng, trong khi Đất biến mọi kế hoạch thành hiện thực cụ thể. Sự kết hợp lý trí này giúp cả hai xây dựng tương lai rất vững chắc.`,
      growthAdvice: `Đất đừng quá khắt khe với sự ngẫu hứng của Khí, còn Khí hãy ghi nhận công sức thầm lặng mà Đất đã vun vén mỗi ngày.`,
    };
  }

  // Thử thách: Fire + Earth hoặc Air + Water
  if (pairKey === 'earth_fire') {
    return {
      ownerElement: ownerEl,
      partnerElement: partnerEl,
      synergyType: 'thach_thuc',
      synergyTitle: 'Lửa & Đất: Học Cách Kiên Nhẫn Để Bắt Kịp Nhịp Điệu',
      synergyScore: 80,
      description: `Lửa muốn lao nhanh về phía trước, còn Đất cần bước đi từng bước cẩn trọng. Khi dung hòa được, Đất sẽ là bệ phóng vững chắc nhất cho ngọn lửa của bạn.`,
      growthAdvice: `Lửa hãy học cách chậm lại chờ Đất; Đất hãy dũng cảm thử nghiệm những điều mới cùng Lửa.`,
    };
  }

  // air_water
  return {
    ownerElement: ownerEl,
    partnerElement: partnerEl,
    synergyType: 'thach_thuc',
    synergyTitle: 'Khí & Nước: Trí Tuệ Gặp Con Tim & Lắng Nghe Bằng Trắc Ẩn',
    synergyScore: 82,
    description: `Khí phân tích bằng logic, còn Nước cảm nhận bằng trái tim. Nếu học được cách giao tiếp thấu cảm, hai bạn sẽ vừa là tri kỷ trí tuệ, vừa là người bạn tâm giao tuyệt vời.`,
    growthAdvice: `Khi có xung đột, Khí hãy ôm lấy Nước thay vì tranh luận đúng sai; Nước hãy nói rõ mong muốn thay vì im lặng để Khí đoán.`,
  };
}
