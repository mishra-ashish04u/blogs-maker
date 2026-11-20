/**
 * One-shot: push the static sample posts into Supabase as DRAFTS.
 * Safe to re-run — upserts on `slug`.
 *
 * They are drafts on purpose: the samples are short starting points.
 * Expand each one in /admin before publishing — thin pages hurt both
 * search rankings and AdSense approval.
 *
 *   npm run seed
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
config();
import { getSupabaseAdmin } from '../lib/supabase/admin';
import { staticBlogPosts } from '../lib/blog-data';

async function main() {
  const supabase = getSupabaseAdmin();

  const rows = staticBlogPosts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    author: p.author,
    date: p.date,
    read_time: p.readTime,
    cover_image: p.coverImage,
    content: p.content,
    status: 'draft',
  }));

  const { data, error } = await supabase
    .from('posts')
    .upsert(rows, { onConflict: 'slug' })
    .select('slug');

  if (error) {
    console.error('[seed] failed:', error.message);
    process.exit(1);
  }

  console.log(`[seed] ✓ upserted ${data?.length ?? 0} sample posts as DRAFTS (expand + publish them in /admin/posts).`);
  for (const r of data ?? []) console.log('  -', r.slug);
}

main();
