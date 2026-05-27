import { randomBytes } from 'node:crypto';
import { Keypair, StrKey } from '@stellar/stellar-sdk';
import { describe, expect, it } from 'vitest';
import type { ArticleSegment, StellarEntityType } from '@/@types/stellar';
import { collectEntities, detectEntity, parseArticleContent } from '@/lib/stellar/parser';

const ACCOUNT = Keypair.random().publicKey();
const ISSUER = Keypair.random().publicKey();
const CONTRACT = StrKey.encodeContract(randomBytes(32));
const TX_HASH = randomBytes(32).toString('hex'); // 64 hex chars

function entityTypes(segments: ArticleSegment[]): StellarEntityType[] {
  return segments.filter((s) => s.kind === 'entity').map((s) => s.ref.type);
}

describe('detectEntity', () => {
  it('classifies each entity type', () => {
    expect(detectEntity(ACCOUNT)?.type).toBe('account');
    expect(detectEntity(CONTRACT)?.type).toBe('contract');
    expect(detectEntity(TX_HASH)?.type).toBe('transaction');
    expect(detectEntity(`USDC:${ISSUER}`)?.type).toBe('asset');
  });

  it('returns null for invalid input', () => {
    expect(detectEntity('hello world')).toBeNull();
    expect(detectEntity('USDC:GINVALID')).toBeNull();
  });
});

describe('parseArticleContent', () => {
  it('detects account, contract, asset and transaction in prose', () => {
    const content = `<p>Account ${ACCOUNT} sent funds in tx ${TX_HASH}.</p>
      <p>Contract ${CONTRACT} issues ${'USDC'}:${ISSUER}.</p>`;
    expect(entityTypes(parseArticleContent(content)).sort()).toEqual([
      'account',
      'asset',
      'contract',
      'transaction',
    ]);
  });

  it('matches assets as a whole rather than just the issuer account', () => {
    const segments = parseArticleContent(`Trade <span>USDC:${ISSUER}</span> today`);
    const types = entityTypes(segments);
    expect(types).toEqual(['asset']);
    expect(types).not.toContain('account');
  });

  it('skips entities inside <code> and <pre> blocks', () => {
    expect(entityTypes(parseArticleContent(`<code>${ACCOUNT}</code>`))).toEqual([]);
    expect(entityTypes(parseArticleContent(`<pre>tx ${TX_HASH}</pre>`))).toEqual([]);
  });

  it('skips entities inside anchor tags and URLs', () => {
    expect(entityTypes(parseArticleContent(`<a href="/x">${ACCOUNT}</a>`))).toEqual([]);
    expect(
      entityTypes(parseArticleContent(`See https://stellar.expert/explorer/public/tx/${TX_HASH}`))
    ).toEqual([]);
  });

  it('does not match ids that appear inside HTML attributes', () => {
    expect(entityTypes(parseArticleContent(`<img alt="${ACCOUNT}" src="x" />`))).toEqual([]);
  });

  it('resolves explicit [[stellar:…]] reference tags', () => {
    const segments = parseArticleContent(`Ref [[stellar:${CONTRACT}]] here`);
    expect(entityTypes(segments)).toEqual(['contract']);
    const entity = segments.find((s) => s.kind === 'entity');
    expect(entity?.kind === 'entity' && entity.ref.id).toBe(CONTRACT);
  });

  it('leaves checksum-invalid look-alikes as plain text', () => {
    const ch = ACCOUNT[30] === 'A' ? 'B' : 'A';
    const bogus = ACCOUNT.slice(0, 30) + ch + ACCOUNT.slice(31);
    const segments = parseArticleContent(`Address ${bogus} is fake`);
    expect(entityTypes(segments)).toEqual([]);
    expect(segments).toHaveLength(1);
    expect(segments[0].kind === 'html' && segments[0].html).toContain(bogus);
  });

  it('preserves surrounding html around an entity', () => {
    const segments = parseArticleContent(`<p>Before ${ACCOUNT} after</p>`);
    expect(segments.map((s) => s.kind)).toEqual(['html', 'entity', 'html']);
    expect(segments[0].kind === 'html' && segments[0].html).toContain('<p>Before ');
    expect(segments[2].kind === 'html' && segments[2].html).toContain(' after</p>');
  });

  it('de-duplicates collected entities', () => {
    const segments = parseArticleContent(`${ACCOUNT} and again ${ACCOUNT}`);
    expect(entityTypes(segments)).toHaveLength(2);
    expect(collectEntities(segments)).toHaveLength(1);
  });
});
