import Link from 'next/link';
import { BadgeCheck, ShieldOff } from 'lucide-react';
import type { AuthorCredentialStatus } from '@/@types/credential';
import type { Translator } from '@/i18n/translate';
import { withLocale, type Locale } from '@/i18n';
import { CREDENTIAL_ROUTES } from '@/components/modules/credentials/constants';

interface VerifiedAuthorBadgeProps {
  status: AuthorCredentialStatus | undefined;
  vcId: string | undefined;
  locale: Locale;
  t: Translator;
  className?: string;
  /** Render as a plain `<span>` instead of a `<Link>`, for placements that
   *  are already nested inside another link (e.g. `AuthorCard`). */
  asLink?: boolean;
}

/**
 * Three states: `active` (green check, links to the public verify page),
 * `revoked` (muted, still links so the reader can see why), and anything
 * else (`pending` | `failed` | no credential at all) renders nothing — an
 * in-progress or failed on-chain issuance must never look like a broken
 * "verified" claim.
 */
export function VerifiedAuthorBadge({
  status,
  vcId,
  locale,
  t,
  className,
  asLink = true,
}: VerifiedAuthorBadgeProps) {
  if (!vcId || (status !== 'active' && status !== 'revoked')) return null;

  const verified = status === 'active';
  const classes = `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
    verified
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
      : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500'
  } ${className ?? ''}`;

  const content = (
    <>
      {verified ? (
        <BadgeCheck className="size-3.5" strokeWidth={2} aria-hidden />
      ) : (
        <ShieldOff className="size-3.5" strokeWidth={2} aria-hidden />
      )}
      {verified ? t('credential.badge.verified') : t('credential.badge.revoked')}
    </>
  );

  if (!asLink) return <span className={classes}>{content}</span>;

  return (
    <Link href={withLocale(locale, CREDENTIAL_ROUTES.verify(vcId))} className={classes}>
      {content}
    </Link>
  );
}
