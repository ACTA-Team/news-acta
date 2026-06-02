'use client';

import type { MediaBucket, MediaListFilters } from '@/@types/media';

interface MediaFiltersProps {
  filters: MediaListFilters;
  onChange: (next: MediaListFilters) => void;
}

const BUCKETS: { value: MediaBucket | ''; label: string }[] = [
  { value: '', label: 'All buckets' },
  { value: 'article-covers', label: 'Article Covers' },
  { value: 'article-content', label: 'Article Content' },
  { value: 'author-avatars', label: 'Author Avatars' },
];

const USAGE_OPTIONS: { value: '' | 'used' | 'unused'; label: string }[] = [
  { value: '', label: 'All usage' },
  { value: 'used', label: 'In use' },
  { value: 'unused', label: 'Unused' },
];

export function MediaFilters({ filters, onChange }: MediaFiltersProps) {
  function update(patch: Partial<MediaListFilters>) {
    onChange({ ...filters, ...patch, page: 1 });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <input
        type="search"
        placeholder="Search by filename…"
        aria-label="Search by filename"
        value={filters.search ?? ''}
        onChange={(e) => update({ search: e.target.value || undefined })}
        className="h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
      />

      {/* Bucket filter */}
      <select
        value={filters.bucket ?? ''}
        onChange={(e) =>
          update({ bucket: (e.target.value as MediaBucket) || undefined })
        }
        className="h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
        aria-label="Filter by bucket"
      >
        {BUCKETS.map((b) => (
          <option key={b.value} value={b.value}>
            {b.label}
          </option>
        ))}
      </select>

      {/* Usage filter */}
      <select
        value={filters.usage ?? ''}
        onChange={(e) =>
          update({ usage: (e.target.value as 'used' | 'unused') || undefined })
        }
        className="h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
        aria-label="Filter by usage"
      >
        {USAGE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Date from */}
      <input
        type="date"
        value={filters.dateFrom ?? ''}
        onChange={(e) => update({ dateFrom: e.target.value || undefined })}
        className="h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
        aria-label="Filter from date"
      />

      {/* Date to */}
      <input
        type="date"
        value={filters.dateTo ?? ''}
        onChange={(e) => update({ dateTo: e.target.value || undefined })}
        className="h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
        aria-label="Filter to date"
      />

      {/* Clear filters */}
      {(filters.search || filters.bucket || filters.usage || filters.dateFrom || filters.dateTo) && (
        <button
          type="button"
          onClick={() => onChange({ page: 1 })}
          className="h-9 rounded-md px-3 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
