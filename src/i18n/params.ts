/**
 * Route param helpers for the `[locale]` segment.
 *
 * Pages and `generateMetadata` both need the locale out of `params`, and both
 * need it narrowed from `string` to `Locale`. An unrecognized value resolves to
 * the default rather than throwing: the `[locale]` root layout already answers a
 * bad segment with a 404, so this only has to keep metadata generation from
 * blowing up on the way there.
 */

import { toLocale, type Locale } from './config';

/** Params every localized route receives, plus whatever else the route adds. */
export type LocaleParams<T = Record<never, never>> = Promise<{ locale: string } & T>;

export async function resolveLocale(params: LocaleParams): Promise<Locale> {
  const { locale } = await params;
  return toLocale(locale);
}

/** Resolves the locale and the rest of the params in one await. */
export async function resolveLocaleParams<T extends Record<string, string>>(
  params: LocaleParams<T>
): Promise<{ locale: Locale } & T> {
  const resolved = await params;
  return { ...resolved, locale: toLocale(resolved.locale) };
}
