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

## ⏳ Work In Progress (WIP)
- **Home Page**: Currently functional but needs polished UI components for Hero banners, trending anime carousels, and seasonal grids.
- **Search Functionality**: The search page (`/search`) exists but requires UI refinement and deep AniList query integration.
- **User Library**: Wiring up Convex mutations to allow users to add shows to their "Watchlist" or "Favorites".
- **Playback Tracking**: Saving the user's current timestamp and episode in Convex so they can resume watching later.
- **Responsive Design**: Ensuring the video player and navigation menus scale perfectly on mobile devices.
- **Loading States**: Adding skeleton loaders and Next.js error boundaries for smoother UX during network delays.

## 🛑 Haven't Started
- **User Profiles**: Custom avatars, bio, and tracking stats.
- **Social Features**: Comment sections under episodes, ratings, and user reviews.
- **AniList Syncing**: Allowing users to connect their AniList account via OAuth to sync their watchlist automatically.
- **Notifications**: Alerts for when a new episode of a favorited anime drops.
- **Admin Dashboard**: A hidden route for managing site analytics or featured shows.
- **SEO & Meta Tags**: OpenGraph tags, dynamic sitemaps, and indexing optimizations for search engines.
