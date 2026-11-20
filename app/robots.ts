import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo';

/**
 * Next.js serves this at /robots.txt.
 *
 * Policy:
 *   - All standard crawlers may index the public site.
 *   - /admin, /api, /unsubscribe are blocked (not content).
 *   - Major AI crawlers are EXPLICITLY allowed — we want to show up in
 *     ChatGPT / Claude / Perplexity / Google AI Overviews. Flip these
 *     to Disallow if you ever decide to opt out of AI training.
 *   - Sitemap is referenced so crawlers can enumerate posts.
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = ['/admin', '/admin/', '/api/', '/unsubscribe'];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
      // AI crawlers — explicitly allowed so our posts show up in LLM answers.
      // Each agent is listed individually because the "*" rule doesn't apply
      // to named bots for some providers.
      { userAgent: 'GPTBot',          allow: '/', disallow },
      { userAgent: 'ChatGPT-User',    allow: '/', disallow },
      { userAgent: 'OAI-SearchBot',   allow: '/', disallow },
      { userAgent: 'ClaudeBot',       allow: '/', disallow },
      { userAgent: 'Claude-Web',      allow: '/', disallow },
      { userAgent: 'anthropic-ai',    allow: '/', disallow },
      { userAgent: 'PerplexityBot',   allow: '/', disallow },
      { userAgent: 'Google-Extended', allow: '/', disallow },
      { userAgent: 'CCBot',           allow: '/', disallow },
      { userAgent: 'Amazonbot',       allow: '/', disallow },
      { userAgent: 'Applebot-Extended', allow: '/', disallow },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
