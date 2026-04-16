import Link from 'next/link';
import type { MonthlyReviewDetailProps } from '@/@types/monthly-review';
import { NEWS_ROUTES } from '@/components/modules/news';
import { formatPeriodLabel } from '@/components/modules/monthly-review/utils';
import { MonthlyReviewMetrics } from './MonthlyReviewMetrics';

export function MonthlyReviewDetail({ review }: MonthlyReviewDetailProps) {
  return (
    <article className="mx-auto flex max-w-4xl flex-col gap-10 py-10">
      <header className="flex flex-col gap-3">
        <span className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
          {formatPeriodLabel(review.period)} · Monthly Review
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {review.title}
        </h1>
        <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">{review.summary}</p>
      </header>

      <MonthlyReviewMetrics metrics={review.metrics} />

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Highlights</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {review.highlights.map((h) => (
            <li
              key={h.title}
              className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800"
            >
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{h.title}</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{h.description}</p>
              {h.href ? (
                <Link href={h.href} className="mt-2 inline-block text-sm underline">
                  Read more
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {review.featuredArticles.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Featured articles
          </h2>
          <ul className="flex flex-col gap-3">
            {review.featuredArticles.map((article) => (
              <li key={article.id}>
                <Link
                  href={NEWS_ROUTES.detail(article.slug)}
                  className="flex flex-col rounded-xl border border-zinc-200 p-4 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                >
                  <span className="font-medium">{article.title}</span>
                  <span className="text-sm text-zinc-500">{article.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
