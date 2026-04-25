'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import { useScroll } from '@/hooks/use-scroll';
import { Button } from '@/components/ui/button';

/**
 * Efferd @efferd/header-2 — single scroll surface (no nested bars / ghost header).
 */
export function SiteHeader() {
  const scrolled = useScroll(10);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Spacer: only the inner shell gets the frosted bar — the outer <header> stays a transparent track */}
      <div
        className={cn('px-3 transition-[padding] duration-200 ease-out sm:px-4', scrolled && 'pt-1.5')}
      >
        <div
          className={cn(
            'mx-auto flex w-full max-w-5xl overflow-hidden',
            'transition-[background-color,box-shadow,border-color,backdrop-filter] duration-200 ease-out',
            scrolled
              ? 'rounded-2xl border border-border/60 bg-background/85 shadow-sm backdrop-blur-md dark:bg-background/80'
              : 'rounded-2xl border border-transparent bg-transparent',
          )}
        >
          <nav
            className="flex h-12 w-full min-w-0 items-center justify-between gap-2 px-3 sm:h-12 sm:px-4"
            aria-label="Primary"
          >
            <Link
              href="/"
              className="truncate rounded-md px-1.5 py-1 font-semibold text-[0.95rem] tracking-[-0.02em] text-foreground transition-colors hover:text-foreground/85"
              onClick={() => setIsMobileOpen(false)}
            >
              {siteConfig.name}
            </Link>

            <div className="hidden min-w-0 items-center gap-0.5 md:flex">
              {siteConfig.nav.map((item) => (
                <Button
                  key={item.href}
                  asChild
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-[0.8125rem] text-muted-foreground"
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
              <Button asChild size="sm" variant="ghost" className="shrink-0 text-[0.8125rem] text-muted-foreground">
                <Link href={siteConfig.rssPath}>RSS</Link>
              </Button>
            </div>

            <div className="flex items-center gap-1 md:hidden">
              <Button
                variant="ghost"
                size="icon"
                aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileOpen}
                onClick={() => setIsMobileOpen((o) => !o)}
              >
                {isMobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </Button>
            </div>
          </nav>
        </div>
      </div>

      {isMobileOpen ? (
        <div className="border-b border-border/70 bg-background md:hidden">
          <div className="mx-auto max-w-5xl space-y-0.5 px-4 py-2">
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                onClick={() => setIsMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={siteConfig.rssPath}
              className="mt-0.5 block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              onClick={() => setIsMobileOpen(false)}
            >
              RSS
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
