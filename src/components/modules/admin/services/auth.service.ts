import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AdminSession, EditorialRole } from '@/@types/editorial';

/**
 * The signed-in admin, enriched with their editorial role.
 *
 * `CurrentAdmin` is kept as an alias of `AdminSession` so existing callers
 * (`requireAdmin()`) keep working while gaining `role` / `authorId`.
 */
export type CurrentAdmin = AdminSession;

function providerOf(user: { app_metadata?: { provider?: string } }) {
  return user.app_metadata?.provider ?? 'unknown';
}

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user?.email) return null;
  if (providerOf(user) !== 'email') return null;

  const normalizedEmail = user.email.toLowerCase();

  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('email, role, author_id, display_name')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (!adminRow) return null;

  return {
    id: user.id,
    email: normalizedEmail,
    // Defensive default: a row written before 0006 (or by a client that omits
    // the column) is treated as the least-privileged role that can still work.
    role: (adminRow.role ?? 'contributor') as EditorialRole,
    authorId: adminRow.author_id ?? null,
    displayName: adminRow.display_name ?? null,
  };
}

export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect('/admin/login');
  }
  return admin;
}
