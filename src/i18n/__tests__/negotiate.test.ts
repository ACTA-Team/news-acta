import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE } from '../config';
import { localeFromAcceptLanguage, negotiateLocale, parseAcceptLanguage } from '../negotiate';

/**
 * Locale negotiation is the one piece of i18n a reader never sees but always
 * feels: get it wrong and a Spanish speaker lands on the English site, or worse,
 * a shared link opens in the wrong language.
 *
 * The contract under test: cookie beats header, header beats default, and
 * anything unrecognized falls back rather than failing.
 */

describe('parseAcceptLanguage', () => {
  it('returns nothing for an absent or empty header', () => {
    expect(parseAcceptLanguage(null)).toEqual([]);
    expect(parseAcceptLanguage(undefined)).toEqual([]);
    expect(parseAcceptLanguage('')).toEqual([]);
  });

  it('sorts by descending quality', () => {
    const parsed = parseAcceptLanguage('en;q=0.4, es;q=0.9, fr;q=0.7');
    expect(parsed.map((entry) => entry.tag)).toEqual(['es', 'fr', 'en']);
  });

  it('treats a missing q as 1 and keeps source order among equals', () => {
    const parsed = parseAcceptLanguage('es-CR, es, en-US, en');
    expect(parsed.map((entry) => entry.tag)).toEqual(['es-cr', 'es', 'en-us', 'en']);
    expect(parsed.every((entry) => entry.quality === 1)).toBe(true);
  });

  it('drops entries explicitly refused with q=0', () => {
    const parsed = parseAcceptLanguage('es;q=0, en;q=0.8');
    expect(parsed.map((entry) => entry.tag)).toEqual(['en']);
  });

  it('survives a malformed header instead of throwing', () => {
    expect(() => parseAcceptLanguage(',,;;q=,es')).not.toThrow();
    expect(parseAcceptLanguage(',,;;q=,es').map((entry) => entry.tag)).toContain('es');
  });
});

describe('localeFromAcceptLanguage', () => {
  it('matches on the primary subtag, so any Spanish region resolves to es', () => {
    expect(localeFromAcceptLanguage('es-CR,es;q=0.9')).toBe('es');
    expect(localeFromAcceptLanguage('es-419')).toBe('es');
    expect(localeFromAcceptLanguage('es-ES,en;q=0.5')).toBe('es');
  });

  it('picks the highest-quality supported language, skipping unsupported ones', () => {
    expect(localeFromAcceptLanguage('fr;q=1.0, pt;q=0.9, es;q=0.8')).toBe('es');
  });

  it('returns null when no supported language is listed', () => {
    expect(localeFromAcceptLanguage('fr-FR,de;q=0.8,pt;q=0.6')).toBeNull();
  });

  it('resolves a wildcard to the default locale', () => {
    expect(localeFromAcceptLanguage('*')).toBe(DEFAULT_LOCALE);
  });
});

describe('negotiateLocale', () => {
  it('lets the cookie win over the header', () => {
    expect(negotiateLocale({ cookie: 'es', acceptLanguage: 'en-US,en;q=0.9' })).toBe('es');
    expect(negotiateLocale({ cookie: 'en', acceptLanguage: 'es-CR,es;q=0.9' })).toBe('en');
  });

  it('falls back to the header when there is no cookie', () => {
    expect(negotiateLocale({ acceptLanguage: 'es-CR,es;q=0.9' })).toBe('es');
    expect(negotiateLocale({ cookie: null, acceptLanguage: 'en-GB' })).toBe('en');
  });

  it('ignores a cookie naming an unsupported locale', () => {
    // A stale or hand-edited cookie must not be able to 404 the whole site.
    expect(negotiateLocale({ cookie: 'fr', acceptLanguage: 'es-CR' })).toBe('es');
    expect(negotiateLocale({ cookie: 'pt-BR', acceptLanguage: 'de' })).toBe(DEFAULT_LOCALE);
  });

  it('falls back to the default when neither signal is usable', () => {
    expect(negotiateLocale({})).toBe(DEFAULT_LOCALE);
    expect(negotiateLocale({ cookie: '', acceptLanguage: '' })).toBe(DEFAULT_LOCALE);
    expect(negotiateLocale({ cookie: 'zz', acceptLanguage: 'zh-CN,ja;q=0.8' })).toBe(
      DEFAULT_LOCALE
    );
  });
});
