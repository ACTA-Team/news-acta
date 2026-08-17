/** Unprefixed paths. Wrap with `withLocale(locale, ...)` before rendering. */
export const AUTHOR_ROUTES = {
  index: '/authors',
  detail: (slug: string) => `/authors/${slug}`,
} as const;
