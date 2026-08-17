import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getTranslations } from '@/i18n/dictionaries';
import { resolveLocaleParams, type LocaleParams } from '@/i18n/params';
import { buildMetadata } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/layouts';

import { MONTHLY_REVIEW_PERIOD_REGEX, MONTHLY_REVIEW_ROUTES } from '../constants';
import { fetchMonthlyReviewByPeriod } from '../services/monthly-review.service';
import { formatPeriodLabel, getPreviousPeriod } from '../utils';
import { MonthlyReviewDetail } from '../ui/MonthlyReviewDetail';

interface MonthlyReviewDetailPageProps {
  params: LocaleParams<{ period: string }>;
}

export async function generateMonthlyReviewDetailMetadata({
  params,
}: MonthlyReviewDetailPageProps): Promise<Metadata> {
  const { locale, period } = await resolveLocaleParams(params);
  const { t } = await getTranslations(locale);

  if (!MONTHLY_REVIEW_PERIOD_REGEX.test(period)) {
    return buildMetadata({
      title: t('monthlyReview.metaTitle'),
      path: MONTHLY_REVIEW_ROUTES.detail(period),
      locale,
    });
  }

  const supabase = await createClient();
  const review = await fetchMonthlyReviewByPeriod(supabase, period, locale);

  if (!review) {
    return buildMetadata({
      title: t('monthlyReview.metaTitle'),
      path: MONTHLY_REVIEW_ROUTES.detail(period),
      locale,
    });
  }

  return buildMetadata({
    // The period is the route segment in every language, so the hreflang
    // alternates are the plain prefix swap and need no override.
    title: `${formatPeriodLabel(review.period, locale)} · ${t('monthlyReview.label')}`,
    description: review.summary,
    path: MONTHLY_REVIEW_ROUTES.detail(review.period),
    locale,
    image: review.coverImageUrl,
    type: 'article',
    publishedTime: review.publishedAt,
  });
}

export async function MonthlyReviewDetailPageContent({ params }: MonthlyReviewDetailPageProps) {
  const { locale, period } = await resolveLocaleParams(params);
  if (!MONTHLY_REVIEW_PERIOD_REGEX.test(period)) notFound();

  const { t } = await getTranslations(locale);
  const supabase = await createClient();
  const review = await fetchMonthlyReviewByPeriod(supabase, period, locale);
  if (!review) notFound();

  // Load previous period review if available to show Month-over-Month comparison deltas
  const prevPeriod = getPreviousPeriod(period);
  const previousReview = await fetchMonthlyReviewByPeriod(supabase, prevPeriod, locale).catch(
    () => null
  );

  return (
    <Container>
      <MonthlyReviewDetail
        review={review}
        previousMetrics={previousReview?.metrics}
        locale={locale}
        t={t}
      />
    </Container>
  );
}
