import Link from 'next/link';
import type { ArticleAttestation } from '@/@types/attestation';
import { withLocale, type Locale } from '@/i18n';
import { CREDENTIAL_ROUTES } from '@/components/modules/credentials/constants';

interface AttestationPanelProps {
  attestation: ArticleAttestation | null;
  articleHash: string;
  /** The author credential active when this article was attested, if any. */
  authorDid?: string;
  authorCredentialVcId?: string;
  locale: Locale;
}

export function AttestationPanel({
  attestation,
  articleHash,
  authorDid,
  authorCredentialVcId,
  locale,
}: AttestationPanelProps) {
  if (!attestation) return null;
  const verified = attestation.content_hash === articleHash;
  return (
    <div className="rounded border p-4 text-sm bg-white dark:bg-zinc-900">
      <div className="mb-2 font-semibold">Stellar Attestation</div>
      <div className="mb-1">
        Content hash: <span className="font-mono break-all">{attestation.content_hash}</span>
      </div>
      <div className="mb-1">
        Stellar tx:{' '}
        {attestation.stellar_tx_hash ? (
          <a
            href={`https://stellar.expert/explorer/${attestation.network}/tx/${attestation.stellar_tx_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {attestation.stellar_tx_hash}
          </a>
        ) : (
          'N/A'
        )}
      </div>
      <div className="mb-1">Ledger: {attestation.ledger ?? 'N/A'}</div>
      <div className="mb-1">
        Status:{' '}
        <span className={verified ? 'text-green-600' : 'text-red-600'}>
          {verified ? 'Verified' : 'Hash mismatch'}
        </span>
      </div>
      {authorDid ? (
        <div className="mb-1">
          Author: <span className="font-mono break-all">{authorDid}</span>
          {authorCredentialVcId ? (
            <>
              {' '}
              (
              <Link
                href={withLocale(locale, CREDENTIAL_ROUTES.verify(authorCredentialVcId))}
                className="text-blue-600 underline"
              >
                verify
              </Link>
              )
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
