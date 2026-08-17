import { statusLabel, type EditorialStatus } from '@/lib/editorial/transitions';

const STATUS_STYLES: Record<EditorialStatus, string> = {
  draft: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  in_review: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  scheduled: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  published: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  archived: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

interface StatusBadgeProps {
  status: EditorialStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]} ${className ?? ''}`}
    >
      {statusLabel(status)}
    </span>
  );
}
