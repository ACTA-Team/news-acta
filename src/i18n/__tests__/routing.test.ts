import { describe, expect, it } from 'vitest';
import { LOCALES } from '../config';
import {
  isUnlocalizedPath,
  localeAlternates,
  localeFromPathname,
  normalizePath,
  splitLocale,
  stripLocale,
  withLocale,
} from '../routing';

describe('localeFromPathname', () => {
  it('reads the locale out of the first segment', () => {
    expect(localeFromPathname('/en/news')).toBe('en');
    expect(localeFromPathname('/es')).toBe('es');
  });

  it('returns null when the first segment is not a locale', () => {
    expect(localeFromPathname('/news')).toBeNull();
    expect(localeFromPathname('/')).toBeNull();
    // 'english' starts with 'en' but is not a locale: the check is exact.
    expect(localeFromPathname('/english/news')).toBeNull();
  });
});

describe('stripLocale', () => {
  it('removes the prefix and keeps the rest', () => {
    expect(stripLocale('/es/news/mi-articulo')).toBe('/news/mi-articulo');
    expect(stripLocale('/en/monthly-review/2026-03')).toBe('/monthly-review/2026-03');
  });

  it('maps a bare locale to the root', () => {
    expect(stripLocale('/es')).toBe('/');
    expect(stripLocale('/en/')).toBe('/');
  });

  it('leaves an already-unprefixed path alone', () => {
    expect(stripLocale('/news')).toBe('/news');
    expect(stripLocale('/')).toBe('/');
  });
});

describe('withLocale', () => {
  it('prefixes an unprefixed path', () => {
    expect(withLocale('es', '/news')).toBe('/es/news');
    expect(withLocale('en', '/authors/jane')).toBe('/en/authors/jane');
  });

  it('replaces an existing prefix rather than stacking one', () => {
    expect(withLocale('es', '/en/news')).toBe('/es/news');
    expect(withLocale('en', '/es/news/foo')).toBe('/en/news/foo');
  });

  it('produces a bare prefix for the root', () => {
    expect(withLocale('es', '/')).toBe('/es');
    expect(withLocale('en', '/en')).toBe('/en');
  });

  it('is idempotent', () => {
    const once = withLocale('es', '/news');
    expect(withLocale('es', once)).toBe(once);
  });
});

describe('localeAlternates', () => {
  it('returns one path per supported locale', () => {
    const alternates = localeAlternates('/news');
    expect(Object.keys(alternates).sort()).toEqual([...LOCALES].sort());
    expect(alternates.en).toBe('/en/news');
    expect(alternates.es).toBe('/es/news');
  });

  it('normalizes an already-prefixed input', () => {
    expect(localeAlternates('/es/news').en).toBe('/en/news');
  });
});

describe('isUnlocalizedPath', () => {
  it('excludes the admin panel, the API and the metadata routes', () => {
    expect(isUnlocalizedPath('/admin')).toBe(true);
    expect(isUnlocalizedPath('/admin/news')).toBe(true);
    expect(isUnlocalizedPath('/api/media')).toBe(true);
    expect(isUnlocalizedPath('/auth/callback')).toBe(true);
    expect(isUnlocalizedPath('/robots.txt')).toBe(true);
    expect(isUnlocalizedPath('/sitemap.xml')).toBe(true);
  });

  it('does not exclude public pages', () => {
    expect(isUnlocalizedPath('/')).toBe(false);
    expect(isUnlocalizedPath('/news')).toBe(false);
    expect(isUnlocalizedPath('/en/news')).toBe(false);
  });

  it('does not treat a prefix collision as a match', () => {
    // '/administrative-notes' is a public page, not the admin panel.
    expect(isUnlocalizedPath('/administrative-notes')).toBe(false);
  });
});

describe('normalizePath', () => {
  it('adds a leading slash and drops a trailing one', () => {
    expect(normalizePath('news')).toBe('/news');
    expect(normalizePath('/news/')).toBe('/news');
    expect(normalizePath('/')).toBe('/');
    expect(normalizePath('')).toBe('/');
  });
});

describe('splitLocale', () => {
  it('returns both halves', () => {
    expect(splitLocale('/es/news/foo')).toEqual({ locale: 'es', path: '/news/foo' });
    expect(splitLocale('/news/foo')).toEqual({ locale: null, path: '/news/foo' });
  });
});
