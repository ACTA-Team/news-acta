export type AttestationStatus = 'pending' | 'confirmed' | 'failed';

export interface ArticleAttestation {
  id: string;
  article_id: string;
  version: number;
  content_hash: string;
  stellar_tx_hash: string | null;
  ledger: number | null;
  network: 'testnet' | 'mainnet';
  status: AttestationStatus;
  previous_attestation_id?: string | null;
  created_at: string;
}
