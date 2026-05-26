/**
 * Diff service for article versioning.
 *
 * Computes a structured `ArticleVersionDiffSummary` between two article
 * snapshots. Uses the `diff` package for character-level content analysis.
 * The result is stored as JSONB on `article_versions.diff_summary`.
 */

import { diffChars, diffWords } from 'diff';
import type { ArticleVersionDiffSummary } from '@/@types/news';

interface VersionableFields {
  title: string;
  summary: string;
  content: string;
  category: string;
}

/**
 * Compute a structured diff between two article snapshots.
 *
 * @param oldVersion — the state before the edit (what was snapshotted)
 * @param newVersion — the state after the edit (what was just saved)
 */
export function computeArticleDiff(
  oldVersion: VersionableFields,
  newVersion: VersionableFields,
): ArticleVersionDiffSummary {
  const fieldsChanged: string[] = [];

  if (oldVersion.title !== newVersion.title) fieldsChanged.push('title');
  if (oldVersion.summary !== newVersion.summary) fieldsChanged.push('summary');
  if (oldVersion.category !== newVersion.category) fieldsChanged.push('category');

  let contentAdded = 0;
  let contentRemoved = 0;
  let sectionsModified = 0;

  if (oldVersion.content !== newVersion.content) {
    fieldsChanged.push('content');

    // Character-level counts
    const charDiff = diffChars(oldVersion.content, newVersion.content);
    for (const part of charDiff) {
      if (part.added) contentAdded += part.count ?? 0;
      if (part.removed) contentRemoved += part.count ?? 0;
    }

    // Paragraph-level section count: split on double newlines or closing block tags
    const oldParagraphs = splitIntoParagraphs(oldVersion.content);
    const newParagraphs = splitIntoParagraphs(newVersion.content);

    // Use word-level diff on the paragraph array joined by sentinel to count changed blocks
    const paragraphDiff = diffWords(oldParagraphs.join('\n¶\n'), newParagraphs.join('\n¶\n'));
    for (const part of paragraphDiff) {
      if (part.added || part.removed) {
        // Count paragraph sentinels that changed
        const count = (part.value.match(/¶/g) ?? []).length + 1;
        sectionsModified += count;
      }
    }
    // Cap at the max number of paragraphs between the two versions
    sectionsModified = Math.min(sectionsModified, Math.max(oldParagraphs.length, newParagraphs.length));
  }

  return {
    fieldsChanged,
    contentAdded,
    contentRemoved,
    sectionsModified,
  };
}

/** Split content into paragraph-level blocks (handles HTML and plain text). */
function splitIntoParagraphs(content: string): string[] {
  return content
    .split(/\n\n+|(?<=<\/p>)|(?<=<\/li>)|(?<=<\/h[1-6]>)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
