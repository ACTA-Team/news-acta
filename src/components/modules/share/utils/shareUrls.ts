import type { SharePlatform } from '@/components/modules/share/constants';
import { SHARE_UTM } from '@/components/modules/share/constants';

/**
 * Per-platform share URL builders.
 *
 * Note on Instagram: it has no official web deep-link to share a
 * pre-filled URL. The strategy is to generate an optimized OG image
 * and copy the link to the clipboard so the user can paste it into Stories.
 */

interface ShareTarget {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  via?: string;
}

function withUtm(url: string, platform: SharePlatform): string {
  const u = new URL(url);
  u.searchParams.set('utm_source', SHARE_UTM.source);
  u.searchParams.set('utm_medium', SHARE_UTM.medium);
  u.searchParams.set('utm_campaign', platform);
  return u.toString();
}

export function buildXShareUrl({ url, title, hashtags, via }: ShareTarget): string {
  const tracked = withUtm(url, 'x');
  const params = new URLSearchParams({ text: title, url: tracked });
  if (hashtags?.length) params.set('hashtags', hashtags.join(','));
  if (via) params.set('via', via.replace(/^@/, ''));
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function buildLinkedInShareUrl({ url }: ShareTarget): string {
  const tracked = withUtm(url, 'linkedin');
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(tracked)}`;
}

export function buildInstagramShareUrl({ url }: ShareTarget): string {
  // Instagram has no direct share URL — return the tracked link
  // so the component can copy it to the clipboard.
  return withUtm(url, 'instagram');
}
