import type { Metadata } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

import { siteConfig } from '@/config/site';
import { SiteHeader, SiteFooter } from '@/layouts';

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

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: siteConfig.url,
    types: { 'application/rss+xml': siteConfig.rssPath },
  },
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    url: siteConfig.url,
    locale: siteConfig.locale,
    images: [siteConfig.defaultOgImage],
  },
  twitter: {
    card: 'summary_large_image',
    site: siteConfig.social.x.handle,
    creator: siteConfig.social.x.handle,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={siteConfig.locale}
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
