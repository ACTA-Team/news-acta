import 'server-only';

import type {
  StellarAccountData,
  StellarAssetData,
  StellarNetwork,
  StellarTransactionData,
} from '@/@types/stellar';
import { getHorizonUrl, STELLAR_FETCH_TIMEOUT_MS } from '@/lib/stellar/config';

/**
 * Horizon REST clients (transactions, accounts, assets).
 *
 * Server-only. Plain `fetch` with a per-call timeout and `no-store` — our own
 * `stellar_embeds_cache` table is the cache layer, so Horizon responses are
 * never additionally cached by Next.
 *
 * Convention for the three fetchers:
 *   resolves to data → found
 *   resolves to null → confirmed not found (HTTP 404)
 *   throws           → unreachable / timeout / unexpected status
 */

/** A 404 from Horizon: the entity does not exist. */
class NotFoundError extends Error {}

async function horizonGet<T>(network: StellarNetwork, path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STELLAR_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${getHorizonUrl(network)}${path}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (res.status === 404) throw new NotFoundError();
    if (!res.ok) throw new Error(`Horizon ${res.status} for ${path}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export function isNotFound(error: unknown): boolean {
  return error instanceof NotFoundError;
}

// --- Transactions ---------------------------------------------------------

interface HorizonTransaction {
  hash: string;
  successful: boolean;
  ledger: number;
  created_at: string;
  source_account: string;
  fee_charged: string;
  operation_count: number;
  memo?: string;
  memo_type?: string;
}

interface HorizonOperationRecord {
  type: string;
  from?: string;
  to?: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
}

export async function fetchTransaction(
  hash: string,
  network: StellarNetwork
): Promise<StellarTransactionData> {
  const tx = await horizonGet<HorizonTransaction>(network, `/transactions/${hash}`);

  let operation: StellarTransactionData['operation'];
  try {
    const ops = await horizonGet<{ _embedded: { records: HorizonOperationRecord[] } }>(
      network,
      `/transactions/${hash}/operations?limit=1`
    );
    const op = ops._embedded.records[0];
    if (op) {
      operation = {
        type: op.type,
        from: op.from,
        to: op.to,
        amount: op.amount,
        asset: op.asset_type === 'native' ? 'XLM' : op.asset_code ? `${op.asset_code}` : undefined,
      };
    }
  } catch {
    // Operation summary is best-effort; the card still renders without it.
  }

  return {
    hash: tx.hash,
    successful: tx.successful,
    ledger: tx.ledger,
    createdAt: tx.created_at,
    sourceAccount: tx.source_account,
    feeCharged: tx.fee_charged,
    operationCount: tx.operation_count,
    memo: tx.memo,
    memoType: tx.memo_type,
    operation,
  };
}

// --- Accounts -------------------------------------------------------------

interface HorizonBalance {
  asset_type: string;
  balance: string;
}

interface HorizonAccount {
  sequence: string;
  balances: HorizonBalance[];
  signers: unknown[];
  data: Record<string, string>;
  home_domain?: string;
}

export async function fetchAccount(
  accountId: string,
  network: StellarNetwork
): Promise<StellarAccountData> {
  const account = await horizonGet<HorizonAccount>(network, `/accounts/${accountId}`);

  const native = account.balances.find((b) => b.asset_type === 'native');
  const assetCount = account.balances.filter((b) => b.asset_type !== 'native').length;

  return {
    accountId,
    xlmBalance: native?.balance ?? '0',
    assetCount,
    sequence: account.sequence,
    signerCount: account.signers?.length ?? 0,
    dataEntryCount: Object.keys(account.data ?? {}).length,
    homeDomain: account.home_domain,
  };
}

// --- Assets ---------------------------------------------------------------

interface HorizonAssetRecord {
  asset_code: string;
  asset_issuer: string;
  amount: string;
  num_accounts?: number;
  accounts?: {
    authorized?: number;
    authorized_to_maintain_liabilities?: number;
    unauthorized?: number;
  };
  flags: {
    auth_required: boolean;
    auth_revocable: boolean;
    auth_immutable: boolean;
    auth_clawback_enabled: boolean;
  };
}

export async function fetchAsset(
  code: string,
  issuer: string,
  network: StellarNetwork
): Promise<StellarAssetData> {
  const result = await horizonGet<{ _embedded: { records: HorizonAssetRecord[] } }>(
    network,
    `/assets?asset_code=${encodeURIComponent(code)}&asset_issuer=${encodeURIComponent(issuer)}`
  );

  const record = result._embedded.records[0];
  if (!record) throw new NotFoundError();

  const trustlines =
    record.num_accounts ??
    (record.accounts
      ? (record.accounts.authorized ?? 0) +
        (record.accounts.authorized_to_maintain_liabilities ?? 0) +
        (record.accounts.unauthorized ?? 0)
      : 0);

  return {
    code: record.asset_code,
    issuer: record.asset_issuer,
    totalSupply: record.amount,
    trustlines,
    flags: {
      authRequired: record.flags.auth_required,
      authRevocable: record.flags.auth_revocable,
      authImmutable: record.flags.auth_immutable,
      authClawbackEnabled: record.flags.auth_clawback_enabled,
    },
  };
}
