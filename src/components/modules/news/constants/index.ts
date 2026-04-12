import type { NewsCategory } from '@/@types/news';

/**
 * Static constants for the `news` module.
 * Rule: no magic strings in the UI — everything is imported from here.
 */

export const NEWS_CATEGORIES: ReadonlyArray<{
  value: NewsCategory;
  label: string;
}> = [
  { value: 'announcement', label: 'Announcements' },
  { value: 'product', label: 'Product' },
  { value: 'ecosystem', label: 'Ecosystem' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'community', label: 'Community' },
] as const;

export const NEWS_DEFAULT_PAGE_SIZE = 12;

export const NEWS_QUERY_KEYS = {
  list: 'news:list',
  detail: (slug: string) => `news:detail:${slug}`,
} as const;

export const NEWS_ROUTES = {
  index: '/news',
  detail: (slug: string) => `/news/${slug}`,
} as const;
