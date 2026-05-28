/**
 * Upload service — server-side only.
 *
 * Validates, processes, uploads to Supabase Storage, and records
 * metadata in the media_library table.
 *
 * Uses the service-role client so it can bypass RLS for the insert.
 */

import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import type { Database } from '@/lib/supabase/database.types';
import type {
  AllowedMimeType,
  MediaBucket,
  MediaItem,
  MediaVariants,
  UploadResponse,
} from '@/@types/media';
import { ALLOWED_MIME_TYPES, BUCKET_SIZE_LIMITS } from './constants';
import { generateVariants, getImageDimensions } from './optimize';

/** Extension map for MIME types. */
const MIME_TO_EXT: Record<AllowedMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Validate file type and size before processing.
 */
export function validateFile(
  mimeType: string,
  sizeBytes: number,
  bucket: MediaBucket
): { valid: true } | { valid: false; error: string } {
  if (!ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)) {
    return {
      valid: false,
      error: `File type "${mimeType}" is not allowed. Accepted: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  const limit = BUCKET_SIZE_LIMITS[bucket];
  if (sizeBytes > limit) {
    const limitMb = (limit / 1024 / 1024).toFixed(0);
    return {
      valid: false,
      error: `File size ${(sizeBytes / 1024 / 1024).toFixed(1)} MiB exceeds the ${limitMb} MiB limit for bucket "${bucket}"`,
    };
  }

  return { valid: true };
}

/**
 * Generate a unique storage path: {year}/{month}/{uuid}.{ext}
 */
function generatePath(mimeType: AllowedMimeType): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const uuid = randomUUID();
  const ext = MIME_TO_EXT[mimeType];
  return `${year}/${month}/${uuid}.${ext}`;
}

/**
 * Compute SHA-256 hash of a buffer.
 */
export function computeSha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Full upload pipeline:
 * 1. Validate
 * 2. Compute hash
 * 3. Get original dimensions
 * 4. Generate variants
 * 5. Upload original + variants to Storage
 * 6. Insert media_library record
 * 7. Return MediaItem + public URL
 */
export async function uploadMedia(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  bucket: MediaBucket,
  uploadedBy: string,
  anchorOnStellar = false
): Promise<UploadResponse> {
  // 1. Validate
  const validation = validateFile(mimeType, fileBuffer.byteLength, bucket);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const supabase = getServiceClient();
  const typedMime = mimeType as AllowedMimeType;

  // 2. Compute SHA-256 hash
  const contentHash = computeSha256(fileBuffer);

  // 3. Get original dimensions
  const { width, height } = await getImageDimensions(fileBuffer, mimeType);

  // 4. Generate variants
  const variants = await generateVariants(fileBuffer, mimeType);

  // 5. Upload original to Storage
  const originalPath = generatePath(typedMime);
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(originalPath, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload original: ${uploadError.message}`);
  }

  // 5b. Upload each variant
  const variantPaths: MediaVariants = {};

  for (const variant of variants) {
    const variantPath = originalPath.replace(/\.[^.]+$/, `-${variant.key}.webp`);

    const { error: variantError } = await supabase.storage
      .from(bucket)
      .upload(variantPath, variant.buffer, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (variantError) {
      // Non-fatal: log and continue
      console.error(`Failed to upload variant ${variant.key}:`, variantError.message);
    } else {
      variantPaths[variant.key] = variantPath;
    }
  }

  // 6. Insert media_library record
  const { data: record, error: insertError } = await supabase
    .from('media_library')
    .insert({
      bucket,
      path: originalPath,
      original_name: originalName,
      mime_type: mimeType,
      size_bytes: fileBuffer.byteLength,
      width: width || null,
      height: height || null,
      variants: variantPaths,
      content_hash: contentHash,
      uploaded_by: uploadedBy,
    })
    .select()
    .single();

  if (insertError || !record) {
    throw new Error(`Failed to record media metadata: ${insertError?.message}`);
  }

  // 7. Get public URL
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(originalPath);

  const mediaItem = mapRecord(record);

  // Optionally anchor on Stellar (fire-and-forget — caller handles this)
  if (anchorOnStellar) {
    // Stellar anchoring is handled by the API route after this function returns
    // so the upload doesn't block on the Stellar transaction.
  }

  return {
    media: mediaItem,
    publicUrl: urlData.publicUrl,
  };
}

/**
 * Get the public URL for a storage path.
 */
export function getPublicUrl(bucket: MediaBucket, path: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  return `${url}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Delete a media item from Storage and the database.
 */
export async function deleteMedia(id: string): Promise<void> {
  const supabase = getServiceClient();

  // Fetch the record first
  const { data: record, error: fetchError } = await supabase
    .from('media_library')
    .select('bucket, path, variants')
    .eq('id', id)
    .single();

  if (fetchError || !record) {
    throw new Error(`Media item not found: ${fetchError?.message}`);
  }

  const bucket = record.bucket as MediaBucket;
  const pathsToDelete: string[] = [record.path];

  // Collect variant paths
  const variants = record.variants as MediaVariants;
  if (variants) {
    for (const variantPath of Object.values(variants)) {
      if (variantPath) pathsToDelete.push(variantPath);
    }
  }

  // Delete from Storage
  const { error: storageError } = await supabase.storage.from(bucket).remove(pathsToDelete);
  if (storageError) {
    throw new Error(`Failed to delete from storage: ${storageError.message}`);
  }

  // Delete from database
  const { error: dbError } = await supabase.from('media_library').delete().eq('id', id);
  if (dbError) {
    throw new Error(`Failed to delete media record: ${dbError.message}`);
  }
}

/** Map a DB row to a MediaItem. */
function mapRecord(row: Database['public']['Tables']['media_library']['Row']): MediaItem {
  return {
    id: row.id,
    bucket: row.bucket as MediaItem['bucket'],
    path: row.path,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    width: row.width,
    height: row.height,
    altText: row.alt_text,
    variants: (row.variants as MediaVariants) ?? {},
    contentHash: row.content_hash,
    stellarTxHash: row.stellar_tx_hash,
    uploadedBy: row.uploaded_by,
    usageCount: row.usage_count,
    createdAt: row.created_at,
  };
}
