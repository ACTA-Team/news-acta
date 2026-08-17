import type { NewsCategory } from '@/@types/news';
import type { DictionaryKey } from '@/i18n/translate';

/**
 * Static constants for the `news` module.
 * Rule: no magic strings in the UI, everything is imported from here.
 *
 * Category labels are dictionary keys rather than literals, and routes are
 * unprefixed paths: the locale segment is added by the component that renders
 * the link, through `withLocale`.
 */

export const NEWS_CATEGORIES: ReadonlyArray<{
  value: NewsCategory;
  labelKey: DictionaryKey;
}> = [
  { value: 'announcement', labelKey: 'news.categories.announcement' },
  { value: 'product', labelKey: 'news.categories.product' },
  { value: 'ecosystem', labelKey: 'news.categories.ecosystem' },
  { value: 'engineering', labelKey: 'news.categories.engineering' },
  { value: 'community', labelKey: 'news.categories.community' },
] as const;

export const NEWS_DEFAULT_PAGE_SIZE = 12;

export const NEWS_QUERY_KEYS = {
  list: 'news:list',
  detail: (slug: string) => `news:detail:${slug}`,
} as const;

/** Unprefixed paths. Wrap with `withLocale(locale, ...)` before rendering. */
export const NEWS_ROUTES = {
  index: '/news',
  detail: (slug: string) => `/news/${slug}`,
  history: (slug: string) => `/news/${slug}/history`,
} as const;
