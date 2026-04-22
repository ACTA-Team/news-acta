'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { NewsFiltersProps, NewsCategory } from '@/@types/news';
import { NEWS_CATEGORIES } from '@/components/modules/news/constants';
import { cn } from '@/lib/utils';

/**
 * Category filter chips. Client Component (handles clicks).
 * It has no knowledge of the data source — it only emits `onChange`.
 */
export function NewsFilters({ value, onChange }: NewsFiltersProps) {
  const active = value.category;
  const [searchTerm, setSearchTerm] = useState(value.search ?? '');
  const hasSearch = searchTerm.trim().length > 0;

  useEffect(() => {
    setSearchTerm(value.search ?? '');
  }, [value.search]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextSearch = searchTerm.trim().length > 0 ? searchTerm : undefined;

      if (nextSearch === value.search) {
        return;
      }

      onChange({
        ...value,
        search: nextSearch,
        page: 1,
      });
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [onChange, searchTerm, value]);

  const handleSelect = (next: NewsCategory | undefined) => {
    onChange({
      ...value,
      category: next,
      search: searchTerm.trim().length > 0 ? searchTerm : undefined,
      page: 1,
    });
  };

  const handleClearSearch = () => {
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
        <span className="sr-only">Search news articles</span>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search articles..."
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 pr-10 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-600"
            aria-label="Search articles"
          />

          {hasSearch ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </label>

      <nav aria-label="Filter news by category" className="flex flex-wrap items-center gap-2">
        <FilterChip active={!active} onClick={() => handleSelect(undefined)}>
          All
        </FilterChip>
        {NEWS_CATEGORIES.map((category) => (
          <FilterChip
            key={category.value}
            active={active === category.value}
            onClick={() => handleSelect(category.value)}
          >
            {category.label}
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
