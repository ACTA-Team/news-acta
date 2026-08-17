import type { LocalizedContent } from '@/@types/i18n';
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

export interface HorizonMetrics {
  txCount: number;
  avgTxVolume?: number;
  activeAccounts: number;
  avgFee: string;
  operationsByType: Record<string, number>;
  dailyTrend?: { date: string; txCount: number }[];
}

export interface SorobanMetrics {
  contractsDeployed: number;
  invocationCount: number;
  avgGasUsage: number;
  topContracts: { contractId: string; invocations: number }[];
}

export interface MonthlyReviewOnChainMetrics {
  horizon: HorizonMetrics;
  soroban: SorobanMetrics;
  collectedAt: string;
}

export interface MonthlyReviewMetricsSchema {
  onChain?: MonthlyReviewOnChainMetrics;
  editorial: MonthlyReviewMetric[];
}

export interface MonthlyReview extends LocalizedContent {
  id: string;
  /** YYYY-MM, e.g. "2026-03". The route segment, identical in every locale. */
  period: string;
  title: string;
  summary: string;
  coverImageUrl?: string;
  highlights: MonthlyReviewHighlight[];
  metrics: MonthlyReviewMetric[] | MonthlyReviewMetricsSchema;
  featuredArticles: Pick<NewsArticle, 'id' | 'slug' | 'title' | 'summary'>[];
  publishedAt: string;
}

export interface MonthlyReviewListItem extends LocalizedContent {
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
  previousMetrics?: MonthlyReviewMetric[] | MonthlyReviewMetricsSchema;
}
