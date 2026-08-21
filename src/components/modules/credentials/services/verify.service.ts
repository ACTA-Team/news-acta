import type { CredentialVerification } from '@/@types/credential';

/**
 * Re-checks a credential's status on-chain. Never throws: the `/verify`
 * page must render either way, so an ACTA outage or misconfiguration
 * degrades to "unable to verify right now" instead of a 500.
 */
export async function fetchCredentialVerification(
  vcId: string
): Promise<CredentialVerification | null> {
  try {
    const { verifyAuthorCredential } = await import('@/lib/acta');
    return await verifyAuthorCredential(vcId);
  } catch (err) {
    console.error(`[acta] Failed to verify credential "${vcId}":`, err);
    return null;
  }
}
