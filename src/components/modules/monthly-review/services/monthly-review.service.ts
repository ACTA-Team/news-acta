import type {
  MonthlyReview,
  MonthlyReviewHighlight,
  MonthlyReviewListItem,
  MonthlyReviewMetric,
} from '@/@types/monthly-review';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/config';
import type { Database, TypedSupabaseClient } from '@/lib/supabase';
import {
  isMissingSchemaCacheError,
  warnMissingMigrationsOnce,
} from '@/lib/supabase/postgrestError';

/**
 * Service layer for the `monthly-review` module.
 * Same rule as every other module: the only layer allowed to talk to Supabase.
 *
 * A review's `period` is its route segment in every language, so only the prose
 * is translated. Resolution follows the same chain as articles: the translation
 * for the requested locale, then the source row.
 */

type ReviewRow = Database['public']['Tables']['monthly_reviews']['Row'];
type ArticleRow = Database['public']['Tables']['news_articles']['Row'];

interface EmbeddedReviewTranslation {
  locale: Locale;
  title: string;
  summary: string;
  highlights: unknown;
}

interface EmbeddedArticleTranslation {
  locale: Locale;
  slug: string;
  title: string;
  summary: string;
}

type FeaturedArticle = Pick<ArticleRow, 'id' | 'slug' | 'title' | 'summary' | 'source_locale'> & {
  translations: EmbeddedArticleTranslation[] | null;
};

type ReviewFeaturedRow = {
  position: number;
  article: FeaturedArticle | null;
};

type ReviewRowWithArticles = ReviewRow & {
  featured: ReviewFeaturedRow[];
  translations: EmbeddedReviewTranslation[] | null;
};

const REVIEW_LIST_SELECT = `
  id, period, title, summary, source_locale, published_at,
  translations:monthly_review_translations ( locale, title, summary, highlights )
` as const;

const REVIEW_DETAIL_SELECT = `
  id,
  period,
  title,
  summary,
  cover_image_url,
  highlights,
  metrics,
  source_locale,
  published_at,
  created_at,
  updated_at,
  translations:monthly_review_translations ( locale, title, summary, highlights ),
  featured:monthly_review_articles (
    position,
    article:news_articles (
      id, slug, title, summary, source_locale,
      translations:article_translations ( locale, slug, title, summary )
    )
  )
` as const;

function toLocaleOrDefault(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

function uniqueLocales(locales: Locale[]): Locale[] {
  return [...new Set(locales)];
}

/**
 * Picks the translation for `requested`, or nothing when the requested locale is
 * already the source. Shared by the list and detail mappers.
 */
function pickTranslation<T extends { locale: Locale }>(
  translations: T[] | null | undefined,
  sourceLocale: Locale,
  requested: Locale
): T | undefined {
  if (requested === sourceLocale) return undefined;
  return (translations ?? []).find((entry) => entry.locale === requested);
}

function localeMetadata<T extends { locale: Locale }>(
  translations: T[] | null | undefined,
  sourceLocale: Locale,
  match: T | undefined,
  requested: Locale
) {
  return {
    locale: match ? requested : sourceLocale,
    sourceLocale,
    isTranslated: Boolean(match),
    availableLocales: uniqueLocales([
      sourceLocale,
      ...(translations ?? [])
        .map((entry) => entry.locale)
        .filter((locale): locale is Locale => isLocale(locale)),
    ]),
  };
}

function asHighlights(value: unknown): MonthlyReviewHighlight[] | null {
  if (!Array.isArray(value)) return null;
  return value as MonthlyReviewHighlight[];
}

function mapListItem(
  row: Pick<ReviewRow, 'id' | 'period' | 'title' | 'summary' | 'source_locale' | 'published_at'> & {
    translations: EmbeddedReviewTranslation[] | null;
  },
  requested: Locale
): MonthlyReviewListItem {
  const sourceLocale = toLocaleOrDefault(row.source_locale);
  const match = pickTranslation(row.translations, sourceLocale, requested);

  return {
    id: row.id,
    period: row.period,
    title: match?.title ?? row.title,
    summary: match?.summary ?? row.summary,
    publishedAt: row.published_at,
    ...localeMetadata(row.translations, sourceLocale, match, requested),
  };
}

function mapFeaturedArticle(article: FeaturedArticle, requested: Locale) {
  const sourceLocale = toLocaleOrDefault(article.source_locale);
  const match = pickTranslation(article.translations, sourceLocale, requested);

  return {
    id: article.id,
    slug: match?.slug ?? article.slug,
    title: match?.title ?? article.title,
    summary: match?.summary ?? article.summary,
  };
}

function mapDetail(row: ReviewRowWithArticles, requested: Locale): MonthlyReview {
  const sourceLocale = toLocaleOrDefault(row.source_locale);
  const match = pickTranslation(row.translations, sourceLocale, requested);

  const featured = (row.featured ?? [])
    .slice()
    .sort((left: ReviewFeaturedRow, right: ReviewFeaturedRow) => left.position - right.position)
    .map((feature: ReviewFeaturedRow) => feature.article)
    .filter((article): article is FeaturedArticle => article !== null)
    .map((article) => mapFeaturedArticle(article, requested));

  // A translation may leave `highlights` empty, which means "not translated
  // yet" rather than "this review has no highlights". Falling back to the source
  // list keeps the section populated instead of blanking it.
  const translatedHighlights = asHighlights(match?.highlights);
  const highlights =
    translatedHighlights && translatedHighlights.length > 0
      ? translatedHighlights
      : (asHighlights(row.highlights) ?? []);

  return {
    id: row.id,
    period: row.period,
    title: match?.title ?? row.title,
    summary: match?.summary ?? row.summary,
    coverImageUrl: row.cover_image_url ?? undefined,
    highlights,
    metrics: (row.metrics as unknown as MonthlyReviewMetric[]) ?? [],
    featuredArticles: featured,
    publishedAt: row.published_at,
    ...localeMetadata(row.translations, sourceLocale, match, requested),
  };
}

export async function fetchMonthlyReviews(
  supabase: TypedSupabaseClient,
  locale: Locale = DEFAULT_LOCALE
): Promise<MonthlyReviewListItem[]> {
  const { data, error } = await supabase
    .from('monthly_reviews')
    .select(REVIEW_LIST_SELECT)
    .order('published_at', { ascending: false });

  if (error) {
    if (isMissingSchemaCacheError(error)) {
      warnMissingMigrationsOnce();
      return [];
    }
    throw error;
  }

  type Row = Parameters<typeof mapListItem>[0];
  return ((data ?? []) as unknown as Row[]).map((row) => mapListItem(row, locale));
}

export async function fetchMonthlyReviewByPeriod(
  supabase: TypedSupabaseClient,
  period: string,
  locale: Locale = DEFAULT_LOCALE
): Promise<MonthlyReview | null> {
  const { data, error } = await supabase
    .from('monthly_reviews')
    .select(REVIEW_DETAIL_SELECT)
    .eq('period', period)
    .maybeSingle();

  if (error) {
    if (isMissingSchemaCacheError(error)) {
      warnMissingMigrationsOnce();
      return null;
    }
    throw error;
  }
  if (!data) return null;

  return mapDetail(data as unknown as ReviewRowWithArticles, locale);
}
