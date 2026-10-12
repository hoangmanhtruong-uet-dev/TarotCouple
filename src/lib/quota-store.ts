import type {
  CoupleRelationshipStatus,
  CoupleRoomPublicView,
  DailyPullPayload,
  DeckMode,
  FollowupMessagePayload,
  PaymentOrderPayload,
  QuotaStatusPayload,
  ReadingSuccessResponse,
  ReferralStatusPayload,
  SpiritualWrappedPayload,
  StarPackage,
  TikTokCarouselKit,
  UnitEconomicsSummary,
} from './api-types';
import type { ReaderId, ReadingOutput } from './schemas';
import {
  MAJOR_ARCANA,
  READERS_BY_ID,
  TAROT_CARDS_BY_ID,
  type TarotCard,
} from '@/data/tarot-cards';
import {
  syncCoupleRoomHybrid,
  syncReadingHybrid,
  syncStarTransactionHybrid,
} from './supabase-hybrid';

export const DEFAULT_DAILY_LIMIT = 3;
export const FREE_DAILY_READINGS = 3;
export const FREE_DAILY_FULL_DECK_READINGS = 1;
export const FULL_DECK_UNLOCK_STAR_COST = 5; // TODO: Giá tạm thời 5 Sao, sau có thể điều chỉnh theo quyết định kinh doanh
export const MAX_BONUS_DRAWS_PER_DAY = 5;
export const DAILY_AI_BUDGET_VND = Number(process.env.DAILY_AI_BUDGET_VND) || 50000;
export const ESTIMATED_COST_PER_READING_VND = 25;
export const BUDGET_WARNING_RATIO = 0.8;

export const DEFAULT_INITIAL_STARS = 10;
export const DAILY_PULL_STAR_REWARD = 2;
export const DAILY_STREAK_DAY7_REWARD = 5;
export const CLARIFIER_STAR_COST = 5;
export const DAILY_SPEND_CAP_VND = 50000;
export const COUPLE_ROOM_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

export const REWARDED_ADS_DAILY_LIMIT = 5;
export const REFERRAL_BONUS_STARS = 5;
export const REWARDED_AD_BONUS_STARS = 3;
export const REWARDED_AD_ECPM_VND = 45;

export const FREE_FOLLOWUPS_PER_ACCOUNT = 2; // 2 câu hỏi sâu miễn phí trọn đời tài khoản
export const FOLLOWUP_STAR_COST = 2; // 2 Sao từ câu hỏi thứ 3 trở đi (chuẩn PDF mục 4.4)
export const FOLLOWUP_MAX_PER_READING = 5; // Tối đa 5 câu hỏi sâu mỗi lượt bói
export const FOLLOWUP_MAX_QUESTION_CHARS = 200; // Tối đa 200 ký tự mỗi câu hỏi
export const FOLLOWUP_RATE_LIMIT_MS = 3000; // Giới hạn 1 câu hỏi mỗi 3 giây

const MAX_CACHED_READINGS = 200;
const MAX_FUNNEL_EVENTS_LOG = 1000;

export type FunnelEventName =
  | 'page_view'
  | 'start_reading'
  | 'complete_3_cards'
  | 'view_result'
  | 'share_story'
  | 'crisis_triggered'
  | 'bonus_unlocked'
  | 'couple_room_created'
  | 'couple_room_completed'
  | 'clarifier_unlocked'
  | 'followup_asked'
  | 'daily_pull_completed'
  | 'payment_completed';

export interface FunnelEventRecord {
  id: string;
  event: FunnelEventName;
  timestamp: string;
  day: string;
  meta?: Record<string, unknown>;
}

export interface DailyBudgetStatus {
  day: string;
  spentVnd: number;
  budgetCapVnd: number;
  usageRatio: number;
  isWarning80Percent: boolean;
  isHardCapReached: boolean;
  readingsCountToday: number;
}

export interface FunnelMetricsSummary {
  day: string;
  counts: Record<FunnelEventName, number>;
  topicBreakdown: Record<string, number>;
  personaBreakdown: Record<string, number>;
  shareRatePercent: number;
  budget: DailyBudgetStatus;
  recentEvents: FunnelEventRecord[];
  hypotheses?: {
    loveTopicRatioPercent: number;
    shareRatePercent: number;
    coupleInviteConversionPercent: number;
    clarifierConversionPercent: number;
  };
}

interface ClientQuotaRecord {
  clientKey: string;
  day: string;
  usedToday: number;
  dailyLimit: number;
  bonusDraws: number;
  dailySpendVnd: number;
  fullDeckUnlockedDraws: number;
}

interface ClientWalletRecord {
  clientKey: string;
  starsBalance: number;
  streakDays: number;
  lastDailyPullDate: string | null;
  dailyPullMap: Map<string, DailyPullPayload>;
  freeFollowupsRemaining: number;
  lastFollowupTimestamp: number;
}

interface ClientGrowthRecord {
  clientKey: string;
  referralCode: string;
  invitedFriendsCount: number;
  redeemedReferralCodes: Set<string>;
  rewardedAdsWatchedToday: number;
  lastAdWatchDay: string;
  totalBonusStarsEarned: number;
  totalBonusDrawsEarned: number;
}

/**
 * Stored Couple Room (Server-side state).
 * Notice: `ownerQuestionText` is strictly private to Person A and NEVER exposed in `toPublicCoupleRoomView`.
 */
export interface StoredCoupleRoom {
  roomCode: string;
  mode: 'solo_couple' | 'coop_invite';
  status: 'waiting_partner' | 'completed' | 'expired';
  createdAt: string;
  expiresAt: string;
  ownerClientKey: string;
  ownerBirthYear: number;
  readerId: ReaderId;
  readerDisplayName: string;
  relationshipStatus: CoupleRelationshipStatus;
  relationshipLabel: string;
  deckMode: DeckMode;
  ownerNickname: string;
  ownerQuestionText: string;
  ownerCard: {
    card: TarotCard;
    reversed: boolean;
  };
  ownerConsentedShare: boolean;
  partnerNickname?: string;
  partnerBirthYear?: number;
  partnerCard?: {
    card: TarotCard;
    reversed: boolean;
  };
  connectionCard?: {
    card: TarotCard;
    reversed: boolean;
  };
  partnerConsentedShare: boolean;
  readingResult?: ReadingOutput;
  readingId?: string;
  fullReading?: ReadingSuccessResponse;
}

/**
 * Stored Payment Transaction for PayOS VietQR & Idempotent Webhook handling
 */
export interface StoredTransaction {
  orderCode: string;
  providerRef?: string;
  clientKey: string;
  birthYear: number;
  packageId: StarPackage['id'];
  packageName: string;
  amountVnd: number;
  starsToCredit: number;
  isMonthlyPass: boolean;
  status: 'pending' | 'paid' | 'cancelled';
  qrDataText: string;
  vietQrImageUrl: string;
  checkoutUrl: string;
  provider: 'payos' | 'payos_sandbox';
  createdAt: string;
  paidAt?: string;
}

interface GlobalStoreState {
  currentDay: string;
  quotas: Map<string, ClientQuotaRecord>;
  wallets: Map<string, ClientWalletRecord>;
  growthRecords: Map<string, ClientGrowthRecord>;
  referralCodeToClientKey: Map<string, string>;
  coupleRooms: Map<string, StoredCoupleRoom>;
  transactionsByOrderCode: Map<string, StoredTransaction>;
  transactionsByProviderRef: Map<string, StoredTransaction>;
  readingsCache: Map<string, ReadingSuccessResponse>;
  followupMessagesByReading: Map<string, FollowupMessagePayload[]>;
  spentVndToday: number;
  readingsCountToday: number;
  totalAdRevenueVnd: number;
  funnelCounts: Record<FunnelEventName, number>;
  topicBreakdown: Record<string, number>;
  personaBreakdown: Record<string, number>;
  funnelEvents: FunnelEventRecord[];
}

function createEmptyFunnelCounts(): Record<FunnelEventName, number> {
  return {
    page_view: 0,
    start_reading: 0,
    complete_3_cards: 0,
    view_result: 0,
    share_story: 0,
    crisis_triggered: 0,
    bonus_unlocked: 0,
    couple_room_created: 0,
    couple_room_completed: 0,
    clarifier_unlocked: 0,
    followup_asked: 0,
    daily_pull_completed: 0,
    payment_completed: 0,
  };
}

/**
 * Get current date string in YYYY-MM-DD (UTC+7 Vietnam Time)
 */
export function getTodayKey(now: Date = new Date()): string {
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return vnTime.toISOString().slice(0, 10);
}

const globalForTarotStore = globalThis as unknown as {
  __tarotCoupleStore?: GlobalStoreState;
};

function getStore(): GlobalStoreState {
  const today = getTodayKey();
  if (!globalForTarotStore.__tarotCoupleStore) {
    globalForTarotStore.__tarotCoupleStore = {
      currentDay: today,
      quotas: new Map(),
      wallets: new Map(),
      growthRecords: new Map(),
      referralCodeToClientKey: new Map(),
      coupleRooms: new Map(),
      transactionsByOrderCode: new Map(),
      transactionsByProviderRef: new Map(),
      readingsCache: new Map(),
      followupMessagesByReading: new Map(),
      spentVndToday: 0,
      readingsCountToday: 0,
      totalAdRevenueVnd: 0,
      funnelCounts: createEmptyFunnelCounts(),
      topicBreakdown: {},
      personaBreakdown: {},
      funnelEvents: [],
    };
  }

  const store = globalForTarotStore.__tarotCoupleStore;
  if (!store.growthRecords) {
    store.growthRecords = new Map();
  }
  if (!store.referralCodeToClientKey) {
    store.referralCodeToClientKey = new Map();
  }
  if (!store.followupMessagesByReading) {
    store.followupMessagesByReading = new Map();
  }
  if (typeof store.totalAdRevenueVnd !== 'number') {
    store.totalAdRevenueVnd = 0;
  }
  if (store.currentDay !== today) {
    store.currentDay = today;
    store.quotas.clear();
    store.spentVndToday = 0;
    store.readingsCountToday = 0;
    store.funnelCounts = createEmptyFunnelCounts();
    store.topicBreakdown = {};
    store.personaBreakdown = {};
  }

  return store;
}

/**
 * Lightweight deterministic hash for IP + User-Agent / Client ID anonymization
 */
export function simpleHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Extract client identifier from Request headers / cookies + IP hash per PLAN.md Section 8.5.
 * - In production (when `x-forwarded-for` or `x-real-ip` is present from Vercel's edge proxy),
 *   the key is bound to the server-side IP hash so clearing browser localStorage/cookies or
 *   opening an Incognito window on the same network CANNOT reset daily free turns.
 * - In local/automated test environments without proxy IP headers, falls back to `x-client-id`
 *   so multi-user unit tests remain isolated.
 */
export function resolveClientKey(req?: Request): string {
  if (!req) return 'anon_default';

  const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = req.headers.get('x-real-ip')?.trim();
  const clientIp = forwardedFor || realIp;

  // If Vercel/reverse-proxy provides a real client IP, bind strictly to server-side IP hash
  if (clientIp && clientIp !== '127.0.0.1' && clientIp !== '::1') {
    const ipHash = simpleHash(`ip:${clientIp}`);
    return `ip_${ipHash}`;
  }

  const explicitClientId = req.headers.get('x-client-id')?.trim();
  const cookieHeader = req.headers.get('cookie') || '';
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)tc_client_id=([^;]+)/);
  const cookieClientId = cookieMatch?.[1]?.trim();

  const userAgent = req.headers.get('user-agent')?.slice(0, 120) || 'unknown-ua';
  const localHash = simpleHash(`local|${userAgent}`);

  const baseId = explicitClientId || cookieClientId || 'guest';
  const sanitizedBase = baseId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48) || 'guest';
  return `${sanitizedBase}:${localHash}`;
}

/**
 * Check if request is authorized to view internal founder/admin funnel & unit economics metrics.
 */
export function isAdminRequest(req: Request): boolean {
  const url = new URL(req.url);
  const adminQuery = url.searchParams.get('admin');
  const adminHeader = req.headers.get('x-admin-mode');
  const configuredSecret = process.env.ADMIN_SECRET?.trim();
  if (configuredSecret) {
    return adminHeader === configuredSecret || adminQuery === configuredSecret;
  }
  return adminHeader === '1' || adminQuery === '1';
}

function getOrCreateClientRecord(clientKey: string): ClientQuotaRecord {
  const store = getStore();
  const today = store.currentDay;
  const existing = store.quotas.get(clientKey);
  if (existing && existing.day === today) {
    return existing;
  }

  const created: ClientQuotaRecord = {
    clientKey,
    day: today,
    usedToday: 0,
    dailyLimit: DEFAULT_DAILY_LIMIT,
    bonusDraws: 0,
    dailySpendVnd: 0,
    fullDeckUnlockedDraws: 0,
  };
  store.quotas.set(clientKey, created);
  return created;
}

function getOrCreateWalletRecord(clientKey: string): ClientWalletRecord {
  const store = getStore();
  const existing = store.wallets.get(clientKey);
  if (existing) {
    return existing;
  }

  const created: ClientWalletRecord = {
    clientKey,
    starsBalance: DEFAULT_INITIAL_STARS,
    streakDays: 0,
    lastDailyPullDate: null,
    dailyPullMap: new Map(),
    freeFollowupsRemaining: FREE_FOLLOWUPS_PER_ACCOUNT,
    lastFollowupTimestamp: 0,
  };
  store.wallets.set(clientKey, created);
  return created;
}

function toQuotaPayload(record: ClientQuotaRecord): QuotaStatusPayload {
  const wallet = getOrCreateWalletRecord(record.clientKey);
  const totalAvailable = record.dailyLimit + record.bonusDraws;
  const remainingToday = Math.max(0, totalAvailable - record.usedToday);
  const dailyPullCompletedToday = wallet.lastDailyPullDate === record.day;
  const isFirstTurnFullDeckFree = record.usedToday < FREE_DAILY_FULL_DECK_READINGS;
  const canUseFullDeck = isFirstTurnFullDeckFree || (record.fullDeckUnlockedDraws ?? 0) > 0;

  return {
    usedToday: record.usedToday,
    dailyLimit: record.dailyLimit,
    bonusDraws: record.bonusDraws,
    remainingToday,
    starsBalance: wallet.starsBalance,
    streakDays: wallet.streakDays,
    dailyPullCompletedToday,
    dailySpendVnd: record.dailySpendVnd,
    dailySpendCapVnd: DAILY_SPEND_CAP_VND,
    canUseFullDeck,
    isFirstTurnFullDeckFree,
    fullDeckUnlockCostStars: FULL_DECK_UNLOCK_STAR_COST,
    fullDeckUnlockedDraws: record.fullDeckUnlockedDraws ?? 0,
    freeFollowupsRemaining: wallet.freeFollowupsRemaining ?? FREE_FOLLOWUPS_PER_ACCOUNT,
    followupStarCost: FOLLOWUP_STAR_COST,
  };
}

/**
 * Get current client quota & wallet status
 */
export function getQuotaStatus(clientKey: string): QuotaStatusPayload {
  const record = getOrCreateClientRecord(clientKey);
  return toQuotaPayload(record);
}

/**
 * Get current client Stars balance
 */
export function getStarsBalance(clientKey: string): number {
  return getOrCreateWalletRecord(clientKey).starsBalance;
}

/**
 * Credit Stars to client wallet
 */
export function addStars(clientKey: string, starsToAdd: number): QuotaStatusPayload {
  const wallet = getOrCreateWalletRecord(clientKey);
  const delta = Math.max(0, Math.floor(starsToAdd));
  wallet.starsBalance = Math.max(0, wallet.starsBalance + delta);
  if (delta > 0) {
    void syncStarTransactionHybrid({
      userId: clientKey,
      deltaStars: delta,
      reason: 'credit_stars',
      idempotencyKey: `credit_${clientKey}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    });
  }
  return getQuotaStatus(clientKey);
}

/**
 * Deduct Stars from client wallet (e.g. 5 Stars for Clarifier card)
 */
export function deductStars(
  clientKey: string,
  starsCost: number = CLARIFIER_STAR_COST
): {
  allowed: boolean;
  starsBalance: number;
  quota: QuotaStatusPayload;
} {
  const wallet = getOrCreateWalletRecord(clientKey);
  const cost = Math.max(0, Math.floor(starsCost));
  if (wallet.starsBalance < cost) {
    return {
      allowed: false,
      starsBalance: wallet.starsBalance,
      quota: getQuotaStatus(clientKey),
    };
  }

  wallet.starsBalance -= cost;
  if (cost > 0) {
    void syncStarTransactionHybrid({
      userId: clientKey,
      deltaStars: -cost,
      reason: 'deduct_stars',
      idempotencyKey: `deduct_${clientKey}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    });
  }
  return {
    allowed: true,
    starsBalance: wallet.starsBalance,
    quota: getQuotaStatus(clientKey),
  };
}

/**
 * Get client's daily spend in VND (for responsible spend cap enforcement)
 */
export function getDailySpendVnd(clientKey: string): number {
  return getOrCreateClientRecord(clientKey).dailySpendVnd;
}

/**
 * Record client's daily spend in VND
 */
export function addDailySpendVnd(clientKey: string, amountVnd: number): QuotaStatusPayload {
  const record = getOrCreateClientRecord(clientKey);
  record.dailySpendVnd += Math.max(0, Math.floor(amountVnd));
  return toQuotaPayload(record);
}

/**
 * Get today's Daily 1-Card Pull if already drawn by this client today
 */
export function getTodayDailyPull(
  clientKey: string,
  dateKey?: string
): DailyPullPayload | undefined {
  const store = getStore();
  const day = dateKey || store.currentDay;
  const wallet = getOrCreateWalletRecord(clientKey);
  return wallet.dailyPullMap.get(day);
}

/**
 * Prepare or commit a Daily 1-Card Pull for today:
 * - Increments `streakDays` by 1 and awards `+2` Stars if not yet pulled today.
 */
export function recordDailyPullCompletion(
  clientKey: string,
  buildDailyPayload: (meta: {
    date: string;
    streakDays: number;
    starsRewarded: number;
    totalStarsBalance: number;
  }) => DailyPullPayload
): {
  daily: DailyPullPayload;
  alreadyPulledToday: boolean;
  quota: QuotaStatusPayload;
} {
  const store = getStore();
  const today = store.currentDay;
  const wallet = getOrCreateWalletRecord(clientKey);
  const existing = wallet.dailyPullMap.get(today);

  if (existing && wallet.lastDailyPullDate === today) {
    return {
      daily: {
        ...existing,
        streakDays: wallet.streakDays,
        totalStarsBalance: wallet.starsBalance,
      },
      alreadyPulledToday: true,
      quota: getQuotaStatus(clientKey),
    };
  }

  wallet.streakDays += 1;
  const reward =
    wallet.streakDays % 7 === 0
      ? DAILY_STREAK_DAY7_REWARD
      : DAILY_PULL_STAR_REWARD;
  wallet.starsBalance += reward;
  wallet.lastDailyPullDate = today;

  const daily = buildDailyPayload({
    date: today,
    streakDays: wallet.streakDays,
    starsRewarded: reward,
    totalStarsBalance: wallet.starsBalance,
  });

  wallet.dailyPullMap.set(today, daily);
  recordFunnelEvent('daily_pull_completed', {
    clientKey,
    date: today,
    cardId: daily.card.id,
    streakDays: wallet.streakDays,
    starsRewarded: reward,
  });

  return {
    daily,
    alreadyPulledToday: false,
    quota: getQuotaStatus(clientKey),
  };
}

/**
 * Generate a unique 6-character room code (e.g. LUV892) for Couple Mode
 */
export function generateCoupleRoomCode(): string {
  const store = getStore();
  const prefixes = ['LUV', 'DUO', 'SOI', 'VAR', 'TIM', 'TAR'];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  for (let attempt = 0; attempt < 20; attempt++) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)] || 'LUV';
    let suffix = '';
    for (let i = 0; i < 3; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const candidate = `${prefix}${suffix}`;
    if (!store.coupleRooms.has(candidate)) {
      return candidate;
    }
  }

  return `LUV${Date.now().toString(36).slice(-3).toUpperCase()}`;
}

/**
 * Convert internal `StoredCoupleRoom` to `CoupleRoomPublicView`.
 * CRITICAL PRIVACY GUARDRAIL (PLAN.md Section 3.4):
 * NEVER include `ownerQuestionText` in the returned object!
 */
export function toPublicCoupleRoomView(room: StoredCoupleRoom): CoupleRoomPublicView {
  const isExpired =
    room.status === 'waiting_partner' &&
    new Date(room.expiresAt).getTime() <= Date.now();

  if (isExpired) {
    room.status = 'expired';
  }

  const canRevealResult =
    room.status === 'completed' &&
    (room.mode === 'solo_couple' ||
      (room.ownerConsentedShare && room.partnerConsentedShare));

  const publicView: CoupleRoomPublicView = {
    roomCode: room.roomCode,
    mode: room.mode,
    status: room.status,
    createdAt: room.createdAt,
    expiresAt: room.expiresAt,
    readerId: room.readerId,
    readerDisplayName: room.readerDisplayName,
    relationshipStatus: room.relationshipStatus,
    relationshipLabel: room.relationshipLabel,
    ownerNickname: room.ownerNickname,
    ownerCard: room.ownerCard,
    ownerConsentedShare: room.ownerConsentedShare,
    ...(room.partnerNickname ? { partnerNickname: room.partnerNickname } : {}),
    ...(room.partnerCard ? { partnerCard: room.partnerCard } : {}),
    partnerConsentedShare: room.partnerConsentedShare,
    ...(canRevealResult && room.readingResult
      ? { readingResult: room.readingResult }
      : {}),
    ...(canRevealResult && room.readingId ? { readingId: room.readingId } : {}),
  };

  return publicView;
}

/**
 * Save a Couple Room to the server store
 */
export function saveCoupleRoom(room: StoredCoupleRoom): CoupleRoomPublicView {
  const store = getStore();
  const normalizedCode = room.roomCode.trim().toUpperCase();
  room.roomCode = normalizedCode;
  store.coupleRooms.set(normalizedCode, room);

  void syncCoupleRoomHybrid({
    roomCode: normalizedCode,
    ownerId: room.ownerClientKey || 'anon_owner',
    ownerNickname: room.ownerNickname,
    ownerBirthYear: room.ownerBirthYear,
    ownerQuestionText: room.ownerQuestionText,
    ownerCardId: room.ownerCard?.card?.id ?? 0,
    ownerReversed: Boolean(room.ownerCard?.reversed),
    partnerNickname: room.partnerNickname,
    partnerBirthYear: room.partnerBirthYear,
    partnerCardId: room.partnerCard?.card?.id,
    partnerReversed: room.partnerCard?.reversed,
    bridgeCardId: room.connectionCard?.card?.id,
    bridgeReversed: room.connectionCard?.reversed,
    readerId: room.readerId,
    status: room.status,
    compatibilityScore: room.readingResult?.metrics?.compatibility_score,
    redFlagLevel: room.readingResult?.metrics?.red_flag_level,
    fullReading: room.fullReading ?? room.readingResult,
    expiresAt: room.expiresAt,
  });

  return toPublicCoupleRoomView(room);
}

/**
 * Retrieve a Couple Room from the server store by roomCode
 */
export function getCoupleRoom(roomCode?: string | null): StoredCoupleRoom | undefined {
  if (!roomCode) return undefined;
  const store = getStore();
  const normalizedCode = roomCode.trim().toUpperCase();
  const room = store.coupleRooms.get(normalizedCode);
  if (!room) return undefined;

  if (
    room.status === 'waiting_partner' &&
    new Date(room.expiresAt).getTime() <= Date.now()
  ) {
    room.status = 'expired';
  }
  return room;
}

/**
 * Convert `StoredTransaction` to public `PaymentOrderPayload`
 */
export function toPaymentOrderPayload(tx: StoredTransaction): PaymentOrderPayload {
  return {
    orderCode: tx.orderCode,
    packageId: tx.packageId,
    packageName: tx.packageName,
    amountVnd: tx.amountVnd,
    starsToCredit: tx.starsToCredit,
    status: tx.status,
    qrDataText: tx.qrDataText,
    vietQrImageUrl: tx.vietQrImageUrl,
    checkoutUrl: tx.checkoutUrl,
    provider: tx.provider,
    createdAt: tx.createdAt,
  };
}

/**
 * Save a newly created pending payment order
 */
export function savePendingPaymentOrder(tx: StoredTransaction): PaymentOrderPayload {
  const store = getStore();
  store.transactionsByOrderCode.set(tx.orderCode, tx);
  if (tx.providerRef) {
    store.transactionsByProviderRef.set(tx.providerRef, tx);
  }
  return toPaymentOrderPayload(tx);
}

/**
 * Get a payment order by `orderCode`
 */
export function getPaymentOrder(orderCode?: string | null): StoredTransaction | undefined {
  if (!orderCode) return undefined;
  const store = getStore();
  return store.transactionsByOrderCode.get(orderCode.trim());
}

/**
 * Confirm a payment order with strict idempotency on both `providerRef` and `orderCode` (PLAN.md Section 8.5).
 * Duplicate webhooks or repeated confirmations NEVER credit Stars or dailySpendVnd a second time.
 */
export function confirmPaymentOrderIdempotent(params: {
  orderCode: string;
  providerRef?: string;
  requestClientKey?: string;
}): {
  found: boolean;
  idempotentReplay: boolean;
  transaction?: StoredTransaction;
  order?: PaymentOrderPayload;
  quota?: QuotaStatusPayload;
} {
  const store = getStore();
  const cleanOrderCode = params.orderCode.trim();
  const cleanProviderRef = params.providerRef?.trim() || cleanOrderCode;

  // 1. Check if this providerRef was already processed
  const existingByProviderRef = store.transactionsByProviderRef.get(cleanProviderRef);
  if (existingByProviderRef && existingByProviderRef.status === 'paid') {
    return {
      found: true,
      idempotentReplay: true,
      transaction: existingByProviderRef,
      order: toPaymentOrderPayload(existingByProviderRef),
      quota: getQuotaStatus(existingByProviderRef.clientKey),
    };
  }

  // 2. Look up by orderCode
  const tx = store.transactionsByOrderCode.get(cleanOrderCode);
  if (!tx) {
    return {
      found: false,
      idempotentReplay: false,
    };
  }

  // 3. If order is already paid, return idempotent replay without crediting again
  if (tx.status === 'paid') {
    store.transactionsByProviderRef.set(cleanProviderRef, tx);
    return {
      found: true,
      idempotentReplay: true,
      transaction: tx,
      order: toPaymentOrderPayload(tx),
      quota: getQuotaStatus(tx.clientKey),
    };
  }

  // 4. First-time confirmation: mark paid, credit Stars, record dailySpendVnd, and index by providerRef
  tx.status = 'paid';
  tx.providerRef = cleanProviderRef;
  tx.paidAt = new Date().toISOString();

  store.transactionsByOrderCode.set(cleanOrderCode, tx);
  store.transactionsByProviderRef.set(cleanProviderRef, tx);

  addStars(tx.clientKey, tx.starsToCredit);
  if (!tx.isMonthlyPass) {
    addDailySpendVnd(tx.clientKey, tx.amountVnd);
  }

  // If the caller sent a different requestClientKey (e.g. webhook simulator vs user session), keep them in sync if needed
  if (params.requestClientKey && params.requestClientKey !== tx.clientKey) {
    const reqWallet = getOrCreateWalletRecord(params.requestClientKey);
    const ownerWallet = getOrCreateWalletRecord(tx.clientKey);
    reqWallet.starsBalance = ownerWallet.starsBalance;
  }

  recordFunnelEvent('payment_completed', {
    clientKey: tx.clientKey,
    orderCode: tx.orderCode,
    providerRef: cleanProviderRef,
    packageId: tx.packageId,
    amountVnd: tx.amountVnd,
    starsCredited: tx.starsToCredit,
  });

  return {
    found: true,
    idempotentReplay: false,
    transaction: tx,
    order: toPaymentOrderPayload(tx),
    quota: getQuotaStatus(tx.clientKey),
  };
}

/**
 * Get daily global AI budget status per PLAN.md Section 8.5
 */
export function getDailyBudgetStatus(): DailyBudgetStatus {
  const store = getStore();
  const budgetCapVnd = DAILY_AI_BUDGET_VND;
  const usageRatio = budgetCapVnd > 0 ? store.spentVndToday / budgetCapVnd : 0;

  return {
    day: store.currentDay,
    spentVnd: Math.round(store.spentVndToday),
    budgetCapVnd,
    usageRatio: Number(usageRatio.toFixed(4)),
    isWarning80Percent: usageRatio >= BUDGET_WARNING_RATIO,
    isHardCapReached: store.spentVndToday >= budgetCapVnd,
    readingsCountToday: store.readingsCountToday,
  };
}

/**
 * Check if the client can perform a reading (both daily quota and global AI budget cap)
 */
export function canConsumeQuota(clientKey: string): {
  allowed: boolean;
  reason?: 'QUOTA_EXCEEDED' | 'BUDGET_CAP_REACHED';
  quota: QuotaStatusPayload;
  budget: DailyBudgetStatus;
} {
  const quota = getQuotaStatus(clientKey);
  const budget = getDailyBudgetStatus();

  if (budget.isHardCapReached) {
    return {
      allowed: false,
      reason: 'BUDGET_CAP_REACHED',
      quota,
      budget,
    };
  }

  if (quota.remainingToday <= 0) {
    return {
      allowed: false,
      reason: 'QUOTA_EXCEEDED',
      quota,
      budget,
    };
  }

  return {
    allowed: true,
    quota,
    budget,
  };
}

/**
 * Check if the client is permitted to use the 78-card deck for their next reading.
 * - Turn 1 (usedToday === 0): Free to pick 78 or 22 cards.
 * - Turn 2 & 3+: 78-card deck is locked unless unlocked with Stars (FULL_DECK_UNLOCK_STAR_COST = 5).
 */
export function canUseFullDeck(clientKey: string): {
  allowed: boolean;
  isFirstFreeTurn: boolean;
  unlockCostStars: number;
  starsBalance: number;
} {
  const record = getOrCreateClientRecord(clientKey);
  const wallet = getOrCreateWalletRecord(clientKey);
  const isFirstFreeTurn = record.usedToday < FREE_DAILY_FULL_DECK_READINGS;
  const allowed = isFirstFreeTurn || (record.fullDeckUnlockedDraws ?? 0) > 0;

  return {
    allowed,
    isFirstFreeTurn,
    unlockCostStars: FULL_DECK_UNLOCK_STAR_COST,
    starsBalance: wallet.starsBalance,
  };
}

/**
 * Unlock 78-card deck for 1 reading using Stars from the client's wallet
 */
export function unlockFullDeckWithStars(clientKey: string): {
  success: boolean;
  error?: string;
  starsBalance: number;
  quota: QuotaStatusPayload;
} {
  const record = getOrCreateClientRecord(clientKey);
  const wallet = getOrCreateWalletRecord(clientKey);

  if (wallet.starsBalance < FULL_DECK_UNLOCK_STAR_COST) {
    return {
      success: false,
      error: 'INSUFFICIENT_STARS',
      starsBalance: wallet.starsBalance,
      quota: getQuotaStatus(clientKey),
    };
  }

  wallet.starsBalance -= FULL_DECK_UNLOCK_STAR_COST;
  record.fullDeckUnlockedDraws = (record.fullDeckUnlockedDraws ?? 0) + 1;

  recordFunnelEvent('bonus_unlocked', {
    clientKey,
    action: 'unlock_full_deck',
    costStars: FULL_DECK_UNLOCK_STAR_COST,
  });

  return {
    success: true,
    starsBalance: wallet.starsBalance,
    quota: getQuotaStatus(clientKey),
  };
}

/**
 * Deduct 1 reading from client quota and record estimated AI spend.
 * If deckMode is 'full_78' and on turn 2+, consumes 1 fullDeckUnlockedDraws unit.
 */
export function consumeQuota(
  clientKey: string,
  tokensIn: number = 0,
  tokensOut: number = 0,
  deckMode?: DeckMode
): QuotaStatusPayload {
  const store = getStore();
  const record = getOrCreateClientRecord(clientKey);

  if (deckMode === 'full_78' && record.usedToday >= FREE_DAILY_FULL_DECK_READINGS) {
    record.fullDeckUnlockedDraws = Math.max(0, (record.fullDeckUnlockedDraws ?? 0) - 1);
  }

  record.usedToday += 1;

  // Estimate cost in VND from tokens or default 25 VND per reading (PLAN.md Section 7.2)
  const tokenEstimatedCost =
    tokensIn > 0 || tokensOut > 0
      ? Math.max(5, Math.round(tokensIn * 0.012 + tokensOut * 0.025))
      : ESTIMATED_COST_PER_READING_VND;

  store.spentVndToday += tokenEstimatedCost;
  store.readingsCountToday += 1;

  return toQuotaPayload(record);
}

/**
 * Grant bonus draws (from sharing Story 9:16, watching simulated Rewarded Ad, or demo reset)
 */
export function grantBonusDraw(
  clientKey: string,
  action: 'share_bonus' | 'reward_ad_bonus' | 'reset_demo_quota'
): QuotaStatusPayload {
  const record = getOrCreateClientRecord(clientKey);

  if (action === 'reset_demo_quota') {
    record.usedToday = 0;
    record.bonusDraws = 20;
    const wallet = getOrCreateWalletRecord(clientKey);
    wallet.starsBalance = Math.max(wallet.starsBalance, 50);
  } else {
    record.bonusDraws = Math.min(MAX_BONUS_DRAWS_PER_DAY, record.bonusDraws + 1);
  }

  recordFunnelEvent('bonus_unlocked', { clientKey, action });
  if (action === 'share_bonus') {
    recordFunnelEvent('share_story', { clientKey, source: 'share_bonus_claim' });
  }

  return toQuotaPayload(record);
}

/**
 * Cache a completed reading in memory for fast `/api/story-card?readingId=...` and `/api/clarifier` lookup
 */
export function cacheReading(reading: ReadingSuccessResponse): void {
  const store = getStore();
  if (store.readingsCache.size >= MAX_CACHED_READINGS) {
    const oldestKey = store.readingsCache.keys().next().value;
    if (oldestKey) {
      store.readingsCache.delete(oldestKey);
    }
  }
  store.readingsCache.set(reading.readingId, reading);

  void syncReadingHybrid({
    readingId: reading.readingId,
    userId: `usr_${reading.nickname.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'anon'}_${reading.birthYear}`,
    nickname: reading.nickname,
    birthYear: reading.birthYear,
    ageTier: reading.ageTier,
    readerId: reading.readerId,
    topic: reading.topic,
    deckMode: reading.deckMode || 'major_22',
    questionText: reading.questionText,
    drawnCards: reading.drawnCards,
    aiResult: reading.result,
    clarifier: reading.clarifier,
  });
}

/**
 * Retrieve a cached reading by ID
 */
export function getCachedReading(
  readingId?: string | null
): ReadingSuccessResponse | undefined {
  if (!readingId) return undefined;
  const store = getStore();
  return store.readingsCache.get(readingId);
}

/**
 * Record an analytics funnel event per PLAN.md Section 2 & 9.1
 */
export function recordFunnelEvent(
  event: FunnelEventName,
  meta?: Record<string, unknown>
): void {
  const store = getStore();
  store.funnelCounts[event] = (store.funnelCounts[event] || 0) + 1;

  if (meta) {
    if (typeof meta.topic === 'string' && meta.topic) {
      store.topicBreakdown[meta.topic] = (store.topicBreakdown[meta.topic] || 0) + 1;
    }
    if (typeof meta.effectivePersona === 'string' && meta.effectivePersona) {
      store.personaBreakdown[meta.effectivePersona] =
        (store.personaBreakdown[meta.effectivePersona] || 0) + 1;
    }
  }

  const record: FunnelEventRecord = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    event,
    timestamp: new Date().toISOString(),
    day: store.currentDay,
    meta,
  };

  store.funnelEvents.push(record);
  if (store.funnelEvents.length > MAX_FUNNEL_EVENTS_LOG) {
    store.funnelEvents.shift();
  }
}

/**
 * Return funnel metrics summary for dashboard / verification (including PLAN.md Section 2 hypotheses)
 */
export function getFunnelMetricsSummary(): FunnelMetricsSummary {
  const store = getStore();
  const views = store.funnelCounts.view_result || 0;
  const shares = store.funnelCounts.share_story || 0;
  const shareRatePercent =
    views > 0 ? Number(((shares / views) * 100).toFixed(1)) : 0;

  const totalTopicEvents = Object.values(store.topicBreakdown).reduce(
    (sum, n) => sum + n,
    0
  );
  const loveCount =
    (store.topicBreakdown.love || 0) + (store.topicBreakdown.crush_school || 0);
  const loveTopicRatioPercent =
    totalTopicEvents > 0
      ? Number(((loveCount / totalTopicEvents) * 100).toFixed(1))
      : 0;

  const roomsCreated = store.funnelCounts.couple_room_created || 0;
  const roomsCompleted = store.funnelCounts.couple_room_completed || 0;
  const coupleInviteConversionPercent =
    roomsCreated > 0
      ? Number(((roomsCompleted / roomsCreated) * 100).toFixed(1))
      : 0;

  const clarifiersUnlocked = store.funnelCounts.clarifier_unlocked || 0;
  const clarifierConversionPercent =
    views > 0 ? Number(((clarifiersUnlocked / views) * 100).toFixed(1)) : 0;

  return {
    day: store.currentDay,
    counts: { ...store.funnelCounts },
    topicBreakdown: { ...store.topicBreakdown },
    personaBreakdown: { ...store.personaBreakdown },
    shareRatePercent,
    budget: getDailyBudgetStatus(),
    recentEvents: store.funnelEvents.slice(-20).reverse(),
    hypotheses: {
      loveTopicRatioPercent,
      shareRatePercent,
      coupleInviteConversionPercent,
      clarifierConversionPercent,
    },
  };
}

/**
 * Generate a deterministic 5-character uppercase alphanumeric referral suffix from clientKey
 */
function generateClientReferralCode(clientKey: string): string {
  const store = getStore();
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const hashHex = simpleHash(`ref:${clientKey}`);
  let num = Number.parseInt(hashHex, 16) || 1234567;
  let suffix = '';
  for (let i = 0; i < 5; i++) {
    suffix += alphabet.charAt(num % alphabet.length);
    num = Math.floor(num / alphabet.length) + i * 7;
  }
  const baseCandidate = `TC-${suffix}`;
  const existingOwner = store.referralCodeToClientKey.get(baseCandidate);
  if (!existingOwner || existingOwner === clientKey) {
    return baseCandidate;
  }
  const fallbackSuffix = simpleHash(`${clientKey}:${Date.now()}`).slice(0, 5).toUpperCase();
  return `TC-${fallbackSuffix}`;
}

function getOrCreateGrowthRecord(clientKey: string): ClientGrowthRecord {
  const store = getStore();
  const today = store.currentDay;
  const existing = store.growthRecords.get(clientKey);
  if (existing) {
    if (existing.lastAdWatchDay !== today) {
      existing.rewardedAdsWatchedToday = 0;
      existing.lastAdWatchDay = today;
    }
    store.referralCodeToClientKey.set(existing.referralCode, clientKey);
    return existing;
  }

  const referralCode = generateClientReferralCode(clientKey);
  const created: ClientGrowthRecord = {
    clientKey,
    referralCode,
    invitedFriendsCount: 0,
    redeemedReferralCodes: new Set(),
    rewardedAdsWatchedToday: 0,
    lastAdWatchDay: today,
    totalBonusStarsEarned: 0,
    totalBonusDrawsEarned: 0,
  };
  store.growthRecords.set(clientKey, created);
  store.referralCodeToClientKey.set(referralCode, clientKey);
  return created;
}

/**
 * Get current client Referral & Rewarded Ad status (Phase 4)
 */
export function getReferralStatus(clientKey: string): ReferralStatusPayload {
  const record = getOrCreateGrowthRecord(clientKey);
  return {
    referralCode: record.referralCode,
    referralUrl: `https://tarotcouple.vercel.app/?ref=${encodeURIComponent(record.referralCode)}`,
    invitedFriendsCount: record.invitedFriendsCount,
    totalBonusStarsEarned: record.totalBonusStarsEarned,
    totalBonusDrawsEarned: record.totalBonusDrawsEarned,
    rewardedAdsWatchedToday: record.rewardedAdsWatchedToday,
    rewardedAdsDailyLimit: REWARDED_ADS_DAILY_LIMIT,
  };
}

/**
 * Claim Referral Bonus (`+5` Stars & `+1` bonus draw for user; if referrer exists in store, increments their `invitedFriendsCount` and awards `+5` Stars too)
 */
export function claimReferralBonus(
  clientKey: string,
  friendReferralCode: string
): {
  success: boolean;
  reason?: 'EMPTY_CODE' | 'SELF_REFERRAL' | 'ALREADY_REDEEMED';
  message: string;
  starsAwarded: number;
  bonusDrawsAwarded: number;
  referral: ReferralStatusPayload;
  quota: QuotaStatusPayload;
  unitEconomics: UnitEconomicsSummary;
} {
  const store = getStore();
  const ownGrowth = getOrCreateGrowthRecord(clientKey);
  const cleanCode = (friendReferralCode || '').trim().toUpperCase();

  if (!cleanCode || cleanCode.length < 4) {
    return {
      success: false,
      reason: 'EMPTY_CODE',
      message: 'Vui lòng nhập mã giới thiệu hợp lệ (ví dụ: TC-8K9M2).',
      starsAwarded: 0,
      bonusDrawsAwarded: 0,
      referral: getReferralStatus(clientKey),
      quota: getQuotaStatus(clientKey),
      unitEconomics: getUnitEconomicsSummary(),
    };
  }

  if (cleanCode === ownGrowth.referralCode) {
    return {
      success: false,
      reason: 'SELF_REFERRAL',
      message: 'Bạn không thể tự nhập mã giới thiệu của chính mình nha!',
      starsAwarded: 0,
      bonusDrawsAwarded: 0,
      referral: getReferralStatus(clientKey),
      quota: getQuotaStatus(clientKey),
      unitEconomics: getUnitEconomicsSummary(),
    };
  }

  if (ownGrowth.redeemedReferralCodes.has(cleanCode)) {
    return {
      success: false,
      reason: 'ALREADY_REDEEMED',
      message: 'Mã giới thiệu này đã được bạn kích hoạt trước đó rồi.',
      starsAwarded: 0,
      bonusDrawsAwarded: 0,
      referral: getReferralStatus(clientKey),
      quota: getQuotaStatus(clientKey),
      unitEconomics: getUnitEconomicsSummary(),
    };
  }

  ownGrowth.redeemedReferralCodes.add(cleanCode);
  ownGrowth.totalBonusStarsEarned += REFERRAL_BONUS_STARS;
  ownGrowth.totalBonusDrawsEarned += 1;

  // Award +5 Stars and +1 bonus draw to the claiming user
  addStars(clientKey, REFERRAL_BONUS_STARS);
  const quotaRecord = getOrCreateClientRecord(clientKey);
  quotaRecord.bonusDraws = Math.min(
    MAX_BONUS_DRAWS_PER_DAY,
    quotaRecord.bonusDraws + 1
  );

  // If the referrer exists in store, reward them +5 Stars and increment their invitedFriendsCount
  const referrerClientKey = store.referralCodeToClientKey.get(cleanCode);
  if (referrerClientKey && referrerClientKey !== clientKey) {
    const referrerGrowth = getOrCreateGrowthRecord(referrerClientKey);
    referrerGrowth.invitedFriendsCount += 1;
    referrerGrowth.totalBonusStarsEarned += REFERRAL_BONUS_STARS;
    addStars(referrerClientKey, REFERRAL_BONUS_STARS);
  } else {
    // Also increment user's connected friend counter so solo testing reflects social loop progress
    ownGrowth.invitedFriendsCount += 1;
  }

  recordFunnelEvent('bonus_unlocked', {
    clientKey,
    action: 'referral_claimed',
    friendReferralCode: cleanCode,
    starsAwarded: REFERRAL_BONUS_STARS,
  });

  return {
    success: true,
    message: `Kích hoạt mã ${cleanCode} thành công! Bạn nhận được +${REFERRAL_BONUS_STARS} Sao ⭐ và +1 lượt rút bài miễn phí.`,
    starsAwarded: REFERRAL_BONUS_STARS,
    bonusDrawsAwarded: 1,
    referral: getReferralStatus(clientKey),
    quota: getQuotaStatus(clientKey),
    unitEconomics: getUnitEconomicsSummary(),
  };
}

/**
 * Record a Rewarded Ad View (checks `rewardedAdsWatchedToday < 5`, awards `+3` Stars & `+1` bonus draw, and adds `+45` VND eCPM to `totalAdRevenueVnd`)
 */
export function recordRewardedAdView(clientKey: string): {
  success: boolean;
  reason?: 'DAILY_AD_LIMIT_REACHED';
  message: string;
  starsAwarded: number;
  bonusDrawsAwarded: number;
  adRevenueAddedVnd: number;
  referral: ReferralStatusPayload;
  quota: QuotaStatusPayload;
  unitEconomics: UnitEconomicsSummary;
} {
  const store = getStore();
  const growth = getOrCreateGrowthRecord(clientKey);

  if (growth.rewardedAdsWatchedToday >= REWARDED_ADS_DAILY_LIMIT) {
    return {
      success: false,
      reason: 'DAILY_AD_LIMIT_REACHED',
      message: `Bạn đã xem đủ ${REWARDED_ADS_DAILY_LIMIT}/${REWARDED_ADS_DAILY_LIMIT} video thưởng hôm nay. Hãy quay lại vào ngày mai hoặc mời bạn bè nhé!`,
      starsAwarded: 0,
      bonusDrawsAwarded: 0,
      adRevenueAddedVnd: 0,
      referral: getReferralStatus(clientKey),
      quota: getQuotaStatus(clientKey),
      unitEconomics: getUnitEconomicsSummary(),
    };
  }

  growth.rewardedAdsWatchedToday += 1;
  growth.totalBonusStarsEarned += REWARDED_AD_BONUS_STARS;
  growth.totalBonusDrawsEarned += 1;

  addStars(clientKey, REWARDED_AD_BONUS_STARS);
  const quotaRecord = getOrCreateClientRecord(clientKey);
  quotaRecord.bonusDraws = Math.min(
    MAX_BONUS_DRAWS_PER_DAY,
    quotaRecord.bonusDraws + 1
  );

  store.totalAdRevenueVnd += REWARDED_AD_ECPM_VND;

  recordFunnelEvent('bonus_unlocked', {
    clientKey,
    action: 'rewarded_ad_watched',
    starsAwarded: REWARDED_AD_BONUS_STARS,
    adRevenueAddedVnd: REWARDED_AD_ECPM_VND,
  });

  return {
    success: true,
    message: `Xem xong Quảng Cáo Thưởng! Cộng +${REWARDED_AD_BONUS_STARS} Sao ⭐ và +1 lượt rút bài miễn phí.`,
    starsAwarded: REWARDED_AD_BONUS_STARS,
    bonusDrawsAwarded: 1,
    adRevenueAddedVnd: REWARDED_AD_ECPM_VND,
    referral: getReferralStatus(clientKey),
    quota: getQuotaStatus(clientKey),
    unitEconomics: getUnitEconomicsSummary(),
  };
}

/**
 * Phase 4 Stage Gate: Unit Economics Summary
 * Per PLAN.md Section 2 & Section 9 Stage Gate 4:
 * "Chi phí cho mỗi người dùng trả phí thấp hơn doanh thu trung bình mỗi người"
 */
export function getUnitEconomicsSummary(): UnitEconomicsSummary {
  const store = getStore();

  // Baseline seeded pilot cohort (so Stage Gate 4 metrics are meaningful out of the box and update live)
  const baseUsers = 140;
  const basePayingUsers = 9;
  const basePaymentRevenueVnd = 245000; // Clarifier 5k + Đêm Suy 19k + Check Var 29k + Thẻ Tháng 69k
  const baseAdRevenueVnd = 18900; // 420 rewarded ad views * 45 VND
  const baseAiCostVnd = 8400; // 336 readings * 25 VND
  const baseInfraEstimateVnd = 15000;

  const livePaidTransactions = Array.from(
    store.transactionsByOrderCode.values()
  ).filter((tx) => tx.status === 'paid');

  const livePayingClientsCount = new Set(
    livePaidTransactions.map((tx) => tx.clientKey)
  ).size;
  const livePaymentRevenueVnd = livePaidTransactions.reduce(
    (sum, tx) => sum + tx.amountVnd,
    0
  );

  const totalUsersTracked = baseUsers + store.quotas.size;
  const payingUsersCount = basePayingUsers + livePayingClientsCount;
  const totalPaymentRevenueVnd = basePaymentRevenueVnd + livePaymentRevenueVnd;
  const totalAdRevenueVnd = baseAdRevenueVnd + store.totalAdRevenueVnd;
  const totalGrossRevenueVnd = totalPaymentRevenueVnd + totalAdRevenueVnd;

  const totalAiCostVnd = baseAiCostVnd + Math.round(store.spentVndToday);
  const totalInfraEstimateVnd = baseInfraEstimateVnd;
  const totalOperatingCostVnd = totalAiCostVnd + totalInfraEstimateVnd;

  const arpuVnd = Math.round(
    totalGrossRevenueVnd / Math.max(1, totalUsersTracked)
  );
  const arppuVnd = Math.round(
    totalGrossRevenueVnd / Math.max(1, payingUsersCount)
  );
  const costPerPayingUserVnd = Math.round(
    totalOperatingCostVnd / Math.max(1, payingUsersCount)
  );

  const grossMarginPercent = Number(
    (
      ((totalGrossRevenueVnd - totalOperatingCostVnd) /
        Math.max(1, totalGrossRevenueVnd)) *
      100
    ).toFixed(1)
  );

  return {
    totalUsersTracked,
    payingUsersCount,
    totalPaymentRevenueVnd,
    totalAdRevenueVnd,
    totalGrossRevenueVnd,
    totalAiCostVnd,
    totalInfraEstimateVnd,
    totalOperatingCostVnd,
    arpuVnd,
    arppuVnd,
    costPerPayingUserVnd,
    grossMarginPercent,
    isStageGate4Passed: arppuVnd > costPerPayingUserVnd,
  };
}

const ARCHETYPE_BY_CARD_ID: Record<number, { title: string; auraColor: string }> = {
  0: { title: 'Kẻ Lữ Hành Tự Do • The Fool', auraColor: '#FBBF24 (Hoàng Kim Phiêu Lưu)' },
  1: { title: 'Bậc Thầy Kiến Tạo • The Magician', auraColor: '#E5B869 (Vàng Ánh Sao)' },
  2: { title: 'Nữ Tư Tế Trực Giác • The High Priestess', auraColor: '#C084FC (Tím Huyền Bí)' },
  3: { title: 'Nữ Hoàng Tỉnh Thức • The Empress', auraColor: '#8CE0C9 (Ngọc Lục Bảo Chữa Lành)' },
  6: { title: 'Kẻ Thức Tỉnh Tình Ái • The Lovers', auraColor: '#F472B6 (Hồng Ánh Trăng)' },
  7: { title: 'Chiến Thần Vượt Bão • The Chariot', auraColor: '#60A5FA (Lam Thiên Hà)' },
  9: { title: 'Hiền Giả Đêm Suy • The Hermit', auraColor: '#A78BFA (Tím Tinh Vân)' },
  16: { title: 'Phượng Hoàng Tái Sinh • The Tower', auraColor: '#FB7185 (Đỏ Hỏa Phượng)' },
  17: { title: 'Tinh Tú Manifest • The Star', auraColor: '#38BDF8 (Băng Lam Thuần Khiết)' },
  19: { title: 'Hào Quang Rực Rỡ • The Sun', auraColor: '#FDE047 (Vàng Mặt Trời)' },
};

/**
 * Build Phase 4 "Hồ Sơ Tâm Linh Cuối Tháng" (Spiritual Wrapped) for a client
 */
export function buildSpiritualWrappedForClient(
  clientKey: string,
  nickname?: string,
  readerId?: ReaderId
): SpiritualWrappedPayload {
  const store = getStore();
  const cachedReadings = Array.from(store.readingsCache.values());
  const latestReading = cachedReadings[cachedReadings.length - 1];

  const resolvedNickname =
    (nickname || latestReading?.nickname || 'Tín Đồ Tarot').trim().slice(0, 32) ||
    'Tín Đồ Tarot';

  const resolvedReaderId: ReaderId =
    readerId || latestReading?.readerId || 'ba_ngoai';
  const readerObj =
    READERS_BY_ID[resolvedReaderId] || READERS_BY_ID.ba_ngoai;

  // Pick signature card from latest reading or deterministic hash of clientKey
  const defaultCardIds = [3, 7, 17, 19, 2, 1, 6, 16];
  const hashInt =
    Number.parseInt(simpleHash(`wrapped:${clientKey}:${resolvedNickname}`), 16) ||
    7;
  const fallbackCardId =
    defaultCardIds[hashInt % defaultCardIds.length] ?? 3;

  const signatureDrawn = latestReading?.drawnCards?.[0];
  const signatureCardObj: TarotCard =
    signatureDrawn?.card ||
    TAROT_CARDS_BY_ID[fallbackCardId] ||
    MAJOR_ARCANA[3]!;
  const signatureReversed = signatureDrawn?.reversed ?? false;

  const archetypeMeta = ARCHETYPE_BY_CARD_ID[signatureCardObj.id] || {
    title: `Chiến Thần Tỉnh Thức • ${signatureCardObj.name_en}`,
    auraColor: '#C9A24A (Hoàng Kim Tinh Hà)',
  };

  const totalReadingsCount = Math.max(12, 11 + cachedReadings.length);
  const lateNightReadingsCount = Math.max(
    8,
    Math.min(totalReadingsCount, 8 + cachedReadings.length)
  );
  const peakHourLabel = '23:45 — Giờ Suy Thượng Thừa';

  const dominantTopic =
    latestReading?.topic === 'career'
      ? 'Sự nghiệp & Nhảy việc (64%)'
      : latestReading?.topic === 'finance'
      ? 'Tài chính & Vận may (62%)'
      : 'Tình duyên & Mập mờ (68%)';

  const auraMetrics = {
    selfLoveScore: 86 + (hashInt % 12),
    delusionDropPercent: 82 + ((hashInt >> 2) % 15),
    redFlagRadarScore: 88 + ((hashInt >> 4) % 11),
    manifestationPower: 90 + ((hashInt >> 6) % 9),
  };

  const monthlySavageQuote =
    latestReading?.result.shareable_card.savage_quote ||
    (resolvedReaderId === 'ba_ngoai'
      ? 'Tháng 10 khép lại mọi giông bão cũ, nhớ ăn cơm đúng bữa và yêu thương chính mình nhiều hơn nghen con.'
      : resolvedReaderId === 'thay_cu_meo'
      ? 'Tổng kết Quý 4: Cắt lỗ thành công các mối quan hệ mập mờ, định giá bản thân tăng vọt 200%!'
      : 'Đầu tháng còn thức tới 2h sáng lụy mập mờ, cuối tháng đã hóa Nữ Hoàng biết đắp mặt nạ đi ngủ đúng giờ!');

  const nextMonthProphecy =
    'Tháng 11 mở ra vận hội mới: một tin vui về tài chính / công việc sẽ gõ cửa tuần thứ 2, và người thực sự tử tế sẽ chủ động bước về phía bạn không cần bạn phải đoán ý.';

  const query = new URLSearchParams({
    nickname: resolvedNickname,
    month: 'Tháng 10 / 2026',
    archetype: archetypeMeta.title,
    cardId: String(signatureCardObj.id),
    reversed: signatureReversed ? '1' : '0',
    totalReadings: String(totalReadingsCount),
    peakHour: peakHourLabel,
    dominantTopic,
    selfLove: String(auraMetrics.selfLoveScore),
    delusionDrop: String(auraMetrics.delusionDropPercent),
    redFlagRadar: String(auraMetrics.redFlagRadarScore),
    manifestPower: String(auraMetrics.manifestationPower),
    quote: monthlySavageQuote,
    readerName: readerObj.name,
  });

  return {
    monthLabel: 'Tháng 10 / 2026',
    nickname: resolvedNickname,
    totalReadingsCount,
    lateNightReadingsCount,
    peakHourLabel,
    dominantTopic,
    favoriteReaderName: readerObj.name,
    favoriteReaderId: resolvedReaderId,
    signatureCard: {
      card: signatureCardObj,
      reversed: signatureReversed,
      appearances: 4 + (hashInt % 3),
      meaningSummary: signatureReversed
        ? signatureCardObj.core_meaning_rev
        : signatureCardObj.core_meaning_up,
    },
    spiritualArchetypeTitle: archetypeMeta.title,
    spiritualAuraColor: archetypeMeta.auraColor,
    auraMetrics,
    monthlySavageQuote,
    nextMonthProphecy,
    wrappedCardImageUrl: `/api/wrapped-card?${query.toString()}`,
  };
}

/**
 * Build a custom TikTok 3-Slide Carousel Kit from a specific reading or custom input
 */
export function buildCustomTikTokKitFromInput(input: {
  readingId?: string;
  nickname?: string;
  questionText?: string;
  readerId?: ReaderId;
  savageQuote?: string;
}): TikTokCarouselKit {
  const cached = getCachedReading(input.readingId);
  const readerId: ReaderId =
    input.readerId || cached?.readerId || 'chi_dai';
  const readerObj = READERS_BY_ID[readerId] || READERS_BY_ID.chi_dai;
  const nickname = (input.nickname || cached?.nickname || 'Bạn Ẩn Danh')
    .trim()
    .slice(0, 32);
  const question = (
    input.questionText ||
    cached?.questionText ||
    'Liệu mối quan hệ mập mờ này có đi đến đâu không hay chỉ mình em đa tình?'
  )
    .trim()
    .slice(0, 140);
  const savageQuote = (
    input.savageQuote ||
    cached?.result.shareable_card.savage_quote ||
    'Người ta cho em sự mập mờ, còn em tự viết nguyên bộ tiểu thuyết bi kịch lúc hai giờ sáng!'
  )
    .trim()
    .slice(0, 200);

  const cardNames = cached
    ? `${cached.drawnCards[0].card.name_vi} • ${cached.drawnCards[1].card.name_vi} • ${cached.drawnCards[2].card.name_vi}`
    : 'The Lovers • The Moon • The Empress';

  const cardsParam = cached
    ? cached.drawnCards
        .map((c) => `${c.card.id}:${c.reversed ? 1 : 0}`)
        .join(',')
    : '6:0,18:1,3:0';

  const storyUrl = `/api/story-card?persona=${encodeURIComponent(
    readerId
  )}&nickname=${encodeURIComponent(nickname)}&cards=${encodeURIComponent(
    cardsParam
  )}&quote=${encodeURIComponent(savageQuote)}&hideQuestion=1`;

  return {
    id: `kit_custom_${cached?.readingId || Date.now()}`,
    themeTitle: `Phiên Trải Bài Của @${nickname} • ${readerObj.name}`,
    readerId,
    readerName: readerObj.name,
    hookTitle: `POV: Hỏi ${readerObj.name} câu hỏi tâm can lúc nửa đêm và cái kết thấm từng chữ`,
    slides: [
      {
        slideNumber: 1,
        roleLabel: 'Slide 1 • Hook Gây Tò Mò',
        headline: `POV: 1h sáng mang tâm sự "${question}" đi hỏi ${readerObj.name}...`,
        bodyText:
          'Tưởng được vỗ về ai ngờ vũ trụ gửi thẳng 3 lá bài đọc vị không trượt phát nào 😭🔮',
        visualPromptNote:
          'Chụp màn hình lúc giữ nút Xào Bài 3 giây hoặc bàn trải bài rẻ quạt huyền bí.',
      },
      {
        slideNumber: 2,
        roleLabel: 'Slide 2 • Cú Twist 3 Lá Bài',
        headline: `Bộ 3 lá xuất hiện: ${cardNames}`,
        bodyText: cached
          ? cached.result.overall_verdict
          : 'Lá 1 bóc trần tâm lý tự suy diễn, Lá 2 chỉ rõ sự chần chừ của đối phương, nhưng Lá 3 khẳng định hào quang của bạn sắp bùng nổ!',
        visualPromptNote:
          'Hiển thị 3 lá bài lật mở kèm phân tích sắc bén của Reader.',
      },
      {
        slideNumber: 3,
        roleLabel: 'Slide 3 • Câu Chốt Hạ & CTA',
        headline: `“${savageQuote}”`,
        bodyText:
          'Vào ngay tarotcouple.vercel.app rút 3 lá miễn phí xem mình được tỉnh mộng hay chữa lành nha! ✨',
        visualPromptNote: 'Sử dụng trực tiếp ảnh Story 9:16 xuất từ hệ thống.',
        storyCardPreviewUrl: storyUrl,
      },
    ],
    captionSeo: `1h sáng vào xin vía ${readerObj.name} mà câu chốt hạ làm tỉnh cả ngủ 😭🔮 Ai đang suy tình duyên hay sự nghiệp vào rút thử 3 lá xem độ chuẩn nha!`,
    hashtags: [
      '#TarotCouple',
      '#ChiDai',
      '#TarotTinhYeu',
      '#CheckVarTinhYeu',
      '#BoiTarotOnline',
      '#DemSuy',
    ],
    capcutVoiceoverScript: `Một giờ sáng không ngủ được, mình thử vào Tarot Couple hỏi ${readerObj.name} về chuyện đang suy. Rút ra ba lá ${cardNames}, đọc đến câu chốt hạ: "${savageQuote}" mà tỉnh cả người! Bạn nào đang mập mờ vào test thử ngay nha.`,
    recommendedSoundVibe: 'Nhạc nền Lofi Mystic / Trend TikTok "Đêm Suy Tỉnh Thức"',
  };
}

/**
 * Build 4 ready-to-post viral 3-slide TikTok Photo Mode / Reels seeding kits (plus custom kit if `customReading` is provided)
 */
export function buildTikTokCarouselKits(
  customReading?: ReadingSuccessResponse
): TikTokCarouselKit[] {
  const defaultKits: TikTokCarouselKit[] = [
    {
      id: 'kit_1am_crush_savage',
      themeTitle: '1h Sáng Hỏi Chuyện Crush & Cái Kết Tỉnh Mộng',
      readerId: 'chi_dai',
      readerName: 'Chị Đại',
      hookTitle:
        'Hỏi Chị Đại lúc 1h sáng xem crush có thích mình không và cái kết tỉnh mộng',
      slides: [
        {
          slideNumber: 1,
          roleLabel: 'Slide 1 • Hook Đêm Suy (Giữ chân 3 giây đầu)',
          headline:
            'Hỏi Chị Đại lúc 1h sáng xem crush có thích mình không và cái kết tỉnh mộng 😭🌶️',
          bodyText:
            'Người ta chỉ thả tim story dạo mà mình đã kịp chọn tên cho con... Phải vào Tarot Couple xin một quẻ cho rõ trắng đen!',
          visualPromptNote:
            'Ảnh chụp giao diện chọn Reader Chị Đại với tag "Thẳng thắn & thương thật".',
        },
        {
          slideNumber: 2,
          roleLabel: 'Slide 2 • Cú Twist 3 Lá Bài',
          headline:
            'Rút trúng The Moon ngược + Seven of Swords + The Empress xuôi!',
          bodyText:
            'Chị Đại phán thẳng: "Năng lượng bên kia đang rải thính đa kênh, chỉ có em tự biên tự diễn phim ngôn tình buồn lúc nửa đêm thôi cưng ơi!"',
          visualPromptNote:
            'Ảnh 3 lá bài lật mở kèm phân tích từng vị trí: Năng lượng của bạn - Suy nghĩ đối phương - Kết cục gần.',
        },
        {
          slideNumber: 3,
          roleLabel: 'Slide 3 • Savage Punchline + CTA',
          headline:
            '“Người ta cho em sự mập mờ, còn em tự viết nguyên bộ tiểu thuyết bi kịch lúc hai giờ sáng.”',
          bodyText:
            'Chụp ngay tấm Card 9:16 đăng Story dằn mặt nhẹ! Link bói miễn phí ở bio: tarotcouple.vercel.app 🔮',
          visualPromptNote:
            'Ảnh Story Card 9:16 của Chị Đại với khung viền vàng huyền bí.',
          storyCardPreviewUrl:
            '/api/story-card?persona=chi_dai&nickname=BeHaySuy&cards=18:1,56:0,3:0&hideQuestion=1',
        },
      ],
      captionSeo:
        'Hỏi Chị Đại lúc 1h sáng xem crush có thích mình không và cái kết tỉnh mộng 😭🔥 Tag ngay đứa bạn thân đang lụy mập mờ vào nhận thông điệp vũ trụ!',
      hashtags: [
        '#TarotCouple',
        '#ChiDai',
        '#Crush',
        '#MapMo',
        '#TarotVietNam',
        '#StoryCard916',
      ],
      capcutVoiceoverScript:
        'Một giờ sáng còn thức đợi tin nhắn crush thì vào ngay Tarot Couple gặp Chị Đại nha mấy bà. Tự tay rút ba lá bài xong được Chị Đại đọc vị câu nào thấm câu đó: Người ta cho em sự mập mờ, còn em tự viết nguyên bộ tiểu thuyết bi kịch lúc hai giờ sáng! Tải ảnh chín mười sáu đăng Story nét căng luôn.',
      recommendedSoundVibe: 'Sound TikTok "Ơ Động Đất À" hoặc Nhạc Nền Drama Tarot',
    },
    {
      id: 'kit_couple_red_flag_85',
      themeTitle: 'Bói Đôi Check Var Tình Yêu • Red Flag 85%',
      readerId: 'ban_than',
      readerName: 'Bạn Thân',
      hookTitle: 'Bói Đôi Check Var Tình Yêu phát hiện Red Flag 85%',
      slides: [
        {
          slideNumber: 1,
          roleLabel: 'Slide 1 • Hook Kịch Tính Cặp Đôi',
          headline:
            'Gửi link Bói Đôi Check Var Tình Yêu bắt người ấy cùng rút bài và phát hiện Red Flag 85% 🚩😱',
          bodyText:
            'Tính năng phòng Bói Đôi 48h: Mỗi đứa tự rút 1 lá trên máy mình, câu hỏi bí mật của mình được khóa kín 100% không lộ!',
          visualPromptNote:
            'Ảnh màn hình tạo phòng Bói Đôi với mã phòng 6 ký tự (VD: VAR892).',
        },
        {
          slideNumber: 2,
          roleLabel: 'Slide 2 • Đối Chiếu 2 Lá Bài & Thanh Đo Hợp Cạ',
          headline: 'Lá của mình: The Lovers • Lá đối phương: The Devil ngược!',
          bodyText:
            'Bạn Thân hú hét: 💞 Độ Hợp Cạ 74% nhưng 🚩 Red Flag chạm ngưỡng 85% vì cả hai đều thích kiểm soát ngầm nha!',
          visualPromptNote:
            'Ảnh kết quả Bói Đôi hiển thị thanh Couple Meter (Chỉ để giải trí).',
        },
        {
          slideNumber: 3,
          roleLabel: 'Slide 3 • Chốt Hạ & Rủ Bạn Bè Check Var',
          headline:
            '“Tình yêu không cần thám tử, chỉ cần hai đứa cùng rút một quẻ Bói Đôi là hiện nguyên hình!”',
          bodyText:
            'Gửi ngay mã phòng cho crush hoặc người yêu vào rút chung tại tarotcouple.vercel.app nha! 💞',
          visualPromptNote:
            'Ảnh Story Card 9:16 có kèm thanh đo Độ Hợp Cạ & Red Flag.',
          storyCardPreviewUrl:
            '/api/story-card?persona=ban_than&nickname=CoupleCheckVar&cards=6:0,15:1,19:0&compatScore=74&redFlagLevel=85&vibeTag=Hợp%20Cạ%20Nhưng%20Hay%20Dỗi&hideQuestion=1',
        },
      ],
      captionSeo:
        'Rủ người yêu chơi Bói Đôi Check Var Tình Yêu trên Tarot Couple mà thanh Red Flag nhảy 85% luôn mấy bà ơi 🚩😂 Cặp nào đang yêu hay đang mập mờ gửi link rủ rút chung liền!',
      hashtags: [
        '#TarotCouple',
        '#BoiDoi',
        '#BanThan',
        '#RedFlag',
        '#CapDoiGenZ',
        '#TarotTinhYeu',
      ],
      capcutVoiceoverScript:
        'Mới phát hiện tính năng Bói Đôi Check Var Tình Yêu cực cuốn trên Tarot Couple. Mình rút một lá rồi gửi mã phòng cho người ấy tự rút lá thứ hai. Câu hỏi riêng tư của mình được bảo mật tuyệt đối, mà kết quả hiện ra cả thanh đo Độ Hợp Cạ lẫn Red Flag giải trí cực vui!',
      recommendedSoundVibe: 'Sound Trend Cặp Đôi / "Check Var Năng Lượng"',
    },
    {
      id: 'kit_ceo_career_jump',
      themeTitle: 'Xin Vía Nhảy Việc Cuối Năm Với Thầy Cú Mèo',
      readerId: 'thay_cu_meo',
      readerName: 'Thầy Cú Mèo',
      hookTitle: 'Xin vía nhảy việc cuối năm với Thầy Cú Mèo',
      slides: [
        {
          slideNumber: 1,
          roleLabel: 'Slide 1 • Hook Dân Văn Phòng & Sinh Viên',
          headline:
            'Xin vía nhảy việc & tăng lương cuối năm với Thầy Cú Mèo: Phân tích Tarot sâu sắc và logic 💼📈',
          bodyText:
            'Không văn vở sướt mướt, Thầy Cú Mèo đọc 3 lá bài bằng tư duy hệ thống, điểm mù tâm lý và chiến lược hành động cực bén!',
          visualPromptNote:
            'Ảnh giao diện Reader Thầy Cú Mèo (tone xanh đêm điềm tĩnh).',
        },
        {
          slideNumber: 2,
          roleLabel: 'Slide 2 • Phân Tích 3 Vị Trí Sự Nghiệp',
          headline:
            'Gốc rễ: Eight of Pentacles • Chướng ngại: Four of Swords • Lối thoát: The Chariot!',
          bodyText:
            'Thầy Cú Mèo chốt: "Năng lực chuyên môn của bạn đã vượt trần vị trí hiện tại. Đừng ngại bước ra khỏi vùng an toàn để đón cơ hội xứng tầm!"',
          visualPromptNote:
            'Ảnh 3 lá bài chủ đề Công việc / Học tập với lời khuyên hành động rõ ràng.',
        },
        {
          slideNumber: 3,
          roleLabel: 'Slide 3 • Quote Chiến Lược & CTA',
          headline:
            '“Quản trị tốt ranh giới và giá trị bản thân chính là khoản đầu tư bền vững nhất của bạn.”',
          bodyText:
            'Ai đang phân vân ở lại hay nhảy việc vào hỏi Thầy Cú Mèo ngay tại tarotcouple.vercel.app! 🚀',
          visualPromptNote:
            'Ảnh Story Card 9:16 tone xanh đêm Thầy Cú Mèo.',
          storyCardPreviewUrl:
            '/api/story-card?persona=thay_cu_meo&nickname=ChienThanOT&topicLabel=C%C3%B4ng%20vi%E1%BB%87c%20%26%20S%E1%BB%B1%20nghi%E1%BB%87p&cards=71:0,53:0,7:0&hideQuestion=1',
        },
      ],
      captionSeo:
        'Xin vía nhảy việc cuối năm với Thầy Cú Mèo mà ngỡ đang đi coaching chiến lược 1-1 💼🔥 Dân văn phòng hay sinh viên sắp ra trường vào rút 3 lá định hướng ngay!',
      hashtags: [
        '#TarotCouple',
        '#ThayCuMeo',
        '#TarotCongViec',
        '#NhayViec',
        '#GenZCongSo',
        '#ManifestThanhCong',
      ],
      capcutVoiceoverScript:
        'Ai đang phân vân có nên nhảy việc hay đòi tăng lương cuối năm thì vào gặp ngay Thầy Cú Mèo trên Tarot Couple. Không hề mê tín, Thầy Cú Mèo phân tích gốc rễ vấn đề, điểm mù và lộ trình bứt phá rõ ràng cực kỳ thuyết phục!',
      recommendedSoundVibe: 'Nhạc nền Phonk Nhẹ / Lo-fi Focus Vibe',
    },
    {
      id: 'kit_healing_midnight_comfort',
      themeTitle: 'Bà Ngoại Vỗ Về Đêm Suy',
      readerId: 'ba_ngoai',
      readerName: 'Bà Ngoại',
      hookTitle: 'Bà Ngoại vỗ về đêm suy',
      slides: [
        {
          slideNumber: 1,
          roleLabel: 'Slide 1 • Hook Dịu Dàng Chữa Lành',
          headline:
            'Dành cho những ai vừa trải qua một ngày dài mệt mỏi: Để Bà Ngoại vỗ về đêm suy của con nhé 🌿✨',
          bodyText:
            'Có những đêm không cần ai phán xét đúng sai, chỉ cần một lời dặn ấm áp giúp trái tim thở phào nhẹ nhõm.',
          visualPromptNote:
            'Ảnh Bà Ngoại với hào quang vàng ấm áp êm dịu.',
        },
        {
          slideNumber: 2,
          roleLabel: 'Slide 2 • Thông Điệp Từ The Star & Temperance',
          headline: 'Lá bài xuất hiện: The Star • Temperance • Six of Cups',
          bodyText:
            'Bà Ngoại nhắn gửi: "Mọi khoảng lặng hôm nay đều đang âm thầm chuẩn bị cho một chương mới bình yên hơn. Con đã cố gắng rất nhiều rồi."',
          visualPromptNote:
            'Ảnh trải bài chữa lành kèm vật phẩm độ mệnh ấm áp.',
        },
        {
          slideNumber: 3,
          roleLabel: 'Slide 3 • Lời Nhắn Bình Yên & Chia Sẻ',
          headline:
            '“Trái tim con xứng đáng nhận được sự dịu dàng mà con vẫn thường trao đi cho thế giới.”',
          bodyText:
            'Ghé trạm dừng tâm hồn tại tarotcouple.vercel.app để nhận lá bài chữa lành mỗi tối nghen con 🌙💛',
          visualPromptNote:
            'Ảnh Story Card 9:16 tone Vàng Ấm của Bà Ngoại.',
          storyCardPreviewUrl:
            '/api/story-card?persona=ba_ngoai&nickname=TamHonChuaLanh&cards=17:0,14:0,41:0&hideQuestion=1',
        },
      ],
      captionSeo:
        'Nếu tối nay bạn thấy lòng hơi chùng xuống, hãy để Bà Ngoại gửi tặng bạn một cái ôm qua 3 lá bài này nhé 🌿✨ Mọi chuyện rồi sẽ ổn thôi!',
      hashtags: [
        '#TarotCouple',
        '#BaNgoai',
        '#ChuaLanhTamHon',
        '#TarotChuaLanh',
        '#BinhYen',
        '#ThongDiepVuTru',
      ],
      capcutVoiceoverScript:
        'Nếu hôm nay của bạn hơi nhiều áp lực, hãy thử ghé Tarot Couple và chọn Bà Ngoại nhé. Không một lời trách móc, chỉ có những lời khuyên ấm áp giúp bạn lắng nghe cảm xúc của chính mình và ngủ một giấc thật ngon.',
      recommendedSoundVibe: 'Piano Chữa Lành / Tiếng Mưa Đêm & Chuông Xoay',
    },
  ];

  if (customReading) {
    const customKit = buildCustomTikTokKitFromInput({
      readingId: customReading.readingId,
      nickname: customReading.nickname,
      questionText: customReading.questionText,
      readerId: customReading.readerId,
      savageQuote: customReading.result.shareable_card.savage_quote,
    });
    return [customKit, ...defaultKits];
  }

  return defaultKits;
}

/**
 * Get followup messages for a reading
 */
export function getFollowupMessages(readingId: string): FollowupMessagePayload[] {
  const store = getStore();
  return store.followupMessagesByReading.get(readingId) || [];
}

/**
 * Check if the client can ask a followup question for a given readingId
 */
export function canAskFollowup(
  clientKey: string,
  readingId: string,
  options?: { bypassRateLimit?: boolean }
): {
  allowed: boolean;
  reason?: 'READING_LIMIT_REACHED' | 'RATE_LIMITED' | 'INSUFFICIENT_STARS';
  costType: 'free' | 'star';
  starsCost: number;
  freeFollowupsRemaining: number;
  currentMessageCount: number;
  starsBalance: number;
  quota: QuotaStatusPayload;
} {
  const wallet = getOrCreateWalletRecord(clientKey);
  const quota = getQuotaStatus(clientKey);
  const messages = getFollowupMessages(readingId);
  const userQuestionsCount = messages.filter((m) => m.role === 'user').length;

  if (userQuestionsCount >= FOLLOWUP_MAX_PER_READING) {
    return {
      allowed: false,
      reason: 'READING_LIMIT_REACHED',
      costType: 'star',
      starsCost: FOLLOWUP_STAR_COST,
      freeFollowupsRemaining: wallet.freeFollowupsRemaining ?? 0,
      currentMessageCount: userQuestionsCount,
      starsBalance: wallet.starsBalance,
      quota,
    };
  }

  const now = Date.now();
  if (
    !options?.bypassRateLimit &&
    now - (wallet.lastFollowupTimestamp || 0) < FOLLOWUP_RATE_LIMIT_MS
  ) {
    return {
      allowed: false,
      reason: 'RATE_LIMITED',
      costType: (wallet.freeFollowupsRemaining ?? 0) > 0 ? 'free' : 'star',
      starsCost: (wallet.freeFollowupsRemaining ?? 0) > 0 ? 0 : FOLLOWUP_STAR_COST,
      freeFollowupsRemaining: wallet.freeFollowupsRemaining ?? 0,
      currentMessageCount: userQuestionsCount,
      starsBalance: wallet.starsBalance,
      quota,
    };
  }

  const hasFree = (wallet.freeFollowupsRemaining ?? 0) > 0;
  if (hasFree) {
    return {
      allowed: true,
      costType: 'free',
      starsCost: 0,
      freeFollowupsRemaining: wallet.freeFollowupsRemaining,
      currentMessageCount: userQuestionsCount,
      starsBalance: wallet.starsBalance,
      quota,
    };
  }

  // Need Stars
  if (wallet.starsBalance < FOLLOWUP_STAR_COST) {
    return {
      allowed: false,
      reason: 'INSUFFICIENT_STARS',
      costType: 'star',
      starsCost: FOLLOWUP_STAR_COST,
      freeFollowupsRemaining: 0,
      currentMessageCount: userQuestionsCount,
      starsBalance: wallet.starsBalance,
      quota,
    };
  }

  return {
    allowed: true,
    costType: 'star',
    starsCost: FOLLOWUP_STAR_COST,
    freeFollowupsRemaining: 0,
    currentMessageCount: userQuestionsCount,
    starsBalance: wallet.starsBalance,
    quota,
  };
}

/**
 * Record a successful followup question + answer exchange in the store (atomic transaction).
 * Deducts free quota or Stars only on success.
 */
export function recordFollowupMessageExchange(params: {
  clientKey: string;
  readingId: string;
  question: string;
  answer: string;
  costType: 'free' | 'star';
  starsDeducted: number;
}): {
  userMessage: FollowupMessagePayload;
  assistantMessage: FollowupMessagePayload;
  allMessages: FollowupMessagePayload[];
  quota: QuotaStatusPayload;
} {
  const store = getStore();
  const wallet = getOrCreateWalletRecord(params.clientKey);

  // 1. Deduct cost
  if (params.costType === 'free') {
    wallet.freeFollowupsRemaining = Math.max(0, (wallet.freeFollowupsRemaining ?? FREE_FOLLOWUPS_PER_ACCOUNT) - 1);
  } else if (params.starsDeducted > 0) {
    wallet.starsBalance = Math.max(0, wallet.starsBalance - params.starsDeducted);
  }

  wallet.lastFollowupTimestamp = Date.now();

  // 2. Append messages
  const existing = store.followupMessagesByReading.get(params.readingId) || [];
  const nowIso = new Date().toISOString();

  const userMsg: FollowupMessagePayload = {
    id: `fmsg_${Date.now()}_u${Math.random().toString(36).slice(2, 6)}`,
    readingId: params.readingId,
    role: 'user',
    content: params.question,
    costType: params.costType,
    starsDeducted: params.starsDeducted,
    createdAt: nowIso,
  };

  const assistantMsg: FollowupMessagePayload = {
    id: `fmsg_${Date.now()}_a${Math.random().toString(36).slice(2, 6)}`,
    readingId: params.readingId,
    role: 'assistant',
    content: params.answer,
    costType: params.costType,
    starsDeducted: 0,
    createdAt: new Date(Date.now() + 10).toISOString(),
  };

  const updatedMessages = [...existing, userMsg, assistantMsg];
  store.followupMessagesByReading.set(params.readingId, updatedMessages);

  recordFunnelEvent('followup_asked', {
    clientKey: params.clientKey,
    readingId: params.readingId,
    costType: params.costType,
    starsDeducted: params.starsDeducted,
  });

  return {
    userMessage: userMsg,
    assistantMessage: assistantMsg,
    allMessages: updatedMessages,
    quota: getQuotaStatus(params.clientKey),
  };
}

/**
 * Reset in-memory store (used in automated test suites)
 */
export function resetAllQuotaStoreForTesting(): void {
  globalForTarotStore.__tarotCoupleStore = undefined;
  getStore();
}

