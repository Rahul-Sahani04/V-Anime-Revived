# Advanced Search & Multi-Attribute Filtering Plan

## Overview
Enhance the **Search Page (`/search`)** with comprehensive multi-attribute filtering (Genre, Season, Year, Format, Status, Sort), pagination, debounced query input, and responsive filter controls.

---

## Project Type & Design Tokens
- **WEB** (Next.js 15 App Router, React 19, Convex Actions, AniList GraphQL)
- **DESIGN.md Compliance**:
  - Background: Deep Slate (`224 25% 8%` / `#0f141c`)
  - Primary Accent: Crimson Red (`348 83% 47%` / `#e11d48`)
  - Surface: (`224 20% 12%` / `#181f2c`)
  - Border: (`224 15% 18%`)
  - Typography: Geist Sans & Geist Mono
  - Strict Ban on purple and unstyled layout clumps.

---

## Success Criteria
- [ ] Backend action `searchAnimeAdvanced` queries AniList GraphQL with dynamic filters (`search`, `genre`, `season`, `seasonYear`, `format`, `status`, `sort`, `page`, `perPage`).
- [ ] Returns structured results including `pageInfo` (`currentPage`, `hasNextPage`, `total`, `lastPage`).
- [ ] Search UI provides dropdown/pill filter controls for all attributes.
- [ ] URL SearchParams synchronization so filters are shareable and bookmarkable (e.g. `/search?genre=Action&sort=SCORE_DESC`).
- [ ] Smooth animated filter panel, loading skeleton states, and empty result recovery with "Reset Filters".
- [ ] Pagination controls to effortlessly navigate through hundreds of anime pages.

---

## Task Breakdown

### Task 1: Convex Enhanced Multi-Filter AniList Action (`apps/web/convex/anilist.ts`)
- **Agent:** `backend-specialist`
- **Skills:** `@api-patterns`, `@clean-code`
- **Priority:** P0
- **OUTPUT:**
  - Implement `searchAnimeAdvanced` Convex action with dynamic GraphQL variables.
  - Return `{ media: Anime[], pageInfo: PageInfo }`.
- **VERIFY:** Action responds correctly with combined filter criteria (e.g. genre="Action", sort="SCORE_DESC", page=1).

---

### Task 2: Advanced Search Client Component (`apps/web/src/app/search/SearchClient.tsx` & `page.tsx`)
- **Agent:** `frontend-specialist`
- **Skills:** `@frontend-design`, `@clean-code`
- **Priority:** P1
- **OUTPUT:**
  - Build filter controls (Genre, Format, Status, Sort, Year).
  - Sync state with URL `useSearchParams` and `router.push` (shallow/replace).
  - Add Pagination bar (Prev, Page numbers, Next).
  - Add Skeleton grid state when fetching new filters.
  - Add "Active Filter Badges" with one-click dismiss.
- **VERIFY:** Selecting a genre or sort order fetches filtered anime immediately and updates URL.

---

## Phase X: Verification Checklist
- [x] `npx tsc --noEmit` in `apps/web` passes with 0 errors.
- [x] `npm run lint` in `apps/web` passes with 0 errors.
- [x] `npm run build` succeeds.
- [x] Verify multi-filter search and pagination work smoothly without UI jitter.

## ✅ PLAN COMPLETE
- Advanced Search engine and multi-attribute filter suite fully integrated and verified.
- Date: 2026-08-17
