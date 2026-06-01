import fetch from 'node-fetch';

export interface HorizonOperation {
  id: string;
  paging_token: string;
  type: string;
  transaction_hash?: string;
  source_account?: string;
  [key: string]: any;
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
  const ops: HorizonOperation[] = (data._embedded?.records || []).map((r: any) => r as HorizonOperation);
  const nextCursor = ops.length ? ops[ops.length - 1].paging_token : undefined;
  return { operations: ops, nextCursor };
}

export function classifyOperation(op: HorizonOperation): { eventType: string; significance: string; summary?: string } {
  const t = op.type;
  if (t === 'create_account') return { eventType: 'account_create', significance: 'low', summary: `Account created: ${op.account}` };
  if (t === 'payment' || t === 'payment_strict_receive') {
    const amount = op.amount || op.value || '0';
    const significance = Number(amount) > 100 ? 'high' : 'medium';
    return { eventType: 'payment', significance, summary: `Payment ${amount} ${op.asset_type || 'XLM'}` };
  }
  if (t === 'change_trust') return { eventType: 'trust_change', significance: 'medium', summary: `Trustline change` };
  if (t === 'manage_data') return { eventType: 'data_entry', significance: 'low', summary: `Data entry updated` };
  if (t === 'invoke_host_function' || t === 'invoke_contract') return { eventType: 'contract_invoke', significance: 'high', summary: `Contract invoked` };
  if (t === 'deploy_contract') return { eventType: 'contract_deploy', significance: 'high', summary: `Contract deployed` };
  return { eventType: t, significance: 'low', summary: `Operation ${t}` };
}
