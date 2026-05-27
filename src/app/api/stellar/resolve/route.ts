import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentAdmin } from '@/components/modules/admin/services/auth.service';
import { normalizeNetwork } from '@/lib/stellar/config';
import { detectEntity } from '@/lib/stellar/parser';
import { resolveEntity } from '@/lib/stellar/resolver';

/**
 * Resolve a single Stellar entity for the admin editor's "Insert Stellar
 * Reference" preview. Admin-gated so it cannot be used as an open proxy.
 *
 *   GET /api/stellar/resolve?entity=<id|CODE:ISSUER>&network=<testnet|mainnet>
 */
export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const entity = (url.searchParams.get('entity') ?? '').trim();
  const network = normalizeNetwork(url.searchParams.get('network') ?? undefined);

  if (!entity) {
    return NextResponse.json({ ok: false, error: 'missing entity' }, { status: 400 });
  }

  const ref = detectEntity(entity, network);
  if (!ref) {
    return NextResponse.json(
      { ok: false, error: 'Unrecognized Stellar entity. Check the id and its checksum.' },
      { status: 422 }
    );
  }

  const resolved = await resolveEntity(ref);
  return NextResponse.json({ ok: true, entity: resolved });
}
