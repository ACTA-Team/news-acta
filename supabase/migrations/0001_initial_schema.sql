-- =============================================================================
-- ACTA News — initial schema
--
-- Tables: authors, tags, news_articles, news_article_tags,
--         monthly_reviews, monthly_review_articles
--
-- Conventions:
--   - Primary keys are uuid (gen_random_uuid) except for `tags.slug`.
--   - timestamps are timestamptz, default now().
--   - `updated_at` is maintained by a shared trigger.
--   - Row Level Security is enabled on every table.
--   - Public (anon) can read published content; only authenticated users
--     can write. Tighten write policies once an admin claim exists.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type news_category as enum (
    'announcement',
    'product',
    'ecosystem',
    'engineering',
    'community'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type news_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Shared trigger: set updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- authors
-- ---------------------------------------------------------------------------
create table if not exists public.authors (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  role        text,
  bio         text,
  avatar_url  text,
  social      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger authors_set_updated_at
before update on public.authors
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- tags
-- ---------------------------------------------------------------------------
create table if not exists public.tags (
  slug        text primary key,
  label       text not null,
  description text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- news_articles
-- ---------------------------------------------------------------------------
create table if not exists public.news_articles (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text unique not null,
  title                text not null,
  summary              text not null,
  content              text not null,
  cover_image_url      text,
  category             news_category not null,
  status               news_status not null default 'draft',
  author_id            uuid not null references public.authors(id) on delete restrict,
  reading_time_minutes int  not null default 1 check (reading_time_minutes > 0),
  published_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  -- Full-text search vector (weighted: title > summary > content)
  search_tsv tsvector
    generated always as (
      setweight(to_tsvector('simple', coalesce(title, '')),   'A') ||
      setweight(to_tsvector('simple', coalesce(summary, '')), 'B') ||
      setweight(to_tsvector('simple', coalesce(content, '')), 'C')
    ) stored
);

create index if not exists news_articles_status_idx
  on public.news_articles (status);
create index if not exists news_articles_category_idx
  on public.news_articles (category);
create index if not exists news_articles_published_at_idx
  on public.news_articles (published_at desc);
create index if not exists news_articles_author_id_idx
  on public.news_articles (author_id);
create index if not exists news_articles_search_idx
  on public.news_articles using gin (search_tsv);

create trigger news_articles_set_updated_at
before update on public.news_articles
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- news_article_tags (many-to-many)
-- ---------------------------------------------------------------------------
create table if not exists public.news_article_tags (
  article_id uuid not null references public.news_articles(id) on delete cascade,
  tag_slug   text not null references public.tags(slug) on delete cascade,
  primary key (article_id, tag_slug)
);

create index if not exists news_article_tags_tag_slug_idx
  on public.news_article_tags (tag_slug);

-- ---------------------------------------------------------------------------
-- monthly_reviews
-- ---------------------------------------------------------------------------
create table if not exists public.monthly_reviews (
  id              uuid primary key default gen_random_uuid(),
  period          text unique not null check (period ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  title           text not null,
  summary         text not null,
  cover_image_url text,
  highlights      jsonb not null default '[]'::jsonb,
  metrics         jsonb not null default '[]'::jsonb,
  published_at    timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists monthly_reviews_published_at_idx
  on public.monthly_reviews (published_at desc);

create trigger monthly_reviews_set_updated_at
before update on public.monthly_reviews
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- monthly_review_articles (featured articles in a review)
-- ---------------------------------------------------------------------------
create table if not exists public.monthly_review_articles (
  review_id  uuid not null references public.monthly_reviews(id) on delete cascade,
  article_id uuid not null references public.news_articles(id) on delete cascade,
  position   int  not null default 0,
  primary key (review_id, article_id)
);

create index if not exists monthly_review_articles_review_id_idx
  on public.monthly_review_articles (review_id, position);

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.authors                 enable row level security;
alter table public.tags                    enable row level security;
alter table public.news_articles           enable row level security;
alter table public.news_article_tags       enable row level security;
alter table public.monthly_reviews         enable row level security;
alter table public.monthly_review_articles enable row level security;

-- ---- Public (anon + authenticated) read policies ----
create policy "authors are readable by everyone"
  on public.authors
  for select
  using (true);

create policy "tags are readable by everyone"
  on public.tags
  for select
  using (true);

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

create policy "monthly reviews are readable by everyone"
  on public.monthly_reviews
  for select
  using (true);

create policy "monthly review articles are readable by everyone"
  on public.monthly_review_articles
  for select
  using (true);

-- ---- Authenticated write policies (tighten with an admin claim later) ----
create policy "authenticated can write authors"
  on public.authors
  for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can write tags"
  on public.tags
  for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can write articles"
  on public.news_articles
  for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can write article tags"
  on public.news_article_tags
  for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can write monthly reviews"
  on public.monthly_reviews
  for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can write monthly review articles"
  on public.monthly_review_articles
  for all
  to authenticated
  using (true)
  with check (true);
