import 'server-only';

import { Keypair, TransactionBuilder } from '@stellar/stellar-sdk';
import type { Signer } from '@acta-team/credentials';

/**
 * Server side signer for ACTA prepare/submit flows.
 *
 * ACTA is non custodial: every write returns an unsigned XDR that must be
 * signed locally. On the server this signs with the blog keypair
 * (`STELLAR_BLOG_SECRET_KEY`), the same key `src/lib/stellar/attestation.ts`
 * already uses for article attestations.
 *
 * The secret never leaves the server and is never logged. Any operation that
 * needs an author's own signature instead of the blog's must be routed
 * through the browser, not through this function — out of scope for now (see
 * issue #42: "Author self service onboarding with a browser wallet").
 */
export function createServerSigner(secret: string): Signer {
  const keypair = Keypair.fromSecret(secret);

  return async (xdr, options) => {
    const tx = TransactionBuilder.fromXDR(xdr, options.networkPassphrase);
    tx.sign(keypair);
    return tx.toXDR();
  };
}
