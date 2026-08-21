/** Unprefixed paths. Wrap with `withLocale(locale, ...)` before rendering. */
export const CREDENTIAL_ROUTES = {
  verify: (vcId: string) => `/verify/${vcId}`,
} as const;
