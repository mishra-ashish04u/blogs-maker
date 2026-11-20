import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { getAllPosts } from '@/lib/blog-data';

export const revalidate = 60;

export const metadata = {
  title: 'Search',
  description: 'Search scam alerts and safety guides by keyword or topic.',
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const query = q.trim();
  const posts = await getAllPosts();

  const results = query
    ? posts.filter((p) => {
        const haystack = `${p.title} ${p.excerpt} ${p.category} ${p.author}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
    : [];

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main id="main">

      <PageHeader
        kicker={query ? `Results for "${query}"` : 'Search'}
        title={query ? `${results.length} article${results.length === 1 ? '' : 's'}` : 'Search for a scam by'}
        accent={query ? 'found.' : 'name or keyword.'}
        subtitle={
          query
            ? undefined
            : 'Try words from the message you received — e.g. “parcel”, “bank”, “crypto” or “job offer”. Use the search icon in the menu.'
        }
      />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          {query && results.length === 0 ? (
            <div className="rounded-2xl bg-surface-container p-12 text-center">
              <p className="font-playfair text-2xl font-semibold text-on-bg">
                Nothing matched your query.
              </p>
              <p className="mt-3 text-sm text-on-surface-variant">
                Try a broader term, or browse{' '}
                <Link href="/archives" className="text-primary-ink underline underline-offset-4 hover:text-primary-accent">
                  the full archive
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {results.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group block fade-in">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-surface-high">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  <p className="mt-5 label-overline">
                    {post.category} · {post.readTime} min read
                  </p>
                  <h3 className="mt-2 font-playfair text-lg font-semibold leading-snug text-on-bg transition-colors group-hover:text-primary-ink">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-on-surface-variant">{post.excerpt}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
}
