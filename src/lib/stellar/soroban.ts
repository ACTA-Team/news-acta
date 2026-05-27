import 'server-only';

import { rpc, xdr } from '@stellar/stellar-sdk';
import type { StellarContractData, StellarNetwork } from '@/@types/stellar';
import { getSorobanRpcUrl, STELLAR_FETCH_TIMEOUT_MS } from '@/lib/stellar/config';

/**
 * Soroban RPC client for contract data. Server-only.
 *
 * Best-effort by design: it reads the contract instance's executable (wasm
 * hash) and storage-entry count via `getContractData`. Deploy date and
 * deployer require an indexer that plain Soroban RPC does not expose, so those
 * fields are left undefined — the embed shows what it has plus an explorer
 * link. Any parsing/transport failure throws and is rendered as a fallback.
 */

class ContractNotFoundError extends Error {}

export function isContractNotFound(error: unknown): boolean {
  return error instanceof ContractNotFoundError;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Soroban RPC timeout')), ms)),
  ]);
}

export async function fetchContract(
  contractId: string,
  network: StellarNetwork
): Promise<StellarContractData> {
  const url = getSorobanRpcUrl(network);
  const server = new rpc.Server(url, { allowHttp: url.startsWith('http://') });

  let entry;
  try {
    entry = await withTimeout(
      server.getContractData(
        contractId,
        xdr.ScVal.scvLedgerKeyContractInstance(),
        rpc.Durability.Persistent
      ),
      STELLAR_FETCH_TIMEOUT_MS
    );
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    if (message.includes('not found') || message.includes('could not obtain')) {
      throw new ContractNotFoundError();
    }
    throw error;
  }

  const result: StellarContractData = { contractId };

  // Defensive XDR walk — the executable/storage shape varies by SDK version,
  // so any access failure degrades to "wasm hash unavailable" rather than
  // breaking resolution.
  try {
    const instance = entry.val.contractData().val().instance();
    const executable = instance.executable();
    if (executable.switch().name === 'contractExecutableWasm') {
      result.wasmHash = Buffer.from(executable.wasmHash()).toString('hex');
    }
    const storage = instance.storage();
    result.storageEntries = Array.isArray(storage) ? storage.length : 0;
  } catch {
    // wasm hash / storage count unavailable; keep the contract id + explorer link.
  }

  return result;
}
