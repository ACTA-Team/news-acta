'use client';

import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
// Imported from the module's constants file rather than its barrel: the barrel
// re-exports Server Component pages, which a Client Component cannot pull in.
import { NEWS_ROUTES } from '@/components/modules/news/constants';
import { useTranslations } from '@/hooks/useTranslations';
import { withLocale } from '@/i18n';

/**
 * Efferd @efferd/not-found-2: large masked 404, ACTA home + news actions.
 *
 * A Client Component so the 404 stays inside the reader's language: both actions
 * link back into the current locale rather than dropping them on the default one.
 */
export function NotFoundContent() {
  const { locale, t } = useTranslations();

  return (
    <div className="relative flex min-h-[70vh] w-full items-center justify-center overflow-hidden px-4 py-20">
      <Empty>
        <EmptyHeader>
          <EmptyTitle className="mask-b-from-20% mask-b-to-80% font-extrabold text-8xl text-foreground sm:text-9xl">
            {t('notFound.code')}
          </EmptyTitle>
          <EmptyDescription className="-mt-6 max-w-md text-balance text-foreground/85">
            {t('notFound.description')}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href={withLocale(locale, '/')}>
                <Home data-icon="inline-start" className="size-4" />
                {t('notFound.home')}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={withLocale(locale, NEWS_ROUTES.index)}>
                <Compass data-icon="inline-start" className="size-4" />
                {t('notFound.news')}
              </Link>
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  );
}
