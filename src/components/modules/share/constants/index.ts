export const SHARE_PLATFORMS = ['x', 'instagram', 'linkedin', 'copy'] as const;
export type SharePlatform = (typeof SHARE_PLATFORMS)[number];

export const SHARE_UTM = {
  source: 'acta-news',
  medium: 'social',
} as const;
