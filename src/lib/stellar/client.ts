import StellarSdk, { Keypair, Networks, Horizon, Operation, TransactionBuilder } from 'stellar-sdk';
import { STELLAR_BLOG_SECRET_KEY, STELLAR_NETWORK, STELLAR_HORIZON_URL } from './config';

export function getStellarServer() {
  return new StellarSdk.Horizon.Server(STELLAR_HORIZON_URL);
}

export function getNetworkPassphrase() {
  return STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
}

export function getBlogKeypair() {
  if (!STELLAR_BLOG_SECRET_KEY) throw new Error('Missing STELLAR_BLOG_SECRET_KEY');
  return Keypair.fromSecret(STELLAR_BLOG_SECRET_KEY);
}

/**
 * Stellar on-chain anchor for article versions.
 *
 * Submits a `manageData` operation on the blog account for every new version:
 *   key   = `version:<slug>` (truncated to 64 bytes)
 *   value = `<versionNumber>:<contentHash[:32]>` (≤64 bytes)
 *
 * The call is intentionally fire-and-forget: errors are swallowed and logged
 * so that version creation is never blocked by Stellar latency or downtime.
 *
 * Environment variables:
 *   STELLAR_SECRET_KEY   — required; signing keypair for the blog account
 *   STELLAR_HORIZON_URL  — optional; defaults to Testnet
 */

const HORIZON_URL = process.env.STELLAR_HORIZON_URL ?? 'https://horizon-testnet.stellar.org';

const NETWORK_PASSPHRASE = process.env.STELLAR_HORIZON_URL
  ? Networks.PUBLIC // If a custom URL is provided assume mainnet; override with STELLAR_NETWORK if needed
  : Networks.TESTNET;

function getKeypair(): Keypair | null {
  const secret = process.env.STELLAR_SECRET_KEY;
  if (!secret) return null;
  try {
    return Keypair.fromSecret(secret);
  } catch {
    console.warn('[stellar] Invalid STELLAR_SECRET_KEY — Stellar anchoring disabled.');
    return null;
  }
}

/**
 * Submit a `manageData` operation anchoring a version to Stellar.
 *
 * @returns The transaction hash on success, or `null` if Stellar is not
 *          configured or the submission failed.
 */
export async function submitVersionChain(
  slug: string,
  versionNumber: number,
  contentHash: string
): Promise<string | null> {
  const keypair = getKeypair();
  if (!keypair) {
    console.info('[stellar] STELLAR_SECRET_KEY not set — skipping on-chain anchor.');
    return null;
  }

  try {
    const server = new Horizon.Server(HORIZON_URL);
    const account = await server.loadAccount(keypair.publicKey());

    // key: "version:<slug>" — Stellar data-key max is 64 bytes
    const rawKey = `version:${slug}`;
    const dataKey = rawKey.length > 64 ? rawKey.slice(0, 64) : rawKey;

    // value: "<versionNumber>:<first32charsOfHash>" — max 64 bytes
    const dataValue = `${versionNumber}:${contentHash.slice(0, 32)}`;

    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.manageData({
          name: dataKey,
          value: dataValue,
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(keypair);
    const result = await server.submitTransaction(tx);
    const txHash = (result as { hash?: string }).hash ?? null;
    console.info(`[stellar] Anchored version ${versionNumber} of "${slug}" — tx: ${txHash}`);
    return txHash;
  } catch (err) {
    // Never throw — version creation must succeed regardless
    console.error('[stellar] Failed to submit version chain:', err);
    return null;
  }
}
