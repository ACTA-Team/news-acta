/**
 * Locale configuration.
 *
 * Single source of truth for which languages the public site speaks. Anything
 * that needs to enumerate locales (routing, sitemap, hreflang, RSS, the admin
 * translation editor) imports from here instead of hardcoding 'en' / 'es'.
 *
 * The admin panel (`src/app/admin`) is deliberately excluded: it is an internal
 * tool and stays English only.
 */

export const LOCALES = ['en', 'es'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** BCP 47 tags, used for `<html lang>`, Open Graph and `Intl.*`. */
export const LOCALE_TAGS: Record<Locale, string> = {
  en: 'en-US',
  es: 'es-CR',
};

/** Open Graph wants underscores (`en_US`), not the hyphenated BCP 47 form. */
export const OG_LOCALES: Record<Locale, string> = {
  en: 'en_US',
  es: 'es_ES',
};

/** Native language names, used by the language switcher. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
};

/** Two-letter labels for the compact switcher on mobile. */
export const LOCALE_SHORT_NAMES: Record<Locale, string> = {
  en: 'EN',
  es: 'ES',
};

/**
 * Postgres text search configuration per locale. Mirrors the `case` in
 * `supabase/migrations/0007_i18n.sql`; kept here so the service layer and the
 * database cannot drift apart.
 */
export const LOCALE_TSV_CONFIG: Record<Locale, string> = {
  en: 'english',
  es: 'spanish',
};

/** Cookie written by the language switcher. It always wins over Accept-Language. */
export const LOCALE_COOKIE = 'acta-locale';

/** One year, in seconds. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Narrows an unknown value to a Locale, falling back to the default. */
export function toLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Every locale except the one given. Used by the language switcher. */
export function otherLocales(locale: Locale): Locale[] {
  return LOCALES.filter((candidate) => candidate !== locale);
}
