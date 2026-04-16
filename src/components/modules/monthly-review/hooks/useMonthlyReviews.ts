'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MonthlyReviewListItem } from '@/@types/monthly-review';
import { fetchMonthlyReviews } from '@/components/modules/monthly-review/services/monthly-review.service';
import { createClient } from '@/lib/supabase/client';

interface UseMonthlyReviewsArgs {
  initialData?: MonthlyReviewListItem[];
}

export function useMonthlyReviews({ initialData }: UseMonthlyReviewsArgs = {}) {
  const supabaseRef = useRef(createClient());
  const [data, setData] = useState<MonthlyReviewListItem[]>(initialData ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await fetchMonthlyReviews(supabaseRef.current));
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialData && initialData.length > 0) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, isLoading, error, reload: load };
}
