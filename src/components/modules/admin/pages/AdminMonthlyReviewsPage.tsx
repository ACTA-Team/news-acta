import Link from 'next/link';
import { deleteAdminMonthlyReviewAction } from '@/components/modules/admin/actions';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { fetchAdminReviewList } from '../services/monthly-review.service';
import { formatPeriodLabel } from '@/components/modules/monthly-review/utils';

export async function AdminMonthlyReviewsPageContent() {
  const supabase = await createClient();
  const items = await fetchAdminReviewList(supabase);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Publish ecosystem snapshots combined with your custom editorial highlights.
        </p>
        <Button asChild>
          <Link href="/admin/monthly-reviews/new">Create Review</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Published Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3 font-semibold text-primary">
                  {formatPeriodLabel(item.period)}
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono text-xs uppercase text-muted-foreground">
                    {item.period}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium max-w-xs truncate">{item.title}</div>
                  <div className="text-xs text-muted-foreground max-w-xs truncate">{item.summary}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(item.publishedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/monthly-reviews/${item.id}/edit`}>Edit</Link>
                    </Button>
                    <form action={deleteAdminMonthlyReviewAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="period" value={item.period} />
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
            No monthly reviews found. Click 'Create Review' to get started!
          </p>
        ) : null}
      </div>
    </div>
  );
}
