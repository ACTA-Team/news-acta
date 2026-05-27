/**
 * Stellar embeds domain types.
 *
 * Convention (mirrors `news.ts`): every type in the `stellar` domain lives here.
 * UI and lib consume these types; nothing imports types out of `lib/stellar/*`
 * or the embed components.
 *
 * Backs issue #27 — rich, inline previews for Stellar transaction hashes,
 * contract IDs, account addresses and assets mentioned in article content.
 */

/** Stellar's "public" network is referred to as `mainnet` throughout the app. */
export type StellarNetwork = 'testnet' | 'mainnet';

export type StellarEntityType = 'transaction' | 'contract' | 'account' | 'asset';

/**
 * A detected (not yet resolved) reference to a Stellar entity.
 *
 * - `id` is the canonical identifier used as the cache key:
 *     transaction → 64-char lowercase hex hash
 *     contract    → `C…` StrKey
 *     account     → `G…` StrKey
 *     asset       → `CODE:ISSUER`
 * - `raw` is the exact substring matched in the content (may be a
 *   `[[stellar:…]]` tag or a bare string) — used to replace it in place.
 */
export interface StellarEntityRef {
  type: StellarEntityType;
  id: string;
  raw: string;
  network: StellarNetwork;
}

/** Resolved transaction data (subset of Horizon's `/transactions/{hash}`). */
export interface StellarTransactionData {
  hash: string;
  successful: boolean;
  ledger: number;
  createdAt: string;
  sourceAccount: string;
  feeCharged: string;
  operationCount: number;
  memo?: string;
  memoType?: string;
  /** Primary operation, summarised for the card. */
  operation?: {
    type: string;
    from?: string;
    to?: string;
    amount?: string;
    asset?: string;
  };
}

/** Resolved contract data (best-effort; some fields need an indexer). */
export interface StellarContractData {
  contractId: string;
  wasmHash?: string;
  deployedAt?: string;
  deployer?: string;
  storageEntries?: number;
}

/** Resolved account data (subset of Horizon's `/accounts/{id}`). */
export interface StellarAccountData {
  accountId: string;
  xlmBalance: string;
  assetCount: number;
  sequence: string;
  signerCount: number;
  dataEntryCount: number;
  homeDomain?: string;
}

/** Resolved asset data (subset of Horizon's `/assets`). */
export interface StellarAssetData {
  code: string;
  issuer: string;
  totalSupply: string;
  trustlines: number;
  flags: {
    authRequired: boolean;
    authRevocable: boolean;
    authImmutable: boolean;
    authClawbackEnabled: boolean;
  };
}

export type StellarResolvedData =
  | { type: 'transaction'; data: StellarTransactionData }
  | { type: 'contract'; data: StellarContractData }
  | { type: 'account'; data: StellarAccountData }
  | { type: 'asset'; data: StellarAssetData };

/**
 * Outcome of resolving a single entity.
 * - `ok`        → `data` is present.
 * - `not_found` → the network confirmed the entity does not exist (404).
 * - `error`     → resolution failed (unreachable/timeout); render a fallback link.
 */
export interface ResolvedStellarEntity {
  ref: StellarEntityRef;
  status: 'ok' | 'not_found' | 'error';
  resolved?: StellarResolvedData;
  resolvedAt: string;
  /** True when served from cache past its TTL while a refresh is scheduled. */
  stale?: boolean;
}

/**
 * One ordered piece of parsed article content. The renderer walks these in
 * order: `html` chunks are emitted verbatim, `entity` chunks become embeds.
 */
export type ArticleSegment =
  | { kind: 'html'; html: string }
  | { kind: 'entity'; ref: StellarEntityRef; resolved?: ResolvedStellarEntity };

/** Mirror of a `stellar_embeds_cache` row (see migration 0003). */
export interface StellarEmbedCacheRow {
  entity_id: string;
  entity_type: StellarEntityType;
  network: StellarNetwork;
  resolved_data: StellarResolvedData | { status: 'not_found' };
  resolved_at: string;
  expires_at: string | null;
}
