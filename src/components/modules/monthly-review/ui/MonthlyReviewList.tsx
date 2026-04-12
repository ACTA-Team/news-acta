'use client';

import { useMonthlyReviews } from '@/components/modules/monthly-review/hooks/useMonthlyReviews';
import { MonthlyReviewCard } from './MonthlyReviewCard';
import type { MonthlyReviewListItem } from '@/@types/monthly-review';

interface MonthlyReviewListProps {
  initialData?: MonthlyReviewListItem[];
}

export function MonthlyReviewList({ initialData }: MonthlyReviewListProps) {
  const { data, isLoading, error } = useMonthlyReviews({ initialData });

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
        Failed to load reviews: {error.message}
      </div>
    );
  }

  if (isLoading && data.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-800">
        No monthly reviews published yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((review) => (
        <MonthlyReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
