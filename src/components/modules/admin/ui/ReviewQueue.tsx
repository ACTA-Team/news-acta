import Link from 'next/link';
import { approveReviewAction, requestChangesAction } from '@/components/modules/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VersionDiffBadge } from '@/components/modules/news/ui/VersionDiffBadge';
import type { OpenReviewItem } from '@/@types/editorial';

interface ReviewQueueProps {
  items: OpenReviewItem[];
  /** Owners and editors get the approve / request-changes controls. */
  canReview: boolean;
}

/** Open reviews with article, requester, age and the version diff badge. */
export function ReviewQueue({ items, canReview }: ReviewQueueProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border bg-card px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">Nothing waiting for review.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.articleId} className="rounded-2xl border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <Link
                href={`/admin/news/${item.articleId}/edit`}
                className="font-medium hover:underline"
              >
                {item.articleTitle}
              </Link>
              <p className="text-xs text-muted-foreground">
                /{item.articleSlug} · requested by {item.requestedBy} ·{' '}
                {formatAge(item.requestedAt)}
                {item.versionNumber !== null ? ` · v${item.versionNumber}` : ''}
              </p>
              <VersionDiffBadge diffSummary={item.diffSummary} />
              {item.comment ? <p className="pt-1 text-sm">{item.comment}</p> : null}
            </div>

            <Button asChild size="sm" variant="outline">
              <Link href={`/admin/news/${item.articleId}/edit`}>Open</Link>
            </Button>
          </div>

          {canReview ? (
            <div className="mt-4 grid gap-2 border-t pt-4 sm:grid-cols-2">
              <form action={approveReviewAction} className="flex gap-2">
                <input type="hidden" name="articleId" value={item.articleId} />
                <Input name="comment" placeholder="Approval note (optional)" />
                <Button type="submit" size="sm">
                  Approve
                </Button>
              </form>
              <form action={requestChangesAction} className="flex gap-2">
                <input type="hidden" name="articleId" value={item.articleId} />
                <Input name="comment" placeholder="What needs changing?" required />
                <Button type="submit" size="sm" variant="outline">
                  Request changes
                </Button>
              </form>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function formatAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'just now';

  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
