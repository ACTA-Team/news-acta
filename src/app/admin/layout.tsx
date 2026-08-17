import type { Metadata } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import '../globals.css';

import { ThemeInit } from '@/components/ThemeInit';
import { LOCALE_TAGS, DEFAULT_LOCALE } from '@/i18n/config';

/**
 * Root layout for the admin panel.
 *
 * A second root layout, alongside `src/app/[locale]/layout.tsx`: there is no
 * `src/app/layout.tsx` because `<html lang>` on the public site has to reflect
 * the URL's locale, and only a layout below the `[locale]` segment can know it.
 *
 * The admin interface stays English only. It is an internal tool, localizing it
 * is explicitly out of scope, and its `lang` is therefore fixed.
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

export const metadata: Metadata = {
  title: 'Admin (ACTA News)',
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={LOCALE_TAGS[DEFAULT_LOCALE]}
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-dvh flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
