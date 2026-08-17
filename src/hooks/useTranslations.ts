'use client';

import { useContext } from 'react';
import { TranslationsContext, type TranslationsContextValue } from '@/i18n/TranslationsProvider';

/**
 * Client-side access to the active locale and its dictionary.
 *
 * Throws when used outside `TranslationsProvider`. That is deliberate: a Client
 * Component rendering untranslated strings because the provider is missing is a
 * bug that should surface in development, not a silent English fallback.
 */
export function useTranslations(): TranslationsContextValue {
  const context = useContext(TranslationsContext);

  if (!context) {
    throw new Error(
      'useTranslations must be used inside a <TranslationsProvider>. ' +
        'The site layout provides it for every route under src/app/[locale].'
    );
  }

  return context;
}
