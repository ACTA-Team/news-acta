'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Languages } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/useTranslations';
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_NAMES,
  LOCALE_SHORT_NAMES,
  LOCALES,
  useAlternateLocalePaths,
  withLocale,
  type Locale,
} from '@/i18n';
import { cn } from '@/lib/utils';

/**
 * Language switcher.
 *
 * Two responsibilities, and they are separate on purpose:
 *
 *   1. Work out the target URL. By default that is the current path with its
 *      locale segment swapped, which is right for every static route. Pages
 *      whose URL differs per language (an article with a translated slug, or one
 *      with no translation at all) register the correct targets through
 *      `SetAlternateLocalePaths`, and those win.
 *
 *   2. Persist the choice. Writing the `acta-locale` cookie is what makes the
 *      next visit to an unprefixed URL land in the right language, and the proxy
 *      treats the cookie as outranking `Accept-Language`.
 */

interface LanguageSwitcherProps {
  className?: string;
  /** Renders full language names instead of the two-letter labels. */
  expanded?: boolean;
  onNavigate?: () => void;
}

function persistLocale(locale: Locale): void {
  // `SameSite=Lax` is enough: the cookie only ever influences a top-level
  // navigation, and the proxy reads it on ordinary GETs.
  document.cookie = [
    `${LOCALE_COOKIE}=${locale}`,
    'Path=/',
    `Max-Age=${LOCALE_COOKIE_MAX_AGE}`,
    'SameSite=Lax',
  ].join('; ');
}

export function LanguageSwitcher({ className, expanded, onNavigate }: LanguageSwitcherProps) {
  const { locale: current, t } = useTranslations();
  const pathname = usePathname() ?? '/';
  const overrides = useAlternateLocalePaths();

  const targets = LOCALES.map((locale) => ({
    locale,
    href: overrides?.[locale] ?? withLocale(locale, pathname),
    isCurrent: locale === current,
  }));

  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      role="group"
      aria-label={t('common.switchLanguage')}
    >
      <Languages
        className="mr-1 size-3.5 shrink-0 text-muted-foreground"
        strokeWidth={1.5}
        aria-hidden
      />
      {targets.map(({ locale, href, isCurrent }) => (
        <Button
          key={locale}
          asChild={!isCurrent}
          variant="ghost"
          size="sm"
          className={cn(
            'h-7 shrink-0 px-2 text-[0.75rem] font-medium',
            isCurrent ? 'text-foreground' : 'text-muted-foreground'
          )}
          // The active language is a label, not a control: making it a link to
          // itself gives screen readers a no-op action to announce.
          {...(isCurrent ? { disabled: true, 'aria-current': 'true' as const } : {})}
        >
          {isCurrent ? (
            <span>{expanded ? LOCALE_NAMES[locale] : LOCALE_SHORT_NAMES[locale]}</span>
          ) : (
            <Link
              href={href}
              hrefLang={locale}
              lang={locale}
              onClick={() => {
                persistLocale(locale);
                onNavigate?.();
              }}
            >
              {expanded ? LOCALE_NAMES[locale] : LOCALE_SHORT_NAMES[locale]}
            </Link>
          )}
        </Button>
      ))}
    </div>
  );
}
