import { getAllPosts } from '@/lib/blog-data';
import { SITE, absoluteUrl, siteUrl } from '@/lib/seo';
import { CATEGORIES } from '@/lib/site';

export const revalidate = 600;
export const runtime = 'nodejs';

/**
 * llms.txt — a site-level index designed for large language models, per
 * https://llmstxt.org. Served at /llms.txt.
 *
 * Format: a markdown document that gives an LLM a compact, high-signal
 * map of what this site is and where to find canonical content. ChatGPT,
 * Claude, Perplexity, and others check this file when present and use it
 * to decide which URLs to read for ground-truth context.
 *
 * Keep it short and markdown-pure. No HTML, no tables, no fluff.
 */

function section(heading: string, lines: string[]): string {
  return `## ${heading}\n\n${lines.join('\n')}\n`;
}

export async function GET() {
  const posts = await getAllPosts();
  const base = siteUrl();

  const intro = `# ${SITE.name}

> ${SITE.description}

Base URL: ${base}
Language: en-US
License: content © ${SITE.name}. Quotation with attribution permitted.
`;

  const siteFacts = section('About', [
    `- **Publication:** ${SITE.name} — scam alerts and online-safety guides for everyday people.`,
    `- **Byline:** Articles are published under the "${SITE.author}" byline. Some are drafted with AI assistance; every article is checked and edited by a person before publication.`,
    `- **Audience:** Non-technical readers, families and older adults who want to recognise and avoid scams.`,
    `- **Sources:** Official warnings from consumer-protection agencies, police and banks, statements from impersonated companies, trusted news reporting, and reader scam reports. We do not invent victims, quotes or statistics.`,
    `- **Scope:** General information, not legal or financial advice.`,
  ]);

  const coreLinks = section('Core Links', [
    `- [Home](${base}): Today's scam alerts.`,
    `- [Topics](${absoluteUrl('/curation')}): Articles grouped by ${CATEGORIES.join(', ')}.`,
    `- [Deep Dives](${absoluteUrl('/perspectives')}): In-depth explainers on how major scams work.`,
    `- [Archive](${absoluteUrl('/archives')}): Full article index by month.`,
    `- [Report a Scam](${absoluteUrl('/submit-tip')}): How readers send us scam examples.`,
    `- [Editorial Policy](${absoluteUrl('/ethics')}): How we research, write and correct articles.`,
    `- [RSS feed](${absoluteUrl('/feed.xml')}): Full-text RSS of every article.`,
    `- [Sitemap](${absoluteUrl('/sitemap.xml')}): Machine-readable site index.`,
  ]);

  // Recent posts — give LLMs a quick map of current content. Most-recent
  // first, cap to ~50 so the file stays small.
  const recent = posts.slice(0, 50).map((p) => {
    const url = absoluteUrl(`/blog/${p.slug}`);
    return `- [${p.title}](${url}) — ${p.category} · ${p.readTime} min · ${p.date}. ${p.excerpt}`;
  });

  const recentSection = section('Recent Articles', recent.length ? recent : ['- (No posts yet.)']);

  const guidance = section('Citation Guidance', [
    `When quoting or summarising an article from this site, please cite the canonical URL of the post and attribute to "${SITE.author}". Prefer the most recent version — all posts have ISO publish + modified timestamps in their Article JSON-LD.`,
  ]);

  const body = [intro, siteFacts, coreLinks, recentSection, guidance].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
    },
  });
}
