import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  MonthlyReviewDetail,
  fetchMonthlyReviewByPeriod,
  formatPeriodLabel,
  MONTHLY_REVIEW_PERIOD_REGEX,
  MONTHLY_REVIEW_ROUTES,
} from '@/components/modules/monthly-review';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/layouts';
import { buildMetadata } from '@/lib/seo';

interface PageProps {
  params: Promise<{ period: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { period } = await params;
  if (!MONTHLY_REVIEW_PERIOD_REGEX.test(period)) {
    return buildMetadata({
      title: 'Monthly Review',
      path: MONTHLY_REVIEW_ROUTES.detail(period),
    });
  }
  const supabase = await createClient();
  const review = await fetchMonthlyReviewByPeriod(supabase, period);
  if (!review) {
    return buildMetadata({
      title: 'Monthly Review',
      path: MONTHLY_REVIEW_ROUTES.detail(period),
    });
  }
  return buildMetadata({
    title: `${formatPeriodLabel(review.period)} · Monthly Review`,
    description: review.summary,
    path: MONTHLY_REVIEW_ROUTES.detail(review.period),
    image: review.coverImageUrl,
    type: 'article',
    publishedTime: review.publishedAt,
  });
}

export default async function MonthlyReviewDetailPage({ params }: PageProps) {
  const { period } = await params;
  if (!MONTHLY_REVIEW_PERIOD_REGEX.test(period)) notFound();

  const supabase = await createClient();
  const review = await fetchMonthlyReviewByPeriod(supabase, period);
  if (!review) notFound();

  return (
    <Container>
      <MonthlyReviewDetail review={review} />
    </Container>
  );
}
