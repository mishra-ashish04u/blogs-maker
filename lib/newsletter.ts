/**
 * Newsletter subscribe + dispatch helpers.
 *
 * Transport: plain SMTP via nodemailer, configured for Hostinger mail
 * (or any standards-compliant SMTP server — Gmail / Zoho / etc. also work).
 *
 * Responsibilities:
 *   1. Email validation + idempotent subscription (upsert, reactivate on re-subscribe)
 *   2. Unsubscribe token verification
 *   3. Dispatching a daily-brief email to every active subscriber
 *      via a pooled SMTP connection, with bounded concurrency + per-email
 *      error tolerance.
 *
 * Environment:
 *   - SMTP_HOST          e.g. "smtp.hostinger.com"
 *   - SMTP_PORT          465 (SSL) or 587 (STARTTLS). Defaults to 465.
 *   - SMTP_USER          mailbox login, e.g. "brief@your-domain.com"
 *   - SMTP_PASSWORD      mailbox password / app password
 *   - NEWSLETTER_FROM    optional display override, e.g. "Daily Scam Alert <alerts@x.com>"
 *                        defaults to SMTP_USER if unset.
 *   - NEWSLETTER_REPLY_TO optional
 *   - SITE_URL           used to build absolute post + unsubscribe URLs.
 */

import nodemailer, { type Transporter } from 'nodemailer';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { SubscriberRow } from '@/lib/supabase/types';
import { buildDailyBriefEmail } from '@/lib/newsletter-template';
import { SITE } from '@/lib/site';

// Minimal but strict email regex. Rejects most garbage without pretending to
// be a full RFC 5322 parser (nobody writes those right).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  return EMAIL_REGEX.test(email);
}

export function isNewsletterConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD,
  );
}

let cachedTransport: Transporter | null = null;

/**
 * Pooled SMTP transport. Reuses one TLS handshake for a batch of emails,
 * which matters because Hostinger (and most shared SMTP hosts) rate-limit
 * per-connection and per-hour.
 */
function getTransport(): Transporter {
  if (cachedTransport) return cachedTransport;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) {
    throw new Error('SMTP_HOST / SMTP_USER / SMTP_PASSWORD must be set');
  }

  const port = Number(process.env.SMTP_PORT || 465);
  // Default: implicit TLS on 465, STARTTLS on 587. Can be overridden.
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === 'true'
    : port === 465;

  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    pool: true,
    maxConnections: 3,      // Hostinger is fine with a few parallel streams.
    maxMessages: 100,       // Reconnect after 100 messages per socket.
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  });

  return cachedTransport;
}

/** Generates a long random token for unsubscribe links. */
export function generateUnsubscribeToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface SubscribeResult {
  ok: boolean;
  /** True when this call actually created a new row (vs reactivating). */
  created: boolean;
  error?: string;
}

/**
 * Idempotent subscribe: inserts the email if new, or reactivates + rotates
 * the unsubscribe token if the email was previously unsubscribed.
 */
export async function subscribe(
  emailRaw: string,
  source?: string,
): Promise<SubscribeResult> {
  const email = emailRaw.trim().toLowerCase();
  if (!isValidEmail(email)) {
    return { ok: false, created: false, error: 'Invalid email address' };
  }

  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from('subscribers')
    .select('id, status')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    if (existing.status !== 'active') {
      const { error } = await supabase
        .from('subscribers')
        .update({
          status: 'active',
          unsubscribe_token: generateUnsubscribeToken(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      if (error) return { ok: false, created: false, error: error.message };
    }
    return { ok: true, created: false };
  }

  const token = generateUnsubscribeToken();
  const { error } = await supabase.from('subscribers').insert({
    email,
    status: 'active',
    unsubscribe_token: token,
    source: source ?? null,
  });
  if (error) return { ok: false, created: false, error: error.message };
  return { ok: true, created: true };
}

export async function unsubscribeByToken(
  token: string,
): Promise<{ ok: boolean; email?: string; error?: string }> {
  if (!token || token.length < 16) {
    return { ok: false, error: 'Invalid token' };
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('subscribers')
    .update({
      status: 'unsubscribed',
      updated_at: new Date().toISOString(),
    })
    .eq('unsubscribe_token', token)
    .select('email')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'No matching subscription found' };
  return { ok: true, email: data.email };
}

export async function listActiveSubscribers(): Promise<SubscriberRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('subscribers')
    .select('*')
    .eq('status', 'active');
  if (error) throw new Error(`listActiveSubscribers: ${error.message}`);
  return (data as SubscriberRow[]) ?? [];
}

export interface DailyBriefPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  readTime: number;
  coverImage: string;
  date: string;
}

export interface DispatchResult {
  attempted: number;
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Send one email. Isolated so per-email failures don't kill the batch.
 * Returns ok:true on 2xx SMTP response.
 */
async function sendOne(
  transporter: Transporter,
  args: {
    from: string;
    to: string;
    replyTo?: string;
    subject: string;
    html: string;
    text: string;
    unsubscribeUrl: string;
  },
): Promise<{ ok: boolean; error?: string }> {
  try {
    await transporter.sendMail({
      from: args.from,
      to: args.to,
      replyTo: args.replyTo,
      subject: args.subject,
      html: args.html,
      text: args.text,
      headers: {
        // RFC 8058 one-click unsubscribe. Gmail / Apple Mail surface this.
        'List-Unsubscribe': `<${args.unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        // Help some filters identify us as the transactional sender we are.
        'X-Mailer': `${SITE.name} Alerts`,
      },
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown SMTP error',
    };
  }
}

/**
 * Sends a daily-brief email to every active subscriber for one post.
 *
 * Runs with bounded concurrency (default 4 in flight). One bad address
 * doesn't stall the rest of the batch. Returns a summary the caller can
 * stash into automation_runs.logs.
 */
export async function dispatchDailyBrief(
  post: DailyBriefPost,
  opts: { concurrency?: number } = {},
): Promise<DispatchResult> {
  const subscribers = await listActiveSubscribers();
  const result: DispatchResult = {
    attempted: subscribers.length,
    sent: 0,
    failed: 0,
    errors: [],
  };
  if (subscribers.length === 0) return result;

  if (!isNewsletterConfigured()) {
    result.failed = subscribers.length;
    result.errors.push(
      'SMTP not configured (SMTP_HOST / SMTP_USER / SMTP_PASSWORD missing) — dispatch skipped',
    );
    return result;
  }

  const transporter = getTransport();
  const from = process.env.NEWSLETTER_FROM || process.env.SMTP_USER!;
  const replyTo = process.env.NEWSLETTER_REPLY_TO;
  const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '');
  const postUrl = siteUrl ? `${siteUrl}/blog/${post.slug}` : `/blog/${post.slug}`;

  // Verify the transport once up-front. Saves minutes if creds are wrong
  // and the list is long — fails fast with a clean error.
  try {
    await transporter.verify();
  } catch (err) {
    result.failed = subscribers.length;
    result.errors.push(
      `SMTP verify failed: ${err instanceof Error ? err.message : 'unknown error'}`,
    );
    return result;
  }

  const concurrency = Math.max(1, Math.min(opts.concurrency ?? 4, 10));
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  // Simple pool: slice the list into a queue, spin up N workers that each
  // pull the next subscriber until empty.
  let cursor = 0;
  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= subscribers.length) return;
      const sub = subscribers[i];
      const unsubscribeUrl = siteUrl
        ? `${siteUrl}/unsubscribe?token=${sub.unsubscribe_token}`
        : `/unsubscribe?token=${sub.unsubscribe_token}`;
      const { html, text, subject } = buildDailyBriefEmail({
        post,
        postUrl,
        unsubscribeUrl,
      });

      const outcome = await sendOne(transporter, {
        from,
        to: sub.email,
        replyTo,
        subject,
        html,
        text,
        unsubscribeUrl,
      });

      if (outcome.ok) {
        result.sent++;
        // Record last_sent_at best-effort; failure here shouldn't fail dispatch.
        await supabase
          .from('subscribers')
          .update({ last_sent_at: now })
          .eq('id', sub.id)
          .then(() => undefined, () => undefined);
      } else {
        result.failed++;
        // Cap the stored error list — an entire list of bounces would blow
        // up the logs column otherwise.
        if (result.errors.length < 20) {
          result.errors.push(`${sub.email}: ${outcome.error}`);
        }
      }
    }
  }

  try {
    await Promise.all(
      Array.from({ length: concurrency }, () => worker()),
    );
  } finally {
    // Close the pool so the process can exit cleanly (GitHub Actions
    // runners otherwise wait on dangling sockets).
    transporter.close();
    cachedTransport = null;
  }

  return result;
}
