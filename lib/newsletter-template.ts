/**
 * HTML + plain-text email templates for the daily brief.
 *
 * Rules for email-safe HTML:
 *   - No external stylesheets, no <style> blocks that clients will strip.
 *   - All critical styles inline.
 *   - Layout via <table>/<td>, not flexbox/grid.
 *   - Max width 600px, centered.
 *   - Web-safe font stack (email clients won't load Google Fonts reliably).
 *   - Images must have explicit width/height attributes.
 *   - Colours repeated as both hex and attributes for Outlook mso-compat.
 */

import { SITE } from './site';

interface BuildInput {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    author: string;
    readTime: number;
    coverImage: string;
    date: string;
  };
  postUrl: string;
  unsubscribeUrl: string;
}

interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

const PRIMARY = '#9d4300';
const ON_BG = '#18181b';
const MUTED = '#52525b';
const SURFACE = '#faf8f4';
const CARD = '#ffffff';
const OUTLINE = '#e4e4e7';

function escape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildDailyBriefEmail(input: BuildInput): BuiltEmail {
  const { post, postUrl, unsubscribeUrl } = input;

  const subject = `${post.title} — ${SITE.name}`;

  // Preheader: the snippet shown in the inbox preview next to the subject.
  const preheader = post.excerpt.length > 140
    ? post.excerpt.slice(0, 137) + '…'
    : post.excerpt;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escape(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${SURFACE};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${ON_BG};-webkit-font-smoothing:antialiased;">
  <!-- Preheader (hidden, feeds inbox preview) -->
  <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;mso-hide:all;">
    ${escape(preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${SURFACE}" style="background-color:${SURFACE};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:0 0 24px 0;">
              <a href="${postUrl.replace(/\/blog\/.*$/, '')}" style="text-decoration:none;color:${PRIMARY};font-weight:800;font-size:22px;letter-spacing:-0.02em;font-family:Georgia,serif;">
                ${escape(SITE.wordmark.lead)}<span style="color:${ON_BG};">${escape(SITE.wordmark.accent)}</span>
              </a>
              <div style="margin-top:6px;font-size:10px;color:${MUTED};text-transform:uppercase;letter-spacing:0.14em;font-weight:600;">
                Scam alert · ${escape(post.date)}
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td bgcolor="${CARD}" style="background-color:${CARD};border-radius:12px;border:1px solid ${OUTLINE};overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Cover image -->
                <tr>
                  <td>
                    <a href="${postUrl}" target="_blank" style="display:block;">
                      <img
                        src="${escape(post.coverImage)}"
                        alt="${escape(post.title)}"
                        width="600"
                        height="375"
                        style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;"
                      >
                    </a>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:28px 28px 8px 28px;">
                    <p style="margin:0 0 14px 0;font-size:11px;color:${PRIMARY};text-transform:uppercase;letter-spacing:0.16em;font-weight:600;">
                      ${escape(post.category)} &middot; ${post.readTime} min read
                    </p>
                    <h1 style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:26px;line-height:1.2;font-weight:800;letter-spacing:-0.02em;color:${ON_BG};">
                      <a href="${postUrl}" target="_blank" style="text-decoration:none;color:${ON_BG};">
                        ${escape(post.title)}
                      </a>
                    </h1>
                    <p style="margin:16px 0 0 0;font-size:15px;line-height:1.6;color:${MUTED};">
                      ${escape(post.excerpt)}
                    </p>
                  </td>
                </tr>

                <!-- Byline -->
                <tr>
                  <td style="padding:16px 28px 8px 28px;">
                    <p style="margin:0;font-size:12px;color:${MUTED};text-transform:uppercase;letter-spacing:0.12em;font-weight:600;">
                      By ${escape(post.author)}
                    </p>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td style="padding:24px 28px 28px 28px;">
                    <a
                      href="${postUrl}"
                      target="_blank"
                      style="display:inline-block;background-color:${PRIMARY};color:#ffffff;text-decoration:none;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:600;padding:12px 20px;border-radius:6px;"
                    >
                      Read the full alert &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td height="24" style="line-height:24px;font-size:24px;">&nbsp;</td></tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:16px 24px 8px 24px;">
              <p style="margin:0;font-size:11px;line-height:1.6;color:${MUTED};text-align:center;">
                You&rsquo;re receiving this because you subscribed to scam alerts from ${escape(SITE.name)}.
                <br>
                We will never ask for your passwords, codes or bank details by email.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 24px 24px 24px;">
              <p style="margin:0;font-size:11px;line-height:1.8;color:${MUTED};text-align:center;">
                <a href="${unsubscribeUrl}" style="color:${PRIMARY};text-decoration:underline;">
                  Unsubscribe
                </a>
                &nbsp;&middot;&nbsp;
                <a href="${postUrl.replace(/\/blog\/.*$/, '')}" style="color:${PRIMARY};text-decoration:underline;">
                  Visit ${escape(SITE.name)}
                </a>
              </p>
              <p style="margin:12px 0 0 0;font-size:10px;color:${MUTED};text-transform:uppercase;letter-spacing:0.12em;">
                &copy; ${new Date().getFullYear()} ${escape(SITE.name)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Plain-text fallback — still reaches 10–15% of recipients.
  const text = `${post.title}

${post.category} · ${post.readTime} min read · ${post.date}

${post.excerpt}

By ${post.author}

Read the full alert: ${postUrl}

---

You're receiving this because you subscribed to scam alerts from ${SITE.name}.
We will never ask for your passwords, codes or bank details by email.

Unsubscribe: ${unsubscribeUrl}
© ${new Date().getFullYear()} ${SITE.name}`;

  return { subject, html, text };
}
