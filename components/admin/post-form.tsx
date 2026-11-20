'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ImageUp,
  Loader2,
  Save,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { ACCEPTED_IMAGE_TYPES, uploadImage } from '@/lib/admin-upload';

import { CATEGORIES, SITE, type Category } from '@/lib/site';

export interface PostFormValues {
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

interface Props {
  mode: 'create' | 'edit';
  /** For edit mode: the current (pre-edit) slug, used as the URL for PUT. */
  currentSlug?: string;
  initial?: Partial<PostFormValues>;
}

// Limits that match what the DB + downstream consumers expect. Used for
// both the maxLength attribute and live character counters.
const LIMITS = {
  title: 120,
  slug: 80,
  excerpt: 300,
} as const;

const inputCls =
  'w-full rounded-md bg-surface-low ghost-border px-3 py-2 text-sm text-on-bg placeholder:text-on-surface-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent';
const labelCls =
  'mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant';

/** Mirror the server-side slugify rules so preview + server agree. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, LIMITS.slug);
}

/** ~225 wpm, clamped to the 1–60 range the API accepts. */
function estimateReadTime(html: string): number {
  const words = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.min(60, Math.max(1, Math.round(words / 225)));
}

function Counter({ used, max }: { used: number; max: number }) {
  const warn = used >= max * 0.9;
  const over = used > max;
  return (
    <span
      className={`text-[10px] font-medium tabular-nums ${
        over ? 'text-error' : warn ? 'text-warning' : 'text-on-surface-muted'
      }`}
    >
      {used}/{max}
    </span>
  );
}

export function PostForm({ mode, currentSlug, initial }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<PostFormValues>({
    title: initial?.title ?? '',
    slug: initial?.slug ?? '',
    excerpt: initial?.excerpt ?? '',
    category: (initial?.category as Category) ?? CATEGORIES[0],
    author: initial?.author ?? SITE.author,
    readTime: initial?.readTime ?? 10,
    coverImage: initial?.coverImage ?? '',
    content: initial?.content ?? '',
    status: initial?.status ?? 'draft',
  });
  // When true, the slug follows the title automatically. Flips to false the
  // moment the user edits the slug manually — then they own it.
  const [slugLocked, setSlugLocked] = useState(
    mode === 'create' || !initial?.slug,
  );
  // Same idea for read time: follows the body word count until edited by hand.
  const [readTimeAuto, setReadTimeAuto] = useState(mode === 'create');
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverDragOver, setCoverDragOver] = useState(false);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<null | 'save' | 'publish' | 'delete'>(null);
  const [message, setMessage] = useState<
    | { kind: 'success'; text: string }
    | { kind: 'error'; text: string }
    | null
  >(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Focus title on mount for new posts (not on edits — operator already
  // knows which post they opened).
  useEffect(() => {
    if (mode === 'create') titleRef.current?.focus();
  }, [mode]);

  function set<K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function updateContent(html: string) {
    setValues((v) => ({
      ...v,
      content: html,
      readTime: readTimeAuto ? estimateReadTime(html) : v.readTime,
    }));
  }

  async function uploadCover(file: File | undefined) {
    if (!file || coverUploading) return;
    setCoverUploading(true);
    setMessage(null);
    try {
      const url = await uploadImage(file);
      set('coverImage', url);
    } catch (err) {
      setMessage({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Cover upload failed',
      });
    } finally {
      setCoverUploading(false);
    }
  }

  function updateTitle(next: string) {
    const trimmed = next.slice(0, LIMITS.title);
    setValues((v) => ({
      ...v,
      title: trimmed,
      slug: slugLocked ? slugify(trimmed) : v.slug,
    }));
  }

  async function submit(intent: 'save' | 'publish') {
    if (pending) return;
    setPending(intent);
    setMessage(null);
    const payload: PostFormValues = {
      ...values,
      slug: values.slug.trim() || slugify(values.title),
      status: intent === 'publish' ? 'published' : 'draft',
    };
    const url =
      mode === 'create'
        ? '/api/admin/posts'
        : `/api/admin/posts/${encodeURIComponent(currentSlug!)}`;
    const method = mode === 'create' ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        slug?: string;
        error?: string;
      };
      if (!res.ok) {
        setMessage({ kind: 'error', text: data.error ?? `Request failed (${res.status})` });
        setPending(null);
        return;
      }
      setMessage({
        kind: 'success',
        text:
          intent === 'publish'
            ? mode === 'create'
              ? 'Published.'
              : 'Updated.'
            : 'Saved as draft.',
      });

      if (mode === 'create' && data.slug) {
        router.replace(`/admin/posts/${data.slug}`);
      } else if (mode === 'edit' && data.slug && data.slug !== currentSlug) {
        router.replace(`/admin/posts/${data.slug}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setMessage({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Network error',
      });
    } finally {
      setPending(null);
    }
  }

  async function del() {
    if (!currentSlug || pending) return;
    const ok = window.confirm(
      `Retire "${values.title || currentSlug}"? It will be hidden from the public site. You can hard-delete later from Supabase.`,
    );
    if (!ok) return;
    setPending('delete');
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/posts/${encodeURIComponent(currentSlug)}`, {
        method: 'DELETE',
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage({ kind: 'error', text: data.error ?? `Delete failed (${res.status})` });
        setPending(null);
        return;
      }
      router.replace('/admin/posts');
      router.refresh();
    } catch (err) {
      setMessage({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Network error',
      });
      setPending(null);
    }
  }

  const hasErrors = useMemo(() => {
    if (!values.title.trim()) return 'Title is required';
    if (!values.excerpt.trim()) return 'Excerpt is required';
    if (!values.author.trim()) return 'Author is required';
    if (coverUploading) return 'Waiting for cover upload…';
    if (!values.coverImage.trim()) return 'Cover image is required';
    if (!values.content.trim()) return 'Body is required';
    if (values.readTime < 1 || values.readTime > 60) return 'Read time must be 1–60 minutes';
    return null;
  }, [values, coverUploading]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit('publish');
      }}
      className="space-y-8 pb-28"
    >
      {/* Identity group */}
      <fieldset className="space-y-5 rounded-xl border border-outline-variant bg-surface-lowest p-5 md:p-6">
        <legend className="sr-only">Post identity</legend>

        <div>
          <label htmlFor="title" className={labelCls}>
            <span>Title</span>
            <Counter used={values.title.length} max={LIMITS.title} />
          </label>
          <input
            ref={titleRef}
            id="title"
            type="text"
            value={values.title}
            onChange={(e) => updateTitle(e.target.value)}
            placeholder="e.g. Fake parcel delivery texts: how to spot them"
            className={`${inputCls} text-[15px]`}
            maxLength={LIMITS.title}
            required
          />
        </div>

        <div>
          <label htmlFor="slug" className={labelCls}>
            <span>Slug</span>
            <span className="flex items-center gap-2">
              {slugLocked && (
                <span className="text-[10px] font-medium text-on-surface-muted">
                  auto from title
                </span>
              )}
              <Counter used={values.slug.length} max={LIMITS.slug} />
            </span>
          </label>
          <input
            id="slug"
            type="text"
            value={values.slug}
            onChange={(e) => {
              setSlugLocked(false);
              set('slug', slugify(e.target.value));
            }}
            placeholder="auto-generated-from-title"
            className={`${inputCls} font-mono text-[12px]`}
            maxLength={LIMITS.slug}
          />
          <p className="mt-1 text-[11px] text-on-surface-muted">
            URL will be: /blog/{values.slug || slugify(values.title) || 'your-post-slug'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div>
            <label htmlFor="category" className={labelCls}>
              <span>Category</span>
            </label>
            <select
              id="category"
              value={values.category}
              onChange={(e) => set('category', e.target.value as Category)}
              className={inputCls}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="author" className={labelCls}>
              <span>Author</span>
            </label>
            <input
              id="author"
              type="text"
              value={values.author}
              onChange={(e) => set('author', e.target.value)}
              placeholder={SITE.author}
              className={inputCls}
              required
            />
          </div>
          <div>
            <label htmlFor="readtime" className={labelCls}>
              <span>Read time (min)</span>
              {readTimeAuto ? (
                <span className="text-[10px] font-medium normal-case tracking-normal text-on-surface-muted">
                  auto from body
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setReadTimeAuto(true);
                    set('readTime', estimateReadTime(values.content));
                  }}
                  className="text-[10px] font-medium normal-case tracking-normal text-primary hover:underline"
                >
                  recalculate
                </button>
              )}
            </label>
            <input
              id="readtime"
              type="number"
              min={1}
              max={60}
              value={values.readTime}
              onChange={(e) => {
                setReadTimeAuto(false);
                set('readTime', Number(e.target.value));
              }}
              className={inputCls}
              required
            />
          </div>
        </div>
      </fieldset>

      {/* Content group */}
      <fieldset className="space-y-5 rounded-xl border border-outline-variant bg-surface-lowest p-5 md:p-6">
        <legend className="sr-only">Post content</legend>

        <div>
          <label htmlFor="excerpt" className={labelCls}>
            <span>Excerpt</span>
            <Counter used={values.excerpt.length} max={LIMITS.excerpt} />
          </label>
          <textarea
            id="excerpt"
            rows={2}
            value={values.excerpt}
            onChange={(e) => set('excerpt', e.target.value.slice(0, LIMITS.excerpt))}
            placeholder="One-paragraph summary shown on the home page and in search results."
            className={inputCls}
            maxLength={LIMITS.excerpt}
            required
          />
        </div>

        <div>
          <label htmlFor="cover" className={labelCls}>
            <span>Cover image</span>
            <span className="text-[10px] font-medium normal-case tracking-normal text-on-surface-muted">
              16:9 recommended · max 5 MB
            </span>
          </label>

          {values.coverImage ? (
            <div className="relative overflow-hidden rounded-md ghost-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={values.coverImage}
                src={values.coverImage}
                alt="Cover preview"
                className="aspect-[16/9] w-full bg-surface-high object-cover"
              />
              <div className="absolute right-2 top-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => coverFileRef.current?.click()}
                  disabled={coverUploading}
                  className="inline-flex items-center gap-1.5 rounded-md bg-surface-lowest/90 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-on-bg backdrop-blur hover:bg-surface-lowest disabled:opacity-60"
                >
                  {coverUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <ImageUp className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => set('coverImage', '')}
                  aria-label="Remove cover image"
                  className="inline-flex items-center rounded-md bg-surface-lowest/90 px-2 py-1.5 text-on-bg backdrop-blur hover:bg-surface-lowest"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverFileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setCoverDragOver(true);
              }}
              onDragLeave={() => setCoverDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setCoverDragOver(false);
                void uploadCover(e.dataTransfer.files?.[0]);
              }}
              disabled={coverUploading}
              className={`flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed text-sm transition-colors disabled:cursor-wait ${
                coverDragOver
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-outline-variant bg-surface-low text-on-surface-variant hover:border-primary/60 hover:text-on-bg'
              }`}
            >
              {coverUploading ? (
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
              ) : (
                <ImageUp className="h-6 w-6" aria-hidden="true" />
              )}
              <span className="font-semibold">
                {coverUploading ? 'Uploading…' : 'Click to upload or drag an image here'}
              </span>
              <span className="text-[11px] text-on-surface-muted">JPG, PNG, WebP, AVIF or GIF</span>
            </button>
          )}

          <input
            ref={coverFileRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            className="hidden"
            onChange={(e) => {
              void uploadCover(e.target.files?.[0]);
              e.target.value = '';
            }}
          />

          <input
            id="cover"
            type="text"
            inputMode="url"
            value={values.coverImage}
            onChange={(e) => set('coverImage', e.target.value)}
            placeholder="…or paste an image URL (https://… or /images/…)"
            className={`${inputCls} mt-2 font-mono text-[12px]`}
          />
        </div>

        <div>
          <label htmlFor="body" className={labelCls}>
            <span>Body</span>
            <span className="text-[10px] font-medium normal-case tracking-normal text-on-surface-muted">
              Paste or drop images straight into the text
            </span>
          </label>
          <RichTextEditor
            id="body"
            value={values.content}
            onChange={updateContent}
            onError={(text) => setMessage({ kind: 'error', text })}
          />
        </div>
      </fieldset>

      {/* Inline success / error, above the sticky action bar */}
      {message && (
        <div
          role="status"
          className={`flex items-start gap-2 rounded-md px-3 py-2 text-[13px] ${
            message.kind === 'success'
              ? 'bg-success/10 text-success'
              : 'bg-error/10 text-error'
          }`}
        >
          {message.kind === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          {message.text}
        </div>
      )}

      {/* STICKY ACTION BAR — always reachable without scrolling back */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-outline-variant bg-surface-lowest/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:pl-[calc(14rem+2.5rem)]">
          <div className="flex items-center gap-3 text-[12px]">
            {hasErrors ? (
              <span className="inline-flex items-center gap-1.5 text-warning">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                {hasErrors}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-on-surface-muted">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                Ready to save
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {mode === 'edit' && (
              <button
                type="button"
                onClick={del}
                disabled={pending !== null}
                className="inline-flex items-center gap-1.5 rounded-md bg-error/10 px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-error transition-colors hover:bg-error/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending === 'delete' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                Retire
              </button>
            )}
            <button
              type="button"
              onClick={() => submit('save')}
              disabled={pending !== null || !!hasErrors}
              className="cta-secondary inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[12px] uppercase tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending === 'save' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Save draft
            </button>
            <button
              type="submit"
              disabled={pending !== null || !!hasErrors}
              className="cta-primary inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[12px] uppercase tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {pending === 'publish' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {mode === 'create' ? 'Publish' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
