import type { Database } from '@/lib/supabase';
import type { TypedSupabaseClient } from '@/lib/supabase/client';

type ArticleRow = Database['public']['Tables']['news_articles']['Row'];
type AuthorRow = Database['public']['Tables']['authors']['Row'];
type TagRow = Database['public']['Tables']['tags']['Row'];

type AdminArticleRow = ArticleRow & {
  author: Pick<AuthorRow, 'id' | 'name' | 'slug'> | null;
  tags: { tag_slug: string }[];
};

const ADMIN_ARTICLE_SELECT = `
  id,
  slug,
  title,
  summary,
  content,
  cover_image_url,
  category,
  status,
  author_id,
  reading_time_minutes,
  published_at,
  created_at,
  updated_at,
  author:authors ( id, name, slug ),
  tags:news_article_tags ( tag_slug )
` as const;

export interface AdminNewsListItem {
  id: string;
  slug: string;
  title: string;
  status: Database['public']['Enums']['news_status'];
  category: Database['public']['Enums']['news_category'];
  authorName: string;
  publishedAt: string | null;
  updatedAt: string;
}

export interface AdminNewsEditorData {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  coverImageUrl: string;
  category: Database['public']['Enums']['news_category'];
  status: Database['public']['Enums']['news_status'];
  authorId: string;
  readingTimeMinutes: number;
  publishedAt: string;
  tags: string[];
}

export interface AdminNewsFormOptions {
  authors: Pick<AuthorRow, 'id' | 'name' | 'slug'>[];
  tags: Pick<TagRow, 'slug' | 'label'>[];
}

export async function fetchAdminNewsList(
  supabase: TypedSupabaseClient,
  status?: Database['public']['Enums']['news_status'] | 'all'
): Promise<AdminNewsListItem[]> {
  let query = supabase.from('news_articles').select(ADMIN_ARTICLE_SELECT).order('updated_at', {
    ascending: false,
  });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as AdminArticleRow[];
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    category: row.category,
    authorName: row.author?.name ?? 'Unknown',
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  }));
}

export async function fetchAdminNewsById(
  supabase: TypedSupabaseClient,
  id: string
): Promise<AdminNewsEditorData | null> {
  const { data, error } = await supabase
    .from('news_articles')
    .select(ADMIN_ARTICLE_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as AdminArticleRow;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: row.content,
    coverImageUrl: row.cover_image_url ?? '',
    category: row.category,
    status: row.status,
    authorId: row.author_id,
    readingTimeMinutes: row.reading_time_minutes,
    publishedAt: row.published_at ? row.published_at.slice(0, 16) : '',
    tags: row.tags.map((t) => t.tag_slug),
  };
}

export async function fetchAdminNewsFormOptions(
  supabase: TypedSupabaseClient
): Promise<AdminNewsFormOptions> {
  const [{ data: authorsData, error: authorsError }, { data: tagsData, error: tagsError }] =
    await Promise.all([
      supabase.from('authors').select('id, name, slug').order('name', { ascending: true }),
      supabase.from('tags').select('slug, label').order('label', { ascending: true }),
    ]);

  if (authorsError) throw authorsError;
  if (tagsError) throw tagsError;

  return {
    authors: authorsData ?? [],
    tags: tagsData ?? [],
  };
}
