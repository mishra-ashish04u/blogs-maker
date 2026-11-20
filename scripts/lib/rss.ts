import Parser from 'rss-parser';

/**
 * Sources for the daily scam alert. A mix of consumer-security publishers
 * and official warnings. All verified to serve RSS on 2026-11-17.
 */
const FEEDS = [
  'https://www.malwarebytes.com/blog/feed/index.xml', // consumer security news
  'https://www.welivesecurity.com/en/rss/feed/',      // ESET — consumer scams & safety
  'https://www.ic3.gov/PSA/RSS',                       // FBI IC3 public service announcements
  'https://blog.knowbe4.com/rss.xml',                  // phishing / social-engineering trends
  'https://www.bleepingcomputer.com/feed/',            // general security news (filtered)
  'https://krebsonsecurity.com/feed/',                 // fraud investigations (filtered)
];

/**
 * Headlines must look like something an everyday reader could run into.
 * Mixed-audience feeds also carry enterprise stories (patch round-ups,
 * ransomware gang profiles, CVEs) that don't fit this site.
 */
const CONSUMER_KEYWORDS =
  /\b(scams?|scammers?|fraud|fraudsters?|phish\w*|smish\w*|vish\w*|fake|impersonat\w*|text messages?|sms|whatsapp|robocall|calls?|romance|investment|crypto|bitcoin|gift cards?|refund|delivery|parcel|package|toll|bank|paypal|amazon|account takeover|hijack\w*|identity theft|data breach|leak\w*|passwords?|2fa|two-factor|passkeys?|sextortion|extortion|tech support|job offer|marketplace|shopping|ticket|giveaway|qr code|deepfake|ai voice|elderly|seniors?)\b/i;

const ENTERPRISE_ONLY =
  /\b(CVE-\d|patch tuesday|zero-day in|RCE|remote code execution|ransomware gang|APT\d*|nation-state|SCADA|ICS|critical infrastructure|Active Directory|kernel|firmware|exploit kit|vulnerabilit(y|ies) in .* (server|appliance|gateway))\b/i;

function isConsumerRelevant(title: string, snippet = ''): boolean {
  const text = `${title} ${snippet}`;
  return CONSUMER_KEYWORDS.test(text) && !ENTERPRISE_ONLY.test(title);
}

export type Headline = {
  title: string;
  link: string;
  isoDate?: string;
  contentSnippet?: string;
  source: string;
};

export async function fetchTrendingHeadlines(limit = 20): Promise<Headline[]> {
  const parser = new Parser({ timeout: 15000 });
  const all: Headline[] = [];

  for (const url of FEEDS) {
    try {
      const feed = await parser.parseURL(url);
      const host = new URL(url).host;
      for (const item of feed.items ?? []) {
        if (!item.title || !item.link) continue;
        const snippet = item.contentSnippet?.slice(0, 400);
        if (!isConsumerRelevant(item.title, snippet)) continue;
        all.push({
          title: item.title.trim(),
          link: item.link,
          isoDate: item.isoDate,
          contentSnippet: snippet,
          source: host,
        });
      }
    } catch (err) {
      console.warn(`[rss] failed to parse ${url}:`, (err as Error).message);
    }
  }

  all.sort((a, b) => {
    const ta = a.isoDate ? new Date(a.isoDate).getTime() : 0;
    const tb = b.isoDate ? new Date(b.isoDate).getTime() : 0;
    return tb - ta;
  });

  return all.slice(0, limit);
}
