import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { getAllPosts } from '@/lib/blog-data';
import { CATEGORIES, CATEGORY_INFO, categorySlug } from '@/lib/site';

export const metadata = {
  title: 'Deep Dives',
  description:
    'In-depth explainers on how the biggest scams really work — the psychology, the playbook, and how to protect yourself and your family.',
  alternates: { canonical: '/perspectives' },
};

export const revalidate = 300;

export default async function PerspectivesPage() {
  const blogPosts = await getAllPosts();
  const lead = blogPosts[2] ?? blogPosts[0];
  const essays = blogPosts.slice(3);

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main id="main">

      <PageHeader
        kicker="Deep Dives"
        title="How the biggest scams"
        accent="really work."
        subtitle="Longer reads that unpack the playbook behind common scams — so you can recognise the next version, not just this one."
      />

      {/* Lead essay */}
      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
            <div className="md:col-span-7">
              <Link href={`/blog/${lead.slug}`} className="group block">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-surface-high">
                  <Image
                    src={lead.coverImage}
                    alt={lead.title}
                    fill
                    sizes="(min-width:768px) 58vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <p className="mt-6 label-overline">
                  Featured · {lead.category}
                </p>
                <h2 className="mt-3 font-playfair text-3xl font-semibold leading-[1.1] tracking-tight text-on-bg transition-colors group-hover:text-primary-ink md:text-[2.5rem]">
                  {lead.title}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-on-surface-variant">{lead.excerpt}</p>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-muted">
                  By {lead.author} · {lead.date}
                </p>
              </Link>
            </div>

            <aside className="md:col-span-5">
              <header className="mb-6">
                <h3 className="accent-bar font-playfair text-xl font-semibold text-on-bg">
                  Browse by topic
                </h3>
              </header>
              <ul className="space-y-5">
                {CATEGORIES.map((c, i) => (
                  <li key={c}>
                    <Link
                      href={`/curation#${categorySlug(c)}`}
                      className="flex gap-4 rounded-2xl bg-surface-lowest p-5 shadow-ambient-sm transition-colors hover:text-primary"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-signature text-xs font-bold text-white shadow-ambient-sm">
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div>
                        <p className="font-playfair text-lg font-semibold text-on-bg">{c}</p>
                        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                          {CATEGORY_INFO[c].description}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {/* Essay list */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl">
          <header className="mb-10">
            <h3 className="accent-bar font-playfair text-2xl font-semibold text-on-bg">
              More deep dives
            </h3>
          </header>

          <ul className="space-y-4">
            {essays.map((post, i) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group grid grid-cols-1 items-center gap-6 rounded-2xl p-4 transition-colors hover:bg-surface-container md:grid-cols-12"
                >
                  <p className="text-3xl font-extrabold text-on-surface-muted/70 transition-colors group-hover:text-primary md:col-span-1">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <div className="md:col-span-7">
                    <p className="label-overline">
                      {post.category} · {post.readTime} min read
                    </p>
                    <h4 className="mt-2 font-playfair text-xl font-semibold leading-snug text-on-bg transition-colors group-hover:text-primary-ink md:text-2xl">
                      {post.title}
                    </h4>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-on-surface-variant">{post.excerpt}</p>
                  </div>
                  <div className="md:col-span-4">
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-surface-high">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        sizes="(min-width:768px) 33vw, 100vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
}
