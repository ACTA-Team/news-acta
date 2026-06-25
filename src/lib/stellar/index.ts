export * from './horizon';
export * from './soroban';

export interface EcosystemSnapshotMetrics {
  horizon: import('./horizon').HorizonAggregateMetrics;
  soroban: import('./soroban').SorobanAggregateMetrics;
  collectedAt: string;
}

export async function fetchAllEcosystemMetrics(): Promise<EcosystemSnapshotMetrics> {
  const [horizon, soroban] = await Promise.all([
    import('./horizon').then((m) => m.fetchAllHorizonMetrics()),
    import('./soroban').then((m) => m.fetchAllSorobanMetrics()),
  ]);

  return {
    horizon,
    soroban,
    collectedAt: new Date().toISOString(),
  };
}

// =============================================================================
// Activity scanner helpers (monitored accounts -> activity_events)
// =============================================================================

export interface HorizonOperation {
  id: string;
  paging_token: string;
  type: string;
  transaction_hash?: string;
  source_account?: string;
  [key: string]: unknown;
}

export async function fetchOperationsSince(
  horizonUrl: string,
  account: string,
  cursor?: string
): Promise<{ operations: HorizonOperation[]; nextCursor?: string }> {
  const url = new URL(`${horizonUrl.replace(/\/$/, '')}/accounts/${account}/operations`);
  url.searchParams.set('limit', '200');
  url.searchParams.set('order', 'asc');
  if (cursor) url.searchParams.set('cursor', cursor);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Horizon fetch failed: ${res.status}`);
  const data = await res.json();
  const ops: HorizonOperation[] = (data._embedded?.records || []).map(
    (r: unknown) => r as HorizonOperation
  );
  const nextCursor = ops.length ? ops[ops.length - 1].paging_token : undefined;
  return { operations: ops, nextCursor };
}

export function classifyOperation(op: HorizonOperation): {
  eventType: string;
  significance: string;
  summary?: string;
} {
  const t = op.type;
  if (t === 'create_account')
    return {
      eventType: 'account_create',
      significance: 'low',
      summary: `Account created: ${op.account as string}`,
    };
  if (t === 'payment' || t === 'payment_strict_receive') {
    const amount = (op.amount as string) || (op.value as string) || '0';
    const significance = Number(amount) > 100 ? 'high' : 'medium';
    return {
      eventType: 'payment',
      significance,
      summary: `Payment ${amount} ${(op.asset_type as string) || 'XLM'}`,
    };
  }
  if (t === 'change_trust')
    return { eventType: 'trust_change', significance: 'medium', summary: `Trustline change` };
  if (t === 'manage_data')
    return { eventType: 'data_entry', significance: 'low', summary: `Data entry updated` };
  if (t === 'invoke_host_function' || t === 'invoke_contract')
    return { eventType: 'contract_invoke', significance: 'high', summary: `Contract invoked` };
  if (t === 'deploy_contract')
    return { eventType: 'contract_deploy', significance: 'high', summary: `Contract deployed` };
  return { eventType: t, significance: 'low', summary: `Operation ${t}` };
}
