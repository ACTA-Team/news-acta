import { describe, expect, it } from 'vitest';
import type { EditorialRole } from '@/@types/editorial';
import {
  assertRoleAllowed,
  canDeleteArticles,
  canEditArticle,
  canManageTeam,
  canPublish,
  canReview,
  canSeeAllArticles,
  EDITORIAL_ROLES,
  ForbiddenError,
  isEditorialRole,
} from '../permissions';
import { EDITORIAL_STATUSES } from '../transitions';

const ALL_ROLES = [...EDITORIAL_ROLES];

describe('role capabilities', () => {
  it('lets only owners and editors publish', () => {
    expect(ALL_ROLES.filter(canPublish)).toEqual(['owner', 'editor']);
  });

  it('lets only owners manage the team', () => {
    expect(ALL_ROLES.filter(canManageTeam)).toEqual(['owner']);
  });

  it('lets only owners delete articles', () => {
    expect(ALL_ROLES.filter(canDeleteArticles)).toEqual(['owner']);
  });

  it('ties review resolution to publishing rights', () => {
    for (const role of ALL_ROLES) {
      expect(canReview(role)).toBe(canPublish(role));
    }
  });

  it('hides other authors work from contributors only', () => {
    expect(ALL_ROLES.filter((role) => !canSeeAllArticles(role))).toEqual(['contributor']);
  });

  it('recognises exactly the four roles', () => {
    for (const role of ALL_ROLES) expect(isEditorialRole(role)).toBe(true);
    for (const other of ['admin', 'reader', '', 'OWNER']) {
      expect(isEditorialRole(other)).toBe(false);
    }
  });
});

describe('canEditArticle', () => {
  it('lets owners and editors edit anything, owned or not, at any status', () => {
    for (const role of ['owner', 'editor'] as EditorialRole[]) {
      for (const status of EDITORIAL_STATUSES) {
        expect(canEditArticle(role, { ownsArticle: false, status })).toBe(true);
        expect(canEditArticle(role, { ownsArticle: true, status })).toBe(true);
      }
    }
  });

  it('refuses authors and contributors on articles they do not own', () => {
    for (const role of ['author', 'contributor'] as EditorialRole[]) {
      for (const status of EDITORIAL_STATUSES) {
        expect(canEditArticle(role, { ownsArticle: false, status })).toBe(false);
      }
    }
  });

  it('lets an author edit their own article at any status', () => {
    for (const status of EDITORIAL_STATUSES) {
      expect(canEditArticle('author', { ownsArticle: true, status })).toBe(true);
    }
  });

  it('limits a contributor to their own draft or in-review article', () => {
    expect(canEditArticle('contributor', { ownsArticle: true, status: 'draft' })).toBe(true);
    expect(canEditArticle('contributor', { ownsArticle: true, status: 'in_review' })).toBe(true);
    expect(canEditArticle('contributor', { ownsArticle: true, status: 'scheduled' })).toBe(false);
    expect(canEditArticle('contributor', { ownsArticle: true, status: 'published' })).toBe(false);
    expect(canEditArticle('contributor', { ownsArticle: true, status: 'archived' })).toBe(false);
  });
});

describe('assertRoleAllowed', () => {
  it('passes when the role is listed', () => {
    expect(() => assertRoleAllowed('editor', ['owner', 'editor'])).not.toThrow();
  });

  it('rejects each insufficient role with a ForbiddenError', () => {
    for (const role of ['author', 'contributor'] as EditorialRole[]) {
      expect(() => assertRoleAllowed(role, ['owner', 'editor'])).toThrow(ForbiddenError);
      expect(() => assertRoleAllowed(role, ['owner', 'editor'])).toThrow(
        `role ${role} cannot perform this action`
      );
    }
  });

  it('rejects every non-owner for an owner-only action', () => {
    for (const role of ALL_ROLES) {
      if (role === 'owner') continue;
      expect(() => assertRoleAllowed(role, ['owner'])).toThrow(ForbiddenError);
    }
  });

  it('carries a 403 status', () => {
    try {
      assertRoleAllowed('contributor', ['owner']);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenError);
      expect((err as ForbiddenError).status).toBe(403);
    }
  });
});
