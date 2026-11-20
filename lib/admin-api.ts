import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, assertSameOrigin, verifyAdminToken } from '@/lib/admin-auth';
import { isEmptyHtml, sanitizePostHtml } from '@/lib/html-sanitize';

import { CATEGORIES, type Category } from '@/lib/site';

export { CATEGORIES, type Category };

export interface PostInput {
  title: string;
  slug: string;
  excerpt: string;
  category: Category;
  author: string;
  readTime: number;
  coverImage: string;
  content: string;
  status: 'draft' | 'published' | 'retired';
}

/**
 * Require a valid admin session + same-origin for state-changing calls.
 * Returns null if the caller is authorised; otherwise a NextResponse to return.
 */
export async function requireAdmin(request: Request): Promise<NextResponse | null> {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf as NextResponse;
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!(await verifyAdminToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/**
 * Slugify text for a URL. Mirrors the pipeline's slugify so generated posts
 * and hand-authored posts behave identically.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

type ValidationResult<T> = { ok: true; data: T } | { ok: false; error: string };

export function validatePostInput(raw: unknown): ValidationResult<PostInput> {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Invalid body' };
  const b = raw as Record<string, unknown>;

  const title = typeof b.title === 'string' ? b.title.trim() : '';
  if (!title) return { ok: false, error: 'Title is required' };
  if (title.length > 300) return { ok: false, error: 'Title is too long (max 300)' };

  const excerpt = typeof b.excerpt === 'string' ? b.excerpt.trim() : '';
  if (!excerpt) return { ok: false, error: 'Excerpt is required' };
  if (excerpt.length > 600) return { ok: false, error: 'Excerpt is too long (max 600)' };

  const category = typeof b.category === 'string' ? (b.category as Category) : '';
  if (!CATEGORIES.includes(category as Category)) {
    return { ok: false, error: `Category must be one of: ${CATEGORIES.join(', ')}` };
  }

  const author = typeof b.author === 'string' ? b.author.trim() : '';
  if (!author) return { ok: false, error: 'Author is required' };

  const readTimeNum = Number(b.readTime);
  if (!Number.isFinite(readTimeNum) || readTimeNum < 1 || readTimeNum > 60) {
    return { ok: false, error: 'Read time must be between 1 and 60 minutes' };
  }

  const coverImage = typeof b.coverImage === 'string' ? b.coverImage.trim() : '';
  if (!coverImage) return { ok: false, error: 'Cover image URL is required' };
  // Site-relative paths (/images/…) or absolute http(s) URLs only.
  if (!/^(https?:\/\/|\/(?!\/))/i.test(coverImage)) {
    return { ok: false, error: 'Cover image must be an http(s) URL or a /path on this site' };
  }

  const rawContent = typeof b.content === 'string' ? b.content : '';
  if (rawContent.length > 500_000) return { ok: false, error: 'Content is too long' };
  const content = sanitizePostHtml(rawContent);
  if (isEmptyHtml(content)) return { ok: false, error: 'Content is required' };

  const rawSlug = typeof b.slug === 'string' ? b.slug.trim() : '';
  const slug = rawSlug ? slugify(rawSlug) : slugify(title);
  if (!slug) return { ok: false, error: 'Slug could not be derived from title' };

  const status = (typeof b.status === 'string' ? b.status : 'published') as PostInput['status'];
  if (!['draft', 'published', 'retired'].includes(status)) {
    return { ok: false, error: 'Invalid status' };
  }

  return {
    ok: true,
    data: {
      title,
      slug,
      excerpt,
      category: category as Category,
      author,
      readTime: Math.round(readTimeNum),
      coverImage,
      content,
      status,
    },
  };
}

export function formatToday(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
