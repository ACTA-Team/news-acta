import { getStellarServer, getNetworkPassphrase, getBlogKeypair } from './client';
import { Operation, TransactionBuilder, BASE_FEE } from 'stellar-sdk';

export async function submitAttestation(slug: string, hash: string) {
  const server = getStellarServer();
  const keypair = getBlogKeypair();
  const account = await server.loadAccount(keypair.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(),
  })
    .addOperation(
      Operation.manageData({
        name: `article:${slug}`,
        value: hash,
      })
    )
    .setTimeout(60)
    .build();
  tx.sign(keypair);
  const res = await server.submitTransaction(tx);
  return {
    stellar_tx_hash: res.hash,
    ledger: res.ledger,
  };
}
