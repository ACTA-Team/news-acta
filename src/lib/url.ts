import { siteConfig } from '@/config/site';
import { LOCALES, type Locale } from '@/i18n/config';
import { withLocale } from '@/i18n/routing';

/**
 * URL helpers. Any absolute-path resolution goes through here so that
 * domain changes are a single diff.
 *
 * There are two families: the plain ones take a path exactly as given, and the
 * `localized*` ones prepend a locale segment first. Callers building canonical
 * URLs, hreflang alternates, feeds or share links want the localized family.
 */

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${siteConfig.url}${normalized}`;
}

/** Absolute URL for an unprefixed path under one locale. */
export function localizedUrl(locale: Locale, path: string): string {
  return absoluteUrl(withLocale(locale, path));
}

/**
 * Absolute URL per locale for one unprefixed path.
 *
 * This is the shape `alternates.languages` wants, so metadata builders can hand
 * the result straight to Next.
 */
export function localizedUrls(path: string): Record<Locale, string> {
  return LOCALES.reduce(
    (acc, locale) => {
      acc[locale] = localizedUrl(locale, path);
      return acc;
    },
    {} as Record<Locale, string>
  );
}

export function canonicalNewsUrl(slug: string, locale: Locale): string {
  return localizedUrl(locale, `/news/${slug}`);
}

export function canonicalMonthlyReviewUrl(period: string, locale: Locale): string {
  return localizedUrl(locale, `/monthly-review/${period}`);
}
