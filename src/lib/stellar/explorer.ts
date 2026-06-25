import type { StellarEntityType, StellarNetwork } from '@/@types/stellar';
import { getExplorerNetworkSegment } from '@/lib/stellar/config';

/**
 * Build a stellar.expert explorer URL for an entity.
 *
 * Client-safe and pure. Used both by the embed cards ("view on explorer")
 * and by the failure fallback (raw id rendered as a clickable link).
 */
export function explorerUrl(type: StellarEntityType, id: string, network: StellarNetwork): string {
  const seg = getExplorerNetworkSegment(network);
  const base = `https://stellar.expert/explorer/${seg}`;

  switch (type) {
    case 'transaction':
      return `${base}/tx/${id}`;
    case 'contract':
      return `${base}/contract/${id}`;
    case 'account':
      return `${base}/account/${id}`;
    case 'asset': {
      // id is `CODE:ISSUER`; stellar.expert expects `CODE-ISSUER`.
      const [code, issuer] = id.split(':');
      return `${base}/asset/${code}-${issuer}`;
    }
  }
}
