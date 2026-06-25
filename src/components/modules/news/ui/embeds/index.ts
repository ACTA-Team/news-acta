/**
 * Client-safe barrel for Stellar embed components.
 *
 * Everything exported here is presentational and safe to import from client
 * components (e.g. the admin "Insert Stellar Reference" modal renders a live
 * preview with `StellarEmbed`).
 *
 * NOTE: `ArticleContent` is deliberately NOT exported here — it depends on the
 * server-only resolver. Import it from the news module barrel instead
 * (`@/components/modules/news`).
 */
export { StellarEmbed } from './StellarEmbed';
export { EmbedSkeleton } from './EmbedSkeleton';
export { EmbedFallback } from './EmbedFallback';
export { TransactionEmbed } from './TransactionEmbed';
export { AccountEmbed } from './AccountEmbed';
export { ContractEmbed } from './ContractEmbed';
export { AssetEmbed } from './AssetEmbed';
export { CopyChip } from './CopyChip';
