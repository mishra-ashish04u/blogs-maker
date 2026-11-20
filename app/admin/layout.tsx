import Link from 'next/link';
import { headers } from 'next/headers';
import {
  LayoutGrid,
  FileText,
  PlusCircle,
  Radio,
  Settings,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { LogoutButton } from '@/components/admin/logout-button';
import { HealthPill } from '@/components/admin/health-pill';
import { getAdminStatus } from '@/lib/admin-status';
import { SITE } from '@/lib/site';

export const metadata = {
  title: 'Admin',
  description: `Admin dashboard for ${SITE.name}.`,
};

const sidebar = [
  { label: 'Overview',   href: '/admin',             icon: LayoutGrid },
  { label: 'Posts',      href: '/admin/posts',       icon: FileText },
  { label: 'New post',   href: '/admin/posts/new',   icon: PlusCircle },
  { label: 'Automation', href: '/admin/automation',  icon: Radio },
  { label: 'Settings',   href: '/admin/settings',    icon: Settings },
];

// Derive breadcrumbs from pathname, injected by middleware.
function breadcrumbsFor(pathname: string): Array<{ label: string; href?: string }> {
  const segments = pathname.replace(/^\/+|\/+$/g, '').split('/');
  if (segments.length === 1 && segments[0] === 'admin') {
    return [{ label: 'Overview' }];
  }
  const crumbs: Array<{ label: string; href?: string }> = [{ label: 'Admin', href: '/admin' }];
  if (segments[1] === 'posts') {
    crumbs.push({ label: 'Posts', href: '/admin/posts' });
    if (segments[2] === 'new') crumbs.push({ label: 'New' });
    else if (segments[2]) crumbs.push({ label: 'Edit' });
  } else if (segments[1] === 'automation') {
    crumbs.push({ label: 'Automation' });
  } else if (segments[1] === 'settings') {
    crumbs.push({ label: 'Settings' });
  }
  return crumbs;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const pathname = h.get('x-pathname') || '';
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Pipeline health pill is rendered in the header so a failing run is
  // visible no matter which admin page the operator is on.
  const status = await getAdminStatus();
  const crumbs = breadcrumbsFor(pathname);

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-outline-variant bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          {/* Left: wordmark + section label */}
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2" aria-label="Admin home">
              <span
                aria-hidden="true"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-white"
              >
                iF
              </span>
              <span className="text-[15px] font-bold tracking-[-0.02em] text-on-bg">
                Admin
              </span>
            </Link>
            <span aria-hidden="true" className="hidden h-4 w-px bg-outline-variant md:block" />
            {/* Breadcrumbs — give context on deep pages */}
            <nav aria-label="Breadcrumb" className="hidden md:block">
              <ol className="flex items-center gap-1.5 text-[13px] text-on-surface-muted">
                {crumbs.map((c, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    {i > 0 && (
                      <ChevronRight
                        aria-hidden="true"
                        className="h-3.5 w-3.5 text-on-surface-muted/60"
                      />
                    )}
                    {c.href ? (
                      <Link href={c.href} className="transition-colors hover:text-on-bg">
                        {c.label}
                      </Link>
                    ) : (
                      <span className="font-medium text-on-bg">{c.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          {/* Right: health pill + view-site + logout */}
          <div className="flex items-center gap-3">
            <HealthPill state={status.state} label={status.label} />
            <Link
              href="/"
              className="hidden items-center gap-1.5 text-[13px] font-medium text-on-surface-variant transition-colors hover:text-on-bg md:inline-flex"
            >
              View site
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-10 px-6 py-10">
        <aside className="hidden w-56 shrink-0 md:block" aria-label="Admin sections">
          <nav className="sticky top-6 space-y-0.5">
            {sidebar.map((item) => {
              const Icon = item.icon;
              // An item is active if the current path matches or is nested under it.
              // Overview ("/admin") only matches exactly — otherwise every admin
              // page would light up as "Overview".
              const active =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`group flex items-center gap-3 rounded-md px-3 py-2 text-[14px] font-medium transition-colors ${
                    active
                      ? 'bg-primary-container/25 text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-bg'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${active ? 'text-primary' : 'text-on-surface-muted group-hover:text-on-bg'}`}
                    aria-hidden="true"
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
