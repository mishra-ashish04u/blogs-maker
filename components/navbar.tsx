'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, X, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { SearchCommand } from '@/components/search-command';
import { useEffect, useState } from 'react';
import { SITE } from '@/lib/site';

const navItems = [
  { label: 'Latest',        href: '/',             desc: "Today's scam alerts" },
  { label: 'Topics',        href: '/curation',     desc: 'Browse by category' },
  { label: 'Deep Dives',    href: '/perspectives', desc: 'How the big scams really work' },
  { label: 'Archive',  href: '/archives',     desc: 'Everything we\u2019ve published' },
  { label: 'Report a Scam', href: '/submit-tip',   desc: 'Warn others about a scam' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname.startsWith('/blog');
    return pathname.startsWith(href);
  };

  // Close overlays on route change.
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Global Cmd/Ctrl+K shortcut opens the search modal; Esc closes mobile nav.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isK = e.key === 'k' || e.key === 'K';
      if (isK && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === 'Escape') {
        setMobileOpen(false);
      } else if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Slash-to-search — only fire when the user isn't already typing.
        const t = e.target as HTMLElement | null;
        const typing =
          t &&
          (t.tagName === 'INPUT' ||
            t.tagName === 'TEXTAREA' ||
            t.isContentEditable);
        if (!typing) {
          e.preventDefault();
          setSearchOpen(true);
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {/* Skip link for keyboard users */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-surface-lowest focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-ink focus:shadow-ambient"
      >
        Skip to main content
      </a>

      <nav
        aria-label="Primary"
        className="relative z-40 border-b border-outline-variant bg-surface"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          {/* Brand — clean Inter wordmark, no serif, no italic */}
          <Link
            href="/"
            className="flex items-center gap-2 focus:outline-none"
            aria-label={`${SITE.name} home`}
          >
            <span
              aria-hidden="true"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-white"
            >
              {SITE.monogram}
            </span>
            <span className="text-[17px] font-bold tracking-[-0.02em] text-on-bg">
              {SITE.wordmark.lead}
              <span className="text-primary">{SITE.wordmark.accent}</span>
            </span>
          </Link>

          {/* Desktop nav — normal-case, medium weight, readable */}
          <div className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`text-[14px] font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-primary'
                    : 'text-on-surface-variant hover:text-on-bg'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Actions — compact */}
          <div className="flex items-center gap-1">
            <button
              aria-label="Open search"
              onClick={() => setSearchOpen(true)}
              title="Search (⌘K)"
              className="inline-flex h-9 items-center gap-2 rounded-md px-2.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-bg md:ghost-border md:px-3"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <kbd className="hidden items-center rounded border border-outline-variant bg-surface-low px-1.5 py-0.5 font-mono text-[10px] text-on-surface-muted md:inline-flex">
                ⌘K
              </kbd>
            </button>

            <ThemeToggle />

            {/* Mobile toggle */}
            <button
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="navbar-mobile"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary-ink lg:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div id="navbar-mobile" className="glass-low lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={`group flex items-center justify-between rounded-lg px-4 py-3 transition-colors ${
                    isActive(item.href)
                      ? 'bg-surface-container text-primary-ink'
                      : 'text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="flex flex-col">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.24em]">
                      {item.label}
                    </span>
                    <span className="mt-0.5 text-[11px] text-on-surface-muted">{item.desc}</span>
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5 -translate-x-1 text-on-surface-muted opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Global Cmd+K search modal */}
      <SearchCommand open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

