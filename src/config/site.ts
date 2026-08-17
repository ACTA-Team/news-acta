/**
 * Global site configuration.
 *
 * Single source of truth for: name, canonical URL, social handles,
 * default metadata and OG images. Changing something here propagates
 * to metadata, sitemap, RSS, share buttons and OG images.
 *
 * `url` is the canonical origin and carries no locale: every locale lives under
 * a path prefix of the same origin. Anything that is worded differently per
 * language (the site description, the nav labels) is keyed by locale here or
 * looked up in the dictionaries via the keys below.
 */

import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/i18n/config';
import type { DictionaryKey } from '@/i18n/translate';

/** Nav entries carry a dictionary key rather than a literal label. */
export interface SiteNavItem {
  /** Unprefixed path; the locale segment is added at render time. */
  href: string;
  labelKey: DictionaryKey;
}

const descriptions: Record<Locale, string> = {
  en: 'Official ACTA blog: announcements, monthly reviews, product updates and strategic articles from the ecosystem.',
  es: 'Blog oficial de ACTA: anuncios, resúmenes mensuales, novedades de producto y artículos estratégicos del ecosistema.',
};

export const siteConfig = {
  name: 'ACTA News',
  shortName: 'ACTA',

  /** Per-locale meta description. Read through {@link siteDescription}. */
  descriptions,

  url: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://news.acta.build',
  defaultOgImage: '/og/default.png',

  social: {
    website: {
      url: 'https://acta.build/',
    },
    x: {
      handle: '@ActaXyz',
      url: 'https://x.com/ActaXyz',
    },
    instagram: {
      handle: '@acta.xyz',
      url: 'https://www.instagram.com/acta.xyz',
    },
    github: {
      handle: 'ACTA-Team',
      url: 'https://github.com/ACTA-Team',
    },
  },

  nav: [
    { href: '/news', labelKey: 'nav.news' },
    { href: '/monthly-review', labelKey: 'nav.monthlyReview' },
    { href: '/authors', labelKey: 'nav.authors' },
  ] satisfies SiteNavItem[],
} as const;

export type SiteConfig = typeof siteConfig;

/** The meta description for a locale, falling back to the default language. */
export function siteDescription(locale: Locale): string {
  return descriptions[locale] ?? descriptions[DEFAULT_LOCALE];
}

/** The RSS path for one locale: each feed lives under its own locale prefix. */
export function rssPath(locale: Locale): string {
  return `/${locale}/rss.xml`;
}

/** Every feed path, for `<link rel="alternate">` and the footer. */
export const rssPaths: Record<Locale, string> = LOCALES.reduce(
  (acc, locale) => {
    acc[locale] = rssPath(locale);
    return acc;
  },
  {} as Record<Locale, string>
);
