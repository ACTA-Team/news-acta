import { scheduleArticleAction, unscheduleArticleAction } from '@/components/modules/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { EditorialStatus } from '@/lib/editorial/transitions';

interface SchedulePickerProps {
  articleId: string;
  status: EditorialStatus;
  scheduledAt: string | null;
  /** Owners and editors only; hidden entirely for other roles. */
  canSchedule: boolean;
}

/** Datetime input that queues an article for the publishing cron. */
export function SchedulePicker({
  articleId,
  status,
  scheduledAt,
  canSchedule,
}: SchedulePickerProps) {
  if (!canSchedule) return null;

  const isScheduled = status === 'scheduled';
  const defaultValue = scheduledAt ? toLocalInputValue(scheduledAt) : '';

  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Schedule</p>

      {isScheduled && scheduledAt ? (
        <p className="mt-2 text-sm">
          Publishes automatically on{' '}
          <span className="font-medium">{new Date(scheduledAt).toLocaleString()}</span>.
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Pick a future date and the publishing cron takes it live within 10 minutes.
        </p>
      )}

      <form action={scheduleArticleAction} className="mt-3 space-y-2">
        <input type="hidden" name="articleId" value={articleId} />
        <Input type="datetime-local" name="scheduledAt" required defaultValue={defaultValue} />
        <Button type="submit" size="sm" variant="outline" className="w-full">
          {isScheduled ? 'Reschedule' : 'Schedule'}
        </Button>
      </form>

      {isScheduled ? (
        <form action={unscheduleArticleAction} className="mt-2">
          <input type="hidden" name="articleId" value={articleId} />
          <Button type="submit" size="sm" variant="ghost" className="w-full">
            Cancel schedule
          </Button>
        </form>
      ) : null}
    </div>
  );
}

/** `datetime-local` needs `YYYY-MM-DDTHH:mm` in local time, not a UTC ISO string. */
function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
