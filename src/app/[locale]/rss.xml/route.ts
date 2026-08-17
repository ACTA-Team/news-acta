import { siteConfig, siteDescription } from '@/config/site';
import { fetchNewsList } from '@/components/modules/news';
import { LOCALE_TAGS, LOCALES, toLocale, type Locale } from '@/i18n/config';
import { createClient } from '@/lib/supabase/server';
import { localizedUrl } from '@/lib/url';

/**
 * RSS 2.0 feed, one per locale.
 *
 * `/en/rss.xml` carries the English titles and summaries, `/es/rss.xml` the
 * Spanish ones, and each declares its own `<language>`. An article with no
 * translation still appears in both feeds, in its source language, because a
 * subscriber would rather see it late-translated than not at all.
 *
 * Revalidation aligned with the news service interval.
 */
export const revalidate = 1800;

/** Both feeds are prerendered, same as the pages. */
export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }));
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = toLocale(raw);

  let items: Awaited<ReturnType<typeof fetchNewsList>>['items'] = [];
  try {
    const supabase = await createClient();
    ({ items } = await fetchNewsList(supabase, { page: 1, pageSize: 30 }, locale).catch(() => ({
      items: [],
      total: 0,
      page: 1,
      pageSize: 30,
    })));
  } catch {
    items = [];
  }

  const rssItems = items
    .map((article) => {
      const link = localizedUrl(locale, `/news/${article.slug}`);
      // An untranslated item is tagged with the language it is actually in, so a
      // reader's client can tell them apart from the rest of the feed.
      const itemLanguage =
        article.locale === locale ? '' : `\n          <dc:language>${article.locale}</dc:language>`;

      return `
        <item>
          <title>${escapeXml(article.title)}</title>
          <link>${link}</link>
          <guid isPermaLink="true">${link}</guid>
          <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
          <description>${escapeXml(article.summary)}</description>${itemLanguage}
        </item>
      `;
    })
    .join('');

  const selfUrl = localizedUrl(locale, '/rss.xml');
  const alternateLinks = LOCALES.filter((candidate) => candidate !== locale)
    .map(
      (candidate) =>
        `    <atom:link rel="alternate" hreflang="${candidate}" type="application/rss+xml" href="${localizedUrl(
          candidate,
          '/rss.xml'
        )}" />`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${localizedUrl(locale, '/')}</link>
    <description>${escapeXml(siteDescription(locale))}</description>
    <language>${LOCALE_TAGS[locale]}</language>
    <atom:link rel="self" type="application/rss+xml" href="${selfUrl}" />
${alternateLinks}
    ${rssItems}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
