'use client';

import Image from 'next/image';
import type { MediaItem } from '@/@types/media';
import { getThumbnailUrl, formatFileSize, formatUploadDate, getBucketLabel } from './utils';

interface MediaGridProps {
  items: MediaItem[];
  selectedIds: Set<string>;
  onSelect: (id: string, checked: boolean) => void;
  onOpenDetail: (item: MediaItem) => void;
}

export function MediaGrid({ items, selectedIds, onSelect, onOpenDetail }: MediaGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <p className="text-lg">No media found</p>
        <p className="text-sm mt-1">Upload images to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((item) => (
        <MediaGridItem
          key={item.id}
          item={item}
          selected={selectedIds.has(item.id)}
          onSelect={onSelect}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </div>
  );
}

interface MediaGridItemProps {
  item: MediaItem;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onOpenDetail: (item: MediaItem) => void;
}

function MediaGridItem({ item, selected, onSelect, onOpenDetail }: MediaGridItemProps) {
  const thumbnailUrl = getThumbnailUrl(item);
  const isSvg = item.mimeType === 'image/svg+xml';

  return (
    <div
      className={`group relative flex flex-col rounded-lg border transition-colors cursor-pointer ${
        selected
          ? 'border-blue-500 bg-blue-950/20'
          : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
      }`}
    >
      {/* Selection checkbox */}
      <div className="absolute left-2 top-2 z-10">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(item.id, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-blue-500"
          aria-label={`Select ${item.originalName}`}
        />
      </div>

      {/* Stellar badge */}
      {item.stellarTxHash && (
        <div
          className="absolute right-2 top-2 z-10 rounded-full bg-blue-600 px-1.5 py-0.5 text-xs font-medium text-white"
          title="Anchored on Stellar"
        >
          ✓
        </div>
      )}

      {/* Thumbnail */}
      <button
        type="button"
        className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-zinc-800"
        onClick={() => onOpenDetail(item)}
        aria-label={`View details for ${item.originalName}`}
      >
        {isSvg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={item.altText ?? item.originalName}
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <Image
            src={thumbnailUrl}
            alt={item.altText ?? item.originalName}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="200px"
            unoptimized={false}
          />
        )}
      </button>

      {/* Metadata */}
      <div className="flex flex-col gap-1 p-2">
        <p className="truncate text-xs font-medium text-zinc-200" title={item.originalName}>
          {item.originalName}
        </p>
        <p className="text-xs text-zinc-500">
          {item.width && item.height ? `${item.width}×${item.height} · ` : ''}
          {formatFileSize(item.sizeBytes)}
        </p>
        <p className="text-xs text-zinc-600">{formatUploadDate(item.createdAt)}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-600">{getBucketLabel(item.bucket)}</span>
          <span
            className={`text-xs font-medium ${
              item.usageCount > 0 ? 'text-green-500' : 'text-zinc-600'
            }`}
          >
            {item.usageCount} use{item.usageCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
