import Link from 'next/link';
import { deleteAdminNewsArticleAction } from '@/components/modules/admin/actions';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { canDeleteArticles } from '@/lib/editorial/permissions';
import { EDITORIAL_STATUSES, statusLabel, type EditorialStatus } from '@/lib/editorial/transitions';
import { fetchAdminNewsList } from '../services/news.service';
import { getTranslationStatusForArticles } from '../services/translations.service';
import { requireAdmin } from '../services/auth.service';
import { StatusBadge } from '../ui/StatusBadge';
import { TranslationStatusBadge } from '../ui/TranslationStatusBadge';

export type AdminNewsFilterStatus = 'all' | EditorialStatus;

interface AdminNewsPageContentProps {
  status?: AdminNewsFilterStatus;
}

export async function AdminNewsPageContent({ status = 'all' }: AdminNewsPageContentProps) {
  const session = await requireAdmin();
  const supabase = await createClient();
  const items = await fetchAdminNewsList(supabase, status);

  // Two queries for the whole page rather than one per row.
  const translationStatus = await getTranslationStatusForArticles(
    supabase,
    items.map((item) => item.id)
  );

  const canDelete = canDeleteArticles(session.role);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <FilterButton href="/admin/news" active={status === 'all'} label="All" />
        {EDITORIAL_STATUSES.map((value) => (
          <FilterButton
            key={value}
            href={`/admin/news?status=${value}`}
            active={status === value}
            label={statusLabel(value)}
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Translations</th>
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
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                  {item.status === 'scheduled' && item.scheduledAt ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(item.scheduledAt).toLocaleString()}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {Object.values(translationStatus.get(item.id) ?? {}).map((entry) => (
                      <TranslationStatusBadge
                        key={entry.locale}
                        locale={entry.locale}
                        status={entry.status}
                      />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">{item.authorName}</td>
                <td className="px-4 py-3">{new Date(item.updatedAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/news/${item.id}/edit`}>Edit</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/news/${item.id}/translations`}>Translate</Link>
                    </Button>
                    {canDelete ? (
                      <form action={deleteAdminNewsArticleAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <Button size="sm" variant="destructive" type="submit">
                          Delete
                        </Button>
                      </form>
                    ) : null}
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
