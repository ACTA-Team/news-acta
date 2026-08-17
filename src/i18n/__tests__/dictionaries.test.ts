import { describe, expect, it } from 'vitest';
import en from '../en.json';
import es from '../es.json';
import { LOCALES } from '../config';
import { createTranslator, interpolate, translateList } from '../translate';

/**
 * Dictionary parity and the translator's behaviour.
 *
 * The parity check is the important one: a key that exists in `en.json` and not
 * in `es.json` renders the raw key path to a Spanish reader, and nothing in the
 * type system catches it because `DictionaryKey` is derived from English alone.
 */

type Tree = Record<string, unknown>;

/** Every leaf path in a dictionary, as dotted keys. */
function leafPaths(node: unknown, prefix = ''): string[] {
  if (node === null || typeof node !== 'object') return [prefix];
  if (Array.isArray(node)) return [prefix];

  return Object.entries(node as Tree).flatMap(([key, value]) =>
    leafPaths(value, prefix ? `${prefix}.${key}` : key)
  );
}

/** The `{name}` placeholders a template declares. */
function placeholders(value: string): string[] {
  return [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}

function leafValues(node: unknown, prefix = ''): [string, unknown][] {
  if (node === null || typeof node !== 'object') return [[prefix, node]];
  if (Array.isArray(node)) return [[prefix, node]];

  return Object.entries(node as Tree).flatMap(([key, value]) =>
    leafValues(value, prefix ? `${prefix}.${key}` : key)
  );
}

const dictionaries = { en, es } as const;

/**
 * The character under test, built from its code point so that this file does
 * not itself contain the thing it forbids.
 */
const EM_DASH = String.fromCharCode(0x2014);

describe('dictionary parity', () => {
  it('covers every configured locale', () => {
    expect(Object.keys(dictionaries).sort()).toEqual([...LOCALES].sort());
  });

  it('has exactly the same keys in every language', () => {
    const enKeys = leafPaths(en).sort();
    const esKeys = leafPaths(es).sort();

    const missingInEs = enKeys.filter((key) => !esKeys.includes(key));
    const missingInEn = esKeys.filter((key) => !enKeys.includes(key));

    expect(missingInEs, 'keys present in en.json but missing from es.json').toEqual([]);
    expect(missingInEn, 'keys present in es.json but missing from en.json').toEqual([]);
  });

  it('uses the same value shape for every key', () => {
    const esByKey = new Map(leafValues(es));

    for (const [key, value] of leafValues(en)) {
      const counterpart = esByKey.get(key);
      expect(Array.isArray(value), `${key} array-ness`).toBe(Array.isArray(counterpart));
      expect(typeof value, `${key} type`).toBe(typeof counterpart);
    }
  });

  it('declares the same placeholders in both languages', () => {
    const esByKey = new Map(leafValues(es));

    for (const [key, value] of leafValues(en)) {
      if (typeof value !== 'string') continue;
      const counterpart = esByKey.get(key);
      if (typeof counterpart !== 'string') continue;

      // A translation that drops `{minutes}` silently loses the number.
      expect(placeholders(counterpart), `placeholders for ${key}`).toEqual(placeholders(value));
    }
  });

  it('has no empty strings, which would render as a blank label', () => {
    for (const [locale, dictionary] of Object.entries(dictionaries)) {
      for (const [key, value] of leafValues(dictionary)) {
        if (typeof value === 'string') {
          expect(value.trim().length, `${locale}: ${key} is empty`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('contains no em dashes', () => {
    // Project-wide convention; asserting it here keeps a translator from
    // reintroducing one through a dictionary edit.
    for (const [locale, dictionary] of Object.entries(dictionaries)) {
      for (const [key, value] of leafValues(dictionary)) {
        if (typeof value === 'string') {
          expect(value.includes(EM_DASH), `${locale}: ${key} contains an em dash`).toBe(false);
        }
      }
    }
  });
});

describe('interpolate', () => {
  it('substitutes every named placeholder', () => {
    expect(interpolate('{minutes} min read', { minutes: 4 })).toBe('4 min read');
    expect(interpolate('{a} and {b}', { a: 'x', b: 'y' })).toBe('x and y');
  });

  it('leaves an unmatched placeholder visible rather than blanking it', () => {
    expect(interpolate('{missing} value', { other: 1 })).toBe('{missing} value');
  });

  it('returns the template unchanged when no vars are given', () => {
    expect(interpolate('plain text')).toBe('plain text');
  });
});

describe('createTranslator', () => {
  it('resolves a dotted key', () => {
    const t = createTranslator(en);
    expect(t('nav.news')).toBe('News');
    expect(createTranslator(es)('nav.news')).toBe('Noticias');
  });

  it('interpolates', () => {
    expect(createTranslator(en)('news.card.readingTime', { minutes: 7 })).toBe('7 min read');
    expect(createTranslator(es)('news.card.readingTime', { minutes: 7 })).toBe('7 min de lectura');
  });

  it('returns the key itself for a miss, so the gap is visible', () => {
    const t = createTranslator(en);
    // Cast: the point of the test is the runtime behaviour on a bad key.
    expect(t('nav.doesNotExist' as never)).toBe('nav.doesNotExist');
  });

  it('does not return a partial object when the key names a branch', () => {
    const t = createTranslator(en);
    expect(t('nav' as never)).toBe('nav');
  });
});

describe('translateList', () => {
  it('reads a string array', () => {
    const lines = translateList(en, 'home.hero.typingLines');
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.every((line) => typeof line === 'string')).toBe(true);
  });

  it('returns an empty array for a non-list key, so callers can always map', () => {
    expect(translateList(en, 'nav.news')).toEqual([]);
  });
});
