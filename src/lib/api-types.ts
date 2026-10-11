import type { TarotCard } from '@/data/tarot-cards';
import type { CrisisSupportData } from '@/lib/safety';
import type {
  AgeTier,
  EffectivePersona,
  ReaderId,
  ReadingOutput,
  SafetyFlag,
  TopicId,
} from '@/lib/schemas';

export type DeckMode = 'major_22' | 'full_78';

export type CoupleRelationshipStatus =
  | 'crush'          // Crush đơn phương
  | 'situationship'  // Đang mập mờ
  | 'dating'         // Đang hẹn hò / yêu nhau
  | 'ex';            // Người yêu cũ

export interface DrawnCardClientPayload {
  position_index: 0 | 1 | 2;
  position_label: string;
  fan_index: number;
  reversed: boolean;
  card: TarotCard;
}

export interface ClarifierCardPayload {
  card: TarotCard;
  reversed: boolean;
  questionAsked: string;
  interpretation: string;
  advice: string;
  savageQuote: string;
  starsSpent: number;
}

export interface QuotaStatusPayload {
  usedToday: number;
  dailyLimit: number;
  bonusDraws: number;
  remainingToday: number;
  starsBalance?: number;
  streakDays?: number;
  dailyPullCompletedToday?: boolean;
  dailySpendVnd?: number;
  dailySpendCapVnd?: number;
  canUseFullDeck?: boolean;
  isFirstTurnFullDeckFree?: boolean;
  fullDeckUnlockCostStars?: number;
  fullDeckUnlockedDraws?: number;
  freeFollowupsRemaining?: number;
  followupStarCost?: number;
}

export interface FollowupMessagePayload {
  id: string;
  readingId: string;
  role: 'user' | 'assistant';
  content: string;
  costType: 'free' | 'star';
  starsDeducted: number;
  createdAt: string;
}

export interface ReadingSuccessResponse {
  status: 'ok';
  readingId: string;
  createdAt: string;
  nickname: string;
  birthYear: number;
  age: number;
  ageTier: AgeTier;
  isKidTeenSafeMode: boolean;
  paymentEnabled: boolean;
  readerId: ReaderId;
  effectivePersona: EffectivePersona;
  readerDisplayName: string;
  readerBadge: string;
  topic: TopicId;
  topicLabel: string;
  questionText: string;
  deckMode?: DeckMode;
  safetyFlag: SafetyFlag;
  isPromptInjection: boolean;
  drawnCards: [
    DrawnCardClientPayload,
    DrawnCardClientPayload,
    DrawnCardClientPayload,
  ];
  result: ReadingOutput;
  clarifier?: ClarifierCardPayload;
  aiMeta: {
    model: string;
    tokensIn: number;
    tokensOut: number;
    usedFallback: boolean;
    retryCount: number;
  };
  quota: QuotaStatusPayload;
}

export interface ReadingCrisisResponse {
  status: 'crisis';
  readingId: string;
  createdAt: string;
  safetyFlag: 'crisis';
  matchedReason?: string;
  crisisSupport: CrisisSupportData;
}

export interface ReadingErrorResponse {
  status: 'error';
  code:
    | 'VALIDATION_ERROR'
    | 'QUOTA_EXCEEDED'
    | 'BUDGET_CAP_REACHED'
    | 'INSUFFICIENT_STARS'
    | 'AGE_PAYMENT_BLOCKED'
    | 'DAILY_SPEND_CAP_EXCEEDED'
    | 'ROOM_NOT_FOUND'
    | 'ROOM_EXPIRED'
    | 'INTERNAL_ERROR'
    | 'FORBIDDEN_DECK_MODE';
  message: string;
  quota?: QuotaStatusPayload;
}

export type ReadingApiResponse =
  | ReadingSuccessResponse
  | ReadingCrisisResponse
  | ReadingErrorResponse;

/**
 * Phase 2/3: Couple Room (Kiểu 1: Tự soi & Kiểu 2: Mời người kia cùng rút 48h)
 * Per PLAN.md Section 3.4:
 * - Kiểu 2: Person B only sees invite & their own card draw, NEVER sees Person A's private question.
 * - Result is unlocked when both sides complete their draw & consent to view together.
 */
export interface CoupleRoomPublicView {
  roomCode: string;
  mode: 'solo_couple' | 'coop_invite';
  status: 'waiting_partner' | 'completed' | 'expired';
  createdAt: string;
  expiresAt: string;
  readerId: ReaderId;
  readerDisplayName: string;
  relationshipStatus: CoupleRelationshipStatus;
  relationshipLabel: string;
  ownerNickname: string;
  ownerCard: {
    card: TarotCard;
    reversed: boolean;
  };
  ownerConsentedShare: boolean;
  partnerNickname?: string;
  partnerCard?: {
    card: TarotCard;
    reversed: boolean;
  };
  partnerConsentedShare: boolean;
  /**
   * Notice: owner's private question is NEVER exposed in CoupleRoomPublicView!
   */
  readingResult?: ReadingOutput;
  readingId?: string;
}

/**
 * Phase 2/3: Daily 1-Card Pull & Streak
 */
export interface DailyPullPayload {
  date: string;
  card: TarotCard;
  reversed: boolean;
  readerId: ReaderId;
  headline: string;
  message: string;
  savageQuote: string;
  luckyNumber: number;
  luckyColor: string;
  luckyItem: string;
  streakDays: number;
  starsRewarded: number;
  totalStarsBalance: number;
}

/**
 * Phase 2/3: PayOS VietQR Packages per PLAN.md Section 7.1
 */
export interface StarPackage {
  id: 'clarifier_5k' | 'dem_suy_19k' | 'check_var_29k' | 'vip_month_69k';
  name: string;
  priceVnd: number;
  stars: number;
  badge?: string;
  description: string;
  perks: string[];
}

export interface PaymentOrderPayload {
  orderCode: string;
  packageId: StarPackage['id'];
  packageName: string;
  amountVnd: number;
  starsToCredit: number;
  status: 'pending' | 'paid' | 'cancelled';
  qrDataText: string;
  vietQrImageUrl: string;
  checkoutUrl: string;
  provider: 'payos' | 'payos_sandbox';
  createdAt: string;
}

/**
 * Phase 4: "Hồ Sơ Tâm Linh Cuối Tháng" (Spiritual Wrapped)
 */
export interface SpiritualWrappedPayload {
  monthLabel: string; // e.g. "Tháng 10 / 2026"
  nickname: string;
  totalReadingsCount: number;
  lateNightReadingsCount: number;
  peakHourLabel: string; // e.g. "23:45 — Giờ Suy Thượng Thừa"
  dominantTopic: string; // e.g. "Tình duyên & Mập mờ (68%)"
  favoriteReaderName: string;
  favoriteReaderId: ReaderId;
  signatureCard: {
    card: TarotCard;
    reversed: boolean;
    appearances: number;
    meaningSummary: string;
  };
  spiritualArchetypeTitle: string; // e.g. "Chiến Thần Vượt Bão The Tower"
  spiritualAuraColor: string;
  auraMetrics: {
    selfLoveScore: number;       // Độ yêu bản thân (%)
    delusionDropPercent: number; // Độ lụy tình đã giảm (%)
    redFlagRadarScore: number;   // Radar bắt thóp Red Flag (%)
    manifestationPower: number;  // Tần số Manifest (%)
  };
  monthlySavageQuote: string;
  nextMonthProphecy: string;
  wrappedCardImageUrl: string;
}

/**
 * Phase 4: TikTok / Reels 3-Slide Viral Seeding Kit
 */
export interface TikTokCarouselSlide {
  slideNumber: 1 | 2 | 3;
  roleLabel: string;
  headline: string;
  bodyText: string;
  visualPromptNote: string;
  storyCardPreviewUrl?: string;
}

export interface TikTokCarouselKit {
  id: string;
  themeTitle: string;
  readerId: ReaderId;
  readerName: string;
  hookTitle: string;
  slides: [TikTokCarouselSlide, TikTokCarouselSlide, TikTokCarouselSlide];
  captionSeo: string;
  hashtags: string[];
  capcutVoiceoverScript: string;
  recommendedSoundVibe: string;
}

/**
 * Phase 4: Referral Viral Loop & Rewarded Ad Monetization
 */
export interface ReferralStatusPayload {
  referralCode: string;
  referralUrl: string;
  invitedFriendsCount: number;
  totalBonusStarsEarned: number;
  totalBonusDrawsEarned: number;
  rewardedAdsWatchedToday: number;
  rewardedAdsDailyLimit: number;
}

/**
 * Phase 4 Stage Gate: Unit Economics (Cost per Paying User vs ARPU)
 * Per PLAN.md Section 2 & Section 9:
 * "Chi phí cho mỗi người dùng trả phí thấp hơn doanh thu trung bình mỗi người"
 */
export interface UnitEconomicsSummary {
  totalUsersTracked: number;
  payingUsersCount: number;
  totalPaymentRevenueVnd: number;
  totalAdRevenueVnd: number;
  totalGrossRevenueVnd: number;
  totalAiCostVnd: number;
  totalInfraEstimateVnd: number;
  totalOperatingCostVnd: number;
  arpuVnd: number;                 // Average Revenue Per User (all users)
  arppuVnd: number;                // Average Revenue Per Paying User
  costPerPayingUserVnd: number;    // Total AI + Infra Cost / Paying Users
  grossMarginPercent: number;
  isStageGate4Passed: boolean;     // true when arppuVnd > costPerPayingUserVnd
}

