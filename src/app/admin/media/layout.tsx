import Link from 'next/link';
import { requireAdmin } from '@/components/modules/admin/services/auth.service';

/**
 * Chrome for the media library screens.
 *
 * This nav and the dark surface used to live in `src/app/admin/layout.tsx`. That
 * layout is now a root layout (it owns `<html>`), and it also wrapped the
 * `(protected)` group, which brings its own `AdminShell`: keeping the nav there
 * would have double-wrapped every other admin page.
 *
 * `requireAdmin` replaces the old `app_metadata.role === 'admin'` check, which
 * looked at a signal this project stopped using when `admin_users` became the
 * source of truth in `0002_admin_access.sql`.
 */
export default async function AdminMediaLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <nav className="border-b border-zinc-800 bg-zinc-900 px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold tracking-wider text-zinc-300 uppercase">
            ACTA Admin
          </span>
          <Link
            href="/admin/media"
            className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Media Library
          </Link>
          <Link
            href="/admin/media/orphans"
            className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Orphaned Media
          </Link>
        </div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
