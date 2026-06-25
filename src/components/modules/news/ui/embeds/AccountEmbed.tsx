import { Wallet } from 'lucide-react';
import type { StellarAccountData, StellarNetwork } from '@/@types/stellar';
import { explorerUrl } from '@/lib/stellar/explorer';
import { formatCount, formatDecimal } from '@/lib/stellar/format';
import { EmbedGrid, EmbedRow, EmbedShell } from './EmbedShell';
import { CopyChip } from './CopyChip';

interface AccountEmbedProps {
  data: StellarAccountData;
  network: StellarNetwork;
}

/** Rich card for a Stellar account. Server Component (presentational). */
export function AccountEmbed({ data, network }: AccountEmbedProps) {
  return (
    <EmbedShell
      icon={Wallet}
      label="Account"
      explorerHref={explorerUrl('account', data.accountId, network)}
    >
      <div className="mb-2">
        <CopyChip value={data.accountId} />
      </div>
      <EmbedGrid>
        <EmbedRow label="XLM balance">{formatDecimal(data.xlmBalance)}</EmbedRow>
        <EmbedRow label="Assets held">{formatCount(data.assetCount)}</EmbedRow>
        <EmbedRow label="Signers">{formatCount(data.signerCount)}</EmbedRow>
        <EmbedRow label="Data entries">{formatCount(data.dataEntryCount)}</EmbedRow>
        {data.homeDomain ? <EmbedRow label="Home domain">{data.homeDomain}</EmbedRow> : null}
      </EmbedGrid>
    </EmbedShell>
  );
}
