export type SpreadTopic = 'love' | 'career' | 'finance';

export type TarotSuit = 'wands' | 'cups' | 'swords' | 'pentacles';

export interface SpreadPosition {
  index: 1 | 2 | 3;
  label: string;
  teen_label: string;
  description: string;
  teen_description: string;
}

export interface ReaderPersona {
  id:
    | 'ba_ngoai'
    | 'chi_dai'
    | 'ban_than'
    | 'thay_cu_meo'
    | 'ba_co_mo_hon'
    | 'tien_tu_chua_lanh'
    | 'tong_tai_ly_tri'
    | 'phap_su_toi_co';
  name: string;
  teen_safe_name: string;
  title: string;
  tagline: string;
  teen_tagline: string;
  badge: string;
  avatar_symbol: string;
  avatar_image?: string;
  accent_color: string;
  active: boolean;
  is_free: boolean;
  keywords: [string, string, string];
  not_suitable_for: string;
  teen_not_suitable_for: string;
  sample_quote: string;
  sample_reading_snippet?: string;
  persona_prompt: string;
}

export interface TarotCard {
  id: number;
  roman: string;
  name_en: string;
  name_vi: string;
  arcana: 'major' | 'minor';
  suit?: TarotSuit;
  rws_image_url: string;
  symbol_glyph: string;
  palette: {
    primary: string;
    secondary: string;
    glow: string;
  };
  keywords_up: string[];
  keywords_rev: string[];
  // H8: heavy Vietnamese prose moved to `@/data/tarot-card-prose` and resolved
  // lazily via `getCardProse(id)` so the client bundle only ships id/image/keywords.
  core_meaning_up?: string;
  core_meaning_rev?: string;
  savage_hook_up?: string;
  savage_hook_rev?: string;
  healing_hook_up?: string;
  healing_hook_rev?: string;
  teen_hook_up?: string;
  teen_hook_rev?: string;
}

import { getCardProse } from '@/data/tarot-card-prose';

/**
 * H8: resolve the full prose for a card (merging the lazy-loaded detail map).
 * Server components and routes should call this instead of reading the now
 * optional prose fields directly off the card object.
 */
export function withCardProse(
  card: TarotCard
): TarotCard & Required<Pick<TarotCard, typeof PROSE_FIELDS[number]>>;
export function withCardProse(card: TarotCard) {
  const prose = getCardProse(card.id);
  return { ...card, ...(prose ?? {}) };
}

export const PROSE_FIELDS = [
  'core_meaning_up',
  'core_meaning_rev',
  'savage_hook_up',
  'savage_hook_rev',
  'healing_hook_up',
  'healing_hook_rev',
  'teen_hook_up',
  'teen_hook_rev',
] as const;

export const SPREAD_POSITIONS: Record<
  SpreadTopic,
  [SpreadPosition, SpreadPosition, SpreadPosition]
> = {
  love: [
    {
      index: 1,
      label: 'Năng lượng của bạn',
      teen_label: 'Năng lượng của bạn',
      description: 'Tâm thế, cảm xúc ẩn giấu và cách bạn đang bước vào mối quan hệ này.',
      teen_description: 'Tâm trạng và nguồn năng lượng hiện tại của bạn trong chuyện bạn bè, trường lớp.',
    },
    {
      index: 2,
      label: 'Suy nghĩ của đối phương',
      teen_label: 'Góc nhìn của bạn bè/crush',
      description: 'Góc nhìn, sự ngập ngừng hoặc mong muốn thực sự từ phía bên kia.',
      teen_description: 'Cách bạn bè hoặc crush đang cảm nhận về sự kết nối giữa hai người.',
    },
    {
      index: 3,
      label: 'Kết cục gần',
      teen_label: 'Lời khuyên sắp tới',
      description: 'Xu hướng chuyển dịch của mối quan hệ trong thời gian tới và lời nhắn cho bạn.',
      teen_description: 'Gợi ý tích cực để bạn giữ tinh thần vui vẻ, tự tin và gắn kết đẹp hơn.',
    },
  ],
  career: [
    {
      index: 1,
      label: 'Gốc rễ vấn đề',
      teen_label: 'Gốc rễ việc học',
      description: 'Nguyên nhân cốt lõi đang định hình công việc hoặc việc học của bạn hiện tại.',
      teen_description: 'Điều đang ảnh hưởng lớn nhất tới thói quen học tập và sự tập trung của bạn.',
    },
    {
      index: 2,
      label: 'Chướng ngại ẩn',
      teen_label: 'Thử thách cần vượt',
      description: 'Điểm mù, thói quen trì hoãn hoặc rào cản ngoại cảnh bạn chưa nhìn rõ.',
      teen_description: 'Thói quen nhỏ hoặc nỗi lo vô hình đang làm bạn chậm nhịp ôn bài.',
    },
    {
      index: 3,
      label: 'Lối thoát',
      teen_label: 'Bí kíp bứt phá',
      description: 'Hành động cụ thể giúp bạn tháo gỡ nút thắt và lấy lại đà tiến.',
      teen_description: 'Bước đi đơn giản giúp bạn lấy lại cảm hứng học tập và đạt kết quả tốt.',
    },
  ],
  finance: [
    {
      index: 1,
      label: 'Tình hình hiện tại',
      teen_label: 'Vận may hiện tại',
      description: 'Bức tranh thực tế về dòng chảy tài chính và vận hội của bạn lúc này.',
      teen_description: 'Nguồn năng lượng may mắn và niềm vui nhỏ đang vây quanh bạn hôm nay.',
    },
    {
      index: 2,
      label: 'Điều đang cản',
      teen_label: 'Điều làm phân tâm',
      description: 'Lỗ hổng thói quen hoặc tâm lý nóng vội đang kìm hãm tài vận.',
      teen_description: 'Những suy nghĩ lo xa hoặc thói quen vội vàng làm bạn bỏ lỡ niềm vui.',
    },
    {
      index: 3,
      label: 'Việc nên làm',
      teen_label: 'Hành động đón may mắn',
      description: 'Bước đi khôn ngoan để giữ vững nguồn lực và đón cơ hội mới.',
      teen_description: 'Một việc tử tế hoặc thói quen tốt giúp ngày mới của bạn rực rỡ hơn.',
    },
  ],
};

export const CANONICAL_READERS: ReaderPersona[] = [
  {
    id: 'ba_ngoai',
    name: 'Bà Ngoại',
    teen_safe_name: 'Bà Ngoại Vui Tính',
    title: 'ẤM ÁP & VỖ VỀ',
    tagline: 'Ấm áp, hay kể chuyện xưa, nhắc ăn cơm, ví von đời thường.',
    teen_tagline: 'Ấm áp, hiền hậu, đồng hành học đường và cuộc sống.',
    badge: 'BÀ NGOẠI • ẤM ÁP',
    avatar_symbol: 'BN',
    avatar_image: '/readers/tien-tu-chua-lanh.jpg',
    accent_color: '#EAB308',
    active: true,
    is_free: true,
    keywords: ['Ấm Áp', 'Chuyện Xưa', 'Vỗ Về'],
    not_suitable_for: 'Bạn muốn nghe lời mắng gắt hoặc phân tích khô khan.',
    teen_not_suitable_for: 'Bạn chỉ muốn nghe khen ngợi mà không chịu thay đổi.',
    sample_quote: 'Ngồi xuống đây con, kể bà nghe.',
    sample_reading_snippet:
      'Lá bài The Sun tỏa nắng: Con đã vất vả nhiều rồi, ăn chén cơm nóng rồi nghỉ ngơi nghen. Bình yên đang đợi con phía trước.',
    persona_prompt:
      'Bạn là Bà Ngoại — một Reader Tarot ấm áp, hay kể chuyện xưa, nhắc ăn cơm. Giọng nhẹ nhàng, dùng "con", ví von đời thường. Đem lại cảm giác an yên, bao dung như về bên bà.',
  },
  {
    id: 'chi_dai',
    name: 'Chị Đại',
    teen_safe_name: 'Chị Cả Tỉnh Táo',
    title: 'THẲNG THẮN, THƯƠNG THẬT',
    tagline: 'Thẳng, hơi gắt, thương thật. Ngắn, mạnh, hơi mắng yêu.',
    teen_tagline: 'Thẳng thắn, rõ ràng, khích lệ tự tin và tập trung học tập.',
    badge: 'CHỊ ĐẠI • TỈNH TÁO',
    avatar_symbol: 'CĐ',
    avatar_image: '/readers/ba-co-mo-hon.jpg',
    accent_color: '#E11D48',
    active: true,
    is_free: true,
    keywords: ['Thẳng Thắn', 'Gắt Nhẹ', 'Thương Thật'],
    not_suitable_for: 'Bạn đang quá mong manh hoặc chỉ cần được vuốt ve cảm xúc.',
    teen_not_suitable_for: 'Bạn đang tìm kiếm sự nuông chiều thiếu kỷ luật.',
    sample_quote: 'Nói thẳng nha, đừng vòng vo.',
    sample_reading_snippet:
      'Lá The Devil đảo chiều: Đừng lụy tình nữa, nó bận rep người khác chứ không bận học đâu. Tỉnh lại và nâng cấp bản thân ngay đi!',
    persona_prompt:
      'Bạn là Chị Đại — thẳng, hơi gắt, thương thật. Ngắn, mạnh, hơi mắng yêu. Bắt bài thói quen tự huyễn hoặc và luỵ tình nhưng mục đích là giúp người nghe tự trọng và mạnh mẽ hơn.',
  },
  {
    id: 'ban_than',
    name: 'Bạn Thân',
    teen_safe_name: 'Bạn Cùng Bàn',
    title: 'HÀI HƯỚC & ĐỒNG CẢM',
    tagline: 'Hài, lầy, đồng cảm. Slang nhẹ, meme, không phán xét.',
    teen_tagline: 'Hài hước, bạn cùng bàn tâm sự mọi chuyện trường lớp.',
    badge: 'BẠN THÂN • ĐỒNG CẢM',
    avatar_symbol: 'BT',
    avatar_image: '/readers/phap-su-toi-co.jpg',
    accent_color: '#EC4899',
    active: true,
    is_free: true,
    keywords: ['Hài Hước', 'Lầy Lội', 'Đồng Cảm'],
    not_suitable_for: 'Bạn cần không khí trang nghiêm cổ kính hoặc phân tích tài chính phức tạp.',
    teen_not_suitable_for: 'Bạn muốn các phương pháp kỷ luật cứng nhắc.',
    sample_quote: 'Kể đi, tao nghe hết, không phán xét.',
    sample_reading_snippet:
      'Lá The Fool: Tao thấy mày lại chuẩn bị đâm đầu vào bụi rậm rồi đấy. Nhưng thôi lỡ thích rồi thì cứ thử, có gì tao ở đây hứng cho!',
    persona_prompt:
      'Bạn là Bạn Thân — hài hước, lầy lội, đồng cảm tuyệt đối. Dùng slang Gen Z nhẹ nhàng, meme dí dỏm. Nghe hết mọi tâm sự khó nói mà không hề phán xét.',
  },
  {
    id: 'thay_cu_meo',
    name: 'Thầy Cú Mèo',
    teen_safe_name: 'Thầy Cú Mèo',
    title: 'ĐIỀM TĨNH & PHÂN TÍCH',
    tagline: 'Điềm tĩnh, phân tích có logic, từ tốn, câu hỏi gợi mở.',
    teen_tagline: 'Điềm tĩnh, tư duy logic, lập kế hoạch học tập thực tế.',
    badge: 'THẦY CÚ MÈO • LOGIC',
    avatar_symbol: 'CM',
    avatar_image: '/readers/tong-tai-ly-tri.jpg',
    accent_color: '#3B82F6',
    active: true,
    is_free: true,
    keywords: ['Điềm Tĩnh', 'Phân Tích', 'Logic'],
    not_suitable_for: 'Bạn chỉ muốn trút cảm xúc vu vơ mà không cần tìm giải pháp.',
    teen_not_suitable_for: 'Bạn không muốn tư duy logic hay suy ngẫm sâu.',
    sample_quote: 'Hãy bắt đầu từ điều khiến con bận tâm nhất.',
    sample_reading_snippet:
      'Lá The Emperor: Năng lực của con đủ, nhưng đang thiếu kỷ luật thực thi. Đừng để cảm xúc lấn át mục tiêu dài hạn.',
    persona_prompt:
      'Bạn là Thầy Cú Mèo — điềm tĩnh, phân tích có logic, từ tốn, đặt câu hỏi gợi mở. Giúp người hỏi nhìn rõ bức tranh tổng thể và tự đưa ra quyết định sáng suốt.',
  },
];

export const LEGACY_READERS: ReaderPersona[] = [
  {
    id: 'ba_co_mo_hon',
    name: 'Bà Cố Mỏ Hỗn',
    teen_safe_name: 'Bà Ngoại Vui Tính',
    title: 'ĐỘ GẮT 100%',
    tagline: 'Hội đang mập mờ, lụy ex, cần người mắng cho tỉnh ngộ.',
    teen_tagline: 'Hội cần lời khuyên hài hước, ấm áp về chuyện học đường.',
    badge: 'ĐỘ GẮT 100%',
    avatar_symbol: 'BC',
    avatar_image: '/readers/ba-co-mo-hon.jpg',
    accent_color: '#E5624A',
    active: true,
    is_free: true,
    keywords: ['Sắc Sảo', 'Tỉnh Mộng', 'Check Var'],
    not_suitable_for: 'Bạn đang rất mong manh hoặc chỉ cần được an ủi vỗ về.',
    teen_not_suitable_for: 'Bạn đang muốn nghe lời phê bình nghiêm khắc.',
    sample_quote: 'Tỉnh lại đi cháu, nó bận rep người khác chứ không bận học đâu.',
    sample_reading_snippet:
      'Lá bài The Devil lộn ngược: Mối quan hệ này không có tương lai đâu, chỉ có bạn tự huyễn hoặc thôi. Dừng lụy tình lại mà tập trung kiếm tiền đi!',
    persona_prompt:
      'Bạn là Bà Cố Mỏ Hỗn — một Reader Tarot sắc sảo, hài hước kiểu Gen Z Việt Nam, nhìn thấu sự tự huyễn hoặc nhưng sâu bên trong vẫn muốn người hỏi tỉnh táo và yêu thương bản thân. Chỉ cà khịa tình huống và hành vi tự lừa dối, tuyệt đối không xúc phạm cá nhân hay phán xét độc hại.',
  },
  {
    id: 'tien_tu_chua_lanh',
    name: 'Tiên Tử Chữa Lành',
    teen_safe_name: 'Tiên Tử Chữa Lành',
    title: 'DỊU NHƯ MỘC CÁI ÔM',
    tagline: 'Hội đang burnout, áp lực học tập, vừa thất tình cần chỗ dựa.',
    teen_tagline: 'Hội cần vỗ về cảm xúc và khích lệ nhẹ nhàng.',
    badge: 'DỊU NHƯ MỘC CÁI ÔM',
    avatar_symbol: 'TT',
    avatar_image: '/readers/tien-tu-chua-lanh.jpg',
    accent_color: '#5DB075',
    active: true,
    is_free: true,
    keywords: ['Dịu Dàng', 'Lắng Nghe', 'Chữa Lành'],
    not_suitable_for: 'Bạn cần ai đó nói thẳng thừng, đanh thép, không vòng vo.',
    teen_not_suitable_for: 'Bạn muốn các phương pháp kỷ luật cứng rắn ngay lập tức.',
    sample_quote: 'Vũ trụ biết bạn đã cố gắng nhiều rồi.',
    sample_reading_snippet:
      'Lá The Star sáng rọi: Trái tim bạn đang dần hồi phục sau những tổn thương. Đừng tự tạo áp lực cho mình nữa, bình yên đang trên đường đến với bạn.',
    persona_prompt:
      'Bạn là Tiên Tử Chữa Lành — một Reader Tarot ấm áp, giàu sự thấu cảm, giọng văn giàu chất thơ và tinh tế. Bạn giúp người hỏi nhận diện cảm xúc thật, rũ bỏ tự trách và tìm thấy bước đi nhẹ nhàng cho tâm hồn.',
  },
  {
    id: 'tong_tai_ly_tri',
    name: 'Tổng Tài Lý Trí',
    teen_safe_name: 'Đàn Anh Điềm Tĩnh',
    title: 'PHÂN TÍCH, KẾ HOẠCH 1-2-3',
    tagline: 'Hội hỏi về sự nghiệp, tài chính, muốn cầm đằng chuôi cuộc đời.',
    teen_tagline: 'Hội thích lập kế hoạch học tập thực tế và logic.',
    badge: 'KẾ HOẠCH 1-2-3',
    avatar_symbol: 'TL',
    avatar_image: '/readers/tong-tai-ly-tri.jpg',
    accent_color: '#5B8DEF',
    active: true,
    is_free: true,
    keywords: ['Logic', 'Chiến Lược', 'Hành Động'],
    not_suitable_for: 'Bạn đang cần được ôm ấp cảm xúc chứ chưa cần kế hoạch hành động.',
    teen_not_suitable_for: 'Bạn chỉ muốn tâm sự vu vơ không cần tìm giải pháp.',
    sample_quote: 'Lá bài chỉ là dữ liệu. Quyết định vẫn là của bạn.',
    sample_reading_snippet:
      'Phân tích SWOT qua lá The Emperor: Điểm mạnh của bạn là chuyên môn vững, nhưng điểm yếu là trì hoãn vì cầu toàn. Kế hoạch: Chia nhỏ mục tiêu 3 ngày tới.',
    persona_prompt:
      'Bạn là Tổng Tài Lý Trí — một Reader Tarot mang phong thái CEO điềm tĩnh, phân tích lá bài dưới góc nhìn tâm lý học hành vi, mô hình SWOT, quản trị rủi ro và kế hoạch hành động thực tế (Strategic Action Plan). Giọng văn súc tích, sắc bén, dùng ẩn dụ đầu tư cảm xúc - ROI - chi phí cơ hội để giúp người hỏi ngừng tiêu hao năng lượng vô ích và ra quyết định chuẩn xác.',
  },
  {
    id: 'phap_su_toi_co',
    name: 'Pháp Sư Tối Cổ',
    teen_safe_name: 'Hiền Triết Cổ Đại',
    title: 'HUYỀN BÍ, NGHIỆP QUẢ',
    tagline: 'Hội thích tâm linh sâu sắc, vibe witchy huyền bí và tarot cổ điển.',
    teen_tagline: 'Hội tò mò về biểu tượng cổ điển và triết lý xưa.',
    badge: 'HUYỀN BÍ, NGHIỆP QUẢ',
    avatar_symbol: 'PS',
    avatar_image: '/readers/phap-su-toi-co.jpg',
    accent_color: '#9D65E5',
    active: true,
    is_free: true,
    keywords: ['Huyền Bí', 'Nghiệp Quả', 'Tần Số'],
    not_suitable_for: 'Bạn muốn câu trả lời ngắn gọn, thực dụng mì ăn liền.',
    teen_not_suitable_for: 'Bạn chỉ tìm kiếm câu trả lời nhanh gọn có/không.',
    sample_quote: 'Có những duyên chưa dứt, từ rất lâu trước đêm nay.',
    sample_reading_snippet:
      'Tần số bài The High Priestess: Giác quan thứ sáu của bạn đang rất nhạy. Đây là bài học linh hồn về sự kiên nhẫn và buông bỏ kiểm soát để đón nhận.',
    persona_prompt:
      'Bạn là Pháp Sư Tối Cổ — một bậc thầy huyền học giải mã Tarot theo trường phái biểu tượng học Jungian (Shadow Work), cổ điển Rider-Waite-Smith 1909, tần số rung động linh hồn (Soul Frequency), bài học nghiệp quả (Karma) và kết nối Twin Flame. Giọng văn trầm mặc, uyên bác, nhuốm màu huyền bí cổ xưa nhưng chạm thẳng vào tầng vô thức sâu nhất của người hỏi.',
  },
];

export const READERS: ReaderPersona[] = CANONICAL_READERS;

export const MAJOR_ARCANA: TarotCard[] = [
  {
    id: 0,
    roman: '0',
    name_en: 'The Fool',
    name_vi: 'Kẻ Khờ',
    arcana: 'major',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg',
    symbol_glyph: '✧',
    palette: { primary: '#F59E0B', secondary: '#FEF3C7', glow: 'rgba(245, 158, 11, 0.38)' },
    keywords_up: ['Khởi đầu mới', 'Tự do', 'Bản năng', 'Bước nhảy niềm tin', 'Hồn nhiên'],
    keywords_rev: ['Bốc đồng', 'Ngây thơ quá mức', 'Sợ bước tiếp', 'Thiếu tính toán', 'Liều lĩnh'],
  },
  {
    id: 1,
    roman: 'I',
    name_en: 'The Magician',
    name_vi: 'Nhà Ảo Thuật',
    arcana: 'major',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg',
    symbol_glyph: '∞',
    palette: { primary: '#EAB308', secondary: '#FDE68A', glow: 'rgba(234, 179, 8, 0.4)' },
    keywords_up: ['Chủ động', 'Đủ nguồn lực', 'Tập trung ý chí', 'Biến ý tưởng thành thật', 'Khéo léo'],
    keywords_rev: ['Thao túng', 'Nói nhiều làm ít', 'Phân tán năng lượng', 'Tự nghi ngờ', 'Hào nhoáng rỗng'],
  },
  {
    id: 2,
    roman: 'II',
    name_en: 'The High Priestess',
    name_vi: 'Nữ Tư Tế',
    arcana: 'major',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/8/88/RWS_Tarot_02_High_Priestess.jpg',
    symbol_glyph: '☽',
    palette: { primary: '#60A5FA', secondary: '#DBEAFE', glow: 'rgba(96, 165, 250, 0.36)' },
    keywords_up: ['Trực giác nhạy bén', 'Bí mật', 'Tĩnh lặng quan sát', 'Chiều sâu nội tâm', 'Chờ thời điểm'],
    keywords_rev: ['Bỏ qua linh cảm', 'Bí mật bị lộ', 'Bề nổi hời hợt', 'Nén cảm xúc', 'Hoài nghi'],
  },
  {
    id: 3,
    roman: 'III',
    name_en: 'The Empress',
    name_vi: 'Nữ Hoàng',
    arcana: 'major',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d2/RWS_Tarot_03_Empress.jpg',
    symbol_glyph: '♀',
    palette: { primary: '#34D399', secondary: '#D1FAE5', glow: 'rgba(52, 211, 153, 0.36)' },
    keywords_up: ['Trù phú', 'Yêu thương bản thân', 'Quyến rũ tự nhiên', 'Nuôi dưỡng', 'Sáng tạo'],
    keywords_rev: ['Bỏ bê bản thân', 'Cho đi quá mức', 'Phụ thuộc cảm xúc', 'Cạn kiệt', 'Ngột ngạt'],
  },
  {
    id: 4,
    roman: 'IV',
    name_en: 'The Emperor',
    name_vi: 'Hoàng Đế',
    arcana: 'major',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/RWS_Tarot_04_Emperor.jpg',
    symbol_glyph: '♈',
    palette: { primary: '#F87171', secondary: '#FEE2E2', glow: 'rgba(248, 113, 113, 0.36)' },
    keywords_up: ['Kỷ luật', 'Ranh giới vững vàng', 'Trách nhiệm', 'Vững chãi', 'Chủ quyền'],
    keywords_rev: ['Bảo thủ', 'Kiểm soát quá mức', 'Thiếu kỷ luật', 'Gia trưởng', 'Cứng nhắc'],
  },
  {
    id: 5,
    roman: 'V',
    name_en: 'The Hierophant',
    name_vi: 'Giáo Hoàng',
    arcana: 'major',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/RWS_Tarot_05_Hierophant.jpg',
    symbol_glyph: '☥',
    palette: { primary: '#D97706', secondary: '#FEF3C7', glow: 'rgba(217, 119, 6, 0.36)' },
    keywords_up: ['Cam kết chính thức', 'Giá trị cốt lõi', 'Người dẫn đường', 'Truyền thống', 'Học hỏi'],
    keywords_rev: ['Phá vỡ khuôn mẫu', 'Sợ định kiến', 'Tư duy lối mòn', 'Lệch chuẩn giá trị', 'Nổi loạn'],
  },
  {
    id: 6,
    roman: 'VI',
    name_en: 'The Lovers',
    name_vi: 'Đôi Tình Nhân',
    arcana: 'major',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/RWS_Tarot_06_Lovers.jpg',
    symbol_glyph: '♊',
    palette: { primary: '#F472B6', secondary: '#FCE7F3', glow: 'rgba(244, 114, 182, 0.4)' },
    keywords_up: ['Đồng điệu sâu sắc', 'Lựa chọn từ trái tim', 'Gắn kết chân thành', 'Hòa hợp', 'Nhất quán'],
    keywords_rev: ['Lưỡng lự ngã ba đường', 'Lệch pha giá trị', 'Cám dỗ nhất thời', 'Thiếu đồng thuận', 'Né tránh chọn'],
  },
  {
    id: 7,
    roman: 'VII',
    name_en: 'The Chariot',
    name_vi: 'Cỗ Xe',
    arcana: 'major',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/RWS_Tarot_07_Chariot.jpg',
    symbol_glyph: '♋',
    palette: { primary: '#38BDF8', secondary: '#E0F2FE', glow: 'rgba(56, 189, 248, 0.38)' },
    keywords_up: ['Bứt tốc', 'Chiến thắng', 'Làm chủ tay lái', 'Quyết tâm cao độ', 'Vượt chướng ngại'],
    keywords_rev: ['Mất phương hướng', 'Nóng vội cưỡng cầu', 'Xung đột nội tâm', 'Đứt phanh', 'Trì trệ'],
  },
  {
    id: 8,
    roman: 'VIII',
    name_en: 'Strength',
    name_vi: 'Sức Mạnh Nội Tâm',
    arcana: 'major',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg',
    symbol_glyph: '♌',
    palette: { primary: '#FBBF24', secondary: '#FEF9C3', glow: 'rgba(251, 191, 36, 0.4)' },
    keywords_up: ['Bản lĩnh dịu dàng', 'Kiên nhẫn', 'Làm chủ cảm xúc', 'Bao dung', 'Nội lực bền bỉ'],
    keywords_rev: ['Kiệt sức vì gồng', 'Nóng nảy mất bình tĩnh', 'Tự ti', 'Yếu lòng', 'Đè nén'],
  },
  {
    id: 9,
    roman: 'IX',
    name_en: 'The Hermit',
    name_vi: 'Ẩn Sĩ',
    arcana: 'major',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/RWS_Tarot_09_Hermit.jpg',
    symbol_glyph: '♍',
    palette: { primary: '#94A3B8', secondary: '#F1F5F9', glow: 'rgba(148, 163, 184, 0.36)' },
    keywords_up: ['Chiêm nghiệm', 'Tạm lùi lại', 'Tự soi chiếu', 'Tìm câu trả lời bên trong', 'Độc lập'],
    keywords_rev: ['Cô lập quá mức', 'Sợ cô đơn', 'Trốn tránh thực tại', 'Từ chối giao tiếp', 'Lạc lõng'],
  },
  {
    id: 10,
    roman: 'X',
    name_en: 'Wheel of Fortune',
    name_vi: 'Bánh Xe Số Phận',
    arcana: 'major',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/RWS_Tarot_10_Wheel_of_Fortune.jpg',
    symbol_glyph: '☸',
    palette: { primary: '#A78BFA', secondary: '#EDE9FE', glow: 'rgba(167, 139, 250, 0.4)' },
    keywords_up: ['Bước ngoặt bất ngờ', 'Chuyển vận', 'Chu kỳ mới', 'Cơ hội tình cờ', 'Thuận dòng chảy'],
    keywords_rev: ['Lặp lại vòng lặp cũ', 'Chống lại thay đổi', 'Trì hoãn tạm thời', 'Chưa đúng thời điểm', 'Bị động'],
  },
  {
    id: 11,
    roman: 'XI',
    name_en: 'Justice',
    name_vi: 'Công Lý',
    arcana: 'major',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/RWS_Tarot_11_Justice.jpg',
    symbol_glyph: '♎',
    palette: { primary: '#F59E0B', secondary: '#FEF3C7', glow: 'rgba(245, 158, 11, 0.36)' },
    keywords_up: ['Công bằng', 'Nhân quả rõ ràng', 'Sự thật sáng tỏ', 'Cân bằng cho - nhận', 'Minh bạch'],
    keywords_rev: ['Mất cân bằng', 'Đổ lỗi né trách nhiệm', 'Thiên vị cảm tính', 'Thiếu công bằng', 'Mập mờ'],
  },
  {
    id: 12,
    roman: 'XII',
    name_en: 'The Hanged Man',
    name_vi: 'Người Treo Ngược',
    arcana: 'major',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/2/2b/RWS_Tarot_12_Hanged_Man.jpg',
    symbol_glyph: '♆',
    palette: { primary: '#38BDF8', secondary: '#E0F2FE', glow: 'rgba(56, 189, 248, 0.35)' },
    keywords_up: ['Đổi góc nhìn', 'Tạm dừng chủ động', 'Buông bỏ kiểm soát', 'Thấu hiểu mới', 'Chấp nhận'],
    keywords_rev: ['Hy sinh vô ích', 'Mắc kẹt kéo dài', 'Chờ đợi trong mỏi mòn', 'Cố chấp', 'Trì hoãn'],
  },
  {
    id: 13,
    roman: 'XIII',
    name_en: 'Death',
    name_vi: 'Sự Chuyển Hóa',
    arcana: 'major',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/RWS_Tarot_13_Death.jpg',
    symbol_glyph: '♏',
    palette: { primary: '#64748B', secondary: '#E2E8F0', glow: 'rgba(100, 116, 139, 0.4)' },
    keywords_up: ['Khép lại chương cũ', 'Tái sinh mạnh mẽ', 'Lột xác', 'Thay đổi tất yếu', 'Buông bỏ dứt khoát'],
    keywords_rev: ['Níu kéo quá khứ', 'Sợ thay đổi', 'Vấn vương chuyện cũ', 'Trì hoãn kết thúc', 'Bế tắc'],
  },
  {
    id: 14,
    roman: 'XIV',
    name_en: 'Temperance',
    name_vi: 'Tiết Độ',
    arcana: 'major',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/RWS_Tarot_14_Temperance.jpg',
    symbol_glyph: '♐',
    palette: { primary: '#2DD4BF', secondary: '#CCFBF1', glow: 'rgba(45, 212, 191, 0.38)' },
    keywords_up: ['Dung hòa', 'Chữa lành từ tốn', 'Cân bằng', 'Điềm đạm', 'Kiên nhẫn pha trộn'],
    keywords_rev: ['Cực đoan', 'Nóng vội đốt giai đoạn', 'Mất cân bằng sống', 'Xung đột', 'Quá tải'],
  },
  {
    id: 15,
    roman: 'XV',
    name_en: 'The Devil',
    name_vi: 'Ác Quỷ',
    arcana: 'major',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/5/55/RWS_Tarot_15_Devil.jpg',
    symbol_glyph: '♑',
    palette: { primary: '#EF4444', secondary: '#FEE2E2', glow: 'rgba(239, 68, 68, 0.4)' },
    keywords_up: ['Ám ảnh độc hại', 'Ràng buộc vô hình', 'Cám dỗ', 'Phụ thuộc cảm xúc', 'Thói quen xấu'],
    keywords_rev: ['Thức tỉnh tháo xích', 'Thoát khỏi thao túng', 'Lấy lại tự do', 'Cai nghiện cảm xúc', 'Vượt cám dỗ'],
  },
  {
    id: 16,
    roman: 'XVI',
    name_en: 'The Tower',
    name_vi: 'Tòa Tháp',
    arcana: 'major',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg',
    symbol_glyph: '⚡',
    palette: { primary: '#F97316', secondary: '#FFEDD5', glow: 'rgba(249, 115, 22, 0.42)' },
    keywords_up: ['Sự thật phơi bày', 'Sụp đổ ảo tưởng', 'Biến cố thức tỉnh', 'Giải phóng', 'Xây lại từ nền móng'],
    keywords_rev: ['Cố chống đỡ cái sai', 'Sợ đối diện sự thật', 'Chấn động âm ỉ', 'Giảm nhẹ va đập', 'Trì hoãn sụp đổ'],
  },
  {
    id: 17,
    roman: 'XVII',
    name_en: 'The Star',
    name_vi: 'Ngôi Sao Hy Vọng',
    arcana: 'major',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_17_Star.jpg',
    symbol_glyph: '✦',
    palette: { primary: '#67E8F9', secondary: '#ECFEFF', glow: 'rgba(103, 232, 249, 0.42)' },
    keywords_up: ['Hy vọng thuần khiết', 'Chữa lành tâm hồn', 'Niềm tin', 'Cảm hứng sáng tạo', 'Bình yên sau bão'],
    keywords_rev: ['Mất niềm tin', 'Bi quan', 'Cạn cảm hứng', 'Tự hoài nghi', 'Quên giá trị bản thân'],
  },
  {
    id: 18,
    roman: 'XVIII',
    name_en: 'The Moon',
    name_vi: 'Mặt Trăng',
    arcana: 'major',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/7/7f/RWS_Tarot_18_Moon.jpg',
    symbol_glyph: '☾',
    palette: { primary: '#818CF8', secondary: '#E0E7FF', glow: 'rgba(129, 140, 248, 0.4)' },
    keywords_up: ['Mập mờ ẩn khuất', 'Lo âu đêm muộn', 'Tự suy diễn', 'Ảo ảnh dưới ánh trăng', 'Nhạy cảm'],
    keywords_rev: ['Sương mù tan dần', 'Nhìn rõ sự thật', 'Giải tỏa hiểu lầm', 'Thoát khỏi nỗi sợ', 'Tỉnh táo'],
  },
  {
    id: 19,
    roman: 'XIX',
    name_en: 'The Sun',
    name_vi: 'Mặt Trời',
    arcana: 'major',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg',
    symbol_glyph: '☉',
    palette: { primary: '#FBBF24', secondary: '#FEF08A', glow: 'rgba(250, 204, 21, 0.48)' },
    keywords_up: ['Niềm vui rực rỡ', 'Thành công sáng rõ', 'Chân thành ấm áp', 'Năng lượng tích cực', 'Minh bạch'],
    keywords_rev: ['Niềm vui đến muộn', 'Áp lực phải tích cực', 'Che giấu nỗi buồn', 'Cái tôi quá lớn', 'Kỳ vọng quá cao'],
  },
  {
    id: 20,
    roman: 'XX',
    name_en: 'Judgement',
    name_vi: 'Phán Quyết & Thức Tỉnh',
    arcana: 'major',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/RWS_Tarot_20_Judgement.jpg',
    symbol_glyph: '📯',
    palette: { primary: '#FB7185', secondary: '#FFE4E6', glow: 'rgba(251, 113, 133, 0.38)' },
    keywords_up: ['Tiếng gọi thức tỉnh', 'Quyết định bước ngoặt', 'Tha thứ cho mình', 'Làm lại từ đầu', 'Sáng suốt'],
    keywords_rev: ['Khắt khe tự trách', 'Do dự trước cơ hội', 'Bám víu lỗi lầm cũ', 'Sợ phán xét', 'Chưa sẵn sàng'],
  },
  {
    id: 21,
    roman: 'XXI',
    name_en: 'The World',
    name_vi: 'Thế Giới Viên Mãn',
    arcana: 'major',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/RWS_Tarot_21_World.jpg',
    symbol_glyph: '⊕',
    palette: { primary: '#10B981', secondary: '#D1FAE5', glow: 'rgba(16, 185, 129, 0.42)' },
    keywords_up: ['Trọn vẹn viên mãn', 'Hoàn thành chu kỳ', 'Thành tựu xứng đáng', 'Hòa hợp', 'Mở ra chân trời mới'],
    keywords_rev: ['Thiếu mảnh ghép cuối', 'Chưa khép lại trọn vẹn', 'Đốt cháy giai đoạn', 'Còn vướng bận', 'Chậm đích'],
  },
];

export const MINOR_ARCANA: TarotCard[] = [
  // ================= SUIT OF WANDS (IDs 22 - 35) =================
  {
    id: 22,
    roman: 'Wands I',
    name_en: 'Ace of Wands',
    name_vi: 'Khởi Nguyên Gậy',
    arcana: 'minor',
    suit: 'wands',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Wands01.jpg',
    symbol_glyph: '🔥',
    palette: { primary: '#F97316', secondary: '#FFEDD5', glow: 'rgba(249, 115, 22, 0.38)' },
    keywords_up: ['Ngọn lửa đam mê', 'Cảm hứng bùng nổ', 'Cơ hội mới', 'Nhiệt huyết', 'Khởi phát hành động'],
    keywords_rev: ['Trì hoãn khởi đầu', 'Tụt mood', 'Thiếu định hướng', 'Đam mê chóng tàn', 'Do dự'],
  },
  {
    id: 23,
    roman: 'Wands II',
    name_en: 'Two of Wands',
    name_vi: 'Hai Gậy',
    arcana: 'minor',
    suit: 'wands',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Wands02.jpg',
    symbol_glyph: '🔥',
    palette: { primary: '#EA580C', secondary: '#FFEDD5', glow: 'rgba(234, 88, 12, 0.36)' },
    keywords_up: ['Tầm nhìn xa', 'Lập kế hoạch lớn', 'Bước ra vùng an toàn', 'Quyết định hướng đi', 'Khát vọng'],
    keywords_rev: ['Sợ bước ra ngoài', 'Kế hoạch thiếu thực tế', 'An phận', 'Ngập ngừng ở ngưỡng cửa', 'Thiếu tầm nhìn'],
  },
  {
    id: 24,
    roman: 'Wands III',
    name_en: 'Three of Wands',
    name_vi: 'Ba Gậy',
    arcana: 'minor',
    suit: 'wands',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Wands03.jpg',
    symbol_glyph: '🔥',
    palette: { primary: '#F59E0B', secondary: '#FEF3C7', glow: 'rgba(245, 158, 11, 0.38)' },
    keywords_up: ['Mở rộng chân trời', 'Đón chờ thành quả', 'Tiến triển thuận lợi', 'Hợp tác xa', 'Triển vọng sáng'],
    keywords_rev: ['Chậm trễ ngoài ý muốn', 'Kỳ vọng chưa tới', 'Trở ngại đường xa', 'Ngại mở lòng', 'Nóng ruột'],
  },
  {
    id: 25,
    roman: 'Wands IV',
    name_en: 'Four of Wands',
    name_vi: 'Bốn Gậy',
    arcana: 'minor',
    suit: 'wands',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Wands04.jpg',
    symbol_glyph: '🔥',
    palette: { primary: '#FBBF24', secondary: '#FEF3C7', glow: 'rgba(251, 191, 36, 0.42)' },
    keywords_up: ['Ăn mừng cột mốc', 'Sum vầy ấm áp', 'Bến đỗ bình yên', 'Cam kết vui vẻ', 'Hòa hợp'],
    keywords_rev: ['Niềm vui thiếu trọn vẹn', 'Bất ổn nội bộ', 'Trì hoãn lễ kỷ niệm', 'Lệch nhịp gia đình', 'Chưa an cư'],
  },
  {
    id: 26,
    roman: 'Wands V',
    name_en: 'Five of Wands',
    name_vi: 'Năm Gậy',
    arcana: 'minor',
    suit: 'wands',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Wands05.jpg',
    symbol_glyph: '🔥',
    palette: { primary: '#EF4444', secondary: '#FEE2E2', glow: 'rgba(239, 68, 68, 0.36)' },
    keywords_up: ['Cạnh tranh sôi nổi', 'Bất đồng quan điểm', 'Tranh luận cái tôi', 'Hỗn loạn nhẹ', 'Thử lửa'],
    keywords_rev: ['Né tránh xung đột', 'Hạ nhiệt căng thẳng', 'Mệt mỏi vì cãi vã', 'Thỏa hiệp', 'Tìm tiếng nói chung'],
  },
  {
    id: 27,
    roman: 'Wands VI',
    name_en: 'Six of Wands',
    name_vi: 'Sáu Gậy',
    arcana: 'minor',
    suit: 'wands',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Wands06.jpg',
    symbol_glyph: '🔥',
    palette: { primary: '#F59E0B', secondary: '#FEF08A', glow: 'rgba(245, 158, 11, 0.42)' },
    keywords_up: ['Vinh quang xứng đáng', 'Được công nhận', 'Tự tin tỏa sáng', 'Chiến thắng', 'Truyền cảm hứng'],
    keywords_rev: ['Kiêu ngạo ngủ quên', 'Sợ ánh nhìn đám đông', 'Thành quả chậm ghi nhận', 'Hào quang ảo', 'Tự ti'],
  },
  {
    id: 28,
    roman: 'Wands VII',
    name_en: 'Seven of Wands',
    name_vi: 'Bảy Gậy',
    arcana: 'minor',
    suit: 'wands',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Wands07.jpg',
    symbol_glyph: '🔥',
    palette: { primary: '#EA580C', secondary: '#FED7AA', glow: 'rgba(234, 88, 12, 0.38)' },
    keywords_up: ['Giữ vững lập trường', 'Bảo vệ ranh giới', 'Kiên cường trước áp lực', 'Lợi thế điểm cao', 'Bản lĩnh'],
    keywords_rev: ['Kiệt sức phòng thủ', 'Lung lay lập trường', 'Quá tải áp lực', 'Cảm giác bị tấn công', 'Buông xuôi'],
  },
  {
    id: 29,
    roman: 'Wands VIII',
    name_en: 'Eight of Wands',
    name_vi: 'Tám Gậy',
    arcana: 'minor',
    suit: 'wands',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Wands08.jpg',
    symbol_glyph: '🔥',
    palette: { primary: '#FB923C', secondary: '#FFEDD5', glow: 'rgba(251, 146, 60, 0.4)' },
    keywords_up: ['Tin nhắn đến nhanh', 'Tăng tốc đột biến', 'Tiến triển thần tốc', 'Cảm xúc sét đánh', 'Thông suốt'],
    keywords_rev: ['Tin nhắn chậm trễ', 'Hiểu lầm vì vội vã', 'Rối loạn lịch trình', 'Hấp tấp hỏng việc', 'Chững nhịp'],
  },
  {
    id: 30,
    roman: 'Wands IX',
    name_en: 'Nine of Wands',
    name_vi: 'Chín Gậy',
    arcana: 'minor',
    suit: 'wands',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Tarot_Nine_of_Wands.jpg',
    symbol_glyph: '🔥',
    palette: { primary: '#D97706', secondary: '#FEF3C7', glow: 'rgba(217, 119, 6, 0.36)' },
    keywords_up: ['Bền bỉ phút chót', 'Chiến binh từng trải', 'Cảnh giác bảo vệ mình', 'Sắp về đích', 'Không bỏ cuộc'],
    keywords_rev: ['Đa nghi quá mức', 'Kiệt quệ sức lực', 'Đóng chặt cửa lòng', 'Cố chấp chịu đựng', 'Ám ảnh vết thương cũ'],
  },
  {
    id: 31,
    roman: 'Wands X',
    name_en: 'Ten of Wands',
    name_vi: 'Mười Gậy',
    arcana: 'minor',
    suit: 'wands',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Wands10.jpg',
    symbol_glyph: '🔥',
    palette: { primary: '#B45309', secondary: '#FDE68A', glow: 'rgba(180, 83, 9, 0.38)' },
    keywords_up: ['Ôm đồm quá tải', 'Gánh nặng trách nhiệm', 'Nỗ lực quá sức', 'Cần san sẻ', 'Áp lực đè vai'],
    keywords_rev: ['Hạ bớt gánh nặng', 'Ủy quyền chia sẻ', 'Buông việc không cần thiết', 'Quá tải sụp đổ', 'Giải thoát'],
  },
  {
    id: 32,
    roman: 'Wands Page',
    name_en: 'Page of Wands',
    name_vi: 'Tiểu Đồng Gậy',
    arcana: 'minor',
    suit: 'wands',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Wands11.jpg',
    symbol_glyph: '🔥',
    palette: { primary: '#F97316', secondary: '#FFEDD5', glow: 'rgba(249, 115, 22, 0.36)' },
    keywords_up: ['Tin vui bất ngờ', 'Tò mò khám phá', 'Nhiệt huyết trẻ trung', 'Ý tưởng mới mẻ', 'Hào hứng'],
    keywords_rev: ['Cả thèm chóng chán', 'Tin đồn thất thiệt', 'Thiếu kiên nhẫn', 'Chưa chín chắn', 'Bốc đồng'],
  },
  {
    id: 33,
    roman: 'Wands Knight',
    name_en: 'Knight of Wands',
    name_vi: 'Hiệp Sĩ Gậy',
    arcana: 'minor',
    suit: 'wands',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/1/16/Wands12.jpg',
    symbol_glyph: '🔥',
    palette: { primary: '#EA580C', secondary: '#FED7AA', glow: 'rgba(234, 88, 12, 0.42)' },
    keywords_up: ['Hành động táo bạo', 'Cuồng nhiệt cuốn hút', 'Phiêu lưu mạo hiểm', 'Dám nghĩ dám làm', 'Tốc độ cao'],
    keywords_rev: ['Nóng vội bốc đồng', 'Đến nhanh đi nhanh', 'Thiếu cam kết lâu dài', 'Nóng nảy', 'Hứa suông'],
  },
  {
    id: 34,
    roman: 'Wands Queen',
    name_en: 'Queen of Wands',
    name_vi: 'Nữ Hoàng Gậy',
    arcana: 'minor',
    suit: 'wands',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Wands13.jpg',
    symbol_glyph: '🔥',
    palette: { primary: '#F59E0B', secondary: '#FEF08A', glow: 'rgba(245, 158, 11, 0.44)' },
    keywords_up: ['Thần thái cuốn hút', 'Tự tin độc lập', 'Ấm áp truyền lửa', 'Chủ động tỏa sáng', 'Quyết đoán'],
    keywords_rev: ['Ghen tuông bất an', 'Nóng tính áp đặt', 'Đánh mất tự tin', 'Muốn chiếm spotlight', 'Cạnh tranh ngầm'],
  },
  {
    id: 35,
    roman: 'Wands King',
    name_en: 'King of Wands',
    name_vi: 'Vua Gậy',
    arcana: 'minor',
    suit: 'wands',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Wands14.jpg',
    symbol_glyph: '🔥',
    palette: { primary: '#D97706', secondary: '#FDE68A', glow: 'rgba(217, 119, 6, 0.44)' },
    keywords_up: ['Thủ lĩnh tầm nhìn', 'Bản lĩnh dẫn dắt', 'Truyền cảm hứng lớn', 'Hành động đĩnh đạc', 'Uy tín'],
    keywords_rev: ['Độc đoán nóng nảy', 'Hứa quá khả năng', 'Áp đặt ý chí', 'Cái tôi quá cao', 'Thiếu kiên nhẫn'],
  },

  // ================= SUIT OF CUPS (IDs 36 - 49) =================
  {
    id: 36,
    roman: 'Cups I',
    name_en: 'Ace of Cups',
    name_vi: 'Khởi Nguyên Cốc',
    arcana: 'minor',
    suit: 'cups',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Cups01.jpg',
    symbol_glyph: '💧',
    palette: { primary: '#38BDF8', secondary: '#E0F2FE', glow: 'rgba(56, 189, 248, 0.4)' },
    keywords_up: ['Tình cảm đong đầy', 'Rung động mới', 'Trực giác mở lối', 'Chữa lành trái tim', 'Hạnh phúc tràn đầy'],
    keywords_rev: ['Khép kín trái tim', 'Cảm xúc dồn nén', 'Tình cảm một chiều', 'Trống rỗng', 'Sợ tổn thương'],
  },
  {
    id: 37,
    roman: 'Cups II',
    name_en: 'Two of Cups',
    name_vi: 'Hai Cốc',
    arcana: 'minor',
    suit: 'cups',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Cups02.jpg',
    symbol_glyph: '💧',
    palette: { primary: '#F472B6', secondary: '#FCE7F3', glow: 'rgba(244, 114, 182, 0.42)' },
    keywords_up: ['Tình cảm hai chiều', 'Tâm đầu ý hợp', 'Tri kỷ kết nối', 'Tôn trọng lẫn nhau', 'Hẹn ước ngọt ngào'],
    keywords_rev: ['Lệch nhịp giao tiếp', 'Hiểu lầm tình cảm', 'Mất cân bằng cho nhận', 'Xa cách tạm thời', 'Chưa thấu hiểu'],
  },
  {
    id: 38,
    roman: 'Cups III',
    name_en: 'Three of Cups',
    name_vi: 'Ba Cốc',
    arcana: 'minor',
    suit: 'cups',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Cups03.jpg',
    symbol_glyph: '💧',
    palette: { primary: '#FB7185', secondary: '#FFE4E6', glow: 'rgba(251, 113, 133, 0.38)' },
    keywords_up: ['Hội bạn thân thiết', 'Tiệc tùng sẻ chia', 'Niềm vui cộng đồng', 'Gặp gỡ rộn ràng', 'Nâng ly ăn mừng'],
    keywords_rev: ['Chuyện ba người phức tạp', 'Tiệc vui quá đà', 'Lời ra tiếng vào', 'Cảm giác lạc lõng', 'Ghen tị hội nhóm'],
  },
  {
    id: 39,
    roman: 'Cups IV',
    name_en: 'Four of Cups',
    name_vi: 'Bốn Cốc',
    arcana: 'minor',
    suit: 'cups',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/3/35/Cups04.jpg',
    symbol_glyph: '💧',
    palette: { primary: '#60A5FA', secondary: '#DBEAFE', glow: 'rgba(96, 165, 250, 0.35)' },
    keywords_up: ['Chán chường thờ ơ', 'Khép lòng từ chối', 'Mải nhìn cái cũ', 'Bỏ lỡ cơ hội trước mắt', 'Trầm tư'],
    keywords_rev: ['Mở lòng trở lại', 'Thoát cơn uể oải', 'Đón nhận cơ hội mới', 'Thức tỉnh cảm xúc', 'Bước ra ngoài'],
  },
  {
    id: 40,
    roman: 'Cups V',
    name_en: 'Five of Cups',
    name_vi: 'Năm Cốc',
    arcana: 'minor',
    suit: 'cups',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Cups05.jpg',
    symbol_glyph: '💧',
    palette: { primary: '#64748B', secondary: '#E2E8F0', glow: 'rgba(100, 116, 139, 0.36)' },
    keywords_up: ['Tiếc nuối chuyện đã qua', 'Nhìn vào mất mát', 'Buồn bã thất vọng', 'Quên hai cốc còn nguyên', 'Tự trách'],
    keywords_rev: ['Chấp nhận và bước tiếp', 'Nhìn thấy điều còn lại', 'Tha thứ buông bỏ', 'Vượt qua nỗi buồn', 'Hy vọng'],
  },
  {
    id: 41,
    roman: 'Cups VI',
    name_en: 'Six of Cups',
    name_vi: 'Sáu Cốc',
    arcana: 'minor',
    suit: 'cups',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/1/17/Cups06.jpg',
    symbol_glyph: '💧',
    palette: { primary: '#FBBF24', secondary: '#FEF3C7', glow: 'rgba(251, 191, 36, 0.38)' },
    keywords_up: ['Kỷ niệm êm đềm', 'Người cũ/bạn cũ', 'Sự quan tâm thuần khiết', 'Hoài niệm tuổi thơ', 'Chữa lành đứa trẻ bên trong'],
    keywords_rev: ['Mắc kẹt trong quá khứ', 'Ảo tưởng chuyện cũ', 'Chưa chịu trưởng thành', 'So sánh hiện tại với xưa kia', 'Níu kéo'],
  },
  {
    id: 42,
    roman: 'Cups VII',
    name_en: 'Seven of Cups',
    name_vi: 'Bảy Cốc',
    arcana: 'minor',
    suit: 'cups',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Cups07.jpg',
    symbol_glyph: '💧',
    palette: { primary: '#A78BFA', secondary: '#EDE9FE', glow: 'rgba(167, 139, 250, 0.38)' },
    keywords_up: ['Nhiều lựa chọn', 'Mơ mộng ảo ảnh', 'Bối rối phân vân', 'Thả thính mập mờ', 'Cám dỗ lấp lánh'],
    keywords_rev: ['Nhìn rõ thực tế', 'Chốt một lựa chọn', 'Tan biến ảo tưởng', 'Tập trung mục tiêu', 'Tỉnh táo'],
  },
  {
    id: 43,
    roman: 'Cups VIII',
    name_en: 'Eight of Cups',
    name_vi: 'Tám Cốc',
    arcana: 'minor',
    suit: 'cups',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/6/60/Cups08.jpg',
    symbol_glyph: '💧',
    palette: { primary: '#6366F1', secondary: '#E0E7FF', glow: 'rgba(99, 102, 241, 0.36)' },
    keywords_up: ['Chủ động rời đi', 'Tìm kiếm ý nghĩa sâu hơn', 'Buông bỏ nơi cạn tình', 'Hành trình tâm thức', 'Dứt khoát'],
    keywords_rev: ['Đi không đành ở không xong', 'Sợ bước vào vùng chưa biết', 'Quay lại chốn cũ', 'Do dự níu kéo', 'Chấp nhận tạm bợ'],
  },
  {
    id: 44,
    roman: 'Cups IX',
    name_en: 'Nine of Cups',
    name_vi: 'Chín Cốc',
    arcana: 'minor',
    suit: 'cups',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Cups09.jpg',
    symbol_glyph: '💧',
    palette: { primary: '#38BDF8', secondary: '#E0F2FE', glow: 'rgba(56, 189, 248, 0.44)' },
    keywords_up: ['Ước nguyện thành thật', 'Mãn nguyện tự thân', 'Tận hưởng cuộc sống', 'Hài lòng viên mãn', 'Đủ đầy'],
    keywords_rev: ['Thỏa mãn bề nổi', 'Đòi hỏi quá mức', 'Thiếu chiều sâu kết nối', 'Tự mãn', 'Chưa trọn vẹn'],
  },
  {
    id: 45,
    roman: 'Cups X',
    name_en: 'Ten of Cups',
    name_vi: 'Mười Cốc',
    arcana: 'minor',
    suit: 'cups',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/8/84/Cups10.jpg',
    symbol_glyph: '💧',
    palette: { primary: '#EC4899', secondary: '#FCE7F3', glow: 'rgba(236, 72, 153, 0.44)' },
    keywords_up: ['Hạnh phúc viên mãn', 'Cầu vồng bình yên', 'Gia đình hòa thuận', 'Bến đỗ trọn đời', 'Tình yêu bền vững'],
    keywords_rev: ['Kỳ vọng hoàn hảo quá mức', 'Lệch nhịp gia đình', 'Bằng mặt không bằng lòng', 'Trì hoãn cam kết', 'Thiếu sẻ chia'],
  },
  {
    id: 46,
    roman: 'Cups Page',
    name_en: 'Page of Cups',
    name_vi: 'Tiểu Đồng Cốc',
    arcana: 'minor',
    suit: 'cups',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Cups11.jpg',
    symbol_glyph: '💧',
    palette: { primary: '#38BDF8', secondary: '#E0F2FE', glow: 'rgba(56, 189, 248, 0.36)' },
    keywords_up: ['Lời nhắn ngọt ngào', 'Trực giác nghệ sĩ', 'Tình cảm chớm nở', 'Dịu dàng ngây thơ', 'Bất ngờ dễ thương'],
    keywords_rev: ['Nhạy cảm dễ tủi thân', 'Mơ mộng thiếu thực tế', 'Ngại thổ lộ', 'Trốn vào thế giới riêng', 'Dỗi hờn'],
  },
  {
    id: 47,
    roman: 'Cups Knight',
    name_en: 'Knight of Cups',
    name_vi: 'Hiệp Sĩ Cốc',
    arcana: 'minor',
    suit: 'cups',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Cups12.jpg',
    symbol_glyph: '💧',
    palette: { primary: '#60A5FA', secondary: '#DBEAFE', glow: 'rgba(96, 165, 250, 0.4)' },
    keywords_up: ['Lãng mạn ga lăng', 'Lời tỏ tình chân thành', 'Theo đuổi ước mơ', 'Tinh tế ngọt ngào', 'Hào hoa'],
    keywords_rev: ['Đào hoa hứa suông', 'Yêu bằng lời nói', 'Thất thường cảm xúc', 'Vỡ mộng hoàng tử', 'Thiếu thực tế'],
  },
  {
    id: 48,
    roman: 'Cups Queen',
    name_en: 'Queen of Cups',
    name_vi: 'Nữ Hoàng Cốc',
    arcana: 'minor',
    suit: 'cups',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/6/62/Cups13.jpg',
    symbol_glyph: '💧',
    palette: { primary: '#2DD4BF', secondary: '#CCFBF1', glow: 'rgba(45, 212, 191, 0.42)' },
    keywords_up: ['Thấu cảm sâu sắc', 'Trực giác nhạy bén', 'Dịu dàng chữa lành', 'Lắng nghe chân thành', 'Giàu tình thương'],
    keywords_rev: ['Quá tải cảm xúc', 'Lụy tình mất ranh giới', 'Hấp thụ năng lượng tiêu cực', 'Dễ tổn thương', 'Bi kịch hóa'],
  },
  {
    id: 49,
    roman: 'Cups King',
    name_en: 'King of Cups',
    name_vi: 'Vua Cốc',
    arcana: 'minor',
    suit: 'cups',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Cups14.jpg',
    symbol_glyph: '💧',
    palette: { primary: '#0284C7', secondary: '#E0F2FE', glow: 'rgba(2, 132, 199, 0.42)' },
    keywords_up: ['Trưởng thành cảm xúc', 'Điềm tĩnh giữa sóng gió', 'Bao dung ấm áp', 'Chỗ dựa tinh thần', 'Cân bằng tim và não'],
    keywords_rev: ['Kìm nén cảm xúc', 'Thao túng tâm lý ngầm', 'Lạnh nhạt khó đoán', 'Bất ổn bên trong', 'Đóng kịch bình tĩnh'],
  },

  // ================= SUIT OF SWORDS (IDs 50 - 63) =================
  {
    id: 50,
    roman: 'Swords I',
    name_en: 'Ace of Swords',
    name_vi: 'Khởi Nguyên Kiếm',
    arcana: 'minor',
    suit: 'swords',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Swords01.jpg',
    symbol_glyph: '⚔',
    palette: { primary: '#94A3B8', secondary: '#F1F5F9', glow: 'rgba(148, 163, 184, 0.42)' },
    keywords_up: ['Sự thật sắc bén', 'Tư duy sáng suốt', 'Quyết định dứt khoát', 'Chặt đứt mập mờ', 'Đột phá nhận thức'],
    keywords_rev: ['Rối loạn suy nghĩ', 'Lời nói sát thương', 'Thiếu minh bạch', 'Do dự thiếu quyết đoán', 'Hiểu lầm'],
  },
  {
    id: 51,
    roman: 'Swords II',
    name_en: 'Two of Swords',
    name_vi: 'Hai Kiếm',
    arcana: 'minor',
    suit: 'swords',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Swords02.jpg',
    symbol_glyph: '⚔',
    palette: { primary: '#64748B', secondary: '#E2E8F0', glow: 'rgba(100, 116, 139, 0.36)' },
    keywords_up: ['Tiến thoái lưỡng nan', 'Tự bịt mắt né tránh', 'Giằng co lý trí - con tim', 'Trì hoãn quyết định', 'Phòng thủ'],
    keywords_rev: ['Tháo băng bịt mắt', 'Đối diện sự thật', 'Quá tải thông tin', 'Buộc phải chọn', 'Hết đường né'],
  },
  {
    id: 52,
    roman: 'Swords III',
    name_en: 'Three of Swords',
    name_vi: 'Ba Kiếm',
    arcana: 'minor',
    suit: 'swords',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/0/02/Swords03.jpg',
    symbol_glyph: '⚔',
    palette: { primary: '#EF4444', secondary: '#FEE2E2', glow: 'rgba(239, 68, 68, 0.38)' },
    keywords_up: ['Tổn thương sắc nhọn', 'Sự thật mất lòng', 'Giải phóng nước mắt', 'Đau một lần rồi thôi', 'Buông bỏ'],
    keywords_rev: ['Khép lại vết thương', 'Tha thứ để nhẹ lòng', 'Rút kiếm khỏi tim', 'Cơn mưa tạnh dần', 'Hồi phục'],
  },
  {
    id: 53,
    roman: 'Swords IV',
    name_en: 'Four of Swords',
    name_vi: 'Bốn Kiếm',
    arcana: 'minor',
    suit: 'swords',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Swords04.jpg',
    symbol_glyph: '⚔',
    palette: { primary: '#38BDF8', secondary: '#E0F2FE', glow: 'rgba(56, 189, 248, 0.35)' },
    keywords_up: ['Nghỉ ngơi nạp pin', 'Tạm ngắt kết nối', 'Thiền định tĩnh tâm', 'Phục hồi năng lượng', 'Khoảng lặng cần thiết'],
    keywords_rev: ['Kiệt sức cháy sạch (Burnout)', 'Trằn trọc không chịu nghỉ', 'Quay lại cuộc sống', 'Quá tải thần kinh', 'Bồn chồn'],
  },
  {
    id: 54,
    roman: 'Swords V',
    name_en: 'Five of Swords',
    name_vi: 'Năm Kiếm',
    arcana: 'minor',
    suit: 'swords',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Swords05.jpg',
    symbol_glyph: '⚔',
    palette: { primary: '#64748B', secondary: '#E2E8F0', glow: 'rgba(100, 116, 139, 0.38)' },
    keywords_up: ['Thắng cuộc mất tình', 'Hiếu thắng hơn thua', 'Tranh cãi gay gắt', 'Tổn hại cả hai bên', 'Cái tôi độc hại'],
    keywords_rev: ['Chấm dứt chiến tranh lạnh', 'Làm hòa buông kiếm', 'Mệt mỏi vì hơn thua', 'Nhận ra bài học', 'Rút lui khôn ngoan'],
  },
  {
    id: 55,
    roman: 'Swords VI',
    name_en: 'Six of Swords',
    name_vi: 'Sáu Kiếm',
    arcana: 'minor',
    suit: 'swords',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Swords06.jpg',
    symbol_glyph: '⚔',
    palette: { primary: '#38BDF8', secondary: '#E0F2FE', glow: 'rgba(56, 189, 248, 0.38)' },
    keywords_up: ['Rời vùng sóng gió', 'Sang bờ bình yên', 'Chuyển giao nhẹ nhàng', 'Vượt qua khủng hoảng', 'Hồi phục dần'],
    keywords_rev: ['Hành lý quá khứ nặng nề', 'Chưa dứt được sóng gió', 'Sợ thay đổi môi trường', 'Quay đầu nhìn lại', 'Trì trệ'],
  },
  {
    id: 56,
    roman: 'Swords VII',
    name_en: 'Seven of Swords',
    name_vi: 'Bảy Kiếm',
    arcana: 'minor',
    suit: 'swords',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Swords07.jpg',
    symbol_glyph: '⚔',
    palette: { primary: '#F59E0B', secondary: '#FEF3C7', glow: 'rgba(245, 158, 11, 0.36)' },
    keywords_up: ['Giấu giếm bí mật', 'Chiến thuật khôn khéo', 'Né tránh đối diện', 'Không nói hết sự thật', 'Tự xoay xở'],
    keywords_rev: ['Sự thật lộ diện', 'Hết đường quanh co', 'Thành thật thú nhận', 'Tự lừa dối mình', 'Trả lại công bằng'],
  },
  {
    id: 57,
    roman: 'Swords VIII',
    name_en: 'Eight of Swords',
    name_vi: 'Tám Kiếm',
    arcana: 'minor',
    suit: 'swords',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Swords08.jpg',
    symbol_glyph: '⚔',
    palette: { primary: '#94A3B8', secondary: '#F1F5F9', glow: 'rgba(148, 163, 184, 0.36)' },
    keywords_up: ['Tự trói mình trong suy nghĩ', 'Cảm giác bế tắc', 'Sợ hãi vô hình', 'Tư duy nạn nhân', 'Overthinking'],
    keywords_rev: ['Tự cởi trói tâm trí', 'Tìm thấy lối ra', 'Lấy lại quyền làm chủ', 'Vượt qua nỗi sợ', 'Tỉnh thức'],
  },
  {
    id: 58,
    roman: 'Swords IX',
    name_en: 'Nine of Swords',
    name_vi: 'Chín Kiếm',
    arcana: 'minor',
    suit: 'swords',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Swords09.jpg',
    symbol_glyph: '⚔',
    palette: { primary: '#818CF8', secondary: '#E0E7FF', glow: 'rgba(129, 140, 248, 0.38)' },
    keywords_up: ['Trằn trọc lúc 2 giờ sáng', 'Overthinking đỉnh điểm', 'Ác mộng lo âu', 'Tự dằn vặt', 'Phóng đại nỗi sợ'],
    keywords_rev: ['Bình minh xua tan lo âu', 'Thoát khỏi overthinking', 'Chia sẻ nỗi lòng', 'Nhẹ nhõm', 'Bình tâm'],
  },
  {
    id: 59,
    roman: 'Swords X',
    name_en: 'Ten of Swords',
    name_vi: 'Mười Kiếm',
    arcana: 'minor',
    suit: 'swords',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Swords10.jpg',
    symbol_glyph: '⚔',
    palette: { primary: '#F43F5E', secondary: '#FFE4E6', glow: 'rgba(244, 63, 94, 0.38)' },
    keywords_up: ['Chạm đáy để bật lên', 'Khép lại hoàn toàn', 'Bình minh phía chân trời', 'Hết đường níu kéo', 'Giải thoát'],
    keywords_rev: ['Hồi sinh sau biến cố', 'Rút từng mũi kiếm', 'Từ chối đóng vai nạn nhân', 'Bắt đầu trang mới', 'Vượt qua'],
  },
  {
    id: 60,
    roman: 'Swords Page',
    name_en: 'Page of Swords',
    name_vi: 'Tiểu Đồng Kiếm',
    arcana: 'minor',
    suit: 'swords',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Swords11.jpg',
    symbol_glyph: '⚔',
    palette: { primary: '#38BDF8', secondary: '#E0F2FE', glow: 'rgba(56, 189, 248, 0.36)' },
    keywords_up: ['Tò mò sắc sảo', 'Quan sát từ xa', 'Tìm hiểu thông tin', 'Nhanh nhạy hoạt ngôn', 'Cảnh giác'],
    keywords_rev: ['Soi mói trang cá nhân', 'Tin đồn thất thiệt', 'Khẩu nghiệp', 'Đa nghi suy diễn', 'Nói trước nghĩ sau'],
  },
  {
    id: 61,
    roman: 'Swords Knight',
    name_en: 'Knight of Swords',
    name_vi: 'Hiệp Sĩ Kiếm',
    arcana: 'minor',
    suit: 'swords',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Swords12.jpg',
    symbol_glyph: '⚔',
    palette: { primary: '#60A5FA', secondary: '#DBEAFE', glow: 'rgba(96, 165, 250, 0.42)' },
    keywords_up: ['Quyết liệt thần tốc', 'Thẳng thắn trực diện', 'Tư duy nhạy bén', 'Đánh nhanh thắng nhanh', 'Không ngại va chạm'],
    keywords_rev: ['Hấp tấp nóng vội', 'Lời nói sát thương', 'Bất chấp cảm xúc', 'Mất kiểm soát tốc độ', 'Cãi lý cùn'],
  },
  {
    id: 62,
    roman: 'Swords Queen',
    name_en: 'Queen of Swords',
    name_vi: 'Nữ Hoàng Kiếm',
    arcana: 'minor',
    suit: 'swords',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Swords13.jpg',
    symbol_glyph: '⚔',
    palette: { primary: '#94A3B8', secondary: '#F8FAFC', glow: 'rgba(148, 163, 184, 0.44)' },
    keywords_up: ['Tỉnh táo sắc sảo', 'Độc lập tự chủ', 'Nhìn thấu bản chất', 'Ranh giới rõ ràng', 'Nói thẳng sự thật'],
    keywords_rev: ['Khắt khe lạnh lùng', 'Cay nghiệt vì tổn thương', 'Đóng băng trái tim', 'Phán xét quá đà', 'Cô lập'],
  },
  {
    id: 63,
    roman: 'Swords King',
    name_en: 'King of Swords',
    name_vi: 'Vua Kiếm',
    arcana: 'minor',
    suit: 'swords',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Swords14.jpg',
    symbol_glyph: '⚔',
    palette: { primary: '#475569', secondary: '#E2E8F0', glow: 'rgba(71, 85, 105, 0.44)' },
    keywords_up: ['Trí tuệ chiến lược', 'Khách quan công tâm', 'Phân tích chuẩn xác', 'Kỷ luật thép', 'Uy quyền lý trí'],
    keywords_rev: ['Lạnh lùng vô cảm', 'Độc tài áp đặt', 'Lạm dụng lý lẽ', 'Cứng nhắc cực đoan', 'Thiếu tình người'],
  },

  // ================= SUIT OF PENTACLES (IDs 64 - 77) =================
  {
    id: 64,
    roman: 'Pentacles I',
    name_en: 'Ace of Pentacles',
    name_vi: 'Khởi Nguyên Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Pents01.jpg',
    symbol_glyph: '🪙',
    palette: { primary: '#10B981', secondary: '#D1FAE5', glow: 'rgba(16, 185, 129, 0.42)' },
    keywords_up: ['Cơ hội tài chính mới', 'Hạt mầm thịnh vượng', 'Cam kết thực tế', 'Vận may tiền bạc', 'Nền tảng vững chắc'],
    keywords_rev: ['Bỏ lỡ cơ hội vàng', 'Chậm trễ tài chính', 'Tính toán ngắn hạn', 'Thiếu nền tảng', 'Chi tiêu bất cẩn'],
  },
  {
    id: 65,
    roman: 'Pentacles II',
    name_en: 'Two of Pentacles',
    name_vi: 'Hai Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Pents02.jpg',
    symbol_glyph: '🪙',
    palette: { primary: '#34D399', secondary: '#D1FAE5', glow: 'rgba(52, 211, 153, 0.38)' },
    keywords_up: ['Xoay xở linh hoạt', 'Cân bằng nhiều việc', 'Thích nghi nhịp nhàng', 'Quản lý thời gian', 'Vừa làm vừa điều chỉnh'],
    keywords_rev: ['Rối tung lịch trình', 'Mất cân bằng cuộc sống', 'Quá tải tài chính', 'Ôm đồm rơi rớt', 'Chóng mặt'],
  },
  {
    id: 66,
    roman: 'Pentacles III',
    name_en: 'Three of Pentacles',
    name_vi: 'Ba Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Pents03.jpg',
    symbol_glyph: '🪙',
    palette: { primary: '#10B981', secondary: '#D1FAE5', glow: 'rgba(16, 185, 129, 0.38)' },
    keywords_up: ['Phối hợp ăn ý', 'Cùng nhau vun đắp', 'Tay nghề chuyên môn', 'Học hỏi thực chiến', 'Teamwork đỉnh cao'],
    keywords_rev: ['Lệch pha làm việc nhóm', 'Làm việc một mình', 'Thiếu tôn trọng chuyên môn', 'Mỗi người một ý', 'Trì trệ'],
  },
  {
    id: 67,
    roman: 'Pentacles IV',
    name_en: 'Four of Pentacles',
    name_vi: 'Bốn Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/3/35/Pents04.jpg',
    symbol_glyph: '🪙',
    palette: { primary: '#D97706', secondary: '#FEF3C7', glow: 'rgba(217, 119, 6, 0.38)' },
    keywords_up: ['Giữ chặt an toàn', 'Tiết kiệm tích lũy', 'Sợ mất mát', 'Kiểm soát sở hữu', 'Phòng thủ'],
    keywords_rev: ['Buông bớt kiểm soát', 'Hào phóng chia sẻ', 'Chi tiêu xả láng', 'Mở lòng đón cái mới', 'Thoát tâm lý sợ thiếu'],
  },
  {
    id: 68,
    roman: 'Pentacles V',
    name_en: 'Five of Pentacles',
    name_vi: 'Năm Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Pents05.jpg',
    symbol_glyph: '🪙',
    palette: { primary: '#64748B', secondary: '#E2E8F0', glow: 'rgba(100, 116, 139, 0.38)' },
    keywords_up: ['Cảm giác bị bỏ rơi', 'Khó khăn tạm thời', 'Tâm lý thiếu thốn', 'Quên nhìn cửa sổ sáng đèn', 'Cô đơn trong tuyết'],
    keywords_rev: ['Bước vào nơi ấm áp', 'Vượt qua khó khăn', 'Đón nhận sự giúp đỡ', 'Tài chính hồi phục', 'Tìm lại hy vọng'],
  },
  {
    id: 69,
    roman: 'Pentacles VI',
    name_en: 'Six of Pentacles',
    name_vi: 'Sáu Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Pents06.jpg',
    symbol_glyph: '🪙',
    palette: { primary: '#10B981', secondary: '#D1FAE5', glow: 'rgba(16, 185, 129, 0.4)' },
    keywords_up: ['Cho nhận cân bằng', 'Quý nhân giúp đỡ', 'Hào phóng sẻ chia', 'Tương trợ công bằng', 'Ân huệ'],
    keywords_rev: ['Tình cảm một chiều', 'Ban ơn kẻ cả', 'Lợi dụng lòng tốt', 'Nợ nần cảm xúc', 'Mất cân đối'],
  },
  {
    id: 70,
    roman: 'Pentacles VII',
    name_en: 'Seven of Pentacles',
    name_vi: 'Bảy Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Pents07.jpg',
    symbol_glyph: '🪙',
    palette: { primary: '#84CC16', secondary: '#ECFCCB', glow: 'rgba(132, 204, 22, 0.38)' },
    keywords_up: ['Kiên nhẫn chờ quả ngọt', 'Đầu tư dài hạn', 'Đánh giá lại thành quả', 'Chăm chút bền bỉ', 'Trồng cây chờ ngày hái'],
    keywords_rev: ['Sốt ruột muốn ăn xổi', 'Đầu tư nhầm chỗ', 'Nản lòng giữa chừng', 'Công sức ít quả', 'Thiếu kiên nhẫn'],
  },
  {
    id: 71,
    roman: 'Pentacles VIII',
    name_en: 'Eight of Pentacles',
    name_vi: 'Tám Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/4/49/Pents08.jpg',
    symbol_glyph: '🪙',
    palette: { primary: '#EAB308', secondary: '#FEF08A', glow: 'rgba(234, 179, 8, 0.4)' },
    keywords_up: ['Chăm chỉ rèn giũa', 'Tập trung nâng trình', 'Tỉ mỉ tận tâm', 'Kỹ năng bậc thầy', 'Vun đắp từng ngày'],
    keywords_rev: ['Làm việc qua loa', 'Cầu toàn thái quá', 'Chán nản lặp đi lặp lại', 'Lười trau dồi', 'Mất động lực'],
  },
  {
    id: 72,
    roman: 'Pentacles IX',
    name_en: 'Nine of Pentacles',
    name_vi: 'Chín Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Pents09.jpg',
    symbol_glyph: '🪙',
    palette: { primary: '#F59E0B', secondary: '#FEF3C7', glow: 'rgba(245, 158, 11, 0.44)' },
    keywords_up: ['Độc lập tài chính', 'Sang chảnh tự chủ', 'Tận hưởng thành quả', 'Độc thân đắt giá', 'Giá trị bản thân cao'],
    keywords_rev: ['Phụ thuộc tài chính', 'Tiêu xài phung phí', 'Cô đơn trên đống vàng', 'Sống phông bạt', 'Tham công tiếc việc'],
  },
  {
    id: 73,
    roman: 'Pentacles X',
    name_en: 'Ten of Pentacles',
    name_vi: 'Mười Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Pents10.jpg',
    symbol_glyph: '🪙',
    palette: { primary: '#10B981', secondary: '#D1FAE5', glow: 'rgba(16, 185, 129, 0.46)' },
    keywords_up: ['Thịnh vượng bền vững', 'Di sản lâu dài', 'Gia đạo sung túc', 'Cam kết trăm năm', 'Thành tựu viên mãn'],
    keywords_rev: ['Tranh chấp tài sản/gia đình', 'Áp lực môn đăng hộ đối', 'Nền tảng lung lay', 'Lợi ích ngắn hạn', 'Rạn nứt'],
  },
  {
    id: 74,
    roman: 'Pentacles Page',
    name_en: 'Page of Pentacles',
    name_vi: 'Tiểu Đồng Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Pents11.jpg',
    symbol_glyph: '🪙',
    palette: { primary: '#34D399', secondary: '#D1FAE5', glow: 'rgba(52, 211, 153, 0.38)' },
    keywords_up: ['Ham học hỏi thực tế', 'Khởi đầu dự án mới', 'Chăm chỉ tích lũy', 'Cơ hội học bổng/việc làm', 'Nghiêm túc'],
    keywords_rev: ['Trì hoãn lười biếng', 'Thiếu tập trung', 'Kế hoạch trên giấy', 'Bỏ dở việc học', 'Mơ mộng viển vông'],
  },
  {
    id: 75,
    roman: 'Pentacles Knight',
    name_en: 'Knight of Pentacles',
    name_vi: 'Hiệp Sĩ Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Pents12.jpg',
    symbol_glyph: '🪙',
    palette: { primary: '#059669', secondary: '#D1FAE5', glow: 'rgba(5, 150, 105, 0.4)' },
    keywords_up: ['Chậm mà chắc', 'Đáng tin cậy 100%', 'Kiên trì bền bỉ', 'Chung thủy thực tế', 'Nói ít làm nhiều'],
    keywords_rev: ['Khô khan cứng nhắc', 'Bảo thủ trì trệ', 'Quá chậm chạp', 'Nhàm chán lối mòn', 'Lười thay đổi'],
  },
  {
    id: 76,
    roman: 'Pentacles Queen',
    name_en: 'Queen of Pentacles',
    name_vi: 'Nữ Hoàng Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Pents13.jpg',
    symbol_glyph: '🪙',
    palette: { primary: '#10B981', secondary: '#D1FAE5', glow: 'rgba(16, 185, 129, 0.44)' },
    keywords_up: ['Đảm đang trù phú', 'Chăm sóc thực tế', 'Vững vàng tài chính', 'Ấm áp chu đáo', 'Vừa giỏi kiếm tiền vừa biết vun vén'],
    keywords_rev: ['Lo toan quá sức', 'Thực dụng quá mức', 'Bỏ bê bản thân vì công việc', 'Bất an tiền bạc', 'Kiểm soát'],
  },
  {
    id: 77,
    roman: 'Pentacles King',
    name_en: 'King of Pentacles',
    name_vi: 'Vua Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    rws_image_url: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Pents14.jpg',
    symbol_glyph: '🪙',
    palette: { primary: '#D97706', secondary: '#FEF08A', glow: 'rgba(217, 119, 6, 0.46)' },
    keywords_up: ['Thịnh vượng đỉnh cao', 'Chỗ dựa vững chãi', 'Thành đạt hào phóng', 'Bảo bọc bằng hành động', 'Quản trị tài ba'],
    keywords_rev: ['Thực dụng vật chất', 'Kiểm soát bằng tiền bạc', 'Tham lam cố chấp', 'Khoa trương', 'Bảo thủ'],
  },
];

export const ALL_TAROT_CARDS: TarotCard[] = [...MAJOR_ARCANA, ...MINOR_ARCANA];

export const TAROT_CARDS_BY_ID: Record<number, TarotCard> = Object.fromEntries(
  ALL_TAROT_CARDS.map((card) => [card.id, card])
);

export const ALL_READERS: ReaderPersona[] = [...CANONICAL_READERS, ...LEGACY_READERS];

export const READERS_BY_ID: Record<string, ReaderPersona> = Object.fromEntries(
  ALL_READERS.map((reader) => [reader.id, reader])
);

export interface ResolvedReader extends ReaderPersona {
  isStudentVariant: boolean;
  age: number;
  effectiveVoice: string;
}

/**
 * resolveReader(readerId, birthYear)
 * Single source of truth for reader resolution per TarotCouple_Plan_GoLive.pdf Section 4.4.
 * Automatically resolves student variant for <16yo users, neutralizes sarcasm and filters adult topics.
 */
export function resolveReader(
  readerId: string | undefined | null,
  birthYear: number
): ResolvedReader {
  const currentYear = 2026;
  const age = Math.max(0, currentYear - (birthYear || 2004));
  const isStudentVariant = age < 16;

  const id = readerId || 'ba_ngoai';
  let baseReader = READERS_BY_ID[id];
  if (!baseReader) {
    if (id === 'ba_co_mo_hon') baseReader = READERS_BY_ID['chi_dai'] || READERS_BY_ID['ba_co_mo_hon'];
    else if (id === 'tien_tu_chua_lanh') baseReader = READERS_BY_ID['ba_ngoai'] || READERS_BY_ID['tien_tu_chua_lanh'];
    else if (id === 'tong_tai_ly_tri') baseReader = READERS_BY_ID['thay_cu_meo'] || READERS_BY_ID['tong_tai_ly_tri'];
    else if (id === 'phap_su_toi_co') baseReader = READERS_BY_ID['ban_than'] || READERS_BY_ID['phap_su_toi_co'];
    else baseReader = READERS[0];
  }

  if (isStudentVariant) {
    return {
      ...baseReader,
      name: baseReader.teen_safe_name || baseReader.name,
      tagline: baseReader.teen_tagline || baseReader.tagline,
      isStudentVariant: true,
      age,
      effectiveVoice:
        'Bản học sinh: Giọng ấm áp, thân thiện, không mỉa mai, không chủ đề tình cảm nặng, không nhắc rượu/chất kích thích.',
    };
  }

  return {
    ...baseReader,
    isStudentVariant: false,
    age,
    effectiveVoice: baseReader.persona_prompt,
  };
}

/**
 * Generate SEO-friendly URL slug for a Tarot card (e.g., "the-fool", "two-of-cups")
 */
export function getCardSlug(card: TarotCard): string {
  return card.name_en
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const TAROT_CARDS_BY_SLUG: Record<string, TarotCard> = Object.fromEntries(
  ALL_TAROT_CARDS.map((card) => [getCardSlug(card), card])
);

/**
 * Lookup a Tarot card by its SEO slug or numeric ID string
 */
export function getCardBySlug(slugOrId: string): TarotCard | undefined {
  if (!slugOrId) return undefined;
  const normalized = slugOrId.trim().toLowerCase();
  if (TAROT_CARDS_BY_SLUG[normalized]) {
    return TAROT_CARDS_BY_SLUG[normalized];
  }
  const asNum = Number.parseInt(normalized, 10);
  if (!Number.isNaN(asNum) && TAROT_CARDS_BY_ID[asNum]) {
    return TAROT_CARDS_BY_ID[asNum];
  }
  return undefined;
}

