import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import type { PostRow } from '@/lib/supabase/types';
import { getPost } from '@/lib/blog-data';
import { PostForm } from '@/components/admin/post-form';

export const dynamic = 'force-dynamic';

/**
 * Admin edit page fetches directly (including drafts/retired), not via
 * getPost() which filters by status='published'. Uses the service-role
 * client because RLS only exposes published rows to the public key.
 * (This route is gated by the admin session check in proxy.ts.)
 */
async function fetchAnyPost(slug: string): Promise<PostRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  return (data as PostRow) ?? null;
}

export default async function AdminEditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const row = await fetchAnyPost(slug);
  const fallback = row ? null : await getPost(slug);
  if (!row && !fallback) notFound();

  const initial = row
    ? {
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt,
        category: row.category,
        author: row.author,
        readTime: row.read_time,
        coverImage: row.cover_image,
        content: row.content,
        status: row.status,
      }
    : {
        title: fallback!.title,
        slug: fallback!.slug,
        excerpt: fallback!.excerpt,
        category: fallback!.category,
        author: fallback!.author,
        readTime: fallback!.readTime,
        coverImage: fallback!.coverImage,
        content: fallback!.content,
        status: 'published' as const,
      };

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-1.5 w-8 rounded-full bg-primary" aria-hidden="true" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              Edit
            </p>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-[-0.03em] text-on-bg md:text-[2.5rem]">
            {initial.title}
          </h1>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-muted">
            {initial.category} · {initial.author} · Status: {initial.status}
          </p>
        </div>
        <Link
          href={`/blog/${initial.slug}`}
          className="cta-secondary inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[12px] uppercase tracking-[0.14em]"
        >
          View live
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <PostForm mode="edit" currentSlug={initial.slug} initial={initial} />
    </div>
  );
}
