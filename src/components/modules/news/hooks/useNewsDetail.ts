'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { NewsArticle } from '@/@types/news';
import { fetchNewsBySlug } from '@/components/modules/news/services/news.service';
import { createClient } from '@/lib/supabase/client';

interface UseNewsDetailResult {
  article: NewsArticle | null;
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

/**
 * Client hook to load a news article detail by slug.
 *
 * Prefer Server Components for detail pages whenever possible.
 * This hook exists for dynamic flows (preview, modals, etc.).
 */
export function useNewsDetail(slug: string): UseNewsDetailResult {
  const supabaseRef = useRef(createClient());
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchNewsBySlug(supabaseRef.current, slug);
      setArticle(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  return { article, isLoading, error, reload: load };
}
