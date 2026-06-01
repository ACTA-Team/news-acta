import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';

export async function AdminDashboardPageContent() {
  const supabase = await createClient();
  const [{ count: totalArticles }, { count: drafts }, { count: published }] = await Promise.all([
    supabase.from('news_articles').select('id', { count: 'exact', head: true }),
    supabase
      .from('news_articles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'draft'),
    supabase
      .from('news_articles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total articles" value={String(totalArticles ?? 0)} />
        <StatCard label="Drafts" value={String(drafts ?? 0)} />
        <StatCard label="Published" value={String(published ?? 0)} />
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/admin/news/new">Create article</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/news">Manage articles</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border bg-card p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </article>
  );
}
