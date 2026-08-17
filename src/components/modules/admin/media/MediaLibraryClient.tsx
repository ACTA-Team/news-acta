'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MediaBucket, MediaItem, MediaListFilters, MediaListResponse } from '@/@types/media';
import { MediaGrid } from './MediaGrid';
import { MediaFilters } from './MediaFilters';
import { MediaDetailModal } from './MediaDetailModal';
import { UploadZone } from './UploadZone';

interface MediaLibraryClientProps {
  initialData: MediaListResponse;
}

export function MediaLibraryClient({ initialData }: MediaLibraryClientProps) {
  const [data, setData] = useState<MediaListResponse>(initialData);
  const [filters, setFilters] = useState<MediaListFilters>({ page: 1 });
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadBucket, setUploadBucket] = useState<MediaBucket>('article-covers');
  const [bulkAltText, setBulkAltText] = useState('');
  const [bulkActionError, setBulkActionError] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const didInitRef = useRef(false);

  // Fetch media list whenever filters change: skip the very first render
  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
      return;
    }
    fetchMedia(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function fetchMedia(f: MediaListFilters) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.bucket) params.set('bucket', f.bucket);
      if (f.search) params.set('search', f.search);
      if (f.usage) params.set('usage', f.usage);
      if (f.dateFrom) params.set('dateFrom', f.dateFrom);
      if (f.dateTo) params.set('dateTo', f.dateTo);
      if (f.page) params.set('page', String(f.page));

      const res = await fetch(`/api/media?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch media');
      const result: MediaListResponse = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  function handleSelectAll() {
    if (selectedIds.size === data.items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.items.map((i) => i.id)));
    }
  }

  function handleFiltersChange(next: MediaListFilters) {
    setFilters(next);
    setSelectedIds(new Set());
  }

  function handleUploaded(item: MediaItem, _publicUrl: string) {
    setData((prev) => ({
      ...prev,
      items: [item, ...prev.items],
      total: prev.total + 1,
    }));
    setShowUpload(false);
  }

  function handleAltTextSaved(id: string, altText: string) {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, altText } : i)),
    }));
    if (detailItem?.id === id) {
      setDetailItem((prev) => (prev ? { ...prev, altText } : null));
    }
  }

  function handleDeleted(id: string) {
    setData((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id),
      total: prev.total - 1,
    }));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    setBulkActionError(null);
    const ids = Array.from(selectedIds);
    const errors: string[] = [];

    for (const id of ids) {
      try {
        const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json();
          errors.push(data.error ?? `Failed to delete ${id}`);
        } else {
          handleDeleted(id);
        }
      } catch {
        errors.push(`Network error deleting ${id}`);
      }
    }

    if (errors.length > 0) {
      setBulkActionError(errors.join('; '));
    }
    setConfirmBulkDelete(false);
    setSelectedIds(new Set());
  }

  async function handleBulkSetAltText() {
    if (!bulkAltText.trim()) return;
    setBulkActionError(null);
    const ids = Array.from(selectedIds);
    const failedIds: string[] = [];
    const errors: string[] = [];

    for (const id of ids) {
      try {
        const res = await fetch(`/api/media/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ altText: bulkAltText }),
        });
        if (res.ok) {
          handleAltTextSaved(id, bulkAltText);
        } else {
          const data = await res.json();
          failedIds.push(id);
          errors.push(data.error ?? `Failed for ${id}`);
        }
      } catch {
        failedIds.push(id);
        errors.push(`Network error for ${id}`);
      }
    }

    if (failedIds.length > 0) {
      setBulkActionError(errors.join('; '));
      setSelectedIds(new Set(failedIds));
    } else {
      setBulkAltText('');
      setSelectedIds(new Set());
    }
  }

  const totalPages = Math.ceil(data.total / (filters.pageSize ?? 24));
  const currentPage = filters.page ?? 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Media Library</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {data.total} file{data.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowUpload((v) => !v)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          {showUpload ? 'Hide upload' : '+ Upload'}
        </button>
      </div>

      {/* Upload zone */}
      {showUpload && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-zinc-400">Upload to:</label>
            <select
              value={uploadBucket}
              onChange={(e) => setUploadBucket(e.target.value as MediaBucket)}
              className="h-8 rounded-md border border-zinc-700 bg-zinc-800 px-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
            >
              <option value="article-covers">Article Covers</option>
              <option value="article-content">Article Content</option>
              <option value="author-avatars">Author Avatars</option>
            </select>
          </div>
          <UploadZone bucket={uploadBucket} onUploaded={handleUploaded} />
        </div>
      )}

      {/* Filters */}
      <MediaFilters filters={filters} onChange={handleFiltersChange} />

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3">
          <span className="text-sm text-zinc-300">{selectedIds.size} selected</span>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Set alt text for selected…"
              value={bulkAltText}
              onChange={(e) => setBulkAltText(e.target.value)}
              className="h-8 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleBulkSetAltText}
              disabled={!bulkAltText.trim()}
              className="h-8 rounded-md bg-zinc-700 px-3 text-xs font-medium text-zinc-200 hover:bg-zinc-600 disabled:opacity-50 transition-colors"
            >
              Apply
            </button>
          </div>

          {!confirmBulkDelete ? (
            <button
              type="button"
              onClick={() => setConfirmBulkDelete(true)}
              className="h-8 rounded-md border border-red-800 px-3 text-xs font-medium text-red-400 hover:bg-red-950 transition-colors"
            >
              Delete selected
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">
                Delete {selectedIds.size} items permanently?
              </span>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="h-8 rounded-md bg-red-700 px-3 text-xs font-medium text-white hover:bg-red-600 transition-colors"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmBulkDelete(false)}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>
          )}

          {bulkActionError && <p className="text-xs text-red-400">{bulkActionError}</p>}
        </div>
      )}

      {/* Select all */}
      {data.items.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {selectedIds.size === data.items.length ? 'Deselect all' : 'Select all on page'}
          </button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
        </div>
      ) : (
        <MediaGrid
          items={data.items}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onOpenDetail={setDetailItem}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, currentPage - 1) }))}
            disabled={currentPage <= 1}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-40 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm text-zinc-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() =>
              setFilters((f) => ({ ...f, page: Math.min(totalPages, currentPage + 1) }))
            }
            disabled={currentPage >= totalPages}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-40 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* Detail modal */}
      {detailItem && (
        <MediaDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onAltTextSaved={handleAltTextSaved}
          onDelete={handleDeleted}
        />
      )}
    </div>
  );
}
