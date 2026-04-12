'use client';

import type { NewsFiltersProps, NewsCategory } from '@/@types/news';
import { NEWS_CATEGORIES } from '@/components/modules/news/constants';
import { cn } from '@/lib/utils';

/**
 * Category filter chips. Client Component (handles clicks).
 * It has no knowledge of the data source — it only emits `onChange`.
 */
export function NewsFilters({ value, onChange }: NewsFiltersProps) {
  const active = value.category;

  const handleSelect = (next: NewsCategory | undefined) => {
    onChange({ ...value, category: next, page: 1 });
  };

  return (
    <nav
      aria-label="Filter news by category"
      className="flex flex-wrap items-center gap-2"
    >
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
          : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700',
      )}
    >
      {children}
    </button>
  );
}
