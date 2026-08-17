'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { NewsFiltersProps, NewsCategory } from '@/@types/news';
import { NEWS_CATEGORIES } from '@/components/modules/news/constants';
import { useTranslations } from '@/hooks/useTranslations';
import { cn } from '@/lib/utils';

/**
 * Category filter chips and the search box. Client Component (handles clicks).
 * It has no knowledge of the data source, it only emits `onChange`.
 */
export function NewsFilters({ value, onChange }: NewsFiltersProps) {
  const { t } = useTranslations();
  const active = value.category;
  const [searchTerm, setSearchTerm] = useState(value.search ?? '');
  const hasSearch = searchTerm.trim().length > 0;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValueRef = useRef(value);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const scheduleSearchUpdate = (nextSearch: string | undefined) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const latest = latestValueRef.current;
      if (latest.search === nextSearch) {
        return;
      }

      onChange({
        ...latest,
        search: nextSearch,
        page: 1,
      });
    }, 300);
  };

  const handleSearchChange = (nextSearch: string) => {
    setSearchTerm(nextSearch);
    scheduleSearchUpdate(nextSearch.trim().length > 0 ? nextSearch : undefined);
  };

  const handleSelect = (next: NewsCategory | undefined) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    onChange({
      ...value,
      category: next,
      search: searchTerm.trim().length > 0 ? searchTerm : undefined,
      page: 1,
    });
  };

  const handleClearSearch = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setSearchTerm('');
    onChange({
      ...value,
      search: undefined,
      page: 1,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-2">
        <span className="sr-only">{t('news.filters.searchLabel')}</span>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder={t('news.filters.searchPlaceholder')}
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 pr-10 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-600"
            aria-label={t('news.filters.searchLabel')}
          />

          {hasSearch ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              aria-label={t('news.filters.clearSearch')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </label>

      <nav aria-label={t('news.filters.categoryNav')} className="flex flex-wrap items-center gap-2">
        <FilterChip active={!active} onClick={() => handleSelect(undefined)}>
          {t('news.filters.all')}
        </FilterChip>
        {NEWS_CATEGORIES.map((category) => (
          <FilterChip
            key={category.value}
            active={active === category.value}
            onClick={() => handleSelect(category.value)}
          >
            {t(category.labelKey)}
          </FilterChip>
        ))}
      </nav>
    </div>
  );
}

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function FilterChip({ active, onClick, children }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-sm transition-colors',
        active
          ? 'border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
          : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700'
      )}
    >
      {children}
    </button>
  );
}
