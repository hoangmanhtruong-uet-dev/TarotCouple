/**
 * Hybrid Database Adapter (Local In-Memory Store + Optional Supabase REST/RPC Sync)
 *
 * Ensures 100% zero-config execution in Local Dev & CI Tests while automatically
 * syncing star transactions and couple rooms to Supabase PostgreSQL when
 * `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured.
 */

export interface SupabaseConfigStatus {
  enabled: boolean;
  supabaseUrl: string | null;
  hasServiceRoleKey: boolean;
  hasAnonKey: boolean;
  mode: 'supabase_hybrid' | 'local_memory';
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  const enabled = Boolean(url && serviceKey && url.startsWith('http'));

  return {
    enabled,
    supabaseUrl: enabled ? url : null,
    hasServiceRoleKey: Boolean(serviceKey),
    hasAnonKey: Boolean(anonKey),
    mode: enabled ? 'supabase_hybrid' : 'local_memory',
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfigStatus().enabled;
}

export interface AtomicStarTransactionInput {
  userId: string;
  deltaStars: number;
  reason: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
}

export interface AtomicStarTransactionResult {
  syncedToSupabase: boolean;
  success: boolean;
  starsBalance?: number;
  ledgerId?: string;
  alreadyProcessed?: boolean;
  errorCode?: string;
}

/**
 * Calls the PostgreSQL `atomic_star_transaction` RPC function via Supabase REST API
 * when Supabase is configured; gracefully resolves in `local_memory` mode otherwise.
 */
export async function syncStarTransactionHybrid(
  input: AtomicStarTransactionInput
): Promise<AtomicStarTransactionResult> {
  const config = getSupabaseConfigStatus();
  if (!config.enabled || !config.supabaseUrl) {
    return {
      syncedToSupabase: false,
      success: true,
    };
  }

  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  try {
    const response = await fetch(
      `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/atomic_star_transaction`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          p_user_id: input.userId,
          p_delta: input.deltaStars,
          p_reason: input.reason,
          p_idempotency_key: input.idempotencyKey,
          p_metadata: input.metadata ?? {},
        }),
      }
    );

    if (!response.ok) {
      return {
        syncedToSupabase: false,
        success: false,
        errorCode: `HTTP_${response.status}`,
      };
    }

    const rows = (await response.json()) as Array<{
      success: boolean;
      stars_balance: number;
      ledger_id: string | null;
      already_processed: boolean;
      error_code: string | null;
    }>;
    const row = Array.isArray(rows) ? rows[0] : undefined;

    if (!row) {
      return {
        syncedToSupabase: true,
        success: true,
      };
    }

    return {
      syncedToSupabase: true,
      success: Boolean(row.success),
      starsBalance: row.stars_balance,
      ledgerId: row.ledger_id ?? undefined,
      alreadyProcessed: row.already_processed,
      errorCode: row.error_code ?? undefined,
    };
  } catch {
    return {
      syncedToSupabase: false,
      success: false,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

const CANONICAL_DB_READERS = new Set(['ba_ngoai', 'chi_dai', 'ban_than', 'thay_cu_meo']);

function toCanonicalDbReaderId(readerId: string): string {
  if (CANONICAL_DB_READERS.has(readerId)) return readerId;
  if (readerId === 'ba_co_mo_hon') return 'chi_dai';
  if (readerId === 'ba_ngoai_vui_tinh') return 'ba_ngoai';
  if (readerId === 'tong_tai_ly_tri' || readerId === 'phap_su_toi_co') return 'thay_cu_meo';
  return 'ban_than';
}

/**
 * Non-blocking upsert of user profile and completed reading to Supabase (`public.profiles` + `public.readings`).
 */
export async function syncReadingHybrid(params: {
  readingId: string;
  userId: string;
  nickname: string;
  birthYear: number;
  ageTier: string;
  readerId: string;
  topic: string;
  deckMode: string;
  questionText: string;
  drawnCards: unknown;
  aiResult: unknown;
  clarifier?: unknown;
  followupMessages?: unknown;
}): Promise<boolean> {
  const config = getSupabaseConfigStatus();
  if (!config.enabled || !config.supabaseUrl) return false;

  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const baseUrl = config.supabaseUrl.replace(/\/$/, '');
  const headers = {
    'Content-Type': 'application/json',
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    Prefer: 'resolution=merge-duplicates,return=minimal',
  };

  try {
    await fetch(`${baseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: params.userId,
        nickname: params.nickname || 'Bạn Ẩn Danh',
        birth_year: Math.max(1940, Math.min(2026, params.birthYear || 2004)),
        age_tier: ['kid_teen_10_15', 'youth_16_17', 'adult_18_plus'].includes(params.ageTier)
          ? params.ageTier
          : 'adult_18_plus',
      }),
    });

    const res = await fetch(`${baseUrl}/rest/v1/readings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: params.readingId,
        user_id: params.userId,
        reader_id: toCanonicalDbReaderId(params.readerId),
        topic: params.topic,
        deck_mode: params.deckMode === 'full_78' ? 'full_78' : 'major_22',
        question_text: params.questionText || '',
        drawn_cards: params.drawnCards ?? [],
        ai_result: params.aiResult ?? {},
        clarifier: params.clarifier ?? null,
        followup_messages: params.followupMessages ?? [],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Non-blocking upsert of a Couple Room to Supabase (`public.couple_rooms`).
 */
export async function syncCoupleRoomHybrid(params: {
  roomCode: string;
  ownerId: string;
  ownerNickname: string;
  ownerBirthYear: number;
  ownerQuestionText: string;
  ownerCardId: number;
  ownerReversed: boolean;
  partnerNickname?: string;
  partnerBirthYear?: number;
  partnerCardId?: number;
  partnerReversed?: boolean;
  bridgeCardId?: number;
  bridgeReversed?: boolean;
  readerId: string;
  status: string;
  compatibilityScore?: number;
  redFlagLevel?: number;
  fullReading?: unknown;
  expiresAt?: string;
}): Promise<boolean> {
  const config = getSupabaseConfigStatus();
  if (!config.enabled || !config.supabaseUrl) return false;

  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const baseUrl = config.supabaseUrl.replace(/\/$/, '');

  try {
    const res = await fetch(`${baseUrl}/rest/v1/couple_rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        room_code: params.roomCode,
        owner_id: params.ownerId,
        owner_nickname: params.ownerNickname,
        owner_birth_year: params.ownerBirthYear || 2004,
        owner_question_text: params.ownerQuestionText || '',
        owner_card_id: params.ownerCardId,
        owner_reversed: params.ownerReversed,
        partner_nickname: params.partnerNickname ?? null,
        partner_birth_year: params.partnerBirthYear ?? null,
        partner_card_id: params.partnerCardId ?? null,
        partner_reversed: params.partnerReversed ?? null,
        bridge_card_id: params.bridgeCardId ?? null,
        bridge_reversed: params.bridgeReversed ?? null,
        reader_id: toCanonicalDbReaderId(params.readerId),
        status: ['waiting_partner', 'completed', 'expired'].includes(params.status)
          ? params.status
          : 'waiting_partner',
        compatibility_score: params.compatibilityScore ?? null,
        red_flag_level: params.redFlagLevel ?? null,
        full_reading: params.fullReading ?? null,
        ...(params.expiresAt ? { expires_at: params.expiresAt } : {}),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

