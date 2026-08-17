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
- **Watch Page Experience & Layout Overhaul**:
  - Implemented top Breadcrumbs bar with anime title (English & Romaji), episode badge, score pill, release year, studio, and format badges.
  - Implemented one-click quick actions in header: "Add to Watchlist" (reactive Convex status), "Favorite", "Share Episode Link", and "Series Overview".
  - Implemented rich 2-column responsive dashboard:
    - **Left Column**: Anime overview card with cover art thumbnail, expandable synopsis, genre pills, streaming server matrix (Senshi, Anizone, Anikoto, Miruro, etc.), dual audio selector (Subbed JP vs Dubbed EN), and related franchise anime cards.
    - **Right Column**: Interactive Episode Browser featuring Grid vs Detailed List view toggle, live episode search/jump input, 50-episode chunked tabs for long-running shows (e.g. `1-50`, `51-100`), and real-time active playing badge with pulsating indicator.
- **CORS & Whitelisting**: Whitelisted AniList CDN (`s4.anilist.co`) in `next.config.ts`.

- **Convex Reactive Backend Modules**:
  - Implemented `library.ts` (`toggleFavorite`, `toggleWatchlist`, `getLibrary`, `getAnimeUserStatus`).
  - Implemented `progress.ts` (`updateProgress`, `getAnimeProgress`, `getContinueWatching`, `getWatchHistory`, `syncGuestProgress`).
  - Implemented `preferences.ts` (`getUserPreferences`, `updateUserPreferences`).
- **Custom Cinematic Video Player & AniSkip Integration**:
  - Replaced native browser controls with a custom floating gradient HUD with auto-hide timer (2.5s idle).
  - Implemented multi-layered progress scrubber (Buffer track, Played track, glow scrub thumb, and hover timestamp tooltip).
  - Integrated open-source **AniSkip API** (`https://api.aniskip.com`) to automatically detect episode OP/ED/recap ranges and display a floating "Skip Opening (S)" button.
  - Added fallback manual "+85s Intro" jump button and ±10s quick seek buttons.
  - Added playback speed selector popover (0.5x, 0.75x, 1.0x, 1.25x, 1.5x, 2.0x).
  - Added Picture-in-Picture (PiP) and Fullscreen API support.
  - Implemented center-screen ripple animations for play/pause and seeking.
  - Added mobile double-tap to seek (left 40% = -10s, right 40% = +10s).
  - Complete keyboard shortcut engine (Space/K, J/L, Arrows, F, M, S, P) with transient on-screen toast alerts.
  - Automatic timestamp resumption with quick "Restart" trigger.
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

- **Advanced Search & Multi-Attribute Filtering (`/search`)**:
  - Implemented `searchAnimeAdvanced` Convex action with AniList GraphQL querying.
  - Added multi-attribute filter panel for Genre, Season, Year, Format, Status, and Sort.
  - Implemented live debounced (400ms) search input with active filter badges and one-click dismiss.
  - Implemented URL SearchParams synchronization for shareable search links and browser history navigation.
  - Implemented multi-page pagination with smooth scrolling and loading skeleton states.

- **Loading Skeletons & Error Boundaries**:
  - Implemented Next.js `loading.tsx` shimmer skeletons for Home (`/`), Anime Details (`/anime/[id]`), Watch Player (`/anime/[id]/watch/[episode]`), and Library (`/library`).
  - Implemented client `error.tsx` recovery boundaries with "Try Again", "Return Home", and expandable technical error digests across all core routes.

- **User Profiles & Playback Preferences (`/profile`)**:
  - Implemented `getUserStats` in Convex to calculate lifetime watched episodes, total hours streamed, watchlist count, and milestone badges (e.g., "Otaku Master 👑", "Binge Watcher 🍿").
  - Implemented `/profile` dashboard allowing users to configure default audio tracks (Subbed JP vs Dubbed EN), preferred video servers (Senshi, Anikoto, Miruro, etc.), Autoplay, and Auto-Next triggers with instant optimistic saving and toast alerts.
- **Dynamic OpenGraph Image Generation & SEO Metadata**:
  - Implemented dynamic 1200x630 `ImageResponse` OG engines for Global Home (`/opengraph-image`), Anime Details (`/anime/[id]/opengraph-image`), Watch Episode Player (`/anime/[id]/watch/[episode]/opengraph-image`), Search (`/search/opengraph-image`), and Library (`/library/opengraph-image`).
  - Configured `metadataBase`, dynamic Twitter summary cards, and canonical URL structure across all routes.

## ⏳ Work In Progress (WIP)
- **Social Features**: Comment sections under episodes, episode ratings, and user reviews.

## 🛑 Haven't Started
- **Notifications**: Alerts for when a new episode of a favorited anime drops.
- **Admin Dashboard**: A hidden route for managing site analytics or featured shows.
