import Link from 'next/link';
import type { ArticleVersionListItem } from '@/@types/news';
import { VersionDiffBadge } from './VersionDiffBadge';
import { restoreArticleVersionAction } from '@/components/modules/admin/actions';

interface VersionHistorySidebarProps {
  articleId: string;
  versions: ArticleVersionListItem[];
  currentVersionNumber: number;
}

function formatTs(ts: string): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function maskEmail(email: string | null): string {
  if (!email) return 'system';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local[0]}***@${domain}`;
}

/**
 * Admin version history sidebar. Server Component.
 * Shows the version list with restore + preview actions per row.
 */
export function VersionHistorySidebar({
  articleId,
  versions,
  currentVersionNumber,
}: VersionHistorySidebarProps) {
  return (
    <aside className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-card p-4 dark:border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Version history
        </span>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          v{currentVersionNumber}
        </span>
      </div>

      {/* Version list */}
      {versions.length === 0 ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          No versions yet. Versions are created automatically on every edit.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {versions.map((version) => {
            const isCurrent = version.versionNumber === currentVersionNumber;
            return (
              <li
                key={version.id}
                className={`rounded-xl border p-3 text-xs transition-colors ${
                  isCurrent
                    ? 'border-blue-200 bg-blue-50/40 dark:border-blue-900/40 dark:bg-blue-950/20'
                    : 'border-zinc-100 bg-zinc-50/50 hover:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        v{version.versionNumber}
                      </span>
                      {isCurrent && (
                        <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          current
                        </span>
                      )}
                      {version.stellarTxHash && (
                        <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-900/20 dark:text-sky-300">
                          ✦ on-chain
                        </span>
                      )}
                    </div>
                    <time className="text-zinc-400" dateTime={version.createdAt}>
                      {formatTs(version.createdAt)}
                    </time>
                    <span className="text-zinc-400">{maskEmail(version.editedBy)}</span>
                  </div>
                </div>

                <div className="mt-2">
                  <VersionDiffBadge diffSummary={version.diffSummary} />
                </div>

                {/* Hash chain */}
                <div className="mt-2 rounded-lg bg-zinc-100/80 p-1.5 font-mono text-[9px] leading-relaxed text-zinc-400 dark:bg-zinc-800/60">
                  {version.contentHash.slice(0, 20)}…
                </div>

                {/* Actions */}
                {!isCurrent && (
                  <div className="mt-3 flex items-center gap-2">
                    <Link
                      href={`/admin/news/${articleId}/preview?version=${version.versionNumber}`}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
                    >
                      Preview
                    </Link>

                    <form action={restoreArticleVersionAction}>
                      <input type="hidden" name="articleId" value={articleId} />
                      <input type="hidden" name="versionNumber" value={version.versionNumber} />
                      <button
                        type="submit"
                        id={`restore-v${version.versionNumber}`}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 hover:border-amber-300 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300"
                      >
                        Restore
                      </button>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}
