import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { SITE } from '@/lib/site';

export const metadata = {
  title: 'Editorial Policy',
  description: `How ${SITE.name} researches and writes articles, uses AI tools, handles corrections, and keeps advertising separate from editorial decisions.`,
  alternates: { canonical: '/ethics' },
};

const pillars = [
  {
    title: 'Where our information comes from',
    body: 'We base alerts on official warnings from consumer-protection agencies, police and banks, statements from the companies being impersonated, trusted news reporting, and scam examples sent in by readers. We link to the original source wherever we can.',
  },
  {
    title: 'Human review of every article',
    body: 'We use AI writing tools to help draft some articles. Every article is read, fact-checked against its sources and edited by a person before it is published. We never invent victims, quotes, statistics or case details.',
  },
  {
    title: 'Advertising',
    body: 'This site is free to read because it shows ads, including ads served by Google. Advertisers have no say over what we write, and we never accept payment to cover, or avoid covering, a company or product.',
  },
  {
    title: 'Product recommendations',
    body: 'When we recommend a security tool, we explain why. Some links to products may be affiliate links, which means we may earn a small commission at no extra cost to you. When an article contains affiliate links, we say so at the top of that article.',
  },
  {
    title: 'Corrections',
    body: 'When we get something wrong, we correct it in the article and add a dated note explaining what changed. We do not quietly rewrite published warnings.',
  },
  {
    title: 'Not personal advice',
    body: 'Our articles are general information to help you recognise and avoid scams. They are not legal, financial or professional advice for your specific situation. If you have lost money, contact your bank and the police straight away.',
  },
];

export default function EthicsPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main id="main">
        <PageHeader
          kicker="How we work"
          title="Editorial"
          accent="Policy."
          subtitle="How we research and write our articles, how we use AI tools, and how we keep advertising separate from what we publish."
        />

        <section className="px-6 py-14">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {pillars.map((p, i) => (
                <div
                  key={p.title}
                  className="rounded-xl border border-outline-variant bg-surface-lowest p-7"
                >
                  <p className="label-overline">{String(i + 1).padStart(2, '0')}</p>
                  <h2 className="mt-3 text-xl font-bold tracking-[-0.015em] text-on-bg">{p.title}</h2>
                  <p className="mt-3 text-[14px] leading-relaxed text-on-surface-variant">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto max-w-3xl rounded-2xl border border-outline-variant bg-surface-lowest p-8 md:p-10">
            <p className="label-overline">Found a mistake?</p>
            <p className="mt-4 text-[15px] leading-relaxed text-on-surface-variant">
              If you think an article is wrong or out of date, email us at{' '}
              <a
                href={`mailto:${SITE.email.contact}`}
                className="text-tertiary underline-offset-2 hover:underline"
              >
                {SITE.email.contact}
              </a>{' '}
              with the article link. We will either correct it or explain why we think it is
              accurate.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
