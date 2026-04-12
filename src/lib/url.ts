import { siteConfig } from '@/config/site';

/**
 * URL helpers. Any absolute-path resolution goes through here so that
 * domain changes are a single diff.
 */

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${siteConfig.url}${normalized}`;
}

export function canonicalNewsUrl(slug: string): string {
  return absoluteUrl(`/news/${slug}`);
}

export function canonicalMonthlyReviewUrl(period: string): string {
  return absoluteUrl(`/monthly-review/${period}`);
}
