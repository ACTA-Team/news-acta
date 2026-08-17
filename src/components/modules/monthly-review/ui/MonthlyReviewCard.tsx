'use client';

import Link from 'next/link';
import type { MonthlyReviewCardProps } from '@/@types/monthly-review';
import { MONTHLY_REVIEW_ROUTES } from '@/components/modules/monthly-review/constants';
import { formatPeriodLabel } from '@/components/modules/monthly-review/utils';
import { useTranslations } from '@/hooks/useTranslations';
import { LOCALE_NAMES, withLocale } from '@/i18n';

export function MonthlyReviewCard({ review }: MonthlyReviewCardProps) {
  const { locale } = useTranslations();
  const showsSourceLanguage = review.locale !== locale;

  return (
    <Link
      href={withLocale(locale, MONTHLY_REVIEW_ROUTES.detail(review.period))}
      className="group flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
    >
      <span className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {formatPeriodLabel(review.period, locale)}
        {showsSourceLanguage ? (
          <span
            className="rounded-full border border-zinc-200 px-2 py-0.5 dark:border-zinc-700"
            lang={review.locale}
          >
            {LOCALE_NAMES[review.locale]}
          </span>
        ) : null}
      </span>
      <h3
        className="text-xl font-semibold text-zinc-950 group-hover:underline dark:text-zinc-50"
        lang={showsSourceLanguage ? review.locale : undefined}
      >
        {review.title}
      </h3>
      <p
        className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400"
        lang={showsSourceLanguage ? review.locale : undefined}
      >
        {review.summary}
      </p>
    </Link>
  );
}
