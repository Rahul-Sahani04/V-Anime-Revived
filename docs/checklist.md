# V-Anime Revived - Project Checklist

This document tracks the overall progress of the V-Anime Revived project.

## ✅ Complete
- **Monorepo Setup**: Configured Next.js 15 (App Router) with Turbopack for both `apps/web` (frontend) and `apps/api` (backend proxies).
- **Styling**: Integrated Tailwind CSS v4.
- **Authentication (Clerk)**:
  - Migrated to Clerk v6 (Core 3).
  - Implemented secure, custom `/sign-in` and `/sign-up` pages with explicit path routing to handle SSO callbacks.
  - Deployed `middleware.ts` to protect specific routes (e.g., `/watch`, `/library`).
- **Database (Convex)**: Initialized Convex backend and generated client providers.
- **Scraper Integration (AniVault)**:
  - Configured proxy endpoints to bridge the frontend and the local AniVault scraping server.
  - Implemented intelligent server fallback logic (prioritizing Anikoto, Miruro, Senshi, AnimeHeaven).
- **Video Player**:
  - Built a dynamic `VideoPlayer` component utilizing `hls.js` for robust M3U8 streaming and native HLS fallback for Apple devices.
  - Implemented dynamic stream URL extraction (`hlsProxyUrl`, `m3u8`, `mp4ProxyUrl`).
- **Watch Page UI**:
  - Fully wired up dynamic routing.
  - Added interactive buttons to toggle between multiple streaming Servers and Audio formats (Sub/Dub) that directly update the video feed via URL parameters.
- **CORS & Whitelisting**: Whitelisted AniList CDN (`s4.anilist.co`) in `next.config.ts`.

- **Convex Reactive Backend Modules**:
  - Implemented `library.ts` (`toggleFavorite`, `toggleWatchlist`, `getLibrary`, `getAnimeUserStatus`).
  - Implemented `progress.ts` (`updateProgress`, `getAnimeProgress`, `getContinueWatching`, `getWatchHistory`, `syncGuestProgress`).
  - Implemented `preferences.ts` (`getUserPreferences`, `updateUserPreferences`).
- **Video Player Playback Tracking & Automation**:
  - Implemented debounced (15s) time updates, pause/unload saves, and completion (≥90%) detection.
  - Implemented automatic resumption from saved timestamp with quick "Restart" trigger.
  - Implemented 5-second Auto-Next episode countdown banner with play immediately and cancel actions.
  - Implemented full keyboard shortcut support (Space/K, Arrows/J/L for seek, F for fullscreen, M for mute).
  - Implemented guest fallback to `localStorage` and automatic sync to Convex on Clerk login.
- **Anime Details Interactive Actions**:
  - Interactive "Add to Watchlist" and "Favorite" buttons wired directly to reactive Convex mutations with Clerk auth redirect.

- **Live Data Integration (Home & Details Pages)**:
  - Wired Home page to live AniList/Convex feed (`getHomeFeed`): Spotlight Hero Carousel, Continue Watching shelf (reactive Convex + guest `localStorage`), Trending Now, Popular This Season, and Critically Acclaimed shelves.
  - Wired Anime Details page (`/anime/[id]`) to live `getAnimeDetails` with dynamic episode count derivation (supporting ongoing airing anime), studio info, synopsis cleaning, and automatic Convex cache updates.
  - Implemented dynamic OpenGraph SEO metadata across Details (`/anime/[id]`) and Watch (`/anime/[id]/watch/[episode]`) pages.

- **User Library Dashboard (`/library`)**:
  - Implemented tabbed management interface for Continue Watching, Watchlist, Favorites, and Watch History.
  - Implemented instant search filter across library items.
  - Implemented individual card action buttons (Resume, Replay, Dismiss Continue, Remove Watchlist, Remove Favorite, Delete History Entry).
  - Implemented Clear All Watch History modal with confirmation dialog.
  - Added guest preview with local storage hydration and Clerk sign-in banner.

## ⏳ Work In Progress (WIP)
- **Search Page UI Filters**: Add advanced filters (Season, Year, Format, Status) & pagination.
- **Loading States**: Add skeleton loaders (`loading.tsx`) and Next.js error boundaries.

## 🛑 Haven't Started
- **User Profiles**: Custom avatars, bio, and tracking stats.
- **Social Features**: Comment sections under episodes, ratings, and user reviews.
- **AniList Syncing**: Allowing users to connect their AniList account via OAuth to sync their watchlist automatically.
- **Notifications**: Alerts for when a new episode of a favorited anime drops.
- **Admin Dashboard**: A hidden route for managing site analytics or featured shows.
- **SEO & Meta Tags**: OpenGraph tags, dynamic sitemaps, and indexing optimizations for search engines.
