This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/create-next-app).

## Getting Started

The web player calls this BFF on `NEXT_PUBLIC_API_URL`; the BFF calls the private
scraper configured by `ANIVAULT_API_URL`. Playback routes require a Clerk bearer
token. Set `CLERK_SECRET_KEY`, `SCRAPER_API_KEY`, and `WEB_ORIGINS` before
starting the API. The API sends `SCRAPER_API_KEY` as `X-Scraper-Key` only to the
private scraper; it is never exposed to the browser.

Example local setup:

```bash
# terminal 1: private scraper (V-Anime-Revived-Scraper)
npm run dev # listens on port 3000 when PORT=3000

# terminal 2: BFF/API (apps/api)
WEB_ORIGINS=http://localhost:3000 ANIVAULT_API_URL=http://localhost:3000 npm run dev -- -p 3001
```

Use a comma-separated `WEB_ORIGINS` value for deployed web origins, and set the
same origin in the scraper's `CORS_ALLOWED_ORIGINS` so browser HLS/MP4 proxy
requests are accepted. The API rejects other browser origins. Each scraper
attempt times out after 8 seconds by
default, with a 55-second total fallback deadline (`UPSTREAM_TIMEOUT_MS` may be
set from 1,000 to 15,000 ms). Playback
requests are limited to 20 per authenticated Clerk user per minute. This is an
in-memory guard, so each API instance has its own window; use a shared Redis
limiter when deploying multiple instances.

Run focused BFF validation checks with `npm test`.

`npm audit --omit=dev` is clean. A full audit still reports the development-only
Next 16.4 ESLint chain (`eslint-config-next` → `fast-glob` → `micromatch` →
`braces`); npm's suggested fix downgrades to Next 14, so it is intentionally
not applied. The lockfile uses only range-compatible nested overrides for other
patched transitive packages.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/route.ts`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## API Routes

This directory contains example API routes for the headless API app.

For more details, see [route.js file convention](https://nextjs.org/docs/app/api-reference/file-conventions/route).
