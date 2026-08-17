import 'server-only';

import { after } from 'next/server';
import type {
  ResolvedStellarEntity,
  StellarEntityRef,
  StellarResolvedData,
} from '@/@types/stellar';
import { readCache, writeCache, writeNotFound } from '@/lib/stellar/cache';
import { fetchAccount, fetchAsset, fetchTransaction, isNotFound } from '@/lib/stellar/horizon';
import { fetchContract, isContractNotFound } from '@/lib/stellar/soroban';

/**
 * Entity resolution orchestration. Server-only.
 *
 * Strategy per entity:
 *   fresh cache hit   → serve immediately
 *   expired cache hit → serve stale immediately + refresh in the background
 *                       (stale-while-revalidate via `after()`)
 *   miss              → fetch now, then cache
 *
 * Guarantees: this never throws. Any failure for a single entity resolves to
 * `status: 'error'` (render a fallback link), and a top-level catch maps the
 * whole batch to errors: article rendering is never blocked.
 */

export function entityKey(ref: StellarEntityRef): string {
  return `${ref.network}:${ref.type}:${ref.id}`;
}

function isNotFoundError(error: unknown): boolean {
  return isNotFound(error) || isContractNotFound(error);
}

async function fetchFresh(ref: StellarEntityRef): Promise<StellarResolvedData> {
  switch (ref.type) {
    case 'transaction':
      return { type: 'transaction', data: await fetchTransaction(ref.id, ref.network) };
    case 'account':
      return { type: 'account', data: await fetchAccount(ref.id, ref.network) };
    case 'asset': {
      const [code, issuer] = ref.id.split(':');
      return { type: 'asset', data: await fetchAsset(code, issuer, ref.network) };
    }
    case 'contract':
      return { type: 'contract', data: await fetchContract(ref.id, ref.network) };
  }
}

async function fetchAndStore(ref: StellarEntityRef): Promise<ResolvedStellarEntity> {
  try {
    const resolved = await fetchFresh(ref);
    await writeCache(ref, resolved);
    return { ref, status: 'ok', resolved, resolvedAt: new Date().toISOString() };
  } catch (error) {
    if (isNotFoundError(error)) {
      await writeNotFound(ref);
      return { ref, status: 'not_found', resolvedAt: new Date().toISOString() };
    }
    console.error(`[stellar] failed to resolve ${ref.type} ${ref.id}:`, error);
    return { ref, status: 'error', resolvedAt: new Date().toISOString() };
  }
}

/** Schedule a background cache refresh (best-effort; ignored if unavailable). */
function scheduleRefresh(ref: StellarEntityRef): void {
  try {
    after(async () => {
      try {
        await fetchAndStore(ref);
      } catch {
        /* background refresh failure is non-fatal */
      }
    });
  } catch {
    // `after()` is only available in request scope; skip otherwise.
  }
}

async function resolveOne(
  ref: StellarEntityRef,
  cached: Awaited<ReturnType<typeof readCache>>
): Promise<ResolvedStellarEntity> {
  const row = cached.get(`${ref.network}:${ref.id}`);

  if (row) {
    const expired = row.expires_at !== null && new Date(row.expires_at).getTime() <= Date.now();
    const cachedNotFound =
      typeof row.resolved_data === 'object' &&
      row.resolved_data !== null &&
      'status' in row.resolved_data &&
      row.resolved_data.status === 'not_found';

    if (!expired) {
      return cachedNotFound
        ? { ref, status: 'not_found', resolvedAt: row.resolved_at }
        : {
            ref,
            status: 'ok',
            resolved: row.resolved_data as StellarResolvedData,
            resolvedAt: row.resolved_at,
          };
    }

    // Expired: for resolved data, serve stale + refresh; for not_found, re-fetch.
    if (!cachedNotFound) {
      scheduleRefresh(ref);
      return {
        ref,
        status: 'ok',
        resolved: row.resolved_data as StellarResolvedData,
        resolvedAt: row.resolved_at,
        stale: true,
      };
    }
  }

  return fetchAndStore(ref);
}

/**
 * Resolve a batch of entity refs. Returns a map keyed by `entityKey(ref)`.
 * Refs are de-duplicated; the caller may pass duplicates freely.
 */
export async function resolveEntities(
  refs: StellarEntityRef[]
): Promise<Map<string, ResolvedStellarEntity>> {
  const result = new Map<string, ResolvedStellarEntity>();
  if (refs.length === 0) return result;

  const unique = new Map<string, StellarEntityRef>();
  for (const ref of refs) unique.set(entityKey(ref), ref);

  try {
    const cached = await readCache([...unique.values()]);
    const settled = await Promise.allSettled(
      [...unique.values()].map((ref) => resolveOne(ref, cached))
    );

    let i = 0;
    for (const ref of unique.values()) {
      const outcome = settled[i++];
      result.set(
        entityKey(ref),
        outcome.status === 'fulfilled'
          ? outcome.value
          : { ref, status: 'error', resolvedAt: new Date().toISOString() }
      );
    }
  } catch (error) {
    console.error('[stellar] batch resolution failed:', error);
    for (const ref of unique.values()) {
      result.set(entityKey(ref), { ref, status: 'error', resolvedAt: new Date().toISOString() });
    }
  }

  return result;
}

/** Convenience for resolving a single entity (used by the admin preview route). */
export async function resolveEntity(ref: StellarEntityRef): Promise<ResolvedStellarEntity> {
  const map = await resolveEntities([ref]);
  return map.get(entityKey(ref)) ?? { ref, status: 'error', resolvedAt: new Date().toISOString() };
}
