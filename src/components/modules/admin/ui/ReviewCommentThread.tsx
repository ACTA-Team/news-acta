import {
  approveReviewAction,
  requestChangesAction,
  requestReviewAction,
} from '@/components/modules/admin/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ArticleReviewEvent, ReviewState } from '@/@types/editorial';
import type { EditorialStatus } from '@/lib/editorial/transitions';

const STATE_LABELS: Record<ReviewState, string> = {
  requested: 'requested review',
  approved: 'approved',
  changes_requested: 'requested changes',
};

const STATE_STYLES: Record<ReviewState, string> = {
  requested: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  changes_requested: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

interface ReviewCommentThreadProps {
  articleId: string;
  status: EditorialStatus;
  events: ArticleReviewEvent[];
  /** Owners and editors may resolve; everyone else may only submit. */
  canReview: boolean;
  canSubmit: boolean;
}

/**
 * The append-only review thread for one article.
 *
 * Every row in `article_reviews` is an event, so this renders as a timeline
 * rather than an editable record.
 */
export function ReviewCommentThread({
  articleId,
  status,
  events,
  canReview,
  canSubmit,
}: ReviewCommentThreadProps) {
  const isOpen = events.length > 0 && events[events.length - 1].state === 'requested';
  const canRequestReview = canSubmit && (status === 'draft' || status === 'in_review') && !isOpen;

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Review</p>
        {isOpen ? (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            open
          </span>
        ) : null}
      </div>

      {events.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">No review activity yet.</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {events.map((event) => (
            <li key={event.id} className="border-l-2 border-muted pl-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${STATE_STYLES[event.state]}`}
                >
                  {STATE_LABELS[event.state]}
                </span>
                <span className="text-muted-foreground">{event.requestedBy}</span>
                {event.versionNumber !== null ? (
                  <span className="font-mono text-muted-foreground">v{event.versionNumber}</span>
                ) : null}
              </div>
              {event.comment ? <p className="mt-1 text-sm">{event.comment}</p> : null}
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(event.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ol>
      )}

      {canRequestReview ? (
        <form action={requestReviewAction} className="mt-4 space-y-2">
          <input type="hidden" name="articleId" value={articleId} />
          <Textarea name="comment" placeholder="Anything the reviewer should know?" rows={2} />
          <Button type="submit" size="sm" variant="outline" className="w-full">
            Submit for review
          </Button>
        </form>
      ) : null}

      {canReview && isOpen ? (
        <div className="mt-4 space-y-2 border-t pt-4">
          <form action={approveReviewAction} className="space-y-2">
            <input type="hidden" name="articleId" value={articleId} />
            <Textarea name="comment" placeholder="Approval note (optional)" rows={2} />
            <Button type="submit" size="sm" className="w-full">
              Approve
            </Button>
          </form>
          <form action={requestChangesAction} className="space-y-2">
            <input type="hidden" name="articleId" value={articleId} />
            <Textarea
              name="comment"
              placeholder="What needs to change? (required)"
              rows={2}
              required
            />
            <Button type="submit" size="sm" variant="outline" className="w-full">
              Request changes
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
