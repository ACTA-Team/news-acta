-- =============================================================================
-- ACTA News — Stellar ecosystem snapshots
--
-- Stores aggregated Horizon API and Soroban RPC metrics for a given YYYY-MM
-- period, for both mainnet and testnet.
-- =============================================================================

create table if not exists public.ecosystem_snapshots (
  id              uuid primary key default gen_random_uuid(),
  period          text not null check (period ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  network         text not null check (network in ('mainnet', 'testnet')),
  horizon_metrics jsonb not null default '{}'::jsonb,
  soroban_metrics jsonb not null default '{}'::jsonb,
  collected_at    timestamptz not null default now()
);

-- Ensure a single record per period and network
alter table public.ecosystem_snapshots
  add constraint ecosystem_snapshots_period_network_unique unique (period, network);

-- Index for speedy period filtering
create index if not exists ecosystem_snapshots_period_idx
  on public.ecosystem_snapshots (period, network);

-- Enable Row Level Security
alter table public.ecosystem_snapshots enable row level security;

-- Public read access policy
create policy "ecosystem_snapshots are readable by everyone"
  on public.ecosystem_snapshots
  for select
  using (true);

-- Note: We do not add write policies for authenticated/anon roles.
-- The service_role bypasses RLS automatically, allowing the Edge Function
-- to read and write. This strictly complies with service-role-only writes.
