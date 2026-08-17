/**
 * Dictionary lookup.
 *
 * Keys are dot paths into the dictionary JSON (`'news.filters.all'`). The type
 * of every valid key is derived from `en.json`, so a typo or a key that only
 * exists in one language is a compile error rather than a string that leaks to
 * production.
 *
 * Placeholders use `{name}` and are substituted from the `vars` argument:
 *
 *   t('news.card.readingTime', { minutes: 4 })  ->  '4 min read'
 */

import type en from './en.json';

export type Dictionary = typeof en;

/**
 * Depth-limited recursive path type. The limit keeps the compiler fast; the
 * dictionary is intentionally no deeper than four levels.
 */
type Prev = [never, 0, 1, 2, 3, 4];

type DotPaths<T, Depth extends number = 4> = Depth extends never
  ? never
  : T extends string | readonly unknown[]
    ? never
    : {
        // String leaves and string arrays are both terminal: `t()` reads the
        // former, `translateList()` reads the latter, and neither needs the
        // numeric indices a recursive descent into an array would produce.
        [K in keyof T & string]: T[K] extends string | readonly unknown[]
          ? K
          : K | `${K}.${DotPaths<T[K], Prev[Depth]>}`;
      }[keyof T & string];

export type DictionaryKey = DotPaths<Dictionary>;

export type TranslationVars = Record<string, string | number>;

export type Translator = (key: DictionaryKey, vars?: TranslationVars) => string;

/** Resolves a dot path against a plain object tree. */
function lookup(dictionary: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((node, segment) => {
    if (node && typeof node === 'object' && segment in (node as Record<string, unknown>)) {
      return (node as Record<string, unknown>)[segment];
    }
    return undefined;
  }, dictionary);
}

/** Replaces every `{name}` occurrence with the matching var, if provided. */
export function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match
  );
}

/**
 * Builds a translator bound to one dictionary.
 *
 * A missing key returns the key itself. That is deliberately visible in the UI
 * (and loud in the server log) rather than rendering an empty string, which is
 * the failure mode that ships unnoticed.
 */
export function createTranslator(dictionary: Dictionary): Translator {
  return (key, vars) => {
    const value = lookup(dictionary, key);

    if (typeof value === 'string') return interpolate(value, vars);

    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[i18n] missing translation for key "${key}"`);
    }
    return key;
  };
}

/**
 * Reads an array of strings from the dictionary (hero phrases, legal bullet
 * lists). Returns an empty array when the key is missing or is not a list of
 * strings, so a caller can always `.map` over the result.
 */
export function translateList(dictionary: Dictionary, key: DictionaryKey): string[] {
  const value = lookup(dictionary, key);
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value as string[];
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[i18n] key "${key}" is not a string array`);
  }
  return [];
}
