-- =============================================================================
-- Add monitored_accounts table for automated activity monitoring
-- =============================================================================

create table if not exists public.monitored_accounts (
  id uuid primary key default gen_random_uuid(),
  stellar_address text unique not null,
  label text not null,
  account_type text not null,
  monitor_events text[] not null default '{}',
  active boolean not null default true,
  last_cursor text,
  created_at timestamptz not null default now()
);

create index if not exists monitored_accounts_stellar_address_idx
  on public.monitored_accounts (stellar_address);

alter table public.monitored_accounts enable row level security;

create policy "admins can manage monitored accounts"
  on public.monitored_accounts
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
