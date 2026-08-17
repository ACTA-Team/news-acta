-- =============================================================================
-- ACTA News — editorial workflow
--
-- Turns the single email allowlist into a real editorial tool:
--   • four roles (owner / editor / author / contributor) enforced by RLS
--   • two new statuses (in_review, scheduled) + a transition guard
--   • an append-only review queue tied to article_versions
--   • an append-only audit log written by triggers
--   • scheduled_at + partial index driving the publishing cron
--
-- Scheduling note (mirrors supabase/config.toml for collect-ecosystem-metrics):
--   Scheduled publishing is driven by a Vercel Cron hitting
--   /api/cron/publish-scheduled every 10 minutes, so the job can reuse the
--   existing TypeScript services (attestation, versioning, revalidation).
--   The pg_cron alternative, if you ever want the database to own it:
--
--     select cron.schedule(
--       'publish-scheduled-articles',
--       '*/10 * * * *',
--       $$ update public.news_articles
--            set status = 'published'
--          where status = 'scheduled'
--            and scheduled_at <= now() $$
--     );
--
--   That variant publishes correctly (the trigger below still stamps
--   published_at and writes the audit row) but skips attestation and Next.js
--   cache revalidation, so the route handler stays the default.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Roles
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.editorial_role as enum ('owner', 'editor', 'author', 'contributor');
exception when duplicate_object then null; end $$;

alter table public.admin_users
  add column if not exists role public.editorial_role not null default 'editor',
  add column if not exists author_id uuid references public.authors(id) on delete set null,
  add column if not exists display_name text;

create index if not exists admin_users_author_id_idx
  on public.admin_users (author_id);

-- Bootstrap: every existing admin becomes an 'editor' by default, which would
-- leave nobody able to manage the team. Promote the oldest admin row to owner
-- when no owner exists yet.
update public.admin_users
set role = 'owner'
where email = (
  select email from public.admin_users order by created_at asc, email asc limit 1
)
and not exists (select 1 from public.admin_users where role = 'owner');

-- ---------------------------------------------------------------------------
-- 2. Helper functions (same pattern as public.is_admin())
-- ---------------------------------------------------------------------------
create or replace function public.current_editorial_role()
returns public.editorial_role
language sql
stable
security definer
set search_path = public
as $$
  select au.role
  from public.admin_users au
  where lower(au.email) = lower(auth.email());
$$;

create or replace function public.can_publish()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_editorial_role() in ('owner', 'editor');
$$;

create or replace function public.owns_article(target_article uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.news_articles a
    join public.admin_users au on au.author_id = a.author_id
    where a.id = target_article
      and lower(au.email) = lower(auth.email())
  );
$$;

-- The JWT `role` claim, or null when the statement runs without a JWT
-- (migrations, seeds, psql). Wrapped in plpgsql so a malformed claims blob
-- degrades to null instead of aborting the statement.
create or replace function public.current_jwt_role()
returns text
language plpgsql
stable
as $$
declare
  v_role text;
begin
  begin
    v_role := nullif(current_setting('request.jwt.claims', true), '')::json->>'role';
  exception when others then
    v_role := null;
  end;
  return v_role;
end;
$$;

-- True for trusted server-side callers: the service-role client used by the
-- publishing cron, and direct SQL with no JWT at all. Used only to exempt those
-- callers from the *role* check in the transition guard — the transition matrix
-- itself still applies to them.
create or replace function public.is_backend_context()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_jwt_role(), 'service_role') = 'service_role';
$$;

grant execute on function public.current_editorial_role() to authenticated;
grant execute on function public.can_publish() to authenticated;
grant execute on function public.owns_article(uuid) to authenticated;
grant execute on function public.current_jwt_role() to authenticated;
grant execute on function public.is_backend_context() to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Status enum: draft | in_review | scheduled | published | archived
--
-- `alter type ... add value` cannot be followed by a use of the new value in
-- the same transaction (and Supabase migrations run in one), so the type is
-- swapped wholesale instead.
--
-- Postgres refuses to retype a column that a policy depends on
-- ("cannot alter type of a column used in a policy definition"), so the three
-- policies that reference news_articles.status are dropped first and recreated
-- verbatim below. They are found with:
--   select p.polname from pg_depend d
--     join pg_policy p on p.oid = d.objid and d.classid = 'pg_policy'::regclass
--    where d.refobjid = 'public.news_articles'::regclass
--      and d.refobjsubid = (select attnum from pg_attribute
--                            where attrelid = 'public.news_articles'::regclass
--                              and attname = 'status');
-- ---------------------------------------------------------------------------
drop policy if exists "published articles are readable by everyone" on public.news_articles;
drop policy if exists "article tags are readable by everyone" on public.news_article_tags;
drop policy if exists "published article versions are readable by everyone" on public.article_versions;

alter table public.news_articles alter column status drop default;

create type public.news_status_new as enum
  ('draft', 'in_review', 'scheduled', 'published', 'archived');

alter table public.news_articles
  alter column status type public.news_status_new
  using status::text::public.news_status_new;

drop type public.news_status;
alter type public.news_status_new rename to news_status;

alter table public.news_articles alter column status set default 'draft';

-- Recreated verbatim: anonymous readers still only ever see 'published', so
-- in_review and scheduled articles stay invisible to the public site.
create policy "published articles are readable by everyone"
  on public.news_articles
  for select
  using (status = 'published');

create policy "article tags are readable by everyone"
  on public.news_article_tags
  for select
  using (
    exists (
      select 1
      from public.news_articles a
      where a.id = news_article_tags.article_id
        and a.status = 'published'
    )
  );

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

-- ---------------------------------------------------------------------------
-- 4. Scheduling column
-- ---------------------------------------------------------------------------
alter table public.news_articles
  add column if not exists scheduled_at timestamptz;

create index if not exists news_articles_scheduled_at_idx
  on public.news_articles (scheduled_at)
  where status = 'scheduled';

-- ---------------------------------------------------------------------------
-- 5. Audit log (append only)
-- ---------------------------------------------------------------------------
create table if not exists public.editorial_audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_email text not null,
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  from_status text,
  to_status   text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists editorial_audit_log_created_at_idx
  on public.editorial_audit_log (created_at desc);

create index if not exists editorial_audit_log_entity_idx
  on public.editorial_audit_log (entity, entity_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 6. Review queue (append only)
--
-- Rows are events, not mutable records: requesting a review appends a
-- 'requested' row, approving appends an 'approved' row, asking for changes
-- appends a 'changes_requested' row (each carrying its own comment and
-- resolved_at). A review is *open* when the newest row for an article is
-- 'requested'. That keeps the whole thread readable and lets the table stay
-- insert-only for every role, matching editorial_audit_log.
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.review_state as enum ('requested', 'approved', 'changes_requested');
exception when duplicate_object then null; end $$;

create table if not exists public.article_reviews (
  id             uuid primary key default gen_random_uuid(),
  article_id     uuid not null references public.news_articles(id) on delete cascade,
  version_number integer,
  state          public.review_state not null default 'requested',
  requested_by   text not null,
  reviewer_email text,
  comment        text,
  created_at     timestamptz not null default now(),
  resolved_at    timestamptz
);

create index if not exists article_reviews_article_id_idx
  on public.article_reviews (article_id, created_at desc);

create index if not exists article_reviews_open_idx
  on public.article_reviews (state) where state = 'requested';

-- ---------------------------------------------------------------------------
-- 7. Status transition guard
--
-- Enforced in the database so an invalid change fails even when the REST API
-- is called directly, bypassing the admin UI and the server actions.
--
-- Trigger firing order matters: BEFORE UPDATE triggers run in alphabetical
-- order, so news_articles_enforce_status runs before
-- snapshot_article_version_trigger and a rejected transition never leaves a
-- version snapshot behind.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed text[];
  v_actor text;
begin
  if old.status = new.status then
    return new;
  end if;

  allowed := case old.status::text
    when 'draft'     then array['in_review', 'scheduled', 'published', 'archived']
    when 'in_review' then array['draft', 'scheduled', 'published']
    when 'scheduled' then array['draft', 'published', 'archived']
    when 'published' then array['archived', 'draft']
    when 'archived'  then array['draft']
    else array[]::text[]
  end;

  if not (new.status::text = any(allowed)) then
    raise exception 'invalid status transition: % -> %', old.status, new.status
      using errcode = 'check_violation';
  end if;

  -- Only owners and editors may publish or schedule. The service-role client
  -- (publishing cron) and direct SQL are exempt from the role check only.
  if new.status in ('published', 'scheduled')
     and not public.is_backend_context()
     and not coalesce(public.can_publish(), false) then
    raise exception 'insufficient role for status %', new.status
      using errcode = 'insufficient_privilege';
  end if;

  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  -- Leaving the schedule without publishing clears the pending date so the
  -- editorial calendar never shows a stale slot.
  if old.status = 'scheduled' and new.status <> 'published' then
    new.scheduled_at := null;
  end if;

  v_actor := coalesce(auth.email(), public.current_jwt_role(), 'system');

  insert into public.editorial_audit_log (
    actor_email, action, entity, entity_id, from_status, to_status, metadata
  ) values (
    v_actor,
    'status_change',
    'news_article',
    new.id,
    old.status::text,
    new.status::text,
    jsonb_build_object('slug', new.slug, 'scheduled_at', new.scheduled_at)
  );

  return new;
end;
$$;

drop trigger if exists news_articles_enforce_status on public.news_articles;

create trigger news_articles_enforce_status
before update of status on public.news_articles
for each row execute function public.enforce_status_transition();

-- Role changes are audited by the database too, so the log is complete
-- regardless of which client performed the update.
create or replace function public.audit_admin_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role then
    insert into public.editorial_audit_log (
      actor_email, action, entity, entity_id, from_status, to_status, metadata
    ) values (
      coalesce(auth.email(), public.current_jwt_role(), 'system'),
      'role_change',
      'admin_user',
      null,
      old.role::text,
      new.role::text,
      jsonb_build_object('target_email', new.email)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists admin_users_audit_role_change on public.admin_users;

create trigger admin_users_audit_role_change
after update of role on public.admin_users
for each row execute function public.audit_admin_role_change();

-- =============================================================================
-- 8. Row Level Security
-- =============================================================================

-- ---- news_articles: replace the blanket admin policy from 0002 ----
drop policy if exists "admins can write articles" on public.news_articles;

-- Contributors only ever see their own articles; everyone else sees the whole
-- desk. (Published articles remain readable through the public policy above.)
create policy "editorial read articles"
  on public.news_articles
  for select
  to authenticated
  using (
    public.is_admin()
    and (
      public.current_editorial_role() <> 'contributor'
      or public.owns_article(id)
    )
  );

-- The one rule for non-publishers: they may never put an article into a *live*
-- status. Everything else about who may touch which row is decided by the
-- USING clauses below.
--
-- Any admin may create, but only owners and editors may create something that
-- is already published or scheduled — the transition trigger fires on UPDATE
-- only, so this check is what closes the insert path.
create policy "editorial insert articles"
  on public.news_articles
  for insert
  to authenticated
  with check (
    public.is_admin()
    and (
      coalesce(public.can_publish(), false)
      or status not in ('published', 'scheduled')
    )
  );

-- Owners and editors edit anything. Authors edit their own articles. A
-- contributor edits their own only while it is still a draft or in review.
--
-- The WITH CHECK deliberately allows 'archived' and 'draft' for non-publishers
-- so it agrees exactly with `allowedTransitionsForRole` in
-- `src/lib/editorial/transitions.ts` — an author archiving their own piece must
-- not hit an RLS error for a button the UI offered them.
create policy "editorial update articles"
  on public.news_articles
  for update
  to authenticated
  using (
    public.is_admin()
    and (
      coalesce(public.can_publish(), false)
      or (public.current_editorial_role() = 'author' and public.owns_article(id))
      or (
        public.current_editorial_role() = 'contributor'
        and public.owns_article(id)
        and status in ('draft', 'in_review')
      )
    )
  )
  with check (
    public.is_admin()
    and (
      coalesce(public.can_publish(), false)
      or status not in ('published', 'scheduled')
    )
  );

create policy "editorial delete articles"
  on public.news_articles
  for delete
  to authenticated
  using (public.current_editorial_role() = 'owner');

-- ---- admin_users: only owners manage the team ----
drop policy if exists "owners manage admin users" on public.admin_users;

create policy "owners manage admin users"
  on public.admin_users
  for all
  to authenticated
  using (public.current_editorial_role() = 'owner')
  with check (public.current_editorial_role() = 'owner');

-- ---- article_reviews: admin read, append only, no updates or deletes ----
alter table public.article_reviews enable row level security;

create policy "admins read article reviews"
  on public.article_reviews
  for select
  to authenticated
  using (
    public.is_admin()
    and (
      public.current_editorial_role() <> 'contributor'
      or public.owns_article(article_id)
    )
  );

create policy "admins append article reviews"
  on public.article_reviews
  for insert
  to authenticated
  with check (
    public.is_admin()
    and lower(requested_by) = lower(auth.email())
    and (state = 'requested' or coalesce(public.can_publish(), false))
  );

-- ---- editorial_audit_log: admin read, append only ----
alter table public.editorial_audit_log enable row level security;

create policy "admins read editorial audit log"
  on public.editorial_audit_log
  for select
  to authenticated
  using (public.is_admin());

create policy "admins append editorial audit log"
  on public.editorial_audit_log
  for insert
  to authenticated
  with check (
    public.is_admin()
    and lower(actor_email) = lower(auth.email())
  );
