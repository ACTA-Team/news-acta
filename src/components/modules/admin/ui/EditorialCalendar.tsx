'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { rescheduleArticleAction } from '@/components/modules/admin/actions';
import type { CalendarEntry } from '@/@types/editorial';

interface EditorialCalendarProps {
  /** Month being displayed, as `YYYY-MM`. */
  month: string;
  entries: CalendarEntry[];
  /** Owners and editors may drag scheduled articles to another day. */
  canReschedule: boolean;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/**
 * Month grid of scheduled and published articles.
 *
 * Scheduled entries are draggable for owners and editors; dropping one on
 * another day keeps its time of day and only moves the date.
 */
export function EditorialCalendar({ month, entries, canReschedule }: EditorialCalendarProps) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { year, monthIndex } = parseMonth(month);
  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();

  const byDay = new Map<string, CalendarEntry[]>();
  for (const entry of entries) {
    const key = dayKey(new Date(entry.date));
    const bucket = byDay.get(key);
    if (bucket) bucket.push(entry);
    else byDay.set(key, [entry]);
  }

  function handleDrop(dayIso: string) {
    const articleId = dragging;
    setDragging(null);
    setHoveredDay(null);
    if (!articleId) return;

    const entry = entries.find((e) => e.articleId === articleId);
    if (!entry) return;

    // Keep the original time of day; only the date moves.
    const original = new Date(entry.date);
    const [y, m, d] = dayIso.split('-').map(Number);
    const target = new Date(original);
    target.setFullYear(y, m - 1, d);

    setError(null);
    startTransition(async () => {
      try {
        await rescheduleArticleAction(articleId, target.toISOString());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not reschedule.');
      }
    });
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div
        className={`overflow-hidden rounded-2xl border bg-card ${pending ? 'opacity-60' : ''}`}
        aria-busy={pending}
      >
        <div className="grid grid-cols-7 border-b bg-muted/50 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-2 py-2 text-center">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, index) => {
            if (day === null) {
              return (
                <div key={`blank-${index}`} className="min-h-24 border-b border-r bg-muted/20" />
              );
            }

            const iso = `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
            const dayEntries = byDay.get(iso) ?? [];
            const isDropTarget = canReschedule && hoveredDay === iso && dragging !== null;

            return (
              <div
                key={iso}
                className={`min-h-24 space-y-1 border-b border-r p-1.5 ${isDropTarget ? 'bg-blue-50 dark:bg-blue-950/40' : ''}`}
                onDragOver={
                  canReschedule
                    ? (event) => {
                        event.preventDefault();
                        setHoveredDay(iso);
                      }
                    : undefined
                }
                onDragLeave={canReschedule ? () => setHoveredDay(null) : undefined}
                onDrop={canReschedule ? () => handleDrop(iso) : undefined}
              >
                <p className="text-right text-xs text-muted-foreground">{day}</p>

                {dayEntries.map((entry) => {
                  const draggable = canReschedule && entry.status === 'scheduled';
                  return (
                    <div
                      key={`${entry.articleId}-${entry.status}`}
                      draggable={draggable}
                      onDragStart={draggable ? () => setDragging(entry.articleId) : undefined}
                      onDragEnd={draggable ? () => setDragging(null) : undefined}
                      className={`rounded-md px-1.5 py-1 text-xs ${
                        entry.status === 'scheduled'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      } ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
                      title={`${entry.title} — ${new Date(entry.date).toLocaleString()}`}
                    >
                      <Link
                        href={`/admin/news/${entry.articleId}/edit`}
                        className="block truncate hover:underline"
                      >
                        {entry.title}
                      </Link>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {canReschedule
          ? 'Drag a scheduled article to another day to move it. Published articles are fixed.'
          : 'Only owners and editors can reschedule articles.'}
      </p>
    </div>
  );
}

function parseMonth(month: string): { year: number; monthIndex: number } {
  const [y, m] = month.split('-').map(Number);
  const now = new Date();
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    return { year: now.getFullYear(), monthIndex: now.getMonth() };
  }
  return { year: y, monthIndex: m - 1 };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
