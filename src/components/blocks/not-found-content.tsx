import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { NEWS_ROUTES } from '@/components/modules/news';

/**
 * Efferd @efferd/not-found-2 — large masked 404, ACTA home + news actions.
 */
export function NotFoundContent() {
  return (
    <div className="relative flex min-h-[70vh] w-full items-center justify-center overflow-hidden px-4 py-20">
      <Empty>
        <EmptyHeader>
          <EmptyTitle className="mask-b-from-20% mask-b-to-80% font-extrabold text-8xl text-foreground sm:text-9xl">
            404
          </EmptyTitle>
          <EmptyDescription className="-mt-6 max-w-md text-balance text-foreground/85">
            The page you are looking for may have been moved, renamed, or does not exist.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/">
                <Home data-icon="inline-start" className="size-4" />
                Home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={NEWS_ROUTES.index}>
                <Compass data-icon="inline-start" className="size-4" />
                News
              </Link>
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  );
}
