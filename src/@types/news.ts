/**
 * News domain types.
 *
 * Convention: every type in the `news` domain lives here.
 * Do NOT import types from `components/modules/news/ui/*` out to the world:
 * UI consumes types from this file, not the other way around.
 */

export type NewsCategory = 'announcement' | 'product' | 'ecosystem' | 'engineering' | 'community';

export type NewsStatus = 'draft' | 'published' | 'archived';

export interface NewsAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: string;
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  coverImageUrl?: string;
  category: NewsCategory;
  status: NewsStatus;
  tags: string[];
  author: NewsAuthor;
  publishedAt: string;
  updatedAt: string;
  readingTimeMinutes: number;
}

export interface NewsListFilters {
  category?: NewsCategory;
  tag?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface NewsListResponse {
  items: NewsArticle[];
  total: number;
  page: number;
  pageSize: number;
}

/** Public props for the module's UI components. */
export interface NewsCardProps {
  article: NewsArticle;
  onClick?: (article: NewsArticle) => void;
}

export interface NewsListProps {
  initialData?: NewsListResponse;
  initialFilters?: NewsListFilters;
}

export interface NewsDetailProps {
  article: NewsArticle;
}

export interface NewsFiltersProps {
  value: NewsListFilters;
  onChange: (next: NewsListFilters) => void;
}
