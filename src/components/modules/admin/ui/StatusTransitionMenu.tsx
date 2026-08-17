import { transitionArticleStatusAction } from '@/components/modules/admin/actions';
import { Button } from '@/components/ui/button';
import type { EditorialRole } from '@/@types/editorial';
import {
  allowedTransitionsForRole,
  statusLabel,
  type EditorialStatus,
} from '@/lib/editorial/transitions';
import { StatusBadge } from './StatusBadge';

interface StatusTransitionMenuProps {
  articleId: string;
  status: EditorialStatus;
  role: EditorialRole;
}

/**
 * Replaces the old free-form status select.
 *
 * Offers only the moves that are legal from the current status *and* permitted
 * for the current role, so the editor never sees a button that would be
 * rejected by the database.
 */
export function StatusTransitionMenu({ articleId, status, role }: StatusTransitionMenuProps) {
  const targets = allowedTransitionsForRole(status, role);

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Status</p>
        <StatusBadge status={status} />
      </div>

      {targets.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          No transitions available for your role from “{statusLabel(status)}”.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {targets.map((target) => (
            <form key={target} action={transitionArticleStatusAction}>
              <input type="hidden" name="articleId" value={articleId} />
              <input type="hidden" name="toStatus" value={target} />
              <Button
                type="submit"
                size="sm"
                variant={target === 'published' ? 'default' : 'outline'}
              >
                {labelFor(target)}
              </Button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}

function labelFor(target: EditorialStatus): string {
  switch (target) {
    case 'in_review':
      return 'Submit for review';
    case 'published':
      return 'Publish now';
    case 'draft':
      return 'Back to draft';
    case 'archived':
      return 'Archive';
    case 'scheduled':
      return 'Mark scheduled';
    default:
      return statusLabel(target);
  }
}
