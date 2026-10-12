-- ============================================================================
-- TAROT COUPLE — PRODUCTION DATABASE MIGRATION (SUPABASE POSTGRESQL + RLS)
-- File: supabase/migrations/001_tarot_couple_golive_schema.sql
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES TABLE (Hồ sơ người dùng, Ví Sao & Bộ đếm 2 lượt hỏi sâu miễn phí)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL DEFAULT 'Bạn Ẩn Danh',
  birth_year INTEGER NOT NULL DEFAULT 2004 CHECK (birth_year BETWEEN 1940 AND 2026),
  age_tier TEXT NOT NULL DEFAULT 'adult_18_plus' CHECK (age_tier IN ('kid_teen_10_15', 'youth_16_17', 'adult_18_plus')),
  stars_balance INTEGER NOT NULL DEFAULT 10 CHECK (stars_balance >= 0),
  streak_days INTEGER NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
  last_checkin_date_vn DATE,
  followup_free_remaining INTEGER NOT NULL DEFAULT 2 CHECK (followup_free_remaining BETWEEN 0 AND 2),
  referral_code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. QUOTA USAGE TABLE (Hạn mức rút bài theo ngày giờ Việt Nam UTC+7)
CREATE TABLE IF NOT EXISTS public.quota_usage (
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date_vn DATE NOT NULL,
  free_draws_used INTEGER NOT NULL DEFAULT 0 CHECK (free_draws_used >= 0),
  first_draw_full_deck_used BOOLEAN NOT NULL DEFAULT FALSE,
  bonus_draws_granted INTEGER NOT NULL DEFAULT 0 CHECK (bonus_draws_granted >= 0),
  full_deck_unlocked_draws INTEGER NOT NULL DEFAULT 0 CHECK (full_deck_unlocked_draws >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, date_vn)
);

-- 3. WALLET LEDGER TABLE (Sổ cái Sao Append-Only — Chống gian lận & trùng lặp)
CREATE TABLE IF NOT EXISTS public.wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  delta_stars INTEGER NOT NULL CHECK (delta_stars <> 0),
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  reason TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user_created
  ON public.wallet_ledger (user_id, created_at DESC);

-- Enforce Append-Only on wallet_ledger (Forbid UPDATE and DELETE)
CREATE OR REPLACE FUNCTION public.prevent_wallet_ledger_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'wallet_ledger is append-only: UPDATE and DELETE operations are strictly prohibited.';
END;
$$;

DROP TRIGGER IF EXISTS trg_wallet_ledger_append_only ON public.wallet_ledger;
CREATE TRIGGER trg_wallet_ledger_append_only
  BEFORE UPDATE OR DELETE ON public.wallet_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_wallet_ledger_mutation();

-- 4. ORDERS TABLE (Đơn hàng nạp Sao VietQR PayOS)
CREATE TABLE IF NOT EXISTS public.orders (
  order_code BIGINT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  package_id TEXT NOT NULL,
  amount_vnd INTEGER NOT NULL CHECK (amount_vnd > 0),
  stars_granted INTEGER NOT NULL CHECK (stars_granted > 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED')),
  payos_reference TEXT,
  webhook_signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_user_status
  ON public.orders (user_id, status, created_at DESC);

-- 5. READINGS TABLE (Lưu trữ lịch sử trải bài, Lá thứ 4 & Hỏi sâu)
CREATE TABLE IF NOT EXISTS public.readings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reader_id TEXT NOT NULL CHECK (reader_id IN ('ba_ngoai', 'chi_dai', 'ban_than', 'thay_cu_meo')),
  topic TEXT NOT NULL,
  deck_mode TEXT NOT NULL DEFAULT 'major_22' CHECK (deck_mode IN ('major_22', 'full_78')),
  question_text TEXT NOT NULL DEFAULT '',
  drawn_cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  clarifier JSONB,
  followup_messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_readings_user_created
  ON public.readings (user_id, created_at DESC);

-- 6. COUPLE ROOMS TABLE (Phòng Bói Đôi P12–P15, TTL 48 giờ)
CREATE TABLE IF NOT EXISTS public.couple_rooms (
  room_code TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  owner_nickname TEXT NOT NULL,
  owner_birth_year INTEGER NOT NULL DEFAULT 2004,
  owner_question_text TEXT NOT NULL DEFAULT '',
  owner_card_id INTEGER NOT NULL,
  owner_reversed BOOLEAN NOT NULL DEFAULT FALSE,
  partner_nickname TEXT,
  partner_birth_year INTEGER,
  partner_card_id INTEGER,
  partner_reversed BOOLEAN,
  bridge_card_id INTEGER,
  bridge_reversed BOOLEAN,
  reader_id TEXT NOT NULL DEFAULT 'ba_ngoai' CHECK (reader_id IN ('ba_ngoai', 'chi_dai', 'ban_than', 'thay_cu_meo')),
  status TEXT NOT NULL DEFAULT 'waiting_partner' CHECK (status IN ('waiting_partner', 'completed', 'expired')),
  compatibility_score INTEGER CHECK (compatibility_score BETWEEN 0 AND 100),
  red_flag_level INTEGER CHECK (red_flag_level BETWEEN 0 AND 100),
  full_reading JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours')
);

CREATE INDEX IF NOT EXISTS idx_couple_rooms_expires_at
  ON public.couple_rooms (expires_at, status);

-- ============================================================================
-- 7. ATOMIC STAR TRANSACTION RPC (Chống Race Condition & Double-Spending)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.atomic_star_transaction(
  p_user_id TEXT,
  p_delta INTEGER,
  p_reason TEXT,
  p_idempotency_key TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  success BOOLEAN,
  stars_balance INTEGER,
  ledger_id UUID,
  already_processed BOOLEAN,
  error_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_ledger public.wallet_ledger%ROWTYPE;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_new_ledger_id UUID;
BEGIN
  -- 1. Check idempotency key first
  SELECT * INTO v_existing_ledger
  FROM public.wallet_ledger
  WHERE idempotency_key = p_idempotency_key
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT
      TRUE,
      v_existing_ledger.balance_after,
      v_existing_ledger.id,
      TRUE,
      NULL::TEXT;
    RETURN;
  END IF;

  -- 2. Ensure profile exists and lock row FOR UPDATE
  INSERT INTO public.profiles (id)
  VALUES (p_user_id)
  ON CONFLICT (id) DO NOTHING;

  SELECT p.stars_balance INTO v_current_balance
  FROM public.profiles p
  WHERE p.id = p_user_id
  FOR UPDATE;

  v_new_balance := v_current_balance + p_delta;

  -- 3. Guard against negative balance
  IF v_new_balance < 0 THEN
    RETURN QUERY SELECT
      FALSE,
      v_current_balance,
      NULL::UUID,
      FALSE,
      'INSUFFICIENT_STARS'::TEXT;
    RETURN;
  END IF;

  -- 4. Update profile balance
  UPDATE public.profiles
  SET stars_balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- 5. Append immutable record to wallet_ledger
  INSERT INTO public.wallet_ledger (
    user_id,
    delta_stars,
    balance_after,
    reason,
    idempotency_key,
    metadata
  )
  VALUES (
    p_user_id,
    p_delta,
    v_new_balance,
    p_reason,
    p_idempotency_key,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_new_ledger_id;

  RETURN QUERY SELECT
    TRUE,
    v_new_balance,
    v_new_ledger_id,
    FALSE,
    NULL::TEXT;
END;
$$;

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_rooms ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only read their own profile; mutations happen via Server API / Service Role
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (auth.uid()::text = id);

-- Quota Usage: Users can only read their own quota
DROP POLICY IF EXISTS quota_usage_select_own ON public.quota_usage;
CREATE POLICY quota_usage_select_own ON public.quota_usage
  FOR SELECT USING (auth.uid()::text = user_id);

-- Wallet Ledger: Users can only read their own ledger entries; no client INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS wallet_ledger_select_own ON public.wallet_ledger;
CREATE POLICY wallet_ledger_select_own ON public.wallet_ledger
  FOR SELECT USING (auth.uid()::text = user_id);

-- Orders: Users can only read their own payment orders
DROP POLICY IF EXISTS orders_select_own ON public.orders;
CREATE POLICY orders_select_own ON public.orders
  FOR SELECT USING (auth.uid()::text = user_id);

-- Readings: Users can only read their own readings
DROP POLICY IF EXISTS readings_select_own ON public.readings;
CREATE POLICY readings_select_own ON public.readings
  FOR SELECT USING (auth.uid()::text = user_id);

-- Couple Rooms: Server routes enforce privacy masking (owner_question_text hidden from partner)
DROP POLICY IF EXISTS couple_rooms_select_owner ON public.couple_rooms;
CREATE POLICY couple_rooms_select_owner ON public.couple_rooms
  FOR SELECT USING (auth.uid()::text = owner_id);
