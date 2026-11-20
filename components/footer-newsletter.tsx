'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Mail } from 'lucide-react';

/**
 * Compact footer newsletter capture. Shares /api/newsletter/subscribe with
 * the article-end block so it's idempotent across placements.
 */
export function FooterNewsletter() {
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
        body: JSON.stringify({ email: email.trim(), source: 'footer' }),
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

  if (state.kind === 'success') {
    return (
      <p
        role="status"
        aria-live="polite"
        className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-success/10 px-3 py-2 text-[13px] font-medium text-success"
      >
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        Subscribed. You&rsquo;ll get the next brief in your inbox.
      </p>
    );
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-6 flex max-w-sm items-center gap-2" noValidate>
        <label htmlFor="footer-newsletter" className="sr-only">Email address</label>
        <input
          id="footer-newsletter"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="name@domain.com"
          disabled={state.kind === 'pending'}
          className="flex-1 rounded-md bg-white px-3.5 py-2 text-sm text-on-bg placeholder:text-on-surface-muted ghost-border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-70"
        />
        <button
          type="submit"
          aria-label="Subscribe to free scam alerts"
          disabled={state.kind === 'pending'}
          aria-busy={state.kind === 'pending'}
          className="cta-primary inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70"
        >
          {state.kind === 'pending' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Subscribe
        </button>
      </form>
      {state.kind === 'error' && (
        <p role="alert" className="mt-2 text-[12px] text-error">
          {state.msg}
        </p>
      )}
    </>
  );
}
