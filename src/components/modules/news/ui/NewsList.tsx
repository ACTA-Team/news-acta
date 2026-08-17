'use client';

import type { NewsListProps } from '@/@types/news';
import { useNewsList } from '@/components/modules/news/hooks/useNewsList';
import { NewsCard } from '@/components/modules/news/ui/NewsCard';
import { NewsFilters } from '@/components/modules/news/ui/NewsFilters';
import { useTranslations } from '@/hooks/useTranslations';
import type { Translator } from '@/i18n/translate';

/**
 * News grid container.
 *
 * - Client Component because it orchestrates filters + refetch.
 * - Can receive `initialData` from a Server Component for SSR.
 * - Refetches in the reader's locale, so a search runs against the Spanish text
 *   search configuration on `/es` and the English one on `/en`.
 */
export function NewsList({ initialData, initialFilters }: NewsListProps) {
  const { t } = useTranslations();
  const { data, filters, isLoading, error, setFilters } = useNewsList({
    initialData,
    initialFilters,
  });

  return (
    <section className="flex flex-col gap-6">
      <NewsFilters value={filters} onChange={setFilters} />

      {error ? (
        <ErrorState message={error.message} t={t} />
      ) : isLoading && !data ? (
        <LoadingState />
      ) : !data || data.items.length === 0 ? (
        <EmptyState t={t} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </section>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-48 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
        />
      ))}
    </div>
  );
}

function EmptyState({ t }: { t: Translator }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-800">
      {t('news.list.empty')}
    </div>
  );
}

function ErrorState({ message, t }: { message: string; t: Translator }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
      {t('news.list.error', { message })}
    </div>
  );
}
