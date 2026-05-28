import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin — ACTA News',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <nav className="border-b border-zinc-800 bg-zinc-900 px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold tracking-wider text-zinc-300 uppercase">
            ACTA Admin
          </span>
          <a
            href="/admin/media"
            className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Media Library
          </a>
          <a
            href="/admin/media/orphans"
            className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Orphaned Media
          </a>
        </div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
