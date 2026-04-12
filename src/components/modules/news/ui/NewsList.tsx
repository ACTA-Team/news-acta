'use client';

import type { NewsListProps } from '@/@types/news';
import { useNewsList } from '@/components/modules/news/hooks/useNewsList';
import { NewsCard } from '@/components/modules/news/ui/NewsCard';
import { NewsFilters } from '@/components/modules/news/ui/NewsFilters';

/**
 * News grid container.
 *
 * - Client Component because it orchestrates filters + refetch.
 * - Can receive `initialData` from a Server Component for SSR.
 * - The card (`NewsCard`) stays Server-safe.
 */
export function NewsList({ initialData, initialFilters }: NewsListProps) {
  const { data, filters, isLoading, error, setFilters } = useNewsList({
    initialData,
    initialFilters,
  });

  return (
    <section className="flex flex-col gap-6">
      <NewsFilters value={filters} onChange={setFilters} />

      {error ? (
        <ErrorState message={error.message} />
      ) : isLoading && !data ? (
        <LoadingState />
      ) : !data || data.items.length === 0 ? (
        <EmptyState />
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

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-800">
      No news yet. Check back soon.
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
      Failed to load news: {message}
    </div>
  );
}
