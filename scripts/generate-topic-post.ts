/**
 * Topic-driven blog post generator.
 *
 * Unlike the daily pipeline (RSS → LLM → image), this script takes one or
 * more raw topics as CLI arguments and produces one evergreen editorial
 * per topic. Useful for seeding the archive with evergreen guides that
 * aren't tied to a news event ("Romance scams", "Fake job offers", etc.).
 *
 * Skipped vs. the daily pipeline:
 *   - RSS picker (no external trigger needed)
 *   - Jina Reader (no source URL to fetch)
 *   - Newsletter dispatch (bulk topic generation would spam subscribers)
 *
 * Run:
 *   npm run generate:topic -- "Romance scams" "Fake job offers" "Tech support scams"
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import { getSupabaseAdmin } from '../lib/supabase/admin';
import { sanitizePostHtml } from '../lib/html-sanitize';
import { SITE } from '../lib/site';
import { generateEditorial } from './lib/llm';
import { generateAndUploadCover } from './lib/cover';
import type { Headline } from './lib/rss';

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Build a synthetic "headline" for the LLM from a plain topic string. The
 * shape is the same as what the RSS pipeline passes, so we can reuse the
 * exact same prompt + router. The snippet nudges the model toward an
 * evergreen explainer rather than a news reaction.
 */
function topicToHeadline(topic: string): Headline {
  return {
    title: topic,
    link: '',
    source: `${SITE.name} guides`,
    contentSnippet:
      `Evergreen guide on: ${topic}. No specific news incident triggers this piece — ` +
      `explain how this scam or safety topic works in general, how to recognise it, how to ` +
      `protect yourself, and what to do if you have been caught out. Keep it general; ` +
      `do NOT invent statistics, victims, quotes, phone numbers or websites.`,
  };
}

async function generateOne(topic: string): Promise<{ slug?: string; error?: string }> {
  console.log(`\n[topic] ▸ "${topic}"`);

  const supabase = getSupabaseAdmin();

  // Log a run so this shows up in /admin/automation alongside daily cron runs.
  const { data: runInsert, error: runErr } = await supabase
    .from('automation_runs')
    .insert({ status: 'running', trigger: 'manual', topic })
    .select('id')
    .single();
  if (runErr || !runInsert) {
    return { error: `Failed to start automation_run: ${runErr?.message}` };
  }
  const runId = runInsert.id as string;
  const logs: Record<string, unknown> = { mode: 'topic', topic };

  try {
    console.log('[topic] generating editorial...');
    const editorial = await generateEditorial(topicToHeadline(topic), null);
    logs.editorialTitle = editorial.title;
    logs.editorialCategory = editorial.category;
    logs.llmProvider = editorial.provider;
    logs.editorialPasses = editorial.passes;
    if (editorial.editor) logs.llmEditor = editorial.editor;
    if (editorial.fallbackUsed) logs.llmFallback = true;
    console.log(
      `[topic] ${editorial.provider}${editorial.editor ? ` → ${editorial.editor}` : ''}: "${editorial.title}"`,
    );

    console.log('[topic] generating cover image...');
    const coverUrl = await generateAndUploadCover(
      editorial.imagePrompt,
      editorial.slug,
      editorial.category,
    );
    logs.coverUrl = coverUrl;

    console.log('[topic] inserting post...');
    const { data: inserted, error: insertErr } = await supabase
      .from('posts')
      .insert({
        slug: editorial.slug,
        title: editorial.title,
        excerpt: editorial.excerpt,
        category: editorial.category,
        author: editorial.author,
        date: formatDate(),
        read_time: editorial.readTime,
        cover_image: coverUrl,
        // LLM output is never trusted as HTML.
        content: sanitizePostHtml(editorial.content),
        status: 'published',
        source_url: null,
      })
      .select('id, slug')
      .single();
    if (insertErr || !inserted) {
      throw new Error(`Post insert failed: ${insertErr?.message}`);
    }

    await supabase
      .from('automation_runs')
      .update({
        status: 'success',
        finished_at: new Date().toISOString(),
        post_id: inserted.id,
        topic: editorial.title,
        logs,
      })
      .eq('id', runId);

    console.log(`[topic] ✓ published /blog/${inserted.slug}`);

    // Best-effort revalidation so the post appears on the live site
    // without waiting for the ISR window.
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

    return { slug: inserted.slug };
  } catch (err) {
    const msg = (err as Error).message;
    console.error(`[topic] ✗ FAILED for "${topic}":`, msg);
    await supabase
      .from('automation_runs')
      .update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        error: msg,
        logs,
      })
      .eq('id', runId);
    return { error: msg };
  }
}

async function main() {
  const topics = process.argv.slice(2).filter(Boolean);
  if (topics.length === 0) {
    console.error(
      'Usage: npm run generate:topic -- "Topic 1" "Topic 2" ...\n' +
        'Example: npm run generate:topic -- "Phishing" "ISO 27001" "VAPT"',
    );
    process.exit(1);
  }

  console.log(`[topic] ${topics.length} topic${topics.length === 1 ? '' : 's'} queued`);

  const results: Array<{ topic: string; slug?: string; error?: string }> = [];
  for (const topic of topics) {
    const r = await generateOne(topic);
    results.push({ topic, ...r });
    // Breathing room between topics to stay polite with free-tier rate limits.
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  console.log('\n=== Summary ===');
  for (const r of results) {
    if (r.slug) {
      console.log(`  ✓ ${r.topic} → /blog/${r.slug}`);
    } else {
      console.log(`  ✗ ${r.topic} → ${r.error}`);
    }
  }
  const failed = results.filter((r) => r.error).length;
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('[topic] fatal:', err);
  process.exit(1);
});
