import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { FooterNewsletter } from '@/components/footer-newsletter';
import { getAllPosts } from '@/lib/blog-data';
import { siteJsonLd } from '@/lib/seo';
import { CATEGORIES, CATEGORY_INFO, categorySlug } from '@/lib/site';

// Uniform overlay pill style for images (Duration-style: white pill, dark text)
const OVERLAY_PILL =
  'inline-flex rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-bg shadow-ambient-sm';

// Upper-case "MMM D, YYYY" meta — matches the "AUG 30, 2025" style
function formatMeta(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date.toUpperCase();
  return parsed
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}

export const revalidate = 300;

export default async function Home() {
  const all = await getAllPosts();
  const featured = all[0];

  // Distribute posts across sections without reuse where possible.
  // heroTeasers: 3 small strip cards above the cover
  // highlightMain: first card of "Today's highlight"
  // highlightSide: 3 stacked cards next to highlightMain
  // latest: up to 6 cards in the bottom grid
  // Post distribution — robust to any archive size. Each section pulls from
  // what's left; sections with too few posts collapse gracefully.
  const heroTeasers = all.slice(1, 4);
  const highlightMain = all[4] ?? null;
  const highlightSide = all.slice(5, 8);
  // Latest grid wants 6. If we don't have 14+ posts, widen the window so the
  // grid fills (acceptable overlap with side cards since they're visually
  // distinct sections).
  const latest =
    all.length >= 14
      ? all.slice(8, 14)
      : all.slice(Math.max(1, all.length - 6));
  const showHighlight = !!highlightMain;

  // A representative cover image per category so "Browse by topic" has visuals
  // without introducing new assets.
  const categoryCards = CATEGORIES.map((cat) => {
    const match = all.find((p) => p.category === cat);
    return {
      cat,
      image: match?.coverImage ?? featured.coverImage,
    };
  });

  const jsonLd = siteJsonLd();

  return (
    <div className="min-h-screen bg-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <main id="main">
        {/* ===========================================================
            HERO — 3-teaser strip + large featured cover with overlay
            =========================================================== */}
        <section className="px-6 pt-10 md:pt-14">
          <div className="mx-auto max-w-7xl">
            {heroTeasers.length > 0 && (
              <ol className="grid grid-cols-1 divide-y divide-outline-variant md:grid-cols-3 md:divide-x md:divide-y-0">
                {heroTeasers.map((post) => (
                  <li
                    key={post.slug}
                    className="py-5 md:px-6 md:py-2 first:md:pl-0 last:md:pr-0"
                  >
                    <Link href={`/blog/${post.slug}`} className="group flex items-start gap-4">
                      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md bg-surface-container">
                        <Image
                          src={post.coverImage}
                          alt=""
                          fill
                          sizes="112px"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-muted">
                          {formatMeta(post.date)} · {post.readTime} min read
                        </p>
                        <h3 className="mt-1.5 line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.015em] text-on-bg transition-colors group-hover:text-primary">
                          {post.title}
                        </h3>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>

        {/* Featured cover — magazine-style with overlay title */}
        <section className="px-6 pt-8 md:pt-10">
          <div className="mx-auto max-w-7xl">
            <Link
              href={`/blog/${featured.slug}`}
              className="group relative block aspect-[16/9] w-full overflow-hidden rounded-xl bg-surface-container md:aspect-[16/8]"
              aria-label={`Read: ${featured.title}`}
            >
              <Image
                src={featured.coverImage}
                alt={featured.title}
                fill
                sizes="(min-width:1280px) 80rem, 100vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                priority
              />
              {/* Bottom gradient for overlay-text legibility */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/40 to-transparent"
              />
              <span className={`absolute left-6 top-6 ${OVERLAY_PILL}`}>
                {featured.category}
              </span>
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
                  {formatMeta(featured.date)} / POST BY {featured.author.toUpperCase()}
                </p>
                <h1 className="mt-3 max-w-3xl text-[clamp(1.5rem,3.2vw,2.5rem)] font-extrabold leading-[1.1] tracking-[-0.028em] text-white">
                  {featured.title}
                </h1>
              </div>
            </Link>
          </div>
        </section>

        {/* ===========================================================
            TODAY'S HIGHLIGHT — 1 big card + 3 stacked cards
            =========================================================== */}
        {showHighlight && (
        <section className="px-6 pt-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-[2rem] font-extrabold tracking-[-0.025em] text-on-bg md:text-[2.5rem]">
              Today&rsquo;s highlight
            </h2>

            <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
              {/* BIG CARD */}
              <article className="flex flex-col">
                <Link
                  href={`/blog/${highlightMain.slug}`}
                  className="group relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-surface-container"
                >
                  <Image
                    src={highlightMain.coverImage}
                    alt={highlightMain.title}
                    fill
                    sizes="(min-width:1024px) 45vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    priority
                  />
                  <span className={`absolute left-5 top-5 ${OVERLAY_PILL}`}>
                    {highlightMain.category}
                  </span>
                </Link>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-muted">
                  {formatMeta(highlightMain.date)} / POST BY{' '}
                  <span className="text-on-bg">{highlightMain.author.toUpperCase()}</span>
                </p>
                <h3 className="mt-3 text-[1.75rem] font-extrabold leading-[1.15] tracking-[-0.025em] text-on-bg">
                  <Link
                    href={`/blog/${highlightMain.slug}`}
                    className="transition-colors hover:text-primary"
                  >
                    {highlightMain.title}
                  </Link>
                </h3>
                <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-on-surface-variant">
                  {highlightMain.excerpt}
                </p>
                <Link
                  href={`/blog/${highlightMain.slug}`}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-on-bg transition-colors hover:text-primary"
                >
                  Read More
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>

              {/* STACKED CARDS */}
              <div className="flex flex-col gap-5">
                {highlightSide.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group flex items-stretch gap-5 rounded-xl border border-outline-variant bg-surface-lowest p-4 transition-all hover:border-primary/40 hover:shadow-ambient-sm"
                  >
                    <div className="relative aspect-square w-[38%] min-w-[120px] shrink-0 overflow-hidden rounded-lg bg-surface-container">
                      <Image
                        src={post.coverImage}
                        alt=""
                        fill
                        sizes="200px"
                        className="object-cover"
                      />
                      <span className={`absolute left-2 top-2 ${OVERLAY_PILL} px-2 py-0.5 text-[9px]`}>
                        {post.category}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-col justify-center">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-muted">
                        {formatMeta(post.date)} · {post.readTime} min read
                      </p>
                      <h4 className="mt-1.5 line-clamp-2 text-[17px] font-bold leading-snug tracking-[-0.015em] text-on-bg transition-colors group-hover:text-primary">
                        {post.title}
                      </h4>
                      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-on-surface-variant">
                        {post.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
        )}

        {/* ===========================================================
            BROWSE BY TOPIC — 4 category cards
            =========================================================== */}
        <section className="px-6 pt-24">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-[2rem] font-extrabold tracking-[-0.025em] text-on-bg md:text-[2.5rem]">
              Browse by topic
            </h2>

            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {categoryCards.map(({ cat, image }) => (
                <Link
                  key={cat}
                  href={`/curation#${categorySlug(cat)}`}
                  className="group flex flex-col items-center rounded-xl border border-outline-variant bg-surface-lowest p-8 text-center transition-all hover:border-primary/40 hover:shadow-ambient-sm"
                >
                  <div className="relative mb-5 h-28 w-28 overflow-hidden rounded-lg bg-surface-container">
                    <Image src={image} alt="" fill sizes="112px" className="object-cover" />
                  </div>
                  <h3 className="text-lg font-bold tracking-[-0.015em] text-on-bg transition-colors group-hover:text-primary">
                    {cat}
                  </h3>
                  <p className="mt-2 line-clamp-3 min-h-[3.75rem] text-[13px] leading-relaxed text-on-surface-variant">
                    {CATEGORY_INFO[cat].description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ===========================================================
            LATEST POSTS — 3-column grid with overlay pill + View All
            =========================================================== */}
        <section className="px-6 pt-24">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-[2rem] font-extrabold tracking-[-0.025em] text-on-bg md:text-[2.5rem]">
              Latest posts
            </h2>

            <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {latest.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-surface-container">
                    <Image
                      src={post.coverImage}
                      alt=""
                      fill
                      sizes="(min-width:1024px) 33vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <span className={`absolute left-4 top-4 ${OVERLAY_PILL}`}>
                      {post.category}
                    </span>
                  </div>
                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-muted">
                    {formatMeta(post.date)} · {post.readTime} min read · {post.category}
                  </p>
                  <h3 className="mt-2 line-clamp-2 text-xl font-bold leading-snug tracking-[-0.02em] text-on-bg transition-colors group-hover:text-primary">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-on-surface-variant">
                    {post.excerpt}
                  </p>
                </Link>
              ))}
            </div>

            <div className="mt-12">
              <Link
                href="/archives"
                className="cta-primary inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm"
              >
                View All
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* ===========================================================
            NEWSLETTER CTA — split layout, blue accent border
            =========================================================== */}
        <section className="px-6 pb-24 pt-24">
          <div className="mx-auto max-w-7xl">
            <div
              id="newsletter"
              className="relative overflow-hidden rounded-2xl border border-outline-variant bg-surface-lowest p-8 md:p-12"
            >
              {/* Thin blue accent bar on the left — our tertiary */}
              <div
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-1 bg-tertiary"
              />

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-tertiary">
                    Free email alerts
                  </p>
                  <h2 className="mt-3 text-[2rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-on-bg md:text-[2.5rem]">
                    Get warned about new scams before they reach you
                  </h2>
                  <p className="mt-5 max-w-md text-[15px] leading-relaxed text-on-surface-variant">
                    One short email with the scam everyone is talking about and
                    exactly how to stay safe. Free, no spam, unsubscribe in one
                    click.
                  </p>
                </div>
                <div className="md:justify-self-end">
                  <div className="w-full md:max-w-md">
                    <FooterNewsletter />
                    <p className="mt-4 text-[11px] leading-relaxed text-on-surface-muted">
                      By subscribing, you agree to our{' '}
                      <Link href="/privacy" className="text-tertiary underline-offset-2 hover:underline">
                        privacy policy
                      </Link>
                      . One-click unsubscribe in every email.
                    </p>
                  </div>
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
