-- =============================================================================
-- ACTA News — Stellar embeds cache (issue #27)
--
-- Caches resolved Stellar entity data (transactions, contracts, accounts,
-- assets) so article rendering can serve embeds without hitting Horizon /
-- Soroban on every request.
--
-- Cache strategy (TTL set by the app via `expires_at`):
--   transactions → never expire (immutable on-ledger)  → expires_at NULL
--   contracts    → 24 hours
--   accounts     → 1 hour
--   assets       → 6 hours
--
-- Deviation from the issue spec: the primary key is `(entity_id, network)`
-- rather than `entity_id` alone — the same id (hash/account/asset) can exist
-- on both testnet and mainnet, so the network must be part of the key.
-- =============================================================================

create table if not exists public.stellar_embeds_cache (
  entity_id     text not null,
  entity_type   text not null
    check (entity_type in ('transaction', 'contract', 'account', 'asset')),
  network       text not null
    check (network in ('testnet', 'mainnet')),
  resolved_data jsonb not null,
  resolved_at   timestamptz not null default now(),
  expires_at    timestamptz,
  primary key (entity_id, network)
);

create index if not exists stellar_embeds_cache_expires_at_idx
  on public.stellar_embeds_cache (expires_at);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Resolved data is public (it is already public on-ledger), so anyone may
-- read it. Writes happen only from the server via the service-role client,
-- which bypasses RLS — so no write policy is granted to anon/authenticated.
-- ---------------------------------------------------------------------------
alter table public.stellar_embeds_cache enable row level security;

drop policy if exists "stellar embeds are readable by everyone"
  on public.stellar_embeds_cache;

create policy "stellar embeds are readable by everyone"
  on public.stellar_embeds_cache
  for select
  using (true);
