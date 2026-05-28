/**
 * Media domain types.
 *
 * Mirrors the `media_library` table in the database.
 * All image upload, variant, and Stellar anchoring types live here.
 */

/** The three managed Storage buckets. */
export type MediaBucket = 'article-covers' | 'article-content' | 'author-avatars';

/** Allowed MIME types for uploads. */
export type AllowedMimeType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/gif'
  | 'image/svg+xml';

/** Named size variants generated on upload. */
export type MediaVariantKey = 'thumb' | 'sm' | 'md' | 'lg' | 'og';

/** Paths to each generated variant stored in the `variants` jsonb column. */
export type MediaVariants = Partial<Record<MediaVariantKey, string>>;

/** Full media record as returned from the database. */
export interface MediaItem {
  id: string;
  bucket: MediaBucket;
  path: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  variants: MediaVariants;
  contentHash: string | null;
  stellarTxHash: string | null;
  uploadedBy: string;
  usageCount: number;
  createdAt: string;
}

/** Payload sent to the upload API route. */
export interface UploadPayload {
  bucket: MediaBucket;
  /** Whether to compute SHA-256 and anchor on Stellar. */
  anchorOnStellar?: boolean;
}

/** Response from the upload API route. */
export interface UploadResponse {
  media: MediaItem;
  /** Public URL of the original file. */
  publicUrl: string;
}

/** Filters for the media library admin query. */
export interface MediaListFilters {
  bucket?: MediaBucket;
  search?: string;
  /** 'used' = usage_count > 0, 'unused' = usage_count = 0 */
  usage?: 'used' | 'unused';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface MediaListResponse {
  items: MediaItem[];
  total: number;
  page: number;
  pageSize: number;
}

/** Payload for updating alt text on a media item. */
export interface UpdateAltTextPayload {
  id: string;
  altText: string;
}

/** Variant spec used by the optimization pipeline. */
export interface VariantSpec {
  key: MediaVariantKey;
  width: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

/** Result of the image optimization pipeline for a single variant. */
export interface ProcessedVariant {
  key: MediaVariantKey;
  buffer: Buffer;
  width: number;
  height: number;
  sizeBytes: number;
}

/** Article reference used in the media detail modal. */
export interface MediaArticleRef {
  id: string;
  slug: string;
  title: string;
}
