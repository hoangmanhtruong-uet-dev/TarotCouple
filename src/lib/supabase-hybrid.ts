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
