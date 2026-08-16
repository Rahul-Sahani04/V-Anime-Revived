# V-Anime-Revived PRD

## 1. Product Overview

**V-Anime-Revived** is a modern anime streaming web app built around the **AniVault Scraper API**, with a completely custom frontend and a persistent user layer for watch history, favourites, watchlists, profiles, and playback progress.

The core idea is:

```text
AniList
   ↓
AniVault Scraper API
   ↓
V-Anime-Revived API/BFF
   ↓
Next.js Frontend
   ↓
User account + library + playback state
   ↓
Supabase PostgreSQL
```

The existing scraper already provides the important streaming primitives:

`search → info → episodes → servers → watch`

and supports Senshi, AnimeHeaven, Anikoto, and Miruro, with HLS/MP4 proxying and subtitle handling.

The application should **not** make the scraper itself responsible for user accounts or application data. Treat it as the **stream-resolution service** and build the V-Anime application layer around it.

---

# 2. Goals

### Primary goals

V-Anime-Revived should provide:

* Anime discovery and search
* Anime details
* Episode browsing
* Sub/Dub selection
* Multiple streaming servers
* HLS playback
* MP4 playback
* Subtitle support
* Automatic episode progression
* Continue Watching
* Watch history
* Persistent playback position
* Favourites
* Watchlist
* User profiles
* Recently watched
* Anime status tracking
* Personal library
* Responsive desktop/mobile UI
* PWA support
* Fast navigation with aggressive caching

### Secondary goals

* Continue watching from another device
* Remember preferred server
* Remember preferred language
* Mark episodes watched
* Track completed anime
* Anime recommendations
* Recently added/popular sections
* Optional AniList account integration later

---

# 3. Non-Goals for V1

Avoid turning this into a gigantic platform immediately.

Do **not** build initially:

* Comments
* Forums
* Social following
* User-to-user messaging
* Creator uploads
* Self-hosted video storage
* Paid subscriptions
* Ads system
* Anime downloading
* Complex recommendation ML
* Native mobile applications

Those can become V2/V3.

---

# 4. Recommended Architecture

I would use:

### Frontend

**Next.js + TypeScript**

```text
Next.js
React
Tailwind CSS
shadcn/ui
TanStack Query
Zustand
HLS.js
Lucide
```

Deploy on:

**Vercel**

---

### Application backend

Use Next.js server-side routes/server actions as the application BFF.

```text
Browser
   ↓
Next.js
   ├── Auth
   ├── User data
   ├── Favorites
   ├── Watch history
   ├── Progress
   └── Anime API proxy
          ↓
      AniVault API
```

This is preferable to having the browser directly call every external service.

It also lets you later replace AniVault without rewriting the frontend.

---

### Database + Authentication

## Supabase

I'd choose **Supabase over Convex for V-Anime-Revived**.

The free tier currently provides:

* PostgreSQL
* Auth
* 50,000 MAU
* 500 MB database
* 1 GB storage
* 5 GB egress
* Unlimited API requests

with two free projects, although inactive free projects can be paused. ([Supabase][1])

That's a very good fit because this project is fundamentally relational:

```text
users
    ↓
favorites
    ↓
anime

users
    ↓
watch_progress
    ↓
episodes/anime
```

Postgres makes queries such as:

```sql
Get all unfinished anime for user
Get favourite anime
Get last watched episode
Get progress for an anime
Get watch history ordered by last watched
```

straightforward.

Convex is also viable and has a generous free tier, but its main advantage is reactive application data rather than the relational/query-heavy structure of this particular app. ([Convex][2])

---

# 5. Service Responsibilities

### AniList

Responsible for metadata:

```text
Anime title
Description
Poster
Banner
Genres
Studios
Year
Season
Episodes
Relations
Characters
```

The existing scraper already uses AniList to resolve IDs and metadata.

AniList exposes GraphQL at:

```text
https://graphql.anilist.co
```

and currently documents a normal limit of 90 requests/minute, although temporary degraded states can lower this. ([Anilist Docs][3])

Therefore **never call AniList unnecessarily from the browser**.

Cache metadata aggressively.

---

### AniVault Scraper

Responsible only for:

```text
Anime → source IDs
Anime → episodes
Episode → servers
Server → playable stream
Stream → proxy
Subtitle → proxy
```

Existing endpoints include:

```text
GET /api/search?q=
GET /api/info
GET /api/episodes
GET /api/servers
GET /api/watch/:source/:id/:ep/:type

GET /api/proxy/hls
GET /api/proxy/subtitle
GET /api/proxy/video

GET /api/health
```

---

### V-Anime backend

Responsible for:

```text
Authentication
Users
Favorites
Watchlist
History
Watch progress
Preferences
Library
API caching
Rate limiting
Analytics
```

---

# 6. High-Level Architecture

```text
                         ┌─────────────────┐
                         │     AniList     │
                         │   GraphQL API   │
                         └────────┬────────┘
                                  │
                                  ▼
┌─────────────┐         ┌────────────────────┐
│             │         │                    │
│  Next.js    │◄───────►│ V-Anime BFF/API    │
│  Frontend   │         │                    │
│             │         └───────┬────────────┘
└──────┬──────┘                 │
       │                        │
       │                        ▼
       │                ┌─────────────────┐
       │                │ AniVault        │
       │                │ Scraper API     │
       │                └────────┬────────┘
       │                         │
       │                         ▼
       │                ┌─────────────────┐
       │                │ Streaming       │
       │                │ Providers       │
       │                └─────────────────┘
       │
       ▼
┌─────────────────────┐
│      Supabase       │
│                     │
│ PostgreSQL          │
│ Auth                │
│ Storage              │
└─────────────────────┘
```

---

# 7. Database Design

## profiles

```text
profiles
---------
id              UUID PK
username        TEXT UNIQUE
display_name    TEXT
avatar_url      TEXT
bio             TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

Supabase Auth owns the actual authentication identity.

`profiles.id` references:

```text
auth.users.id
```

---

# 8. anime_cache

Don't store everything returned from AniList.

Store the subset your UI actually needs.

```text
anime_cache
-----------
anilist_id         INTEGER PK
mal_id             INTEGER
title              JSONB
description        TEXT
poster_url         TEXT
banner_url         TEXT
genres             JSONB
studios            JSONB
season             TEXT
season_year        INTEGER
format             TEXT
status             TEXT
episodes           INTEGER
duration           INTEGER
rating             NUMERIC
synonyms           JSONB
updated_at         TIMESTAMP
```

This lets V-Anime avoid repeatedly hitting AniList.

---

# 9. favorites

```text
favorites
---------
id                  UUID PK
user_id             UUID
anilist_id          INTEGER
created_at          TIMESTAMP
```

Unique constraint:

```text
(user_id, anilist_id)
```

---

# 10. watchlist

```text
watchlist
---------
id                  UUID PK
user_id             UUID
anilist_id          INTEGER
created_at          TIMESTAMP
priority            INTEGER
```

Unique:

```text
(user_id, anilist_id)
```

---

# 11. watch_progress

This is one of the most important tables.

```text
watch_progress
--------------
id                  UUID PK
user_id             UUID
anilist_id          INTEGER
episode_number      INTEGER
duration            INTEGER
position            INTEGER
percentage          NUMERIC
completed           BOOLEAN
last_watched_at     TIMESTAMP
updated_at          TIMESTAMP
```

Unique:

```text
(user_id, anilist_id, episode_number)
```

Example:

```json
{
  "anilist_id": 1535,
  "episode_number": 12,
  "position": 742,
  "duration": 1420,
  "percentage": 52.25,
  "completed": false
}
```

---

# 12. watch_history

Keep this separate from progress.

```text
watch_history
-------------
id                  UUID PK
user_id             UUID
anilist_id          INTEGER
episode_number      INTEGER
source              TEXT
server              TEXT
watched_at          TIMESTAMP
```

This allows the system to answer:

```text
What did Rahul watch yesterday?
```

while `watch_progress` answers:

```text
Where did Rahul stop?
```

---

# 13. user_preferences

```text
user_preferences
----------------
user_id             UUID PK
preferred_language  TEXT
preferred_server    TEXT
autoplay            BOOLEAN
auto_next           BOOLEAN
volume              INTEGER
skip_intro          BOOLEAN
theme               TEXT
```

Example:

```json
{
  "preferred_language": "sub",
  "preferred_server": "animeheaven",
  "autoplay": true,
  "auto_next": true,
  "skip_intro": true
}
```

---

# 14. Core API

Don't expose the database directly to the browser for everything.

Create your own API layer.

### Search

```http
GET /api/anime/search?q=naruto
```

Internally:

```text
Next.js → AniVault → AniList
```

---

### Anime

```http
GET /api/anime/:id
```

Returns normalized application metadata.

---

### Episodes

```http
GET /api/anime/:id/episodes
```

Optional:

```text
?source=senshi
```

---

### Servers

```http
GET /api/anime/:id/episodes/:episode/servers
```

---

### Stream

```http
GET /api/anime/:id/episodes/:episode/watch
```

Example:

```text
GET
/api/anime/1535/episodes/12/watch?type=sub&server=senshi
```

---

### Favorites

```http
GET    /api/me/favorites
POST   /api/me/favorites
DELETE /api/me/favorites/:animeId
```

---

### Watchlist

```http
GET    /api/me/watchlist
POST   /api/me/watchlist
DELETE /api/me/watchlist/:animeId
```

---

### Progress

```http
GET /api/me/progress
GET /api/me/progress/:animeId

PUT /api/me/progress
```

Request:

```json
{
  "animeId": 1535,
  "episode": 12,
  "position": 742,
  "duration": 1420
}
```

---

### History

```http
GET /api/me/history
DELETE /api/me/history
```

---

# 15. Frontend Pages

## `/`

Home.

Sections:

```text
Continue Watching
Trending
Popular
Recently Added
Recommended
Latest Episodes
```

Hero section:

```text
Featured Anime
     ↓
Watch Now
View Details
```

---

## `/search`

Search page.

```text
Search bar
Filters
Results grid
Pagination
```

Filters:

```text
Genre
Year
Season
Format
Status
```

---

## `/anime/[id]`

Anime detail page.

```text
Banner
Poster
Title
Description
Genres
Status
Episodes
Add to Favorites
Add to Watchlist
Continue Watching
```

Episode list:

```text
Episode 1
Episode 2
Episode 3
...
```

---

## `/watch/[animeId]/[episode]`

Dedicated player.

Layout:

```text
┌──────────────────────────────────────┐
│                                      │
│              VIDEO                   │
│                                      │
└──────────────────────────────────────┘

Episode navigation

Servers
[Server 1] [Server 2] [Server 3]

Language
[SUB] [DUB]

Episodes

Previous     Auto Next     Next
```

---

# 16. Player Architecture

Use:

```text
HLS.js
```

for HLS.

Pseudo architecture:

```ts
type PlaybackSource = {
  mode: "hls" | "mp4" | "iframe";
  url: string;
  subtitles?: SubtitleTrack[];
};
```

Then:

```tsx
if (mode === "hls") {
  return <HLSPlayer />;
}

if (mode === "mp4") {
  return <VideoPlayer />;
}

return <IframePlayer />;
```

This is important because the scraper does **not** guarantee every provider produces the same playback mechanism.

Its own response model distinguishes HLS, MP4 and iframe-only playback.

---

# 17. Watch Progress

Do **not** update the database every second.

That would be terrible.

Instead:

```text
Video playback
      ↓
local state
      ↓
every 10-15 seconds
      ↓
debounced API request
      ↓
Supabase
```

Also save immediately on:

```text
pause
episode change
page unload
video ended
```

Example:

```ts
setInterval(() => {
  saveProgress();
}, 15000);
```

Then:

```text
Episode finished
      ↓
completed = true
      ↓
find next episode
      ↓
autoplay next
```

---

# 18. Continue Watching

Home page query:

```sql
SELECT *
FROM watch_progress
WHERE user_id = $1
  AND completed = false
ORDER BY last_watched_at DESC
LIMIT 20;
```

The card displays:

```text
One Piece

Episode 1142

52% watched

Continue →
```

---

# 19. Watch History

History page:

```text
Today
 ├ Naruto Episode 12
 ├ One Piece Episode 1141

Yesterday
 ├ Bleach Episode 34
 └ JJK Episode 10
```

---

# 20. Favorites

Anime detail:

```text
♡ Add to Favorites
```

After click:

```text
♥ Favorited
```

Library:

```text
My Favorites
```

Grid layout similar to:

```text
Poster
Title
Current episode
Status
```

---

# 21. Watchlist

Separate concept from favourites.

### Favorite

"I really like this."

### Watchlist

"I intend to watch this."

This allows:

```text
Favorites
Watchlist
Continue Watching
Completed
```

as separate library categories.

---

# 22. User Profile

Profile:

```text
Avatar
Username
Bio

Watching       14
Completed      32
Favorites      28
Watchlist      41

Recently Watched
```

Optional stats:

```text
Episodes watched
Hours watched
Anime completed
Current streak
```

Don't overdo gamification initially.

---

# 23. Authentication

Use Supabase Auth.

Support:

```text
Email/password
Google
GitHub
```

Potentially later:

```text
Discord
AniList
```

Supabase currently supports social OAuth providers on its free plan. ([Supabase][1])

---

# 24. AniList Integration

Eventually add:

```text
"Connect AniList"
```

Then support:

```text
Watching
Completed
Paused
Dropped
Planning
```

The AniList API supports authenticated user/list operations. ([Anilist Docs][4])

But I would **not make AniList authentication part of V1**.

First build your own library.

---

# 25. Caching Strategy

The existing scraper already has:

```text
mapping: 24h
episodes: 1h
stream: 5min
```

using in-memory `node-cache`.

That's useful but insufficient for a larger deployment because cache disappears when the server restarts.

Use:

```text
AniVault
   ↓
Redis / Upstash
```

for shared caching.

Recommended cache keys:

```text
anime:search:naruto

anime:info:1535

anime:episodes:1535:senshi

anime:servers:1535:12:senshi:sub

anime:stream:1535:12:senshi:sub
```

Do **not** persist actual video streams.

Cache metadata and short-lived stream resolution data only.

---

# 26. API Failure Strategy

Streaming providers will fail.

The UI should never display:

```text
500 Internal Server Error
```

to users.

Instead:

```text
Server failed

Trying another server...
```

Flow:

```text
Server A
 ↓
failure
 ↓
Server B
 ↓
failure
 ↓
Server C
 ↓
success
```

This aligns nicely with the scraper's existing fallback behaviour, where it tries candidate servers until one resolves successfully.

Frontend should additionally expose:

```text
Current server: AnimeHeaven

Other servers:
[Server 2]
[Server 3]
```

---

# 27. Anime Data Normalization

Create a frontend-owned model rather than coupling components to AniList's response.

```ts
export interface Anime {
  id: number;
  title: string;
  description?: string;

  poster: string;
  banner?: string;

  genres: string[];

  format?: string;
  status?: string;

  year?: number;
  season?: string;

  episodes?: number;

  isFavorite?: boolean;
  isWatchlisted?: boolean;

  progress?: {
    episode: number;
    position: number;
    duration: number;
    percentage: number;
  };
}
```

The application should never need to know whether the backend source calls something:

```text
siteId
malId
anilistId
```

---

# 28. Suggested Repository Structure

I would build it as a monorepo.

```text
v-anime-revived/
│
├── apps/
│   │
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── providers/
│   │   └── styles/
│   │
│   └── api/
│       ├── routes/
│       ├── services/
│       ├── providers/
│       ├── cache/
│       └── lib/
│
├── packages/
│   │
│   ├── types/
│   ├── api-client/
│   ├── ui/
│   └── config/
│
├── supabase/
│   ├── migrations/
│   ├── seed/
│   └── functions/
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── database.md
│
├── .env.example
├── package.json
├── turbo.json
└── README.md
```

---

# 29. Tech Stack

## Frontend

```text
Next.js
TypeScript
React
Tailwind
shadcn/ui
TanStack Query
Zustand
HLS.js
```

## Backend

```text
Next.js API routes / route handlers
TypeScript
AniVault API
AniList GraphQL
```

## Data

```text
Supabase PostgreSQL
Supabase Auth
Upstash Redis
```

## Deployment

```text
Vercel       → frontend/API
Railway      → AniVault scraper
Supabase     → DB/Auth
Upstash      → Redis
```

---

# 30. Environment Variables

```env
NEXT_PUBLIC_APP_URL=

ANIVAULT_API_URL=

ANILIST_API_URL=https://graphql.anilist.co

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Never expose:

```env
SUPABASE_SERVICE_ROLE_KEY
UPSTASH_REDIS_REST_TOKEN
```

to the browser.

---

# 31. V1 Feature Milestones

## Phase 1: Foundation

```text
[ ] Next.js project
[ ] Tailwind/shadcn
[ ] Supabase
[ ] Auth
[ ] Database migrations
[ ] Environment configuration
[ ] API client
```

---

## Phase 2: Anime discovery

```text
[ ] Homepage
[ ] Search
[ ] Anime cards
[ ] Anime details
[ ] Anime metadata
[ ] Episode list
```

---

## Phase 3: Streaming

```text
[ ] Player
[ ] HLS
[ ] MP4
[ ] iframe fallback
[ ] Subtitles
[ ] Servers
[ ] Sub/Dub
[ ] Next/previous episode
[ ] Auto-next
```

---

## Phase 4: User library

```text
[ ] Favorites
[ ] Watchlist
[ ] Watch history
[ ] Watch progress
[ ] Continue Watching
[ ] Completed
```

---

## Phase 5: UX

```text
[ ] Loading skeletons
[ ] Error states
[ ] Mobile player
[ ] Keyboard controls
[ ] Picture-in-picture
[ ] PWA
[ ] Dark mode
```

---

# 32. V2 Features

After V1 works:

```text
Anime recommendations
AniList sync
Custom collections
Advanced profile
Statistics
Import/export library
Multiple profiles
Notifications
Episode release tracking
Season pages
Genre pages
Trending pages
```

---

# 33. V3 Features

Potentially:

```text
Social profiles
Follow users
Shared lists
Comments
Ratings
Reviews
Watch parties
Discord integration
```

---

# 34. Important Backend Improvements to AniVault

I would **fork/extend the scraper rather than blindly copy it**.

The existing service is already useful, but V-Anime needs a cleaner contract around it.

### Add structured response types

Currently several routes return broad `any` structures.

Introduce:

```ts
interface AnimeEpisode {}

interface AnimeServer {}

interface StreamResponse {}

interface SubtitleTrack {}
```

---

### Add `/api/sources`

```http
GET /api/sources
```

Response:

```json
{
  "sources": [
    {
      "id": "senshi",
      "name": "Senshi",
      "status": "online"
    },
    {
      "id": "animeheaven",
      "name": "AnimeHeaven",
      "status": "online"
    }
  ]
}
```

---

### Improve `/health`

Return provider health individually:

```json
{
  "status": "ok",
  "sources": {
    "senshi": "online",
    "animeheaven": "online",
    "anikoto": "online",
    "miruro": "offline"
  }
}
```

---

### Add request IDs

```text
X-Request-ID
```

This will make debugging streaming failures significantly easier.

---

### Add source latency

For example:

```json
{
  "source": "senshi",
  "latency": 742
}
```

Later the frontend could automatically prefer healthier servers.

---

# 35. Intelligent Server Selection

Instead of:

```text
always use Senshi
```

build a scoring system.

```text
server score =
  availability
  + recent success rate
  + resolution type
  + user preference
  + latency
```

Example:

```text
AnimeHeaven  92
Anikoto      87
Senshi       81
```

Then:

```text
preferred server
       ↓
try preferred
       ↓
failure
       ↓
highest-scoring available server
```

This makes the experience feel significantly more polished.

---

# 36. Security

### API

Use:

```text
Rate limiting
CORS
Request validation
Input sanitization
Timeouts
```

The existing API already uses Express rate limiting and CORS.

### User data

Supabase Row Level Security:

```text
Users can read/write ONLY their own:

favorites
watchlist
progress
history
preferences
```

Never trust:

```text
user_id
```

sent by the client.

Take it from the authenticated Supabase session.

---

# 37. Performance

Important targets:

```text
Homepage TTI     < 2.5s
Search response  < 1s
Anime page       < 1.5s
Player startup   < 3s
```

Use:

```text
Next Image
React Server Components
Streaming SSR
TanStack Query
Redis
HTTP caching
Skeleton loading
Prefetching
```

Prefetch:

```text
Anime details
Episode list
Next episode metadata
```

But **don't automatically resolve every stream**.

Stream resolution can be relatively expensive.

---

# 38. UX Details That Will Make It Feel Like a Real Product

### Anime cards

Show:

```text
Poster
Title
Episode count
Status
Progress
```

Example:

```text
┌──────────────┐
│              │
│    POSTER    │
│              │
├──────────────┤
│ One Piece    │
│ EP 1142      │
│ ███████░░    │
└──────────────┘
```

### Continue card

```text
Continue Watching

One Piece
Episode 1142

52% ███████████░░░

Continue →
```

### Player

The player should feel like a real streaming product rather than an embedded scraper.

Controls:

```text
Play
Volume
Timeline
Quality
Subtitles
Server
Language
Settings
Theater
Fullscreen
PiP
Skip intro
Auto-next
```

---

# 39. Recommended V1 User Flow

```text
Open V-Anime-Revived
        ↓
Home
        ↓
Search Naruto
        ↓
Anime page
        ↓
Add to watchlist
        ↓
Episode 1
        ↓
Choose SUB
        ↓
Choose server
        ↓
Play
        ↓
Watch 12 minutes
        ↓
Progress automatically saved
        ↓
Close browser
        ↓
Return later
        ↓
Continue Watching
        ↓
Resume at exact position
        ↓
Episode ends
        ↓
Episode 2 automatically starts
```

That is the core product loop.

---

# 40. Critical Design Decision

Do **not** build the system like:

```text
Frontend
   ↓
AniVault
   ↓
Database
```

Instead:

```text
Frontend
   ↓
V-Anime API
   ├── Supabase
   ├── Redis
   ├── AniList
   └── AniVault
```

That gives you an abstraction layer.

Later you can completely replace:

```text
AniVault
```

with another scraper/provider without rebuilding:

```text
player
favorites
watchlist
history
profiles
database
frontend
```

That is the biggest architectural win here.

---

# 41. Final Stack

My recommendation:

```text
┌──────────────────────────────┐
│        V-Anime-Revived       │
├──────────────────────────────┤
│ Next.js                      │
│ TypeScript                   │
│ Tailwind + shadcn            │
│ TanStack Query               │
│ Zustand                      │
│ HLS.js                       │
├──────────────────────────────┤
│ V-Anime API / BFF            │
│ AniList GraphQL              │
│ AniVault Scraper             │
├──────────────────────────────┤
│ Supabase                     │
│ PostgreSQL                   │
│ Supabase Auth                │
├──────────────────────────────┤
│ Upstash Redis                │
├──────────────────────────────┤
│ Vercel + Railway             │
└──────────────────────────────┘
```

The key principle is **AniVault handles streaming, Supabase handles users, and V-Anime owns the product experience**.

The current scraper is a solid starting point because its core stream pipeline is already established, including source selection, server fallback, HLS/MP4 handling, subtitle proxying, and caching.

One thing I would explicitly keep out of the application database is actual video data. Store **metadata, IDs, user state, and playback position**, while resolving playable streams dynamically through AniVault.

[1]: https://supabase.com/pricing?utm_source=chatgpt.com "Pricing & Fees | Supabase"
[2]: https://www.convex.dev/pricing?utm_source=chatgpt.com "Choose Your Plan"
[3]: https://docs.anilist.co/guide/rate-limiting?utm_source=chatgpt.com "Rate Limiting | AniList API Docs"
[4]: https://docs.anilist.co/guide/graphql/mutations?utm_source=chatgpt.com "Mutations | AniList API Docs"
