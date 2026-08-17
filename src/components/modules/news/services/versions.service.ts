/**
 * Version read service for the public `news` module.
 *
 * Fetches `article_versions` for published articles only (RLS enforced).
 * Only the service layer is allowed to query Supabase: UI never queries directly.
 */

import type {
  ArticleVersion,
  ArticleVersionDiffSummary,
  ArticleVersionListItem,
} from '@/@types/news';
import type { Database, Json, TypedSupabaseClient } from '@/lib/supabase';
import {
  isMissingSchemaCacheError,
  warnMissingMigrationsOnce,
} from '@/lib/supabase/postgrestError';

type VersionRow = Database['public']['Tables']['article_versions']['Row'];

function mapDiffSummary(raw: Json | null): ArticleVersionDiffSummary | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, Json>;
  return {
    fieldsChanged: Array.isArray(r.fieldsChanged) ? (r.fieldsChanged as string[]) : [],
    contentAdded: typeof r.contentAdded === 'number' ? r.contentAdded : 0,
    contentRemoved: typeof r.contentRemoved === 'number' ? r.contentRemoved : 0,
    sectionsModified: typeof r.sectionsModified === 'number' ? r.sectionsModified : 0,
  };
}

function mapVersionRow(row: VersionRow): ArticleVersion {
  return {
    id: row.id,
    articleId: row.article_id,
    versionNumber: row.version_number,
    title: row.title,
    summary: row.summary,
    content: row.content,
    category: row.category,
    diffSummary: mapDiffSummary(row.diff_summary),
    editedBy: row.edited_by,
    contentHash: row.content_hash,
    previousHash: row.previous_hash,
    stellarTxHash: row.stellar_tx_hash,
    createdAt: row.created_at,
  };
}

function mapVersionListItem(row: VersionRow): ArticleVersionListItem {
  return {
    id: row.id,
    articleId: row.article_id,
    versionNumber: row.version_number,
    title: row.title,
    category: row.category,
    diffSummary: mapDiffSummary(row.diff_summary),
    editedBy: row.edited_by,
    contentHash: row.content_hash,
    previousHash: row.previous_hash,
    stellarTxHash: row.stellar_tx_hash,
    createdAt: row.created_at,
  };
}

const VERSION_LIST_SELECT = `
  id,
  article_id,
  version_number,
  title,
  category,
  diff_summary,
  edited_by,
  content_hash,
  previous_hash,
  stellar_tx_hash,
  created_at
` as const;

const VERSION_FULL_SELECT = `
  id,
  article_id,
  version_number,
  title,
  summary,
  content,
  category,
  diff_summary,
  edited_by,
  content_hash,
  previous_hash,
  stellar_tx_hash,
  created_at
` as const;

/**
 * Fetch all version list items for an article (public: RLS filters to published).
 */
export async function fetchArticleVersions(
  supabase: TypedSupabaseClient,
  articleId: string
): Promise<ArticleVersionListItem[]> {
  const { data, error } = await supabase
    .from('article_versions')
    .select(VERSION_LIST_SELECT)
    .eq('article_id', articleId)
    .order('version_number', { ascending: false });

  if (error) {
    if (isMissingSchemaCacheError(error)) {
      warnMissingMigrationsOnce();
      return [];
    }
    throw error;
  }

  return (data ?? []).map((row) => mapVersionListItem(row as unknown as VersionRow));
}

/**
 * Fetch a single full version by article + version number (public: RLS applies).
 */
export async function fetchArticleVersionByNumber(
  supabase: TypedSupabaseClient,
  articleId: string,
  versionNumber: number
): Promise<ArticleVersion | null> {
  const { data, error } = await supabase
    .from('article_versions')
    .select(VERSION_FULL_SELECT)
    .eq('article_id', articleId)
    .eq('version_number', versionNumber)
    .maybeSingle();

  if (error) {
    if (isMissingSchemaCacheError(error)) {
      warnMissingMigrationsOnce();
      return null;
    }
    throw error;
  }

  if (!data) return null;
  return mapVersionRow(data as unknown as VersionRow);
}
