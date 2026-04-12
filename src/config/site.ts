/**
 * Global site configuration.
 *
 * Single source of truth for: name, canonical URL, social handles,
 * default metadata and OG images. Changing something here propagates
 * to metadata, sitemap, RSS, share buttons and OG images.
 */

export const siteConfig = {
  name: 'ACTA News',
  shortName: 'ACTA',
  description:
    'Official ACTA blog: announcements, monthly reviews, product updates and strategic articles from the ecosystem.',
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    'https://news.acta.build',
  locale: 'en-US',
  defaultOgImage: '/og/default.png',

  social: {
    x: {
      handle: '@acta_build',
      url: 'https://x.com/acta_build',
    },
    instagram: {
      handle: '@acta.build',
      url: 'https://instagram.com/acta.build',
    },
    github: {
      handle: 'acta-build',
      url: 'https://github.com/acta-build',
    },
  },

  nav: [
    { label: 'News', href: '/news' },
    { label: 'Monthly Review', href: '/monthly-review' },
    { label: 'Authors', href: '/authors' },
  ],

  rssPath: '/rss.xml',
} as const;

export type SiteConfig = typeof siteConfig;
