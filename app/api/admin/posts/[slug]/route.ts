import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { formatToday, requireAdmin, validatePostInput } from '@/lib/admin-api';
import { isSupabaseConfigured } from '@/lib/supabase/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ensureConfigured(): NextResponse | null {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Supabase is not configured on this server.' },
      { status: 503 },
    );
  }
  return null;
}

async function tryRevalidate(): Promise<void> {
  const siteUrl = process.env.SITE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!siteUrl || !secret) return;
  try {
    await fetch(`${siteUrl}/api/revalidate?secret=${encodeURIComponent(secret)}`, {
      method: 'POST',
    });
  } catch {
    // best-effort
  }
}

/**
 * PUT — update an existing post by its CURRENT slug.
 * Body may change any field including slug itself.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const cfg = ensureConfigured();
  if (cfg) return cfg;

  const { slug: currentSlug } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const v = validatePostInput(body);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  const supabase = getSupabaseAdmin();

  const { data: current } = await supabase
    .from('posts')
    .select('id, status')
    .eq('slug', currentSlug)
    .maybeSingle();
  if (!current) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // A draft that goes live should be dated (and ordered) by its publish day,
  // not the day the draft was started. There is no published_at column, so
  // created_at doubles as the publish timestamp used for ordering.
  const nowIso = new Date().toISOString();
  const goingLive = current.status !== 'published' && v.data.status === 'published';
  const publishFields = goingLive ? { date: formatToday(), created_at: nowIso } : {};

  // If the slug changed, make sure the new slug isn't already taken by a different row.
  if (v.data.slug !== currentSlug) {
    const { data: conflict } = await supabase
      .from('posts')
      .select('id')
      .eq('slug', v.data.slug)
      .maybeSingle();
    if (conflict) {
      return NextResponse.json(
        { error: `Another post already uses slug "${v.data.slug}"` },
        { status: 409 },
      );
    }
  }

  const { data: updated, error } = await supabase
    .from('posts')
    .update({
      slug: v.data.slug,
      title: v.data.title,
      excerpt: v.data.excerpt,
      category: v.data.category,
      author: v.data.author,
      read_time: v.data.readTime,
      cover_image: v.data.coverImage,
      content: v.data.content,
      status: v.data.status,
      updated_at: nowIso,
      ...publishFields,
    })
    .eq('id', current.id)
    .select('id, slug')
    .single();

  if (error || !updated) {
    return NextResponse.json(
      { error: error?.message ?? 'Update failed' },
      { status: 500 },
    );
  }

  await tryRevalidate();
  return NextResponse.json({ ok: true, id: updated.id, slug: updated.slug });
}

/**
 * DELETE — soft-delete (set status='retired'). Accepts `?hard=true` to
 * actually remove the row. Hard delete is destructive; use sparingly.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const cfg = ensureConfigured();
  if (cfg) return cfg;

  const { slug } = await params;
  const hard = new URL(request.url).searchParams.get('hard') === 'true';
  const supabase = getSupabaseAdmin();

  if (hard) {
    const { error } = await supabase.from('posts').delete().eq('slug', slug);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from('posts')
      .update({ status: 'retired', updated_at: new Date().toISOString() })
      .eq('slug', slug);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await tryRevalidate();
  return NextResponse.json({ ok: true, mode: hard ? 'hard' : 'retired' });
}
