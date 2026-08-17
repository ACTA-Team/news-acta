/**
 * Shared translation types.
 *
 * Every localized entity carries the same three-part answer to "what language am
 * I looking at?": the locale that was requested, the locale actually rendered,
 * and which locales exist at all. The UI needs all three to decide between
 * showing nothing, showing a "not translated yet" note, or offering a switcher.
 */

import type { Locale } from '@/i18n/config';

export interface LocalizedContent {
  /** The locale actually rendered. Equals the source locale on a fallback. */
  locale: Locale;
  /** The locale the entity was originally written in. */
  sourceLocale: Locale;
  /** False when the reader is seeing the source because no translation exists. */
  isTranslated: boolean;
  /** Every locale this entity can be read in, source included. */
  availableLocales: Locale[];
}

/**
 * Freshness of one translation relative to its source.
 *
 *   missing  no row exists for this locale
 *   stale    a row exists, but the source has changed since it was written
 *   current  the stored source hash still matches the source
 */
export type TranslationStatus = 'missing' | 'stale' | 'current';

export interface TranslationStatusEntry {
  locale: Locale;
  status: TranslationStatus;
  /** Null when `status` is 'missing'. */
  updatedAt: string | null;
  translatedBy: string | null;
}

/** Per-locale status for one entity, as the admin list and editor consume it. */
export type TranslationStatusMap = Record<Locale, TranslationStatusEntry>;

/** One editable article translation, as the admin editor loads and saves it. */
export interface ArticleTranslationDraft {
  articleId: string;
  locale: Locale;
  slug: string;
  title: string;
  summary: string;
  content: string;
}

export interface ArticleTranslationRecord extends ArticleTranslationDraft {
  id: string;
  sourceContentHash: string;
  translatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  /** True when `sourceContentHash` no longer matches the article's current hash. */
  isStale: boolean;
}

/**
 * The source side of the translation editor: read-only, and the hash every
 * saved translation is stamped with.
 */
export interface ArticleTranslationSource {
  articleId: string;
  sourceLocale: Locale;
  slug: string;
  title: string;
  summary: string;
  content: string;
  translationSourceHash: string;
  status: string;
}

/** Which individual fields changed since the translation was written. */
export interface TranslationFieldStaleness {
  title: boolean;
  summary: boolean;
  content: boolean;
}
