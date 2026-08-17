import type { NewsArticle, NewsCategory } from '@/@types/news';
import { NEWS_CATEGORIES } from '@/components/modules/news/constants';
import { DEFAULT_LOCALE, type Locale } from '@/i18n/config';
import { formatDate } from '@/i18n/format';
import type { Translator } from '@/i18n/translate';

/**
 * Pure utilities for the `news` module.
 * Rule: pure functions, no side-effects, no `window` access.
 * If you need state or browser APIs, use a hook, not this file.
 *
 * Anything user-facing takes an explicit `t` or `locale`. Nothing here reaches
 * for an ambient default, which is what let 'en-US' leak into every date on the
 * site before this module became bilingual.
 */

/** The translated label for a category, falling back to the raw enum value. */
export function getCategoryLabel(category: NewsCategory, t: Translator): string {
  const entry = NEWS_CATEGORIES.find((candidate) => candidate.value === category);
  return entry ? t(entry.labelKey) : category;
}

export function formatPublishedDate(isoDate: string, locale: Locale = DEFAULT_LOCALE): string {
  return formatDate(isoDate, locale);
}

export function estimateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function sortArticlesByDate(
  articles: NewsArticle[],
  direction: 'asc' | 'desc' = 'desc'
): NewsArticle[] {
  return [...articles].sort((a, b) => {
    const diff = new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
    return direction === 'asc' ? diff : -diff;
  });
}

/**
 * Per-locale paths for one article, for the language switcher and hreflang.
 *
 * A locale the article has no translation for falls back to the news index in
 * that locale, so switching language from an untranslated article lands
 * somewhere useful instead of on a 404.
 */
export function articleAlternatePaths(
  article: Pick<NewsArticle, 'slugByLocale'>,
  locales: readonly Locale[]
): Record<Locale, string> {
  return locales.reduce(
    (acc, locale) => {
      const slug = article.slugByLocale[locale];
      acc[locale] = slug ? `/news/${slug}` : '/news';
      return acc;
    },
    {} as Record<Locale, string>
  );
}

/**
 * Per-locale paths restricted to the locales the article actually exists in.
 *
 * Unlike {@link articleAlternatePaths} this omits missing locales entirely,
 * which is what hreflang wants: an alternate pointing at a listing page is a
 * worse signal than no alternate at all.
 */
export function articleHreflangPaths(
  article: Pick<NewsArticle, 'slugByLocale'>
): Partial<Record<Locale, string>> {
  const paths: Partial<Record<Locale, string>> = {};
  for (const [locale, slug] of Object.entries(article.slugByLocale)) {
    if (slug) paths[locale as Locale] = `/news/${slug}`;
  }
  return paths;
}
