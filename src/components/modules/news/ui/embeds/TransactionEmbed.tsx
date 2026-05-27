import { ArrowLeftRight, CircleCheck, CircleX } from 'lucide-react';
import type { StellarNetwork, StellarTransactionData } from '@/@types/stellar';
import { explorerUrl } from '@/lib/stellar/explorer';
import { formatTimestamp, stroopsToXlm } from '@/lib/stellar/format';
import { EmbedGrid, EmbedRow, EmbedShell } from './EmbedShell';
import { CopyChip } from './CopyChip';

interface TransactionEmbedProps {
  data: StellarTransactionData;
  network: StellarNetwork;
}

/** Rich card for a Stellar transaction. Server Component (presentational). */
export function TransactionEmbed({ data, network }: TransactionEmbedProps) {
  const op = data.operation;

  return (
    <EmbedShell
      icon={ArrowLeftRight}
      label="Transaction"
      explorerHref={explorerUrl('transaction', data.hash, network)}
      badge={
        data.successful ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.7rem] font-medium text-emerald-600 dark:text-emerald-400">
            <CircleCheck className="size-3" aria-hidden /> Success
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[0.7rem] font-medium text-destructive">
            <CircleX className="size-3" aria-hidden /> Failed
          </span>
        )
      }
    >
      <div className="mb-2">
        <CopyChip value={data.hash} />
      </div>
      <EmbedGrid>
        {op ? <EmbedRow label="Operation">{op.type.replace(/_/g, ' ')}</EmbedRow> : null}
        {op?.amount ? (
          <EmbedRow label="Amount">
            {op.amount} {op.asset ?? ''}
          </EmbedRow>
        ) : null}
        {op?.from ? (
          <EmbedRow label="From">
            <CopyChip value={op.from} />
          </EmbedRow>
        ) : (
          <EmbedRow label="Source">
            <CopyChip value={data.sourceAccount} />
          </EmbedRow>
        )}
        {op?.to ? (
          <EmbedRow label="To">
            <CopyChip value={op.to} />
          </EmbedRow>
        ) : null}
        <EmbedRow label="Fee">{stroopsToXlm(data.feeCharged)} XLM</EmbedRow>
        <EmbedRow label="Operations">{data.operationCount}</EmbedRow>
        <EmbedRow label="Date">{formatTimestamp(data.createdAt)}</EmbedRow>
        {data.memo ? <EmbedRow label="Memo">{data.memo}</EmbedRow> : null}
      </EmbedGrid>
    </EmbedShell>
  );
}
