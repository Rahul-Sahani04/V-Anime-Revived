# V-Anime-Revived: API & Data Contract

This document outlines how data flows in the **V-Anime-Revived** application. Unlike a traditional REST setup, this architecture uses **Convex** for database operations and metadata fetching, and **Next.js API Routes** strictly for proxying the stream resolver (AniVault).

## 1. Authentication

Authentication is handled via **Clerk**.
*   The Next.js frontend uses `<ClerkProvider>`.
*   Convex integrates directly with Clerk. All Convex Queries and Mutations verify the Clerk JWT automatically via `ctx.auth.getUserIdentity()`.
*   Next.js API Routes verify Clerk sessions using `auth()` from `@clerk/nextjs/server`.

---

## 2. Discovery & Metadata (Convex)

Instead of Next.js API routes, metadata and discovery are handled entirely by Convex Actions and Queries.

### Search
*   **Convex Action:** Queries AniList GraphQL, normalizes the data, and returns an array of `Anime` objects to the client.

### Anime Details & Caching
*   **Convex Query (`getAnimeDetails`):** Checks the `anime_cache` table in Convex.
*   **Convex Action (Fallback):** If the data is missing, a Convex Action queries AniList, triggers an internal mutation to populate the `anime_cache` table, and returns the data.

---

## 3. Streaming Resolution (Next.js API Routes)

Because stream resolution involves hitting our AniVault scraper, we proxy this through Next.js API routes to handle failovers and protect the scraper's URL.

### `GET /api/anime/:id/episodes/:episode/servers`
Retrieves a list of available streaming servers for a specific episode from AniVault.
*   **Returns:** Array of `Server` objects (e.g., `[{ id: "senshi", name: "Senshi" }]`).

### `GET /api/anime/:id/episodes/:episode/watch`
Resolves the actual playback source via AniVault.
*   **Query Params:** `type` (sub/dub), `server` (e.g., senshi)
*   **Returns:** `PlaybackSource` object.
    ```json
    {
      "mode": "hls",
      "url": "https://anivault.../proxy/hls/...",
      "subtitles": [{ "lang": "English", "url": "..." }]
    }
    ```
*   **Fallback Behavior:** If the requested server fails, the API route automatically attempts a fallback server and returns its source.

---

## 4. User Library & Progress (Convex)

User actions are handled via reactive Convex Mutations.

### Favorites & Watchlist
*   **`addFavorite` / `removeFavorite`:** Convex mutations that insert/delete rows in the `favorites` table.
*   **`getLibrary`:** A Convex query that joins the user's favorites/watchlist with the `anime_cache` table.

### Watch Progress
*   **`updateProgress` (Mutation):** Called dynamically every 10-15 seconds during playback.
    *   **Payload:** `{ anilistId, episodeNumber, position, duration, percentage, completed }`
    *   **Behavior:** Upserts the record in the `watchProgress` table. If `completed` is true, it inserts into `watchHistory`.
*   **`getContinueWatching` (Query):** Reactive query returning the user's active, unfinished sessions sorted by last watched.
