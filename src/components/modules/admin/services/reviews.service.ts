/**
 * Review queue.
 *
 * `article_reviews` is an append-only event log (see the RLS block in
 * `0006_editorial_workflow.sql`): requesting a review appends a `requested`
 * row, approving appends an `approved` row, asking for changes appends a
 * `changes_requested` row. Nothing is ever updated or deleted, so the full
 * thread stays readable and the table needs no UPDATE policy.
 *
 * A review is therefore *open* when the newest event for an article is
 * `requested`.
 */

import type { ArticleReviewEvent, OpenReviewItem, ReviewState } from '@/@types/editorial';
import type { ArticleVersionDiffSummary } from '@/@types/news';
import type { Json, TypedSupabaseClient } from '@/lib/supabase';

type ReviewRow = {
  id: string;
  article_id: string;
  version_number: number | null;
  state: ReviewState;
  requested_by: string;
  reviewer_email: string | null;
  comment: string | null;
  created_at: string;
  resolved_at: string | null;
};

const REVIEW_COLUMNS =
  'id, article_id, version_number, state, requested_by, reviewer_email, comment, created_at, resolved_at';

function mapEvent(row: ReviewRow): ArticleReviewEvent {
  return {
    id: row.id,
    articleId: row.article_id,
    versionNumber: row.version_number,
    state: row.state,
    requestedBy: row.requested_by,
    reviewerEmail: row.reviewer_email,
    comment: row.comment,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

function mapDiffSummary(raw: Json | null | undefined): ArticleVersionDiffSummary | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, Json>;
  return {
    fieldsChanged: Array.isArray(r.fieldsChanged) ? (r.fieldsChanged as string[]) : [],
    contentAdded: typeof r.contentAdded === 'number' ? r.contentAdded : 0,
    contentRemoved: typeof r.contentRemoved === 'number' ? r.contentRemoved : 0,
    sectionsModified: typeof r.sectionsModified === 'number' ? r.sectionsModified : 0,
  };
}

/** The version number a review should be pinned to: the article's latest snapshot. */
async function currentVersionNumber(
  supabase: TypedSupabaseClient,
  articleId: string
): Promise<number | null> {
  const { data } = await supabase
    .from('article_versions')
    .select('version_number')
    .eq('article_id', articleId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.version_number ?? null;
}

/**
 * Submit an article for review.
 *
 * Appends a `requested` event pinned to the article's current version number
 * and moves the article into `in_review`.
 */
export async function requestReview(
  supabase: TypedSupabaseClient,
  params: { articleId: string; actorEmail: string; comment?: string | null }
): Promise<void> {
  const { data: article, error: articleError } = await supabase
    .from('news_articles')
    .select('status')
    .eq('id', params.articleId)
    .maybeSingle();

  if (articleError) throw articleError;
  if (!article) throw new Error('Article not found.');

  if (article.status !== 'draft' && article.status !== 'in_review') {
    throw new Error(`Cannot request review for an article in "${article.status}".`);
  }

  const versionNumber = await currentVersionNumber(supabase, params.articleId);

  const { error: insertError } = await supabase.from('article_reviews').insert({
    article_id: params.articleId,
    version_number: versionNumber,
    state: 'requested',
    requested_by: params.actorEmail,
    comment: params.comment?.trim() || null,
  });

  if (insertError) throw insertError;

  if (article.status === 'draft') {
    const { error: statusError } = await supabase
      .from('news_articles')
      .update({ status: 'in_review' })
      .eq('id', params.articleId);

    if (statusError) throw statusError;
  }
}

/** Approve an open review. The article stays in `in_review` until an editor
 *  publishes or schedules it explicitly. */
export async function approve(
  supabase: TypedSupabaseClient,
  params: { articleId: string; actorEmail: string; comment?: string | null }
): Promise<void> {
  await appendResolution(supabase, { ...params, state: 'approved' });
}

/** Request changes: appends the event and sends the article back to `draft`. */
export async function requestChanges(
  supabase: TypedSupabaseClient,
  params: { articleId: string; actorEmail: string; comment?: string | null }
): Promise<void> {
  await appendResolution(supabase, { ...params, state: 'changes_requested' });

  const { data: article } = await supabase
    .from('news_articles')
    .select('status')
    .eq('id', params.articleId)
    .maybeSingle();

  if (article?.status === 'in_review') {
    const { error } = await supabase
      .from('news_articles')
      .update({ status: 'draft' })
      .eq('id', params.articleId);

    if (error) throw error;
  }
}

async function appendResolution(
  supabase: TypedSupabaseClient,
  params: {
    articleId: string;
    actorEmail: string;
    comment?: string | null;
    state: Exclude<ReviewState, 'requested'>;
  }
): Promise<void> {
  const versionNumber = await currentVersionNumber(supabase, params.articleId);

  const { error } = await supabase.from('article_reviews').insert({
    article_id: params.articleId,
    version_number: versionNumber,
    state: params.state,
    // `requested_by` records the actor on every event row; RLS checks it
    // against the caller's own email.
    requested_by: params.actorEmail,
    reviewer_email: params.actorEmail,
    comment: params.comment?.trim() || null,
    resolved_at: new Date().toISOString(),
  });

  if (error) throw error;
}

/** The full review thread for one article, oldest first. */
export async function listThread(
  supabase: TypedSupabaseClient,
  articleId: string
): Promise<ArticleReviewEvent[]> {
  const { data, error } = await supabase
    .from('article_reviews')
    .select(REVIEW_COLUMNS)
    .eq('article_id', articleId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return ((data ?? []) as unknown as ReviewRow[]).map(mapEvent);
}

/**
 * Every article whose newest review event is still `requested`.
 *
 * PostgREST has no `distinct on`, so the newest event per article is picked in
 * JS. The desk is small enough that fetching the ordered log is cheaper than a
 * view or an RPC, and it keeps the schema surface minimal.
 */
export async function listOpen(supabase: TypedSupabaseClient): Promise<OpenReviewItem[]> {
  const { data, error } = await supabase
    .from('article_reviews')
    .select(`${REVIEW_COLUMNS}, article:news_articles ( id, title, slug )`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  type JoinedRow = ReviewRow & { article: { id: string; title: string; slug: string } | null };
  const rows = (data ?? []) as unknown as JoinedRow[];

  const newestByArticle = new Map<string, JoinedRow>();
  for (const row of rows) {
    // Rows arrive newest-first, so the first one seen per article wins.
    if (!newestByArticle.has(row.article_id)) newestByArticle.set(row.article_id, row);
  }

  const open = [...newestByArticle.values()].filter(
    (row) => row.state === 'requested' && row.article !== null
  );

  if (open.length === 0) return [];

  // Attach the diff of the version each review was filed against.
  const diffByKey = await fetchDiffSummaries(supabase, open);

  return open
    .map((row) => ({
      articleId: row.article_id,
      articleTitle: row.article?.title ?? 'Untitled',
      articleSlug: row.article?.slug ?? '',
      requestedBy: row.requested_by,
      versionNumber: row.version_number,
      comment: row.comment,
      requestedAt: row.created_at,
      diffSummary: diffByKey.get(`${row.article_id}:${row.version_number}`) ?? null,
    }))
    .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
}

async function fetchDiffSummaries(
  supabase: TypedSupabaseClient,
  rows: { article_id: string; version_number: number | null }[]
): Promise<Map<string, ArticleVersionDiffSummary | null>> {
  const articleIds = [...new Set(rows.map((r) => r.article_id))];

  const { data } = await supabase
    .from('article_versions')
    .select('article_id, version_number, diff_summary')
    .in('article_id', articleIds);

  const map = new Map<string, ArticleVersionDiffSummary | null>();
  for (const row of data ?? []) {
    map.set(`${row.article_id}:${row.version_number}`, mapDiffSummary(row.diff_summary));
  }
  return map;
}
