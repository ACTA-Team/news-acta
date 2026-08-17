import { ImageResponse } from 'next/og';
// Imported from the service directly rather than the module barrel: the barrel
// re-exports Server Component pages, and this route runs on the edge.
import { fetchNewsBySlug } from '@/components/modules/news/services/news.service';
import { createPublicClient } from '@/lib/supabase/public';
import { siteConfig } from '@/config/site';
import { toLocale } from '@/i18n/config';

/**
 * Dynamic OG image per article.
 *
 * This is the image X/LinkedIn/Instagram show when the link is pasted,
 * and it can also be used as a visual asset for Stories.
 *
 * The article is resolved for the URL's locale, so a Spanish link previews with
 * the Spanish title rather than the source one.
 *
 * `alt`, `size` and `contentType` are App Router conventions.
 */

export const runtime = 'edge';
export const alt = 'ACTA News article cover';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Params {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function OgImage({ params }: Params) {
  const { locale: rawLocale, slug } = await params;
  const locale = toLocale(rawLocale);
  const supabase = createPublicClient();
  const article = await fetchNewsBySlug(supabase, slug, locale);

  const title = article?.title ?? siteConfig.name;
  const category = article?.category ?? 'ACTA News';

  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 80,
        background: 'linear-gradient(135deg, #0a0a0a 0%, #18181b 50%, #27272a 100%)',
        color: 'white',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          fontSize: 28,
          textTransform: 'uppercase',
          letterSpacing: 6,
          opacity: 0.7,
        }}
      >
        {category}
      </div>

      <div
        style={{
          fontSize: 72,
          fontWeight: 700,
          lineHeight: 1.1,
          maxWidth: '90%',
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 24,
          opacity: 0.8,
        }}
      >
        <span>{siteConfig.name}</span>
        <span>{siteConfig.social.x.handle}</span>
      </div>
    </div>,
    { ...size }
  );
}
