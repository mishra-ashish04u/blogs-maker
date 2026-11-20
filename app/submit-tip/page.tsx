import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { Camera, Mail, ShieldAlert, EyeOff } from 'lucide-react';
import { SITE } from '@/lib/site';

export const metadata = {
  title: 'Report a Scam',
  description: `Send ${SITE.name} a scam text, call, email or website so we can warn others — and find out what to do if you have already lost money.`,
  alternates: { canonical: '/submit-tip' },
};

const guidelines = [
  {
    icon: Camera,
    title: 'What to send',
    body: 'A screenshot of the message or website, the sender’s number or email address, the date you received it, and a sentence on what it asked you to do.',
  },
  {
    icon: EyeOff,
    title: 'Hide your own details',
    body: 'Cover your name, phone number, address and any account or card numbers before sending screenshots. Never send passwords or one-time codes.',
  },
  {
    icon: ShieldAlert,
    title: 'What happens next',
    body: 'We check reports against official warnings. If a scam is new or spreading, we publish an alert. We never publish your name or contact details.',
  },
];

export default function ReportScamPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main id="main">
        <PageHeader
          kicker="Report a Scam"
          title="Help us warn"
          accent="everyone else."
          subtitle="Received a suspicious text, call, email or website? Send it to us. Your report helps the next person recognise it in time."
        />

        {/* Lost money first */}
        <section className="px-6 pt-14">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-2xl border border-error/30 bg-error/5 p-6 md:p-8">
              <p className="label-overline text-error">Already lost money or shared details?</p>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-on-surface-variant">
                <li>
                  <strong className="text-on-bg">Call your bank or card provider now</strong> using
                  the number on the back of your card. Fast action gives the best chance of
                  stopping a payment.
                </li>
                <li>
                  <strong className="text-on-bg">Change passwords</strong> for any account you
                  entered on the scam site, starting with your email.
                </li>
                <li>
                  <strong className="text-on-bg">Report it</strong> to your local police or
                  national fraud-reporting service.
                </li>
              </ol>
              <p className="mt-4 text-[13px] text-on-surface-muted">
                We are an information site and cannot recover money. Be wary of anyone who
                contacts you offering to get your money back for a fee.
              </p>
            </div>
          </div>
        </section>

        {/* Channel */}
        <section className="px-6 py-14">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-xl border border-outline-variant bg-surface-lowest p-8">
              <Mail className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-bold tracking-[-0.015em] text-on-bg">
                Email your report
              </h2>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-on-surface-variant">
                Forward the suspicious email, or attach screenshots of texts, chats or websites.
                Do not click any links in the message to collect more information.
              </p>
              <a
                href={`mailto:${SITE.email.reports}?subject=${encodeURIComponent('Scam report')}`}
                className="mt-5 inline-block break-all text-lg font-semibold text-on-bg hover:text-primary"
              >
                {SITE.email.reports}
              </a>
            </div>
          </div>
        </section>

        {/* Guidelines */}
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-7xl">
            <header className="mb-8">
              <h2 className="accent-bar text-2xl font-bold text-on-bg">Before you send</h2>
            </header>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {guidelines.map((g) => {
                const Icon = g.icon;
                return (
                  <div
                    key={g.title}
                    className="rounded-xl border border-outline-variant bg-surface-lowest p-6"
                  >
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    <h3 className="mt-3 text-base font-bold tracking-[-0.015em] text-on-bg">
                      {g.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-on-surface-variant">{g.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
