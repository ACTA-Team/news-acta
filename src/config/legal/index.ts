/**
 * Shared legal copy (not legal advice: have counsel review for your entity).
 *
 * The Spanish translation in `./es.ts` carries a review notice at the top; read
 * it before shipping a change to either language.
 */

import { DEFAULT_LOCALE, type Locale } from '@/i18n/config';
import { legalCopyEn } from './en';
import { legalCopyEs } from './es';
import type { LegalCopy, LegalDocument } from './types';

/**
 * When the copy last changed, as an ISO instant.
 *
 * Noon UTC rather than midnight so that formatting it in any timezone the site
 * serves lands on the intended calendar day.
 */
export const LEGAL_LAST_UPDATED_ISO = '2026-04-24T12:00:00.000Z';

export const legalRoutes = {
  terms: '/terms',
  privacy: '/privacy',
} as const;

const copyByLocale: Record<Locale, LegalCopy> = {
  en: legalCopyEn,
  es: legalCopyEs,
};

export function legalCopy(locale: Locale): LegalCopy {
  return copyByLocale[locale] ?? copyByLocale[DEFAULT_LOCALE];
}

export function termsDocument(locale: Locale): LegalDocument {
  return legalCopy(locale).terms;
}

export function privacyDocument(locale: Locale): LegalDocument {
  return legalCopy(locale).privacy;
}

export type { LegalBlock, LegalCopy, LegalDocument, LegalSection } from './types';
