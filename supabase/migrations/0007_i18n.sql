-- =============================================================================
-- ACTA News: bilingual content (English / Spanish)
--
-- What this migration adds:
--   * a `content_locale` enum and `news_articles.source_locale`
--   * `article_translations`, `monthly_review_translations`, `tag_translations`
--     and `author_translations`
--   * language-aware full text search (the base `search_tsv` was built with the
--     'simple' configuration, which does no stemming in any language)
--   * `translation_source_hash` generated columns, which is what makes a
--     translation detectably stale the moment its source is edited
--   * `public.search_articles(query, locale)`, so ranking lives in one place
--
-- Two implementation notes worth keeping in mind when editing this file:
--
--   1. Text search configurations are written as literals inside a `case` over
--      the locale column, never as `locale::regconfig`. The cast is STABLE, not
--      IMMUTABLE, so a generated column using it is rejected outright; passing
--      'spanish' / 'english' as constants keeps the whole expression immutable.
--
--   2. Hashes use the built-in `sha256(bytea)` rather than pgcrypto's `digest`.
--      Both produce the same digest, but the built-in lives in `pg_catalog` and
--      is IMMUTABLE, so it can be used in a generated column without depending
--      on where the pgcrypto extension happens to be installed.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Locale enum
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.content_locale as enum ('en', 'es');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. news_articles: source locale, source hash, language-aware search vector
-- ---------------------------------------------------------------------------
alter table public.news_articles
  add column if not exists source_locale public.content_locale not null default 'en';

comment on column public.news_articles.source_locale is
  'Language the article was originally written in. Rows in article_translations '
  'hold every other language.';

create index if not exists news_articles_source_locale_idx
  on public.news_articles (source_locale);

-- The canonical hash of the translatable fields. A translation stores the value
-- this column had when it was written; when they differ, the translation is
-- stale. Deliberately excludes published_at and every non-translatable column,
-- so rescheduling a post does not invalidate its translations.
alter table public.news_articles
  drop column if exists translation_source_hash;

alter table public.news_articles
  add column translation_source_hash text
    generated always as (
      encode(
        sha256(
          convert_to(
            coalesce(title, '') || E'\n' || coalesce(summary, '') || E'\n' || coalesce(content, ''),
            'UTF8'
          )
        ),
        'hex'
      )
    ) stored;

comment on column public.news_articles.translation_source_hash is
  'sha256 of title\nsummary\ncontent. Mirrored in TypeScript by '
  'computeTranslationSourceHash() in src/lib/stellar/hash.ts.';

-- Rebuild the search vector with a real language configuration. Dropping the
-- generated column takes news_articles_search_idx with it, so it is recreated
-- below.
alter table public.news_articles
  drop column if exists search_tsv;

alter table public.news_articles
  add column search_tsv tsvector
    generated always as (
      case source_locale
        when 'es' then
          setweight(to_tsvector('spanish', coalesce(title, '')),   'A') ||
          setweight(to_tsvector('spanish', coalesce(summary, '')), 'B') ||
          setweight(to_tsvector('spanish', coalesce(content, '')), 'C')
        else
          setweight(to_tsvector('english', coalesce(title, '')),   'A') ||
          setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(content, '')), 'C')
      end
    ) stored;

create index if not exists news_articles_search_idx
  on public.news_articles using gin (search_tsv);

-- ---------------------------------------------------------------------------
-- 3. article_translations
-- ---------------------------------------------------------------------------
create table if not exists public.article_translations (
  id                  uuid primary key default gen_random_uuid(),
  article_id          uuid not null references public.news_articles(id) on delete cascade,
  locale              public.content_locale not null,
  slug                text not null,
  title               text not null,
  summary             text not null,
  content             text not null,
  -- The value of news_articles.translation_source_hash at the moment this
  -- translation was written or last confirmed as current.
  source_content_hash text not null,
  -- Per-field sha256 of the source, as { "title": ..., "summary": ..., "content": ... }.
  -- The aggregate hash above answers "is this translation stale?"; this answers
  -- "which fields do I need to look at?", which is what the editor marks up.
  source_field_hashes jsonb not null default '{}'::jsonb,
  translated_by       text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  search_tsv tsvector
    generated always as (
      case locale
        when 'es' then
          setweight(to_tsvector('spanish', coalesce(title, '')),   'A') ||
          setweight(to_tsvector('spanish', coalesce(summary, '')), 'B') ||
          setweight(to_tsvector('spanish', coalesce(content, '')), 'C')
        else
          setweight(to_tsvector('english', coalesce(title, '')),   'A') ||
          setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(content, '')), 'C')
      end
    ) stored,
  constraint article_translations_article_locale_key unique (article_id, locale),
  constraint article_translations_locale_slug_key unique (locale, slug),
  constraint article_translations_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create index if not exists article_translations_article_id_idx
  on public.article_translations (article_id);

create index if not exists article_translations_search_idx
  on public.article_translations using gin (search_tsv);

drop trigger if exists article_translations_set_updated_at on public.article_translations;
create trigger article_translations_set_updated_at
before update on public.article_translations
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Per-locale slug uniqueness across both tables
--
-- `unique (locale, slug)` stops two translations from sharing a slug, but a
-- Spanish translation could still collide with an article whose source_locale is
-- already 'es'. Both tables resolve URLs for the same namespace, so the check
-- has to span them.
-- ---------------------------------------------------------------------------
create or replace function public.assert_translation_slug_available()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1
    from public.news_articles a
    where a.slug = new.slug
      and a.source_locale = new.locale
      and a.id <> new.article_id
  ) then
    raise exception
      'slug "%" is already used by another article in locale %', new.slug, new.locale
      using errcode = 'unique_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists article_translations_slug_guard on public.article_translations;
create trigger article_translations_slug_guard
before insert or update of slug, locale on public.article_translations
for each row execute function public.assert_translation_slug_available();

create or replace function public.assert_article_slug_available()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1
    from public.article_translations t
    where t.slug = new.slug
      and t.locale = new.source_locale
      and t.article_id <> new.id
  ) then
    raise exception
      'slug "%" is already used by a translation in locale %', new.slug, new.source_locale
      using errcode = 'unique_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists news_articles_slug_guard on public.news_articles;
create trigger news_articles_slug_guard
before insert or update of slug, source_locale on public.news_articles
for each row execute function public.assert_article_slug_available();

-- ---------------------------------------------------------------------------
-- 5. monthly_review_translations
--
-- Keyed by review, not period: the period is the canonical route segment in
-- every language, so only the prose is translated.
-- ---------------------------------------------------------------------------
alter table public.monthly_reviews
  add column if not exists source_locale public.content_locale not null default 'en';

alter table public.monthly_reviews
  drop column if exists translation_source_hash;

alter table public.monthly_reviews
  add column translation_source_hash text
    generated always as (
      encode(
        sha256(
          convert_to(coalesce(title, '') || E'\n' || coalesce(summary, ''), 'UTF8')
        ),
        'hex'
      )
    ) stored;

create table if not exists public.monthly_review_translations (
  id                  uuid primary key default gen_random_uuid(),
  review_id           uuid not null references public.monthly_reviews(id) on delete cascade,
  locale              public.content_locale not null,
  title               text not null,
  summary             text not null,
  -- Same shape as monthly_reviews.highlights: [{ title, description, href }].
  highlights          jsonb not null default '[]'::jsonb,
  source_content_hash text not null,
  translated_by       text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint monthly_review_translations_review_locale_key unique (review_id, locale)
);

create index if not exists monthly_review_translations_review_id_idx
  on public.monthly_review_translations (review_id);

drop trigger if exists monthly_review_translations_set_updated_at
  on public.monthly_review_translations;
create trigger monthly_review_translations_set_updated_at
before update on public.monthly_review_translations
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. tag_translations
-- ---------------------------------------------------------------------------
create table if not exists public.tag_translations (
  tag_slug    text not null references public.tags(slug) on delete cascade,
  locale      public.content_locale not null,
  label       text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (tag_slug, locale)
);

drop trigger if exists tag_translations_set_updated_at on public.tag_translations;
create trigger tag_translations_set_updated_at
before update on public.tag_translations
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. author_translations
--
-- A separate table rather than widening `authors`: only `role` and `bio` are
-- prose, and the name is the same in every language.
-- ---------------------------------------------------------------------------
create table if not exists public.author_translations (
  author_id  uuid not null references public.authors(id) on delete cascade,
  locale     public.content_locale not null,
  role       text,
  bio        text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (author_id, locale)
);

drop trigger if exists author_translations_set_updated_at on public.author_translations;
create trigger author_translations_set_updated_at
before update on public.author_translations
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 8. Ranked, language-aware article search
-- ---------------------------------------------------------------------------
drop function if exists public.search_articles(text, public.content_locale);

create function public.search_articles(
  p_query  text,
  p_locale public.content_locale default 'en'
)
returns table (
  article_id     uuid,
  rank           real,
  matched_locale public.content_locale
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with query as (
    select case p_locale
             when 'es' then websearch_to_tsquery('spanish', p_query)
             else websearch_to_tsquery('english', p_query)
           end as tsq
  )
  -- Translations written in the requested locale, stemmed with that locale's
  -- configuration: "credenciales" matches an article about a "credencial".
  select t.article_id,
         ts_rank(t.search_tsv, q.tsq)::real,
         t.locale
  from public.article_translations t
  join public.news_articles a on a.id = t.article_id
  cross join query q
  where t.locale = p_locale
    and a.status = 'published'
    and t.search_tsv @@ q.tsq

  union all

  -- Articles with no translation for the requested locale still appear, matched
  -- against their own language's vector. Slightly less precise across languages,
  -- and much better than hiding the untranslated archive from Spanish readers.
  select a.id,
         ts_rank(a.search_tsv, q.tsq)::real,
         a.source_locale
  from public.news_articles a
  cross join query q
  where a.status = 'published'
    and a.search_tsv @@ q.tsq
    and not exists (
      select 1
      from public.article_translations t
      where t.article_id = a.id
        and t.locale = p_locale
    )

  order by 2 desc, 1;
$$;

comment on function public.search_articles(text, public.content_locale) is
  'Ranked article ids for a websearch-style query in the given locale. Ranking '
  'lives here so the browser and server clients cannot drift apart.';

grant execute on function public.search_articles(text, public.content_locale)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 9. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.article_translations        enable row level security;
alter table public.monthly_review_translations enable row level security;
alter table public.tag_translations            enable row level security;
alter table public.author_translations         enable row level security;

drop policy if exists "published article translations are readable by everyone"
  on public.article_translations;
create policy "published article translations are readable by everyone"
  on public.article_translations
  for select
  using (
    exists (
      select 1
      from public.news_articles a
      where a.id = article_translations.article_id
        and a.status = 'published'
    )
  );

drop policy if exists "admins can read every article translation"
  on public.article_translations;
create policy "admins can read every article translation"
  on public.article_translations
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins can write article translations" on public.article_translations;
create policy "admins can write article translations"
  on public.article_translations
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "monthly review translations are readable by everyone"
  on public.monthly_review_translations;
create policy "monthly review translations are readable by everyone"
  on public.monthly_review_translations
  for select
  using (true);

drop policy if exists "admins can write monthly review translations"
  on public.monthly_review_translations;
create policy "admins can write monthly review translations"
  on public.monthly_review_translations
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "tag translations are readable by everyone" on public.tag_translations;
create policy "tag translations are readable by everyone"
  on public.tag_translations
  for select
  using (true);

drop policy if exists "admins can write tag translations" on public.tag_translations;
create policy "admins can write tag translations"
  on public.tag_translations
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "author translations are readable by everyone" on public.author_translations;
create policy "author translations are readable by everyone"
  on public.author_translations
  for select
  using (true);

drop policy if exists "admins can write author translations" on public.author_translations;
create policy "admins can write author translations"
  on public.author_translations
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
