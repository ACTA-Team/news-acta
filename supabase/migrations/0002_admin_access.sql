-- =============================================================================
-- ACTA News — admin access model
-- =============================================================================

create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where lower(au.email) = lower(auth.email())
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "authenticated can write authors" on public.authors;
drop policy if exists "authenticated can write tags" on public.tags;
drop policy if exists "authenticated can write articles" on public.news_articles;
drop policy if exists "authenticated can write article tags" on public.news_article_tags;
drop policy if exists "authenticated can write monthly reviews" on public.monthly_reviews;
drop policy if exists "authenticated can write monthly review articles" on public.monthly_review_articles;

create policy "admins can write authors"
  on public.authors
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins can write tags"
  on public.tags
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins can write articles"
  on public.news_articles
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins can write article tags"
  on public.news_article_tags
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins can write monthly reviews"
  on public.monthly_reviews
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins can write monthly review articles"
  on public.monthly_review_articles
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins can read admin_users" on public.admin_users;
drop policy if exists "service role full admin_users" on public.admin_users;
drop policy if exists "authenticated read own admin row" on public.admin_users;

create policy "authenticated read own admin row"
  on public.admin_users
  for select
  to authenticated
  using (lower(email) = lower(auth.email()));
