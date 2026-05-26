import type { Database } from '@/lib/supabase';
import type { TypedSupabaseClient } from '@/lib/supabase/client';

type ReviewRow = Database['public']['Tables']['monthly_reviews']['Row'];
type ArticleRow = Database['public']['Tables']['news_articles']['Row'];
type SnapshotRow = Database['public']['Tables']['ecosystem_snapshots']['Row'];

type AdminReviewRow = ReviewRow & {
  featured: {
    position: number;
    article_id: string;
  }[];
};

const ADMIN_REVIEW_SELECT = `
  id,
  period,
  title,
  summary,
  cover_image_url,
  highlights,
  metrics,
  published_at,
  created_at,
  updated_at,
  featured:monthly_review_articles (
    position,
    article_id
  )
` as const;

export interface AdminReviewListItem {
  id: string;
  period: string;
  title: string;
  summary: string;
  publishedAt: string;
}

export interface AdminReviewEditorData {
  id: string;
  period: string;
  title: string;
  summary: string;
  coverImageUrl: string;
  highlights: { title: string; description: string; href?: string }[];
  metrics: any; // Handles dual schema
  publishedAt: string;
  featuredArticleIds: string[];
}

export interface AdminReviewFormOptions {
  articles: Pick<ArticleRow, 'id' | 'title' | 'slug'>[];
}

/**
 * Fetches all Monthly Reviews for the admin list view.
 */
export async function fetchAdminReviewList(
  supabase: TypedSupabaseClient
): Promise<AdminReviewListItem[]> {
  const { data, error } = await supabase
    .from('monthly_reviews')
    .select('id, period, title, summary, published_at')
    .order('period', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    period: row.period,
    title: row.title,
    summary: row.summary,
    publishedAt: row.published_at,
  }));
}

/**
 * Fetches a single Monthly Review by ID for editing.
 */
export async function fetchAdminReviewById(
  supabase: TypedSupabaseClient,
  id: string
): Promise<AdminReviewEditorData | null> {
  const { data, error } = await supabase
    .from('monthly_reviews')
    .select(ADMIN_REVIEW_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as AdminReviewRow;
  const featuredArticleIds = (row.featured ?? [])
    .sort((a, b) => a.position - b.position)
    .map((f) => f.article_id);

  return {
    id: row.id,
    period: row.period,
    title: row.title,
    summary: row.summary,
    coverImageUrl: row.cover_image_url ?? '',
    highlights: (row.highlights as any) ?? [],
    metrics: row.metrics ?? [],
    publishedAt: row.published_at ? row.published_at.slice(0, 16) : '',
    featuredArticleIds,
  };
}

/**
 * Fetches a list of published articles available to feature in a monthly review.
 */
export async function fetchAdminReviewFormOptions(
  supabase: TypedSupabaseClient
): Promise<AdminReviewFormOptions> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('id, title, slug')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) throw error;
  return {
    articles: data ?? [],
  };
}

/**
 * Fetches the ecosystem snapshot for a specific period and network.
 */
export async function fetchEcosystemSnapshot(
  supabase: TypedSupabaseClient,
  period: string,
  network: string
): Promise<SnapshotRow | null> {
  const { data, error } = await supabase
    .from('ecosystem_snapshots')
    .select('*')
    .eq('period', period)
    .eq('network', network)
    .maybeSingle();

  if (error) throw error;
  return data;
}
