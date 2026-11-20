import Link from 'next/link';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { unsubscribeByToken } from '@/lib/newsletter';
import { SITE } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Unsubscribe',
  robots: { index: false, follow: false },
};

/**
 * Server-side unsubscribe confirmation page.
 *
 * Processes the token synchronously so the user sees the result immediately
 * even if JavaScript is disabled (some email-reading contexts block JS).
 * Idempotent — revisiting the same link just says "already off the list".
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token
    ? await unsubscribeByToken(token)
    : { ok: false as const, error: 'Missing unsubscribe token.' };

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main id="main" className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-lg rounded-2xl bg-surface-lowest p-10 text-center shadow-ambient-sm ghost-border">
          {result.ok ? (
            <>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              </span>
              <h1 className="mt-6 text-2xl font-extrabold leading-tight tracking-[-0.025em] text-on-bg md:text-[1.75rem]">
                You&rsquo;ve been unsubscribed.
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-on-surface-variant">
                {result.email
                  ? `We won't send ${SITE.newsletterName} to ${result.email} anymore.`
                  : `We won't send you ${SITE.newsletterName} anymore.`}
                {' '}You can re-subscribe any time from the site.
              </p>
            </>
          ) : (
            <>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-error/15 text-error">
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              </span>
              <h1 className="mt-6 text-2xl font-extrabold leading-tight tracking-[-0.025em] text-on-bg md:text-[1.75rem]">
                Couldn&rsquo;t process that link.
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-on-surface-variant">
                {result.error ?? 'The unsubscribe link is invalid or expired.'}{' '}
                If you want to stop receiving {SITE.newsletterName}, reply to any
                of our emails and we&rsquo;ll remove you manually.
              </p>
            </>
          )}
          <div className="mt-8">
            <Link
              href="/"
              className="cta-primary inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-[12px] uppercase tracking-[0.14em]"
            >
              Back to {SITE.name}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
