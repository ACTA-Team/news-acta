import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { NEWS_ROUTES } from '@/components/modules/news';
import { MONTHLY_REVIEW_ROUTES } from '@/components/modules/monthly-review';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

import { HomeHeroTypingTitle } from './HomeHeroTypingTitle';

type HomeHeroProps = {
  className?: string;
};

/**
 * Efferd @efferd/hero-3 — adapted for ACTA News (headline, CTAs, brand badge).
 */
export function HomeHero({ className }: HomeHeroProps) {
  return (
    <section
      className={cn(
        'relative mx-auto w-full max-w-5xl overflow-hidden pt-12 pb-6 md:pt-20 md:pb-10',
        className
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 size-full overflow-hidden"
      >
        <div
          className={cn(
            'absolute inset-0 isolate -z-10',
            'bg-[radial-gradient(20%_80%_at_20%_0%,--theme(--color-foreground/.08),transparent)]'
          )}
        />
      </div>

      <div className="relative z-10 flex max-w-2xl flex-col gap-5 px-4">
        <Link
          href={NEWS_ROUTES.index}
          className={cn(
            'group flex w-fit items-center gap-3 rounded-sm border border-border/80 bg-card p-1 pr-2 shadow-sm',
            'transition-colors hover:border-border hover:bg-muted/30',
            'animate-in fade-in slide-in-from-bottom-4 fill-mode-both delay-100 duration-500'
          )}
        >
          <span className="rounded-xs border border-border/60 bg-background px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            New
          </span>
          <span className="text-sm text-muted-foreground">
            Read the latest from {siteConfig.shortName}
          </span>
          <span className="h-4 w-px bg-border" aria-hidden />
          <ArrowRight className="size-3.5 -translate-x-0.5 text-muted-foreground transition group-hover:translate-x-0" />
        </Link>

        <HomeHeroTypingTitle
          line={`The editorial home for the ${siteConfig.shortName} ecosystem`}
        />

        <p
          className={cn(
            'max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg',
            'animate-in fade-in slide-in-from-bottom-2 fill-mode-both delay-200 duration-500'
          )}
        >
          {siteConfig.description}
        </p>

        <div
          className={cn(
            'flex flex-col gap-3 pt-1 sm:flex-row sm:items-center',
            'animate-in fade-in slide-in-from-bottom-2 fill-mode-both delay-300 duration-500'
          )}
        >
          <Button asChild size="lg" className="font-medium">
            <Link href={NEWS_ROUTES.index}>
              Browse news
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="font-medium">
            <Link href={MONTHLY_REVIEW_ROUTES.index}>
              <Sparkles className="size-4" />
              Monthly reviews
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative">
        <div
          className={cn(
            'pointer-events-none absolute -inset-x-20 inset-y-0 -translate-y-1/3 scale-120 rounded-full',
            'bg-[radial-gradient(ellipse_at_center,theme(--color-foreground/.06),transparent,transparent)]',
            'blur-[50px]'
          )}
        />
        <div
          className={cn(
            'relative mt-10 -mr-8 overflow-hidden px-2 sm:mr-0 md:mt-16',
            'mask-b-from-60%',
            'animate-in fade-in slide-in-from-bottom-2 fill-mode-both delay-200 duration-700'
          )}
        >
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-lg border border-border/60 bg-card/50 p-2 shadow-xl ring-1 ring-border/40 dark:bg-background/30">
            <img
              alt="ACTA dashboard preview"
              className="z-2 h-auto w-full rounded-md border border-border/40 object-contain"
              height={1080}
              src="/image.png"
              width={1920}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
