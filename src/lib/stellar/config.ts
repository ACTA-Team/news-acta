import type { StellarEntityType, StellarNetwork } from '@/@types/stellar';

/**
 * Stellar network + endpoint configuration.
 *
 * Client-safe: only reads `NEXT_PUBLIC_*` env vars and exposes plain values.
 * The active network defaults to `testnet` locally and is overridable per
 * deploy via `NEXT_PUBLIC_STELLAR_NETWORK` (`testnet` | `mainnet` | `public`).
 */

interface NetworkEndpoints {
  horizon: string;
  sorobanRpc: string;
  /** stellar.expert path segment for this network. */
  explorerNetwork: 'public' | 'testnet';
}

const ENDPOINTS: Record<StellarNetwork, NetworkEndpoints> = {
  mainnet: {
    horizon: 'https://horizon.stellar.org',
    sorobanRpc: 'https://mainnet.sorobanrpc.com',
    explorerNetwork: 'public',
  },
  testnet: {
    horizon: 'https://horizon-testnet.stellar.org',
    sorobanRpc: 'https://soroban-testnet.stellar.org',
    explorerNetwork: 'testnet',
  },
};

/** Cache TTLs in seconds, by entity type. `null` = never expires. */
export const CACHE_TTL_SECONDS: Record<StellarEntityType, number | null> = {
  transaction: null,
  contract: 24 * 60 * 60,
  account: 60 * 60,
  asset: 6 * 60 * 60,
};

/** Short TTL applied to a `not_found` result so we retry occasionally. */
export const NOT_FOUND_TTL_SECONDS = 10 * 60;

/** Per-request timeout for any single Stellar API call. */
export const STELLAR_FETCH_TIMEOUT_MS = 4000;

/** Normalise the env value into one of our two network identifiers. */
export function normalizeNetwork(value: string | undefined): StellarNetwork {
  const v = value?.trim().toLowerCase();
  if (v === 'mainnet' || v === 'public') return 'mainnet';
  return 'testnet';
}

/** The active network, read from `NEXT_PUBLIC_STELLAR_NETWORK`. */
export function getActiveNetwork(): StellarNetwork {
  return normalizeNetwork(process.env.NEXT_PUBLIC_STELLAR_NETWORK);
}

/** Horizon base URL for `network` (overridable via `NEXT_PUBLIC_STELLAR_HORIZON_URL`). */
export function getHorizonUrl(network: StellarNetwork): string {
  const override = process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL?.trim();
  if (override && network === getActiveNetwork()) return stripTrailingSlash(override);
  return ENDPOINTS[network].horizon;
}

/** Soroban RPC base URL for `network` (overridable via `STELLAR_SOROBAN_RPC_URL`). */
export function getSorobanRpcUrl(network: StellarNetwork): string {
  const override = process.env.STELLAR_SOROBAN_RPC_URL?.trim();
  if (override && network === getActiveNetwork()) return stripTrailingSlash(override);
  return ENDPOINTS[network].sorobanRpc;
}

export function getExplorerNetworkSegment(network: StellarNetwork): 'public' | 'testnet' {
  return ENDPOINTS[network].explorerNetwork;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

// =============================================================================
// Server-side attestation config (used by client.ts / anchor / hash modules).
// These read server-only env vars and must not be imported into client bundles.
// =============================================================================

export const STELLAR_NETWORK = process.env.STELLAR_NETWORK || 'testnet';
export const STELLAR_HORIZON_URL =
  process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
export const STELLAR_BLOG_SECRET_KEY = process.env.STELLAR_BLOG_SECRET_KEY || '';
