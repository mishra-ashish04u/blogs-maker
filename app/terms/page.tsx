import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { SITE } from '@/lib/site';

export const metadata = {
  title: 'Terms of Use',
  description: `The terms for using ${SITE.name}: information-only content, copyright and reuse, scam reports you send us, and links to other sites.`,
  alternates: { canonical: '/terms' },
};

const LAST_UPDATED = 'November 17, 2026';

const link = 'text-tertiary underline-offset-2 hover:underline';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main id="main">
        <PageHeader
          kicker="Legal"
          title="Terms of"
          accent="Use."
          subtitle={`The rules for reading, subscribing to, and sending reports to ${SITE.name}.`}
        />

        <section className="px-6 py-12">
          <div className="mx-auto max-w-3xl space-y-10 text-[15px] leading-relaxed text-on-surface-variant">
            <p className="text-on-surface-muted">Last updated: {LAST_UPDATED}</p>

            <div>
              <h2 className="text-xl font-bold text-on-bg">1. Agreement</h2>
              <p className="mt-3">
                By using {SITE.domain} (&ldquo;the site&rdquo;) you agree to these terms. If you do
                not agree, please do not use the site.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-on-bg">2. Information only — not professional advice</h2>
              <p className="mt-3">
                Our articles are general information to help people recognise and avoid scams.
                They are <strong className="text-on-bg">not</strong> legal, financial or
                professional advice for your situation. Scams change quickly; always confirm with
                your bank, the official company or the police before acting.
              </p>
              <p className="mt-3">
                We work hard to be accurate and correct mistakes when we find them (see our{' '}
                <Link href="/ethics" className={link}>editorial policy</Link>), but we cannot
                guarantee that every article is complete or up to date, and we are not liable for
                losses resulting from reliance on the site.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-on-bg">3. Copyright and sharing</h2>
              <p className="mt-3">
                Articles on this site are &copy; {new Date().getFullYear()} {SITE.name}. You are
                welcome to:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Share links to any article.</li>
                <li>Quote short excerpts with credit and a link to the original article.</li>
                <li>Print or forward an alert to warn family, friends or colleagues.</li>
              </ul>
              <p className="mt-3">
                Copying whole articles to another website requires our written permission —
                email{' '}
                <a href={`mailto:${SITE.email.contact}`} className={link}>
                  {SITE.email.contact}
                </a>
                .
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-on-bg">4. Scam reports you send us</h2>
              <p className="mt-3">
                When you send us a scam report, you allow us to use the details (for example the
                wording of a scam message or a screenshot with your personal details removed) to
                warn others. We never publish your name or contact details.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-on-bg">5. Email alerts</h2>
              <p className="mt-3">
                Email alerts are free. Every email has a one-click unsubscribe link, or you can
                visit{' '}
                <Link href="/unsubscribe" className={link}>/unsubscribe</Link>. We may change or stop
                the alerts at any time.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-on-bg">6. Advertising and links to other sites</h2>
              <p className="mt-3">
                The site shows advertising and links to other websites, including official
                agencies and product pages. We do not control those sites and are not responsible
                for their content, offers or privacy practices. An ad appearing on our site is not
                an endorsement.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-on-bg">7. Acceptable use</h2>
              <p className="mt-3">You agree not to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Copy the site in bulk or scrape it in a way that slows it down for others.</li>
                <li>Use the site to spread malware, spam or scams.</li>
                <li>Pretend to be {SITE.name} or our team.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-on-bg">8. Governing law</h2>
              <p className="mt-3">These terms are governed by the laws of India.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-on-bg">9. Changes</h2>
              <p className="mt-3">
                We may update these terms. The date at the top of this page shows the latest
                version.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-on-bg">10. Contact</h2>
              <p className="mt-3">
                Questions about these terms:{' '}
                <a href={`mailto:${SITE.email.contact}`} className={link}>
                  {SITE.email.contact}
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
