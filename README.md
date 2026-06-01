# ACTA News

A Next.js repository that serves as a news hub for everything related to **ACTA**: announcements, releases, partnerships, ecosystem updates, and articles covering the project's evolution.

## What's in this repo

- `src/` — Next.js App Router pages and components that render the news site.
- `public/` — Static assets (images, icons, media used in articles).
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
- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** — must be installed and running before `npm run setup`. Supabase local runs PostgreSQL, Auth, and Studio as Docker containers.

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
| `npm run format`    | Format with Prettier                         |
| `npm run db:start`  | Start Supabase containers                    |
| `npm run db:stop`   | Stop Supabase containers                     |
| `npm run db:reset`  | Reset database (re-run migrations + seed)    |
| `npm run db:status` | Show Supabase local status and credentials   |
| `npm run db:push`   | Push migrations to a remote Supabase project |
