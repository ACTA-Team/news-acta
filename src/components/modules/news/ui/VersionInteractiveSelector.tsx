'use client';

import { useState } from 'react';
import type { ArticleVersion, ArticleVersionListItem } from '@/@types/news';
import { VersionTimeline } from '../ui/VersionTimeline';
import { VersionComparison } from '../ui/VersionComparison';

interface VersionInteractiveSelectorProps {
  versions: ArticleVersionListItem[];
  fullVersions: Map<number, ArticleVersion>;
  articleSlug: string;
  /** Called when user selects a new version to load its full data */
  onRequestVersion: (versionNumber: number) => Promise<ArticleVersion | null>;
}

/**
 * Client wrapper that handles compare-checkbox state, fetches full version
 * data on demand, and renders the comparison panel.
 */
export function VersionInteractiveSelector({
  versions,
  fullVersions: initialFull,
  articleSlug,
  onRequestVersion,
}: VersionInteractiveSelectorProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [loaded, setLoaded] = useState<Map<number, ArticleVersion>>(new Map(initialFull));
  const [loading, setLoading] = useState(false);

  async function handleCheckChange(versionNumber: number, checked: boolean) {
    if (!checked) {
      setSelected((prev) => prev.filter((n) => n !== versionNumber));
      return;
    }

    // Max 2 selections
    setSelected((prev) => {
      const next = [...prev, versionNumber];
      return next.slice(-2);
    });

    // Load full data if not already cached
    if (!loaded.has(versionNumber)) {
      setLoading(true);
      const full = await onRequestVersion(versionNumber);
      if (full) {
        setLoaded((prev) => new Map(prev).set(versionNumber, full));
      }
      setLoading(false);
    }
  }

  const versionA = selected[0] !== undefined ? loaded.get(selected[0]) : undefined;
  const versionB = selected[1] !== undefined ? loaded.get(selected[1]) : undefined;

  return (
    <div className="flex flex-col gap-8">
      {/* Instructions */}
      {selected.length < 2 && (
        <p className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-300">
          {selected.length === 0
            ? 'Select two versions below to compare them side by side.'
            : 'Select one more version to start the comparison.'}
        </p>
      )}

      {/* Comparison panel */}
      {versionA && versionB && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Comparing v{Math.min(versionA.versionNumber, versionB.versionNumber)} → v
              {Math.max(versionA.versionNumber, versionB.versionNumber)}
            </h2>
            <button
              type="button"
              onClick={() => setSelected([])}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              Clear
            </button>
          </div>
          <VersionComparison versionA={versionA} versionB={versionB} />
        </div>
      )}

      {loading && (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading version…</p>
      )}

      {/* Timeline with interactive checkboxes */}
      <div onChange={(e) => {
        const input = e.target as HTMLInputElement;
        if (input.name === 'compare') {
          handleCheckChange(Number(input.value), input.checked);
        }
      }}>
        <VersionTimeline
          versions={versions}
          articleSlug={articleSlug}
          selectedVersions={selected}
        />
      </div>
    </div>
  );
}
