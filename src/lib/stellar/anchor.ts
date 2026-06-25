/**
 * Stellar hash anchoring service.
 *
 * Anchors a SHA-256 content hash on the Stellar network using a
 * manageData operation. The key is "media:{mediaId}" and the value
 * is the first 64 bytes of the hex hash (Stellar manageData values
 * are limited to 64 bytes).
 *
 * Server-side only — requires STELLAR_SECRET_KEY.
 */

import 'server-only';

/** Stellar network passphrase. */
const STELLAR_NETWORK = process.env.STELLAR_NETWORK ?? 'testnet';

const HORIZON_URLS: Record<string, string> = {
  testnet: 'https://horizon-testnet.stellar.org',
  mainnet: 'https://horizon.stellar.org',
  public: 'https://horizon.stellar.org',
};

function getHorizonUrl(): string {
  return HORIZON_URLS[STELLAR_NETWORK] ?? HORIZON_URLS.testnet;
}

export interface AnchorResult {
  txHash: string;
  ledger: number;
  network: string;
}

/**
 * Anchor a content hash on Stellar.
 *
 * @param mediaId     UUID of the media_library record.
 * @param contentHash SHA-256 hex string of the original file.
 * @returns Transaction hash and ledger number.
 */
export async function anchorHashOnStellar(
  mediaId: string,
  contentHash: string
): Promise<AnchorResult> {
  const secretKey = process.env.STELLAR_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Missing STELLAR_SECRET_KEY environment variable');
  }

  // Dynamically import the Stellar SDK to avoid bundling it client-side.
  const StellarSdk = await import('@stellar/stellar-sdk');

  const horizonUrl = getHorizonUrl();
  const server = new StellarSdk.Horizon.Server(horizonUrl);

  const keypair = StellarSdk.Keypair.fromSecret(secretKey);
  const account = await server.loadAccount(keypair.publicKey());

  // manageData key: "media:{first-8-chars-of-id}" (max 64 bytes for key)
  const dataKey = `media:${mediaId.slice(0, 8)}`;
  // manageData value: first 64 bytes of the hex hash
  const dataValue = contentHash.slice(0, 64);

  const networkPassphrase =
    STELLAR_NETWORK === 'mainnet' || STELLAR_NETWORK === 'public'
      ? StellarSdk.Networks.PUBLIC
      : StellarSdk.Networks.TESTNET;

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.manageData({
        name: dataKey,
        value: dataValue,
      })
    )
    .setTimeout(30)
    .build();

  transaction.sign(keypair);

  const result = await server.submitTransaction(transaction);

  return {
    txHash: result.hash,
    ledger: result.ledger,
    network: STELLAR_NETWORK,
  };
}

/**
 * Verify that a content hash is anchored on Stellar.
 * Looks up the transaction by hash and checks the manageData operation.
 */
export async function verifyAnchor(
  txHash: string,
  expectedHash: string
): Promise<{ verified: boolean; ledger?: number }> {
  try {
    const StellarSdk = await import('@stellar/stellar-sdk');
    const horizonUrl = getHorizonUrl();
    const server = new StellarSdk.Horizon.Server(horizonUrl);

    const tx = await server.transactions().transaction(txHash).call();
    if (!tx.successful) return { verified: false };

    // Fetch operations and find the matching manage_data entry
    const ops = await server.operations().forTransaction(txHash).call();
    for (const op of ops.records) {
      if (op.type !== 'manage_data') continue;
      const manageDataOp = op as unknown as { type: string; value: string };
      // value is base64-encoded
      const decoded = Buffer.from(manageDataOp.value, 'base64').toString('utf8');
      if (decoded === expectedHash.slice(0, 64)) {
        return { verified: true, ledger: tx.ledger as unknown as number };
      }
    }

    return { verified: false };
  } catch {
    return { verified: false };
  }
}
