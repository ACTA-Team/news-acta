# ACTA News

A Next.js repository that serves as a news hub for everything related to **ACTA**: announcements, releases, partnerships, ecosystem updates, and articles covering the project's evolution.

## What's in this repo

- `src/`: Next.js App Router pages and components that render the news site.
- `src/i18n/`: locale config, dictionaries (`en.json` / `es.json`) and formatting helpers.
- `public/`: Static assets (images, icons, media used in articles).
- Next.js 16 + React 19 + Tailwind CSS 4 setup.

## For developers: fork & clone

If you plan to contribute, first **fork** this repository from GitHub into your own account, then clone your fork locally:

```bash
git clone https://github.com/<your-username>/acta-news.git
cd acta-news
git remote add upstream https://github.com/acta-org/acta-news.git
```

If you only want to run the project locally (no contributions), you can clone it directly:

```bash
git clone https://github.com/acta-org/acta-news.git
cd acta-news
```

## Prerequisites

- **Node.js 20+**
- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**: must be installed and running before `npm run setup`. Supabase local runs PostgreSQL, Auth, and Studio as Docker containers.

## Run locally

```bash
npm install
npm run setup
npm run dev
```

`npm run setup` starts a local Supabase instance (PostgreSQL, Auth, Studio), runs all migrations, seeds the database, and writes `.env.local` with the correct credentials. No manual configuration needed.

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Local services

| Service          | URL                    |
| ---------------- | ---------------------- |
| Next.js app      | http://localhost:3000  |
| Supabase Studio  | http://127.0.0.1:54353 |
| Inbucket (email) | http://127.0.0.1:54354 |
| Supabase API     | http://127.0.0.1:54351 |

Inbucket captures all emails locally (magic links, confirmations) so auth flows work without a real email provider.

## Scripts

| Script              | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run setup`     | Start local Supabase + generate `.env.local` |
| `npm run dev`       | Start the Next.js dev server                 |
| `npm run build`     | Production build                             |
| `npm run start`     | Run the production build                     |
| `npm run lint`      | Lint the codebase                            |
| `npm run test`      | Run unit tests (Vitest)                      |
| `npm run format`    | Format with Prettier                         |
| `npm run db:start`  | Start Supabase containers                    |
| `npm run db:stop`   | Stop Supabase containers                     |
| `npm run db:reset`  | Reset database (re-run migrations + seed)    |
| `npm run db:status` | Show Supabase local status and credentials   |
| `npm run db:push`   | Push migrations to a remote Supabase project |

## Bilingual site (English / Spanish)

Every public URL carries its locale as the first path segment: `/en/news`,
`/es/news`. An unprefixed URL is redirected by `src/proxy.ts` to the negotiated
locale, resolved in this order:

1. the `acta-locale` cookie, written by the language switcher
2. the `Accept-Language` header, by descending quality
3. `DEFAULT_LOCALE`

The cookie deliberately outranks the header: it records a choice the reader made,
and their browser's advertised languages should not override it on the next visit.

The admin panel (`src/app/admin`) is not localized. It is an internal tool, and it
manages the _content_ translations rather than speaking two languages itself.

### Interface strings

`src/i18n/en.json` and `src/i18n/es.json` hold every user-facing string in the site
modules. Keys are dotted paths and the valid set is derived from `en.json`, so a
typo is a compile error. A key present in one language and missing from the other
is caught by `src/i18n/__tests__/dictionaries.test.ts`, which also checks that both
languages declare the same `{placeholders}`.

Server Components read the dictionary with `getTranslations(locale)`. Client
Components read it from the `TranslationsProvider` mounted in
`src/app/[locale]/layout.tsx`, via the `useTranslations()` hook. Dates and numbers
always go through `src/i18n/format.ts`, which takes an explicit locale rather than
falling back to the server's ambient default.

Long-form legal copy lives in `src/config/legal/{en,es}.ts` as structured data, not
in the dictionaries: it carries headings, lists and links that would not survive as
flat strings. **The Spanish translation there has not been reviewed by counsel:
read the notice at the top of `src/config/legal/es.ts` before shipping it.**

### Article translations

`supabase/migrations/0007_i18n.sql` adds `article_translations` (plus equivalents
for monthly reviews, tags and authors). Each article has a `source_locale`; every
other language is a row in that table, with its own slug, so `/es/news/<slug>` is a
real Spanish URL rather than a query parameter.

Resolution order in the service layer is always: the translation for the requested
locale, then the source article, then null. An article nobody has translated yet
still appears in the other locale's listing, in its source language, labelled as
such. Hiding it would leave a Spanish reader looking at an empty archive.

Staleness is not a stored flag. `news_articles.translation_source_hash` is a
generated column over the translatable fields, so editing a source article changes
it in the same statement; a translation is stale exactly when the hash it was
written against no longer matches. The admin editor at
`/admin/news/<id>/translations` shows the source and the translation side by side,
marks which individual fields moved, and offers "mark as up to date" for the case
where a source edit did not change the meaning.

### Search

The original schema built its search vector with the `'simple'` text search
configuration, which does no stemming in any language. `0007_i18n.sql` rebuilds it
per locale, so a Spanish search for "credenciales" matches an article about a
"credencial". Ranking lives in `public.search_articles(query, locale)` so the
browser and server clients cannot drift apart.

### SEO

`buildMetadata` emits `alternates.languages` with one entry per locale plus
`x-default`, and sets `openGraph.locale` / `alternateLocale`. A translated article
declares only the locales it actually exists in: pointing a Spanish alternate at an
English page is a worse signal than declaring no Spanish version. `src/app/sitemap.ts`
emits one entry per locale with the alternates attached, and each locale has its own
feed at `/<locale>/rss.xml`.

### Adding a string

1. add the key to `src/i18n/en.json` **and** `src/i18n/es.json`
2. read it with `t('your.new.key')` (`getTranslations` on the server,
   `useTranslations` on the client)
3. `npm run test` will fail if the two dictionaries disagree

## Stellar rich embeds

Articles can reference Stellar entities (transaction hashes, contract ids (`C…`),
account addresses (`G…`) and assets (`CODE:ISSUER`)) and they render as inline,
theme-aware embed cards. Admins can also use the **Insert Stellar Reference** button
in the article editor to paste an id, preview the embed, and insert a
`[[stellar:…]]` tag.

Entities are resolved server-side against Horizon / Soroban RPC and cached in the
`stellar_embeds_cache` table (transactions never expire; contracts 24h, accounts 1h,
assets 6h) with stale-while-revalidate. Failed resolutions fall back to a plain
explorer link and never block article rendering.

Set the network with `NEXT_PUBLIC_STELLAR_NETWORK` (`testnet` default, or `mainnet`).
The new cache table ships in `supabase/migrations/0003_stellar_embeds_cache.sql`: run
`npm run db:reset` (local) or `npm run db:push` (remote) to apply it.
