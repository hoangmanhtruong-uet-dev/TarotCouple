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

export interface CoupleInterpretationBundle {
  loveLanguage: CoupleLoveLanguageResult;
  secretAdvice: CoupleSecretAdvice;
  coupleQuests: CoupleQuestItem[];
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

  return {
    loveLanguage,
    secretAdvice,
    coupleQuests,
  };
}
