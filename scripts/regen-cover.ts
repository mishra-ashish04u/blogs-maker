/**
 * Cover-only regeneration.
 *
 * Takes one or more post slugs, regenerates the cover image for each using
 * the current provider chain (Gemini → Unsplash → Pollinations), and
 * updates the post's cover_image URL. Does NOT touch editorial text.
 *
 * Use when the pipeline produced a bad cover (wrong subject for the
 * category, or fell through to Pollinations when Unsplash would've been
 * better) and you want to fix the image without creating a duplicate post.
 *
 * Run:
 *   npm run regen:cover -- "slug-one" "slug-two"
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import { getSupabaseAdmin } from '../lib/supabase/admin';
import { generateAndUploadCover } from './lib/cover';

async function regenOne(slug: string): Promise<{ ok: boolean; msg: string }> {
  console.log(`\n[regen-cover] ▸ ${slug}`);
  const supabase = getSupabaseAdmin();

  // We need the category (to route Security Tools posts to the curated
  // Unsplash pool) and the title (used as a reasonable fallback subject
  // if no imagePrompt was stored — we don't persist imagePrompt, so we
  // synthesise from title + category instead).
  const { data: post, error: selErr } = await supabase
    .from('posts')
    .select('id, slug, title, category')
    .eq('slug', slug)
    .maybeSingle();

  if (selErr || !post) {
    return { ok: false, msg: `Post not found: ${selErr?.message ?? 'no row'}` };
  }

  // Synth subject from title. cover.ts routes Security Tools to a curated
  // pool; for other categories this is a reasonable Unsplash query and a
  // passable Pollinations prompt.
  const subject = `${post.title}. everyday home scene with a smartphone or laptop`;

  try {
    const coverUrl = await generateAndUploadCover(subject, post.slug, post.category);
    const { error: updErr } = await supabase
      .from('posts')
      .update({ cover_image: coverUrl, updated_at: new Date().toISOString() })
      .eq('id', post.id);
    if (updErr) return { ok: false, msg: `Update failed: ${updErr.message}` };

    console.log(`[regen-cover] ✓ ${slug} → ${coverUrl}`);
    return { ok: true, msg: coverUrl };
  } catch (err) {
    return { ok: false, msg: (err as Error).message };
  }
}

async function main() {
  const slugs = process.argv.slice(2).filter(Boolean);
  if (slugs.length === 0) {
    console.error(
      'Usage: npm run regen:cover -- "slug-one" "slug-two" ...\n' +
        'Example: npm run regen:cover -- "implementing-dpdpa-a-framework-for-data-security"',
    );
    process.exit(1);
  }

  const results: Array<{ slug: string; ok: boolean; msg: string }> = [];
  for (const slug of slugs) {
    const r = await regenOne(slug);
    results.push({ slug, ...r });
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\n=== Summary ===');
  for (const r of results) {
    console.log(`  ${r.ok ? '✓' : '✗'} ${r.slug} → ${r.msg}`);
  }

  // Best-effort revalidation so the new cover appears on the live site.
  const siteUrl = process.env.SITE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (siteUrl && secret) {
    try {
      await fetch(`${siteUrl}/api/revalidate?secret=${encodeURIComponent(secret)}`, {
        method: 'POST',
      });
    } catch {
      // non-fatal
    }
  }

  if (results.some((r) => !r.ok)) process.exitCode = 1;
}

main().catch((err) => {
  console.error('[regen-cover] fatal:', err);
  process.exit(1);
});
