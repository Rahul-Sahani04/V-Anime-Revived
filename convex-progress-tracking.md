# Convex Library, Playback Tracking & Player Automation Plan

## Overview
Implement the complete reactive user library and playback tracking backend using Convex (`library.ts`, `progress.ts`, `preferences.ts`), and integrate debounced progress saving, automatic playback resumption, and auto-next episode progression into the Next.js `VideoPlayer` and `WatchPlayerClient`.

---

## Project Type
**WEB** (Next.js 15 App Router, Convex Backend, Clerk Auth, Hls.js Streaming)

---

## Success Criteria
- [ ] Convex mutations and queries for Favorites & Watchlist (`addFavorite`, `removeFavorite`, `toggleWatchlist`, `getLibrary`, `isAnimeSaved`) are implemented and strictly verify Clerk authentication.
- [ ] Convex mutation `updateProgress` debounces every 10–15s during active playback, records current timestamp, total duration, and percentage.
- [ ] Marking `completed: true` when percentage exceeds completion threshold (≥90%) and logging to `watchHistory`.
- [ ] Query `getContinueWatching` returns user's active, unfinished watch sessions with anime metadata for home & library shelves.
- [ ] Video Player automatically seeks to the user's saved timestamp when an episode is opened.
- [ ] Video Player displays an auto-next countdown banner when the episode reaches its end or completes, smoothly navigating to episode `N+1`.
- [ ] Unauthenticated guests gracefully fallback to `localStorage` without crashing or throwing auth errors.

---

## Tech Stack & Architecture
- **Backend / Database:** Convex (`convex/server`, `convex/values`)
- **Authentication:** Clerk (`@clerk/nextjs`, `convex/react-clerk`, `ctx.auth.getUserIdentity()`)
- **Frontend State & Video:** React 19, Next.js 15, HLS.js, Lucide Icons, Motion
- **Design Tokens:** Deep Slate `#0d1117`, Crimson `#e11d48` (per `DESIGN.md`)

---

## File Structure

```text
apps/web/
├── convex/
│   ├── schema.ts                # Existing schema
│   ├── anilist.ts               # Existing AniList action & cache
│   ├── library.ts               # [NEW] Favorites & Watchlist queries/mutations
│   ├── progress.ts              # [NEW] Watch progress & history queries/mutations
│   └── preferences.ts           # [NEW] User playback & audio preferences
└── src/
    ├── app/
    │   └── anime/[id]/watch/[episode]/
    │       └── WatchPlayerClient.tsx # [EDIT] Wire progress, resume & auto-next
    └── components/
        └── player/
            └── VideoPlayer.tsx       # [EDIT] Debounced timeupdate, seek on load, onEnded handler
```

---

## Task Breakdown

### Task 1: Convex Library Functions (`apps/web/convex/library.ts`)
- **Agent:** `backend-specialist`
- **Skills:** `@database-design`, `@clean-code`
- **Priority:** P0
- **Dependencies:** None
- **INPUT:** `anilistId: number`, authenticated Clerk identity from `ctx.auth.getUserIdentity()`.
- **OUTPUT:**
  - `addFavorite`, `removeFavorite`, `toggleFavorite`
  - `addToWatchlist`, `removeFromWatchlist`, `toggleWatchlist`
  - `getLibrary` (returns user's favorites & watchlist joined with `animeCache`)
  - `checkAnimeStatus` (returns `{ isFavorite: boolean, isWatchlisted: boolean }`)
- **VERIFY:** Convex compiles without type errors, queries return correctly typed arrays.

---

### Task 2: Convex Progress & History Functions (`apps/web/convex/progress.ts`)
- **Agent:** `backend-specialist`
- **Skills:** `@database-design`, `@clean-code`
- **Priority:** P0
- **Dependencies:** None
- **INPUT:** `anilistId`, `episodeNumber`, `position`, `duration`, `percentage`, `completed`.
- **OUTPUT:**
  - `updateProgress` mutation: Upserts `watchProgress` using `by_user_and_anime_and_episode` index. If `completed: true`, also creates or updates `watchHistory`.
  - `getAnimeProgress` query: Fetches current playback position for a specific anime and episode.
  - `getContinueWatching` query: Fetches active sessions where `completed === false`, ordered by `lastWatchedAt` desc, joined with `animeCache`.
  - `getWatchHistory` query: Chronological list of watched episodes.
- **VERIFY:** Upsert does not duplicate rows; querying returns correct latest progress timestamp.

---

### Task 3: Convex User Preferences Functions (`apps/web/convex/preferences.ts`)
- **Agent:** `backend-specialist`
- **Skills:** `@database-design`, `@clean-code`
- **Priority:** P1
- **Dependencies:** None
- **INPUT:** User preference fields (`preferredLanguage`, `preferredServer`, `autoplay`, `autoNext`).
- **OUTPUT:** `getPreferences` query, `updatePreferences` mutation.
- **VERIFY:** Fallback to defaults (`sub`, `senshi`, `autoNext: true`) if unconfigured.

---

### Task 4: Video Player Playback Tracking & Resume (`apps/web/src/components/player/VideoPlayer.tsx`)
- **Agent:** `frontend-specialist`
- **Skills:** `@frontend-design`, `@clean-code`
- **Priority:** P1
- **Dependencies:** Task 2
- **INPUT:** `animeId`, `episode`, current playback time.
- **OUTPUT:**
  - On video metadata loaded: query saved progress from Convex (or `localStorage` fallback) and seek video to `position` (if `position > 10s` and not completed).
  - On `timeupdate`: update in-memory state; every 15 seconds (or on pause/beforeunload/ended), dispatch `updateProgress`.
  - On video reaching ≥90% or `ended`: trigger `completed: true` and emit `onEpisodeEnd` callback.
- **VERIFY:** Progress updates in Convex DB without performance lag or dropped video frames.

---

### Task 5: Watch Page UI Integration & Auto-Next Overlay (`apps/web/src/app/anime/[id]/watch/[episode]/WatchPlayerClient.tsx`)
- **Agent:** `frontend-specialist`
- **Skills:** `@frontend-design`, `@clean-code`
- **Priority:** P2
- **Dependencies:** Task 4
- **INPUT:** Active episode, total episodes, auto-next trigger.
- **OUTPUT:**
  - Floating auto-next countdown banner when video finishes ("Next episode starting in 5s..." with Cancel and Play Now buttons).
  - Navigation buttons updated with active server & language states from user preferences.
- **VERIFY:** Smooth transition to next episode URL `/anime/[id]/watch/[episode+1]` without reloading the full page shell.

---

## Phase X: Verification Checklist
- [x] Run TypeScript type check (`npx tsc --noEmit`) in `apps/web` → PASSED (0 errors).
- [x] Verify `npm run lint` passes without errors → PASSED (0 errors).
- [x] Verify Next.js production build (`npm run build`) in `apps/web` → SUCCESS.
- [x] Unauthenticated guests gracefully fallback to `localStorage` without auth errors.
- [x] Authenticated users persist progress to Convex with debounced sync, resume from saved timestamp, and 5s auto-next countdown.

## ✅ PHASE X COMPLETE
- Type Check: ✅ Pass (`npx tsc --noEmit`)
- Linting: ✅ Pass (`npm run lint` 0 errors)
- Build: ✅ Success (`next build` compiled successfully)
- Date: 2026-08-17
