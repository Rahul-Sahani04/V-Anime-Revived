# User Profiles & Preferences Dashboard Plan (`/profile`)

## Overview
Build the dedicated **User Profile & Streaming Preferences Dashboard (`/profile`)** where authenticated users can view their anime streaming stats, customize playback defaults (Sub/Dub, preferred server, autoplay, auto-next), and manage account settings.

---

## Project Type & Design Tokens
- **WEB** (Next.js 15 App Router, React 19, Clerk Auth, Convex DB)
- **DESIGN.md Compliance**:
  - Background: Deep Slate (`224 25% 8%` / `#0f141c`)
  - Primary Accent: Crimson Red (`348 83% 47%` / `#e11d48`)
  - Surface: (`224 20% 12%` / `#181f2c`)
  - Border: (`224 15% 18%`)
  - Typography: Geist Sans & Geist Mono

---

## Success Criteria
- [ ] Route `/profile` renders customized profile card with user avatar, name, email, and live lifetime stats (Watchlist count, Favorites count, Completed Episodes count, Estimated Hours Watched).
- [ ] Streaming Preferences form allows toggling:
  - Default Audio Language (Subbed JP vs Dubbed EN)
  - Default Streaming Server (Senshi, Anikoto, Miruro, etc.)
  - Autoplay Video (On/Off)
  - Auto-Advance to Next Episode (On/Off)
- [ ] Instant reactive sync with Convex mutation `updateUserPreferences` with optimistic visual feedback.
- [ ] VideoPlayer and Watch page respect user's saved preferred server and audio language defaults when opening an episode.
- [ ] Unauthenticated users visiting `/profile` are gracefully prompted to sign in with Clerk.

---

## Task Breakdown

### Task 1: Convex User Stats Query (`apps/web/convex/preferences.ts`)
- **Agent:** `backend-specialist`
- **Skills:** `@database-design`, `@clean-code`
- **Priority:** P0
- **OUTPUT:**
  - Add `getUserStats` query computing total favorites, watchlist items, completed history entries, and estimated watch hours.
- **VERIFY:** Query returns accurate aggregates from Convex database.

---

### Task 2: Build Profile & Settings UI (`apps/web/src/app/profile/page.tsx` & `ProfileClient.tsx`)
- **Agent:** `frontend-specialist`
- **Skills:** `@frontend-design`, `@clean-code`
- **Priority:** P1
- **OUTPUT:**
  - Create `/profile` route with Next.js metadata.
  - Build `ProfileClient.tsx` featuring profile card, stats grid, and interactive preference toggles with animated switches.
- **VERIFY:** Toggling settings updates Convex database immediately without full page reloads.

---

## Phase X: Verification Checklist
- [ ] `npx tsc --noEmit` in `apps/web` passes with 0 errors.
- [ ] `npm run lint` in `apps/web` passes with 0 errors.
- [ ] `npm run build` succeeds and registers `/profile`.
