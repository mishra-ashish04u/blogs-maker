/**
 * Brand + niche configuration — the single place to rename the site or
 * change its topics. Dependency-free so it can be imported from server
 * code, client components, email templates and the generation scripts.
 *
 * If you change CATEGORIES, also update the `category` check constraint
 * in lib/supabase/schema.sql (the database enforces the same list).
 */

export const SITE = {
  name: 'Daily Scam Alert',
  /** Wordmark is rendered as `${wordmark.lead}<accent>${wordmark.accent}</accent>`. */
  wordmark: { lead: 'Daily Scam ', accent: 'Alert' },
  /** Two-letter monogram for compact logos (social cards, favicons). */
  monogram: 'DS',
  domain: 'dailyscamalert.com',
  tagline: 'Spot scams before they spot you.',
  description:
    'Daily alerts on the scams going around right now — phishing texts, fake calls, online shopping and investment fraud — plus plain-English guides to protect your money, accounts and family.',
  author: 'Daily Scam Alert Team',
  locale: 'en_US',
  /** Add a handle (e.g. '@dailyscamalert') once the account exists. */
  twitterHandle: undefined as string | undefined,
  /** Social profile URLs (used in footer + Organization schema). Add when they exist. */
  socials: [] as Array<{ label: string; href: string }>,
  email: {
    contact: 'hello@dailyscamalert.com',
    reports: 'report@dailyscamalert.com',
    privacy: 'privacy@dailyscamalert.com',
  },
  // Square logo for Organization schema. Replace with a real 512×512 PNG.
  logoPath: '/icon-light-32x32.png',
  rssTitle: 'Daily Scam Alert',
  newsletterName: 'The Daily Scam Alert',
} as const;

export const CATEGORIES = [
  'Scam Alerts',
  'Protection Guides',
  'Account Recovery',
  'Security Tools',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_INFO: Record<Category, { description: string }> = {
  'Scam Alerts': {
    description:
      'Scams circulating right now — fake texts, calls, emails, shopping sites and job offers — and how to recognise them.',
  },
  'Protection Guides': {
    description:
      'Step-by-step guides to lock down your phone, accounts, money and family members against fraud.',
  },
  'Account Recovery': {
    description:
      'Got scammed or hacked? What to do in the first hour, who to report it to, and how to get your accounts back.',
  },
  'Security Tools': {
    description:
      'Honest, plain-English reviews of password managers, antivirus, VPNs and other tools that actually help.',
  },
};

/** URL-safe anchor/slug for a category, e.g. 'Scam Alerts' → 'scam-alerts'. */
export function categorySlug(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
