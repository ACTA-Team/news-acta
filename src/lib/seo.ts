import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { absoluteUrl } from '@/lib/url';

/**
 * Centralized builder for Next `Metadata`.
 *
 * Rule: no page builds its own `Metadata` by hand. Use this helper
 * so Open Graph + Twitter Cards stay consistent across the whole blog.
 */

interface BuildMetadataArgs {
  title: string;
  description?: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  tags?: string[];
}

export function buildMetadata({
  title,
  description,
  path,
  image,
  type = 'website',
  publishedTime,
  modifiedTime,
  authors,
  tags,
}: BuildMetadataArgs): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image ? absoluteUrl(image) : absoluteUrl(siteConfig.defaultOgImage);
  const resolvedDescription = description ?? siteConfig.description;

  return {
    metadataBase: new URL(siteConfig.url),
    title: `${title} · ${siteConfig.name}`,
    description: resolvedDescription,
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      siteName: siteConfig.name,
      title,
      description: resolvedDescription,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      locale: siteConfig.locale,
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
  };
}
