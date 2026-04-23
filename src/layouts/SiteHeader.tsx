'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Sparkles } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { Container } from '@/layouts/Container';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/95 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/95">
      <Container className="flex h-16 items-center justify-between">
        {/* Logo/Brand */}
        <Link
          href="/"
          className="group flex items-center gap-2 text-lg font-bold tracking-tight text-zinc-950 transition-colors hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-300"
        >
          <span className="hidden sm:block">{siteConfig.name}</span>
          <span className="sm:hidden">{siteConfig.shortName}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative px-3 py-2 text-sm font-medium text-zinc-600 transition-all hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-md"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </Container>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
            <Container className="py-4">
              <nav className="flex flex-col gap-2">
                {siteConfig.nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 text-base font-medium text-zinc-700 transition-all hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* Mobile Menu Footer */}
              <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
                  <span>© 2026 {siteConfig.shortName}</span>
                  <div className="flex gap-4">
                    <a
                      href={siteConfig.social.x.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                    >
                      X
                    </a>
                    <a
                      href={siteConfig.social.github.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                    >
                      GitHub
                    </a>
                  </div>
                </div>
              </div>
            </Container>
          </div>
        </div>
      )}
    </header>
  );
}
