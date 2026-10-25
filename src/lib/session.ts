import crypto from 'crypto';

/**
 * TarotCouple Signed Anonymous Session Management (Phase 1 Auth Foundation)
 * - Uses HMAC-SHA256 with SESSION_SECRET to sign anonymous session cookies (`tc_sid`).
 * - Prevents arbitrary client-side impersonation (e.g. spoofing `x-client-id`).
 * - Allows seamless guest/vãng lai usage without dropping funnel conversion.
 */

/**
 * Local-dev fallback only. In production we never fall back to a secret that is
 * published in the repository: a per-process random secret is used instead so
 * cookies cannot be forged even if SESSION_SECRET was not configured.
 */
let ephemeralSecret: string | null = null;

function getSessionSecret(): string {
  const envSecret = process.env.SESSION_SECRET?.trim();
  if (envSecret && envSecret.length >= 16) {
    return envSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    if (!ephemeralSecret) {
      ephemeralSecret = crypto.randomBytes(32).toString('hex');
      console.warn(
        '[Session Security Warning]: SESSION_SECRET is missing or too short in production. ' +
          'Using an ephemeral per-process secret instead — set SESSION_SECRET (>= 32 chars) to keep sessions stable across instances.'
      );
    }
    return ephemeralSecret;
  }

  return 'tc_local_dev_session_secret_only';
}

/**
 * Compute HMAC-SHA256 signature for a session ID
 */
export function signSessionId(sessionId: string): string {
  const secret = getSessionSecret();
  return crypto.createHmac('sha256', secret).update(sessionId).digest('base64url');
}

/**
 * Format full cookie string: `${sessionId}.${signature}`
 */
export function createSignedSessionValue(sessionId?: string): string {
  const id = sessionId && /^[a-zA-Z0-9_-]{16,64}$/.test(sessionId)
    ? sessionId
    : crypto.randomBytes(18).toString('base64url');
  const signature = signSessionId(id);
  return `${id}.${signature}`;
}

/**
 * Verify and parse `tc_sid` cookie value. Returns verified sessionId or null if tampered/invalid.
 */
export function verifySessionValue(cookieValue: string | null | undefined): string | null {
  if (!cookieValue || typeof cookieValue !== 'string') return null;

  const dotIdx = cookieValue.indexOf('.');
  if (dotIdx <= 0) return null;

  const sessionId = cookieValue.slice(0, dotIdx);
  const providedSig = cookieValue.slice(dotIdx + 1);

  if (!sessionId || !providedSig) return null;

  const expectedSig = signSessionId(sessionId);
  try {
    const a = Buffer.from(providedSig);
    const b = Buffer.from(expectedSig);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
      return sessionId;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Derive a stable, opaque session id from server-observed request signals.
 *
 * Why: if a brand-new session id were fully random, a client that simply ignores
 * the `Set-Cookie` response would receive a fresh identity (and therefore a fresh
 * quota + wallet) on every request. Deriving the initial id from the peer
 * IP + User-Agent (HMAC'd, so it is not readable and cannot be guessed) keeps
 * cookie-less clients bound to the same bucket while still preferring the signed
 * cookie once it is present.
 */
function deriveFallbackSessionId(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();
  const ip = forwarded || realIp || 'no-ip';
  const userAgent = (request.headers.get('user-agent') || 'unknown-ua').slice(0, 160);
  const language = (request.headers.get('accept-language') || '').slice(0, 40);

  // Anti-Spam V2: Extract persistent hardware device fingerprint from header or cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const fpMatch = cookieHeader.match(/(?:^|;\s*)tc_device_fp=([^;]+)/);
  const deviceId =
    request.headers.get('x-device-id')?.trim() ||
    request.headers.get('x-device-fp')?.trim() ||
    fpMatch?.[1]?.trim() ||
    '';

  const seed = deviceId
    ? `device|${deviceId}|${ip.slice(0, 16)}`
    : `fallback|${ip}|${userAgent}|${language}`;

  return crypto
    .createHmac('sha256', getSessionSecret())
    .update(seed)
    .digest('base64url')
    .slice(0, 24);
}

/**
 * Resolves or issues a signed anonymous session from Request cookies
 */
export function resolveSignedSession(request?: Request): {
  sessionId: string;
  isNew: boolean;
  cookieHeaderValue: string;
} {
  if (!request) {
    const newId = crypto.randomBytes(18).toString('base64url');
    return {
      sessionId: newId,
      isNew: true,
      cookieHeaderValue: createSignedSessionValue(newId),
    };
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)tc_sid=([^;]+)/);
  const rawCookieVal = match?.[1]?.trim();

  const verifiedId = verifySessionValue(rawCookieVal);
  if (verifiedId) {
    return {
      sessionId: verifiedId,
      isNew: false,
      cookieHeaderValue: rawCookieVal!,
    };
  }

  // Issue a new signed session ID. Deterministic for this request fingerprint so
  // that a client refusing cookies cannot rotate its quota bucket.
  const newId = deriveFallbackSessionId(request);
  const signedVal = createSignedSessionValue(newId);
  return {
    sessionId: newId,
    isNew: true,
    cookieHeaderValue: signedVal,
  };
}

/**
 * Generates Set-Cookie header value for `tc_sid`
 */
export function buildSessionCookieHeader(signedValue: string): string {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = 365 * 24 * 60 * 60; // 1 year
  return `tc_sid=${signedValue}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}`;
}

/**
 * Extract authenticated user ID from Supabase JWT if present
 */
export function extractAuthenticatedUserId(request?: Request): string | null {
  if (!request) return null;

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    try {
      const parts = token.split('.');
      if (parts.length === 3 && parts[1]) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
        if (payload?.sub && typeof payload.sub === 'string') {
          return payload.sub;
        }
      }
    } catch {
      // malformed token
    }
  }

  // Check Supabase Auth cookie (sb-access-token or project ref token)
  const cookieHeader = request.headers.get('cookie') || '';
  const sbMatch = cookieHeader.match(/(?:^|;\s*)sb-[a-z0-9]+-auth-token=([^;]+)/i);
  if (sbMatch?.[1]) {
    try {
      const decoded = decodeURIComponent(sbMatch[1]);
      const parsed = JSON.parse(decoded);
      if (parsed?.user?.id) return String(parsed.user.id);
      if (parsed?.access_token) {
        const parts = String(parsed.access_token).split('.');
        if (parts[1]) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
          if (payload?.sub) return String(payload.sub);
        }
      }
    } catch {
      // ignore
    }
  }

  return null;
}
