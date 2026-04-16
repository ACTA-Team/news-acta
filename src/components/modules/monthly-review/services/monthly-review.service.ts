import type {
  MonthlyReview,
  MonthlyReviewHighlight,
  MonthlyReviewListItem,
  MonthlyReviewMetric,
} from '@/@types/monthly-review';
import type { Database, TypedSupabaseClient } from '@/lib/supabase';

/**
 * Service layer for the `monthly-review` module.
 * Same rule as every other module: the only layer allowed to talk to Supabase.
 */

type ReviewRow = Database['public']['Tables']['monthly_reviews']['Row'];
type ArticleRow = Database['public']['Tables']['news_articles']['Row'];

type ReviewRowWithArticles = ReviewRow & {
  featured: {
    position: number;
    article: Pick<ArticleRow, 'id' | 'slug' | 'title' | 'summary'> | null;
  }[];
};

const REVIEW_LIST_SELECT = `
  id, period, title, summary, published_at
` as const;

const REVIEW_DETAIL_SELECT = `
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
    article:news_articles ( id, slug, title, summary )
  )
` as const;

function mapListItem(
  row: Pick<ReviewRow, 'id' | 'period' | 'title' | 'summary' | 'published_at'>
): MonthlyReviewListItem {
  return {
    id: row.id,
    period: row.period,
    title: row.title,
    summary: row.summary,
    publishedAt: row.published_at,
  };
}

function mapDetail(row: ReviewRowWithArticles): MonthlyReview {
  const featured = (row.featured ?? [])
    .sort((a, b) => a.position - b.position)
    .map((f) => f.article)
    .filter((a): a is NonNullable<typeof a> => a !== null)
    .map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      summary: a.summary,
    }));

  return {
    id: row.id,
    period: row.period,
    title: row.title,
    summary: row.summary,
    coverImageUrl: row.cover_image_url ?? undefined,
    highlights: (row.highlights as unknown as MonthlyReviewHighlight[]) ?? [],
    metrics: (row.metrics as unknown as MonthlyReviewMetric[]) ?? [],
    featuredArticles: featured,
    publishedAt: row.published_at,
  };
}

export async function fetchMonthlyReviews(
  supabase: TypedSupabaseClient
): Promise<MonthlyReviewListItem[]> {
  const { data, error } = await supabase
    .from('monthly_reviews')
    .select(REVIEW_LIST_SELECT)
    .order('published_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapListItem);
}

export async function fetchMonthlyReviewByPeriod(
  supabase: TypedSupabaseClient,
  period: string
): Promise<MonthlyReview | null> {
  const { data, error } = await supabase
    .from('monthly_reviews')
    .select(REVIEW_DETAIL_SELECT)
    .eq('period', period)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapDetail(data as unknown as ReviewRowWithArticles);
}
