'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { MediaItem } from '@/@types/media';
import { getThumbnailUrl, formatFileSize, formatUploadDate, getBucketLabel } from './utils';

interface OrphanViewerProps {
  initialItems: MediaItem[];
}

export function OrphanViewer({ initialItems }: OrphanViewerProps) {
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);

  async function handleScan() {
    setScanning(true);
    setError(null);
    setScanResult(null);
    try {
      const res = await fetch('/api/media/orphans', { method: 'POST' });
      if (!res.ok) throw new Error('Scan failed');
      const data = await res.json();
      setItems(data.items ?? []);
      setScanResult(`Scan complete. Found ${data.orphanCount} orphaned file${data.orphanCount !== 1 ? 's' : ''}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    setError(null);
    const ids = Array.from(selectedIds);

    for (const id of ids) {
      try {
        const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setItems((prev) => prev.filter((i) => i.id !== id));
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
      } catch {
        // Continue
      }
    }

    setConfirmDelete(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Orphaned Media</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {items.length} file{items.length !== 1 ? 's' : ''} not referenced by any article
          </p>
        </div>
        <button
          type="button"
          onClick={handleScan}
          disabled={scanning}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-50 transition-colors"
        >
          {scanning ? 'Scanning…' : 'Rescan'}
        </button>
      </div>

      {scanResult && (
        <p className="rounded-lg border border-green-800 bg-green-950/30 px-4 py-2 text-sm text-green-400">
          {scanResult}
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-800 bg-red-950/30 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="rounded-lg border border-amber-800 bg-amber-950/20 px-4 py-3 text-sm text-amber-400">
        ⚠ These images are not referenced in any article. Review before deleting — they may be
        recently uploaded or used in drafts. Deletion is permanent.
      </div>

      {/* Bulk delete */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3">
          <span className="text-sm text-zinc-300">{selectedIds.size} selected</span>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded-md border border-red-800 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-950 transition-colors"
            >
              Delete selected
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">
                Permanently delete {selectedIds.size} files?
              </span>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <p className="text-lg">No orphaned media found</p>
          <p className="text-sm mt-1">All uploaded images are referenced in articles</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-4 rounded-lg border p-3 transition-colors ${
                selectedIds.has(item.id)
                  ? 'border-red-800 bg-red-950/20'
                  : 'border-zinc-800 bg-zinc-900'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(item.id)}
                onChange={() => toggleSelect(item.id)}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-red-500"
                aria-label={`Select ${item.originalName}`}
              />

              <div className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-md bg-zinc-800">
                <Image
                  src={getThumbnailUrl(item)}
                  alt={item.altText ?? item.originalName}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>

              <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                <p className="truncate text-sm font-medium text-zinc-200">{item.originalName}</p>
                <p className="text-xs text-zinc-500">
                  {getBucketLabel(item.bucket)} · {formatFileSize(item.sizeBytes)} ·{' '}
                  {formatUploadDate(item.createdAt)}
                </p>
                <p className="text-xs text-zinc-600">Uploaded by {item.uploadedBy}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
