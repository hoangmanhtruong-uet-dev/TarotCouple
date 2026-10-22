import { z } from 'zod';

/**
 * Current reference year for age policy enforcement (10+ threshold in 2026).
 */
export const CURRENT_REFERENCE_YEAR = 2026;
export const MIN_BIRTH_YEAR = 1940;
export const MAX_BIRTH_YEAR = 2016; // 2026 - 2016 = 10 years old minimum

/**
 * Reader IDs available across Phase 1 & Phase 2/3 (all 4 readers)
 */
export const ReaderIdSchema = z.enum([
  'ba_ngoai',
  'chi_dai',
  'ban_than',
  'thay_cu_meo',
  'ba_co_mo_hon',
  'tien_tu_chua_lanh',
  'tong_tai_ly_tri',
  'phap_su_toi_co',
]);
export type ReaderId = z.infer<typeof ReaderIdSchema>;

/**
 * Effective AI Persona after Age-Tier Guardrail resolution
 * - 10-15yo selecting 'ba_co_mo_hon' automatically resolves to 'ba_ngoai_vui_tinh'
 */
export const EffectivePersonaSchema = z.enum([
  'ba_ngoai',
  'chi_dai',
  'ban_than',
  'thay_cu_meo',
  'ba_ngoai_vui_tinh',
  'ba_co_mo_hon',
  'tien_tu_chua_lanh',
  'tong_tai_ly_tri',
  'phap_su_toi_co',
]);
export type EffectivePersona = z.infer<typeof EffectivePersonaSchema>;

/**
 * Deck Mode (22 Major Arcana vs Full 78 RWS Deck)
 */
export const DeckModeSchema = z.enum(['major_22', 'full_78']);
export type DeckMode = z.infer<typeof DeckModeSchema>;

/**
 * Couple Relationship Status (Phase 2/3 Bói Đôi)
 */
export const CoupleRelationshipStatusSchema = z.enum([
  'crush',          // Crush đơn phương
  'situationship',  // Đang mập mờ
  'dating',         // Đang hẹn hò / yêu nhau
  'ex',             // Người yêu cũ
]);
export type CoupleRelationshipStatus = z.infer<typeof CoupleRelationshipStatusSchema>;

/**
 * Supported Reading Topics (includes both standard 16+ topics and 10-15 Kid/Teen Safe topics)
 */
export const TopicIdSchema = z.enum([
  'love',          // Tình duyên (16+)
  'career',        // Học tập / Công việc (16+)
  'finance',       // Tài chính / Vận may (16+)
  'crush_school',  // Tình bạn & Crush học đường (10-15)
  'study',         // Học tập / Thi cử (10-15)
  'daily_luck',    // Vận may ngày mới (10-15)
]);
export type TopicId = z.infer<typeof TopicIdSchema>;

/**
 * Safety Flag classification
 * - 'none': Safe normal reading
 * - 'sensitive': Emotional distress / heavy topic requiring gentle framing & disclaimer
 * - 'crisis': Self-harm / suicide / severe crisis -> immediate intervention screen, bypass Tarot reading
 */
export const SafetyFlagSchema = z.enum(['none', 'sensitive', 'crisis']);
export type SafetyFlag = z.infer<typeof SafetyFlagSchema>;

/**
 * Age Tier classification per PLAN.md Section 8.3
 */
export const AgeTierSchema = z.enum([
  'under_10',
  'kid_teen_10_15',
  'teen_16_17',
  'adult_18_plus',
]);
export type AgeTier = z.infer<typeof AgeTierSchema>;

/**
 * Helper to count words in Vietnamese/English text
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Client -> Server Reading Request Schema
 * Supports both `major_22` (indices 0..21) and `full_78` (indices 0..77)
 */
export const ReadingRequestSchema = z
  .object({
    nickname: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập biệt danh của bạn.')
      .max(40, 'Biệt danh tối đa 40 ký tự.'),
    birth_year: z
      .number({
        required_error: 'Vui lòng chọn năm sinh.',
        invalid_type_error: 'Năm sinh phải là số nguyên.',
      })
      .int('Năm sinh phải là số nguyên.')
      .min(MIN_BIRTH_YEAR, `Năm sinh phải từ ${MIN_BIRTH_YEAR} trở lên.`)
      .max(
        MAX_BIRTH_YEAR,
        `TarotCouple dành cho người dùng từ 10 tuổi trở lên (sinh năm ${MAX_BIRTH_YEAR} trở về trước).`
      ),
    reader_id: ReaderIdSchema,
    topic: TopicIdSchema,
    question_text: z
      .string()
      .trim()
      .min(1, 'Vui lòng chia sẻ câu chuyện hoặc câu hỏi của bạn.')
      .max(300, 'Câu hỏi tối đa 300 ký tự để giữ năng lượng tập trung.'),
    deck_mode: DeckModeSchema.optional().default('major_22'),
    selected_indices: z
      .tuple([
        z.number().int().min(0).max(77),
        z.number().int().min(0).max(77),
        z.number().int().min(0).max(77),
      ])
      .refine(
        ([a, b, c]) => a !== b && b !== c && a !== c,
        'Ba vị trí lá bài được chọn phải khác nhau.'
      ),
  })
  .refine(
    (data) =>
      (data.deck_mode ?? 'major_22') === 'full_78' ||
      data.selected_indices.every((idx: number) => idx <= 21),
    {
      message: 'Vị trí lá bài trong chế độ 22 lá Major Arcana phải từ 0 đến 21.',
      path: ['selected_indices'],
    }
  );
export type ReadingRequest = z.infer<typeof ReadingRequestSchema>;

/**
 * Phase 2/3: Couple Reading Request Schema (Kiểu 1: Tự soi & Kiểu 2: Mời cùng rút)
 */
export const CoupleReadingRequestSchema = z.object({
  action: z.enum(['solo_couple', 'create_room', 'join_room', 'consent_share']).optional(),
  mode: z
    .enum(['solo_couple', 'coop_create', 'coop_join', 'coop_invite', 'create_room', 'join_room', 'consent_share'])
    .optional()
    .default('solo_couple'),
  nickname: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập biệt danh của bạn.')
    .max(40, 'Biệt danh tối đa 40 ký tự.')
    .optional(),
  partner_nickname: z.string().trim().max(40).optional().default('Người ấy'),
  partnerNickname: z.string().trim().max(40).optional(),
  birth_year: z
    .number()
    .int()
    .min(MIN_BIRTH_YEAR)
    .max(MAX_BIRTH_YEAR)
    .optional()
    .default(2002),
  birthYear: z.number().int().min(MIN_BIRTH_YEAR).max(MAX_BIRTH_YEAR).optional(),
  reader_id: ReaderIdSchema.optional().default('ba_co_mo_hon'),
  readerId: ReaderIdSchema.optional(),
  relationship_status: CoupleRelationshipStatusSchema.optional().default('situationship'),
  relationshipStatus: CoupleRelationshipStatusSchema.optional(),
  question_text: z
    .string()
    .trim()
    .max(300)
    .optional()
    .default('Tụi mình có thật sự hợp tần số hay chỉ là trạm dừng chân?'),
  questionText: z.string().trim().max(300).optional(),
  deck_mode: DeckModeSchema.optional().default('major_22'),
  deckMode: DeckModeSchema.optional(),
  selected_indices: z
    .array(z.number().int().min(0).max(77))
    .min(1)
    .max(3)
    .optional(),
  selectedIndices: z.array(z.number().int().min(0).max(77)).min(1).max(3).optional(),
  selected_index: z.number().int().min(0).max(77).optional(),
  selectedIndex: z.number().int().min(0).max(77).optional(),
  room_code: z.string().trim().max(32).optional(),
  roomCode: z.string().trim().max(32).optional(),
  consent_share: z.boolean().optional().default(true),
  consentShare: z.boolean().optional(),
  ownerConsentedShare: z.boolean().optional(),
  partnerConsentedShare: z.boolean().optional(),
  role: z.string().trim().optional(),
});
export type CoupleReadingRequest = z.infer<typeof CoupleReadingRequestSchema>;

/**
 * Phase 2/3: Clarifier Card Request Schema (Lá làm rõ - 5 Sao / 5.000đ)
 */
export const ClarifierRequestSchema = z
  .object({
    reading_id: z.string().trim().min(1).max(120).optional(),
    readingId: z.string().trim().min(1).max(120).optional(),
    nickname: z.string().trim().max(40).optional().default('Bạn'),
    birth_year: z
      .number()
      .int()
      .min(MIN_BIRTH_YEAR)
      .max(MAX_BIRTH_YEAR)
      .optional()
      .default(2002),
    birthYear: z.number().int().min(MIN_BIRTH_YEAR).max(MAX_BIRTH_YEAR).optional(),
    reader_id: ReaderIdSchema.optional().default('ba_co_mo_hon'),
    readerId: ReaderIdSchema.optional(),
    topic: TopicIdSchema.optional().default('love'),
    original_question: z.string().trim().max(300).optional().default(''),
    originalQuestion: z.string().trim().max(300).optional(),
    followup_question: z
      .string()
      .trim()
      .min(2, 'Vui lòng chọn hoặc nhập câu hỏi làm rõ (tối thiểu 2 ký tự).')
      .max(200, 'Câu hỏi làm rõ tối đa 200 ký tự.')
      .optional(),
    followupQuestion: z
      .string()
      .trim()
      .min(2, 'Vui lòng chọn hoặc nhập câu hỏi làm rõ (tối thiểu 2 ký tự).')
      .max(200, 'Câu hỏi làm rõ tối đa 200 ký tự.')
      .optional(),
    previous_card_ids: z
      .array(z.number().int().min(0).max(77))
      .max(6)
      .optional()
      .default([]),
    previousCardIds: z.array(z.number().int().min(0).max(77)).max(6).optional(),
    deck_mode: DeckModeSchema.optional().default('full_78'),
    deckMode: DeckModeSchema.optional(),
  })
  .refine(
    (data) => Boolean((data.followup_question && data.followup_question.length >= 2) || (data.followupQuestion && data.followupQuestion.length >= 2)),
    {
      message: 'Vui lòng chọn hoặc nhập câu hỏi làm rõ (tối thiểu 2 ký tự).',
      path: ['followup_question'],
    }
  );
export type ClarifierRequest = z.infer<typeof ClarifierRequestSchema>;

/**
 * Individual Card Analysis in AI Output
 */
export const CardAnalysisSchema = z.object({
  position_index: z.number().int().min(0).max(2),
  position_label: z.string().min(1).max(80),
  card_id: z.number().int().min(0).max(77),
  card_name_vi: z.string().min(1),
  card_name_en: z.string().min(1),
  reversed: z.boolean(),
  interpretation: z.string().min(10).max(900),
  energy_keyword: z.string().min(1).max(80),
});
export type CardAnalysis = z.infer<typeof CardAnalysisSchema>;

/**
 * Single Savage/Story Quote validation (concise punchline, max 22 words)
 */
export const StoryQuoteStringSchema = z
  .string()
  .trim()
  .min(3, 'Quote không được để trống.')
  .max(220, 'Quote tối đa 220 ký tự.')
  .refine(
    (quote) => countWords(quote) <= 22,
    'Mỗi câu quote trên ảnh Story tối đa 22 từ để hiển thị đẹp nhất.'
  );

/**
 * 9:16 Story Card Payload Schema
 * Includes `savage_quotes` (3 distinct options for 0đ switching) and `savage_quote` (primary default = savage_quotes[0]).
 */
export const ShareableCardSchema = z.object({
  headline_badge: z.string().trim().min(2).max(60),
  savage_quote: StoryQuoteStringSchema,
  savage_quotes: z.tuple([
    StoryQuoteStringSchema,
    StoryQuoteStringSchema,
    StoryQuoteStringSchema,
  ]),
  sub_advice: z.string().trim().min(5).max(220),
  lucky_item: z.string().trim().min(2).max(80),
});
export type ShareableCard = z.infer<typeof ShareableCardSchema>;

/**
 * Optional Entertainment Metrics (used in Couple mode or fun vibe tags)
 */
export const ReadingMetricsSchema = z.object({
  compatibility_score: z.number().int().min(0).max(100).optional(),
  red_flag_level: z.number().int().min(0).max(100).optional(),
  vibe_tag: z.string().max(60).optional(),
  entertainment_note: z
    .string()
    .default('Chỉ để giải trí'),
});
export type ReadingMetrics = z.infer<typeof ReadingMetricsSchema>;

/**
 * Phase 2/3 Responsible Cliffhanger Upsell Schema per PLAN.md Section 7.3
 * - Never uses fear-mongering or threatening language
 * - Omitted when `safety_flag === 'crisis'`
 */
export const CliffhangerUpsellSchema = z.object({
  tease_text: z.string().min(10).max(320),
  suggested_followup_questions: z.tuple([
    z.string().min(5).max(160),
    z.string().min(5).max(160),
  ]),
  clarifier_cost_stars: z.number().int().default(5),
});
export type CliffhangerUpsell = z.infer<typeof CliffhangerUpsellSchema>;

/**
 * Complete Validated Tarot Reading Output Schema
 */
export const ReadingOutputSchema = z.object({
  greeting_hook: z.string().trim().min(10).max(500),
  cards_analysis: z.tuple([
    CardAnalysisSchema,
    CardAnalysisSchema,
    CardAnalysisSchema,
  ]),
  overall_verdict: z.string().trim().min(20).max(1000),
  actionable_next_step: z.string().trim().min(10).max(400),
  shareable_card: ShareableCardSchema,
  safety_flag: SafetyFlagSchema,
  disclaimer: z
    .string()
    .default(
      'Tarot là hình thức giải trí và tự phản chiếu, không thay thế tư vấn chuyên môn.'
    ),
  metrics: ReadingMetricsSchema.optional(),
  cliffhanger_upsell: CliffhangerUpsellSchema.optional(),
}).refine(
  (data) => {
    const kws = data.cards_analysis.map((c) => c.energy_keyword.trim().toLowerCase());
    return new Set(kws).size === kws.length;
  },
  {
    message: 'Mỗi lá bài trong 3 lá bắt buộc phải có nhãn năng lượng (energy_keyword) riêng biệt, không được trùng lặp nhau.',
    path: ['cards_analysis'],
  }
);
export type ReadingOutput = z.infer<typeof ReadingOutputSchema>;

/**
 * Shared Card Metadata interface so `prompts.ts` and `ai-provider.ts` do not depend on `src/data/tarot-cards.ts` directly.
 */
export interface TarotCardMetadata {
  id: number;
  name_en: string;
  name_vi: string;
  arcana?: 'major' | 'minor';
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles' | null;
  keywords_up: string[];
  keywords_rev: string[];
  image_url?: string;
  rws_image_url?: string;
  // Optional persona-specific hooks if provided by card catalog
  savage_hook_up?: string;
  savage_hook_rev?: string;
  healing_hook_up?: string;
  healing_hook_rev?: string;
  grandma_hook_up?: string;
  grandma_hook_rev?: string;
  teen_hook_up?: string;
  teen_hook_rev?: string;
  ceo_hook_up?: string;
  ceo_hook_rev?: string;
  mystic_hook_up?: string;
  mystic_hook_rev?: string;
}

/**
 * A drawn card mapped to a specific spread position with orientation
 */
export interface DrawnCardWithMeta extends TarotCardMetadata {
  position_index: 0 | 1 | 2;
  position_label: string;
  reversed: boolean;
}
