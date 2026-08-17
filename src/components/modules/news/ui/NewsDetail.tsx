import Image from 'next/image';
import { Languages } from 'lucide-react';

import type { NewsDetailProps } from '@/@types/news';
import { formatPublishedDate, getCategoryLabel } from '@/components/modules/news/utils';
import { ArticleContent } from '@/components/modules/news/ui/embeds/ArticleContent';
import { LOCALE_NAMES, type Locale } from '@/i18n/config';
import type { Translator } from '@/i18n/translate';

/**
 * News article detail view. Server Component.
 * Receives the resolved article from the parent Server Component page.
 *
 * `locale` is the locale the reader asked for; `article.locale` is the one the
 * text is actually in. When they differ, nobody has translated this article yet,
 * so the body is marked with its real language for screen readers and the reader
 * is told what they are looking at.
 */
interface Props extends NewsDetailProps {
  locale: Locale;
  t: Translator;
}

export function NewsDetail({ article, locale, t }: Props) {
  const showsSourceLanguage = article.locale !== locale;
  const bodyLang = showsSourceLanguage ? article.locale : undefined;

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 py-10">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
        <span>{getCategoryLabel(article.category, t)}</span>
        <span aria-hidden>·</span>
        <time dateTime={article.publishedAt}>
          {formatPublishedDate(article.publishedAt, locale)}
        </time>
        <span aria-hidden>·</span>
        <span>{t('news.detail.readingTime', { minutes: article.readingTimeMinutes })}</span>
      </div>

      {showsSourceLanguage ? (
        <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          <Languages className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden />
          <span>{t('news.detail.notTranslated', { language: LOCALE_NAMES[article.locale] })}</span>
        </p>
      ) : null}

      <h1
        className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
        lang={bodyLang}
      >
        {article.title}
      </h1>

      <p className="text-lg text-zinc-600 dark:text-zinc-400" lang={bodyLang}>
        {article.summary}
      </p>

      <div className="flex items-center gap-3 border-y border-zinc-200 py-4 text-sm dark:border-zinc-800">
        <div className="flex flex-col">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {article.author.name}
          </span>
          {article.author.role ? (
            <span className="text-zinc-500">{article.author.role}</span>
          ) : null}
        </div>
      </div>

      {article.coverImageUrl && (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Image
            src={article.coverImageUrl}
            alt={article.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      {/* Parses Stellar entities and renders inline embeds; falls back to raw
          content if resolution fails. Async Server Component. */}
      <div lang={bodyLang}>
        <ArticleContent content={article.content} />
      </div>
    </article>
  );
}
