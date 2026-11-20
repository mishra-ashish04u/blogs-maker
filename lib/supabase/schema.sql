-- Daily Scam Alert — Supabase schema
-- Apply via: psql $SUPABASE_DB_URL -f lib/supabase/schema.sql
-- Or paste into Supabase Studio → SQL Editor.

create extension if not exists "pgcrypto";

-- Posts ---------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text not null,
  -- Keep in sync with CATEGORIES in lib/site.ts.
  category text not null check (category in (
    'Scam Alerts', 'Protection Guides', 'Account Recovery', 'Security Tools'
  )),
  author text not null default 'Daily Scam Alert Team',
  date text not null,
  read_time int not null default 8,
  cover_image text not null,
  content text not null,
  status text not null default 'published'
    check (status in ('draft', 'published', 'retired')),
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_status_created_idx
  on public.posts (status, created_at desc);

create index if not exists posts_category_idx
  on public.posts (category);

-- Automation runs -----------------------------------------------------------
create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
    check (status in ('running', 'success', 'failed')),
  trigger text not null default 'cron'
    check (trigger in ('cron', 'manual')),
  post_id uuid references public.posts(id) on delete set null,
  source_url text,
  topic text,
  error text,
  logs jsonb
);

create index if not exists automation_runs_started_idx
  on public.automation_runs (started_at desc);

-- Row level security --------------------------------------------------------
alter table public.posts enable row level security;
alter table public.automation_runs enable row level security;

-- Public can read published posts
drop policy if exists "posts_read_published" on public.posts;
create policy "posts_read_published"
  on public.posts for select
  using (status = 'published');

-- Service role bypasses RLS entirely — no explicit write policies needed.

-- Storage bucket for cover images ------------------------------------------
insert into storage.buckets (id, name, public)
  values ('covers', 'covers', true)
  on conflict (id) do nothing;

-- Allow public read on covers bucket
drop policy if exists "covers_public_read" on storage.objects;
create policy "covers_public_read"
  on storage.objects for select
  using (bucket_id = 'covers');

-- Newsletter subscribers ----------------------------------------------------
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  -- 'active' subscribers receive the daily brief.
  -- 'unsubscribed' have opted out but we keep the row (compliance audit).
  status text not null default 'active'
    check (status in ('active', 'unsubscribed', 'bounced')),
  -- Opaque token embedded in unsubscribe links; rotated per subscription.
  unsubscribe_token text unique not null,
  -- Optional source signal so we can see where subs came from.
  source text,
  last_sent_at timestamptz,
  bounce_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Case-insensitive lookup on email.
create unique index if not exists subscribers_email_lower_idx
  on public.subscribers (lower(email));

create index if not exists subscribers_status_idx
  on public.subscribers (status);

alter table public.subscribers enable row level security;

-- No public read policy — subscribers are private.
-- Service role bypasses RLS for both writes (from /api/newsletter/*) and
-- reads (from the daily dispatch script).
