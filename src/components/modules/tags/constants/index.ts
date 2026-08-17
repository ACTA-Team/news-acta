/** Unprefixed paths. Wrap with `withLocale(locale, ...)` before rendering. */
export const TAG_ROUTES = {
  detail: (slug: string) => `/tags/${slug}`,
} as const;
