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

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill in the Supabase values in `.env.local` before using auth-related flows.

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — lint the codebase
- `npm run format` — format with Prettier
