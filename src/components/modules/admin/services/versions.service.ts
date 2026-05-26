/**
 * Admin version read service.
 *
 * Uses the server client (authenticated session) so admin RLS policies
 * allow reading versions of draft articles too.
 */

import type { ArticleVersion, ArticleVersionDiffSummary, ArticleVersionListItem } from '@/@types/news';
import type { Database, Json, TypedSupabaseClient } from '@/lib/supabase';

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

/** Fetch all version list items for an article (admin — can see draft article versions). */
export async function fetchAdminArticleVersions(
  supabase: TypedSupabaseClient,
  articleId: string,
): Promise<ArticleVersionListItem[]> {
  const { data, error } = await supabase
    .from('article_versions')
    .select(
      `id, article_id, version_number, title, category, diff_summary,
       edited_by, content_hash, previous_hash, stellar_tx_hash, created_at`,
    )
    .eq('article_id', articleId)
    .order('version_number', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapVersionListItem(row as unknown as VersionRow));
}

/** Fetch a single full version by article + version number (admin). */
export async function fetchAdminArticleVersionByNumber(
  supabase: TypedSupabaseClient,
  articleId: string,
  versionNumber: number,
): Promise<ArticleVersion | null> {
  const { data, error } = await supabase
    .from('article_versions')
    .select(
      `id, article_id, version_number, title, summary, content, category,
       diff_summary, edited_by, content_hash, previous_hash, stellar_tx_hash, created_at`,
    )
    .eq('article_id', articleId)
    .eq('version_number', versionNumber)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapVersionRow(data as unknown as VersionRow);
}
