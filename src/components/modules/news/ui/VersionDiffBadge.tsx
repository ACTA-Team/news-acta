import type { ArticleVersionListItem } from '@/@types/news';

interface VersionDiffBadgeProps {
  diffSummary: ArticleVersionListItem['diffSummary'];
  className?: string;
}

/**
 * Compact badge showing fields changed and character-level counts.
 * Server component — no interactivity needed.
 */
export function VersionDiffBadge({ diffSummary, className }: VersionDiffBadgeProps) {
  if (!diffSummary || diffSummary.fieldsChanged.length === 0) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 ${className ?? ''}`}
      >
        no content change
      </span>
    );
  }

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className ?? ''}`}>
      {diffSummary.fieldsChanged.map((field) => (
        <span
          key={field}
          className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        >
          {field}
        </span>
      ))}
      {diffSummary.contentAdded > 0 && (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          +{diffSummary.contentAdded}
        </span>
      )}
      {diffSummary.contentRemoved > 0 && (
        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
          −{diffSummary.contentRemoved}
        </span>
      )}
    </span>
  );
}
