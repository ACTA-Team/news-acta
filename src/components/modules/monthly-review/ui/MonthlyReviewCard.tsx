import Link from 'next/link';
import type { MonthlyReviewCardProps } from '@/@types/monthly-review';
import { MONTHLY_REVIEW_ROUTES } from '@/components/modules/monthly-review/constants';
import { formatPeriodLabel } from '@/components/modules/monthly-review/utils';

export function MonthlyReviewCard({ review }: MonthlyReviewCardProps) {
  return (
    <Link
      href={MONTHLY_REVIEW_ROUTES.detail(review.period)}
      className="group flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
    >
      <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {formatPeriodLabel(review.period)}
      </span>
      <h3 className="text-xl font-semibold text-zinc-950 group-hover:underline dark:text-zinc-50">
        {review.title}
      </h3>
      <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">{review.summary}</p>
    </Link>
  );
}
