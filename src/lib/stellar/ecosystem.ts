import 'server-only';

import type { HorizonAggregateMetrics } from '@/lib/stellar/horizon';
import type { SorobanAggregateMetrics } from '@/lib/stellar/soroban';

export interface EcosystemSnapshotMetrics {
  horizon: HorizonAggregateMetrics;
  soroban: SorobanAggregateMetrics;
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
