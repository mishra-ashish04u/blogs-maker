import type { Category } from '../site';

export type PostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: Category;
  author: string;
  date: string;
  read_time: number;
  cover_image: string;
  content: string;
  status: 'draft' | 'published' | 'retired';
  source_url: string | null;
  created_at: string;
  updated_at: string;
};

export type AutomationRunRow = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: 'running' | 'success' | 'failed';
  trigger: 'cron' | 'manual';
  post_id: string | null;
  source_url: string | null;
  topic: string | null;
  error: string | null;
  logs: Record<string, unknown> | null;
};

export type SubscriberRow = {
  id: string;
  email: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  unsubscribe_token: string;
  source: string | null;
  last_sent_at: string | null;
  bounce_count: number;
  created_at: string;
  updated_at: string;
};

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
