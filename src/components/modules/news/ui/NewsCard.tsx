'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { NewsCardProps } from '@/@types/news';
import { NEWS_ROUTES } from '@/components/modules/news/constants';
import { formatPublishedDate, getCategoryLabel } from '@/components/modules/news/utils';
import { useTranslations } from '@/hooks/useTranslations';
import { LOCALE_NAMES, withLocale } from '@/i18n';
import { VerifiedAuthorBadge } from '@/components/modules/authors/ui/VerifiedAuthorBadge';

/**
 * Presentational card for a news article.
 *
 * A Client Component now: it needs the active locale for the date format, the
 * category label and the link prefix. It still never calls the service; the
 * article arrives fully resolved via props.
 */
export function NewsCard({ article }: NewsCardProps) {
  const { locale, t } = useTranslations();

  // The article resolved to a different language than the reader asked for,
  // which means nobody has translated it yet.
  const showsSourceLanguage = article.locale !== locale;

  return (
    <article className="group flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 overflow-hidden">
      {article.coverImageUrl && (
        <div className="relative aspect-video w-full">
          <Image
            src={article.coverImageUrl}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      )}
      <div className="flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-zinc-500">
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {getCategoryLabel(article.category, t)}
          </span>
          <span aria-hidden>·</span>
          <time dateTime={article.publishedAt}>
            {formatPublishedDate(article.publishedAt, locale)}
          </time>
          <span aria-hidden>·</span>
          <span>{t('news.card.readingTime', { minutes: article.readingTimeMinutes })}</span>
          {showsSourceLanguage ? (
            <span
              className="rounded-full border border-zinc-200 px-2 py-0.5 uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
              lang={article.locale}
            >
              {LOCALE_NAMES[article.locale]}
            </span>
          ) : null}
        </div>

        <Link
          href={withLocale(locale, NEWS_ROUTES.detail(article.slug))}
          className="text-xl font-semibold leading-snug text-zinc-950 group-hover:underline dark:text-zinc-50"
          lang={showsSourceLanguage ? article.locale : undefined}
        >
          {article.title}
        </Link>

        <p
          className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400"
          lang={showsSourceLanguage ? article.locale : undefined}
        >
          {article.summary}
        </p>

        <footer className="mt-auto flex flex-wrap items-center gap-2 pt-3 text-xs text-zinc-500">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {article.author.name}
          </span>
          {article.author.role ? <span>· {article.author.role}</span> : null}
          <VerifiedAuthorBadge
            status={article.author.credential?.status}
            vcId={article.author.credential?.vcId}
            locale={locale}
            t={t}
          />
        </footer>
      </div>
    </article>
  );
}
