import type { NewsArticle, NewsCategory } from '@/@types/news';
import { NEWS_CATEGORIES } from '@/components/modules/news/constants';

/**
 * Pure utilities for the `news` module.
 * Rule: pure functions, no side-effects, no `window` access.
 * If you need state or browser APIs, use a hook — not this file.
 */

export function getCategoryLabel(category: NewsCategory): string {
  return NEWS_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export function formatPublishedDate(
  isoDate: string,
  locale: string = 'en-US',
): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function estimateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function sortArticlesByDate(
  articles: NewsArticle[],
  direction: 'asc' | 'desc' = 'desc',
): NewsArticle[] {
  return [...articles].sort((a, b) => {
    const diff =
      new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
    return direction === 'asc' ? diff : -diff;
  });
}
