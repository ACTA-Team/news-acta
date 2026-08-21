/**
 * Verifiable-credential types for author identity.
 *
 * Convention: every type in the `credential` domain lives here.
 * These mirror `supabase/migrations/0008_author_identities.sql` and the
 * `@acta-team/credentials` SDK response shapes wrapped by `src/lib/acta/`.
 */

export type AuthorCredentialStatus = 'pending' | 'active' | 'revoked' | 'failed';

export type ActaNetwork = 'testnet' | 'mainnet';

export interface AuthorIdentity {
  authorId: string;
  did: string;
  stellarAddress: string;
  vaultContractId?: string;
  network: ActaNetwork;
}

export interface AuthorCredential {
  id: string;
  authorId: string;
  vcId: string;
  role: string;
  status: AuthorCredentialStatus;
  issuerDid: string;
  subjectDid: string;
  network: ActaNetwork;
  issueTxId?: string;
  revokeTxId?: string;
  issuedAt?: string;
  revokedAt?: string;
  revocationReason?: string;
}

export interface CredentialVerification {
  status: 'valid' | 'revoked' | 'invalid';
  since?: string;
  checkedAt: string;
  /** True only when `issuerDid` matches the blog's configured issuer DID. */
  issuedByActaNews: boolean;
  issuerDid?: string;
  subjectDid?: string;
}
