import 'server-only';

import type { IssuerIdentity, IssuerIdentityStorage } from '@acta-team/credentials';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase';
import type { ActaNetwork } from '@/@types/credential';

/** Single-row guard: the blog only ever has one issuer identity. */
const ROW_ID = 'default';

/**
 * Persists the ACTA issuer identity in `acta_issuer_identity`.
 *
 * Without this, the SDK's default Node storage is in-memory and mints a
 * brand new `did:stellar` issuer on every server restart — see
 * `EphemeralIssuerStorageError` in `@acta-team/credentials`. This backend is
 * durable, so it is never selected as an "ephemeral" store.
 */
export class SupabaseIssuerIdentityStorage implements IssuerIdentityStorage {
  readonly isEphemeral = false;

  async get(controller: string, network: 'mainnet' | 'testnet'): Promise<IssuerIdentity | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('acta_issuer_identity')
      .select('controller, did, payload, network')
      .eq('id', ROW_ID)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    if (data.controller !== controller || data.network !== network) return null;

    return data.payload as unknown as IssuerIdentity;
  }

  async set(identity: IssuerIdentity, network: ActaNetwork): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase.from('acta_issuer_identity').upsert(
      {
        id: ROW_ID,
        controller: identity.controller,
        did: identity.did,
        payload: identity as unknown as Json,
        network,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) throw error;
  }
}
