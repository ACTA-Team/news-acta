import type { Metadata } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

import { siteConfig } from '@/config/site';

const THEME_INIT = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})();`;

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
      suppressHydrationWarning
    >
      <body
        className="flex min-h-dvh flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        {children}
      </body>
    </html>
  );
}
