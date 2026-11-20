import sanitizeHtml from 'sanitize-html';

/**
 * Allowlist sanitiser for post bodies.
 *
 * Post HTML comes from two untrusted-ish sources: the admin rich-text editor
 * (which also has a raw-HTML mode) and the LLM pipeline (whose input is
 * scraped third-party articles, i.e. prompt-injectable). Everything that is
 * stored or rendered goes through here, so a stray <script>, inline event
 * handler or javascript: URL can never reach a reader's browser.
 *
 * The allowlist matches what the editor can produce and what `.editorial-body`
 * styles — nothing more.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h2', 'h3', 'h4',
    'p', 'br', 'hr',
    'strong', 'b', 'em', 'i', 's', 'u', 'sub', 'sup', 'mark',
    'ul', 'ol', 'li',
    'blockquote',
    'code', 'pre',
    'a',
    'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    ol: ['start'],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  // An <img> whose src was stripped (javascript:, data:, …) is just noise.
  exclusiveFilter: (frame) => frame.tag === 'img' && !frame.attribs.src,
  // Drop the *contents* of these too, not just the tags.
  nonTextTags: ['script', 'style', 'textarea', 'noscript', 'iframe', 'object', 'embed'],
  transformTags: {
    // The page already renders the post title as the only <h1>.
    h1: 'h2',
    a: (tagName, attribs) => {
      const out: Record<string, string> = { ...attribs };
      if (out.target === '_blank') out.rel = 'noopener noreferrer nofollow';
      else delete out.target;
      return { tagName, attribs: out };
    },
    img: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, loading: 'lazy' },
    }),
  },
};

export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, OPTIONS).trim();
}

/** True when the HTML has no visible text and no images (e.g. "<p></p>"). */
export function isEmptyHtml(html: string): boolean {
  if (/<img\b/i.test(html)) return false;
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).trim() === '';
}

/** Reading time at ~225 words per minute, clamped to the 1–60 range the API accepts. */
export function estimateReadTime(html: string): number {
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.min(60, Math.max(1, Math.round(words / 225)));
}
