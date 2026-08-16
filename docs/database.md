# V-Anime-Revived: Database Schema (Convex)

V-Anime-Revived uses **Convex** for reactive, document-based data management. This document outlines the core schema defined in `convex/schema.ts`.

## 1. Core Principles
*   **Clerk Identity:** All user-specific tables map to the `userId` provided by Clerk.
*   **Reactive Queries:** The frontend subscribes to queries (like watch progress), eliminating the need for manual refetching.
*   **Cache as Data:** Convex tables act as our primary cache for AniList metadata.

---

## 2. Schema Definition (`convex/schema.ts`)

### `users` (Optional Sync)
While Clerk handles auth, we may sync user data to a Convex table via webhooks if relational joins on usernames/avatars are needed.
*   `clerkId` (v.string())
*   `username` (v.string())
*   `imageUrl` (v.string())

### `userPreferences`
Stores application-wide settings for the user.
*   `userId` (v.string()) - Clerk ID
*   `preferredLanguage` (v.string()) - 'sub' or 'dub'
*   `preferredServer` (v.string())
*   `autoplay` (v.boolean())
*   `autoNext` (v.boolean())
*   **Index:** `by_userId`

---

## 3. Caching & Metadata

### `animeCache`
A localized cache of AniList data to prevent rate limits and speed up UI rendering.
*   `anilistId` (v.number())
*   `title` (v.object({...}))
*   `description` (v.string())
*   `posterUrl` (v.string())
*   `genres` (v.array(v.string()))
*   `episodes` (v.number())
*   `updatedAt` (v.number())
*   **Index:** `by_anilistId`

---

## 4. User Library

### `favorites`
Anime explicitly marked as favorites.
*   `userId` (v.string())
*   `anilistId` (v.number())
*   `createdAt` (v.number())
*   **Index:** `by_user_and_anime` (userId, anilistId)

### `watchlist`
Anime the user intends to watch.
*   `userId` (v.string())
*   `anilistId` (v.number())
*   `priority` (v.number())
*   `createdAt` (v.number())
*   **Index:** `by_user_and_anime` (userId, anilistId)

---

## 5. Playback State

### `watchProgress` (Critical Table)
Tracks exact playback state per episode. Drives the "Continue Watching" feature.
*   `userId` (v.string())
*   `anilistId` (v.number())
*   `episodeNumber` (v.number())
*   `position` (v.number()) - Current playback time in seconds
*   `duration` (v.number()) - Total video duration in seconds
*   `percentage` (v.number())
*   `completed` (v.boolean())
*   `lastWatchedAt` (v.number())
*   **Indexes:**
    *   `by_user_and_anime_and_episode` (userId, anilistId, episodeNumber)
    *   `by_user_active` (userId, completed) - Used for sorting "Continue Watching"

### `watchHistory`
A flat chronological log of completed episodes.
*   `userId` (v.string())
*   `anilistId` (v.number())
*   `episodeNumber` (v.number())
*   `server` (v.string())
*   `watchedAt` (v.number())
*   **Index:** `by_user`
