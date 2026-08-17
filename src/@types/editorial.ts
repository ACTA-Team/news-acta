/**
 * Editorial workflow types.
 *
 * Convention: every type in the `editorial` domain lives here.
 * These mirror the enums and tables created in
 * `supabase/migrations/0006_editorial_workflow.sql`.
 */

export type EditorialRole = 'owner' | 'editor' | 'author' | 'contributor';

export type ReviewState = 'requested' | 'approved' | 'changes_requested';

/** An authenticated admin, enriched with their editorial role. */
export interface AdminSession {
  id: string;
  email: string;
  role: EditorialRole;
  /** `authors.id` this admin writes as, when linked. */
  authorId: string | null;
  displayName: string | null;
}

/** One row of the team roster on `/admin/team`. */
export interface TeamMember {
  email: string;
  role: EditorialRole;
  authorId: string | null;
  authorName: string | null;
  displayName: string | null;
  createdAt: string;
}

/**
 * One append-only event in an article's review thread.
 *
 * `requestedBy` is the actor who appended the event, whatever its state:
 * the author on a `requested` row, the reviewer on a resolution row.
 */
export interface ArticleReviewEvent {
  id: string;
  articleId: string;
  versionNumber: number | null;
  state: ReviewState;
  requestedBy: string;
  reviewerEmail: string | null;
  comment: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

/** An article whose newest review event is still `requested`. */
export interface OpenReviewItem {
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  requestedBy: string;
  versionNumber: number | null;
  comment: string | null;
  requestedAt: string;
  /** Diff of the version the review was filed against, when available. */
  diffSummary: import('./news').ArticleVersionDiffSummary | null;
}

/** An article occupying a slot on the editorial calendar. */
export interface CalendarEntry {
  articleId: string;
  title: string;
  slug: string;
  status: 'scheduled' | 'published';
  /** `scheduled_at` for scheduled entries, `published_at` for published ones. */
  date: string;
  authorName: string | null;
}

export interface EditorialAuditEntry {
  id: string;
  actorEmail: string;
  action: string;
  entity: string;
  entityId: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  createdAt: string;
}
