import { getAllPosts } from '@/lib/blog-data';
import { sanitizePostHtml } from '@/lib/html-sanitize';
import { SITE, absoluteUrl, siteUrl } from '@/lib/seo';

export const revalidate = 300;
export const runtime = 'nodejs';

/**
 * RSS 2.0 feed.
 *
 * Served at /feed.xml. Consumed by:
 *   - News aggregators (Feedly, Inoreader)
 *   - Newsletter platforms that auto-import posts
 *   - Most LLM training data pipelines that scrape RSS before HTML
 *
 * Reasons to use RSS over raw HTML scraping for AI ingestion: clean full-
 * text bodies, explicit guid, pubDate, and categories — less noise for
 * downstream consumers.
 */

function escapeXml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRfc2822(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return new Date().toUTCString();
  return d.toUTCString();
}

export async function GET() {
  const posts = await getAllPosts();
  const now = new Date().toUTCString();
  const base = siteUrl();

  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/blog/${post.slug}`);
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${toRfc2822(post.date)}</pubDate>
      <author>${escapeXml(post.author)}</author>
      <category>${escapeXml(post.category)}</category>
      <description>${escapeXml(post.excerpt)}</description>
      <content:encoded><![CDATA[${sanitizePostHtml(post.content).replaceAll(']]>', ']]]]><![CDATA[>')}]]></content:encoded>
      <media:thumbnail url="${escapeXml(post.coverImage)}" />
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(SITE.rssTitle)}</title>
    <link>${base}</link>
    <atom:link href="${absoluteUrl('/feed.xml')}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(SITE.description)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <generator>${SITE.name} / Next.js</generator>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
