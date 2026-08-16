# V-Anime-Revived: Agent Rules & Instructions

This document outlines the strict guidelines and instructions that any AI agent or developer must follow when contributing to the **V-Anime-Revived** codebase.

## 1. Architectural Mandates

*   **BFF (Backend-For-Frontend) First:** The frontend application (React/Next.js Client Components) must **NEVER** communicate directly with the AniVault Scraper, AniList GraphQL API, or the Supabase database.
*   **The API Layer is the Gatekeeper:** All external requests must be routed through our Next.js API Routes (`/api/...`). The API layer is responsible for data aggregation, caching, authentication verification, and rate limiting.
*   **AniVault's Role:** AniVault is strictly our **stream-resolution service**. It is used to get episodes, scrape streaming links, and proxy videos/subtitles. Do **not** try to store user state, watch history, or profile data inside AniVault.
*   **Supabase's Role:** Supabase PostgreSQL handles strictly relational user data (favorites, watch progress, profiles). Do **not** store actual video files or complete AniList dumps in the database.

## 2. Streaming & Playback Rules

*   **Robust Server Fallback:** Streaming servers are volatile. When writing the stream resolution logic, **always** implement a scoring and fallback mechanism. If Server A fails to resolve a stream, the API must automatically attempt Server B before returning a failure response to the client.
*   **Agnostic Player Implementation:** Do not hardcode the player to assume HLS. The BFF will return a `mode` (`hls`, `mp4`, or `iframe`). The frontend must dynamically mount the correct player adapter based on this mode.
*   **Debounced Progress:** When writing the watch progress tracking, **never** ping the database continuously. Update local state and debounce the API call to `PUT /api/me/progress` to every 10-15 seconds.

## 3. Data & Caching Rules

*   **Respect Rate Limits:** AniList has a strict rate limit. Any code that touches AniList must include logic to check and store results in **Upstash Redis**.
*   **Cache Invalidation:** Ensure that stream links (HLS/MP4) are cached for no longer than 5 minutes, as temporary proxy links expire rapidly. Metadata (titles, posters) can be cached for 24+ hours.

## 4. Tech Stack & Styling Conventions

*   **Framework:** Use Next.js (App Router). Write Server Components by default unless interactivity is explicitly required (`"use client"`).
*   **Styling:** Use Tailwind CSS and `shadcn/ui`. Avoid arbitrary UI frameworks unless authorized. Prioritize functional, clean, dark-mode friendly UI.
*   **State:** Use `Zustand` for global client state (like the active video player state) and `TanStack Query` for fetching/caching data from our BFF.

## 5. Security

*   **Row Level Security (RLS):** When generating database migrations, ensure RLS is enabled for all user tables. A user should only be able to query or mutate rows where `user_id = auth.uid()`.
*   **Token Protection:** Never expose Supabase Service Role keys or Upstash Redis tokens to the frontend environment.

**Agent Note:** When generating code for this project, always refer back to these rules. If a requested feature violates the BFF architecture (e.g., fetching AniList directly from a React component), you must correct the approach and route it through the Next.js API.
