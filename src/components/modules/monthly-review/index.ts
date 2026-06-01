import { buildMetadata } from '@/lib/seo';

export { MonthlyReviewList } from './ui/MonthlyReviewList';
export { MonthlyReviewCard } from './ui/MonthlyReviewCard';
export { MonthlyReviewDetail } from './ui/MonthlyReviewDetail';
export { MonthlyReviewMetrics } from './ui/MonthlyReviewMetrics';
export { MonthlyReviewIndexPageContent } from './pages/MonthlyReviewIndexPage';
export {
  MonthlyReviewDetailPageContent,
  generateMonthlyReviewDetailMetadata,
} from './pages/MonthlyReviewDetailPage';

export { useMonthlyReviews } from './hooks/useMonthlyReviews';

export { fetchMonthlyReviews, fetchMonthlyReviewByPeriod } from './services/monthly-review.service';

export { MONTHLY_REVIEW_ROUTES, MONTHLY_REVIEW_PERIOD_REGEX } from './constants';

export { formatPeriodLabel, sortPeriodsDesc } from './utils';

export const monthlyReviewPageMetadata = buildMetadata({
  title: 'Monthly Review',
  description:
    'Monthly reviews of the ACTA ecosystem: milestones, metrics and featured content from the month.',
  path: '/monthly-review',
});
