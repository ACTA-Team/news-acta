import { siteConfig } from '@/config/site';
import { fetchNewsList } from '@/components/modules/news';
import { createClient } from '@/lib/supabase/server';
import { absoluteUrl } from '@/lib/url';

/**
 * RSS 2.0 feed. Consumed from the footer and from external readers.
 * Revalidation aligned with the news service interval.
 */
export const revalidate = 1800;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const supabase = await createClient();
  const { items } = await fetchNewsList(supabase, {
    page: 1,
    pageSize: 30,
  }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 30 }));

  const rssItems = items
    .map((article) => {
      const link = absoluteUrl(`/news/${article.slug}`);
      return `
        <item>
          <title>${escapeXml(article.title)}</title>
          <link>${link}</link>
          <guid isPermaLink="true">${link}</guid>
          <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
          <description>${escapeXml(article.summary)}</description>
        </item>
      `;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${siteConfig.url}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>${siteConfig.locale}</language>
    ${rssItems}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
