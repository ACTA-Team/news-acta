import type {
  NewsArticle,
  NewsListFilters,
  NewsListResponse,
} from '@/@types/news';
import type { Database, TypedSupabaseClient } from '@/lib/supabase';
import { NEWS_DEFAULT_PAGE_SIZE } from '@/components/modules/news/constants';

/**
 * Service layer for the `news` module.
 *
 * The only layer allowed to talk to Supabase for news data.
 * - Hooks pass a browser client (`@/lib/supabase/client`).
 * - Server Components pass a server client (`@/lib/supabase/server`).
 * - UI must NEVER query Supabase directly.
 */

type ArticleRow = Database['public']['Tables']['news_articles']['Row'];
type AuthorRow = Database['public']['Tables']['authors']['Row'];

/**
 * Row shape returned by the Supabase query below, with the author and
 * article tags joined in.
 */
type ArticleRowWithRelations = ArticleRow & {
  author: AuthorRow | null;
  tags: { tag_slug: string }[];
};

const ARTICLE_SELECT = `
  id,
  slug,
  title,
  summary,
  content,
  cover_image_url,
  category,
  status,
  reading_time_minutes,
  published_at,
  created_at,
  updated_at,
  author_id,
  author:authors ( id, slug, name, role, bio, avatar_url, social, created_at, updated_at ),
  tags:news_article_tags ( tag_slug )
` as const;

function mapArticle(row: ArticleRowWithRelations): NewsArticle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: row.content,
    coverImageUrl: row.cover_image_url ?? undefined,
    category: row.category,
    status: row.status,
    tags: row.tags?.map((t) => t.tag_slug) ?? [],
    author: {
      id: row.author?.id ?? row.author_id,
      name: row.author?.name ?? 'Unknown',
      avatarUrl: row.author?.avatar_url ?? undefined,
      role: row.author?.role ?? undefined,
    },
    publishedAt: row.published_at ?? row.created_at,
    updatedAt: row.updated_at,
    readingTimeMinutes: row.reading_time_minutes,
  };
}

export async function fetchNewsList(
  supabase: TypedSupabaseClient,
  filters: NewsListFilters = {},
): Promise<NewsListResponse> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? NEWS_DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('news_articles')
    .select(ARTICLE_SELECT, { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(from, to);

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  if (filters.search) {
    // Relies on the `search_tsv` generated column + GIN index.
    query = query.textSearch('search_tsv', filters.search, {
      type: 'websearch',
      config: 'simple',
    });
  }

  if (filters.tag) {
    // Filter by tag via the join table. Inner join forces the match.
    const tagQuery = supabase
      .from('news_articles')
      .select(
        `${ARTICLE_SELECT}, news_article_tags!inner(tag_slug)`,
        { count: 'exact' },
      )
      .eq('status', 'published')
      .eq('news_article_tags.tag_slug', filters.tag)
      .order('published_at', { ascending: false })
      .range(from, to);

    const { data, count, error } = await tagQuery;
    if (error) throw error;

    const rows = (data ?? []) as unknown as ArticleRowWithRelations[];
    return {
      items: rows.map(mapArticle),
      total: count ?? 0,
      page,
      pageSize,
    };
  }

  const { data, count, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as ArticleRowWithRelations[];

  return {
    items: rows.map(mapArticle),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function fetchNewsBySlug(
  supabase: TypedSupabaseClient,
  slug: string,
): Promise<NewsArticle | null> {
  const { data, error } = await supabase
    .from('news_articles')
    .select(ARTICLE_SELECT)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapArticle(data as unknown as ArticleRowWithRelations);
}
