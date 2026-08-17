'use client';

/**
 * Carries the active locale and its dictionary to Client Components.
 *
 * The site layout is a Server Component: it loads the dictionary once and hands
 * it down through this provider, so a Client Component deeper in the tree never
 * has to fetch translations or import both locales.
 */

import { createContext, useMemo, type ReactNode } from 'react';
import type { Locale } from './config';
import { createTranslator, type Dictionary, type Translator } from './translate';

export interface TranslationsContextValue {
  locale: Locale;
  dictionary: Dictionary;
  t: Translator;
}

export const TranslationsContext = createContext<TranslationsContextValue | null>(null);

interface TranslationsProviderProps {
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
}

export function TranslationsProvider({ locale, dictionary, children }: TranslationsProviderProps) {
  const value = useMemo<TranslationsContextValue>(
    () => ({ locale, dictionary, t: createTranslator(dictionary) }),
    [locale, dictionary]
  );

  return <TranslationsContext.Provider value={value}>{children}</TranslationsContext.Provider>;
}
