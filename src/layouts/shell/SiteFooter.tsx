import type { SVGProps } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Globe } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { legalRoutes } from '@/config/legal';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

/**
 * Efferd @efferd/footer-1 — minimal two-tier footer with ACTA links and socials.
 */
function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="m18.9,1.153h3.682l-8.042,9.189,9.46,12.506h-7.405l-5.804-7.583-6.634,7.583H.469l8.6-9.831L0,1.153h7.593l5.241,6.931,6.065-6.931Zm-1.293,19.494h2.039L6.482,3.239h-2.19l13.314,17.408Z" />
    </svg>
  );
}

function GitHubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.35 3.608 1.325.975.975 1.262 2.242 1.325 3.608.058 1.265.07 1.645.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.35 2.633-1.325 3.608-.975.975-2.242 1.262-3.608 1.325-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.35-3.608-1.325-.975-.975-1.262-2.242-1.325-3.608C2.175 15.647 2.163 15.267 2.163 12s.012-3.584.07-4.85c.062-1.366.35-2.633 1.325-3.608.975-.975 2.242-1.262 3.608-1.325C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.333.014 7.053.07 2.28.27.27 2.28.07 7.053.014 8.333 0 8.741 0 12c0 3.259.014 3.667.07 4.947.2 4.773 2.21 6.782 6.984 6.984 1.28.054 1.688.07 4.947.07s3.667-.014 4.947-.07c4.772-.2 6.781-2.21 6.984-6.984.052-1.28.07-1.687.07-4.947s-.014-3.666-.07-4.947c-.2-4.772-2.21-6.78-6.984-6.984C15.666.014 15.26 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

const footerLinkClass = 'text-muted-foreground transition-colors hover:text-foreground';

export function SiteFooter() {
  const year = new Date().getFullYear();
  const socialLinks = [
    {
      key: 'website',
      href: siteConfig.social.website.url,
      label: 'ACTA — acta.build',
      node: <Globe className="size-4" strokeWidth={1.5} aria-hidden />,
    },
    {
      key: 'x',
      href: siteConfig.social.x.url,
      label: 'X',
      node: <XIcon className="size-4" aria-hidden />,
    },
    {
      key: 'github',
      href: siteConfig.social.github.url,
      label: 'GitHub',
      node: <GitHubIcon className="size-4" aria-hidden />,
    },
    {
      key: 'instagram',
      href: siteConfig.social.instagram.url,
      label: 'Instagram',
      node: <InstagramIcon className="size-4" aria-hidden />,
    },
  ] as const;

  return (
    <footer className={cn('mt-24 w-full border-t border-border/80 bg-background', 'px-4 md:px-6')}>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="inline-flex shrink-0 items-center self-start">
            <Image
              src="/black.png"
              alt=""
              width={140}
              height={40}
              className="h-7 w-auto dark:hidden"
              sizes="140px"
            />
            <Image
              src="/white.png"
              alt=""
              width={140}
              height={40}
              className="hidden h-7 w-auto dark:block"
              sizes="140px"
            />
            <span className="sr-only">{siteConfig.name}</span>
          </Link>
          <div className="flex items-center gap-0.5">
            {socialLinks.map(({ key, href, label, node }) => (
              <Button key={key} asChild size="icon-sm" variant="ghost">
                <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                  {node}
                </a>
              </Button>
            ))}
          </div>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 pb-2 font-medium text-sm">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={footerLinkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={legalRoutes.terms} className={footerLinkClass}>
                Terms
              </Link>
            </li>
            <li>
              <Link href={legalRoutes.privacy} className={footerLinkClass}>
                Privacy
              </Link>
            </li>
          </ul>
        </nav>

        <div className="border-t border-border/60 py-5 text-muted-foreground text-sm">
          <p>© {year} ACTA. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
