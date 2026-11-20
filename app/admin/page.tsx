import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowUpRight,
  PenLine,
  Radio,
  Eye,
  BookOpen,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { getAllPosts, type BlogPost } from '@/lib/blog-data';
import { getAdminStatus, formatRelative } from '@/lib/admin-status';
import type { PostRow } from '@/lib/supabase/types';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { RunNowButton } from '@/components/admin/run-now-button';

export const dynamic = 'force-dynamic';

// The overview is organised around three questions an admin actually asks
// when they open this page:
//   1. Is the pipeline healthy? (top banner — primary concern)
//   2. What did we publish most recently? (latest-post card)
//   3. What do I need to do right now? (quick actions)
// Category mix / long run table go to /admin/automation — they're reference
// material, not decision-driving data.

async function fetchAdminCatalog(): Promise<{
  total: number;
  published: number;
  drafts: number;
  retired: number;
  latest: BlogPost | null;
}> {
  if (!isSupabaseAdminConfigured()) {
    const fallback = await getAllPosts();
    return {
      total: fallback.length,
      published: fallback.length,
      drafts: 0,
      retired: 0,
      latest: fallback[0] ?? null,
    };
  }
  // Service role: RLS hides drafts/retired rows from the public key.
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });
  const rows = (data as PostRow[]) ?? [];
  const published = rows.filter((r) => r.status === 'published');
  const latestRow = published[0] ?? rows[0] ?? null;
  return {
    total: rows.length,
    published: published.length,
    drafts: rows.filter((r) => r.status === 'draft').length,
    retired: rows.filter((r) => r.status === 'retired').length,
    latest: latestRow
      ? {
          slug: latestRow.slug,
          title: latestRow.title,
          excerpt: latestRow.excerpt,
          category: latestRow.category,
          author: latestRow.author,
          date: latestRow.date,
          readTime: latestRow.read_time,
          coverImage: latestRow.cover_image,
          content: latestRow.content,
        }
      : null,
  };
}

function StatusBanner({
  state,
  label,
  activeRun,
  lastSuccess,
}: {
  state: Awaited<ReturnType<typeof getAdminStatus>>['state'];
  label: string;
  activeRun: boolean;
  lastSuccess: string | null;
}) {
  // A single banner that dominates the fold — the operator's primary signal.
  const cfg = {
    ok:            { icon: CheckCircle2, chip: 'bg-success/10',          text: 'text-success',   title: 'Pipeline healthy' },
    running:       { icon: Radio,        chip: 'bg-primary-container/30', text: 'text-primary',  title: 'Pipeline running' },
    failing:       { icon: AlertTriangle, chip: 'bg-error/10',            text: 'text-error',    title: 'Last run failed' },
    idle:          { icon: Clock,        chip: 'bg-surface-container',    text: 'text-on-surface-variant', title: 'No runs yet' },
    unconfigured:  { icon: AlertTriangle, chip: 'bg-warning/10',          text: 'text-warning',  title: 'Configuration incomplete' },
  }[state];
  const Icon = cfg.icon;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-lowest p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.chip} ${cfg.text}`}
        >
          <Icon className={`h-5 w-5 ${activeRun ? 'soft-pulse' : ''}`} />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-muted">
            Pipeline
          </p>
          <p className="mt-0.5 text-lg font-bold text-on-bg">{cfg.title}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-on-surface-variant">
            {label}
            {lastSuccess && state !== 'running' && state !== 'ok' && (
              <> · Last success {lastSuccess}.</>
            )}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        <RunNowButton />
        <Link
          href="/admin/automation"
          className="cta-secondary inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 text-[12px] uppercase tracking-[0.14em]"
        >
          Runs
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  tone = 'neutral',
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'neutral' | 'primary' | 'warning';
  href?: string;
}) {
  const toneCls =
    tone === 'primary'
      ? 'text-primary'
      : tone === 'warning'
        ? 'text-warning'
        : 'text-on-bg';
  const Inner = (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-muted">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-extrabold tracking-[-0.02em] ${toneCls}`}>
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-[12px] text-on-surface-muted">{hint}</p>
      )}
    </>
  );
  const base =
    'block rounded-xl border border-outline-variant bg-surface-lowest p-5 transition-colors';
  if (href) {
    return (
      <Link href={href} className={`${base} hover:border-outline hover:bg-surface-low`}>
        {Inner}
      </Link>
    );
  }
  return <div className={base}>{Inner}</div>;
}

export default async function AdminOverviewPage() {
  const [{ total, published, drafts, retired, latest }, status] = await Promise.all([
    fetchAdminCatalog(),
    getAdminStatus(),
  ]);

  const lastSuccessRel = status.lastSuccess
    ? formatRelative(status.lastSuccess.started_at)
    : null;

  return (
    <div className="space-y-8">
      {/* Greeting row */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          Editor desk
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-on-bg">
          Good to see you.
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          {status.state === 'running'
            ? 'Hold tight — a pipeline run is in progress.'
            : status.state === 'failing'
              ? 'The most recent automation run failed. Check the details and re-run when ready.'
              : lastSuccessRel
                ? `Last editorial shipped ${lastSuccessRel}. ${status.successCount} successful run${status.successCount === 1 ? '' : 's'} this week.`
                : 'No automation runs yet. Fire the pipeline to publish the first editorial.'}
        </p>
      </div>

      {/* Status banner — the one thing that matters most on open */}
      <StatusBanner
        state={status.state}
        label={status.label}
        activeRun={status.state === 'running'}
        lastSuccess={lastSuccessRel}
      />

      {/* KPI row — 4 glanceable numbers */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Published" value={published} tone="primary" href="/admin/posts" hint="Live on site" />
        <KpiCard label="Drafts" value={drafts} tone={drafts > 0 ? 'warning' : 'neutral'} href="/admin/posts" hint={drafts > 0 ? 'Waiting for you' : 'None pending'} />
        <KpiCard label="Retired" value={retired} href="/admin/posts" hint="Hidden from public" />
        <KpiCard
          label="Success rate"
          value={status.runs.length > 0 ? `${Math.round((status.successCount / status.runs.length) * 100)}%` : '—'}
          href="/admin/automation"
          hint={status.runs.length > 0 ? `${status.successCount}/${status.runs.length} recent runs` : 'No runs yet'}
        />
      </div>

      {/* Main grid — latest post + quick actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Latest post takes 2/3 */}
        {latest && (
          <section className="lg:col-span-2">
            <header className="mb-3 flex items-end justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-muted">
                Latest editorial
              </h2>
              <Link
                href={`/blog/${latest.slug}`}
                className="text-[12px] font-semibold text-primary hover:text-primary-hover"
              >
                View live →
              </Link>
            </header>
            <article className="overflow-hidden rounded-xl border border-outline-variant bg-surface-lowest">
              <div className="grid grid-cols-1 md:grid-cols-5">
                <div className="relative aspect-[4/3] md:col-span-2 md:aspect-auto">
                  <Image
                    src={latest.coverImage}
                    alt={latest.title}
                    fill
                    sizes="(min-width:768px) 40vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col justify-between gap-4 p-5 md:col-span-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                      {latest.category} · {latest.date}
                    </p>
                    <h3 className="mt-2 text-lg font-bold leading-snug tracking-[-0.02em] text-on-bg md:text-xl">
                      {latest.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-on-surface-variant">
                      {latest.excerpt}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[12px]">
                    <Link
                      href={`/admin/posts/${latest.slug}`}
                      className="cta-secondary inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[12px]"
                    >
                      <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
                      Edit
                    </Link>
                    <Link
                      href={`/blog/${latest.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[12px] text-on-surface-variant transition-colors hover:text-on-bg"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      View
                    </Link>
                    <span className="ml-auto text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-muted">
                      {latest.readTime} min
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </section>
        )}

        {/* Quick actions stack */}
        <section className="space-y-3">
          <header>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-muted">
              Quick actions
            </h2>
          </header>
          <QuickAction href="/admin/posts/new" label="Draft new editorial" icon={PlusCircle} primary />
          <QuickAction href="/admin/posts" label={`Browse library (${total})`} icon={BookOpen} />
          <QuickAction href="/admin/automation" label="Pipeline history" icon={Radio} />
        </section>
      </div>

      {/* Compact recent runs — 5 items, all detail lives on /admin/automation */}
      {status.runs.length > 0 && (
        <section>
          <header className="mb-3 flex items-end justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-muted">
              Recent runs
            </h2>
            <Link
              href="/admin/automation"
              className="text-[12px] font-semibold text-primary hover:text-primary-hover"
            >
              View all →
            </Link>
          </header>
          <ul className="overflow-hidden rounded-xl border border-outline-variant bg-surface-lowest">
            {status.runs.slice(0, 5).map((r, i) => (
              <li
                key={r.id}
                className={`flex items-center gap-4 px-5 py-3 text-[13px] ${
                  i > 0 ? 'border-t border-outline-variant' : ''
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                    r.status === 'success'
                      ? 'bg-success'
                      : r.status === 'failed'
                        ? 'bg-error'
                        : 'bg-primary soft-pulse'
                  }`}
                />
                <span className="w-20 shrink-0 text-on-surface-muted">
                  {formatRelative(r.started_at)}
                </span>
                <span className="w-20 shrink-0 rounded-full bg-surface-container px-2 py-0.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                  {r.trigger}
                </span>
                <p className="min-w-0 flex-1 truncate text-on-bg">
                  {r.topic ?? r.error ?? 'n/a'}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function QuickAction({
  href,
  label,
  icon: Icon,
  primary,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between rounded-md px-4 py-3 text-[13px] font-semibold transition-colors ${
        primary
          ? 'cta-primary'
          : 'border border-outline-variant bg-surface-lowest text-on-surface-variant hover:border-outline hover:text-on-bg'
      }`}
    >
      <span className="inline-flex items-center gap-2.5">
        <Icon className={`h-4 w-4 ${primary ? '' : 'text-on-surface-muted'}`} aria-hidden />
        {label}
      </span>
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
    </Link>
  );
}
