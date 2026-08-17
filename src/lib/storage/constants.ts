import type { AllowedMimeType, MediaBucket, VariantSpec } from '@/@types/media';

/** Maximum file sizes per bucket (bytes). */
export const BUCKET_SIZE_LIMITS: Record<MediaBucket, number> = {
  'article-covers': 10 * 1024 * 1024, // 10 MiB
  'article-content': 10 * 1024 * 1024, // 10 MiB
  'author-avatars': 5 * 1024 * 1024, // 5 MiB
};

/** Allowed MIME types for all buckets. */
export const ALLOWED_MIME_TYPES: AllowedMimeType[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

/** Variant specs: width (and optional height) for each named size. */
export const VARIANT_SPECS: VariantSpec[] = [
  { key: 'thumb', width: 200 },
  { key: 'sm', width: 640 },
  { key: 'md', width: 1024 },
  { key: 'lg', width: 1920 },
  { key: 'og', width: 1200, height: 630, fit: 'cover' },
];

/** Default page size for media library queries. */
export const MEDIA_DEFAULT_PAGE_SIZE = 24;
