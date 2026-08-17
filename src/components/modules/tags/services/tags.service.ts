import type { Tag } from '@/@types/tag';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/config';
import type { Database, TypedSupabaseClient } from '@/lib/supabase';
import {
  isMissingSchemaCacheError,
  warnMissingMigrationsOnce,
} from '@/lib/supabase/postgrestError';

type TagRow = Database['public']['Tables']['tags']['Row'];

interface EmbeddedTagTranslation {
  locale: Locale;
  label: string;
  description: string | null;
}

type TagRowWithTranslations = TagRow & {
  translations: EmbeddedTagTranslation[] | null;
};

/**
 * A tag's slug is its identity in every language, so only the label and the
 * description come from `tag_translations`.
 */
const TAG_SELECT = `
  slug, label, description,
  translations:tag_translations ( locale, label, description )
` as const;

function mapTag(row: TagRowWithTranslations, requested: Locale, postCount?: number): Tag {
  const match = (row.translations ?? []).find(
    (translation) => isLocale(translation.locale) && translation.locale === requested
  );

  const availableLocales = [
    DEFAULT_LOCALE,
    ...(row.translations ?? [])
      .map((translation) => translation.locale)
      .filter((locale): locale is Locale => isLocale(locale)),
  ];

  return {
    slug: row.slug,
    label: match?.label ?? row.label,
    description: match?.description ?? row.description ?? undefined,
    postCount,
    locale: match ? requested : DEFAULT_LOCALE,
    sourceLocale: DEFAULT_LOCALE,
    isTranslated: Boolean(match),
    availableLocales: [...new Set(availableLocales)],
  };
}

export async function fetchTags(
  supabase: TypedSupabaseClient,
  locale: Locale = DEFAULT_LOCALE
): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select(TAG_SELECT)
    .order('label', { ascending: true });

  if (error) {
    if (isMissingSchemaCacheError(error)) {
      warnMissingMigrationsOnce();
      return [];
    }
    throw error;
  }

  return ((data ?? []) as unknown as TagRowWithTranslations[]).map((row) => mapTag(row, locale));
}

export async function fetchTagBySlug(
  supabase: TypedSupabaseClient,
  slug: string,
  locale: Locale = DEFAULT_LOCALE
): Promise<Tag | null> {
  const { data, error } = await supabase
    .from('tags')
    .select(TAG_SELECT)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    if (isMissingSchemaCacheError(error)) {
      warnMissingMigrationsOnce();
      return null;
    }
    throw error;
  }
  if (!data) return null;

  return mapTag(data as unknown as TagRowWithTranslations, locale);
}
