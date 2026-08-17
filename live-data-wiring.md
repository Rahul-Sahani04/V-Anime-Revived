# Live Data Wiring Plan: Home Page & Anime Details

## Overview
Connect the **Home Page (`apps/web/src/app/page.tsx`)** and **Anime Details Page (`apps/web/src/app/anime/[id]/page.tsx`)** to live Convex actions/queries (`getTrending`, `getAnimeDetails`, `getContinueWatching`) and replace all static mock data.

---

## Project Type
**WEB** (Next.js 15 App Router, React 19, Convex Backend, Clerk Auth)

---

## Success Criteria
- [ ] Home Page Hero Carousel & Trending/Popular shelves render live trending anime from AniList/Convex (`getTrending`).
- [ ] Home Page "Continue Watching" shelf reactively displays user's real in-progress anime from Convex (`getContinueWatching`) for signed-in users, and `localStorage` for guests.
- [ ] Anime Details Page (`/anime/[id]`) dynamically fetches anime metadata via Convex action `getAnimeDetails({ id })`, with automatic caching in `animeCache`.
- [ ] Handling ongoing series where `episodes` count is not yet fixed by checking available episodes or `nextAiringEpisode`.
- [ ] Skeleton loaders (`loading.tsx`) and error states render gracefully during network fetches.
- [ ] Zero static mock anime data remaining in `page.tsx` and `anime/[id]/page.tsx`.

---

## Task Breakdown

### Task 1: Convex Enhanced Queries for Home & Details (`apps/web/convex/anilist.ts`)
- **Agent:** `backend-specialist`
- **Skills:** `@database-design`, `@clean-code`
- **Priority:** P0
- **Dependencies:** None
- **INPUT:** Enhanced GraphQL queries to fetch top rated, popular seasonal, and trending anime with cover images and banner images.
- **OUTPUT:**
  - `getHomeFeed` action: Returns `{ trending: Anime[], popularThisSeason: Anime[], topRated: Anime[] }`.
  - `getAnimeDetails`: Handles full metadata including relations, next airing episode, and description sanitization.
- **VERIFY:** Convex compiles without errors, queries return correctly structured media objects.

---

### Task 2: Home Page Live Data Integration (`apps/web/src/app/page.tsx` & Client Shelves)
- **Agent:** `frontend-specialist`
- **Skills:** `@frontend-design`, `@clean-code`
- **Priority:** P1
- **Dependencies:** Task 1
- **INPUT:** Live Convex data from `api.anilist.getHomeFeed` and `api.progress.getContinueWatching`.
- **OUTPUT:**
  - `HomeFeedClient` component rendering real `HeroCarousel`, `ContinueWatchingShelf` (handling both Convex and guest `localStorage`), `TrendingShelf`, and `TopRatedShelf`.
- **VERIFY:** Home page loads live anime posters, banner images, and resume progress bars.

---

### Task 3: Anime Details Page Live Data Integration (`apps/web/src/app/anime/[id]/page.tsx`)
- **Agent:** `frontend-specialist`
- **Skills:** `@frontend-design`, `@clean-code`
- **Priority:** P1
- **Dependencies:** Task 1
- **INPUT:** Route params `id`.
- **OUTPUT:**
  - Dynamic fetch of AniList/Convex data for the requested anime ID.
  - Generates accurate episode counts (supporting both finished series and ongoing airing anime).
  - Dynamic OpenGraph metadata (`title`, `description`, `images`) for SEO.
- **VERIFY:** Navigating to `/anime/21` (One Piece) or any searched anime loads real artwork, title, synopsis, and episode grid.

---

## Phase X: Verification Checklist
- [ ] Run `npx tsc --noEmit` in `apps/web`.
- [ ] Run `npm run lint` in `apps/web`.
- [ ] Verify `npm run build` succeeds.
- [ ] Verify all mock data arrays are removed.
