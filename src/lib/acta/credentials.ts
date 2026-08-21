import 'server-only';

import { isTxPrepareResponse, isTxSubmitResponse, type Signer } from '@acta-team/credentials';
import { createAdminClient } from '@/lib/supabase/admin';
import { STELLAR_BLOG_SECRET_KEY } from '@/lib/stellar/config';
import { siteConfig } from '@/config/site';
import type { AuthorCredential, CredentialVerification } from '@/@types/credential';
import { getActaClient, getActaNetwork } from './client';
import { createServerSigner } from './signer';
import { createAuthorIdentity, getAuthorIdentity } from './identity';
import { isVaultAlreadyExistsError, toActaApiError } from './errors';

export interface IssueAuthorCredentialInput {
  authorId: string;
  authorSlug: string;
  name: string;
  role: string;
}

type CredentialRow = {
  id: string;
  author_id: string;
  vc_id: string;
  role: string;
  status: 'pending' | 'active' | 'revoked' | 'failed';
  issuer_did: string;
  subject_did: string;
  network: 'testnet' | 'mainnet';
  issue_tx_id: string | null;
  revoke_tx_id: string | null;
  issued_at: string | null;
  revoked_at: string | null;
  revocation_reason: string | null;
};

function mapRow(row: CredentialRow): AuthorCredential {
  return {
    id: row.id,
    authorId: row.author_id,
    vcId: row.vc_id,
    role: row.role,
    status: row.status,
    issuerDid: row.issuer_did,
    subjectDid: row.subject_did,
    network: row.network,
    issueTxId: row.issue_tx_id ?? undefined,
    revokeTxId: row.revoke_tx_id ?? undefined,
    issuedAt: row.issued_at ?? undefined,
    revokedAt: row.revoked_at ?? undefined,
    revocationReason: row.revocation_reason ?? undefined,
  };
}

function blogSigner(): Signer {
  if (!STELLAR_BLOG_SECRET_KEY) throw new Error('Missing STELLAR_BLOG_SECRET_KEY');
  return createServerSigner(STELLAR_BLOG_SECRET_KEY);
}

/** Get or create (and persist) the ACTA issuer identity for this blog. */
async function ensureIssuerIdentity(controller: string) {
  const client = getActaClient();
  return client.getOrCreateIssuerIdentity({
    controller,
    signTransaction: blogSigner(),
  });
}

/**
 * Ensure the shared credential vault owned by the blog account exists.
 * Authors have no wallet of their own, so every author credential lives in
 * this one vault, disambiguated by `vcId` — see `src/lib/acta/identity.ts`
 * for the same reasoning applied to author DIDs. `vault_already_exists` is
 * expected from the second author onward and is treated as success.
 */
async function ensureVault(owner: string, didUri: string): Promise<void> {
  const client = getActaClient();
  const signer = blogSigner();

  let prepared;
  try {
    prepared = await client.vaultCreate({ owner, didUri, sourcePublicKey: owner });
  } catch (err) {
    if (isVaultAlreadyExistsError(err)) return;
    throw toActaApiError(err);
  }

  if (!isTxPrepareResponse(prepared)) return;

  const signedXdr = await signer(prepared.xdr, { networkPassphrase: prepared.network });

  try {
    await client.vaultCreate({ signedXdr });
  } catch (err) {
    if (isVaultAlreadyExistsError(err)) return;
    throw toActaApiError(err);
  }
}

/**
 * Issues an "ACTA Author" credential into the shared author vault.
 *
 * Flow: resolve issuer identity -> resolve author identity -> ensure the
 * vault exists -> issue the VC -> persist the result. Every step is
 * idempotent so a partial failure can be retried without creating
 * duplicates: the row is claimed by `vc_id` (unique) before anything is
 * submitted on-chain, and re-running for an author whose credential is
 * already `active` returns that row unchanged.
 */
export async function issueAuthorCredential(
  input: IssueAuthorCredentialInput
): Promise<AuthorCredential> {
  const supabase = createAdminClient();
  const vcId = `acta-author-${input.authorSlug}`.slice(0, 64);
  const network = getActaNetwork();

  const authorIdentity = await createAuthorIdentity(input.authorId);
  const issuerIdentity = await ensureIssuerIdentity(authorIdentity.stellarAddress);

  // Claim the vc_id slot. Ignored on conflict: a prior attempt (or a second
  // call for the same author) reuses that row instead of duplicating it.
  await supabase.from('author_credentials').upsert(
    {
      author_id: input.authorId,
      vc_id: vcId,
      role: input.role,
      status: 'pending',
      issuer_did: issuerIdentity.did,
      subject_did: authorIdentity.did,
      network,
    },
    { onConflict: 'vc_id', ignoreDuplicates: true }
  );

  const { data: row, error: rowError } = await supabase
    .from('author_credentials')
    .select(
      'id, author_id, vc_id, role, status, issuer_did, subject_did, network, issue_tx_id, revoke_tx_id, issued_at, revoked_at, revocation_reason'
    )
    .eq('vc_id', vcId)
    .single();

  if (rowError) throw rowError;
  if (row.status === 'active') return mapRow(row);

  try {
    await ensureVault(authorIdentity.stellarAddress, issuerIdentity.did);

    const client = getActaClient();
    const signer = blogSigner();
    const owner = authorIdentity.stellarAddress;

    const vcData = JSON.stringify({
      '@context': ['https://www.w3.org/ns/credentials/v2'],
      type: ['VerifiableCredential', 'ActaAuthorCredential'],
      credentialSubject: {
        id: authorIdentity.did,
        name: input.name,
        role: input.role,
        publication: 'ACTA News',
        profile: `${siteConfig.url}/authors/${input.authorSlug}`,
      },
    });

    const prepared = await client.vcIssue({
      owner,
      vcId,
      vcData,
      issuer: owner,
      issuerDid: issuerIdentity.did,
      sourcePublicKey: owner,
    });

    if (!isTxPrepareResponse(prepared)) {
      throw new Error('Unexpected ACTA response: expected a prepare response from vcIssue.');
    }

    const signedXdr = await signer(prepared.xdr, { networkPassphrase: prepared.network });
    const submitted = await client.vcIssue({ signedXdr });

    if (!isTxSubmitResponse(submitted)) {
      throw new Error('Unexpected ACTA response: expected a submit response from vcIssue.');
    }

    const { data: updated, error: updateError } = await supabase
      .from('author_credentials')
      .update({
        status: 'active',
        issue_tx_id: submitted.tx_id,
        issued_at: new Date().toISOString(),
      })
      .eq('id', row.id)
      .select(
        'id, author_id, vc_id, role, status, issuer_did, subject_did, network, issue_tx_id, revoke_tx_id, issued_at, revoked_at, revocation_reason'
      )
      .single();

    if (updateError) throw updateError;
    return mapRow(updated);
  } catch (err) {
    await supabase.from('author_credentials').update({ status: 'failed' }).eq('id', row.id);
    throw toActaApiError(err);
  }
}

/** Revokes an author's credential. The reason is shown in admin only. */
export async function revokeAuthorCredential(
  vcId: string,
  reason: string
): Promise<AuthorCredential> {
  const supabase = createAdminClient();

  const { data: row, error: rowError } = await supabase
    .from('author_credentials')
    .select(
      'id, author_id, vc_id, role, status, issuer_did, subject_did, network, issue_tx_id, revoke_tx_id, issued_at, revoked_at, revocation_reason'
    )
    .eq('vc_id', vcId)
    .single();

  if (rowError) throw rowError;

  const authorIdentity = await createAuthorIdentity(row.author_id);
  const client = getActaClient();
  const signer = blogSigner();
  const owner = authorIdentity.stellarAddress;

  const prepared = await client.revokeCredentialViaApi({ owner, vcId, sourcePublicKey: owner });

  if (!isTxPrepareResponse(prepared)) {
    throw new Error('Unexpected ACTA response: expected a prepare response from revoke.');
  }

  const signedXdr = await signer(prepared.xdr, { networkPassphrase: prepared.network });
  const submitted = await client.revokeCredentialViaApi({ signedXdr });

  if (!isTxSubmitResponse(submitted)) {
    throw new Error('Unexpected ACTA response: expected a submit response from revoke.');
  }

  const { data: updated, error: updateError } = await supabase
    .from('author_credentials')
    .update({
      status: 'revoked',
      revoke_tx_id: submitted.tx_id,
      revoked_at: new Date().toISOString(),
      revocation_reason: reason,
    })
    .eq('id', row.id)
    .select(
      'id, author_id, vc_id, role, status, issuer_did, subject_did, network, issue_tx_id, revoke_tx_id, issued_at, revoked_at, revocation_reason'
    )
    .single();

  if (updateError) throw updateError;
  return mapRow(updated);
}

/**
 * Verifies a credential against the Vault contract, re-checking status
 * on-chain every call (never cached).
 */
export async function verifyAuthorCredential(vcId: string): Promise<CredentialVerification> {
  const supabase = createAdminClient();
  const checkedAt = new Date().toISOString();

  const { data: row, error } = await supabase
    .from('author_credentials')
    .select('author_id, issuer_did, subject_did')
    .eq('vc_id', vcId)
    .maybeSingle();

  if (error) throw error;
  if (!row) return { status: 'invalid', checkedAt, issuedByActaNews: false };

  // Read-only lookup: `verifyAuthorCredential` is reachable from the public
  // `/verify/[vcId]` page, so it must never register a DID or write on-chain.
  const authorIdentity = await getAuthorIdentity(row.author_id);
  if (!authorIdentity) {
    return {
      status: 'invalid',
      checkedAt,
      issuerDid: row.issuer_did,
      subjectDid: row.subject_did,
      issuedByActaNews: false,
    };
  }

  try {
    const client = getActaClient();
    const result = await client.vaultVerify({ owner: authorIdentity.stellarAddress, vcId });
    const issuerIdentity = await getActaClient().getIssuerIdentity(authorIdentity.stellarAddress);

    return {
      status: result.status,
      since: result.since,
      checkedAt,
      issuerDid: row.issuer_did,
      subjectDid: row.subject_did,
      issuedByActaNews: Boolean(issuerIdentity && issuerIdentity.did === row.issuer_did),
    };
  } catch (err) {
    const normalized = toActaApiError(err);
    if (normalized.status === 404) {
      return {
        status: 'invalid',
        checkedAt,
        issuerDid: row.issuer_did,
        subjectDid: row.subject_did,
        issuedByActaNews: false,
      };
    }
    throw normalized;
  }
}
