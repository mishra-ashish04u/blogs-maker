'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, CornerDownLeft, Search, X } from 'lucide-react';

interface IndexedPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  readTime: number;
  date: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const MAX_RESULTS = 8;

/**
 * Global Cmd/Ctrl+K search modal.
 *
 * - Fetches /api/search-index once per session, caches in module state
 * - Substring match (case-insensitive) across title, excerpt, category, author
 * - Keyboard: ↑/↓ to move, Enter to open, Esc to close
 * - Focus-trapped while open
 */

let cachedIndex: IndexedPost[] | null = null;

export function SearchCommand({ open, onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IndexedPost[]>([]);
  const [recent, setRecent] = useState<IndexedPost[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Prefetch index once when the modal first opens.
  useEffect(() => {
    if (!open) return;
    if (cachedIndex) {
      setRecent(cachedIndex.slice(0, MAX_RESULTS));
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch('/api/search-index');
        if (!res.ok) throw new Error(`Search index fetch failed: ${res.status}`);
        const data = (await res.json()) as { posts: IndexedPost[] };
        if (cancelled) return;
        cachedIndex = data.posts;
        setRecent(data.posts.slice(0, MAX_RESULTS));
      } catch {
        // Silent — modal still works, just with no results until the user types
        // and a later fetch succeeds.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Filter on every keystroke. Simple case-insensitive multi-field match.
  useEffect(() => {
    if (!cachedIndex) {
      setResults([]);
      return;
    }
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      return;
    }
    const terms = q.split(/\s+/).filter(Boolean);
    const matched = cachedIndex
      .filter((p) => {
        const haystack = `${p.title} ${p.excerpt} ${p.category} ${p.author}`.toLowerCase();
        return terms.every((t) => haystack.includes(t));
      })
      .slice(0, MAX_RESULTS);
    setResults(matched);
    setActive(0);
  }, [query]);

  // Focus the input when opened + reset state when closed.
  useEffect(() => {
    if (!open) {
      setQuery('');
      setActive(0);
      return;
    }
    // Prevent body scroll while the modal is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    return () => {
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [open]);

  const shown: IndexedPost[] = query.trim() ? results : recent;

  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  const navigate = useCallback(
    (slug: string) => {
      onClose();
      router.push(`/blog/${slug}`);
    },
    [onClose, router],
  );

  // Keyboard navigation within the modal.
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (shown.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % shown.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + shown.length) % shown.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = shown[active];
      if (target) navigate(target.slug);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Site search"
      onKeyDown={onKeyDown}
      ref={dialogRef}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close search"
        onClick={close}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Panel */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl bg-surface-lowest shadow-ambient-lg ghost-border">
        <div className="flex items-center gap-3 border-b border-outline-variant px-4">
          <Search className="h-4 w-4 text-on-surface-muted" aria-hidden="true" />
          <label htmlFor="cmdk-input" className="sr-only">
            Search articles
          </label>
          <input
            id="cmdk-input"
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search scams, e.g. “parcel text” or “bank call”…"
            className="flex-1 bg-transparent py-3.5 text-[15px] text-on-bg placeholder:text-on-surface-muted focus:outline-none"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-on-surface-muted transition-colors hover:bg-surface-container hover:text-primary"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading && shown.length === 0 && (
            <p className="px-4 py-6 text-sm text-on-surface-muted">Loading index…</p>
          )}

          {!loading && shown.length === 0 && query && (
            <p className="px-4 py-6 text-sm text-on-surface-muted">
              No articles matched &ldquo;{query}&rdquo;.
            </p>
          )}

          {!loading && shown.length === 0 && !query && (
            <p className="px-4 py-6 text-sm text-on-surface-muted">
              Start typing to search scam alerts and guides.
            </p>
          )}

          {shown.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-muted">
                {query ? `${shown.length} result${shown.length === 1 ? '' : 's'}` : 'Recent articles'}
              </p>
              <ul role="listbox" aria-label="Search results">
                {shown.map((post, i) => (
                  <li key={post.slug}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === active}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => navigate(post.slug)}
                      className={`flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                        i === active
                          ? 'bg-surface-container'
                          : 'hover:bg-surface-low'
                      }`}
                    >
                      <span className="mt-1 inline-flex h-5 shrink-0 items-center rounded-sm bg-primary-container/30 px-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">
                        {post.category}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 block text-[14px] font-semibold text-on-bg">
                          {post.title}
                        </span>
                        <span className="mt-0.5 line-clamp-1 block text-[12px] text-on-surface-muted">
                          {post.author} · {post.date}
                        </span>
                      </span>
                      <span className="shrink-0 inline-flex items-center gap-1 text-[11px] text-on-surface-muted">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {post.readTime}m
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Footer shortcut legend */}
        <div className="flex items-center justify-between gap-4 border-t border-outline-variant bg-surface-low px-4 py-2 text-[10px] text-on-surface-muted">
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↑</Kbd> <Kbd>↓</Kbd> navigate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd><CornerDownLeft className="h-2.5 w-2.5" aria-hidden="true" /></Kbd> open
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>Esc</Kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded border border-outline-variant bg-surface-lowest px-1 font-mono text-[10px] text-on-surface-variant">
      {children}
    </kbd>
  );
}
