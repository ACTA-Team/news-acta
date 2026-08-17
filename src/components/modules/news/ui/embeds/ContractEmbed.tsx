import { FileCode2 } from 'lucide-react';
import type { StellarContractData, StellarNetwork } from '@/@types/stellar';
import { explorerUrl } from '@/lib/stellar/explorer';
import { formatCount, formatTimestamp, truncateMiddle } from '@/lib/stellar/format';
import { EmbedGrid, EmbedRow, EmbedShell } from './EmbedShell';
import { CopyChip } from './CopyChip';

interface ContractEmbedProps {
  data: StellarContractData;
  network: StellarNetwork;
}

/**
 * Rich card for a Soroban contract. Server Component (presentational).
 * Deploy date / deployer require an indexer that plain Soroban RPC does not
 * expose, so they show "-" with the explorer link covering the rest.
 */
export function ContractEmbed({ data, network }: ContractEmbedProps) {
  return (
    <EmbedShell
      icon={FileCode2}
      label="Contract"
      explorerHref={explorerUrl('contract', data.contractId, network)}
    >
      <div className="mb-2">
        <CopyChip value={data.contractId} />
      </div>
      <EmbedGrid>
        <EmbedRow label="Wasm hash">
          {data.wasmHash ? (
            <CopyChip value={data.wasmHash} display={truncateMiddle(data.wasmHash, 6, 6)} />
          ) : (
            '-'
          )}
        </EmbedRow>
        <EmbedRow label="Storage entries">
          {data.storageEntries !== undefined ? formatCount(data.storageEntries) : '-'}
        </EmbedRow>
        <EmbedRow label="Deployed">
          {data.deployedAt ? formatTimestamp(data.deployedAt) : '-'}
        </EmbedRow>
        <EmbedRow label="Deployer">
          {data.deployer ? <CopyChip value={data.deployer} /> : '-'}
        </EmbedRow>
      </EmbedGrid>
    </EmbedShell>
  );
}
