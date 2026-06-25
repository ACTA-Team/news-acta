/**
 * Media library service — reads media records from the database.
 *
 * Works with both browser and server Supabase clients.
 */

import type { TypedSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/lib/supabase/database.types';
import type {
  MediaArticleRef,
  MediaBucket,
  MediaItem,
  MediaListFilters,
  MediaListResponse,
  MediaVariants,
} from '@/@types/media';
import { MEDIA_DEFAULT_PAGE_SIZE } from './constants';

type MediaRow = Database['public']['Tables']['media_library']['Row'];

function mapRow(row: MediaRow): MediaItem {
  return {
    id: row.id,
    bucket: row.bucket as MediaBucket,
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

/**
 * Fetch a paginated, filtered list of media items.
 */
export async function fetchMediaList(
  supabase: TypedSupabaseClient,
  filters: MediaListFilters = {}
): Promise<MediaListResponse> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? MEDIA_DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('media_library')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.bucket) {
    query = query.eq('bucket', filters.bucket);
  }

  if (filters.search) {
    query = query.ilike('original_name', `%${filters.search}%`);
  }

  if (filters.usage === 'used') {
    query = query.gt('usage_count', 0);
  } else if (filters.usage === 'unused') {
    query = query.eq('usage_count', 0);
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    items: (data ?? []).map(mapRow),
    total: count ?? 0,
    page,
    pageSize,
  };
}

/**
 * Fetch a single media item by ID.
 */
export async function fetchMediaById(
  supabase: TypedSupabaseClient,
  id: string
): Promise<MediaItem | null> {
  const { data, error } = await supabase
    .from('media_library')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapRow(data as MediaRow);
}

/**
 * Fetch articles that reference a given media item.
 * Searches both cover_image_url and content fields.
 */
export async function fetchMediaArticleRefs(
  supabase: TypedSupabaseClient,
  mediaItem: MediaItem
): Promise<MediaArticleRef[]> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('id, slug, title')
    .or(`cover_image_url.ilike.%${mediaItem.path}%,content.ilike.%${mediaItem.path}%`);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
  }));
}

/**
 * Update alt text for a media item.
 */
export async function updateAltText(
  supabase: TypedSupabaseClient,
  id: string,
  altText: string
): Promise<void> {
  const { error } = await supabase
    .from('media_library')
    .update({ alt_text: altText })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Update the Stellar transaction hash after anchoring.
 */
export async function updateStellarTxHash(
  supabase: TypedSupabaseClient,
  id: string,
  txHash: string
): Promise<void> {
  const { error } = await supabase
    .from('media_library')
    .update({ stellar_tx_hash: txHash })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Recalculate usage_count for all media items.
 * Scans news_articles content and cover_image_url for storage paths.
 */
export async function recalculateUsageCounts(supabase: TypedSupabaseClient): Promise<void> {
  // Fetch all media items
  const { data: mediaItems, error: mediaError } = await supabase
    .from('media_library')
    .select('id, path');

  if (mediaError) throw mediaError;

  // Fetch all articles
  const { data: articles, error: articlesError } = await supabase
    .from('news_articles')
    .select('cover_image_url, content');

  if (articlesError) throw articlesError;

  const allText = (articles ?? [])
    .map((a) => `${a.cover_image_url ?? ''} ${a.content}`)
    .join(' ');

  // Update each media item's usage count
  for (const item of mediaItems ?? []) {
    const count = countOccurrences(allText, item.path);
    const { error: updateError } = await supabase
      .from('media_library')
      .update({ usage_count: count })
      .eq('id', item.id);
    if (updateError) {
      throw new Error(`Failed to update usage_count for ${item.id}: ${updateError.message}`);
    }
  }
}

function countOccurrences(text: string, substring: string): number {
  if (!substring) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = text.indexOf(substring, pos)) !== -1) {
    count++;
    pos += substring.length;
  }
  return count;
}

/**
 * Fetch all orphaned media items (usage_count = 0).
 */
export async function fetchOrphanedMedia(
  supabase: TypedSupabaseClient
): Promise<MediaItem[]> {
  const { data, error } = await supabase
    .from('media_library')
    .select('*')
    .eq('usage_count', 0)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(mapRow);
}
