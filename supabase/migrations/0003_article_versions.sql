-- =============================================================================
-- ACTA News: article version history with on-chain audit trail
--
-- Tables:  article_versions
-- Trigger: snapshot_article_version  (BEFORE UPDATE on news_articles)
-- RLS:     published article versions → public read
--          draft article versions    → admin only
-- =============================================================================

-- ---------------------------------------------------------------------------
-- article_versions
-- ---------------------------------------------------------------------------
create table if not exists public.article_versions (
  id               uuid        primary key default gen_random_uuid(),
  article_id       uuid        not null references public.news_articles(id) on delete cascade,
  version_number   integer     not null,
  title            text        not null,
  summary          text        not null,
  content          text        not null,
  category         news_category not null,
  diff_summary     jsonb,
  edited_by        text,
  content_hash     text        not null,
  previous_hash    text,
  stellar_tx_hash  text,
  created_at       timestamptz not null default now(),

  constraint article_versions_unique_number unique (article_id, version_number)
);

create index if not exists article_versions_article_id_idx
  on public.article_versions (article_id);

create index if not exists article_versions_article_id_number_idx
  on public.article_versions (article_id, version_number desc);

-- ---------------------------------------------------------------------------
-- Helper: next version number for an article
-- ---------------------------------------------------------------------------
create or replace function public.next_article_version_number(p_article_id uuid)
returns integer
language sql
stable
as $$
  select coalesce(max(version_number), 0) + 1
  from public.article_versions
  where article_id = p_article_id;
$$;

-- ---------------------------------------------------------------------------
-- Helper: latest content_hash for an article (for chaining)
-- ---------------------------------------------------------------------------
create or replace function public.latest_article_content_hash(p_article_id uuid)
returns text
language sql
stable
as $$
  select content_hash
  from public.article_versions
  where article_id = p_article_id
  order by version_number desc
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Trigger: snapshot the OLD row into article_versions before every update
-- that touches at least one of the versioned fields.
--
-- Notes:
--   • We snapshot OLD (pre-update state) so readers can reconstruct any
--     historical snapshot.
--   • content_hash is SHA-256 of OLD.content (what was live before this edit).
--   • diff_summary is intentionally left NULL here; the application layer
--     patches it after the update because the app can compare old→new with
--     richer logic.
--   • edited_by is extracted from the Supabase JWT claim that is set for
--     every authenticated request.
-- ---------------------------------------------------------------------------
create or replace function public.snapshot_article_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_version_number integer;
  v_content_hash   text;
  v_previous_hash  text;
  v_editor         text;
begin
  -- Only snapshot when a versioned field actually changed
  if (
    old.title    = new.title    and
    old.summary  = new.summary  and
    old.content  = new.content  and
    old.category = new.category
  ) then
    return new;
  end if;

  -- Compute hash of the OLD content (what was live)
  v_content_hash := encode(digest(old.content, 'sha256'), 'hex');

  -- Chain: previous version's hash
  v_previous_hash := public.latest_article_content_hash(old.id);

  -- Auto-increment version number
  v_version_number := public.next_article_version_number(old.id);

  -- Try to extract the caller email from the JWT
  begin
    v_editor := nullif(
      current_setting('request.jwt.claims', true)::json->>'email',
      ''
    );
  exception when others then
    v_editor := null;
  end;

  insert into public.article_versions (
    article_id,
    version_number,
    title,
    summary,
    content,
    category,
    diff_summary,
    edited_by,
    content_hash,
    previous_hash
  ) values (
    old.id,
    v_version_number,
    old.title,
    old.summary,
    old.content,
    old.category,
    null,      -- patched by app after the update
    v_editor,
    v_content_hash,
    v_previous_hash
  );

  return new;
end;
$$;

drop trigger if exists snapshot_article_version_trigger on public.news_articles;

create trigger snapshot_article_version_trigger
before update on public.news_articles
for each row execute function public.snapshot_article_version();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.article_versions enable row level security;

-- Public can read versions of published articles
create policy "published article versions are readable by everyone"
  on public.article_versions
  for select
  using (
    exists (
      select 1
      from public.news_articles a
      where a.id = article_versions.article_id
        and a.status = 'published'
    )
  );

-- Admins can read all versions (including drafts)
create policy "admins can read all article versions"
  on public.article_versions
  for select
  to authenticated
  using (public.is_admin());

-- Admins can insert / update versions (for diff_summary and stellar_tx_hash patches)
create policy "admins can write article versions"
  on public.article_versions
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Service-role can always write (needed for trigger + edge functions)
-- (service role bypasses RLS by default: no explicit policy needed)
