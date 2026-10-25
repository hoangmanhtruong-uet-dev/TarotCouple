import {
  AgeTier,
  CURRENT_REFERENCE_YEAR,
  EffectivePersona,
  ReaderId,
  SafetyFlag,
  TopicId,
} from './schemas';

export interface TopicOption {
  id: TopicId;
  label: string;
  description: string;
  positions: [string, string, string];
}

/**
 * Standard 16+ Topics per PLAN.md Section 3.3
 */
export const STANDARD_TOPICS: TopicOption[] = [
  {
    id: 'love',
    label: 'Tình duyên & Mập mờ',
    description: 'Người cũ, crush, mối quan hệ không tên hoặc người thương hiện tại',
    positions: ['Năng lượng của bạn', 'Suy nghĩ của đối phương', 'Kết cục gần'],
  },
  {
    id: 'career',
    label: 'Học tập & Công việc',
    description: 'Định hướng sự nghiệp, deadline, đồng nghiệp, thi cử',
    positions: ['Gốc rễ vấn đề', 'Chướng ngại ẩn', 'Lối thoát'],
  },
  {
    id: 'finance',
    label: 'Tài chính & Vận may',
    description: 'Dòng tiền, cơ hội sắp tới và thói quen chi tiêu',
    positions: ['Tình hình hiện tại', 'Điều đang cản', 'Việc nên làm'],
  },
  {
    id: 'self_healing',
    label: 'Chữa lành & Bản thân',
    description: 'Nỗi bất an nội tâm, cởi bỏ áp lực, yêu thương và tái tạo năng lượng bản thân',
    positions: ['Tổn thương cốt lõi', 'Thói quen cần buông', 'Chìa khóa chữa lành'],
  },
  {
    id: 'family',
    label: 'Gia đình & Người thân',
    description: 'Kỳ vọng thế hệ, khoảng cách giao tiếp và cách tìm lại sự hòa hợp',
    positions: ['Sợi dây gắn kết', 'Khoảng cách vô hình', 'Hướng đi hòa hợp'],
  },
];

/**
 * Kid/Teen Safe Topics (10-15yo) per PLAN.md Section 8.3
 * Wholesome school crush/friendship, study, and wholesome family/self-care.
 */
export const KID_TEEN_SAFE_TOPICS: TopicOption[] = [
  {
    id: 'crush_school',
    label: 'Tình bạn & Crush học đường',
    description: 'Chuyện bạn bè trên lớp, hội thân thiết hoặc cảm nắng tuổi học trò',
    positions: ['Năng lượng của bạn', 'Cảm nhận của bạn ấy', 'Gợi ý kết nối vui vẻ'],
  },
  {
    id: 'study',
    label: 'Học tập & Thi cử',
    description: 'Bí quyết ôn bài, vượt qua áp lực điểm số và phát huy thế mạnh',
    positions: ['Điểm mạnh hiện tại', 'Thử thách cần vượt', 'Bí kíp bứt phá'],
  },
  {
    id: 'daily_luck',
    label: 'Vận may ngày mới',
    description: 'Thông điệp tích cực và điều bất ngờ dễ thương đang chờ đón',
    positions: ['Năng lượng chủ đạo', 'Điều bất ngờ nhỏ', 'Lời nhắn tích cực'],
  },
  {
    id: 'self_healing',
    label: 'Chăm sóc bản thân',
    description: 'Giải tỏa áp lực bài vở, thói quen tích cực và lắng nghe cảm xúc bản thân',
    positions: ['Tâm trạng hiện tại', 'Áp lực cần buông', 'Niềm vui mỗi ngày'],
  },
  {
    id: 'family',
    label: 'Gia đình & Bố mẹ',
    description: 'Chia sẻ cùng bố mẹ, lắng nghe và gắn kết yêu thương trong gia đình',
    positions: ['Tình cảm gia đình', 'Hiểu lầm nhỏ', 'Lời khuyên hòa thuận'],
  },
];

/**
 * Couple Spread Positions (Phase 2/3 Bói Đôi) per PLAN.md Section 3.4
 */
export const COUPLE_SPREAD_POSITIONS: [string, string, string] = [
  'Năng lượng của bạn',
  'Năng lượng của người ấy',
  'Sợi dây kết nối & Xu hướng',
];

/**
 * Relationship Status Labels (Phase 2/3 Bói Đôi)
 */
export const RELATIONSHIP_STATUS_LABELS: Record<
  'crush' | 'situationship' | 'dating' | 'ex',
  string
> = {
  crush: 'Crush đơn phương',
  situationship: 'Đang mập mờ (Situationship)',
  dating: 'Đang hẹn hò / Yêu nhau',
  ex: 'Người yêu cũ (Ex)',
};

/**
 * Get the 3 spread position labels for any topic
 */
export function getSpreadPositionsForTopic(topic: TopicId): [string, string, string] {
  const allTopics = [...STANDARD_TOPICS, ...KID_TEEN_SAFE_TOPICS];
  const found = allTopics.find((t) => t.id === topic);
  if (found) {
    return found.positions;
  }
  return ['Năng lượng hiện tại', 'Thử thách ẩn giấu', 'Hướng đi sắp tới'];
}

/**
 * Resolve effective AI persona based on selected reader and age tier.
 * Automatically switches `ba_co_mo_hon` -> `ba_ngoai_vui_tinh` for 10-15yo users,
 * while supporting `tien_tu_chua_lanh`, `tong_tai_ly_tri`, and `phap_su_toi_co`.
 */
export function resolveEffectivePersona(
  readerId: ReaderId,
  ageTier: AgeTier
): EffectivePersona {
  if (
    (readerId === 'ba_co_mo_hon' || readerId === 'chi_dai') &&
    ageTier === 'kid_teen_10_15'
  ) {
    return 'ba_ngoai_vui_tinh';
  }
  return readerId;
}

export interface AgePolicyResult {
  age: number;
  tier: AgeTier;
  isAllowedAccess: boolean;
  isKidTeenSafeMode: boolean;
  paymentEnabled: boolean;
  dailySpendCapVnd: number;
  allowedTopics: TopicOption[];
  effectivePersona: EffectivePersona;
  effectivePersonaFor: (readerId: ReaderId) => EffectivePersona;
  policySummaryVi: string;
}

/**
 * Classify user's age tier and compute safety/monetization/persona guardrails per PLAN.md Section 8.3
 */
export function classifyAgeTier(
  birthYear: number,
  currentYear: number = CURRENT_REFERENCE_YEAR,
  readerId: ReaderId = 'ba_co_mo_hon'
): AgePolicyResult {
  const age = Math.max(0, currentYear - birthYear);

  let tier: AgeTier;
  if (age < 10) {
    tier = 'under_10';
  } else if (age <= 15) {
    tier = 'kid_teen_10_15';
  } else if (age <= 17) {
    tier = 'teen_16_17';
  } else {
    tier = 'adult_18_plus';
  }

  const isAllowedAccess = tier !== 'under_10';
  const isKidTeenSafeMode = tier === 'kid_teen_10_15';
  const paymentEnabled = age >= 11;
  const dailySpendCapVnd = age >= 11 ? 50000 : 0;
  const allowedTopics = isKidTeenSafeMode ? KID_TEEN_SAFE_TOPICS : STANDARD_TOPICS;
  const effectivePersona = resolveEffectivePersona(readerId, tier);

  let policySummaryVi = '';
  switch (tier) {
    case 'under_10':
      policySummaryVi = 'Ứng dụng chỉ dành cho người dùng từ 10 tuổi trở lên. Khóa nạp tiền.';
      break;
    case 'kid_teen_10_15':
      policySummaryVi =
        age < 11
          ? 'Chế độ Trẻ Em (<11 tuổi): Khóa tính năng nạp tiền ngân hàng, chỉ nhận Sao qua Điểm danh.'
          : 'Chế độ Học Đường Trong Sáng (11–15 tuổi): Chủ đề học đường lành mạnh, hỗ trợ nạp Sao có trách nhiệm (trần 50k/ngày).';
      break;
    case 'teen_16_17':
      policySummaryVi =
        'Chế độ Tuổi Teen (16–17 tuổi): Mở đầy đủ chủ đề giải trí, hỗ trợ nạp Sao có trách nhiệm.';
      break;
    case 'adult_18_plus':
      policySummaryVi =
        'Chế độ Đầy Đủ (18+ tuổi): Mở toàn bộ chủ đề và cá tính Reader gốc.';
      break;
  }

  return {
    age,
    tier,
    isAllowedAccess,
    isKidTeenSafeMode,
    paymentEnabled,
    dailySpendCapVnd,
    allowedTopics,
    effectivePersona,
    effectivePersonaFor: (rId: ReaderId) => resolveEffectivePersona(rId, tier),
    policySummaryVi,
  };
}

/**
 * Strip Vietnamese diacritics for accent-insensitive matching
 */
export function removeVietnameseAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Helper to create Unicode-safe word boundary regex for Vietnamese text
 * (In JavaScript RegExp, `\b` only treats ASCII `[A-Za-z0-9_]` as word characters,
 * which fails on Vietnamese diacritics like `ự`, `ử`, `ế`).
 */
function vnPhraseRegex(phrasePattern: string): RegExp {
  return new RegExp(
    `(?:^|[\\s,.;:!?'"()\\[\\]\\-/])(?:${phrasePattern})(?=$|[\\s,.;:!?'"()\\[\\]\\-/])`,
    'i'
  );
}

/**
 * Accented Vietnamese & English crisis patterns (high precision, Unicode boundary safe)
 */
const ACCENTED_CRISIS_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: vnPhraseRegex('tự\\s*tử'), reason: 'Đề cập hành vi tự tử' },
  { pattern: vnPhraseRegex('tự\\s*sát'), reason: 'Đề cập hành vi tự sát' },
  { pattern: vnPhraseRegex('muốn\\s*chết'), reason: 'Biểu hiện ý định muốn chết' },
  { pattern: vnPhraseRegex('chỉ\\s*muốn\\s*chết'), reason: 'Biểu hiện ý định muốn chết' },
  { pattern: vnPhraseRegex('tự\\s*làm\\s*hại'), reason: 'Đề cập hành vi tự làm hại bản thân' },
  { pattern: vnPhraseRegex('kết\\s*thúc\\s*(?:cuộc\\s*đời|mạng\\s*sống|tất\\s*cả)'), reason: 'Biểu hiện ý định kết thúc cuộc đời' },
  { pattern: vnPhraseRegex('không\\s*muốn\\s*sống\\s*nữa'), reason: 'Biểu hiện không muốn tiếp tục sống' },
  { pattern: vnPhraseRegex('chẳng\\s*muốn\\s*sống\\s*nữa'), reason: 'Biểu hiện không muốn tiếp tục sống' },
  { pattern: vnPhraseRegex('nhảy\\s*(?:lầu|cầu)'), reason: 'Đề cập hành vi nguy hiểm tính mạng' },
  { pattern: vnPhraseRegex('cắt\\s*(?:cổ\\s*)?tay'), reason: 'Đề cập hành vi tự làm hại bản thân' },
  { pattern: vnPhraseRegex('rạch\\s*tay'), reason: 'Đề cập hành vi tự làm hại bản thân' },
  { pattern: vnPhraseRegex('uống\\s*thuốc\\s*(?:ngủ|tự\\s*tử|quá\\s*liều)'), reason: 'Đề cập hành vi uống thuốc quá liều' },
  { pattern: vnPhraseRegex('treo\\s*cổ'), reason: 'Đề cập hành vi nguy hiểm tính mạng' },
  { pattern: /\bsuicide\b/i, reason: 'Crisis keyword: suicide' },
  { pattern: /\bkill\s*myself\b/i, reason: 'Crisis keyword: kill myself' },
  { pattern: /\bend\s*my\s*life\b/i, reason: 'Crisis keyword: end my life' },
  { pattern: /\bself[\s-]*harm\b/i, reason: 'Crisis keyword: self-harm' },
  { pattern: /\bwant\s*to\s*die\b/i, reason: 'Crisis keyword: want to die' },
];

/**
 * Unaccented Vietnamese crisis patterns (carefully constructed to avoid false positives like "từ từ")
 */
const UNACCENTED_CRISIS_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\b(muon|dinh|y\s*dinh|se|di|nghi\s*den\s*chuyen)\s*tu\s*tu\b/i, reason: 'Đề cập ý định tự tử (không dấu)' },
  { pattern: /\btu\s*sat\b/i, reason: 'Đề cập hành vi tự sát (không dấu)' },
  { pattern: /\bmuon\s*chet\b/i, reason: 'Biểu hiện ý định muốn chết (không dấu)' },
  { pattern: /\bkhong\s*muon\s*song\s*nua\b/i, reason: 'Biểu hiện không muốn sống nữa (không dấu)' },
  { pattern: /\bket\s*thuc\s*cuoc\s*doi\b/i, reason: 'Biểu hiện kết thúc cuộc đời (không dấu)' },
  { pattern: /\btu\s*lam\s*hai\b/i, reason: 'Đề cập tự làm hại (không dấu)' },
  { pattern: /\bnhay\s*(lau|cau)\b/i, reason: 'Đề cập hành vi nguy hiểm tính mạng (không dấu)' },
  { pattern: /\b(cat|rach)\s*(co\s*)?tay\b/i, reason: 'Đề cập hành vi tự làm hại (không dấu)' },
  { pattern: /\buong\s*thuoc\s*(ngu|tu\s*tu|qua\s*lieu)\b/i, reason: 'Đề cập uống thuốc quá liều (không dấu)' },
];

/**
 * Sensitive distress patterns (triggers gentle support note without blocking the reading)
 */
const SENSITIVE_PATTERNS: RegExp[] = [
  vnPhraseRegex('trầm\\s*cảm'),
  vnPhraseRegex('tuyệt\\s*vọng'),
  vnPhraseRegex('bạo\\s*hành'),
  vnPhraseRegex('đánh\\s*đập'),
  vnPhraseRegex('hoảng\\s*loạn'),
  /\bpanic\s*attack\b/i,
  vnPhraseRegex('suy\\s*sụp'),
  /\btram\s*cam\b/i,
  /\btuyet\s*vong\b/i,
];

/**
 * Prompt Injection & Jailbreak detection patterns
 */
const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+|previous\s+|prior\s+|above\s+)?instructions/i,
  /disregard\s+(all\s+|previous\s+|prior\s+)?instructions/i,
  /forget\s+(everything|all\s+instructions)/i,
  /quên\s+(hết\s+|tất\s+cả\s+)?(lệnh|hướng\s+dẫn)\s+(trước|ở\s+trên)/i,
  /bỏ\s+qua\s+(mọi\s+|tất\s+cả\s+|các\s+)?(lệnh|hướng\s+dẫn|quy\s+tắc)/i,
  /system\s*prompt/i,
  /developer\s*mode/i,
  /\bjailbreak\b/i,
  /\bdan\s*mode\b/i,
  /viết\s+(cho\s+tôi\s+)?(đoạn\s+)?code\s+(python|javascript|sql|html|c\+\+)/i,
  /đổi\s+vai\s+thành/i,
  /bây\s+giờ\s+bạn\s+là\s+một\s+lập\s+trình\s+viên/i,
  /<\/?user_question>/i,
  /<\/?system>/i,
];

export interface CrisisAndInjectionScanResult {
  safetyFlag: SafetyFlag;
  isPromptInjection: boolean;
  matchedCrisisReason?: string;
  sanitizedText: string;
}

/**
 * Pre-AI Server-Side Safety & Prompt Injection Scanner.
 * Runs synchronously before any AI call per PLAN.md Section 8.1 & 8.5.
 */
export function scanCrisisAndInjection(text: string): CrisisAndInjectionScanResult {
  const raw = (text ?? '').trim();

  // Sanitize XML/HTML delimiter tags that could break out of <user_question>
  const sanitizedText = raw
    .replace(/<\/?user_question>/gi, '[thẻ bị lọc]')
    .replace(/<\/?system>/gi, '[thẻ bị lọc]')
    .slice(0, 300);

  const normalizedLower = raw.toLowerCase();
  const unaccentedLower = removeVietnameseAccents(normalizedLower);

  // 1. CheckPrompt Injection
  const isPromptInjection = PROMPT_INJECTION_PATTERNS.some(
    (regex) => regex.test(normalizedLower) || regex.test(unaccentedLower)
  );

  // 2. Check Crisis Patterns (Accented first, then Unaccented)
  for (const item of ACCENTED_CRISIS_PATTERNS) {
    if (item.pattern.test(normalizedLower)) {
      return {
        safetyFlag: 'crisis',
        isPromptInjection,
        matchedCrisisReason: item.reason,
        sanitizedText,
      };
    }
  }

  for (const item of UNACCENTED_CRISIS_PATTERNS) {
    if (item.pattern.test(unaccentedLower)) {
      return {
        safetyFlag: 'crisis',
        isPromptInjection,
        matchedCrisisReason: item.reason,
        sanitizedText,
      };
    }
  }

  // 3. Check Sensitive Emotional Distress
  const isSensitive = SENSITIVE_PATTERNS.some(
    (regex) => regex.test(normalizedLower) || regex.test(unaccentedLower)
  );

  return {
    safetyFlag: isSensitive ? 'sensitive' : 'none',
    isPromptInjection,
    sanitizedText,
  };
}

export interface CrisisHotline {
  number: string;
  telHref: string;
  name: string;
  description: string;
  badge: string;
}

export interface CrisisSupportData {
  title: string;
   empatheticMessage: string;
  secondaryMessage: string;
  hotlines: CrisisHotline[];
  hideShareAndUpsell: true;
}

/**
 * Verified Vietnamese Crisis Intervention Support Data per PLAN.md Section 8.1 & 9.2
 */
export const CRISIS_SUPPORT_DATA: CrisisSupportData = {
  title: 'Bạn không hề đơn độc lúc này 🤍',
  empatheticMessage:
    'Tụi mình nhận thấy bạn đang trải qua những cảm xúc rất nặng nề. Những lá bài Tarot lúc này xin phép được khép lại, vì sự an toàn và bình an của bạn quan trọng hơn bất kỳ lời giải đoán nào.',
  secondaryMessage:
    'Xin hãy hít thở thật chậm và kết nối ngay với một người bạn tin tưởng, người thân trong gia đình, hoặc gọi tới các đường dây lắng nghe và hỗ trợ miễn phí dưới đây:',
  hotlines: [
    {
      number: '111',
      telHref: 'tel:111',
      name: 'Tổng đài Quốc gia Bảo vệ Trẻ em & Thanh thiếu niên',
      description: 'Hỗ trợ tư vấn tâm lý, bảo vệ khẩn cấp miễn phí 24/7 trên toàn quốc.',
      badge: 'Miễn phí 24/7',
    },
    {
      number: '115',
      telHref: 'tel:115',
      name: 'Cấp cứu Y tế Toàn quốc',
      description: 'Hỗ trợ y tế và cấp cứu khẩn cấp tại mọi tỉnh thành.',
      badge: 'Khẩn cấp 24/7',
    },
    {
      number: '096 306 1414',
      telHref: 'tel:0963061414',
      name: 'Đường dây nóng Ngày Mai',
      description: 'Hỗ trợ tâm lý, sơ cứu cảm xúc và lắng nghe miễn phí cho người đang khủng hoảng.',
      badge: 'Lắng nghe & Hỗ trợ',
    },
  ],
  hideShareAndUpsell: true,
};
