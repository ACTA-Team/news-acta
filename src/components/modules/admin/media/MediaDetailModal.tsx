'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { MediaArticleRef, MediaItem, MediaVariantKey } from '@/@types/media';
import { buildPublicUrl, formatFileSize, formatUploadDate, getBucketLabel, getVariantUrl } from './utils';

interface MediaDetailModalProps {
  item: MediaItem;
  onClose: () => void;
  onAltTextSaved: (id: string, altText: string) => void;
  onDelete: (id: string) => void;
}

const VARIANT_LABELS: Record<MediaVariantKey, string> = {
  thumb: 'Thumb (200px)',
  sm: 'Small (640px)',
  md: 'Medium (1024px)',
  lg: 'Large (1920px)',
  og: 'OG (1200×630)',
};

export function MediaDetailModal({ item, onClose, onAltTextSaved, onDelete }: MediaDetailModalProps) {
  const [altText, setAltText] = useState(item.altText ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [articles, setArticles] = useState<MediaArticleRef[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Fetch article references
  useEffect(() => {
    setLoadingArticles(true);
    fetch(`/api/media/${item.id}/articles`)
      .then((r) => r.json())
      .then((data) => setArticles(data.items ?? []))
      .catch(() => setArticles([]))
      .finally(() => setLoadingArticles(false));
  }, [item.id]);

  // Trap focus in dialog
  useEffect(() => {
    dialogRef.current?.showModal();
    return () => dialogRef.current?.close();
  }, []);

  async function handleSaveAltText() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/media/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ altText }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Save failed');
      }
      onAltTextSaved(item.id, altText);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/media/${item.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Delete failed');
      }
      onDelete(item.id);
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  const originalUrl = buildPublicUrl(item.bucket, item.path);
  const isSvg = item.mimeType === 'image/svg+xml';

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-50 m-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-0 shadow-2xl backdrop:bg-black/60"
    >
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <h2 className="text-base font-semibold text-zinc-100 truncate max-w-md" title={item.originalName}>
          {item.originalName}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-zinc-400 hover:text-zinc-100 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
        {/* Preview */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-800">
            {isSvg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={originalUrl}
                alt={item.altText ?? item.originalName}
                className="h-full w-full object-contain p-4"
              />
            ) : (
              <Image
                src={getVariantUrl(item, 'md')}
                alt={item.altText ?? item.originalName}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            )}
          </div>

          {/* Stellar badge */}
          {item.stellarTxHash && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-800 bg-blue-950/30 px-3 py-2">
              <span className="text-blue-400 text-sm">✓ Anchored on Stellar</span>
              <a
                href={`https://stellar.expert/explorer/${process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet' || process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'public' ? 'public' : 'testnet'}/tx/${item.stellarTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-xs text-blue-500 underline hover:text-blue-300"
              >
                View tx
              </a>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-col gap-4">
          {/* File info */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              File Info
            </h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-zinc-500">Bucket</dt>
              <dd className="text-zinc-200">{getBucketLabel(item.bucket)}</dd>

              <dt className="text-zinc-500">Size</dt>
              <dd className="text-zinc-200">{formatFileSize(item.sizeBytes)}</dd>

              {item.width && item.height && (
                <>
                  <dt className="text-zinc-500">Dimensions</dt>
                  <dd className="text-zinc-200">{item.width} × {item.height}px</dd>
                </>
              )}

              <dt className="text-zinc-500">Type</dt>
              <dd className="text-zinc-200">{item.mimeType}</dd>

              <dt className="text-zinc-500">Uploaded</dt>
              <dd className="text-zinc-200">{formatUploadDate(item.createdAt)}</dd>

              <dt className="text-zinc-500">By</dt>
              <dd className="truncate text-zinc-200">{item.uploadedBy}</dd>

              <dt className="text-zinc-500">Usage</dt>
              <dd className={item.usageCount > 0 ? 'text-green-400' : 'text-zinc-500'}>
                {item.usageCount} article{item.usageCount !== 1 ? 's' : ''}
              </dd>
            </dl>
          </div>

          {/* Alt text */}
          <div className="flex flex-col gap-2">
            <label htmlFor="alt-text" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Alt Text
            </label>
            <textarea
              id="alt-text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              rows={2}
              placeholder="Describe this image for screen readers…"
              className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none resize-none"
            />
            {saveError && <p className="text-xs text-red-400">{saveError}</p>}
            <button
              type="button"
              onClick={handleSaveAltText}
              disabled={saving}
              className="self-end rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save alt text'}
            </button>
          </div>

          {/* Variants */}
          {Object.keys(item.variants).length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Variants
              </h3>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(item.variants) as MediaVariantKey[]).map((key) => (
                  <a
                    key={key}
                    href={getVariantUrl(item, key)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
                  >
                    {VARIANT_LABELS[key] ?? key}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Articles using this image */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Used in Articles
            </h3>
            {loadingArticles ? (
              <p className="text-xs text-zinc-600">Loading…</p>
            ) : articles.length === 0 ? (
              <p className="text-xs text-zinc-600">Not used in any articles</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {articles.map((article) => (
                  <li key={article.id}>
                    <a
                      href={`/news/${article.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                      {article.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Delete */}
      <div className="border-t border-zinc-800 px-6 py-4">
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="text-sm text-red-500 hover:text-red-400 transition-colors"
          >
            Delete this image
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm text-red-400">
              This will permanently delete the image and all its variants. Are you sure?
            </p>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors"
            >
              Yes, delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}
