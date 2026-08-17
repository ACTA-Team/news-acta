import type { MetadataRoute } from 'next';
import { fetchNewsSitemapEntries } from '@/components/modules/news';
import { fetchMonthlyReviews } from '@/components/modules/monthly-review';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/i18n/config';
import { createClient } from '@/lib/supabase/server';
import { localizedUrl } from '@/lib/url';

/**
 * Dynamic sitemap. Regenerated using the App Router's own revalidation
 * strategy: once a day is enough for a blog.
 *
 * Every URL is emitted once per locale, and each entry carries the full
 * `alternates.languages` map plus `x-default`. Google wants every alternate of a
 * page listed on every one of its variants, so the maps below intentionally
 * repeat rather than cross-reference.
 */
export const revalidate = 86400;

/** The unprefixed paths that exist in both languages regardless of content. */
const STATIC_PATHS: { path: string; priority: number }[] = [
  { path: '/', priority: 1 },
  { path: '/news', priority: 0.9 },
  { path: '/monthly-review', priority: 0.8 },
  { path: '/authors', priority: 0.5 },
  { path: '/terms', priority: 0.3 },
  { path: '/privacy', priority: 0.3 },
];

/**
 * The `alternates.languages` map for a path that is spelled the same in every
 * locale, plus the `x-default` pointer at the default language.
 */
function alternatesFor(pathByLocale: Partial<Record<Locale, string>>): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of LOCALES) {
    const path = pathByLocale[locale];
    if (path) languages[locale] = localizedUrl(locale, path);
  }

  const defaultPath = pathByLocale[DEFAULT_LOCALE];
  if (defaultPath) languages['x-default'] = localizedUrl(DEFAULT_LOCALE, defaultPath);

  return languages;
}

/** One entry per locale for a single logical page. */
function entriesForPath(
  pathByLocale: Partial<Record<Locale, string>>,
  lastModified: Date,
  priority: number
): MetadataRoute.Sitemap {
  const languages = alternatesFor(pathByLocale);

  return LOCALES.flatMap((locale) => {
    const path = pathByLocale[locale];
    if (!path) return [];
    return [
      {
        url: localizedUrl(locale, path),
        lastModified,
        priority,
        alternates: { languages },
      },
    ];
  });
}

/** The same path in every locale, for routes with no translated slug. */
function samePathEverywhere(path: string): Record<Locale, string> {
  return LOCALES.reduce(
    (acc, locale) => {
      acc[locale] = path;
      return acc;
    },
    {} as Record<Locale, string>
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.flatMap(({ path, priority }) =>
    entriesForPath(samePathEverywhere(path), now, priority)
  );

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return staticEntries;
  }

  const [articles, reviews] = await Promise.all([
    fetchNewsSitemapEntries(supabase, 500).catch(() => []),
    fetchMonthlyReviews(supabase).catch(() => []),
  ]);

  // A translated article has a different slug per locale, so its alternates
  // cannot be derived by swapping the prefix: they come from the database.
  const newsEntries: MetadataRoute.Sitemap = articles.flatMap((article) => {
    const pathByLocale: Partial<Record<Locale, string>> = {};
    for (const locale of LOCALES) {
      const slug = article.slugByLocale[locale];
      if (slug) pathByLocale[locale] = `/news/${slug}`;
    }
    return entriesForPath(pathByLocale, new Date(article.updatedAt), 0.7);
  });

  const reviewEntries: MetadataRoute.Sitemap = reviews.flatMap((review) =>
    entriesForPath(
      samePathEverywhere(`/monthly-review/${review.period}`),
      new Date(review.publishedAt),
      0.7
    )
  );

  return [...staticEntries, ...newsEntries, ...reviewEntries];
}
