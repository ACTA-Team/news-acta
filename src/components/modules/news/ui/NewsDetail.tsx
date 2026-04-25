import Image from 'next/image';
import type { NewsDetailProps } from '@/@types/news';
import { formatPublishedDate, getCategoryLabel } from '@/components/modules/news/utils';

/**
 * News article detail view. Server Component.
 * Receives the resolved article from the parent Server Component page.
 */
export function NewsDetail({ article }: NewsDetailProps) {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 py-10">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
        <span>{getCategoryLabel(article.category)}</span>
        <span aria-hidden>·</span>
        <time dateTime={article.publishedAt}>{formatPublishedDate(article.publishedAt)}</time>
        <span aria-hidden>·</span>
        <span>{article.readingTimeMinutes} min read</span>
      </div>

      <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        {article.title}
      </h1>

      <p className="text-lg text-zinc-600 dark:text-zinc-400">{article.summary}</p>

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

      <div
        className="prose prose-zinc max-w-none dark:prose-invert"
        // Content comes from the backend. Sanitize before rendering real HTML.
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </article>
  );
}
