/**
 * Storage library barrel.
 *
 * Server-side upload and optimization:
 *   import { uploadMedia, validateFile, deleteMedia } from '@/lib/storage/upload'
 *   import { generateVariants } from '@/lib/storage/optimize'
 *
 * Client-safe media queries:
 *   import { fetchMediaList, fetchMediaById } from '@/lib/storage/media.service'
 *
 * Constants:
 *   import { BUCKET_SIZE_LIMITS, ALLOWED_MIME_TYPES } from '@/lib/storage/constants'
 */

export { uploadMedia, validateFile, deleteMedia, getPublicUrl, computeSha256 } from './upload';
export { generateVariants, getImageDimensions } from './optimize';
export {
  fetchMediaList,
  fetchMediaById,
  fetchMediaArticleRefs,
  updateAltText,
  updateStellarTxHash,
  recalculateUsageCounts,
  fetchOrphanedMedia,
} from './media.service';
export {
  BUCKET_SIZE_LIMITS,
  ALLOWED_MIME_TYPES,
  VARIANT_SPECS,
  MEDIA_DEFAULT_PAGE_SIZE,
} from './constants';
