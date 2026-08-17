import 'server-only';

import type {
  StellarEmbedCacheRow,
  StellarEntityRef,
  StellarEntityType,
  StellarNetwork,
  StellarResolvedData,
} from '@/@types/stellar';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPublicClient } from '@/lib/supabase/public';
import { CACHE_TTL_SECONDS, NOT_FOUND_TTL_SECONDS } from '@/lib/stellar/config';

/**
 * `stellar_embeds_cache` access. Server-only.
 *
 * Reads go through the anon/public client (the table has a public SELECT
 * policy). Writes go through the service-role client, which bypasses RLS:
 * if no service-role key is configured, caching is silently skipped so the
 * resolver still works (it just re-fetches each time). Nothing here throws to
 * the caller: failures degrade to "no cache".
 */

function cacheKey(network: StellarNetwork, entityId: string): string {
  return `${network}:${entityId}`;
}

function hasServiceRole(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return typeof key === 'string' && key.trim().length > 0 && !key.includes('<');
}

/** Compute an `expires_at` ISO string for a successful result, or null (immutable). */
export function computeExpiry(type: StellarEntityType): string | null {
  const ttl = CACHE_TTL_SECONDS[type];
  if (ttl === null) return null;
  return new Date(Date.now() + ttl * 1000).toISOString();
}

/** Batch-read cache rows for the given refs. Returns a map keyed by network:id. */
export async function readCache(
  refs: StellarEntityRef[]
): Promise<Map<string, StellarEmbedCacheRow>> {
  const map = new Map<string, StellarEmbedCacheRow>();
  if (refs.length === 0) return map;

  const network = refs[0].network;
  const ids = [...new Set(refs.map((r) => r.id))];

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('stellar_embeds_cache')
      .select('*')
      .eq('network', network)
      .in('entity_id', ids);

    if (error || !data) return map;

    for (const row of data as unknown as StellarEmbedCacheRow[]) {
      map.set(cacheKey(row.network, row.entity_id), row);
    }
  } catch {
    // Treat any cache read failure as a cache miss.
  }
  return map;
}

/** Upsert a successful resolution. No-op if the service-role key is absent. */
export async function writeCache(
  ref: StellarEntityRef,
  resolved: StellarResolvedData
): Promise<void> {
  await upsert(ref, resolved, computeExpiry(ref.type));
}

/** Cache a confirmed not-found result with a short TTL so we retry later. */
export async function writeNotFound(ref: StellarEntityRef): Promise<void> {
  await upsert(
    ref,
    { status: 'not_found' },
    new Date(Date.now() + NOT_FOUND_TTL_SECONDS * 1000).toISOString()
  );
}

async function upsert(
  ref: StellarEntityRef,
  resolvedData: StellarResolvedData | { status: 'not_found' },
  expiresAt: string | null
): Promise<void> {
  if (!hasServiceRole()) return;
  try {
    const supabase = createAdminClient();
    await supabase.from('stellar_embeds_cache').upsert(
      {
        entity_id: ref.id,
        entity_type: ref.type,
        network: ref.network,
        resolved_data: resolvedData as never,
        resolved_at: new Date().toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: 'entity_id,network' }
    );
  } catch {
    // Best-effort: a failed cache write must never affect rendering.
  }
}

export { cacheKey };
