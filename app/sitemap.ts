import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog-data';
import { absoluteUrl } from '@/lib/seo';

/**
 * Dynamic sitemap — Next.js App Router serves this at /sitemap.xml.
 *
 * Includes the canonical static routes + every published post, with
 * freshness (lastModified) + priority signals. Regenerated on every
 * request because post list is dynamic; Vercel's edge cache still
 * reuses it within the revalidate window.
 */
export const revalidate = 3600; // 1h — daily cron will still land in fresh bucket

function dateFromPost(dateStr: string): Date {
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'),           changeFrequency: 'daily',   priority: 1.0, lastModified: new Date() },
    { url: absoluteUrl('/curation'),   changeFrequency: 'daily',   priority: 0.8 },
    { url: absoluteUrl('/perspectives'), changeFrequency: 'daily', priority: 0.8 },
    { url: absoluteUrl('/archives'),   changeFrequency: 'daily',   priority: 0.7 },
    { url: absoluteUrl('/about'),      changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/submit-tip'), changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/contact'),    changeFrequency: 'yearly',  priority: 0.4 },
    { url: absoluteUrl('/ethics'),     changeFrequency: 'yearly',  priority: 0.3 },
    { url: absoluteUrl('/privacy'),    changeFrequency: 'yearly',  priority: 0.3 },
    { url: absoluteUrl('/terms'),      changeFrequency: 'yearly',  priority: 0.3 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: absoluteUrl(`/blog/${p.slug}`),
    lastModified: dateFromPost(p.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...postRoutes];
}
