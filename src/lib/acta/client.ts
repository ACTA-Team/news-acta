import 'server-only';

import { ActaClient, mainNet, testNet } from '@acta-team/credentials';
import type { ActaNetwork } from '@/@types/credential';
import { SupabaseIssuerIdentityStorage } from './identity-storage';

/** `ACTA_NETWORK` (server) selects which ACTA API the blog issues against. */
export function getActaNetwork(): ActaNetwork {
  return process.env.ACTA_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
}

const BASE_URL = getActaNetwork() === 'mainnet' ? mainNet : testNet;

let client: ActaClient | null = null;

/** Singleton ACTA SDK client, configured with the durable Supabase-backed
 * issuer identity storage so the issuer DID survives server restarts. */
export function getActaClient(): ActaClient {
  if (client) return client;

  const apiKey = process.env.ACTA_API_KEY;
  if (!apiKey) throw new Error('ACTA_API_KEY is not set');

  client = new ActaClient(BASE_URL, apiKey, {
    storage: new SupabaseIssuerIdentityStorage(),
  });
  return client;
}
