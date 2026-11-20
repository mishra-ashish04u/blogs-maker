/**
 * SEO + AI-readability helpers.
 *
 * Responsibilities:
 *   1. Produce fully-qualified URLs from relative paths (needed by OG, JSON-LD,
 *      sitemap, RSS — any consumer that doesn't run inside the browser).
 *   2. Build Schema.org JSON-LD objects for injection via <script type="application/ld+json">.
 *   3. Surface site-wide constants (name, tagline, logo) in one place so we
 *      never duplicate brand copy across metadata + structured data + RSS.
 *
 * SITE_URL env var is the single source of truth for the site's base URL
 * across metadata, sitemap, og:url, rss <link>, etc. For local dev it
 * falls back to http://localhost:3000.
 */

import type { BlogPost } from '@/lib/blog-data';
import { SITE } from '@/lib/site';

// Brand constants live in lib/site.ts; re-exported for existing importers.
export { SITE };

const FALLBACK_URL = 'http://localhost:3000';

export function siteUrl(): string {
  const raw = process.env.SITE_URL;
  if (!raw) return FALLBACK_URL;
  return raw.replace(/\/$/, '');
}

/** Build an absolute URL from any path. Safe to call with '' or '/'. */
export function absoluteUrl(path = '/'): string {
  const base = siteUrl();
  if (!path) return base;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Canonical URL for a given route. Used in metadata.alternates.canonical. */
export function canonical(path = '/'): string {
  return absoluteUrl(path);
}

/** Build an ISO date string, permissive about whatever format the post uses. */
function toIsoDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Approximate word count from an HTML body. Strips tags + counts whitespace-
 * separated tokens. Used for Article.wordCount (helps LLMs + Google's article
 * preview rendering).
 */
export function wordCountFromHtml(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return 0;
  return text.split(' ').length;
}

export interface ArticleSchemaInput {
  post: BlogPost;
  /** ISO 8601 timestamp of publish, if available. */
  publishedAt?: string | null;
  /** ISO 8601 timestamp of last update. Falls back to publishedAt. */
  modifiedAt?: string | null;
}

/**
 * Schema.org Article JSON-LD. Include inline on the blog-post page via:
 *   <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(...)) }} />
 */
export function articleJsonLd({ post, publishedAt, modifiedAt }: ArticleSchemaInput) {
  const url = canonical(`/blog/${post.slug}`);
  const published = toIsoDate(publishedAt) ?? toIsoDate(post.date);
  const modified = toIsoDate(modifiedAt) ?? published;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: post.title,
    description: post.excerpt,
    image: [post.coverImage],
    articleSection: post.category,
    inLanguage: SITE.locale.replace('_', '-'),
    datePublished: published ?? undefined,
    dateModified: modified ?? undefined,
    wordCount: wordCountFromHtml(post.content),
    author: {
      '@type': 'Organization',
      name: post.author || SITE.author,
      url: canonical('/about'),
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      url: canonical('/'),
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl(SITE.logoPath),
      },
    },
    // Let voice assistants read the excerpt and any h2 headings aloud.
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.editorial-body h2', '.editorial-body p:first-of-type'],
    },
    isAccessibleForFree: true,
  };
}

/**
 * Wraps multiple JSON-LD entities in a single root object using Schema.org's
 * `@graph` pattern. Every <script type="application/ld+json"> block should
 * have exactly one top-level object with `@context` — otherwise validators
 * and browser extensions that read JSON-LD (SEO Meta in 1 Click, Rich
 * Results Test, etc.) throw when they try to read `@context` on an array.
 *
 * Individual entities keep their @type + @id; their @context is stripped
 * because it's inherited from the graph root.
 */
export function graphJsonLd(entities: Array<Record<string, unknown>>) {
  return {
    '@context': 'https://schema.org',
    '@graph': entities.map(({ '@context': _ctx, ...rest }) => rest),
  };
}

/**
 * Homepage structured data: Organization + WebSite with an enabled
 * SearchAction so Google can render a sitelinks search box below the brand
 * entry in SERPs. Returned as a single @graph-rooted object.
 */
export function siteJsonLd() {
  return graphJsonLd([
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${siteUrl()}#organization`,
      name: SITE.name,
      url: canonical('/'),
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl(SITE.logoPath),
      },
      sameAs: SITE.socials.map((s) => s.href),
      description: SITE.description,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${siteUrl()}#website`,
      url: canonical('/'),
      name: SITE.name,
      description: SITE.tagline,
      publisher: { '@id': `${siteUrl()}#organization` },
      inLanguage: SITE.locale.replace('_', '-'),
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteUrl()}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ]);
}

/** Helper for breadcrumb rendering on deep pages. */
export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: canonical(item.path),
    })),
  };
}
