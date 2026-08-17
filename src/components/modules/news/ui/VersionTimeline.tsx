import Link from 'next/link';
import type { ArticleVersionListItem } from '@/@types/news';
import { VersionDiffBadge } from './VersionDiffBadge';

interface VersionTimelineProps {
  versions: ArticleVersionListItem[];
  articleSlug: string;
  /** Currently selected version numbers for comparison (up to 2) */
  selectedVersions?: number[];
}

const HORIZON_EXPLORER = process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL?.includes('testnet')
  ? 'https://stellar.expert/explorer/testnet/tx'
  : 'https://stellar.expert/explorer/public/tx';

function maskEmail(email: string | null): string {
  if (!email) return 'system';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local[0]}***@${domain}`;
}

function formatTs(ts: string): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Server-rendered vertical timeline of all article versions.
 * Compare-selection is handled by the parent client wrapper.
 */
export function VersionTimeline({
  versions,
  articleSlug,
  selectedVersions = [],
}: VersionTimelineProps) {
  if (versions.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40">
        No version history yet. Versions are created automatically on every edit.
      </div>
    );
  }

  return (
    <ol className="relative flex flex-col gap-0">
      {versions.map((version, idx) => {
        const isFirst = idx === 0;
        const isSelected = selectedVersions.includes(version.versionNumber);

        return (
          <li key={version.id} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Connecting line */}
            {!isFirst && (
              <div className="absolute left-[15px] top-0 -mt-8 h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
            )}

            {/* Version badge / dot */}
            <div className="relative z-10 flex-shrink-0">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-zinc-300 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'
                }`}
              >
                {version.versionNumber}
              </div>
              {/* Vertical line going down */}
              {idx < versions.length - 1 && (
                <div className="absolute left-1/2 top-8 h-full w-px -translate-x-1/2 bg-zinc-200 dark:bg-zinc-800" />
              )}
            </div>

            {/* Content card */}
            <div
              className={`flex-1 rounded-2xl border p-4 transition-colors ${
                isSelected
                  ? 'border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20'
                  : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Version {version.versionNumber}
                    </span>
                    {version.stellarTxHash && (
                      <Link
                        href={`${HORIZON_EXPLORER}/${version.stellarTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 hover:bg-sky-100 dark:bg-sky-900/20 dark:text-sky-300 dark:hover:bg-sky-900/40"
                        title="View on Stellar Explorer"
                      >
                        ✦ on-chain
                      </Link>
                    )}
                  </div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {version.title}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <time dateTime={version.createdAt}>{formatTs(version.createdAt)}</time>
                    <span>·</span>
                    <span>{maskEmail(version.editedBy)}</span>
                  </div>
                </div>

                {/* Compare checkbox: handled by the client selector above */}
                <label
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  title="Select for comparison"
                >
                  <input
                    type="checkbox"
                    name="compare"
                    value={version.versionNumber}
                    defaultChecked={isSelected}
                    className="accent-blue-600"
                    aria-label={`Select version ${version.versionNumber} for comparison`}
                  />
                  compare
                </label>
              </div>

              {/* Diff badges */}
              <div className="mt-3">
                <VersionDiffBadge diffSummary={version.diffSummary} />
              </div>

              {/* Hash chain info */}
              <div className="mt-3 flex flex-col gap-0.5 rounded-lg bg-zinc-50 p-2 font-mono text-[10px] text-zinc-400 dark:bg-zinc-800/60">
                <span title="SHA-256 of content at this version">
                  hash: {version.contentHash.slice(0, 16)}…
                </span>
                {version.previousHash && (
                  <span title="Hash of the previous version (chain link)">
                    prev: {version.previousHash.slice(0, 16)}…
                  </span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
