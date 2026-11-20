import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { SITE } from '@/lib/site';

export const metadata = {
  title: 'Privacy Policy',
  description: `How ${SITE.name} collects and uses data — newsletter subscriptions, analytics, advertising cookies (including Google AdSense), and your privacy rights.`,
  alternates: { canonical: '/privacy' },
};

const LAST_UPDATED = 'November 17, 2026';

const link = 'text-tertiary underline-offset-2 hover:underline';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main id="main">
        <PageHeader
          kicker="Legal"
          title="Privacy"
          accent="Policy."
          subtitle="What data we collect, why, who we share it with, and the choices you have — including how to control advertising cookies."
        />

        <section className="px-6 py-12">
          <div className="mx-auto max-w-3xl space-y-10 text-[15px] leading-relaxed text-on-surface-variant">
            <p className="text-on-surface-muted">Last updated: {LAST_UPDATED}</p>

            <div>
              <h2 className="text-xl font-bold text-on-bg">Who we are</h2>
              <p className="mt-3">
                {SITE.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) runs the website{' '}
                <strong className="text-on-bg">{SITE.domain}</strong>. For any privacy question or
                request, email{' '}
                <a href={`mailto:${SITE.email.privacy}`} className={link}>
                  {SITE.email.privacy}
                </a>
                .
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-on-bg">What we collect</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-on-bg">Newsletter sign-ups:</strong> your email address
                  and when you subscribed, only if you choose to subscribe.
                </li>
                <li>
                  <strong className="text-on-bg">Scam reports and emails:</strong> whatever you
                  choose to send us, such as screenshots of suspicious messages.
                </li>
                <li>
                  <strong className="text-on-bg">Usage analytics:</strong> pages viewed,
                  referring sites, device and browser type, collected in aggregate through Vercel
                  Analytics.
                </li>
                <li>
                  <strong className="text-on-bg">Advertising data:</strong> cookies and similar
                  technologies used by Google and its partners to show and measure ads (see
                  below).
                </li>
                <li>
                  <strong className="text-on-bg">Server logs:</strong> standard technical logs
                  (address requested, time, browser type) kept for a short time to keep the site
                  secure.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-on-bg">Advertising and Google AdSense</h2>
              <p className="mt-3">
                This site may show ads provided by Google AdSense. Third-party vendors, including
                Google, use cookies to serve ads based on your previous visits to this website and
                other websites. Google&rsquo;s use of advertising cookies enables it and its
                partners to serve ads to you based on your visits to this site and/or other sites
                on the internet.
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>
                  You can opt out of personalised advertising by visiting Google&rsquo;s{' '}
                  <a href="https://myadcenter.google.com/" className={link} rel="noopener noreferrer" target="_blank">
                    My Ad Center
                  </a>
                  .
                </li>
                <li>
                  You can opt out of some third-party vendors&rsquo; use of cookies for
                  personalised advertising at{' '}
                  <a href="https://www.aboutads.info/choices/" className={link} rel="noopener noreferrer" target="_blank">
                    aboutads.info
                  </a>{' '}
                  or, in Europe,{' '}
                  <a href="https://www.youronlinechoices.eu/" className={link} rel="noopener noreferrer" target="_blank">
                    youronlinechoices.eu
                  </a>
                  .
                </li>
                <li>
                  Learn more in{' '}
                  <a
                    href="https://policies.google.com/technologies/partner-sites"
                    className={link}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    How Google uses information from sites or apps that use its services
                  </a>
                  .
                </li>
              </ul>
              <p className="mt-3">
                If you visit from the European Economic Area, the UK or Switzerland, we ask for
                your consent before personalised ads or non-essential cookies are used, and you
                can change your choice at any time.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-on-bg">How we use your data</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>To send the scam-alert emails you signed up for.</li>
                <li>To read and act on scam reports and messages you send us.</li>
                <li>To understand which articles are useful and improve the site.</li>
                <li>To show advertising that keeps the site free to read.</li>
              </ul>
              <p className="mt-3">
                We do not sell your personal data, and we never share our subscriber list.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-on-bg">Service providers</h2>
              <p className="mt-3">
                We use trusted providers to run the site: Vercel (hosting and analytics), Supabase
                (database for subscriber records), our email provider (sending newsletters) and
                Google (advertising). They process data only to provide their service to us.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-on-bg">Cookies</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-on-bg">Essential:</strong> remember your light/dark
                  theme choice, and keep site editors signed in to the admin area.
                </li>
                <li>
                  <strong className="text-on-bg">Advertising:</strong> set by Google and its
                  partners as described above.
                </li>
              </ul>
              <p className="mt-3">
                You can block or delete cookies in your browser settings. The site still works
                without advertising cookies.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-on-bg">Your rights</h2>
              <p className="mt-3">
                Depending on where you live (for example under India&rsquo;s Digital Personal Data
                Protection Act, the EU/UK GDPR, or US state privacy laws), you can:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Ask for a copy of the personal data we hold about you.</li>
                <li>Ask us to correct or delete it.</li>
                <li>
                  Unsubscribe from emails at any time using the link in every email, or at{' '}
                  <Link href="/unsubscribe" className={link}>
                    /unsubscribe
                  </Link>
                  .
                </li>
                <li>Withdraw consent you have given, including for advertising cookies.</li>
                <li>Complain to your local data-protection authority.</li>
              </ul>
              <p className="mt-3">
                Email{' '}
                <a href={`mailto:${SITE.email.privacy}`} className={link}>
                  {SITE.email.privacy}
                </a>{' '}
                and we will respond within 30 days.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-on-bg">Children</h2>
              <p className="mt-3">
                This site is intended for adults. We do not knowingly collect personal data from
                children under 16. If you believe a child has sent us personal data, contact us
                and we will delete it.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-on-bg">Changes to this policy</h2>
              <p className="mt-3">
                If we change this policy, we will update the date at the top of this page. For
                significant changes we will also tell newsletter subscribers.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
