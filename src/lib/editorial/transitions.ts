/**
 * Article status transitions.
 *
 * This module is a mirror of `public.enforce_status_transition()` in
 * `supabase/migrations/0006_editorial_workflow.sql`. The database is the real
 * boundary — it rejects an invalid change even when the REST API is called
 * directly — and this table exists so the UI can offer only the moves that
 * will actually succeed.
 *
 * Keep the two in sync: `transitions.test.ts` asserts the full matrix, so a
 * change here without a matching change in the migration will be caught by a
 * failing expectation rather than silently diverging.
 *
 * Pure module — no Supabase, no server imports, safe to use from a Client
 * Component and from Node tests.
 */

import type { EditorialRole } from '@/@types/editorial';

export type EditorialStatus = 'draft' | 'in_review' | 'scheduled' | 'published' | 'archived';

export const EDITORIAL_STATUSES: readonly EditorialStatus[] = [
  'draft',
  'in_review',
  'scheduled',
  'published',
  'archived',
] as const;

/** Statuses only an owner or editor may move an article into. */
export const PUBLISHING_STATUSES: readonly EditorialStatus[] = ['published', 'scheduled'] as const;

const TRANSITIONS: Record<EditorialStatus, readonly EditorialStatus[]> = {
  draft: ['in_review', 'scheduled', 'published', 'archived'],
  in_review: ['draft', 'scheduled', 'published'],
  scheduled: ['draft', 'published', 'archived'],
  published: ['archived', 'draft'],
  archived: ['draft'],
};

/** Every status reachable from `from`, ignoring who is asking. */
export function allowedTransitions(from: EditorialStatus): readonly EditorialStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function isValidTransition(from: EditorialStatus, to: EditorialStatus): boolean {
  return allowedTransitions(from).includes(to);
}

export function isPublishingStatus(status: EditorialStatus): boolean {
  return PUBLISHING_STATUSES.includes(status);
}

/**
 * The transitions a given role may perform from `from`.
 *
 * A same-status "transition" is never offered: the guard short-circuits on
 * `old.status = new.status`, so it is a no-op rather than an error.
 */
export function allowedTransitionsForRole(
  from: EditorialStatus,
  role: EditorialRole
): readonly EditorialStatus[] {
  const canPublish = role === 'owner' || role === 'editor';
  return allowedTransitions(from).filter((to) => canPublish || !isPublishingStatus(to));
}

export function canTransition(
  from: EditorialStatus,
  to: EditorialStatus,
  role: EditorialRole
): boolean {
  return allowedTransitionsForRole(from, role).includes(to);
}

const STATUS_LABELS: Record<EditorialStatus, string> = {
  draft: 'Draft',
  in_review: 'In review',
  scheduled: 'Scheduled',
  published: 'Published',
  archived: 'Archived',
};

export function statusLabel(status: EditorialStatus): string {
  return STATUS_LABELS[status] ?? status;
}
