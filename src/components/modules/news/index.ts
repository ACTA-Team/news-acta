/**
 * Public barrel for the `news` module.
 *
 * RULE: outside this module, imports may only come from this file.
 *   OK:   import { NewsList } from '@/components/modules/news';
 *   NO:   import { NewsList } from '@/components/modules/news/ui/NewsList';
 *
 * This keeps the contract stable and lets us reorganize `ui/`, `hooks/`,
 * `services/` internally without breaking consumers.
 *
 * Page metadata is exported as a `generate*` function rather than a constant:
 * every title and description is locale dependent now, so it cannot be computed
 * at module load.
 */

// UI
export { NewsHeader } from './ui/NewsHeader';
export { NewsList } from './ui/NewsList';
export { NewsCard } from './ui/NewsCard';
export { NewsDetail } from './ui/NewsDetail';
export { NewsFilters } from './ui/NewsFilters';
export { ArticleContent } from './ui/embeds/ArticleContent';
export { VersionTimeline } from './ui/VersionTimeline';
export { VersionDiffBadge } from './ui/VersionDiffBadge';
export { VersionComparison } from './ui/VersionComparison';
export { VersionHistorySidebar } from './ui/VersionHistorySidebar';
export { VersionInteractiveSelector } from './ui/VersionInteractiveSelector';
export { NewsPageContent, generateNewsMetadata } from './pages/NewsPage';
export { NewsDetailPageContent, generateNewsDetailMetadata } from './pages/NewsDetailPage';
export { NewsHistoryPageContent, generateNewsHistoryMetadata } from './pages/NewsHistoryPage';

// Hooks
export { useNewsList } from './hooks/useNewsList';
export { useNewsDetail } from './hooks/useNewsDetail';

// Services (for Server Components that need SSR)
export {
  fetchNewsList,
  fetchNewsBySlug,
  fetchNewsSitemapEntries,
  type NewsSitemapEntry,
} from './services/news.service';
export { fetchArticleVersions, fetchArticleVersionByNumber } from './services/versions.service';

// Constants
export { NEWS_CATEGORIES, NEWS_DEFAULT_PAGE_SIZE, NEWS_ROUTES, NEWS_QUERY_KEYS } from './constants';

// Utils
export {
  articleAlternatePaths,
  articleHreflangPaths,
  getCategoryLabel,
  formatPublishedDate,
  estimateReadingTime,
  sortArticlesByDate,
} from './utils';
