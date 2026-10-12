/**
 * Hybrid Database Adapter (Local In-Memory Store + Optional Supabase REST/RPC Sync)
 *
 * Ensures 100% zero-config execution in Local Dev & CI Tests while automatically
 * syncing star transactions and couple rooms to Supabase PostgreSQL when
 * `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured.
 */

import { MAJOR_ARCANA, TAROT_CARDS_BY_ID, type TarotCard } from '@/data/tarot-cards';
import type { ReadingSuccessResponse } from './api-types';
import { PERSONA_PROFILES } from './prompts';
import type { StoredCoupleRoom } from './quota-store';
import { RELATIONSHIP_STATUS_LABELS } from './safety';
import type {
  CoupleRelationshipStatus,
  DeckMode,
  ReaderId,
  ReadingOutput,
} from './schemas';

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

export interface SupabaseHealthResult {
  mode: 'hybrid' | 'memory-only';
  connected: boolean;
  tablesReady: boolean;
  missingTables: string[];
}

const CORE_SUPABASE_TABLES = ['profiles', 'readings', 'couple_rooms'];

/**
 * Checks Supabase PostgREST connectivity and table readiness via OpenAPI spec (/rest/v1/).
 * Safely handles missing credentials, offline test environments, and timeouts without throwing.
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthResult> {
  const config = getSupabaseConfigStatus();

  if (!config.enabled || !config.supabaseUrl) {
    return {
      mode: 'memory-only',
      connected: false,
      tablesReady: false,
      missingTables: [...CORE_SUPABASE_TABLES],
    };
  }

  const serviceKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();
  const baseUrl = config.supabaseUrl.replace(/\/$/, '');

  try {
    const res = await fetch(`${baseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        ...(serviceKey
          ? { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
          : {}),
        Accept: 'application/openapi+json, application/json',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      return {
        mode: 'hybrid',
        connected: false,
        tablesReady: false,
        missingTables: [...CORE_SUPABASE_TABLES],
      };
    }

    const spec = (await res.json()) as {
      definitions?: Record<string, unknown>;
      paths?: Record<string, unknown>;
      components?: { schemas?: Record<string, unknown> };
    };

    const hasTable = (name: string): boolean => {
      const inDefs = Boolean(spec?.definitions && spec.definitions[name]);
      const inPaths = Boolean(
        spec?.paths && (spec.paths[`/${name}`] || spec.paths[name])
      );
      const inSchemas = Boolean(
        spec?.components?.schemas && spec.components.schemas[name]
      );
      return inDefs || inPaths || inSchemas;
    };

    const missingTables = CORE_SUPABASE_TABLES.filter((t) => !hasTable(t));

    return {
      mode: 'hybrid',
      connected: true,
      tablesReady: missingTables.length === 0,
      missingTables,
    };
  } catch {
    return {
      mode: 'hybrid',
      connected: false,
      tablesReady: false,
      missingTables: [...CORE_SUPABASE_TABLES],
    };
  }
}

/**
 * Fetches a Couple Room from Supabase PostgreSQL (`public.couple_rooms`)
 * and reconstructs a full `StoredCoupleRoom` domain entity.
 * Used as serverless read-through fallback when local in-memory cache misses.
 */
export async function fetchCoupleRoomFromSupabase(
  roomCode: string
): Promise<StoredCoupleRoom | null> {
  if (!roomCode || typeof roomCode !== 'string') return null;
  const normalizedCode = roomCode.trim().toUpperCase();
  if (!normalizedCode) return null;

  const config = getSupabaseConfigStatus();
  if (!config.enabled || !config.supabaseUrl) return null;

  const serviceKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();
  const baseUrl = config.supabaseUrl.replace(/\/$/, '');

  try {
    const res = await fetch(
      `${baseUrl}/rest/v1/couple_rooms?room_code=eq.${encodeURIComponent(normalizedCode)}&select=*`,
      {
        method: 'GET',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(4000),
      }
    );

    if (!res.ok) return null;

    const rows = (await res.json()) as Array<Record<string, unknown>>;
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const row = rows[0];
    if (!row) return null;

    // 1. Reconstruct Tarot Cards
    const ownerCardId =
      typeof row.owner_card_id === 'number' ? row.owner_card_id : 0;
    const ownerCardObj = TAROT_CARDS_BY_ID[ownerCardId] ?? MAJOR_ARCANA[0]!;
    const ownerCard = {
      card: ownerCardObj,
      reversed: Boolean(row.owner_reversed),
    };

    let partnerCard: { card: TarotCard; reversed: boolean } | undefined =
      undefined;
    if (typeof row.partner_card_id === 'number') {
      partnerCard = {
        card: TAROT_CARDS_BY_ID[row.partner_card_id] ?? MAJOR_ARCANA[6]!,
        reversed: Boolean(row.partner_reversed),
      };
    }

    let connectionCard: { card: TarotCard; reversed: boolean } | undefined =
      undefined;
    if (typeof row.bridge_card_id === 'number') {
      connectionCard = {
        card: TAROT_CARDS_BY_ID[row.bridge_card_id] ?? MAJOR_ARCANA[19]!,
        reversed: Boolean(row.bridge_reversed),
      };
    }

    // 2. Persona & Reader ID resolution
    const canonicalReaderId = toCanonicalDbReaderId(
      String(row.reader_id || 'ba_ngoai')
    );
    const personaProfile =
      PERSONA_PROFILES[canonicalReaderId as keyof typeof PERSONA_PROFILES];
    const readerDisplayName = personaProfile?.displayName || 'Bà Ngoại';

    // 3. Status & 48h TTL check
    let status: 'waiting_partner' | 'completed' | 'expired' =
      row.status === 'completed' || row.status === 'expired'
        ? (row.status as 'completed' | 'expired')
        : 'waiting_partner';

    const nowMs = Date.now();
    const expiresAtMs = row.expires_at
      ? new Date(String(row.expires_at)).getTime()
      : 0;
    if (status === 'waiting_partner' && expiresAtMs > 0 && expiresAtMs <= nowMs) {
      status = 'expired';
    }

    // 4. Reading Results & Responses
    const fullReadingData = row.full_reading as
      | Record<string, unknown>
      | null
      | undefined;
    let fullReading: ReadingSuccessResponse | undefined = undefined;
    let readingResult: ReadingOutput | undefined = undefined;
    let readingId: string | undefined = undefined;

    if (fullReadingData && typeof fullReadingData === 'object') {
      if (fullReadingData.status === 'ok' && fullReadingData.result) {
        fullReading = fullReadingData as unknown as ReadingSuccessResponse;
        readingResult = fullReadingData.result as ReadingOutput;
        readingId =
          typeof fullReadingData.readingId === 'string'
            ? fullReadingData.readingId
            : undefined;
      } else if (fullReadingData.overall_verdict || fullReadingData.cards_analysis) {
        readingResult = fullReadingData as unknown as ReadingOutput;
      }
    }

    if (
      readingResult &&
      (row.compatibility_score != null || row.red_flag_level != null)
    ) {
      readingResult.metrics = {
        compatibility_score:
          typeof row.compatibility_score === 'number'
            ? row.compatibility_score
            : readingResult.metrics?.compatibility_score,
        red_flag_level:
          typeof row.red_flag_level === 'number'
            ? row.red_flag_level
            : readingResult.metrics?.red_flag_level,
        vibe_tag: readingResult.metrics?.vibe_tag || '',
        entertainment_note: 'Chỉ để giải trí',
      };
    }

    // 5. Relationship Status & Label
    let relationshipStatus: CoupleRelationshipStatus = 'situationship';
    if (
      fullReadingData &&
      typeof fullReadingData.relationshipStatus === 'string'
    ) {
      const rs = fullReadingData.relationshipStatus;
      if (
        rs === 'crush' ||
        rs === 'situationship' ||
        rs === 'dating' ||
        rs === 'ex'
      ) {
        relationshipStatus = rs;
      }
    }
    const relationshipLabel =
      RELATIONSHIP_STATUS_LABELS[relationshipStatus] || 'Đang tìm hiểu';

    // 6. Deck Mode
    let deckMode: DeckMode = 'major_22';
    if (fullReadingData && fullReadingData.deckMode === 'full_78') {
      deckMode = 'full_78';
    } else if (
      ownerCardObj.id > 21 ||
      (partnerCard && partnerCard.card.id > 21)
    ) {
      deckMode = 'full_78';
    }

    const storedRoom: StoredCoupleRoom = {
      roomCode: normalizedCode,
      mode: 'coop_invite',
      status,
      createdAt:
        typeof row.created_at === 'string'
          ? row.created_at
          : new Date().toISOString(),
      expiresAt:
        typeof row.expires_at === 'string'
          ? row.expires_at
          : new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      ownerClientKey:
        typeof row.owner_id === 'string' ? row.owner_id : 'anon_owner',
      ownerBirthYear:
        typeof row.owner_birth_year === 'number' ? row.owner_birth_year : 2004,
      readerId: canonicalReaderId as ReaderId,
      readerDisplayName,
      relationshipStatus,
      relationshipLabel,
      deckMode,
      ownerNickname:
        typeof row.owner_nickname === 'string' ? row.owner_nickname : 'Bạn',
      ownerQuestionText:
        typeof row.owner_question_text === 'string'
          ? row.owner_question_text
          : '',
      ownerCard,
      ownerConsentedShare: true,
      partnerConsentedShare: true,
      ...(row.partner_nickname
        ? { partnerNickname: String(row.partner_nickname) }
        : {}),
      ...(row.partner_birth_year
        ? { partnerBirthYear: Number(row.partner_birth_year) }
        : {}),
      ...(partnerCard ? { partnerCard } : {}),
      ...(connectionCard ? { connectionCard } : {}),
      ...(readingResult ? { readingResult } : {}),
      ...(readingId ? { readingId } : {}),
      ...(fullReading ? { fullReading } : {}),
    };

    return storedRoom;
  } catch {
    return null;
  }
}


