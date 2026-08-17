import type { ArticleSegment, StellarEntityRef, StellarNetwork } from '@/@types/stellar';
import { getActiveNetwork } from '@/lib/stellar/config';
import { isValidAccountId, isValidContractId } from '@/lib/stellar/strkey';

/**
 * Stellar entity parser: pure and client-safe (no SDK, no I/O).
 *
 * Scans article content (HTML or plain text) for Stellar entities and returns
 * an ordered list of segments: HTML passes through verbatim; recognised
 * entities become `entity` segments that the renderer swaps for embed cards.
 *
 * Detection is skipped inside protected regions (`<pre>`, `<code>`, `<a>…</a>`,
 * HTML tag interiors and bare URLs) so transaction hashes shown as code and
 * ids embedded in links are never mangled. `G…`/`C…` candidates and asset
 * issuers are checksum-validated (see `strkey.ts`) to reject look-alikes.
 */

// Regions whose contents must never be scanned. Block constructs are listed
// before the generic-tag alternative so they win at a shared start position.
const PROTECTED_RE =
  /<pre\b[\s\S]*?<\/pre>|<code\b[\s\S]*?<\/code>|<a\b[\s\S]*?<\/a>|<[^>]+>|https?:\/\/[^\s<>"]+/gi;

// Entity candidates, in priority order: explicit tag, asset (code:issuer),
// account, contract, transaction hash. Asset precedes account so a
// `CODE:GISSUER` is matched whole rather than just its issuer address.
const ENTITY_RE = new RegExp(
  [
    /\[\[stellar:\s*([^\]\s|]+)[^\]]*\]\]/.source,
    /(?<![A-Za-z0-9])([A-Za-z0-9]{1,12}:G[A-Z2-7]{55})(?![A-Za-z0-9])/.source,
    /(?<![A-Za-z0-9])(G[A-Z2-7]{55})(?![A-Za-z0-9])/.source,
    /(?<![A-Za-z0-9])(C[A-Z2-7]{55})(?![A-Za-z0-9])/.source,
    /(?<![A-Za-z0-9])([0-9a-fA-F]{64})(?![A-Za-z0-9])/.source,
  ].join('|'),
  'g'
);

/**
 * Classify a single bare value into an entity ref, or return null if it is
 * not a recognised (and checksum-valid) Stellar entity. Used for explicit
 * `[[stellar:…]]` tags and by the admin modal's single-value preview.
 */
export function detectEntity(
  value: string,
  network: StellarNetwork = getActiveNetwork()
): StellarEntityRef | null {
  const raw = value.trim();

  const assetMatch = /^([A-Za-z0-9]{1,12}):(G[A-Z2-7]{55})$/.exec(raw);
  if (assetMatch && isValidAccountId(assetMatch[2])) {
    return { type: 'asset', id: `${assetMatch[1]}:${assetMatch[2]}`, raw, network };
  }
  if (/^G[A-Z2-7]{55}$/.test(raw) && isValidAccountId(raw)) {
    return { type: 'account', id: raw, raw, network };
  }
  if (/^C[A-Z2-7]{55}$/.test(raw) && isValidContractId(raw)) {
    return { type: 'contract', id: raw, raw, network };
  }
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return { type: 'transaction', id: raw.toLowerCase(), raw, network };
  }
  return null;
}

/** Build a ref from a regex match group, validating checksums. */
function refFromMatch(
  match: RegExpExecArray,
  raw: string,
  network: StellarNetwork
): StellarEntityRef | null {
  const [, tagValue, asset, account, contract, txHash] = match;

  if (tagValue !== undefined) {
    const ref = detectEntity(tagValue, network);
    return ref ? { ...ref, raw } : null;
  }
  if (asset !== undefined) {
    const issuer = asset.split(':')[1];
    return isValidAccountId(issuer) ? { type: 'asset', id: asset, raw, network } : null;
  }
  if (account !== undefined) {
    return isValidAccountId(account) ? { type: 'account', id: account, raw, network } : null;
  }
  if (contract !== undefined) {
    return isValidContractId(contract) ? { type: 'contract', id: contract, raw, network } : null;
  }
  if (txHash !== undefined) {
    return { type: 'transaction', id: txHash.toLowerCase(), raw, network };
  }
  return null;
}

/** Append `html`, merging into the previous html segment to keep fragments minimal. */
function pushHtml(segments: ArticleSegment[], html: string): void {
  if (!html) return;
  const last = segments[segments.length - 1];
  if (last && last.kind === 'html') {
    last.html += html;
  } else {
    segments.push({ kind: 'html', html });
  }
}

/** Scan a run of unprotected text, emitting html + entity segments in order. */
function scanText(segments: ArticleSegment[], text: string, network: StellarNetwork): void {
  ENTITY_RE.lastIndex = 0;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = ENTITY_RE.exec(text)) !== null) {
    const ref = refFromMatch(match, match[0], network);
    if (!ref) {
      // Looks-like but invalid (e.g. bad checksum): leave it as plain text.
      continue;
    }
    pushHtml(segments, text.slice(cursor, match.index));
    segments.push({ kind: 'entity', ref });
    cursor = match.index + match[0].length;
  }
  pushHtml(segments, text.slice(cursor));
}

/**
 * Parse article content into ordered segments. The renderer maps these to
 * HTML fragments and embed cards.
 */
export function parseArticleContent(
  content: string,
  network: StellarNetwork = getActiveNetwork()
): ArticleSegment[] {
  const segments: ArticleSegment[] = [];
  if (!content) return segments;

  PROTECTED_RE.lastIndex = 0;
  let cursor = 0;
  let protectedMatch: RegExpExecArray | null;

  while ((protectedMatch = PROTECTED_RE.exec(content)) !== null) {
    scanText(segments, content.slice(cursor, protectedMatch.index), network);
    pushHtml(segments, protectedMatch[0]); // protected region passes through untouched
    cursor = protectedMatch.index + protectedMatch[0].length;
  }
  scanText(segments, content.slice(cursor), network);

  return segments;
}

/** Unique entity refs found in `segments`, keyed by `${network}:${type}:${id}`. */
export function collectEntities(segments: ArticleSegment[]): StellarEntityRef[] {
  const seen = new Map<string, StellarEntityRef>();
  for (const seg of segments) {
    if (seg.kind === 'entity') {
      const key = `${seg.ref.network}:${seg.ref.type}:${seg.ref.id}`;
      if (!seen.has(key)) seen.set(key, seg.ref);
    }
  }
  return [...seen.values()];
}
