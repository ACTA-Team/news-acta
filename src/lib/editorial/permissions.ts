/**
 * Role capabilities.
 *
 * The authoritative boundary is RLS (see `0006_editorial_workflow.sql`); this
 * module exists so the UI can hide what a role cannot do and so server actions
 * can fail fast with a clear message instead of surfacing a Postgres error.
 *
 * Pure module — safe to import from Client Components and from Node tests.
 */

import type { EditorialRole } from '@/@types/editorial';
import type { EditorialStatus } from './transitions';

export const EDITORIAL_ROLES: readonly EditorialRole[] = [
  'owner',
  'editor',
  'author',
  'contributor',
] as const;

export function isEditorialRole(value: string): value is EditorialRole {
  return (EDITORIAL_ROLES as readonly string[]).includes(value);
}

/** Thrown when a session's role is insufficient for the attempted action. */
export class ForbiddenError extends Error {
  readonly status = 403;

  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/** Owners and editors may publish, schedule and resolve reviews. */
export function canPublish(role: EditorialRole): boolean {
  return role === 'owner' || role === 'editor';
}

/** Only owners manage the team roster and roles. */
export function canManageTeam(role: EditorialRole): boolean {
  return role === 'owner';
}

/** Only owners delete articles outright; everyone else archives. */
export function canDeleteArticles(role: EditorialRole): boolean {
  return role === 'owner';
}

/** Owners and editors resolve reviews (approve / request changes). */
export function canReview(role: EditorialRole): boolean {
  return canPublish(role);
}

/** Contributors only ever see their own articles. */
export function canSeeAllArticles(role: EditorialRole): boolean {
  return role !== 'contributor';
}

/**
 * Whether `role` may edit an article it does or does not own.
 *
 * Mirrors the `editorial update articles` policy: owners and editors edit
 * anything; authors edit their own at any status; contributors edit their own
 * only while it is still a draft or in review.
 */
export function canEditArticle(
  role: EditorialRole,
  options: { ownsArticle: boolean; status: EditorialStatus }
): boolean {
  if (canPublish(role)) return true;
  if (!options.ownsArticle) return false;
  if (role === 'author') return true;
  return options.status === 'draft' || options.status === 'in_review';
}

/** Assert that `role` is one of `allowed`, or throw `ForbiddenError`. */
export function assertRoleAllowed(role: EditorialRole, allowed: readonly EditorialRole[]): void {
  if (!allowed.includes(role)) {
    throw new ForbiddenError(`role ${role} cannot perform this action`);
  }
}
