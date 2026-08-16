# V-Anime-Revived: System Architecture

This document describes the high-level architecture and system components of **V-Anime-Revived**.

## 1. High-Level Overview

V-Anime-Revived is built as a highly decoupled modern web application. It uses a **Next.js** core, **Clerk** for Authentication, and **Convex** for reactive data and caching. The frontend is strictly insulated from external streaming scrapers and metadata APIs.

```text
             V-Anime-Revived (Next.js)
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
      Clerk       Convex      AniVault
       Auth       Data        Streaming
                    │
                    ▼
                 AniList
```

## 2. Core Service Responsibilities

### 2.1 Next.js Frontend
*   **Routing & UI:** Next.js App Router for layouts, pages, and UI components.
*   **State Management:** Zustand for local state (e.g., active player state) and Convex's React hooks for reactive global data (watch progress, library).
*   **Player:** Dynamic media player using `hls.js` for HLS streams and standard HTML5 `<video>` for direct MP4 playback.
*   **Styling:** Tailwind CSS combined with `shadcn/ui`.

### 2.2 Next.js API Routes (BFF Layer)
*   **Proxying:** Safely requests streaming sources from AniVault without exposing the scraper directly to the client. This handles server failover logic.

### 2.3 Convex (Database & Cache)
*   **Reactive Data:** Stores user progress, favorites, and watch history. Pushes real-time updates to the Next.js client.
*   **Server Actions:** Convex Actions are used to securely query AniList for metadata, avoiding client-side rate limits.
*   **Caching:** Convex tables act as the primary caching layer for AniList metadata, bypassing the need for Redis in V1.

### 2.4 External Dependencies
*   **Clerk:** Manages Identity, sessions, and social logins.
*   **AniVault Scraper:** Dedicated microservice for scraping anime episodes, extracting server links, and generating video proxy URLs.
*   **AniList API:** Source of truth for all anime metadata.

## 3. Streaming Architecture

Because streaming providers frequently change or experience downtime, the architecture requires robust fallback mechanisms.

1.  **Request:** The user clicks "Play" on an episode.
2.  **Server Scoring:** The API scores available servers based on reliability and user preference.
3.  **Resolution:** The API attempts to resolve the stream URL via AniVault.
4.  **Fallback:** If AniVault fails, the API seamlessly requests the fallback server before responding to the client.
5.  **Playback:** The frontend receives a standardized `PlaybackSource` object to mount the correct player.

## 4. Scalability & Performance

-   **Caching:** Convex stores AniList metadata. Redis is intentionally omitted until traffic scales to a point where a dedicated external KV cache is required.
-   **Debounced Writes:** Video progress is saved via Convex mutations every 10-15 seconds. Convex handles this high-throughput easily.
