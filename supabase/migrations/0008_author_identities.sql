-- =============================================================================
-- ACTA News: verifiable author identity (did:stellar + ACTA credentials)
--
-- What this migration adds:
--   * `acta_issuer_identity` — the blog's own issuer DID, persisted so the
--     `@acta-team/credentials` SDK never mints a new one on server restart.
--     Service-role only: no RLS policy grants any access to it at all.
--   * `author_identities` — one `did:stellar` per author.
--   * `author_credentials` — the "ACTA Author" verifiable credentials issued
--     into an author's vault, one active credential per author (see the
--     cost-model note in issue #42: a credential per article is out of scope).
--   * `article_attestations.author_credential_id`, linking each free
--     `manageData` article attestation to the author credential that was
--     active when the article was attested.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Credential status enum
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.author_credential_status as enum ('pending', 'active', 'revoked', 'failed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. acta_issuer_identity (service role only)
-- ---------------------------------------------------------------------------
create table if not exists public.acta_issuer_identity (
  id text primary key default 'default',
  controller text not null,
  did text not null,
  payload jsonb not null,
  network text not null check (network in ('testnet', 'mainnet')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.acta_issuer_identity enable row level security;

-- No policies at all: only the service role (which bypasses RLS) may touch
-- this table. Anonymous and authenticated roles get nothing, on purpose.

-- ---------------------------------------------------------------------------
-- 3. author_identities
-- ---------------------------------------------------------------------------
create table if not exists public.author_identities (
  author_id uuid primary key references public.authors (id) on delete cascade,
  did text not null unique,
  stellar_address text not null,
  vault_contract_id text,
  network text not null check (network in ('testnet', 'mainnet')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.author_identities enable row level security;

drop policy if exists "author identities are readable by everyone" on public.author_identities;
drop policy if exists "admins can write author identities" on public.author_identities;

create policy "author identities are readable by everyone"
  on public.author_identities
  for select
  using (true);

create policy "admins can write author identities"
  on public.author_identities
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. author_credentials
-- ---------------------------------------------------------------------------
create table if not exists public.author_credentials (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.authors (id) on delete cascade,
  vc_id text not null unique check (char_length(vc_id) <= 64),
  role text not null,
  status public.author_credential_status not null default 'pending',
  issuer_did text not null,
  subject_did text not null,
  network text not null check (network in ('testnet', 'mainnet')),
  issue_tx_id text,
  revoke_tx_id text,
  issued_at timestamptz,
  revoked_at timestamptz,
  revocation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists author_credentials_author_id_idx
  on public.author_credentials (author_id);

alter table public.author_credentials enable row level security;

drop policy if exists "author credentials are readable by everyone" on public.author_credentials;
drop policy if exists "admins can write author credentials" on public.author_credentials;

create policy "author credentials are readable by everyone"
  on public.author_credentials
  for select
  using (true);

create policy "admins can write author credentials"
  on public.author_credentials
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. article_attestations: link to the author credential active at publish time
-- ---------------------------------------------------------------------------
alter table public.article_attestations
  add column if not exists author_credential_id uuid references public.author_credentials (id);
