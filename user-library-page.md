# User Library Dashboard Plan (`/library`)

## Overview
Build the dedicated **My Library Dashboard (`/library`)** where users can manage their personal anime experience across four reactive tabs: **Continue Watching**, **Watchlist**, **Favorites**, and **Watch History**.

---

## Project Type & Design Tokens
- **WEB** (Next.js 15 App Router, React 19, Clerk Auth, Convex DB)
- **DESIGN.md Compliance**:
  - Background: Deep Slate (`224 25% 8%` / `#0f141c`)
  - Primary Accent: Crimson Red (`348 83% 47%` / `#e11d48`)
  - Surface: (`224 20% 12%` / `#181f2c`)
  - Border: (`224 15% 18%`)
  - No purple on dark surfaces.

---

## Success Criteria
- [ ] Route `/library` renders responsive tab navigation (Continue Watching, Watchlist, Favorites, History).
- [ ] Direct reactive Convex data subscriptions with real-time UI updates when items are favorited, watchlisted, or watched.
- [ ] Guest state gracefully shows sign-in CTA with Clerk modal or redirect, with option to inspect guest local sessions.
- [ ] In-library search filter allows instant filtering of large watchlists/history by anime title.
- [ ] Interactive remove buttons on Watchlist and Favorites items with optimistic feedback.
- [ ] Polished empty states for each tab with direct navigation CTAs to `/` and `/search`.

---

## Task Breakdown

### Task 1: Convex Backend Enhancements for Library Management (`apps/web/convex/library.ts` & `progress.ts`)
- **Agent:** `backend-specialist`
- **Skills:** `@database-design`, `@clean-code`
- **Priority:** P0
- **OUTPUT:**
  - Add `clearWatchHistory` mutation in `convex/progress.ts`.
  - Add `removeFromWatchProgress` mutation in `convex/progress.ts` so users can dismiss items from "Continue Watching".
  - Ensure `getWatchHistory` returns hydrated anime titles and posters from `animeCache`.
- **VERIFY:** Mutations correctly validate Clerk authentication and delete matching documents.

---

### Task 2: Build Library Dashboard UI (`apps/web/src/app/library/page.tsx` & `LibraryClient.tsx`)
- **Agent:** `frontend-specialist`
- **Skills:** `@frontend-design`, `@clean-code`
- **Priority:** P1
- **OUTPUT:**
  - `page.tsx`: Route entry point with metadata.
  - `LibraryClient.tsx`: Tabbed view with framer-motion tab transitions, search filter, item counters, batch management, and empty states.
  - History Timeline view: Chronological group by date (Today, Yesterday, Older).
- **VERIFY:** Clicking tabs switches content smoothly; toggling favorite/watchlist or removing an item reflects instantly.

---

## Phase X: Verification Checklist
- [x] `npx tsc --noEmit` in `apps/web` passes with 0 errors.
- [x] `npm run lint` in `apps/web` passes with 0 errors.
- [x] `npm run build` succeeds and registers `/library` route.
- [x] Test tab switching, search filter, and reactive Convex state updates.

## ✅ PLAN COMPLETE
- User Library dashboard fully built and reactive with Convex mutations and queries.
- Date: 2026-08-17
