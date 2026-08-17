/**
 * Role resolution and enforcement for the admin area.
 *
 * `requireRole` mirrors `requireAdmin`: it resolves the session first (which
 * redirects anonymous visitors to the login page) and then asserts the role.
 * RLS remains the real boundary: this layer exists so an action fails with a
 * readable message instead of an opaque Postgres error, and so the UI can hide
 * what the role cannot do.
 */

import type { AdminSession, EditorialRole, TeamMember } from '@/@types/editorial';
import { assertRoleAllowed } from '@/lib/editorial/permissions';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from './auth.service';

export { ForbiddenError } from '@/lib/editorial/permissions';

/** The current session's role, or `null` when nobody is signed in. */
export async function getCurrentRole(): Promise<EditorialRole | null> {
  const { getCurrentAdmin } = await import('./auth.service');
  const admin = await getCurrentAdmin();
  return admin?.role ?? null;
}

/**
 * Require an authenticated admin whose role is one of `allowed`.
 *
 * @throws ForbiddenError when the session's role is insufficient.
 */
export async function requireRole(...allowed: EditorialRole[]): Promise<AdminSession> {
  const session = await requireAdmin();
  assertRoleAllowed(session.role, allowed);
  return session;
}

/** The team roster shown on `/admin/team`. Owner-only in practice: RLS
 *  returns just the caller's own row to anyone else. */
export async function listTeam(): Promise<TeamMember[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('admin_users')
    .select('email, role, author_id, display_name, created_at, author:authors ( name )')
    .order('created_at', { ascending: true });

  if (error) throw error;

  type Row = {
    email: string;
    role: EditorialRole;
    author_id: string | null;
    display_name: string | null;
    created_at: string;
    author: { name: string } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((row) => ({
    email: row.email,
    role: row.role,
    authorId: row.author_id,
    authorName: row.author?.name ?? null,
    displayName: row.display_name,
    createdAt: row.created_at,
  }));
}
