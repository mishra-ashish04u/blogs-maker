import { ImageResponse } from 'next/og';
import { getPost } from '@/lib/blog-data';
import { SITE, type Category } from '@/lib/site';

export const runtime = 'nodejs';

const WIDTH = 1200;
const HEIGHT = 630;

// Palette mirrors our light-theme tokens (not the full dark-mode story —
// social previews are almost always rendered on light UI).
const COLORS = {
  bg: '#ffffff',
  ink: '#0f172a',
  muted: '#475569',
  primary: '#ea580c',
  tertiary: '#2563eb',
  outline: '#e2e8f0',
  surfaceLow: '#f8fafc',
};

const CATEGORY_TONE: Record<Category, string> = {
  'Scam Alerts': '#dc2626',
  'Protection Guides': COLORS.primary,
  'Account Recovery': COLORS.tertiary,
  'Security Tools': '#16a34a',
};

/**
 * Dynamic 1200x630 OG image for every published post.
 *
 * Route: /og/{slug}
 *
 * Renders via @vercel/og's ImageResponse (Satori under the hood). No font
 * fetching — we rely on the system stack so the image is always available
 * quickly and doesn't rate-limit. The visual target is "legible in a
 * Twitter / LinkedIn preview at ~500px wide".
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = await getPost(slug);

  const title = post?.title ?? SITE.name;
  const category = post?.category ?? 'Editorial';
  const readTime = post?.readTime ? `${post.readTime} min read` : '';
  const categoryColor = CATEGORY_TONE[category as Category] ?? COLORS.primary;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: COLORS.bg,
          padding: '72px 80px',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        {/* HEADER — wordmark + accent */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 48,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 10,
              background: COLORS.primary,
              color: 'white',
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: -0.5,
            }}
          >
            {SITE.monogram}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              fontWeight: 800,
              color: COLORS.ink,
              letterSpacing: -0.5,
            }}
          >
            {SITE.wordmark.lead}
            <span style={{ color: COLORS.primary, marginLeft: 6 }}>{SITE.wordmark.accent}</span>
          </div>
          <div
            style={{
              marginLeft: 'auto',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: COLORS.muted,
            }}
          >
            {SITE.tagline}
          </div>
        </div>

        {/* CATEGORY PILL */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: categoryColor,
            }}
          >
            {category}
          </div>
          {readTime && (
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                color: COLORS.muted,
              }}
            >
              {`· ${readTime}`}
            </div>
          )}
        </div>

        {/* TITLE — the hero of the image */}
        <div
          style={{
            fontSize: title.length > 80 ? 60 : 72,
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: -2,
            color: COLORS.ink,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </div>

        {/* Pushes footer to bottom */}
        <div style={{ flex: 1 }} />

        {/* FOOTER — URL + accent bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            borderTop: `1px solid ${COLORS.outline}`,
            paddingTop: 24,
          }}
        >
          <div
            style={{
              height: 4,
              width: 48,
              background: COLORS.primary,
              marginRight: 20,
              borderRadius: 2,
            }}
          />
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: COLORS.ink,
            }}
          >
            {SITE.domain}
          </div>
          <div style={{ marginLeft: 'auto', color: COLORS.muted, fontSize: 18 }}>
            {post?.author ?? SITE.author}
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    },
  );
}
