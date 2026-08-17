import { describe, expect, it } from 'vitest';
import type { EditorialRole } from '@/@types/editorial';
import {
  allowedTransitions,
  allowedTransitionsForRole,
  canTransition,
  EDITORIAL_STATUSES,
  isPublishingStatus,
  isValidTransition,
  statusLabel,
  type EditorialStatus,
} from '../transitions';

/**
 * The full transition matrix, written out independently of the implementation.
 *
 * This is the same table encoded in `public.enforce_status_transition()` in
 * `supabase/migrations/0006_editorial_workflow.sql`. Asserting every ordered
 * pair (allowed *and* forbidden) means a change on either side that is not
 * mirrored on the other shows up as a failure here.
 */
const EXPECTED: Record<EditorialStatus, EditorialStatus[]> = {
  draft: ['in_review', 'scheduled', 'published', 'archived'],
  in_review: ['draft', 'scheduled', 'published'],
  scheduled: ['draft', 'published', 'archived'],
  published: ['archived', 'draft'],
  archived: ['draft'],
};

const ALL_ROLES: EditorialRole[] = ['owner', 'editor', 'author', 'contributor'];
const PUBLISHERS: EditorialRole[] = ['owner', 'editor'];

describe('transition matrix', () => {
  it('covers every status', () => {
    expect([...EDITORIAL_STATUSES].sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  // Every ordered pair, allowed and forbidden.
  for (const from of EDITORIAL_STATUSES) {
    for (const to of EDITORIAL_STATUSES) {
      const shouldBeValid = EXPECTED[from].includes(to);

      it(`${shouldBeValid ? 'allows' : 'rejects'} ${from} -> ${to}`, () => {
        expect(isValidTransition(from, to)).toBe(shouldBeValid);
      });
    }
  }

  it('never lists a status as a transition to itself', () => {
    for (const status of EDITORIAL_STATUSES) {
      expect(allowedTransitions(status)).not.toContain(status);
    }
  });

  it('treats published and scheduled as the publishing statuses', () => {
    expect(EDITORIAL_STATUSES.filter(isPublishingStatus)).toEqual(['scheduled', 'published']);
  });

  it('makes every status reachable from draft or via draft', () => {
    // draft is the hub: everything can get back to it, and it reaches the rest.
    for (const status of EDITORIAL_STATUSES) {
      if (status === 'draft') continue;
      expect(allowedTransitions(status)).toContain('draft');
    }
  });

  it('labels every status', () => {
    for (const status of EDITORIAL_STATUSES) {
      expect(statusLabel(status)).toBeTruthy();
      expect(statusLabel(status)).not.toBe(status);
    }
  });
});

describe('transitions by role', () => {
  for (const from of EDITORIAL_STATUSES) {
    for (const to of EDITORIAL_STATUSES) {
      for (const role of ALL_ROLES) {
        const structurallyValid = EXPECTED[from].includes(to);
        const roleAllows = PUBLISHERS.includes(role) || !isPublishingStatus(to);
        const expected = structurallyValid && roleAllows;

        it(`${role}: ${expected ? 'allows' : 'rejects'} ${from} -> ${to}`, () => {
          expect(canTransition(from, to, role)).toBe(expected);
        });
      }
    }
  }

  it('never offers publish or schedule to authors and contributors', () => {
    for (const role of ['author', 'contributor'] as EditorialRole[]) {
      for (const from of EDITORIAL_STATUSES) {
        const targets = allowedTransitionsForRole(from, role);
        expect(targets).not.toContain('published');
        expect(targets).not.toContain('scheduled');
      }
    }
  });

  it('gives owners and editors the unrestricted matrix', () => {
    for (const role of PUBLISHERS) {
      for (const from of EDITORIAL_STATUSES) {
        expect([...allowedTransitionsForRole(from, role)]).toEqual([...allowedTransitions(from)]);
      }
    }
  });

  it('still lets an author submit for review and archive', () => {
    expect(allowedTransitionsForRole('draft', 'author')).toEqual(['in_review', 'archived']);
    expect(allowedTransitionsForRole('draft', 'contributor')).toEqual(['in_review', 'archived']);
  });
});
