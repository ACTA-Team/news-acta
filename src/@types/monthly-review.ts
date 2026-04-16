import type { NewsArticle } from '@/@types/news';

/**
 * Monthly review of the ACTA ecosystem.
 * `period` is the canonical identifier (YYYY-MM) and is used as the route slug.
 */

export interface MonthlyReviewMetric {
  label: string;
  value: string;
  delta?: string;
  direction?: 'up' | 'down' | 'flat';
}

export interface MonthlyReviewHighlight {
  title: string;
  description: string;
  href?: string;
}

export interface MonthlyReview {
  id: string;
  /** YYYY-MM — e.g. "2026-03" */
  period: string;
  title: string;
  summary: string;
  coverImageUrl?: string;
  highlights: MonthlyReviewHighlight[];
  metrics: MonthlyReviewMetric[];
  featuredArticles: Pick<NewsArticle, 'id' | 'slug' | 'title' | 'summary'>[];
  publishedAt: string;
}

export interface MonthlyReviewListItem {
  id: string;
  period: string;
  title: string;
  summary: string;
  publishedAt: string;
}

export interface MonthlyReviewCardProps {
  review: MonthlyReviewListItem;
}

export interface MonthlyReviewDetailProps {
  review: MonthlyReview;
}
