# V-Anime-Revived Technical Documentation

Welcome to the technical documentation for **V-Anime-Revived**, a modern anime streaming web application. This document serves as the central guide for the architecture, database schema, API design, and core workflows of the project.

---

## 1. System Overview

**V-Anime-Revived** is designed as a fully-featured, user-centric application layered on top of the **AniVault Scraper API** (for streaming resolution) and **AniList GraphQL API** (for metadata). The system relies on a **Next.js** architecture to manage application data, user preferences, and proxy external requests, providing a fast, secure, and abstraction-rich environment.

### Core Principles
- **Separation of Concerns:** AniVault handles streaming proxies and resolution, Convex manages reactive application state and caching, Clerk handles authentication, and V-Anime owns the product experience.
- **Frontend Independence:** The Next.js frontend primarily communicates with Convex for data and the Next.js API for proxying AniVault. It does not speak directly to AniVault or AniList, ensuring seamless future migrations.
- **Simplified Stack:** By utilizing Convex for Database, Cache, and Storage, and Clerk for Auth, the architecture is significantly streamlined. Redis is intentionally omitted until traffic necessitates an external cache.

---

## 2. Architecture & Tech Stack

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

### Technology Stack
- **Frontend:** Next.js (App Router), TypeScript, React, Tailwind CSS, shadcn/ui, Zustand, HLS.js
- **Auth:** Clerk (@clerk/nextjs)
- **Database, Cache, Storage:** Convex
- **External Services:** AniList API (Metadata), AniVault Scraper (Stream Resolution)
- **Deployment Strategy:** Vercel (Frontend/API) + Convex Cloud + Railway (AniVault)

---

## 3. Database Schema (Convex)

Convex is a reactive database. Our schema defines how user data, watch progress, and cached metadata are structured.

### Users
- Managed by Clerk, but user IDs are synced or stored alongside Convex documents for relational querying.

### Anime Metadata Cache
- **`anime_cache`**: Caches subsets of AniList data inside Convex to prevent unnecessary API calls. Stores `anilistId`, `title`, `description`, `posterUrl`, `genres`, `episodes`, `status`, etc.

### User Library
- **`favorites`**: `userId`, `anilistId`, `createdAt`.
- **`watchlist`**: `userId`, `anilistId`, `priority`, `createdAt`.
- **`watchHistory`**: Flat log of watched episodes. `userId`, `anilistId`, `episodeNumber`, `watchedAt`.

### Watch Progress
Maintains the exact playback state for "Continue Watching" functionality.
- **Fields:** `userId`, `anilistId`, `episodeNumber`, `duration`, `position`, `percentage`, `completed`, `lastWatchedAt`.

### Preferences
- **`userPreferences`**: `userId`, `preferredLanguage`, `preferredServer`, `autoplay`, `autoNext`, `skipIntro`.

---

## 4. API & Data Flow

### Discovery & Metadata (Convex Actions & Queries)
*   **Search**: Convex Action queries AniList, caches results in Convex, and returns standardized results.
*   **Anime Details**: Convex Query checks `anime_cache`. If missing, an Action fetches from AniList, caches it, and returns it.

### Streaming (Next.js API Proxies)
*   `GET /api/anime/:id/episodes/:episode/servers` - Returns available streaming servers (e.g., Senshi, AnimeHeaven). Proxies AniVault.
*   `GET /api/anime/:id/episodes/:episode/watch?type={sub|dub}&server={serverId}` - Returns the resolved playback stream source (HLS URL or MP4 proxy). Proxies AniVault.

### User Data (Convex Mutations/Queries)
*   **Favorites & Watchlist**: Managed via Convex Mutations (e.g., `addFavorite`, `removeFavorite`), secured by Clerk Auth checks.
*   **Progress**: Optimistic UI updates with Convex. `updateProgress` mutation handles saving watch position every few seconds.

---

## 5. Core Application Workflows

### 5.1 Streaming Fallback & Intelligent Server Selection
Streaming providers are inherently unreliable. 
1.  **Scoring System:** Servers are ranked based on availability and user preferences.
2.  **Fallback Logic:** The Next.js API attempts the preferred server. On failure, it silently shifts to the next highest-scoring server before responding to the client.

### 5.2 Optimistic Progress Saving
Convex's reactive nature makes this incredibly smooth:
1.  **Local State:** Playback position is tracked in-memory (Zustand).
2.  **Debounced Saving:** A Convex mutation `updateProgress` is dispatched every 10-15 seconds.
3.  **Triggered Saves:** Progress is saved immediately upon pausing, episode change, page unload, or when the video ends.

### 5.3 Caching Strategy
Convex handles initial caching. When an AniList fetch is required, Convex stores the result in an `anime_cache` table. Subsequent requests read directly from the fast Convex database. Redis is deferred until V2.

## 6. Development Milestones

### Phase 1: Foundation
Project scaffolding, Tailwind/shadcn setup, Clerk Auth configuration, and Convex initialization.

### Phase 2: Anime Discovery
Homepage layout, robust search features, anime detail cards, and metadata rendering driven by Convex Actions/Queries.

### Phase 3: Streaming Experience
HLS/MP4 player integration, server selection UI, Next.js proxy routes to AniVault, sub/dub switching.

### Phase 4: User Library
Favorites, Watchlist, debounced watch progress using Convex mutations, and the "Continue Watching" carousel.

### Phase 5: UX & Polish
Skeleton loaders, graceful error states, mobile responsiveness, PWA support, keyboard shortcuts, and dark mode.
