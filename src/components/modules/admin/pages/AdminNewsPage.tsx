import Link from 'next/link';
import { deleteAdminNewsArticleAction } from '@/components/modules/admin/actions';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { fetchAdminNewsList } from '../services/news.service';

interface AdminNewsPageContentProps {
  status?: 'all' | 'draft' | 'published' | 'archived';
}

export async function AdminNewsPageContent({ status = 'all' }: AdminNewsPageContentProps) {
  const supabase = await createClient();
  const items = await fetchAdminNewsList(supabase, status);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <FilterButton href="/admin/news" active={status === 'all'} label="All" />
        <FilterButton href="/admin/news?status=draft" active={status === 'draft'} label="Draft" />
        <FilterButton
          href="/admin/news?status=published"
          active={status === 'published'}
          label="Published"
        />
        <FilterButton
          href="/admin/news?status=archived"
          active={status === 'archived'}
          label="Archived"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground">/{item.slug}</div>
                </td>
                <td className="px-4 py-3 uppercase">{item.status}</td>
                <td className="px-4 py-3">{item.authorName}</td>
                <td className="px-4 py-3">{new Date(item.updatedAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/news/${item.id}/edit`}>Edit</Link>
                    </Button>
                    <form action={deleteAdminNewsArticleAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <Button size="sm" variant="destructive" type="submit">
                        Delete
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No articles found for this filter.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function FilterButton({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Button asChild variant={active ? 'default' : 'outline'} size="sm">
      <Link href={href}>{label}</Link>
    </Button>
  );
}
