import Link from 'next/link';
import { ArrowUpRight, ShieldAlert } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { SITE } from '@/lib/site';

export const metadata = {
  title: 'Contact Us',
  description: `Contact ${SITE.name} to report a scam, request a correction, or ask a general question.`,
  alternates: { canonical: '/contact' },
};

const channels = [
  {
    label: 'Report a scam',
    value: SITE.email.reports,
    body: 'Received a suspicious text, call, email or website? Send it to us so we can warn others.',
    href: '/submit-tip',
    hrefLabel: 'How to report',
  },
  {
    label: 'General & corrections',
    value: SITE.email.contact,
    body: 'Questions, feedback, corrections to an article, and advertising or partnership enquiries.',
  },
  {
    label: 'Privacy requests',
    value: SITE.email.privacy,
    body: 'Access, correct or delete the personal data we hold about you (for example, your newsletter subscription).',
    href: '/privacy',
    hrefLabel: 'Privacy policy',
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main id="main">
        <PageHeader
          kicker="Contact"
          title="Get in"
          accent="touch."
          subtitle="We read every message. Pick the right address below so your note reaches us quickly."
        />

        <section className="px-6 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {channels.map((ch) => (
                <div
                  key={ch.label}
                  className="rounded-xl border border-outline-variant bg-surface-lowest p-6"
                >
                  <p className="label-overline">{ch.label}</p>
                  <a
                    href={`mailto:${ch.value}`}
                    className="mt-3 block break-all text-lg font-semibold text-on-bg hover:text-primary"
                  >
                    {ch.value}
                  </a>
                  <p className="mt-3 text-[14px] leading-relaxed text-on-surface-variant">
                    {ch.body}
                  </p>
                  {ch.href && (
                    <Link
                      href={ch.href}
                      className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-primary hover:text-primary-hover"
                    >
                      {ch.hrefLabel}
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Important safety notice */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-start gap-4 rounded-xl bg-surface-container p-6 md:p-8">
              <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
              <div className="max-w-3xl text-[15px] leading-relaxed text-on-surface-variant">
                <p className="font-semibold text-on-bg">Lost money to a scam? Act now — don&rsquo;t wait for our reply.</p>
                <p className="mt-2">
                  Call your bank or card provider immediately using the number on the back of your
                  card, then report the crime to your local police or national fraud-reporting
                  service. We are an information site: we cannot recover money, investigate cases,
                  or contact scammers for you. Anyone who contacts you claiming they can recover
                  your money for a fee is very likely running a second scam.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
