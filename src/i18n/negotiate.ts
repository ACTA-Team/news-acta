/**
 * Locale negotiation.
 *
 * Precedence, highest first:
 *   1. the `acta-locale` cookie (an explicit choice made in the switcher)
 *   2. the `Accept-Language` header, by descending quality
 *   3. DEFAULT_LOCALE
 *
 * Kept free of `next/*` imports so the proxy and the unit tests can both call
 * it with plain strings.
 */

import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from './config';

interface AcceptLanguageEntry {
  tag: string;
  quality: number;
}

/**
 * Parses an `Accept-Language` value into entries sorted by descending quality.
 * Malformed entries are dropped rather than throwing: a bad header should never
 * take a page down.
 */
export function parseAcceptLanguage(header: string | null | undefined): AcceptLanguageEntry[] {
  if (!header) return [];

  return header
    .split(',')
    .map((part, index) => {
      const [rawTag, ...params] = part.trim().split(';');
      const tag = rawTag.trim().toLowerCase();
      if (!tag) return null;

      const qParam = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      const parsed = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
      const quality = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 1) : 1;

      // `index` keeps the original order stable for equal qualities, which is
      // what the RFC asks for and what browsers actually rely on.
      return { tag, quality, index };
    })
    .filter((entry): entry is AcceptLanguageEntry & { index: number } => entry !== null)
    .filter((entry) => entry.quality > 0)
    .sort((a, b) => (b.quality === a.quality ? a.index - b.index : b.quality - a.quality))
    .map(({ tag, quality }) => ({ tag, quality }));
}

/**
 * The best supported locale for an `Accept-Language` header, or null.
 *
 * Matching is on the primary subtag, so `es-419`, `es-CR` and `es` all resolve
 * to 'es'. A wildcard (`*`) resolves to the default locale, which is what a
 * client saying "anything goes" should get.
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  for (const { tag } of parseAcceptLanguage(header)) {
    if (tag === '*') return DEFAULT_LOCALE;

    const primary = tag.split('-')[0];
    const match = LOCALES.find((locale) => locale === primary);
    if (match) return match;
  }

  return null;
}

/** The cookie value, when it names a locale we actually support. */
export function localeFromCookie(value: string | null | undefined): Locale | null {
  return isLocale(value) ? value : null;
}

export interface NegotiateInput {
  /** Raw `acta-locale` cookie value, if any. */
  cookie?: string | null;
  /** Raw `Accept-Language` header value, if any. */
  acceptLanguage?: string | null;
}

/**
 * Resolves the locale for a request that carries no locale in its path.
 *
 * Always returns a supported locale: an unknown cookie value or an
 * `Accept-Language` listing only unsupported languages falls back to the
 * default rather than 404ing.
 */
export function negotiateLocale({ cookie, acceptLanguage }: NegotiateInput): Locale {
  return localeFromCookie(cookie) ?? localeFromAcceptLanguage(acceptLanguage) ?? DEFAULT_LOCALE;
}
