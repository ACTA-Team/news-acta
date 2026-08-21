import Link from 'next/link';
import type { AuthorCardProps } from '@/@types/author';
import { withLocale, type Locale } from '@/i18n';
import { useTranslations } from '@/hooks/useTranslations';

import { AUTHOR_ROUTES } from '../constants';
import { VerifiedAuthorBadge } from './VerifiedAuthorBadge';

interface Props extends AuthorCardProps {
  locale: Locale;
}

export function AuthorCard({ author, compact, locale }: Props) {
  const { t } = useTranslations();

  return (
    <Link
      href={withLocale(locale, AUTHOR_ROUTES.detail(author.slug))}
      className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
    >
      <div className="h-12 w-12 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{author.name}</span>
          <VerifiedAuthorBadge
            status={author.credential?.status}
            vcId={author.credential?.vcId}
            locale={locale}
            t={t}
            asLink={false}
          />
        </div>
        {!compact && author.role ? (
          <span className="text-sm text-zinc-500">{author.role}</span>
        ) : null}
      </div>
    </Link>
  );
}
