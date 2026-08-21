import type { NewsArticle, NewsListFilters, NewsListResponse } from '@/@types/news';
import { NEWS_DEFAULT_PAGE_SIZE } from '@/components/modules/news/constants';
import { DEFAULT_LOCALE, LOCALE_TSV_CONFIG, isLocale, type Locale } from '@/i18n/config';
import type { Database, TypedSupabaseClient } from '@/lib/supabase';
import {
  isMissingSchemaCacheError,
  warnMissingMigrationsOnce,
} from '@/lib/supabase/postgrestError';

/**
 * Service layer for the `news` module.
 *
 * The only layer allowed to talk to Supabase for news data.
 * - Hooks pass a browser client (`@/lib/supabase/client`).
 * - Server Components pass a server client (`@/lib/supabase/server`).
 * - UI must NEVER query Supabase directly.
 *
 * Every read takes a `locale` and resolves content through the same chain:
 * the translation for that locale, then the source article. Nothing here ever
 * hides an article because it has not been translated yet; an untranslated post
 * still appears, in its source language, flagged so the UI can label it.
 */

type ArticleRow = Database['public']['Tables']['news_articles']['Row'];
type AuthorRow = Database['public']['Tables']['authors']['Row'];
type ArticleTagRow = Database['public']['Tables']['news_article_tags']['Row'];

/** The translation columns the resolver needs, as embedded by the selects below. */
interface EmbeddedTranslation {
  locale: Locale;
  slug: string;
  title: string;
  summary: string;
  content: string;
  source_content_hash: string;
}

/**
 * Row shape returned by the Supabase query below, with the author, article tags
 * and translations joined in.
 */
type EmbeddedAuthorCredential = {
  vc_id: string;
  status: 'pending' | 'active' | 'revoked' | 'failed';
};

type ArticleRowWithRelations = ArticleRow & {
  author:
    | (AuthorRow & {
        identity: { did: string } | null;
        credentials: EmbeddedAuthorCredential[] | null;
      })
    | null;
  tags: ArticleTagRow[];
  translations: EmbeddedTranslation[] | null;
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
  source_locale,
  translation_source_hash,
  reading_time_minutes,
  published_at,
  created_at,
  updated_at,
  author_id,
  author:authors (
    id, slug, name, role, bio, avatar_url, social, created_at, updated_at,
    identity:author_identities ( did ),
    credentials:author_credentials ( vc_id, status )
  ),
  tags:news_article_tags ( tag_slug ),
  translations:article_translations ( locale, slug, title, summary, content, source_content_hash )
` as const;

/**
 * Upper bound on the ids a ranked search feeds back into the row query.
 *
 * `search_articles` returns every match ordered by rank; pagination then happens
 * in application code so the rank order survives it. A blog never comes close to
 * this, and the cap keeps a pathological query (`a OR b OR c ...`) from building
 * a multi-thousand-element `in` filter.
 */
const SEARCH_ID_LIMIT = 500;

function uniqueLocales(locales: Locale[]): Locale[] {
  return [...new Set(locales)];
}

function toLocaleOrDefault(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * Collapses a row plus its translations into the single article the requested
 * locale should render.
 *
 * Resolution order: the translation for `requested`, then the source. The
 * source always wins when `requested` is already the source locale, so a stray
 * same-locale translation row can never shadow the original.
 */
function resolveArticle(row: ArticleRowWithRelations, requested: Locale): NewsArticle {
  const sourceLocale = toLocaleOrDefault(row.source_locale);
  const translations = (row.translations ?? []).filter((entry) => isLocale(entry.locale));

  const slugByLocale: Partial<Record<Locale, string>> = { [sourceLocale]: row.slug };
  for (const translation of translations) {
    slugByLocale[translation.locale] = translation.slug;
  }

  const availableLocales = uniqueLocales([
    sourceLocale,
    ...translations.map((translation) => translation.locale),
  ]);

  const match =
    requested === sourceLocale
      ? undefined
      : translations.find((translation) => translation.locale === requested);

  return {
    id: row.id,
    slug: match?.slug ?? row.slug,
    title: match?.title ?? row.title,
    summary: match?.summary ?? row.summary,
    content: match?.content ?? row.content,
    coverImageUrl: row.cover_image_url ?? undefined,
    category: row.category,
    status: row.status,
    tags: row.tags?.map((tag: ArticleTagRow) => tag.tag_slug) ?? [],
    author: {
      id: row.author?.id ?? row.author_id,
      slug: row.author?.slug ?? row.author_id,
      name: row.author?.name ?? 'Unknown',
      avatarUrl: row.author?.avatar_url ?? undefined,
      role: row.author?.role ?? undefined,
      did: row.author?.identity?.did,
      credential: row.author?.credentials?.[0]
        ? { vcId: row.author.credentials[0].vc_id, status: row.author.credentials[0].status }
        : undefined,
    },
    publishedAt: row.published_at ?? row.created_at,
    updatedAt: row.updated_at,
    readingTimeMinutes: row.reading_time_minutes,
    locale: match ? requested : sourceLocale,
    sourceLocale,
    isTranslated: Boolean(match),
    availableLocales,
    slugByLocale,
  };
}

function emptyResponse(page: number, pageSize: number): NewsListResponse {
  return { items: [], total: 0, page, pageSize };
}

/**
 * Ranked article ids for a search term, via `public.search_articles`.
 *
 * Returns null when the function is not reachable (a database that has not run
 * `0007_i18n.sql` yet), which tells the caller to fall back to a plain
 * `textSearch` instead of showing an empty result set.
 */
async function rankedSearchIds(
  supabase: TypedSupabaseClient,
  query: string,
  locale: Locale
): Promise<string[] | null> {
  const { data, error } = await supabase.rpc('search_articles', {
    p_query: query,
    p_locale: locale,
  });

  if (error) {
    if (isMissingSchemaCacheError(error) || error.code === 'PGRST202') {
      warnMissingMigrationsOnce();
      return null;
    }
    throw error;
  }

  return (data ?? []).slice(0, SEARCH_ID_LIMIT).map((entry) => entry.article_id);
}

/**
 * Search branch of {@link fetchNewsList}.
 *
 * Ranking comes from Postgres, so pagination has to happen after the rows come
 * back: slicing the id list before the row query would be cheaper but would let
 * the category and tag filters silently drop items from a page.
 */
async function searchNewsList(
  supabase: TypedSupabaseClient,
  filters: NewsListFilters & { search: string },
  locale: Locale,
  page: number,
  pageSize: number
): Promise<NewsListResponse> {
  const rankedIds = await rankedSearchIds(supabase, filters.search, locale);

  if (rankedIds === null) {
    return fallbackTextSearch(supabase, filters, locale, page, pageSize);
  }

  if (rankedIds.length === 0) return emptyResponse(page, pageSize);

  // The tag filter needs a different select (an inner join on the join table),
  // which produces a differently shaped builder. Building each branch as one
  // expression keeps both fully typed instead of widening to `any`.
  const { data, error } = filters.tag
    ? await (() => {
        const tagged = supabase
          .from('news_articles')
          .select(`${ARTICLE_SELECT}, news_article_tags!inner(tag_slug)`)
          .eq('status', 'published')
          .eq('news_article_tags.tag_slug', filters.tag)
          .in('id', rankedIds);
        return filters.category ? tagged.eq('category', filters.category) : tagged;
      })()
    : await (() => {
        const plain = supabase
          .from('news_articles')
          .select(ARTICLE_SELECT)
          .eq('status', 'published')
          .in('id', rankedIds);
        return filters.category ? plain.eq('category', filters.category) : plain;
      })();

  if (error) {
    if (isMissingSchemaCacheError(error)) {
      warnMissingMigrationsOnce();
      return emptyResponse(page, pageSize);
    }
    throw error;
  }

  const rows = (data ?? []) as unknown as ArticleRowWithRelations[];
  const rank = new Map(rankedIds.map((id, index) => [id, index]));
  const ordered = rows
    .slice()
    .sort((left, right) => (rank.get(left.id) ?? 0) - (rank.get(right.id) ?? 0));

  const from = (page - 1) * pageSize;
  return {
    items: ordered.slice(from, from + pageSize).map((row) => resolveArticle(row, locale)),
    total: ordered.length,
    page,
    pageSize,
  };
}

/**
 * Search path for a database without `0007_i18n.sql`.
 *
 * Uses the locale's text search configuration directly against the source
 * table. Translations are invisible to it, which is exactly the pre-migration
 * behaviour and better than an empty page.
 */
async function fallbackTextSearch(
  supabase: TypedSupabaseClient,
  filters: NewsListFilters & { search: string },
  locale: Locale,
  page: number,
  pageSize: number
): Promise<NewsListResponse> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('news_articles')
    .select(ARTICLE_SELECT, { count: 'exact' })
    .eq('status', 'published')
    .textSearch('search_tsv', filters.search, {
      type: 'websearch',
      config: LOCALE_TSV_CONFIG[locale],
    })
    .order('published_at', { ascending: false })
    .range(from, to);

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  const { data, count, error } = await query;
  if (error) {
    if (isMissingSchemaCacheError(error)) {
      warnMissingMigrationsOnce();
      return emptyResponse(page, pageSize);
    }
    throw error;
  }

  const rows = (data ?? []) as unknown as ArticleRowWithRelations[];
  return {
    items: rows.map((row) => resolveArticle(row, locale)),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function fetchNewsList(
  supabase: TypedSupabaseClient,
  filters: NewsListFilters = {},
  locale: Locale = DEFAULT_LOCALE
): Promise<NewsListResponse> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? NEWS_DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (filters.search) {
    return searchNewsList(supabase, { ...filters, search: filters.search }, locale, page, pageSize);
  }

  if (filters.tag) {
    // Filter by tag via the join table. Inner join forces the match.
    const tagQuery = supabase
      .from('news_articles')
      .select(`${ARTICLE_SELECT}, news_article_tags!inner(tag_slug)`, { count: 'exact' })
      .eq('status', 'published')
      .eq('news_article_tags.tag_slug', filters.tag)
      .order('published_at', { ascending: false })
      .range(from, to);

    const { data, count, error } = await tagQuery;
    if (error) {
      if (isMissingSchemaCacheError(error)) {
        warnMissingMigrationsOnce();
        return emptyResponse(page, pageSize);
      }
      throw error;
    }

    const rows = (data ?? []) as unknown as ArticleRowWithRelations[];
    return {
      items: rows.map((row) => resolveArticle(row, locale)),
      total: count ?? 0,
      page,
      pageSize,
    };
  }

  let query = supabase
    .from('news_articles')
    .select(ARTICLE_SELECT, { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(from, to);

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  const { data, count, error } = await query;
  if (error) {
    if (isMissingSchemaCacheError(error)) {
      warnMissingMigrationsOnce();
      return emptyResponse(page, pageSize);
    }
    throw error;
  }

  const rows = (data ?? []) as unknown as ArticleRowWithRelations[];

  return {
    items: rows.map((row) => resolveArticle(row, locale)),
    total: count ?? 0,
    page,
    pageSize,
  };
}

/**
 * One published article, by the slug it answers to in `locale`.
 *
 * Both lookups run concurrently because the slug can belong to either table and
 * a detail page should not pay for two sequential round trips to find out. The
 * translation wins when both match, which is what makes `/es/news/<es-slug>`
 * resolve to the Spanish text.
 */
export async function fetchNewsBySlug(
  supabase: TypedSupabaseClient,
  slug: string,
  locale: Locale = DEFAULT_LOCALE
): Promise<NewsArticle | null> {
  const [translationResult, sourceResult] = await Promise.all([
    supabase
      .from('article_translations')
      .select('article_id')
      .eq('locale', locale)
      .eq('slug', slug)
      .maybeSingle(),
    supabase
      .from('news_articles')
      .select(ARTICLE_SELECT)
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle(),
  ]);

  if (sourceResult.error) {
    if (isMissingSchemaCacheError(sourceResult.error)) {
      warnMissingMigrationsOnce();
      return null;
    }
    throw sourceResult.error;
  }

  // A missing article_translations table is not fatal: the source lookup still
  // answers, which keeps the site up on a database without 0007_i18n.sql.
  if (translationResult.error && !isMissingSchemaCacheError(translationResult.error)) {
    throw translationResult.error;
  }

  const translatedArticleId = translationResult.data?.article_id ?? null;

  if (translatedArticleId) {
    const { data, error } = await supabase
      .from('news_articles')
      .select(ARTICLE_SELECT)
      .eq('id', translatedArticleId)
      .eq('status', 'published')
      .maybeSingle();

    if (error) {
      if (!isMissingSchemaCacheError(error)) throw error;
      warnMissingMigrationsOnce();
    }

    if (data) return resolveArticle(data as unknown as ArticleRowWithRelations, locale);
  }

  if (!sourceResult.data) return null;

  return resolveArticle(sourceResult.data as unknown as ArticleRowWithRelations, locale);
}

/**
 * Slug and last-modified date per locale for every published article.
 *
 * Used by the sitemap and the RSS feeds, which need the whole set at once and
 * none of the article body.
 */
export interface NewsSitemapEntry {
  id: string;
  updatedAt: string;
  slugByLocale: Partial<Record<Locale, string>>;
}

export async function fetchNewsSitemapEntries(
  supabase: TypedSupabaseClient,
  limit = 1000
): Promise<NewsSitemapEntry[]> {
  const { data, error } = await supabase
    .from('news_articles')
    .select(
      `id, slug, source_locale, published_at, created_at, updated_at,
       translations:article_translations ( locale, slug )`
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingSchemaCacheError(error)) {
      warnMissingMigrationsOnce();
      return [];
    }
    throw error;
  }

  type Row = Pick<
    ArticleRow,
    'id' | 'slug' | 'source_locale' | 'published_at' | 'created_at' | 'updated_at'
  > & { translations: Pick<EmbeddedTranslation, 'locale' | 'slug'>[] | null };

  return ((data ?? []) as unknown as Row[]).map((row) => {
    const sourceLocale = toLocaleOrDefault(row.source_locale);
    const slugByLocale: Partial<Record<Locale, string>> = { [sourceLocale]: row.slug };
    for (const translation of row.translations ?? []) {
      if (isLocale(translation.locale)) slugByLocale[translation.locale] = translation.slug;
    }

    return {
      id: row.id,
      updatedAt: row.updated_at ?? row.published_at ?? row.created_at,
      slugByLocale,
    };
  });
}
