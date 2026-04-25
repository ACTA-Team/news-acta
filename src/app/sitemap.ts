import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { fetchNewsList } from '@/components/modules/news';
import { fetchMonthlyReviews } from '@/components/modules/monthly-review';
import { createClient } from '@/lib/supabase/server';
import { absoluteUrl } from '@/lib/url';

/**
 * Dynamic sitemap. Regenerated using the App Router's own revalidation
 * strategy — once a day is enough for a blog.
 */
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: siteConfig.url, lastModified: new Date(), priority: 1 },
    { url: absoluteUrl('/news'), lastModified: new Date(), priority: 0.9 },
    {
      url: absoluteUrl('/monthly-review'),
      lastModified: new Date(),
      priority: 0.8,
    },
    { url: absoluteUrl('/authors'), lastModified: new Date(), priority: 0.5 },
    { url: absoluteUrl('/terms'), lastModified: new Date(), priority: 0.3 },
    { url: absoluteUrl('/privacy'), lastModified: new Date(), priority: 0.3 },
  ];

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return staticEntries;
  }

  const [news, reviews] = await Promise.all([
    fetchNewsList(supabase, { page: 1, pageSize: 200 }).catch(() => ({
      items: [],
      total: 0,
      page: 1,
      pageSize: 200,
    })),
    fetchMonthlyReviews(supabase).catch(() => []),
  ]);

  const newsEntries: MetadataRoute.Sitemap = news.items.map((article) => ({
    url: absoluteUrl(`/news/${article.slug}`),
    lastModified: new Date(article.updatedAt ?? article.publishedAt),
    priority: 0.7,
  }));

  const reviewEntries: MetadataRoute.Sitemap = reviews.map((r) => ({
    url: absoluteUrl(`/monthly-review/${r.period}`),
    lastModified: new Date(r.publishedAt),
    priority: 0.7,
  }));

  return [...staticEntries, ...newsEntries, ...reviewEntries];
}
