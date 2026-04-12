import Link from 'next/link';
import type { NewsCardProps } from '@/@types/news';
import { NEWS_ROUTES } from '@/components/modules/news/constants';
import { formatPublishedDate, getCategoryLabel } from '@/components/modules/news/utils';

/**
 * Presentational card for a news article. Server Component.
 * Receives `article` via props — it never calls the service or any hook.
 */
export function NewsCard({ article }: NewsCardProps) {
  return (
    <article className="group flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          {getCategoryLabel(article.category)}
        </span>
        <span aria-hidden>·</span>
        <time dateTime={article.publishedAt}>{formatPublishedDate(article.publishedAt)}</time>
        <span aria-hidden>·</span>
        <span>{article.readingTimeMinutes} min read</span>
      </div>

      <Link
        href={NEWS_ROUTES.detail(article.slug)}
        className="text-xl font-semibold leading-snug text-zinc-950 group-hover:underline dark:text-zinc-50"
      >
        {article.title}
      </Link>

      <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">{article.summary}</p>

      <footer className="mt-auto flex items-center gap-2 pt-3 text-xs text-zinc-500">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">{article.author.name}</span>
        {article.author.role ? <span>· {article.author.role}</span> : null}
      </footer>
    </article>
  );
}
