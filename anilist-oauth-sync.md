# AniList OAuth & Watchlist Synchronization Plan

## Overview
Implement **AniList OAuth Integration and Bi-directional Synchronization** allowing users to connect their AniList account, import their existing AniList Anime Collections (Current, Planning, Completed) into V-Anime Revived, and automatically update AniList episode progress whenever they finish watching an episode.

---

## Project Type & Design Tokens
- **WEB** (Next.js 15 App Router, React 19, Clerk Auth, Convex DB, AniList GraphQL API)
- **DESIGN.md Compliance**:
  - Background: Deep Slate (`224 25% 8%` / `#0f141c`)
  - Primary Accent: Crimson Red (`348 83% 47%` / `#e11d48`)
  - AniList Brand Color: Blue (`#02a9ff` / `#3db4f2`) accent badge for AniList integrations
  - Surface: (`224 20% 12%` / `#181f2c`)
  - Border: (`224 15% 18%`)

---

## Success Criteria
- [ ] Convex schema includes `anilistAccounts` table with user index, storing accessToken, anilist username, avatar, and sync preferences.
- [ ] OAuth Callback endpoint `/api/auth/anilist/callback` exchanges authorization codes for AniList tokens and links the account to the Clerk user ID.
- [ ] Manual Sync action `syncFromAniList` pulls user's AniList anime entries and populates V-Anime's Watchlist and Favorites.
- [ ] Automated Progress Sync `syncEpisodeToAniList` updates AniList `SaveMediaListEntry` (progress + status) when an episode is watched (≥90%).
- [ ] User Profile & Settings (`/profile`) displays an interactive AniList Integration Card with connection status, sync button, and auto-sync toggles.

---

## Task Breakdown

### Task 1: Convex Schema & AniList Account Mutations/Queries
- **Agent:** `backend-specialist`
- **Skills:** `@database-design`, `@api-patterns`, `@clean-code`
- **Priority:** P0
- **OUTPUT:**
  - Add `anilistAccounts` to `apps/web/convex/schema.ts`.
  - Implement `apps/web/convex/anilistSync.ts` with:
    - `linkAniListAccount`: Mutation to save OAuth token and user profile.
    - `disconnectAniListAccount`: Mutation to unlink account.
    - `getAniListAccount`: Query to retrieve connection status.
    - `importAniListCollection`: Action to query AniList GraphQL and populate user's Convex Watchlist.
    - `syncEpisodeProgressToAniList`: Action to mutate `SaveMediaListEntry` on AniList.

---

### Task 2: OAuth API Route & Direct Token Support
- **Agent:** `backend-specialist`
- **Skills:** `@api-patterns`, `@clean-code`
- **Priority:** P0
- **OUTPUT:**
  - Add Next.js route `apps/web/src/app/api/auth/anilist/callback/route.ts` or client-side OAuth implicit token handler / manual token entry fallback for effortless developer and user connectivity.

---

### Task 3: Profile AniList Integration UI (`apps/web/src/app/profile/ProfileClient.tsx`)
- **Agent:** `frontend-specialist`
- **Skills:** `@frontend-design`, `@clean-code`
- **Priority:** P1
- **OUTPUT:**
  - Add AniList Sync card to Profile with connected status, avatar, sync now CTA, and auto-update toggle.
  - Add import summary report modal showing how many titles were synced.

---

## Phase X: Verification Checklist
- [x] `npx tsc --noEmit` in `apps/web` passes with 0 errors.
- [x] `npm run lint` in `apps/web` passes with 0 errors.
- [x] `npm run build` succeeds.
- [x] Test AniList connection, token validation, and mock sync execution.

## ✅ PLAN COMPLETE
- AniList OAuth client configured (ID: 48831) with 1-click authorization and bidirectional sync engine.
- Date: 2026-08-17
