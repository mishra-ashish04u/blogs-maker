import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { SITE } from '@/lib/site';

export const metadata = {
  title: 'About Us',
  description: `${SITE.name} explains the scams going around right now in plain English, and shows you how to protect your money, accounts and family.`,
  alternates: { canonical: '/about' },
};

const principles = [
  {
    title: 'Plain English, always',
    body: 'No jargon and no scare tactics. If a warning cannot be understood by someone who is not “good with computers”, we rewrite it until it can.',
  },
  {
    title: 'Practical steps first',
    body: 'Every alert ends with what to do: how to check if a message is real, how to report it, and what to do if you have already been caught out.',
  },
  {
    title: 'Checked before published',
    body: 'We work from official sources — consumer-protection agencies, banks, police and the companies being impersonated — and a person reviews every article before it goes live.',
  },
  {
    title: 'Independent advice',
    body: 'Advertising keeps the site free, but advertisers never decide what we write. If we ever recommend a product, we say why — and say so when we earn from it.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main id="main">
        <PageHeader
          kicker={`About ${SITE.name}`}
          title="Helping everyday people"
          accent="spot scams in time."
          subtitle={`${SITE.name} is a free, independent site that explains the scams going around right now — and exactly how to stay safe from them.`}
        />

        {/* Mission */}
        <section className="px-6 py-16 md:py-20">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="label-overline">Why we exist</p>
            </div>
            <div className="md:col-span-8">
              <p className="font-playfair text-2xl leading-snug text-on-bg md:text-[2rem]">
                Scammers change their tricks every week. Most people only hear about a new scam
                after someone they know has lost money to it.
              </p>
              <p className="mt-6 text-[15px] leading-relaxed text-on-surface-variant">
                We want to change that. Each day we pick the scams that are actually reaching
                people — fake delivery texts, bank impersonation calls, investment and romance
                fraud, fake shops — and explain how they work, how to recognise them, and what to
                do next. Our guides are written for everyone, including parents and grandparents
                who are targeted the most.
              </p>
            </div>
          </div>
        </section>

        {/* Principles */}
        <section className="px-6 py-10">
          <div className="mx-auto max-w-7xl">
            <header className="mb-10">
              <h2 className="accent-bar font-playfair text-2xl font-semibold text-on-bg">
                What you can expect from us
              </h2>
            </header>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {principles.map((p, i) => (
                <div
                  key={p.title}
                  className="group relative overflow-hidden rounded-2xl bg-surface-lowest p-8 shadow-ambient-sm transition-transform hover:-translate-y-0.5"
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-1 bg-gradient-signature opacity-0 transition-opacity group-hover:opacity-100"
                  />
                  <p className="font-playfair text-5xl font-bold text-gradient-signature">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-4 font-playfair text-xl font-semibold text-on-bg">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How we publish */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <header className="mb-10">
              <h2 className="accent-bar text-2xl font-bold text-on-bg">How we write our articles</h2>
            </header>

            <div className="rounded-2xl bg-surface-lowest p-8 shadow-ambient-sm md:p-10">
              <div className="flex items-start gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {SITE.monogram}
                </div>
                <div>
                  <p className="label-overline">{SITE.author}</p>
                  <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-on-surface-variant">
                    Articles are published under the <strong className="text-on-bg">{SITE.author}</strong>{' '}
                    byline. We follow official warnings and trusted reporting on new scams, and we
                    read the scam reports our readers send in.
                  </p>
                  <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-on-surface-variant">
                    We use AI writing tools to help draft some articles. A person checks every
                    article against its sources and edits it before it is published, and we never
                    invent victims, quotes or numbers.
                  </p>
                  <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-on-surface-variant">
                    Spotted a mistake? Tell us and we will fix it — see our{' '}
                    <Link href="/ethics" className="text-tertiary underline-offset-2 hover:underline">
                      editorial policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-2xl bg-surface-container p-8 shadow-ambient-sm md:p-12">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-signature opacity-20 blur-3xl"
              />
              <div className="relative grid grid-cols-1 items-start gap-8 md:grid-cols-2">
                <div>
                  <p className="label-overline">Get in touch</p>
                  <h3 className="mt-3 font-playfair text-3xl font-semibold tracking-tight text-on-bg md:text-[2.25rem]">
                    Seen a scam we should warn people about?
                  </h3>
                  <p className="mt-4 max-w-md text-[15px] leading-relaxed text-on-surface-variant">
                    Your report could stop the next person from being caught out. We read every
                    message.
                  </p>
                </div>
                <div className="space-y-4 text-sm text-on-surface-variant">
                  {[
                    { label: 'Report a scam', value: SITE.email.reports, href: '/submit-tip' },
                    { label: 'General enquiries', value: SITE.email.contact, href: '/contact' },
                  ].map((row) => (
                    <Link
                      key={row.label}
                      href={row.href}
                      className="block rounded-xl bg-surface-lowest p-4 shadow-ambient-sm transition-colors hover:text-primary"
                    >
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-primary-ink">
                        {row.label}
                      </span>
                      <span className="mt-1 block break-all text-on-bg">{row.value}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
