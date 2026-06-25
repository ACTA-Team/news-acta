import type { ResolvedStellarEntity } from '@/@types/stellar';
import { AccountEmbed } from './AccountEmbed';
import { AssetEmbed } from './AssetEmbed';
import { ContractEmbed } from './ContractEmbed';
import { EmbedFallback } from './EmbedFallback';
import { TransactionEmbed } from './TransactionEmbed';

interface StellarEmbedProps {
  entity: ResolvedStellarEntity;
}

/**
 * Dispatches a resolved entity to its embed card, or to the minimal fallback
 * when resolution failed (`error`) or the entity does not exist (`not_found`).
 * Server Component.
 */
export function StellarEmbed({ entity }: StellarEmbedProps) {
  const { ref, status, resolved } = entity;

  if (status !== 'ok' || !resolved) {
    return <EmbedFallback entityRef={ref} notFound={status === 'not_found'} />;
  }

  switch (resolved.type) {
    case 'transaction':
      return <TransactionEmbed data={resolved.data} network={ref.network} />;
    case 'account':
      return <AccountEmbed data={resolved.data} network={ref.network} />;
    case 'contract':
      return <ContractEmbed data={resolved.data} network={ref.network} />;
    case 'asset':
      return <AssetEmbed data={resolved.data} network={ref.network} />;
  }
}
