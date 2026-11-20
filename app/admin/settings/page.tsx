import { CheckCircle2, XCircle } from 'lucide-react';
import { CATEGORIES, SITE } from '@/lib/site';
import { isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { isNewsletterConfigured } from '@/lib/newsletter';

export const dynamic = 'force-dynamic';

/**
 * Read-only settings overview. Brand values live in lib/site.ts and secrets
 * in environment variables, so this page shows what is configured rather
 * than offering inputs that could not be saved.
 */
export default function AdminSettingsPage() {
  const brand: Array<[string, string]> = [
    ['Site name', SITE.name],
    ['Tagline', SITE.tagline],
    ['Domain', SITE.domain],
    ['Author byline', SITE.author],
    ['Contact email', SITE.email.contact],
    ['Scam reports email', SITE.email.reports],
    ['Privacy email', SITE.email.privacy],
    ['Categories', CATEGORIES.join(' · ')],
  ];

  const services: Array<[string, boolean, string]> = [
    ['Database (Supabase)', isSupabaseAdminConfigured(), 'NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'],
    ['Email newsletter (SMTP)', isNewsletterConfigured(), 'SMTP_HOST, SMTP_USER, SMTP_PASSWORD'],
    ['Live-site cache refresh', Boolean(process.env.SITE_URL && process.env.REVALIDATE_SECRET), 'SITE_URL, REVALIDATE_SECRET'],
    ['AI writer (Groq or Gemini)', Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY), 'GROQ_API_KEY or GEMINI_API_KEY'],
  ];

  return (
    <div className="space-y-12">
      <div>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-1.5 w-8 rounded-full bg-gradient-signature" aria-hidden="true" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary-ink">
            Settings
          </p>
        </div>
        <h1 className="mt-4 font-playfair text-4xl font-semibold tracking-tight text-on-bg md:text-[3rem]">
          Site Settings.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
          Brand details are set in <code className="font-mono text-[12px]">lib/site.ts</code>.
          API keys and passwords are environment variables (<code className="font-mono text-[12px]">.env.local</code>{' '}
          locally, project settings on your host) and are never shown here.
        </p>
      </div>

      <section className="rounded-2xl bg-surface-lowest p-6 shadow-ambient-sm md:p-8">
        <header className="mb-6">
          <h2 className="accent-bar font-playfair text-xl font-semibold text-on-bg">Brand</h2>
        </header>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
          {brand.map(([label, value]) => (
            <div key={label}>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                {label}
              </dt>
              <dd className="mt-1 break-words text-sm text-on-bg">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-2xl bg-surface-lowest p-6 shadow-ambient-sm md:p-8">
        <header className="mb-6">
          <h2 className="accent-bar font-playfair text-xl font-semibold text-on-bg">Connected services</h2>
        </header>
        <ul className="divide-y divide-outline-variant">
          {services.map(([label, ok, vars]) => (
            <li key={label} className="flex items-start gap-3 py-3">
              {ok ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-muted" aria-hidden="true" />
              )}
              <div>
                <p className="text-sm font-semibold text-on-bg">
                  {label}{' '}
                  <span className={`font-normal ${ok ? 'text-success' : 'text-on-surface-muted'}`}>
                    — {ok ? 'configured' : 'not configured'}
                  </span>
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-on-surface-muted">{vars}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
