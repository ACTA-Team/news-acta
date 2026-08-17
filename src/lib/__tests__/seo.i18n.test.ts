import { describe, expect, it } from 'vitest';
import { siteConfig } from '@/config/site';
import { LOCALES } from '@/i18n/config';
import { buildAdminMetadata, buildMetadata, htmlLang } from '@/lib/seo';

/**
 * Multilingual SEO.
 *
 * Two failure modes this guards against, both silent in a browser:
 *   - a page that declares no `x-default`, so Google has to guess which variant
 *     to serve a visitor whose language matches neither
 *   - hreflang alternates for a locale the page does not actually exist in,
 *     which sends crawlers (and readers) to a 404 or the wrong language
 */

function languagesOf(metadata: ReturnType<typeof buildMetadata>): Record<string, string> {
  const languages = metadata.alternates?.languages ?? {};
  return languages as Record<string, string>;
}

describe('buildMetadata alternates', () => {
  it('emits one entry per locale plus x-default', () => {
    const languages = languagesOf(buildMetadata({ title: 'News', path: '/news', locale: 'en' }));

    for (const locale of LOCALES) {
      expect(languages[locale]).toBe(`${siteConfig.url}/${locale}/news`);
    }
    expect(languages['x-default']).toBe(`${siteConfig.url}/en/news`);
  });

  it('produces the same alternates regardless of which locale is rendering', () => {
    const fromEn = languagesOf(buildMetadata({ title: 'News', path: '/news', locale: 'en' }));
    const fromEs = languagesOf(buildMetadata({ title: 'Noticias', path: '/news', locale: 'es' }));
    expect(fromEs).toEqual(fromEn);
  });

  it('points the canonical at the rendering locale', () => {
    expect(
      buildMetadata({ title: 'News', path: '/news', locale: 'es' }).alternates?.canonical
    ).toBe(`${siteConfig.url}/es/news`);
  });

  it('honours per-locale paths for a translated slug', () => {
    const languages = languagesOf(
      buildMetadata({
        title: 'Credenciales',
        path: '/news/credentials',
        locale: 'es',
        alternatePaths: { en: '/news/credentials', es: '/news/credenciales' },
      })
    );

    expect(languages.en).toBe(`${siteConfig.url}/en/news/credentials`);
    expect(languages.es).toBe(`${siteConfig.url}/es/news/credenciales`);
    expect(languages['x-default']).toBe(`${siteConfig.url}/en/news/credentials`);
  });

  it('uses the translated slug for the canonical when one exists', () => {
    const metadata = buildMetadata({
      title: 'Credenciales',
      path: '/news/credentials',
      locale: 'es',
      alternatePaths: { en: '/news/credentials', es: '/news/credenciales' },
    });

    expect(metadata.alternates?.canonical).toBe(`${siteConfig.url}/es/news/credenciales`);
  });

  it('omits a locale the page does not exist in', () => {
    // An untranslated article: declaring a Spanish alternate would point a
    // crawler at a URL that does not resolve.
    const languages = languagesOf(
      buildMetadata({
        title: 'Only English',
        path: '/news/only-english',
        locale: 'en',
        alternatePaths: { en: '/news/only-english' },
      })
    );

    expect(languages.en).toBe(`${siteConfig.url}/en/news/only-english`);
    expect(languages.es).toBeUndefined();
    expect(languages['x-default']).toBe(`${siteConfig.url}/en/news/only-english`);
  });

  it('drops x-default when the default locale has no version of the page', () => {
    const languages = languagesOf(
      buildMetadata({
        title: 'Solo en espanol',
        path: '/news/solo-es',
        locale: 'es',
        alternatePaths: { es: '/news/solo-es' },
      })
    );

    expect(languages.es).toBe(`${siteConfig.url}/es/news/solo-es`);
    expect(languages['x-default']).toBeUndefined();
  });
});

describe('buildMetadata openGraph', () => {
  it('sets the page locale and lists the others as alternates', () => {
    const openGraph = buildMetadata({ title: 'Noticias', path: '/news', locale: 'es' }).openGraph;
    expect(openGraph?.locale).toBe('es_ES');
    expect(openGraph?.alternateLocale).toEqual(['en_US']);
  });

  it('swaps both when the locale changes', () => {
    const openGraph = buildMetadata({ title: 'News', path: '/news', locale: 'en' }).openGraph;
    expect(openGraph?.locale).toBe('en_US');
    expect(openGraph?.alternateLocale).toEqual(['es_ES']);
  });
});

describe('buildAdminMetadata', () => {
  it('never advertises the admin panel to crawlers', () => {
    const metadata = buildAdminMetadata({ title: 'Admin Login' });
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.alternates).toBeUndefined();
    expect(metadata.openGraph).toBeUndefined();
  });
});

describe('htmlLang', () => {
  it('returns the BCP 47 tag, not the bare locale', () => {
    expect(htmlLang('en')).toBe('en-US');
    expect(htmlLang('es')).toBe('es-CR');
  });
});
