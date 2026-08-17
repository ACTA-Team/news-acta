import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminSession, EditorialRole } from '@/@types/editorial';
import { ForbiddenError } from '@/lib/editorial/permissions';

/**
 * `roles.service` reaches `auth.service` -> `@/lib/supabase/server`, which
 * imports `server-only` and would refuse to load under a plain Node runner.
 * Both are mocked so the real `requireRole` can be exercised.
 */
const requireAdmin = vi.fn();

vi.mock('../auth.service', () => ({
  requireAdmin: () => requireAdmin(),
  getCurrentAdmin: () => requireAdmin(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => {
    throw new Error('not used in this test');
  },
}));

const { requireRole, getCurrentRole } = await import('../roles.service');

const ALL_ROLES: EditorialRole[] = ['owner', 'editor', 'author', 'contributor'];

function session(role: EditorialRole): AdminSession {
  return {
    id: 'user-1',
    email: `${role}@acta.dev`,
    role,
    authorId: null,
    displayName: null,
  };
}

beforeEach(() => {
  requireAdmin.mockReset();
});

describe('requireRole', () => {
  it('returns the session when the role is allowed', async () => {
    requireAdmin.mockResolvedValue(session('editor'));

    const result = await requireRole('owner', 'editor');

    expect(result.role).toBe('editor');
    expect(result.email).toBe('editor@acta.dev');
  });

  it('rejects each insufficient role for a publish-level action', async () => {
    for (const role of ['author', 'contributor'] as EditorialRole[]) {
      requireAdmin.mockResolvedValue(session(role));

      await expect(requireRole('owner', 'editor')).rejects.toThrow(ForbiddenError);
      await expect(requireRole('owner', 'editor')).rejects.toThrow(
        `role ${role} cannot perform this action`
      );
    }
  });

  it('rejects every non-owner for an owner-only action', async () => {
    for (const role of ALL_ROLES) {
      requireAdmin.mockResolvedValue(session(role));

      if (role === 'owner') {
        await expect(requireRole('owner')).resolves.toMatchObject({ role: 'owner' });
      } else {
        await expect(requireRole('owner')).rejects.toThrow(ForbiddenError);
      }
    }
  });

  it('accepts every role when all four are listed', async () => {
    for (const role of ALL_ROLES) {
      requireAdmin.mockResolvedValue(session(role));
      await expect(requireRole(...ALL_ROLES)).resolves.toMatchObject({ role });
    }
  });

  it('rejects everything when the allow-list is empty', async () => {
    for (const role of ALL_ROLES) {
      requireAdmin.mockResolvedValue(session(role));
      await expect(requireRole()).rejects.toThrow(ForbiddenError);
    }
  });

  it('propagates the redirect from requireAdmin for anonymous callers', async () => {
    // `requireAdmin` redirects rather than returning null; the role check must
    // never run in that case.
    requireAdmin.mockRejectedValue(new Error('NEXT_REDIRECT'));

    await expect(requireRole('owner')).rejects.toThrow('NEXT_REDIRECT');
  });
});

describe('getCurrentRole', () => {
  it('returns the signed-in role', async () => {
    requireAdmin.mockResolvedValue(session('author'));
    await expect(getCurrentRole()).resolves.toBe('author');
  });

  it('returns null when there is no admin', async () => {
    requireAdmin.mockResolvedValue(null);
    await expect(getCurrentRole()).resolves.toBeNull();
  });
});
