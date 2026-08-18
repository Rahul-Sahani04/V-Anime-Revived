import { action, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const ANILIST_URL = "https://graphql.anilist.co";
const KITSU_URL = "https://kitsu.io/api/edge";
const JIKAN_URL = "https://api.jikan.moe/v4";

const ADVANCED_SEARCH_QUERY = `
  query(
    $search: String,
    $genre: String,
    $season: MediaSeason,
    $seasonYear: Int,
    $format: MediaFormat,
    $status: MediaStatus,
    $sort: [MediaSort],
    $page: Int,
    $perPage: Int
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        perPage
        currentPage
        lastPage
        hasNextPage
      }
      media(
        search: $search,
        genre: $genre,
        season: $season,
        seasonYear: $seasonYear,
        format: $format,
        status: $status,
        sort: $sort,
        type: ANIME
      ) {
        id
        title { romaji english native }
        description(asHtml: false)
        coverImage { extraLarge large }
        bannerImage
        episodes
        status
        format
        seasonYear
        genres
        averageScore
        nextAiringEpisode { episode }
      }
    }
  }
`;

const SEARCH_QUERY = `
  query($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
        id
        title { romaji english native }
        coverImage { extraLarge large }
        bannerImage
        episodes
        status
        genres
        averageScore
      }
    }
  }
`;

const HOME_FEED_QUERY = `
  query {
    trending: Page(page: 1, perPage: 12) {
      media(type: ANIME, sort: TRENDING_DESC) {
        id
        title { romaji english native }
        description
        coverImage { extraLarge large }
        bannerImage
        episodes
        status
        genres
        averageScore
        nextAiringEpisode { episode }
      }
    }
    popular: Page(page: 1, perPage: 12) {
      media(type: ANIME, sort: POPULARITY_DESC) {
        id
        title { romaji english native }
        description
        coverImage { extraLarge large }
        bannerImage
        episodes
        status
        genres
        averageScore
        nextAiringEpisode { episode }
      }
    }
    topRated: Page(page: 1, perPage: 12) {
      media(type: ANIME, sort: SCORE_DESC) {
        id
        title { romaji english native }
        description
        coverImage { extraLarge large }
        bannerImage
        episodes
        status
        genres
        averageScore
        nextAiringEpisode { episode }
      }
    }
  }
`;

const INFO_QUERY = `
  query($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title { romaji english native }
      description(asHtml: false)
      coverImage { extraLarge large }
      bannerImage
      episodes
      status
      genres
      averageScore
      season
      seasonYear
      studios(isMain: true) {
        nodes { name }
      }
      nextAiringEpisode {
        episode
        airingAt
        timeUntilAiring
      }
    }
  }
`;

// Helper to sanitize HTML tags if present in descriptions
function cleanDescription(desc?: string | null): string {
  if (!desc) return "No description available.";
  return desc.replace(/<[^>]*>?/gm, "").trim();
}

// Helper to normalize Kitsu items to standard schema
function normalizeKitsuAnime(item: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const attr = item.attributes || {};
  const numId = parseInt(item.id, 10) || 0;
  const titles = attr.titles || {};
  const english = titles.en || titles.en_us || attr.canonicalTitle || "Anime";
  const romaji = titles.en_jp || attr.canonicalTitle || english;
  const native = titles.ja_jp || "";

  const poster =
    attr.posterImage?.original ||
    attr.posterImage?.large ||
    attr.posterImage?.medium ||
    "";
  const banner =
    attr.coverImage?.original ||
    attr.coverImage?.large ||
    poster;

  const rawRating = parseFloat(attr.averageRating || "0");
  const averageScore = rawRating > 0 ? Math.round(rawRating) : 82;

  return {
    id: numId,
    title: {
      romaji,
      english,
      native,
    },
    description: cleanDescription(attr.synopsis || attr.description),
    coverImage: {
      extraLarge: poster,
      large: poster,
      medium: attr.posterImage?.medium || poster,
    },
    bannerImage: banner,
    episodes: attr.episodeCount || 24,
    status: attr.status === "current" ? "RELEASING" : "FINISHED",
    format: (attr.subtype || "TV").toUpperCase(),
    seasonYear: attr.startDate ? parseInt(attr.startDate.split("-")[0], 10) : 2024,
    genres: ["Action", "Anime"],
    averageScore,
    studio: "Animation Studio",
  };
}

// Fallback search using Kitsu API
async function fallbackKitsuSearch(query: string, page = 1, perPage = 18) {
  try {
    const offset = (page - 1) * perPage;
    const url = `${KITSU_URL}/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=${perPage}&page[offset]=${offset}`;
    const res = await fetch(url, { headers: { Accept: "application/vnd.api+json" } });
    if (!res.ok) return null;
    const data = await res.json();
    const media = (data.data || []).map(normalizeKitsuAnime);
    const total = data.meta?.count || media.length;
    return {
      media,
      pageInfo: {
        total,
        perPage,
        currentPage: page,
        lastPage: Math.ceil(total / perPage) || 1,
        hasNextPage: offset + perPage < total,
      },
    };
  } catch (err) {
    console.error("Kitsu fallback search error:", err);
    return null;
  }
}

// Fallback trending using Kitsu API
async function fallbackKitsuTrending() {
  try {
    const url = `${KITSU_URL}/trending/anime?limit=15`;
    const res = await fetch(url, { headers: { Accept: "application/vnd.api+json" } });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.data || []).map(normalizeKitsuAnime);
  } catch (err) {
    console.error("Kitsu trending fallback error:", err);
    return null;
  }
}

export const searchAnimeAdvanced = action({
  args: {
    query: v.optional(v.string()),
    genre: v.optional(v.string()),
    season: v.optional(v.string()),
    seasonYear: v.optional(v.number()),
    format: v.optional(v.string()),
    status: v.optional(v.string()),
    sort: v.optional(v.string()),
    page: v.optional(v.number()),
    perPage: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const variables: Record<string, unknown> = {
      page: args.page || 1,
      perPage: args.perPage || 18,
    };

    if (args.query && args.query.trim()) variables.search = args.query.trim();
    if (args.genre && args.genre !== "All") variables.genre = args.genre;
    if (args.season && args.season !== "All") variables.season = args.season;
    if (args.seasonYear) variables.seasonYear = args.seasonYear;
    if (args.format && args.format !== "All") variables.format = args.format;
    if (args.status && args.status !== "All") variables.status = args.status;

    // Sort mapping
    if (args.sort) {
      variables.sort = [args.sort];
    } else {
      variables.sort = args.query ? ["SEARCH_MATCH", "POPULARITY_DESC"] : ["POPULARITY_DESC"];
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(ANILIST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          query: ADVANCED_SEARCH_QUERY,
          variables,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const pageData = data.data?.Page;
        if (pageData) {
          return {
            media: pageData.media || [],
            pageInfo: pageData.pageInfo || {
              total: 0,
              perPage: 18,
              currentPage: 1,
              lastPage: 1,
              hasNextPage: false,
            },
          };
        }
      }
    } catch (e) {
      console.warn("AniList advanced search timed out or was rate limited, switching to Kitsu...", e);
    }

    // Seamless Fallback to Kitsu API Search
    if (args.query) {
      const fallback = await fallbackKitsuSearch(args.query, args.page || 1, args.perPage || 18);
      if (fallback) return fallback;
    }

    return {
      media: [],
      pageInfo: { total: 0, perPage: 18, currentPage: 1, lastPage: 1, hasNextPage: false },
    };
  },
});

export const searchAnime = action({
  args: { query: v.string() },
  handler: async (_ctx, args) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(ANILIST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          query: SEARCH_QUERY,
          variables: { search: args.query, page: 1, perPage: 20 },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.data?.Page?.media) {
          return data.data.Page.media;
        }
      }
    } catch (e) {
      console.warn("AniList search throttled, using Kitsu fallback...", e);
    }

    // Fallback to Kitsu
    const kitsuResults = await fallbackKitsuSearch(args.query, 1, 20);
    return kitsuResults?.media || [];
  },
});

export const getHomeFeed = action({
  args: {},
  handler: async (ctx) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(ANILIST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query: HOME_FEED_QUERY }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const trending = data.data?.trending?.media || [];
        const popular = data.data?.popular?.media || [];
        const topRated = data.data?.topRated?.media || [];

        // Cache trending in database in background
        for (const anime of [...trending, ...popular].slice(0, 15)) {
          await ctx.runMutation(internal.anilist.cacheAnime, {
            anilistId: anime.id,
            title: anime.title,
            description: cleanDescription(anime.description),
            posterUrl: anime.coverImage?.extraLarge || anime.coverImage?.large || "",
            bannerUrl: anime.bannerImage || "",
            genres: anime.genres || [],
            episodes: anime.episodes || (anime.nextAiringEpisode ? anime.nextAiringEpisode.episode - 1 : undefined),
            status: anime.status,
            averageScore: anime.averageScore,
            year: anime.seasonYear,
            studio: anime.studio || "Animation Studio",
            format: anime.format || "TV",
          });
        }

        return { trending, popular, topRated };
      }
    } catch (e) {
      console.warn("AniList home feed throttled, loading Kitsu trending fallback...", e);
    }

    // Fallback to Kitsu Trending
    const fallbackList = (await fallbackKitsuTrending()) || [];
    return {
      trending: fallbackList.slice(0, 12),
      popular: fallbackList.slice(0, 12),
      topRated: fallbackList.slice(0, 12),
    };
  },
});

export const getTrending = action({
  args: {},
  handler: async (_ctx) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(ANILIST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query: HOME_FEED_QUERY }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.data?.trending?.media) {
          return data.data.trending.media;
        }
      }
    } catch (e) {
      console.warn("AniList getTrending throttled, using Kitsu fallback...", e);
    }

    const fallbackList = await fallbackKitsuTrending();
    return fallbackList || [];
  },
});

export const getAnimeDetails = action({
  args: { id: v.number() },
  handler: async (ctx, args): Promise<any> => {
    // 1. Instant Cache-First Hit: check Convex Database cache first (0ms latency, zero AniList rate limits)
    const cached = await ctx.runQuery(internal.anilist.getInternalCachedAnime, {
      anilistId: args.id,
    });

    const isFresh = cached && Date.now() - cached.updatedAt < 1000 * 60 * 60 * 24; // 24 hours
    if (cached && (isFresh || cached.status === "FINISHED")) {
      return {
        id: cached.anilistId,
        title: cached.title,
        description: cached.description || "",
        coverImage: {
          extraLarge: cached.posterUrl,
          large: cached.posterUrl,
        },
        bannerImage: cached.bannerUrl,
        genres: cached.genres || [],
        status: cached.status || "FINISHED",
        episodes: cached.episodes || 24,
        averageScore: cached.averageScore || 85,
        seasonYear: cached.year || 2024,
        studio: cached.studio || "Animation Studio",
        format: cached.format || "TV",
        relations: [],
      };
    }

    // 2. Fetch from AniList with short timeout
    let response: Response | null = null;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        response = await fetch(ANILIST_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            query: INFO_QUERY,
            variables: { id: args.id },
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          break;
        }

        if (response.status === 429 || response.status >= 500) {
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 300));
            continue;
          }
        }
      } catch {
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          continue;
        }
      }
    }

    if (response && response.ok) {
      try {
        const data = await response.json();
        const media = data.data?.Media;

        if (media) {
          const derivedEpisodes =
            media.episodes ||
            (media.nextAiringEpisode?.episode
              ? media.nextAiringEpisode.episode - 1
              : media.status === "RELEASING"
                ? 1100
                : 24);

          const cleanedDesc = cleanDescription(media.description);
          const studioName = media.studios?.nodes?.[0]?.name || "Unknown Studio";

          // Cache to Convex DB in background
          await ctx.runMutation(internal.anilist.cacheAnime, {
            anilistId: media.id,
            title: media.title,
            description: cleanedDesc,
            posterUrl: media.coverImage?.extraLarge || media.coverImage?.large || "",
            bannerUrl: media.bannerImage || "",
            genres: media.genres || [],
            episodes: derivedEpisodes,
            status: media.status,
            averageScore: media.averageScore,
            year: media.seasonYear,
            studio: studioName,
            format: media.format,
          });

          return {
            ...media,
            episodes: derivedEpisodes,
            description: cleanedDesc,
            studio: studioName,
          };
        }
      } catch (e) {
        console.error(`Failed to parse AniList response for ${args.id}:`, e);
      }
    }

    // 3. Fallback: Try Jikan v4 by ID
    try {
      const jikanRes = await fetch(`${JIKAN_URL}/anime/${args.id}`);
      if (jikanRes.ok) {
        const jikanData = await jikanRes.json();
        const j = jikanData.data;
        if (j) {
          const title = {
            english: j.title_english || j.title || `Anime #${args.id}`,
            romaji: j.title || "",
            native: j.title_japanese || "",
          };
          const posterUrl = j.images?.webp?.large_image_url || j.images?.jpg?.large_image_url || "";
          const genres = (j.genres || []).map((g: any) => g.name); // eslint-disable-line @typescript-eslint/no-explicit-any
          const studio = j.studios?.[0]?.name || "Animation Studio";

          await ctx.runMutation(internal.anilist.cacheAnime, {
            anilistId: args.id,
            title,
            description: cleanDescription(j.synopsis),
            posterUrl,
            bannerUrl: posterUrl,
            genres: genres.length > 0 ? genres : ["Action", "Anime"],
            episodes: j.episodes || (j.airing ? 1100 : 24),
            status: j.airing ? "RELEASING" : "FINISHED",
            averageScore: j.score ? Math.round(j.score * 10) : 85,
            year: j.year || (j.aired?.from ? parseInt(j.aired.from.split("-")[0], 10) : 2024),
            studio,
            format: (j.type || "TV").toUpperCase(),
          });

          return {
            id: args.id,
            title,
            description: cleanDescription(j.synopsis),
            coverImage: { extraLarge: posterUrl, large: posterUrl },
            bannerImage: posterUrl,
            genres: genres.length > 0 ? genres : ["Action", "Anime"],
            status: j.airing ? "RELEASING" : "FINISHED",
            episodes: j.episodes || (j.airing ? 1100 : 24),
            averageScore: j.score ? Math.round(j.score * 10) : 85,
            seasonYear: j.year || 2024,
            studio,
            format: (j.type || "TV").toUpperCase(),
            relations: [],
          };
        }
      }
    } catch (jikanErr) {
      console.warn(`Jikan fallback fetch for ${args.id} failed:`, jikanErr);
    }

    // 4. Fallback to cached database record if any exists
    if (cached) {
      return {
        id: cached.anilistId,
        title: cached.title,
        description: cached.description || "",
        coverImage: {
          extraLarge: cached.posterUrl,
          large: cached.posterUrl,
        },
        bannerImage: cached.bannerUrl,
        genres: cached.genres || [],
        status: cached.status || "FINISHED",
        episodes: cached.episodes || 24,
        averageScore: cached.averageScore || 85,
        seasonYear: cached.year || 2024,
        studio: cached.studio || "Unknown Studio",
        format: cached.format || "TV",
        relations: [],
      };
    }

    return null;
  },
});

export const getInternalCachedAnime = internalQuery({
  args: { anilistId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("animeCache")
      .withIndex("by_anilistId", (q) => q.eq("anilistId", args.anilistId))
      .first();
  },
});

export const getCachedAnime = query({
  args: { anilistId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("animeCache")
      .withIndex("by_anilistId", (q) => q.eq("anilistId", args.anilistId))
      .first();
  },
});

// Internal mutation to save to our Convex database cache
export const cacheAnime = internalMutation({
  args: {
    anilistId: v.number(),
    title: v.object({
      english: v.optional(v.string()),
      romaji: v.optional(v.string()),
      native: v.optional(v.string()),
    }),
    description: v.optional(v.string()),
    posterUrl: v.string(),
    bannerUrl: v.optional(v.string()),
    genres: v.array(v.string()),
    episodes: v.optional(v.number()),
    status: v.optional(v.string()),
    averageScore: v.optional(v.number()),
    year: v.optional(v.number()),
    studio: v.optional(v.string()),
    format: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("animeCache")
      .withIndex("by_anilistId", (q) => q.eq("anilistId", args.anilistId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("animeCache", { ...args, updatedAt: Date.now() });
    }
  },
});
