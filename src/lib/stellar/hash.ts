import { createHash } from 'crypto';

export function computeArticleHash({
  title,
  summary,
  content,
  published_at,
}: {
  title: string;
  summary: string;
  content: string;
  published_at: string;
}): string {
  // Deterministic hash: concatenate fields in order
  const data = `${title}\n${summary}\n${content}\n${published_at}`;
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Hash of the fields a translator actually reads.
 *
 * Mirrors the `news_articles.translation_source_hash` generated column in
 * `supabase/migrations/0007_i18n.sql` byte for byte, so a value computed here
 * can be compared against one computed by Postgres. A translation stores the
 * hash it was written against; when the source no longer matches, the
 * translation is stale.
 *
 * Deliberately excludes `published_at`, unlike {@link computeArticleHash}:
 * rescheduling a post does not change a single word a reader sees, so it must
 * not invalidate the translations.
 */
export function computeTranslationSourceHash({
  title,
  summary,
  content,
}: {
  title: string;
  summary: string;
  content: string;
}): string {
  const data = `${title}\n${summary}\n${content}`;
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

/** sha256 of a single field, used for per-field staleness markers. */
export function computeFieldHash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

/**
 * Per-field hashes of an article's translatable prose. Stored alongside the
 * aggregate hash so the translation editor can say *which* fields moved, not
 * just that something did.
 */
export function computeTranslationFieldHashes({
  title,
  summary,
  content,
}: {
  title: string;
  summary: string;
  content: string;
}): { title: string; summary: string; content: string } {
  return {
    title: computeFieldHash(title),
    summary: computeFieldHash(summary),
    content: computeFieldHash(content),
  };
}

/**
 * Hash of a monthly review's translatable prose. Mirrors
 * `monthly_reviews.translation_source_hash`.
 */
export function computeReviewTranslationSourceHash({
  title,
  summary,
}: {
  title: string;
  summary: string;
}): string {
  return createHash('sha256').update(`${title}\n${summary}`, 'utf8').digest('hex');
}
