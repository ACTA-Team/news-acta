import { createClient } from '@/lib/supabase/server';
import { canReview } from '@/lib/editorial/permissions';
import { requireAdmin } from '../services/auth.service';
import { listOpen } from '../services/reviews.service';
import { ReviewQueue } from '../ui/ReviewQueue';

export async function AdminReviewQueuePageContent() {
  const session = await requireAdmin();
  const supabase = await createClient();
  const items = await listOpen(supabase);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {items.length === 0
          ? 'The queue is empty.'
          : `${items.length} article${items.length === 1 ? '' : 's'} waiting for review.`}
      </p>
      <ReviewQueue items={items} canReview={canReview(session.role)} />
    </div>
  );
}
