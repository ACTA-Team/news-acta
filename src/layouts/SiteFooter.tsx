import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { Container } from '@/layouts/Container';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-zinc-200 py-10 dark:border-zinc-800">
      <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {siteConfig.name}
          </p>
          <p className="text-xs text-zinc-500">
            © {year} ACTA. All rights reserved.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap items-center gap-4 text-sm">
          <Link
            href={siteConfig.rssPath}
            className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            RSS
          </Link>
          <a
            href={siteConfig.social.x.url}
            target="_blank"
            rel="noreferrer"
            className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            X
          </a>
          <a
            href={siteConfig.social.instagram.url}
            target="_blank"
            rel="noreferrer"
            className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Instagram
          </a>
          <a
            href={siteConfig.social.github.url}
            target="_blank"
            rel="noreferrer"
            className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            GitHub
          </a>
        </nav>
      </Container>
    </footer>
  );
}
