import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export interface CurrentAdmin {
  id: string;
  email: string;
}

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
    .select('email')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (!adminRow) return null;

  return {
    id: user.id,
    email: normalizedEmail,
  };
}

export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect('/admin/login');
  }
  return admin;
}
