import type { Metadata } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import { notFound } from 'next/navigation';
import '../globals.css';

import { ThemeInit } from '@/components/ThemeInit';
import { siteConfig, siteDescription, rssPath } from '@/config/site';
import { LOCALES, OG_LOCALES, isLocale, otherLocales, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { AlternateLocalePathsProvider, TranslationsProvider } from '@/i18n';
import { localizedUrl, localizedUrls } from '@/lib/url';
import { htmlLang } from '@/lib/seo';

/**
 * Root layout for the public site.
 *
 * This is a root layout, not a nested one: it owns `<html>` and `<body>`, which
 * is the only way `lang` can reflect the URL's locale in the server-rendered
 * HTML. The admin panel has its own root layout for the same reason, and there
 * is deliberately no `src/app/layout.tsx` above either of them.
 */

const fontSans = Plus_Jakarta_Sans({
  variable: '--font-app-sans',
  subsets: ['latin'],
  display: 'swap',
});

const fontMono = JetBrains_Mono({
  variable: '--font-app-mono',
  subsets: ['latin'],
  display: 'swap',
});

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/** Both locales are known at build time, so every static page stays static. */
export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Pick<LocaleLayoutProps, 'params'>): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: siteConfig.name,
      template: `%s · ${siteConfig.name}`,
    },
    description: siteDescription(locale),
    alternates: {
      canonical: localizedUrl(locale, '/'),
      languages: { ...localizedUrls('/'), 'x-default': localizedUrl('en', '/') },
      types: { 'application/rss+xml': rssPath(locale) },
    },
    openGraph: {
      type: 'website',
      siteName: siteConfig.name,
      url: localizedUrl(locale, '/'),
      locale: OG_LOCALES[locale],
      alternateLocale: otherLocales(locale).map((other) => OG_LOCALES[other]),
      images: [siteConfig.defaultOgImage],
    },
    twitter: {
      card: 'summary_large_image',
      site: siteConfig.social.x.handle,
      creator: siteConfig.social.x.handle,
    },
  };
}

export default async function LocaleRootLayout({ children, params }: LocaleLayoutProps) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  // Loaded once here and handed to Client Components through the provider, so
  // nothing below has to import a dictionary or fetch translations.
  const dictionary = await getDictionary(locale);

  return (
    <html
      lang={htmlLang(locale)}
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-dvh flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <ThemeInit />
        <TranslationsProvider locale={locale} dictionary={dictionary}>
          <AlternateLocalePathsProvider>{children}</AlternateLocalePathsProvider>
        </TranslationsProvider>
      </body>
    </html>
  );
}
