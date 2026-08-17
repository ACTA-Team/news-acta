import type {
  ArticleTranslationDraft,
  ArticleTranslationRecord,
  ArticleTranslationSource,
  TranslationFieldStaleness,
  TranslationStatus,
  TranslationStatusEntry,
  TranslationStatusMap,
} from '@/@types/i18n';
import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from '@/i18n/config';
import { computeFieldHash, computeTranslationFieldHashes } from '@/lib/stellar/hash';
import type { Database, Json, TypedSupabaseClient } from '@/lib/supabase';

/**
 * Admin-side reads and writes for `article_translations`.
 *
 * Staleness is never stored as a flag. `news_articles.translation_source_hash` is
 * a generated column, so editing a source article changes it in the same
 * statement; a translation is stale exactly when the hash it was written against
 * no longer matches. That makes "editing the source marks its translations
 * stale" a property of the schema rather than something the application has to
 * remember to do.
 */

type ArticleRow = Database['public']['Tables']['news_articles']['Row'];
type TranslationRow = Database['public']['Tables']['article_translations']['Row'];

const TRANSLATION_COLUMNS = `
  id, article_id, locale, slug, title, summary, content,
  source_content_hash, source_field_hashes, translated_by, created_at, updated_at
` as const;

/** Per-field source hashes as stored in `source_field_hashes`. */
interface FieldHashes {
  title?: string;
  summary?: string;
  content?: string;
}

function readFieldHashes(value: Json | null | undefined): FieldHashes {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  return {
    title: typeof record.title === 'string' ? record.title : undefined,
    summary: typeof record.summary === 'string' ? record.summary : undefined,
    content: typeof record.content === 'string' ? record.content : undefined,
  };
}

function mapRecord(row: TranslationRow, currentSourceHash: string): ArticleTranslationRecord {
  return {
    id: row.id,
    articleId: row.article_id,
    locale: isLocale(row.locale) ? row.locale : DEFAULT_LOCALE,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: row.content,
    sourceContentHash: row.source_content_hash,
    translatedBy: row.translated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isStale: row.source_content_hash !== currentSourceHash,
  };
}

/**
 * Which individual fields moved since the translation was stamped.
 *
 * A translation written before `source_field_hashes` existed has no per-field
 * record. In that case the aggregate hash is the only evidence, so every field
 * is reported as stale rather than pretending nothing changed.
 */
export function fieldStaleness(
  fieldHashes: Json | null | undefined,
  source: Pick<ArticleTranslationSource, 'title' | 'summary' | 'content'>,
  isStale: boolean
): TranslationFieldStaleness {
  const stored = readFieldHashes(fieldHashes);

  if (!stored.title && !stored.summary && !stored.content) {
    return { title: isStale, summary: isStale, content: isStale };
  }

  return {
    title: stored.title !== computeFieldHash(source.title),
    summary: stored.summary !== computeFieldHash(source.summary),
    content: stored.content !== computeFieldHash(source.content),
  };
}

/** The read-only left-hand side of the translation editor. */
export async function fetchTranslationSource(
  supabase: TypedSupabaseClient,
  articleId: string
): Promise<ArticleTranslationSource | null> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('id, slug, title, summary, content, status, source_locale, translation_source_hash')
    .eq('id', articleId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as Pick<
    ArticleRow,
    | 'id'
    | 'slug'
    | 'title'
    | 'summary'
    | 'content'
    | 'status'
    | 'source_locale'
    | 'translation_source_hash'
  >;

  return {
    articleId: row.id,
    sourceLocale: isLocale(row.source_locale) ? row.source_locale : DEFAULT_LOCALE,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: row.content,
    translationSourceHash: row.translation_source_hash,
    status: row.status,
  };
}

/** Every stored translation for one article, keyed by locale. */
export async function fetchArticleTranslations(
  supabase: TypedSupabaseClient,
  articleId: string,
  currentSourceHash: string
): Promise<Partial<Record<Locale, ArticleTranslationRecord>>> {
  const { data, error } = await supabase
    .from('article_translations')
    .select(TRANSLATION_COLUMNS)
    .eq('article_id', articleId);

  if (error) throw error;

  const byLocale: Partial<Record<Locale, ArticleTranslationRecord>> = {};
  for (const row of (data ?? []) as unknown as TranslationRow[]) {
    if (!isLocale(row.locale)) continue;
    byLocale[row.locale] = mapRecord(row, currentSourceHash);
  }
  return byLocale;
}

/** The raw `source_field_hashes` per locale, for the editor's field markers. */
export async function fetchArticleTranslationFieldHashes(
  supabase: TypedSupabaseClient,
  articleId: string
): Promise<Partial<Record<Locale, Json>>> {
  const { data, error } = await supabase
    .from('article_translations')
    .select('locale, source_field_hashes')
    .eq('article_id', articleId);

  if (error) throw error;

  const byLocale: Partial<Record<Locale, Json>> = {};
  for (const row of data ?? []) {
    if (isLocale(row.locale)) byLocale[row.locale] = row.source_field_hashes;
  }
  return byLocale;
}

function statusOf(
  record: ArticleTranslationRecord | undefined,
  sourceLocale: Locale,
  locale: Locale
): TranslationStatus {
  // The source language is trivially current: there is nothing to translate.
  if (locale === sourceLocale) return 'current';
  if (!record) return 'missing';
  return record.isStale ? 'stale' : 'current';
}

/**
 * Per-locale translation status for one article, as the editor header and the
 * admin list column render it.
 */
export async function getTranslationStatus(
  supabase: TypedSupabaseClient,
  articleId: string
): Promise<TranslationStatusMap | null> {
  const source = await fetchTranslationSource(supabase, articleId);
  if (!source) return null;

  const translations = await fetchArticleTranslations(
    supabase,
    articleId,
    source.translationSourceHash
  );

  return LOCALES.reduce((acc, locale) => {
    const record = translations[locale];
    acc[locale] = {
      locale,
      status: statusOf(record, source.sourceLocale, locale),
      updatedAt: record?.updatedAt ?? null,
      translatedBy: record?.translatedBy ?? null,
    } satisfies TranslationStatusEntry;
    return acc;
  }, {} as TranslationStatusMap);
}

/**
 * Translation status for a whole list of articles in two queries.
 *
 * The admin news table shows a status per locale on every row; asking per row
 * would be one round trip per article.
 */
export async function getTranslationStatusForArticles(
  supabase: TypedSupabaseClient,
  articleIds: string[]
): Promise<Map<string, TranslationStatusMap>> {
  const result = new Map<string, TranslationStatusMap>();
  if (articleIds.length === 0) return result;

  const [
    { data: articles, error: articlesError },
    { data: translations, error: translationsError },
  ] = await Promise.all([
    supabase
      .from('news_articles')
      .select('id, source_locale, translation_source_hash')
      .in('id', articleIds),
    supabase
      .from('article_translations')
      .select('article_id, locale, source_content_hash, translated_by, updated_at')
      .in('article_id', articleIds),
  ]);

  if (articlesError) throw articlesError;
  if (translationsError) throw translationsError;

  const byArticle = new Map<
    string,
    { locale: Locale; sourceContentHash: string; translatedBy: string | null; updatedAt: string }[]
  >();

  for (const row of translations ?? []) {
    if (!isLocale(row.locale)) continue;
    const list = byArticle.get(row.article_id) ?? [];
    list.push({
      locale: row.locale,
      sourceContentHash: row.source_content_hash,
      translatedBy: row.translated_by,
      updatedAt: row.updated_at,
    });
    byArticle.set(row.article_id, list);
  }

  for (const article of articles ?? []) {
    const sourceLocale = isLocale(article.source_locale) ? article.source_locale : DEFAULT_LOCALE;
    const rows = byArticle.get(article.id) ?? [];

    result.set(
      article.id,
      LOCALES.reduce((acc, locale) => {
        const row = rows.find((entry) => entry.locale === locale);

        let status: TranslationStatus;
        if (locale === sourceLocale) status = 'current';
        else if (!row) status = 'missing';
        else
          status = row.sourceContentHash !== article.translation_source_hash ? 'stale' : 'current';

        acc[locale] = {
          locale,
          status,
          updatedAt: row?.updatedAt ?? null,
          translatedBy: row?.translatedBy ?? null,
        } satisfies TranslationStatusEntry;
        return acc;
      }, {} as TranslationStatusMap)
    );
  }

  return result;
}

export interface UpsertTranslationInput extends ArticleTranslationDraft {
  translatedBy: string;
}

/**
 * Creates or replaces one translation.
 *
 * The source hash is read inside this function rather than passed in, so a save
 * always stamps the version of the source the translator was actually looking
 * at as of the write, never a value the form carried from an earlier page load.
 */
export async function upsertTranslation(
  supabase: TypedSupabaseClient,
  input: UpsertTranslationInput
): Promise<void> {
  const source = await fetchTranslationSource(supabase, input.articleId);
  if (!source) throw new Error(`Article ${input.articleId} not found.`);

  if (input.locale === source.sourceLocale) {
    throw new Error(
      `Cannot store a ${input.locale} translation of an article already written in ${input.locale}. ` +
        'Edit the article itself instead.'
    );
  }

  const fieldHashes = computeTranslationFieldHashes({
    title: source.title,
    summary: source.summary,
    content: source.content,
  });

  const { error } = await supabase.from('article_translations').upsert(
    {
      article_id: input.articleId,
      locale: input.locale,
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      content: input.content,
      source_content_hash: source.translationSourceHash,
      source_field_hashes: fieldHashes as unknown as Json,
      translated_by: input.translatedBy,
    },
    { onConflict: 'article_id,locale' }
  );

  if (error) throw error;
}

export async function deleteTranslation(
  supabase: TypedSupabaseClient,
  articleId: string,
  locale: Locale
): Promise<void> {
  const { error } = await supabase
    .from('article_translations')
    .delete()
    .eq('article_id', articleId)
    .eq('locale', locale);

  if (error) throw error;
}

/**
 * Re-stamps a translation against the current source without touching its text.
 *
 * The "mark as up to date" action: a human has read the source diff and decided
 * the existing translation still says the right thing. Nothing else can clear a
 * stale flag, which is the point.
 */
export async function markTranslationCurrent(
  supabase: TypedSupabaseClient,
  articleId: string,
  locale: Locale
): Promise<void> {
  const source = await fetchTranslationSource(supabase, articleId);
  if (!source) throw new Error(`Article ${articleId} not found.`);

  const fieldHashes = computeTranslationFieldHashes({
    title: source.title,
    summary: source.summary,
    content: source.content,
  });

  const { error } = await supabase
    .from('article_translations')
    .update({
      source_content_hash: source.translationSourceHash,
      source_field_hashes: fieldHashes as unknown as Json,
    })
    .eq('article_id', articleId)
    .eq('locale', locale);

  if (error) throw error;
}
