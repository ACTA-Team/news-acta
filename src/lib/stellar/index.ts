export * from './horizon';
export * from './soroban';

export interface EcosystemSnapshotMetrics {
  horizon: import('./horizon').HorizonAggregateMetrics;
  soroban: import('./soroban').SorobanAggregateMetrics;
  collectedAt: string;
}

export async function fetchAllEcosystemMetrics(): Promise<EcosystemSnapshotMetrics> {
  const [horizon, soroban] = await Promise.all([
    import('./horizon').then(m => m.fetchAllHorizonMetrics()),
    import('./soroban').then(m => m.fetchAllSorobanMetrics()),
  ]);

  return {
    horizon,
    soroban,
    collectedAt: new Date().toISOString(),
  };
}
