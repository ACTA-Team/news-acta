import type { Metadata } from 'next';
import { siteConfig, siteDescription } from '@/config/site';
import {
  DEFAULT_LOCALE,
  LOCALE_TAGS,
  LOCALES,
  OG_LOCALES,
  otherLocales,
  type Locale,
} from '@/i18n/config';
import { absoluteUrl, localizedUrl } from '@/lib/url';

/**
 * Centralized builder for Next `Metadata`.
 *
 * Rule: no page builds its own `Metadata` by hand. Use this helper
 * so Open Graph + Twitter Cards stay consistent across the whole blog.
 *
 * Every page is bilingual, so the builder always emits:
 *   - a canonical URL under the page's own locale
 *   - `alternates.languages` with one entry per locale plus `x-default`
 *   - `openGraph.locale` for the page and `alternateLocale` for the others
 *
 * `alternates` accepts an explicit per-locale path map for the case that breaks
 * the naive "swap the prefix" rule: a translated article whose slug differs per
 * language, or one that has no translation at all and therefore no URL in the
 * other locale.
 */

interface BuildMetadataArgs {
  title: string;
  description?: string;
  /** Unprefixed path, e.g. '/news/my-article'. The locale segment is added here. */
  path: string;
  locale: Locale;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  tags?: string[];
  /**
   * Per-locale unprefixed paths, when they are not all the same. A locale
   * omitted from the map gets no hreflang entry, which is the correct signal for
   * "this page does not exist in that language".
   */
  alternatePaths?: Partial<Record<Locale, string>>;
  /** Set on pages that must never be indexed. */
  noIndex?: boolean;
}

/**
 * hreflang map for one page.
 *
 * `x-default` points at the default locale, which is what Google serves to a
 * visitor whose language does not match any alternate.
 */
function buildLanguageAlternates(
  path: string,
  alternatePaths: Partial<Record<Locale, string>> | undefined
): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of LOCALES) {
    const localePath = alternatePaths ? alternatePaths[locale] : path;
    if (!localePath) continue;
    languages[locale] = localizedUrl(locale, localePath);
  }

  const defaultPath = alternatePaths ? alternatePaths[DEFAULT_LOCALE] : path;
  if (defaultPath) {
    languages['x-default'] = localizedUrl(DEFAULT_LOCALE, defaultPath);
  }

  return languages;
}

export function buildMetadata({
  title,
  description,
  path,
  locale,
  image,
  type = 'website',
  publishedTime,
  modifiedTime,
  authors,
  tags,
  alternatePaths,
  noIndex,
}: BuildMetadataArgs): Metadata {
  const canonicalPath = alternatePaths?.[locale] ?? path;
  const url = localizedUrl(locale, canonicalPath);
  const ogImage = image ? absoluteUrl(image) : absoluteUrl(siteConfig.defaultOgImage);
  const resolvedDescription = description ?? siteDescription(locale);

  return {
    metadataBase: new URL(siteConfig.url),
    title: `${title} · ${siteConfig.name}`,
    description: resolvedDescription,
    alternates: {
      canonical: url,
      languages: buildLanguageAlternates(path, alternatePaths),
    },
    openGraph: {
      type,
      url,
      siteName: siteConfig.name,
      title,
      description: resolvedDescription,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      locale: OG_LOCALES[locale],
      alternateLocale: otherLocales(locale).map((other) => OG_LOCALES[other]),
      ...(type === 'article' ? { publishedTime, modifiedTime, authors, tags } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      site: siteConfig.social.x.handle,
      creator: siteConfig.social.x.handle,
      title,
      description: resolvedDescription,
      images: [ogImage],
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

/**
 * Metadata for the admin panel.
 *
 * The admin interface is English only and must never be indexed, so it gets no
 * canonical URL, no hreflang alternates and no Open Graph card: emitting any of
 * those would advertise an internal tool to crawlers.
 */
export function buildAdminMetadata({
  title,
  description,
}: {
  title: string;
  description?: string;
}): Metadata {
  return {
    title: `${title} · ${siteConfig.name}`,
    description,
    robots: { index: false, follow: false },
  };
}

/** The BCP 47 tag for `<html lang>`. */
export function htmlLang(locale: Locale): string {
  return LOCALE_TAGS[locale];
}
