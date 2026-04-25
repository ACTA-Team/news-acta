/**
 * Public barrel for the `news` module.
 *
 * RULE: outside this module, imports may only come from this file.
 *   OK:   import { NewsList } from '@/components/modules/news';
 *   NO:   import { NewsList } from '@/components/modules/news/ui/NewsList';
 *
 * This keeps the contract stable and lets us reorganize `ui/`, `hooks/`,
 * `services/` internally without breaking consumers.
 */

import { buildMetadata } from '@/lib/seo';

// UI
export { NewsHeader } from './ui/NewsHeader';
export { NewsList } from './ui/NewsList';
export { NewsCard } from './ui/NewsCard';
export { NewsDetail } from './ui/NewsDetail';
export { NewsFilters } from './ui/NewsFilters';
export { NewsPageContent } from './pages/NewsPage';
export { NewsDetailPageContent, generateNewsDetailMetadata } from './pages/NewsDetailPage';

// Hooks
export { useNewsList } from './hooks/useNewsList';
export { useNewsDetail } from './hooks/useNewsDetail';

// Services (for Server Components that need SSR)
export { fetchNewsList, fetchNewsBySlug } from './services/news.service';

// Constants
export { NEWS_CATEGORIES, NEWS_DEFAULT_PAGE_SIZE, NEWS_ROUTES, NEWS_QUERY_KEYS } from './constants';

// Utils
export {
  getCategoryLabel,
  formatPublishedDate,
  estimateReadingTime,
  sortArticlesByDate,
} from './utils';

export const newsPageMetadata = buildMetadata({
  title: 'News',
  description:
    'Announcements, product updates, engineering deep-dives and community highlights from the ACTA ecosystem.',
  path: '/news',
});
