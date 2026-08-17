/**
 * Dictionary loading.
 *
 * Server-side only by convention: the dictionaries are imported dynamically so
 * a locale's JSON never reaches the client bundle of the other locale. Client
 * Components read the dictionary from `TranslationsProvider` instead of calling
 * `getDictionary` (see `src/hooks/useTranslations.ts`).
 *
 * `cache` dedupes the import within a single request, so a page and its layout
 * asking for the same locale pay for it once.
 */

import { cache } from 'react';
import { DEFAULT_LOCALE, type Locale } from './config';
import { createTranslator, type Dictionary, type Translator } from './translate';

const loaders = {
  en: () => import('./en.json').then((mod) => mod.default),
  es: () => import('./es.json').then((mod) => mod.default),
} as const satisfies Record<Locale, () => Promise<Dictionary>>;

/**
 * The dictionary for a locale.
 *
 * An unknown locale falls back to the default rather than throwing: a bad URL
 * segment is a 404 concern, not a reason to crash the render.
 */
export const getDictionary = cache(async (locale: Locale): Promise<Dictionary> => {
  const load = loaders[locale] ?? loaders[DEFAULT_LOCALE];
  return load();
});

/** The dictionary plus a translator bound to it, which is what pages actually want. */
export const getTranslations = cache(
  async (locale: Locale): Promise<{ dictionary: Dictionary; t: Translator }> => {
    const dictionary = await getDictionary(locale);
    return { dictionary, t: createTranslator(dictionary) };
  }
);

export type { Dictionary, Translator };
