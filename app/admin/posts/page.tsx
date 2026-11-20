import Link from 'next/link';
import { Plus, ArrowUpRight, PenLine, Eye, Search } from 'lucide-react';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { getAllPosts, type BlogPost } from '@/lib/blog-data';
import type { PostRow } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

type Status = 'all' | 'published' | 'draft' | 'retired';
type AdminPost = BlogPost & { status: 'draft' | 'published' | 'retired' };

async function fetchAllAdminPosts(): Promise<AdminPost[]> {
  if (!isSupabaseAdminConfigured()) {
    const fallback = await getAllPosts();
    return fallback.map((p) => ({ ...p, status: 'published' }));
  }
  // Service role: RLS hides drafts/retired rows from the public key.
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });
  if (!data || data.length === 0) {
    const fallback = await getAllPosts();
    return fallback.map((p) => ({ ...p, status: 'published' }));
  }
  return (data as PostRow[]).map((row) => ({
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    author: row.author,
    date: row.date,
    readTime: row.read_time,
    coverImage: row.cover_image,
    content: row.content,
    status: row.status,
  }));
}

const CATEGORY_TONE: Record<AdminPost['category'], string> = {
  'Scam Alerts':       'bg-error/10 text-error',
  'Protection Guides': 'bg-primary-container/15 text-primary',
  'Account Recovery':  'bg-tertiary-container text-tertiary',
  'Security Tools':    'bg-success/12 text-success',
};

function StatusPill({ status }: { status: AdminPost['status'] }) {
  const cls =
    status === 'published'
      ? 'bg-success/12 text-success'
      : status === 'draft'
        ? 'bg-warning/12 text-warning'
        : 'bg-surface-container text-on-surface-muted';
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${cls}`}>
      {status}
    </span>
  );
}

function CategoryPill({ category }: { category: AdminPost['category'] }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${CATEGORY_TONE[category]}`}>
      {category}
    </span>
  );
}

const TABS: Array<{ key: Status; label: string }> = [
  { key: 'all',       label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft',     label: 'Drafts' },
  { key: 'retired',   label: 'Retired' },
];

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const raw = await searchParams;
  const active: Status = (['published', 'draft', 'retired'] as Status[]).includes(
    raw.status as Status,
  )
    ? (raw.status as Status)
    : 'all';
  const q = (raw.q ?? '').trim().toLowerCase();

  const all = await fetchAllAdminPosts();
  const counts = {
    all:       all.length,
    published: all.filter((p) => p.status === 'published').length,
    draft:     all.filter((p) => p.status === 'draft').length,
    retired:   all.filter((p) => p.status === 'retired').length,
  };

  const filtered = all
    .filter((p) => (active === 'all' ? true : p.status === active))
    .filter((p) => {
      if (!q) return true;
      const hay = `${p.title} ${p.excerpt} ${p.author} ${p.category}`.toLowerCase();
      return hay.includes(q);
    });

  return (
    <div className="space-y-6">
      {/* Hero — page title + primary action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            Library
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.03em] text-on-bg">
            Posts
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {counts.all} total · {counts.published} published · {counts.draft} draft · {counts.retired} retired
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="cta-primary inline-flex items-center gap-2 self-start rounded-md px-4 py-2.5 text-[13px] font-semibold sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          New post
        </Link>
      </div>

      {/* Filter tabs + inline search — separates the page into one clear lane */}
      <div className="flex flex-col gap-3 border-b border-outline-variant sm:flex-row sm:items-center sm:justify-between">
        <nav
          role="tablist"
          aria-label="Filter posts by status"
          className="-mb-px flex gap-1 overflow-x-auto"
        >
          {TABS.map((tab) => {
            const isActive = tab.key === active;
            const count = counts[tab.key];
            const href =
              tab.key === 'all' ? '/admin/posts' : `/admin/posts?status=${tab.key}`;
            return (
              <Link
                key={tab.key}
                href={q ? `${href}${href.includes('?') ? '&' : '?'}q=${encodeURIComponent(q)}` : href}
                role="tab"
                aria-selected={isActive}
                className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-bg'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0 text-[10px] font-medium ${
                    isActive ? 'bg-primary-container/30 text-primary' : 'bg-surface-container text-on-surface-muted'
                  }`}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </nav>

        <form
          action="/admin/posts"
          method="get"
          className="flex w-full max-w-xs items-center gap-2 pb-2 sm:pb-0"
        >
          {active !== 'all' && <input type="hidden" name="status" value={active} />}
          <label htmlFor="admin-posts-q" className="sr-only">
            Filter posts
          </label>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-on-surface-muted"
              aria-hidden="true"
            />
            <input
              id="admin-posts-q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Filter by title, author…"
              className="w-full rounded-md bg-surface-low py-2 pl-9 pr-3 text-[13px] text-on-bg placeholder:text-on-surface-muted ghost-border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </form>
      </div>

      {/* Posts list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-lowest p-10 text-center">
          <p className="text-base font-bold text-on-bg">
            {q
              ? `No posts match "${q}".`
              : active === 'all'
                ? 'No posts yet.'
                : `No ${active} posts.`}
          </p>
          <p className="mt-1 text-sm text-on-surface-variant">
            {active === 'draft'
              ? 'Start a draft and come back to it later.'
              : 'The daily cron will publish a new editorial at 06:00 UTC.'}
          </p>
          <Link
            href="/admin/posts/new"
            className="cta-primary mt-5 inline-flex items-center gap-2 rounded-md px-4 py-2 text-[12px]"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            New post
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-lowest">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-surface-low text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                  <th scope="col" className="px-5 py-3">Title</th>
                  <th scope="col" className="px-5 py-3">Status</th>
                  <th scope="col" className="px-5 py-3">Category</th>
                  <th scope="col" className="px-5 py-3">Author</th>
                  <th scope="col" className="px-5 py-3">Date</th>
                  <th scope="col" className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post) => (
                  <tr
                    key={post.slug}
                    className="border-t border-outline-variant transition-colors hover:bg-surface-low"
                  >
                    <td className="px-5 py-3">
                      <p className="text-[14px] font-semibold text-on-bg">
                        {post.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[12px] text-on-surface-muted">
                        {post.excerpt}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={post.status} />
                    </td>
                    <td className="px-5 py-3">
                      <CategoryPill category={post.category} />
                    </td>
                    <td className="px-5 py-3 text-[12px] text-on-surface-variant">{post.author}</td>
                    <td className="px-5 py-3 text-[12px] text-on-surface-muted">{post.date}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <Link
                          href={`/blog/${post.slug}`}
                          aria-label={`View ${post.title}`}
                          className="inline-flex items-center gap-1 text-[12px] font-medium text-on-surface-muted transition-colors hover:text-on-bg"
                        >
                          <Eye className="h-3 w-3" aria-hidden="true" /> View
                        </Link>
                        <Link
                          href={`/admin/posts/${post.slug}`}
                          aria-label={`Edit ${post.title}`}
                          className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary transition-colors hover:text-primary-hover"
                        >
                          <PenLine className="h-3 w-3" aria-hidden="true" /> Edit
                          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
