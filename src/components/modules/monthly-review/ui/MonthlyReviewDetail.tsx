import Link from 'next/link';
import { Languages } from 'lucide-react';

import type { MonthlyReviewDetailProps } from '@/@types/monthly-review';
import { NEWS_ROUTES } from '@/components/modules/news';
import { formatPeriodLabel } from '@/components/modules/monthly-review/utils';
import { LOCALE_NAMES, withLocale, type Locale } from '@/i18n';
import type { Translator } from '@/i18n/translate';
import { MonthlyReviewMetrics } from './MonthlyReviewMetrics';

interface Props extends MonthlyReviewDetailProps {
  locale: Locale;
  t: Translator;
}

export function MonthlyReviewDetail({ review, previousMetrics, locale, t }: Props) {
  const showsSourceLanguage = review.locale !== locale;
  const bodyLang = showsSourceLanguage ? review.locale : undefined;

  return (
    <article className="mx-auto flex max-w-4xl flex-col gap-10 py-10">
      <header className="flex flex-col gap-3">
        <span className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
          {formatPeriodLabel(review.period, locale)} · {t('monthlyReview.label')}
        </span>

        {showsSourceLanguage ? (
          <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            <Languages className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden />
            <span>
              {t('monthlyReview.detail.notTranslated', {
                language: LOCALE_NAMES[review.locale],
              })}
            </span>
          </p>
        ) : null}

        <h1
          className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
          lang={bodyLang}
        >
          {review.title}
        </h1>
        <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400" lang={bodyLang}>
          {review.summary}
        </p>
      </header>

      <MonthlyReviewMetrics
        metrics={review.metrics}
        previousMetrics={previousMetrics}
        period={review.period}
      />

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {t('monthlyReview.detail.highlights')}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {review.highlights.map((highlight) => (
            <li
              key={highlight.title}
              className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800"
            >
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{highlight.title}</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {highlight.description}
              </p>
              {highlight.href ? (
                <Link
                  href={
                    highlight.href.startsWith('/')
                      ? withLocale(locale, highlight.href)
                      : highlight.href
                  }
                  className="mt-2 inline-block text-sm underline"
                >
                  {t('common.readMore')}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {review.featuredArticles.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            {t('monthlyReview.detail.featuredArticles')}
          </h2>
          <ul className="flex flex-col gap-3">
            {review.featuredArticles.map((article) => (
              <li key={article.id}>
                <Link
                  href={withLocale(locale, NEWS_ROUTES.detail(article.slug))}
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
