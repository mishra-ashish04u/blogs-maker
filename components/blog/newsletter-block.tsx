'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Mail, AlertTriangle } from 'lucide-react';

interface Props {
  /** Label passed through to analytics / admin ("article-end", "homepage", etc.) */
  source?: string;
}

/**
 * Article-end newsletter capture. Lives below the author card — placement
 * chosen deliberately: readers who finish an editorial convert several times
 * higher than readers who see a sidebar capture they never read past.
 *
 * Submits to /api/newsletter/subscribe, which handles dedup + reactivation.
 */
export function NewsletterBlock({ source = 'article-end' }: Props) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<
    | { kind: 'idle' }
    | { kind: 'pending' }
    | { kind: 'success' }
    | { kind: 'error'; msg: string }
  >({ kind: 'idle' });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.kind === 'pending' || !email.trim()) return;
    setState({ kind: 'pending' });
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setState({
          kind: 'error',
          msg: data.error ?? `Request failed (${res.status})`,
        });
        return;
      }
      setState({ kind: 'success' });
    } catch (err) {
      setState({
        kind: 'error',
        msg: err instanceof Error ? err.message : 'Network error',
      });
    }
  }

  return (
    <div
      id="newsletter"
      className="relative overflow-hidden rounded-xl p-7 text-white md:p-9"
      style={{ backgroundColor: 'var(--primary)' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -bottom-12 h-48 w-48 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"
      />

      <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            Free scam alerts
          </p>
          <h3 className="mt-3 max-w-xl text-2xl font-bold leading-tight tracking-[-0.02em] text-white md:text-[1.75rem]">
            Get warned about the next scam before it reaches you.
          </h3>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-white/85">
            One short email when a new scam is spreading. No spam, unsubscribe
            in one click.
          </p>
          {state.kind === 'error' && (
            <p
              role="alert"
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-white/15 px-2.5 py-1 text-[12px] font-medium text-white"
            >
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              {state.msg}
            </p>
          )}
        </div>

        {state.kind === 'success' ? (
          <div
            role="status"
            aria-live="polite"
            className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-semibold text-primary"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            You&rsquo;re on the list.
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="flex w-full max-w-sm gap-2 md:w-80"
            noValidate
          >
            <label htmlFor="nl-block-email" className="sr-only">
              Email address
            </label>
            <input
              id="nl-block-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={state.kind === 'pending'}
              placeholder="name@domain.com"
              className="flex-1 rounded-md border border-white/30 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/70 disabled:opacity-70"
            />
            <button
              type="submit"
              disabled={state.kind === 'pending'}
              aria-busy={state.kind === 'pending'}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-md bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-primary transition-colors hover:bg-white/95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {state.kind === 'pending' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : null}
              Subscribe
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
