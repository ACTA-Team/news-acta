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

// ---------------------------------------------------------------------------
// Article Version History types
// ---------------------------------------------------------------------------

/**
 * Structured diff metadata stored as JSONB on each version row.
 * Computed by the application layer after every save.
 */
export interface ArticleVersionDiffSummary {
  /** Field names that changed in this version, e.g. ['title', 'content'] */
  fieldsChanged: string[];
  /** Net characters added to the content field */
  contentAdded: number;
  /** Net characters removed from the content field */
  contentRemoved: number;
  /** Number of paragraph-level blocks that changed */
  sectionsModified: number;
}

/** Full version row as returned from the database. */
export interface ArticleVersion {
  id: string;
  articleId: string;
  versionNumber: number;
  title: string;
  summary: string;
  content: string;
  category: NewsCategory;
  diffSummary: ArticleVersionDiffSummary | null;
  editedBy: string | null;
  contentHash: string;
  previousHash: string | null;
  stellarTxHash: string | null;
  createdAt: string;
}

/** Lightweight projection used in timeline / sidebar lists. */
export interface ArticleVersionListItem {
  id: string;
  articleId: string;
  versionNumber: number;
  title: string;
  category: NewsCategory;
  diffSummary: ArticleVersionDiffSummary | null;
  editedBy: string | null;
  contentHash: string;
  previousHash: string | null;
  stellarTxHash: string | null;
  createdAt: string;
}

/** Props for the side-by-side comparison component. */
export interface ArticleComparisonView {
  versionA: ArticleVersion;
  versionB: ArticleVersion;
}
