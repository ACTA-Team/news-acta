'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NewsListFilters, NewsListResponse } from '@/@types/news';
import { fetchNewsList } from '@/components/modules/news/services/news.service';
import { NEWS_DEFAULT_PAGE_SIZE } from '@/components/modules/news/constants';
import { createClient } from '@/lib/supabase/client';

interface UseNewsListArgs {
  initialData?: NewsListResponse;
  initialFilters?: NewsListFilters;
}

interface UseNewsListResult {
  data: NewsListResponse | null;
  filters: NewsListFilters;
  isLoading: boolean;
  error: Error | null;
  setFilters: (next: NewsListFilters) => void;
  refresh: () => Promise<void>;
}

/**
 * Client hook to list news articles with paginated filters.
 *
 * - Accepts `initialData` to hydrate from a Server Component.
 * - All network logic lives in `news.service`; this hook only orchestrates state.
 */
export function useNewsList({
  initialData,
  initialFilters,
}: UseNewsListArgs = {}): UseNewsListResult {
  const supabaseRef = useRef(createClient());
  const [data, setData] = useState<NewsListResponse | null>(initialData ?? null);
  const [filters, setFiltersState] = useState<NewsListFilters>(
    initialFilters ?? { page: 1, pageSize: NEWS_DEFAULT_PAGE_SIZE }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async (next: NewsListFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchNewsList(supabaseRef.current, next);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialData) return;
    void load(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFilters = useCallback(
    (next: NewsListFilters) => {
      setFiltersState(next);
      void load(next);
    },
    [load]
  );

  const refresh = useCallback(() => load(filters), [load, filters]);

  return useMemo(
    () => ({ data, filters, isLoading, error, setFilters, refresh }),
    [data, filters, isLoading, error, setFilters, refresh]
  );
}
