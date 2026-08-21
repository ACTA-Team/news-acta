import 'server-only';

import { Keypair } from '@stellar/stellar-sdk';
import { IssuerIdentityProvider, InMemoryIssuerIdentityStorage } from '@acta-team/credentials';
import { createAdminClient } from '@/lib/supabase/admin';
import { STELLAR_BLOG_SECRET_KEY } from '@/lib/stellar/config';
import type { AuthorIdentity } from '@/@types/credential';
import { createServerSigner } from './signer';
import { getActaNetwork } from './client';

type AuthorIdentityRow = {
  author_id: string;
  did: string;
  stellar_address: string;
  vault_contract_id: string | null;
  network: 'testnet' | 'mainnet';
};

function mapRow(row: AuthorIdentityRow): AuthorIdentity {
  return {
    authorId: row.author_id,
    did: row.did,
    stellarAddress: row.stellar_address,
    vaultContractId: row.vault_contract_id ?? undefined,
    network: row.network,
  };
}

/** The persisted `did:stellar` identity for an author, or `null` if none exists yet. */
export async function getAuthorIdentity(authorId: string): Promise<AuthorIdentity | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('author_identities')
    .select('author_id, did, stellar_address, vault_contract_id, network')
    .eq('author_id', authorId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data) : null;
}

/**
 * Registers a real `did:stellar` identity for an author. Idempotent: an
 * existing identity is returned as-is rather than re-registered.
 *
 * Authors have no wallet of their own — self-service onboarding with a
 * browser wallet is explicitly out of scope for issue #42 — so the blog's own
 * Stellar account is the on-chain controller for every author DID, exactly as
 * it already is for article attestations (`STELLAR_BLOG_SECRET_KEY`). What
 * makes each author's identity distinct is the DID itself: registering with
 * fresh, never-persisted storage forces the SDK to mint a brand new
 * `did:stellar` on-chain every call, even though the controller account is
 * shared. The generated assertion/authentication keys are never written to
 * our database — only the resulting DID is durable — which is fine because
 * every later write for this author (vault creation, credential issuance) is
 * signed by the blog's own key, not the author's.
 */
export async function createAuthorIdentity(authorId: string): Promise<AuthorIdentity> {
  const existing = await getAuthorIdentity(authorId);
  if (existing) return existing;

  if (!STELLAR_BLOG_SECRET_KEY) throw new Error('Missing STELLAR_BLOG_SECRET_KEY');

  const network = getActaNetwork();
  const controller = Keypair.fromSecret(STELLAR_BLOG_SECRET_KEY).publicKey();

  const provider = new IssuerIdentityProvider({
    network,
    storage: new InMemoryIssuerIdentityStorage(),
  });

  const identity = await provider.getOrCreate({
    controller,
    signTransaction: createServerSigner(STELLAR_BLOG_SECRET_KEY),
  });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('author_identities')
    .insert({
      author_id: authorId,
      did: identity.did,
      stellar_address: controller,
      network,
    })
    .select('author_id, did, stellar_address, vault_contract_id, network')
    .single();

  if (error) throw error;
  return mapRow(data);
}
