-- =============================================================================
-- ACTA News: media_library table + Storage bucket policies
--
-- Adds:
--   - media_library table with full metadata, variant paths, and Stellar anchoring
--   - Storage bucket creation for article-covers, article-content, author-avatars
--   - RLS policies: public read, authenticated admin write
-- =============================================================================

-- ---------------------------------------------------------------------------
-- media_library
-- ---------------------------------------------------------------------------
create table if not exists public.media_library (
  id              uuid primary key default gen_random_uuid(),
  bucket          text not null,
  path            text not null,
  original_name   text not null,
  mime_type       text not null,
  size_bytes      integer not null check (size_bytes > 0),
  width           integer,
  height          integer,
  alt_text        text,
  variants        jsonb not null default '{}'::jsonb,
  content_hash    text,
  stellar_tx_hash text,
  uploaded_by     text not null,
  usage_count     integer not null default 0 check (usage_count >= 0),
  created_at      timestamptz not null default now(),

  -- Enforce unique path per bucket
  unique (bucket, path)
);

create index if not exists media_library_bucket_idx
  on public.media_library (bucket);

create index if not exists media_library_created_at_idx
  on public.media_library (created_at desc);

create index if not exists media_library_usage_count_idx
  on public.media_library (usage_count);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.media_library enable row level security;

create policy "media is readable by everyone"
  on public.media_library
  for select
  using (true);

create policy "authenticated can write media"
  on public.media_library
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Storage buckets
-- (These are created via the Supabase Storage API / dashboard in production.
--  The INSERT statements below work with the local Supabase CLI emulator.)
-- ---------------------------------------------------------------------------

-- article-covers bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'article-covers',
  'article-covers',
  true,
  10485760,  -- 10 MiB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do nothing;

-- article-content bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'article-content',
  'article-content',
  true,
  10485760,  -- 10 MiB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do nothing;

-- author-avatars bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'author-avatars',
  'author-avatars',
  true,
  5242880,   -- 5 MiB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Storage RLS policies
-- ---------------------------------------------------------------------------

-- Public read for all three buckets
create policy "article-covers public read"
  on storage.objects for select
  using (bucket_id = 'article-covers');

create policy "article-content public read"
  on storage.objects for select
  using (bucket_id = 'article-content');

create policy "author-avatars public read"
  on storage.objects for select
  using (bucket_id = 'author-avatars');

-- article-covers authenticated write
create policy "article-covers authenticated write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'article-covers' and (select public.is_admin()));

create policy "article-covers authenticated update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'article-covers' and (select public.is_admin()));

create policy "article-covers authenticated delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'article-covers' and (select public.is_admin()));

create policy "article-content authenticated write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'article-content' and (select public.is_admin()));

create policy "article-content authenticated update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'article-content' and (select public.is_admin()));

create policy "article-content authenticated delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'article-content' and (select public.is_admin()));

create policy "author-avatars authenticated write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'author-avatars' and (select public.is_admin()));

create policy "author-avatars authenticated update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'author-avatars' and (select public.is_admin()));

create policy "author-avatars authenticated delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'author-avatars' and (select public.is_admin()));
