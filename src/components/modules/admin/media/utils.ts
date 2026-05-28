/**
 * Utility helpers for the media admin UI.
 */

import type { MediaBucket, MediaItem, MediaVariantKey, MediaVariants } from '@/@types/media';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

/**
 * Build the public URL for a storage path.
 */
export function buildPublicUrl(bucket: MediaBucket, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Get the best thumbnail URL for a media item.
 * Prefers the 'thumb' variant, falls back to 'sm', then the original.
 */
export function getThumbnailUrl(item: MediaItem): string {
  const variants = item.variants as MediaVariants;
  const preferred: MediaVariantKey[] = ['thumb', 'sm', 'md'];

  for (const key of preferred) {
    const variantPath = variants[key];
    if (variantPath) {
      return buildPublicUrl(item.bucket, variantPath);
    }
  }

  return buildPublicUrl(item.bucket, item.path);
}

/**
 * Get the URL for a specific variant, falling back to the original.
 */
export function getVariantUrl(item: MediaItem, variant: MediaVariantKey): string {
  const variants = item.variants as MediaVariants;
  const variantPath = variants[variant];
  if (variantPath) {
    return buildPublicUrl(item.bucket, variantPath);
  }
  return buildPublicUrl(item.bucket, item.path);
}

/**
 * Format file size in human-readable form.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Format a date string for display.
 */
export function formatUploadDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get a human-readable bucket label.
 */
export function getBucketLabel(bucket: MediaBucket): string {
  const labels: Record<MediaBucket, string> = {
    'article-covers': 'Article Covers',
    'article-content': 'Article Content',
    'author-avatars': 'Author Avatars',
  };
  return labels[bucket] ?? bucket;
}
