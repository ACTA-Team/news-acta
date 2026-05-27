import type { ArticleAttestation } from '@/@types/attestation';

interface AttestationBadgeProps {
  attestation?: ArticleAttestation | null;
}

export function AttestationBadge({ attestation }: AttestationBadgeProps) {
  if (!attestation) return null;
  if (attestation.status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="#F59E42" strokeWidth="2" />
          <circle cx="12" cy="16" r="1" fill="#F59E42" />
          <path stroke="#F59E42" strokeWidth="2" strokeLinecap="round" d="M12 8v4" />
        </svg>
        Verification in progress
      </span>
    );
  }
  if (attestation.status === 'confirmed') {
    return (
      <button
        className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-200"
        title="View Stellar attestation"
        // TODO: open verification panel
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="#22C55E" strokeWidth="2" />
          <path stroke="#22C55E" strokeWidth="2" strokeLinecap="round" d="M8 12l2.5 2.5L16 9" />
        </svg>
        Verified on Stellar
      </button>
    );
  }
  return null;
}
