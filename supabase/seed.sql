-- =============================================================================
-- ACTA News — development seed
-- Run with:  supabase db reset  (after the initial migration is applied)
-- =============================================================================

-- Authors
insert into public.authors (slug, name, role, bio) values
  ('acta-team', 'ACTA Team', 'Core team', 'The official ACTA team.'),
  ('josue-brizuela', 'Josue Brizuela', 'Founder', 'Building ACTA.')
on conflict (slug) do nothing;

-- Tags
insert into public.tags (slug, label, description) values
  ('stellar',     'Stellar',     'Posts related to the Stellar network.'),
  ('credentials', 'Credentials', 'Verifiable credentials and identity.'),
  ('roadmap',     'Roadmap',     'Project roadmap and milestones.')
on conflict (slug) do nothing;

-- Articles
insert into public.news_articles
  (slug, title, summary, content, category, status, author_id, reading_time_minutes, published_at)
select
  'welcome-to-acta-news',
  'Welcome to ACTA News',
  'The official blog of ACTA is live. Announcements, monthly reviews and strategic updates.',
  '<p>We are launching the official ACTA blog to share announcements, monthly reviews and strategic updates from the ecosystem.</p>',
  'announcement',
  'published',
  a.id,
  2,
  now()
from public.authors a
where a.slug = 'acta-team'
on conflict (slug) do nothing;

-- Article ↔ tags
insert into public.news_article_tags (article_id, tag_slug)
select n.id, 'roadmap'
from public.news_articles n
where n.slug = 'welcome-to-acta-news'
on conflict do nothing;

-- Monthly review
insert into public.monthly_reviews (period, title, summary, highlights, metrics, published_at) values
  (
    to_char(now(), 'YYYY-MM'),
    'ACTA Monthly Review',
    'First edition of the ACTA monthly review.',
    '[{"title":"Blog launched","description":"The official ACTA blog is live."}]'::jsonb,
    '[{"label":"New articles","value":"1"}]'::jsonb,
    now()
  )
on conflict (period) do nothing;

-- Admin users (email-only access to /admin)
insert into public.admin_users (email) values
  ('josue@acta.build')
on conflict (email) do nothing;
