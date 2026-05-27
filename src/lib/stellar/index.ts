/**
 * Public barrel for the `stellar` lib — CLIENT-SAFE pieces only.
 *
 * The parser, StrKey validation, network config and explorer helpers are pure
 * and safe to import from client components (e.g. the admin modal).
 *
 * Server-only modules are intentionally NOT re-exported here so they cannot be
 * pulled into a client bundle. Import them directly from their paths:
 *   import { resolveEntities } from '@/lib/stellar/resolver';
 *   import { fetchTransaction } from '@/lib/stellar/horizon';
 */
export { parseArticleContent, detectEntity, collectEntities } from '@/lib/stellar/parser';
export { isValidAccountId, isValidContractId } from '@/lib/stellar/strkey';
export { explorerUrl } from '@/lib/stellar/explorer';
export { getActiveNetwork, normalizeNetwork, CACHE_TTL_SECONDS } from '@/lib/stellar/config';
export {
  truncateMiddle,
  formatDecimal,
  stroopsToXlm,
  formatCount,
  formatTimestamp,
} from '@/lib/stellar/format';
