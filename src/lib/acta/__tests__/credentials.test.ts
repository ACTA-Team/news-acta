import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActaApiError } from '@acta-team/credentials';

/**
 * Fake author_credentials table + a minimal Supabase-shaped query builder.
 * Supports exactly the chains `src/lib/acta/credentials.ts` uses:
 *   .upsert(payload, opts)
 *   .select(cols).eq(col, val).single() / .maybeSingle()
 *   .update(payload).eq(col, val)                       (awaited directly)
 *   .update(payload).eq(col, val).select(cols).single()
 */
interface FakeRow {
  id: string;
  author_id: string;
  vc_id: string;
  role: string;
  status: 'pending' | 'active' | 'revoked' | 'failed';
  issuer_did: string;
  subject_did: string;
  network: 'testnet' | 'mainnet';
  issue_tx_id: string | null;
  revoke_tx_id: string | null;
  issued_at: string | null;
  revoked_at: string | null;
  revocation_reason: string | null;
}

function createFakeSupabase(rows: FakeRow[]) {
  let nextId = 1;

  function from() {
    let op: 'select' | 'update' | 'upsert' = 'select';
    let payload: Partial<FakeRow> | undefined;
    let upsertOpts: { onConflict?: string; ignoreDuplicates?: boolean } | undefined;
    const filters: Array<[keyof FakeRow, unknown]> = [];
    let mode: 'single' | 'maybeSingle' | 'many' = 'many';

    function matches(row: FakeRow) {
      return filters.every(([col, val]) => row[col] === val);
    }

    async function execute() {
      if (op === 'upsert' && payload) {
        const existing = rows.find((r) => r.vc_id === payload!.vc_id);
        if (existing) {
          if (!upsertOpts?.ignoreDuplicates) Object.assign(existing, payload);
          return { data: null, error: null };
        }
        const base = payload as FakeRow;
        const row: FakeRow = {
          ...base,
          id: `row-${nextId++}`,
          issue_tx_id: base.issue_tx_id ?? null,
          revoke_tx_id: base.revoke_tx_id ?? null,
          issued_at: base.issued_at ?? null,
          revoked_at: base.revoked_at ?? null,
          revocation_reason: base.revocation_reason ?? null,
        };
        rows.push(row);
        return { data: null, error: null };
      }

      if (op === 'update') {
        const matched = rows.filter(matches);
        matched.forEach((r) => Object.assign(r, payload));
        if (mode === 'single') {
          return matched[0]
            ? { data: matched[0], error: null }
            : { data: null, error: new Error('not found') };
        }
        if (mode === 'maybeSingle') return { data: matched[0] ?? null, error: null };
        return { data: matched, error: null };
      }

      const matched = rows.filter(matches);
      if (mode === 'single') {
        return matched[0]
          ? { data: matched[0], error: null }
          : { data: null, error: new Error('not found') };
      }
      if (mode === 'maybeSingle') return { data: matched[0] ?? null, error: null };
      return { data: matched, error: null };
    }

    const builder = {
      upsert(value: Partial<FakeRow>, opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
        op = 'upsert';
        payload = value;
        upsertOpts = opts;
        return builder;
      },
      update(value: Partial<FakeRow>) {
        op = 'update';
        payload = value;
        return builder;
      },
      select() {
        return builder;
      },
      eq(col: keyof FakeRow, val: unknown) {
        filters.push([col, val]);
        return builder;
      },
      single() {
        mode = 'single';
        return execute();
      },
      maybeSingle() {
        mode = 'maybeSingle';
        return execute();
      },
      then(onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) {
        return execute().then(onFulfilled, onRejected);
      },
    };

    return builder;
  }

  return { from };
}

const AUTHOR_IDENTITY = {
  authorId: 'author-1',
  did: 'did:stellar:testnet:author1',
  stellarAddress: 'GAUTHOR1111111111111111111111111111111111111111111',
  network: 'testnet' as const,
};

const ISSUER_IDENTITY = {
  did: 'did:stellar:testnet:issuer1',
  controller: 'GAUTHOR1111111111111111111111111111111111111111111',
  assertionPublicKeyMultibase: 'z-assertion',
  assertionPrivateKeyHex: 'aa',
  assertionPublicKeyHex: 'bb',
};

let rows: FakeRow[];

const createAdminClient = vi.fn();
const createAuthorIdentity = vi.fn();
const getAuthorIdentity = vi.fn();
const createServerSigner = vi.fn();
const getActaClient = vi.fn();
const getActaNetwork = vi.fn();

const vaultCreate = vi.fn();
const vcIssue = vi.fn();
const revokeCredentialViaApi = vi.fn();
const vaultVerify = vi.fn();
const getOrCreateIssuerIdentity = vi.fn();
const getIssuerIdentity = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => createAdminClient(),
}));

vi.mock('@/config/site', () => ({
  siteConfig: { url: 'https://news.acta.build' },
}));

vi.mock('@/lib/stellar/config', () => ({
  STELLAR_BLOG_SECRET_KEY: 'SFAKESECRETSFAKESECRETSFAKESECRETSFAKESECRETSFAKESECRET',
}));

vi.mock('../identity', () => ({
  createAuthorIdentity: (...args: unknown[]) => createAuthorIdentity(...args),
  getAuthorIdentity: (...args: unknown[]) => getAuthorIdentity(...args),
}));

vi.mock('../signer', () => ({
  createServerSigner: (...args: unknown[]) => createServerSigner(...args),
}));

vi.mock('../client', () => ({
  getActaClient: () => getActaClient(),
  getActaNetwork: () => getActaNetwork(),
}));

const { issueAuthorCredential, revokeAuthorCredential, verifyAuthorCredential } =
  await import('../credentials');

const PREPARE = { xdr: 'unsigned-xdr', network: 'Test SDF Network ; September 2015' };

beforeEach(() => {
  rows = [];
  createAdminClient.mockReset().mockImplementation(() => createFakeSupabase(rows));
  createAuthorIdentity.mockReset().mockResolvedValue(AUTHOR_IDENTITY);
  getAuthorIdentity.mockReset().mockResolvedValue(AUTHOR_IDENTITY);
  createServerSigner.mockReset().mockReturnValue(async (xdr: string) => `signed:${xdr}`);
  getActaNetwork.mockReset().mockReturnValue('testnet');

  vaultCreate
    .mockReset()
    .mockImplementation(async (payload: { signedXdr?: string }) =>
      payload.signedXdr ? { tx_id: 'vault-tx' } : PREPARE
    );
  vcIssue
    .mockReset()
    .mockImplementation(async (payload: { signedXdr?: string }) =>
      payload.signedXdr ? { tx_id: 'vc-tx' } : PREPARE
    );
  revokeCredentialViaApi
    .mockReset()
    .mockImplementation(async (payload: { signedXdr?: string }) =>
      payload.signedXdr ? { tx_id: 'revoke-tx' } : PREPARE
    );
  vaultVerify.mockReset();
  getOrCreateIssuerIdentity.mockReset().mockResolvedValue(ISSUER_IDENTITY);
  getIssuerIdentity.mockReset().mockResolvedValue(ISSUER_IDENTITY);

  getActaClient.mockReset().mockReturnValue({
    vaultCreate,
    vcIssue,
    revokeCredentialViaApi,
    vaultVerify,
    getOrCreateIssuerIdentity,
    getIssuerIdentity,
  });
});

const INPUT = { authorId: 'author-1', authorSlug: 'jane-doe', name: 'Jane Doe', role: 'Editor' };

describe('issueAuthorCredential', () => {
  it('does not create a duplicate row when called twice for the same author', async () => {
    const first = await issueAuthorCredential(INPUT);
    const second = await issueAuthorCredential(INPUT);

    expect(rows).toHaveLength(1);
    expect(first.status).toBe('active');
    expect(second.id).toBe(first.id);
    // The second call short-circuits on the already-`active` row: no repeat chain calls.
    expect(vcIssue).toHaveBeenCalledTimes(2); // prepare + submit, once total
  });

  it('treats vault_already_exists as success and still issues the credential', async () => {
    vaultCreate.mockRejectedValueOnce(
      new ActaApiError({ status: 409, code: 'vault_already_exists', message: 'already exists' })
    );

    const result = await issueAuthorCredential(INPUT);

    expect(result.status).toBe('active');
    expect(result.issueTxId).toBe('vc-tx');
  });

  it('leaves the row failed without issued_at when the submit step fails', async () => {
    vcIssue.mockImplementationOnce(async () => PREPARE);
    vcIssue.mockImplementationOnce(async () => {
      throw new ActaApiError({ status: 500, code: 'internal', message: 'boom' });
    });

    await expect(issueAuthorCredential(INPUT)).rejects.toThrow();

    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('failed');
    expect(rows[0].issued_at).toBeNull();
    expect(rows[0].issue_tx_id).toBeNull();
  });
});

describe('verifyAuthorCredential', () => {
  async function seedIssuedCredential() {
    await issueAuthorCredential(INPUT);
  }

  it('maps a valid credential', async () => {
    await seedIssuedCredential();
    vaultVerify.mockResolvedValueOnce({ status: 'valid' });

    const result = await verifyAuthorCredential('acta-author-jane-doe');

    expect(result.status).toBe('valid');
    expect(result.issuedByActaNews).toBe(true);
  });

  it('maps a revoked credential', async () => {
    await seedIssuedCredential();
    vaultVerify.mockResolvedValueOnce({ status: 'revoked', since: '2026-01-01T00:00:00Z' });

    const result = await verifyAuthorCredential('acta-author-jane-doe');

    expect(result.status).toBe('revoked');
    expect(result.since).toBe('2026-01-01T00:00:00Z');
  });

  it('maps an unknown vc_id to invalid', async () => {
    const result = await verifyAuthorCredential('acta-author-does-not-exist');

    expect(result.status).toBe('invalid');
    expect(result.issuedByActaNews).toBe(false);
  });

  it('maps a 404 from the vault to invalid', async () => {
    await seedIssuedCredential();
    vaultVerify.mockRejectedValueOnce(
      new ActaApiError({ status: 404, code: 'not_found', message: 'no such vc' })
    );

    const result = await verifyAuthorCredential('acta-author-jane-doe');

    expect(result.status).toBe('invalid');
  });

  it('reports issuer DID mismatch as not issued by ACTA News', async () => {
    await seedIssuedCredential();
    vaultVerify.mockResolvedValueOnce({ status: 'valid' });
    getIssuerIdentity.mockResolvedValueOnce({
      ...ISSUER_IDENTITY,
      did: 'did:stellar:testnet:someone-else',
    });

    const result = await verifyAuthorCredential('acta-author-jane-doe');

    expect(result.status).toBe('valid');
    expect(result.issuedByActaNews).toBe(false);
  });
});

describe('revokeAuthorCredential', () => {
  it('marks the credential revoked with a reason', async () => {
    await issueAuthorCredential(INPUT);

    const result = await revokeAuthorCredential('acta-author-jane-doe', 'left the team');

    expect(result.status).toBe('revoked');
    expect(result.revocationReason).toBe('left the team');
    expect(result.revokeTxId).toBe('revoke-tx');
  });
});
