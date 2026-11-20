/**
 * Admin-auth helper — env-gated, HMAC-signed session cookies.
 *
 * Session cookie value format: `${timestampMs}.${hexHmac}`
 *   - timestampMs : when the session was issued
 *   - hexHmac     : HMAC-SHA256 of timestampMs using ADMIN_SESSION_SECRET
 *
 * Edge-runtime compatible (uses Web Crypto only, no Node Buffer).
 *
 * ENV POLICY:
 *   - In production: ADMIN_SESSION_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD
 *     are REQUIRED. Missing any → auth is refused (no silent fallback).
 *   - In development: sensible dev defaults are used with a console warning,
 *     so the site works out of the box without .env.local.
 */

export const ADMIN_COOKIE = 'admin_auth';
export const ADMIN_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days
export const ADMIN_SESSION_MIN_SECRET_LEN = 32;

const DEV_DEFAULTS = {
  secret: 'dev-only-secret-please-set-ADMIN_SESSION_SECRET-before-shipping',
  username: 'admin',
  password: 'dev-password',
} as const;

const IS_PROD = process.env.NODE_ENV === 'production';

let warned = false;
function warnOnce(msg: string) {
  if (warned || IS_PROD) return;
  warned = true;
  // Loud one-time warning in development only.
  // eslint-disable-next-line no-console
  console.warn(`[admin-auth] ${msg}`);
}

/** @returns null if the env is not configured (in prod). In dev, returns defaults. */
function getSecret(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (s && s.length >= ADMIN_SESSION_MIN_SECRET_LEN) return s;
  if (IS_PROD) return null;
  warnOnce(
    'ADMIN_SESSION_SECRET is missing or too short (<32 chars). ' +
      'Using a DEV-ONLY default. Set a real secret before deploying.',
  );
  return DEV_DEFAULTS.secret;
}

function getCreds(): { username: string; password: string } | null {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (username && password) return { username, password };
  if (IS_PROD) return null;
  warnOnce(
    'ADMIN_USERNAME / ADMIN_PASSWORD missing. Using DEV-ONLY defaults ' +
      `(${DEV_DEFAULTS.username} / ${DEV_DEFAULTS.password}). Set them before deploying.`,
  );
  return { username: DEV_DEFAULTS.username, password: DEV_DEFAULTS.password };
}

/**
 * True if the admin auth is fully configured (env vars present in prod,
 * or dev defaults available in dev). Callers can surface a clearer error
 * when this returns false.
 */
export function isAdminAuthConfigured(): boolean {
  return getSecret() !== null && getCreds() !== null;
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** Issues a new signed session token. Throws if auth is not configured. */
export async function signAdminToken(): Promise<string> {
  const secret = getSecret();
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not configured');
  const ts = Date.now().toString();
  const sig = await hmacHex(secret, ts);
  return `${ts}.${sig}`;
}

/** Returns true iff the token is a valid, unexpired admin session. */
export async function verifyAdminToken(token: string | undefined | null): Promise<boolean> {
  const secret = getSecret();
  if (!secret || !token) return false;
  const [tsStr, sig] = token.split('.');
  if (!tsStr || !sig) return false;
  const ts = Number(tsStr);
  if (!Number.isFinite(ts)) return false;
  if (Date.now() - ts > ADMIN_SESSION_MAX_AGE_SEC * 1000) return false;
  const expected = await hmacHex(secret, tsStr);
  return timingSafeEqual(expected, sig);
}

/** Constant-time check of provided credentials against configured creds. */
export function checkCreds(username: string, password: string): boolean {
  const creds = getCreds();
  if (!creds) return false;
  return (
    timingSafeEqual(username, creds.username) && timingSafeEqual(password, creds.password)
  );
}

/**
 * CSRF defence: rejects state-changing requests where the Origin header
 * does not match the Host header. Safe for form posts from our own pages
 * (SameSite=Lax cookies already block most cross-site POSTs; this is belt
 * and braces).
 *
 * @returns null if the request is same-origin or no Origin header was
 *          sent (e.g. curl). Returns an error Response otherwise.
 */
export function assertSameOrigin(request: Request): Response | null {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return null; // Not a browser form-post; skip.
  try {
    if (new URL(origin).host !== host) {
      return new Response(
        JSON.stringify({ error: 'Cross-origin request rejected' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid origin' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}
