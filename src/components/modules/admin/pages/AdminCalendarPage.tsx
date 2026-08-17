import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { canPublish } from '@/lib/editorial/permissions';
import { requireAdmin } from '../services/auth.service';
import { listCalendarEntries } from '../services/scheduling.service';
import { EditorialCalendar } from '../ui/EditorialCalendar';

interface AdminCalendarPageContentProps {
  /** `YYYY-MM`; defaults to the current month. */
  month?: string;
}

export async function AdminCalendarPageContent({ month }: AdminCalendarPageContentProps) {
  const session = await requireAdmin();
  const supabase = await createClient();

  const active = normalizeMonth(month);
  const from = new Date(active.year, active.monthIndex, 1);
  const to = new Date(active.year, active.monthIndex + 1, 1);

  const entries = await listCalendarEntries(supabase, { from, to });

  const monthKey = `${active.year}-${pad(active.monthIndex + 1)}`;
  const previous = shiftMonth(active, -1);
  const next = shiftMonth(active, 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {from.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/calendar?month=${previous}`}>Previous</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/calendar">Today</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/calendar?month=${next}`}>Next</Link>
          </Button>
        </div>
      </div>

      <EditorialCalendar
        month={monthKey}
        entries={entries}
        canReschedule={canPublish(session.role)}
      />
    </div>
  );
}

function normalizeMonth(month: string | undefined): { year: number; monthIndex: number } {
  const now = new Date();
  if (!month) return { year: now.getFullYear(), monthIndex: now.getMonth() };

  const [y, m] = month.split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    return { year: now.getFullYear(), monthIndex: now.getMonth() };
  }
  return { year: y, monthIndex: m - 1 };
}

function shiftMonth(active: { year: number; monthIndex: number }, delta: number): string {
  const date = new Date(active.year, active.monthIndex + delta, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
