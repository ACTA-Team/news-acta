'use client';

import { useState, useCallback } from 'react';
import { diffChars } from 'diff';
import type { ArticleVersion, ArticleComparisonView } from '@/@types/news';

interface VersionComparisonProps {
  versionA: ArticleVersion;
  versionB: ArticleVersion;
}

type DiffField = 'title' | 'summary' | 'content';

/**
 * Side-by-side diff viewer between two article versions.
 * Client component — uses the `diff` package for character-level highlighting.
 */
export function VersionComparison({ versionA, versionB }: VersionComparisonProps) {
  const [activeField, setActiveField] = useState<DiffField>('content');

  const older = versionA.versionNumber < versionB.versionNumber ? versionA : versionB;
  const newer = versionA.versionNumber < versionB.versionNumber ? versionB : versionA;

  const fields: { key: DiffField; label: string }[] = [
    { key: 'title', label: 'Title' },
    { key: 'summary', label: 'Summary' },
    { key: 'content', label: 'Content' },
  ];

  const renderDiff = useCallback(
    (oldText: string, newText: string) => {
      const parts = diffChars(oldText, newText);
      return parts.map((part, i) => {
        if (part.added) {
          return (
            <ins
              key={i}
              className="bg-emerald-100 text-emerald-900 no-underline dark:bg-emerald-900/40 dark:text-emerald-200"
            >
              {part.value}
            </ins>
          );
        }
        if (part.removed) {
          return (
            <del
              key={i}
              className="bg-red-100 text-red-900 no-underline dark:bg-red-900/40 dark:text-red-200"
            >
              {part.value}
            </del>
          );
        }
        return <span key={i}>{part.value}</span>;
      });
    },
    [],
  );

  const oldValue = older[activeField];
  const newValue = newer[activeField];

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
      {/* Field selector */}
      <div className="flex gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
        {fields.map(({ key, label }) => (
          <button
            key={key}
            id={`compare-tab-${key}`}
            type="button"
            onClick={() => setActiveField(key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeField === key
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Version headers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-300">
          v{older.versionNumber} — {formatTs(older.createdAt)}
        </div>
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
          v{newer.versionNumber} — {formatTs(newer.createdAt)}
        </div>
      </div>

      {/* Side-by-side panels */}
      <div className="grid grid-cols-2 gap-4">
        <pre className="overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
          {oldValue}
        </pre>
        <pre className="overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
          {renderDiff(oldValue, newValue)}
        </pre>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-red-100 dark:bg-red-900/40" />
          Removed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-emerald-100 dark:bg-emerald-900/40" />
          Added
        </span>
      </div>
    </div>
  );
}

function formatTs(ts: string) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
