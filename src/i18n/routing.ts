/**
 * Pure helpers for locale-prefixed paths.
 *
 * Every public URL carries its locale as the first segment (`/en/news`,
 * `/es/news`). These helpers are the only place that knows that, so the rest of
 * the app can keep passing unprefixed paths around ('/news', '/news/my-slug')
 * and let the boundary add the prefix.
 *
 * No `next/*` imports here on purpose: the proxy, Server Components, Client
 * Components and the tests all share this file.
 */

import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from './config';

/** Paths that never get a locale prefix. */
const UNLOCALIZED_PREFIXES = [
  '/admin',
  '/api',
  '/auth',
  '/_next',
  '/og',
  '/robots.txt',
  '/sitemap.xml',
  '/favicon.ico',
  // The unprefixed feed URL, kept alive by a redirect in src/app/rss.xml/route.ts.
  '/rss.xml',
] as const;

/** True when the path must stay outside the `[locale]` segment. */
export function isUnlocalizedPath(pathname: string): boolean {
  return UNLOCALIZED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** The locale encoded in the first path segment, or null when absent. */
export function localeFromPathname(pathname: string): Locale | null {
  const [, first] = pathname.split('/');
  return isLocale(first) ? first : null;
}

/**
 * The path with its locale prefix removed, always starting with '/'.
 *
 *   '/es/news/foo' -> '/news/foo'
 *   '/es'          -> '/'
 *   '/news/foo'    -> '/news/foo'
 */
export function stripLocale(pathname: string): string {
  const locale = localeFromPathname(pathname);
  if (!locale) return normalizePath(pathname);
  const rest = pathname.slice(`/${locale}`.length);
  return normalizePath(rest);
}

/**
 * The same path under a different locale.
 *
 *   withLocale('es', '/news')     -> '/es/news'
 *   withLocale('es', '/en/news')  -> '/es/news'
 *   withLocale('es', '/')         -> '/es'
 */
export function withLocale(locale: Locale, pathname: string): string {
  const bare = stripLocale(pathname);
  return bare === '/' ? `/${locale}` : `/${locale}${bare}`;
}

/** Every locale variant of an unprefixed path, keyed by locale. */
export function localeAlternates(pathname: string): Record<Locale, string> {
  const bare = stripLocale(pathname);
  return LOCALES.reduce(
    (acc, locale) => {
      acc[locale] = withLocale(locale, bare);
      return acc;
    },
    {} as Record<Locale, string>
  );
}

/** Guarantees a leading slash and no trailing slash (except for the root). */
export function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const withLeading = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (withLeading.length > 1 && withLeading.endsWith('/')) {
    return withLeading.slice(0, -1);
  }
  return withLeading;
}

/**
 * Splits a path into its locale prefix and the rest. Useful in the proxy, which
 * needs both halves to decide between a redirect and a pass-through.
 */
export function splitLocale(pathname: string): { locale: Locale | null; path: string } {
  return { locale: localeFromPathname(pathname), path: stripLocale(pathname) };
}

/**
 * Builds a locale-aware href factory. Components receive one of these instead
 * of concatenating strings, which keeps `/es/...` out of the JSX.
 */
export function createHref(locale: Locale) {
  return (pathname: string): string => withLocale(locale, pathname);
}

export type Href = ReturnType<typeof createHref>;

/** The default locale's prefix, handy in tests and in fallback branches. */
export const DEFAULT_LOCALE_PREFIX = `/${DEFAULT_LOCALE}`;
