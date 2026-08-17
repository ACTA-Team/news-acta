import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

/**
 * One sitemap covers every locale: `src/app/sitemap.ts` emits an entry per
 * locale with the hreflang alternates attached, which is the shape Google
 * prefers over one sitemap per language.
 *
 * The admin panel and the API are disallowed. Both already refuse anonymous
 * requests, so this is about not wasting crawl budget rather than about access
 * control.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
