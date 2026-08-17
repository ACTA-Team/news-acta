import type { Metadata } from 'next';

import { getTranslations } from '@/i18n/dictionaries';
import { resolveLocale, type LocaleParams } from '@/i18n/params';
import { buildMetadata } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/layouts';

import { MONTHLY_REVIEW_ROUTES } from '../constants';
import { fetchMonthlyReviews } from '../services/monthly-review.service';
import { MonthlyReviewList } from '../ui/MonthlyReviewList';

interface MonthlyReviewIndexPageProps {
  params: LocaleParams;
}

export async function generateMonthlyReviewMetadata({
  params,
}: MonthlyReviewIndexPageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { t } = await getTranslations(locale);

  return buildMetadata({
    title: t('monthlyReview.metaTitle'),
    description: t('monthlyReview.metaDescription'),
    path: MONTHLY_REVIEW_ROUTES.index,
    locale,
  });
}

export async function MonthlyReviewIndexPageContent({ params }: MonthlyReviewIndexPageProps) {
  const locale = await resolveLocale(params);
  const { t } = await getTranslations(locale);
  const supabase = await createClient();
  const initialData = await fetchMonthlyReviews(supabase, locale);

  return (
    <Container className="flex flex-col gap-10 py-16">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          {t('monthlyReview.index.eyebrow')}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {t('monthlyReview.index.title')}
        </h1>
      </header>
      <MonthlyReviewList initialData={initialData} />
    </Container>
  );
}
