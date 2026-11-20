import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'covers';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Extension is derived from the sniffed bytes, never from the client's filename.
const SIGNATURES: Array<{ mime: string; ext: string; test: (b: Uint8Array) => boolean }> = [
  { mime: 'image/jpeg', ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: 'image/png',
    ext: 'png',
    test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    mime: 'image/gif',
    ext: 'gif',
    test: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38,
  },
  {
    mime: 'image/webp',
    ext: 'webp',
    test: (b) =>
      ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP',
  },
  {
    mime: 'image/avif',
    ext: 'avif',
    test: (b) => ascii(b, 4, 8) === 'ftyp' && /^avi[fs]$/.test(ascii(b, 8, 12)),
  },
];

function ascii(b: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...b.subarray(start, end));
}

function safeBaseName(name: string): string {
  const base = name.replace(/\.[^.]*$/, '');
  const cleaned = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return cleaned || 'image';
}

/**
 * POST multipart/form-data with a single `file` field.
 * Returns { url } — the public URL in the Supabase `covers` bucket.
 * Used for both cover images and inline images in the post body.
 */
export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Supabase is not configured on this server.' },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be 5 MB or smaller' }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = SIGNATURES.find((s) => s.test(bytes));
  if (!kind) {
    return NextResponse.json(
      { error: 'Unsupported image type. Use JPG, PNG, WebP, AVIF or GIF.' },
      { status: 415 },
    );
  }

  const now = new Date();
  const rand = crypto.randomUUID().slice(0, 8);
  const path = `manual/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${safeBaseName(file.name)}-${rand}.${kind.ext}`;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: kind.mime,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl });
}
