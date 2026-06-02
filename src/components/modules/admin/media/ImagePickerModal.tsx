'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { MediaBucket, MediaItem, MediaListFilters, MediaListResponse, MediaVariantKey } from '@/@types/media';
import { getThumbnailUrl, getVariantUrl, formatFileSize } from './utils';
import { UploadZone } from './UploadZone';

interface ImagePickerModalProps {
  /** Which bucket to default to when uploading. */
  defaultBucket?: MediaBucket;
  /** Which variant URL to return on selection. */
  preferVariant?: MediaVariantKey;
  onSelect: (item: MediaItem, url: string) => void;
  onClose: () => void;
}

type Tab = 'library' | 'upload';

export function ImagePickerModal({
  defaultBucket = 'article-content',
  preferVariant = 'md',
  onSelect,
  onClose,
}: ImagePickerModalProps) {
  const [tab, setTab] = useState<Tab>('library');
  const [data, setData] = useState<MediaListResponse | null>(null);
  const [filters, setFilters] = useState<MediaListFilters>({ page: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
    return () => dialogRef.current?.close();
  }, []);

  useEffect(() => {
    fetchMedia(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function fetchMedia(f: MediaListFilters) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.search) params.set('search', f.search);
      if (f.page) params.set('page', String(f.page));
      params.set('pageSize', '20');

      const res = await fetch(`/api/media?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const result: MediaListResponse = await res.json();
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFilters({ page: 1, search: search || undefined });
  }

  function handleSelect(item: MediaItem) {
    const url = getVariantUrl(item, preferVariant);
    onSelect(item, url);
    onClose();
  }

  function handleUploaded(item: MediaItem) {
    const url = getVariantUrl(item, preferVariant);
    onSelect(item, url);
    onClose();
  }

  const totalPages = data ? Math.ceil(data.total / 20) : 0;
  const currentPage = filters.page ?? 1;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-50 m-auto max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 p-0 shadow-2xl backdrop:bg-black/60"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <h2 className="text-base font-semibold text-zinc-100">Insert Image</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-zinc-400 hover:text-zinc-100 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        {(['library', 'upload'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 120px)' }}>
        {tab === 'library' && (
          <div className="flex flex-col gap-4 p-5">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="search"
                placeholder="Search by filename…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
              />
              <button
                type="submit"
                className="h-9 rounded-md bg-zinc-700 px-3 text-sm text-zinc-200 hover:bg-zinc-600 transition-colors"
              >
                Search
              </button>
            </form>

            {/* Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
              </div>
            ) : !data || data.items.length === 0 ? (
              <div className="py-12 text-center text-sm text-zinc-500">
                No images found. Upload one in the Upload tab.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {data.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="group flex flex-col gap-1 rounded-lg border border-zinc-700 bg-zinc-800 p-1.5 text-left hover:border-blue-500 transition-colors"
                    >
                      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-zinc-700">
                        <Image
                          src={getThumbnailUrl(item)}
                          alt={item.altText ?? item.originalName}
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                      </div>
                      <p className="truncate text-xs text-zinc-400 group-hover:text-zinc-200">
                        {item.originalName}
                      </p>
                      <p className="text-xs text-zinc-600">{formatFileSize(item.sizeBytes)}</p>
                    </button>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, currentPage - 1) }))}
                      disabled={currentPage <= 1}
                      className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:border-zinc-500 disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    <span className="text-xs text-zinc-500">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFilters((f) => ({ ...f, page: Math.min(totalPages, currentPage + 1) }))}
                      disabled={currentPage >= totalPages}
                      className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:border-zinc-500 disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'upload' && (
          <div className="p-5">
            <UploadZone
              bucket={defaultBucket}
              onUploaded={handleUploaded}
            />
          </div>
        )}
      </div>
    </dialog>
  );
}
