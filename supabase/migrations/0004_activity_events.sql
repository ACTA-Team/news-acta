-- =============================================================================
-- Add activity_events table to store detected Stellar activity
-- =============================================================================

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.monitored_accounts(id) on delete cascade,
  source_account text not null,
  event_type text not null,
  significance text not null,
  raw_data jsonb not null default '{}'::jsonb,
  summary text,
  processed boolean not null default false,
  draft_article_id uuid,
  detected_at timestamptz not null default now(),
  tx_hash text
);

create index if not exists activity_events_account_id_detected_at_idx
  on public.activity_events (account_id, detected_at desc);

create index if not exists activity_events_processed_idx
  on public.activity_events (processed);

alter table public.activity_events enable row level security;

create policy "admins can manage activity events"
  on public.activity_events
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
