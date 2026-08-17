/**
 * Public barrel for the i18n layer.
 *
 * Everything exported here is safe in both Server and Client Components.
 * `getDictionary` / `getTranslations` are deliberately absent: importing them
 * would pull both dictionaries into a client bundle. Server code imports
 * `@/i18n/dictionaries` directly instead.
 */

export {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_NAMES,
  LOCALE_SHORT_NAMES,
  LOCALE_TAGS,
  LOCALE_TSV_CONFIG,
  LOCALES,
  OG_LOCALES,
  isLocale,
  otherLocales,
  toLocale,
  type Locale,
} from './config';

export {
  DEFAULT_LOCALE_PREFIX,
  createHref,
  isUnlocalizedPath,
  localeAlternates,
  localeFromPathname,
  normalizePath,
  splitLocale,
  stripLocale,
  withLocale,
  type Href,
} from './routing';

export { resolveLocale, resolveLocaleParams, type LocaleParams } from './params';

export {
  localeFromAcceptLanguage,
  localeFromCookie,
  negotiateLocale,
  parseAcceptLanguage,
  type NegotiateInput,
} from './negotiate';

export {
  createTranslator,
  interpolate,
  translateList,
  type Dictionary,
  type DictionaryKey,
  type TranslationVars,
  type Translator,
} from './translate';

export {
  formatDate,
  formatDateTime,
  formatLongDate,
  formatMonthYear,
  formatNumber,
  formatPercent,
  formatSignedPercent,
} from './format';

export { TranslationsProvider, type TranslationsContextValue } from './TranslationsProvider';

export {
  AlternateLocalePathsProvider,
  SetAlternateLocalePaths,
  useAlternateLocalePaths,
  type AlternatePathMap,
} from './AlternateLocalePaths';
