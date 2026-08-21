import { BadgeCheck, ShieldOff, ShieldQuestion } from 'lucide-react';
import type { CredentialVerification } from '@/@types/credential';
import type { Translator } from '@/i18n/translate';
import { CopyChip } from '@/components/modules/news/ui/embeds/CopyChip';
import { formatTimestamp } from '@/lib/stellar/format';

interface CredentialVerifyCardProps {
  vcId: string;
  verification: CredentialVerification;
  t: Translator;
}

const STATUS_STYLES: Record<CredentialVerification['status'], string> = {
  valid: 'text-emerald-700 dark:text-emerald-400',
  revoked: 'text-amber-700 dark:text-amber-400',
  invalid: 'text-zinc-500',
};

const STATUS_ICONS: Record<CredentialVerification['status'], typeof BadgeCheck> = {
  valid: BadgeCheck,
  revoked: ShieldOff,
  invalid: ShieldQuestion,
};

export function CredentialVerifyCard({ vcId, verification, t }: CredentialVerifyCardProps) {
  const StatusIcon = STATUS_ICONS[verification.status];
  const statusLabel = {
    valid: t('credential.verify.statusValid'),
    revoked: t('credential.verify.statusRevoked'),
    invalid: t('credential.verify.statusInvalid'),
  }[verification.status];

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
      <div
        className={`flex items-center gap-2 text-lg font-semibold ${STATUS_STYLES[verification.status]}`}
      >
        <StatusIcon className="size-5" strokeWidth={2} aria-hidden />
        {statusLabel}
      </div>

      <dl className="grid gap-3 text-sm">
        <div className="flex flex-col gap-1">
          <dt className="text-zinc-500">{t('credential.verify.credentialIdLabel')}</dt>
          <dd>
            <CopyChip value={vcId} display={vcId} />
          </dd>
        </div>

        {verification.subjectDid ? (
          <div className="flex flex-col gap-1">
            <dt className="text-zinc-500">{t('credential.verify.subjectLabel')}</dt>
            <dd>
              <CopyChip value={verification.subjectDid} />
            </dd>
          </div>
        ) : null}

        {verification.issuerDid ? (
          <div className="flex flex-col gap-1">
            <dt className="text-zinc-500">{t('credential.verify.issuerLabel')}</dt>
            <dd className="flex flex-wrap items-center gap-2">
              <CopyChip value={verification.issuerDid} />
              <span
                className={
                  verification.issuedByActaNews
                    ? 'text-xs text-emerald-700 dark:text-emerald-400'
                    : 'text-xs text-amber-700 dark:text-amber-400'
                }
              >
                {verification.issuedByActaNews
                  ? t('credential.verify.issuedByActaNews')
                  : t('credential.verify.issuedByOther')}
              </span>
            </dd>
          </div>
        ) : null}

        {verification.since ? (
          <div className="flex flex-col gap-1">
            <dt className="text-zinc-500">{t('credential.verify.sinceLabel')}</dt>
            <dd>{formatTimestamp(verification.since)}</dd>
          </div>
        ) : null}

        <div className="flex flex-col gap-1">
          <dt className="text-zinc-500">{t('credential.verify.checkedAtLabel')}</dt>
          <dd>{formatTimestamp(verification.checkedAt)}</dd>
        </div>
      </dl>
    </div>
  );
}
