import { Coins } from 'lucide-react';
import type { StellarAssetData, StellarNetwork } from '@/@types/stellar';
import { explorerUrl } from '@/lib/stellar/explorer';
import { formatCount, formatDecimal } from '@/lib/stellar/format';
import { EmbedGrid, EmbedRow, EmbedShell } from './EmbedShell';
import { CopyChip } from './CopyChip';

interface AssetEmbedProps {
  data: StellarAssetData;
  network: StellarNetwork;
}

const FLAG_LABELS: Array<{ key: keyof StellarAssetData['flags']; label: string }> = [
  { key: 'authRequired', label: 'Auth required' },
  { key: 'authRevocable', label: 'Auth revocable' },
  { key: 'authImmutable', label: 'Immutable' },
  { key: 'authClawbackEnabled', label: 'Clawback' },
];

/** Rich card for a Stellar asset. Server Component (presentational). */
export function AssetEmbed({ data, network }: AssetEmbedProps) {
  const activeFlags = FLAG_LABELS.filter(({ key }) => data.flags[key]);

  return (
    <EmbedShell
      icon={Coins}
      label="Asset"
      explorerHref={explorerUrl('asset', `${data.code}:${data.issuer}`, network)}
      badge={
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.7rem] font-semibold text-primary">
          {data.code}
        </span>
      }
    >
      <EmbedGrid>
        <EmbedRow label="Issuer">
          <CopyChip value={data.issuer} />
        </EmbedRow>
        <EmbedRow label="Total supply">{formatDecimal(data.totalSupply)}</EmbedRow>
        <EmbedRow label="Trustlines">{formatCount(data.trustlines)}</EmbedRow>
      </EmbedGrid>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {activeFlags.length > 0 ? (
          activeFlags.map(({ key, label }) => (
            <span
              key={key}
              className="rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-medium text-muted-foreground"
            >
              {label}
            </span>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">No special flags</span>
        )}
      </div>
    </EmbedShell>
  );
}
