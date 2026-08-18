import { action, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const KITSU_URL = "https://kitsu.io/api/edge";
const ANILIST_URL = "https://graphql.anilist.co";
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

// Helper to normalize Kitsu items to standard application schema
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
  const averageScore = rawRating > 0 ? Math.round(rawRating) : 84;

  let derivedFormat = (attr.subtype || "TV").toUpperCase();
  if (derivedFormat === "MOVIE") derivedFormat = "MOVIE";
  else if (derivedFormat === "SPECIAL") derivedFormat = "SPECIAL";
  else if (derivedFormat === "OVA") derivedFormat = "OVA";
  else derivedFormat = "TV";

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
    format: derivedFormat,
    seasonYear: attr.startDate ? parseInt(attr.startDate.split("-")[0], 10) : 2024,
    genres: ["Action", "Anime"],
    averageScore,
    studio: "Animation Studio",
  };
}

// Fetch Kitsu Search with full filters & elasticsearch fuzzy tolerance
async function fetchKitsuSearch(params: {
  query?: string;
  genre?: string;
  format?: string;
  seasonYear?: number;
  status?: string;
  sort?: string;
  page?: number;
  perPage?: number;
}) {
  try {
    const page = params.page || 1;
    const perPage = params.perPage || 18;
    const offset = (page - 1) * perPage;

    const queryParts: string[] = [
      `page[limit]=${perPage}`,
      `page[offset]=${offset}`,
    ];

    if (params.query && params.query.trim()) {
      queryParts.push(`filter[text]=${encodeURIComponent(params.query.trim())}`);
    }

    if (params.genre && params.genre !== "All") {
      queryParts.push(`filter[categories]=${encodeURIComponent(params.genre.toLowerCase())}`);
    }

    if (params.format && params.format !== "All") {
      queryParts.push(`filter[subtype]=${encodeURIComponent(params.format.toLowerCase())}`);
    }

    if (params.seasonYear) {
      queryParts.push(`filter[seasonYear]=${params.seasonYear}`);
    }

    if (params.status && params.status !== "All") {
      const statusVal = params.status === "RELEASING" ? "current" : "finished";
      queryParts.push(`filter[status]=${statusVal}`);
    }

    // Sort mapping
    if (params.sort === "SCORE_DESC") {
      queryParts.push(`sort=-averageRating`);
    } else if (params.sort === "START_DATE_DESC") {
      queryParts.push(`sort=-startDate`);
    } else if (params.sort === "TRENDING_DESC") {
      queryParts.push(`sort=-userCount`);
    } else if (!params.query) {
      queryParts.push(`sort=-userCount`);
    }

    const url = `${KITSU_URL}/anime?${queryParts.join("&")}`;
    const res = await fetch(url, {
      headers: { Accept: "application/vnd.api+json" },
    });

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
    console.warn("Kitsu search error:", err);
    return null;
  }
}

// Fetch Kitsu Trending Feed
async function fetchKitsuTrending(limit = 12) {
  try {
    const url = `${KITSU_URL}/trending/anime?limit=${limit}`;
    const res = await fetch(url, { headers: { Accept: "application/vnd.api+json" } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map(normalizeKitsuAnime);
  } catch (err) {
    console.warn("Kitsu trending fetch error:", err);
    return [];
  }
}

// Fetch Kitsu Popular Feed
async function fetchKitsuPopular(limit = 12) {
  try {
    const url = `${KITSU_URL}/anime?sort=-userCount&page[limit]=${limit}`;
    const res = await fetch(url, { headers: { Accept: "application/vnd.api+json" } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map(normalizeKitsuAnime);
  } catch (err) {
    console.warn("Kitsu popular fetch error:", err);
    return [];
  }
}

// Fetch Kitsu Top Rated Feed
async function fetchKitsuTopRated(limit = 12) {
  try {
    const url = `${KITSU_URL}/anime?sort=-averageRating&page[limit]=${limit}`;
    const res = await fetch(url, { headers: { Accept: "application/vnd.api+json" } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map(normalizeKitsuAnime);
  } catch (err) {
    console.warn("Kitsu top-rated fetch error:", err);
    return [];
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
  handler: async (_ctx, args): Promise<any> => {
    // 1. PRIMARY: Kitsu Search (Elasticsearch fuzzy, no 429 rate limits, matches typos & abbreviations)
    const kitsuResult = await fetchKitsuSearch({
      query: args.query,
      genre: args.genre,
      format: args.format,
      seasonYear: args.seasonYear,
      status: args.status,
      sort: args.sort,
      page: args.page || 1,
      perPage: args.perPage || 18,
    });

    if (kitsuResult && kitsuResult.media.length > 0) {
      return kitsuResult;
    }

    // 2. SECONDARY FALLBACK: AniList GraphQL
    try {
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
      if (args.sort) variables.sort = [args.sort];
      else variables.sort = args.query ? ["SEARCH_MATCH", "POPULARITY_DESC"] : ["POPULARITY_DESC"];

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

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
        const media = pageData?.media || [];
        if (media.length > 0) {
          return {
            media,
            pageInfo: pageData?.pageInfo || {
              total: media.length,
              perPage: 18,
              currentPage: 1,
              lastPage: 1,
              hasNextPage: false,
            },
          };
        }
      }
    } catch (e) {
      console.warn("AniList advanced search secondary fallback error:", e);
    }

    return {
      media: [],
      pageInfo: { total: 0, perPage: 18, currentPage: 1, lastPage: 1, hasNextPage: false },
    };
  },
});

export const searchAnime = action({
  args: { query: v.string() },
  handler: async (_ctx, args): Promise<any> => {
    // 1. PRIMARY: Kitsu Search
    const kitsuResult = await fetchKitsuSearch({
      query: args.query,
      page: 1,
      perPage: 20,
    });

    if (kitsuResult && kitsuResult.media.length > 0) {
      return kitsuResult.media;
    }

    // 2. SECONDARY: AniList
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
        const media = data.data?.Page?.media || [];
        if (media.length > 0) return media;
      }
    } catch (e) {
      console.warn("AniList search secondary fallback error:", e);
    }

    return [];
  },
});

export const getHomeFeed = action({
  args: {},
  handler: async (ctx): Promise<any> => {
    // 1. PRIMARY: Fetch from Kitsu (No rate limits on Vercel, ultra-fast)
    try {
      const [trending, popular, topRated] = await Promise.all([
        fetchKitsuTrending(12),
        fetchKitsuPopular(12),
        fetchKitsuTopRated(12),
      ]);

      if (trending.length > 0) {
        // Cache trending in database in background
        for (const anime of [...trending, ...popular].slice(0, 15)) {
          await ctx.runMutation(internal.anilist.cacheAnime, {
            anilistId: anime.id,
            title: anime.title,
            description: cleanDescription(anime.description),
            posterUrl: anime.coverImage?.extraLarge || anime.coverImage?.large || "",
            bannerUrl: anime.bannerImage || "",
            genres: anime.genres || [],
            episodes: anime.episodes,
            status: anime.status,
            averageScore: anime.averageScore,
            year: anime.seasonYear,
            studio: anime.studio || "Animation Studio",
            format: anime.format || "TV",
          });
        }

        return {
          trending,
          popular: popular.length > 0 ? popular : trending,
          topRated: topRated.length > 0 ? topRated : trending,
        };
      }
    } catch (kitsuErr) {
      console.warn("Kitsu home feed primary fetch failed, trying AniList...", kitsuErr);
    }

    // 2. SECONDARY: AniList Home Feed
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
        const trending = data.data?.trending?.media || [];
        const popular = data.data?.popular?.media || [];
        const topRated = data.data?.topRated?.media || [];

        if (trending.length > 0) {
          return { trending, popular, topRated };
        }
      }
    } catch (e) {
      console.warn("AniList home feed fallback throttled:", e);
    }

    // 3. LAST RESORT: Convex DB cached records
    const dbCached: any[] = await ctx.runQuery(internal.anilist.getRecentCachedAnime, { limit: 12 });
    const formattedDb = (dbCached || []).map((cached: any) => ({
      id: cached.anilistId,
      title: cached.title,
      description: cached.description || "",
      coverImage: { extraLarge: cached.posterUrl, large: cached.posterUrl },
      bannerImage: cached.bannerUrl,
      genres: cached.genres || ["Action", "Anime"],
      status: cached.status || "FINISHED",
      episodes: cached.episodes || 24,
      averageScore: cached.averageScore || 85,
      seasonYear: cached.year || 2024,
      format: cached.format || "TV",
    }));

    return {
      trending: formattedDb,
      popular: formattedDb,
      topRated: formattedDb,
    };
  },
});

export const getTrending = action({
  args: {},
  handler: async (_ctx): Promise<any> => {
    const kitsuTrending = await fetchKitsuTrending(12);
    if (kitsuTrending.length > 0) return kitsuTrending;

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
        const media = data.data?.trending?.media || [];
        if (media.length > 0) return media;
      }
    } catch (e) {
      console.warn("AniList getTrending secondary fallback error:", e);
    }

    return [];
  },
});

export const getAnimeDetails = action({
  args: { id: v.number() },
  handler: async (ctx, args): Promise<any> => {
    // 1. Cache-First Hit: check Convex Database cache first (0ms latency, zero rate limits)
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

    // 2. PRIMARY: Kitsu Anime Details by ID
    try {
      const kitsuRes = await fetch(`${KITSU_URL}/anime/${args.id}`, {
        headers: { Accept: "application/vnd.api+json" },
      });

      if (kitsuRes.ok) {
        const kitsuData = await kitsuRes.json();
        if (kitsuData.data) {
          const normalized = normalizeKitsuAnime(kitsuData.data);

          // Cache to Convex DB
          await ctx.runMutation(internal.anilist.cacheAnime, {
            anilistId: args.id,
            title: normalized.title,
            description: normalized.description,
            posterUrl: normalized.coverImage.extraLarge,
            bannerUrl: normalized.bannerImage,
            genres: normalized.genres,
            episodes: normalized.episodes,
            status: normalized.status,
            averageScore: normalized.averageScore,
            year: normalized.seasonYear,
            studio: normalized.studio,
            format: normalized.format,
          });

          return {
            ...normalized,
            relations: [],
          };
        }
      }
    } catch (kitsuErr) {
      console.warn(`Kitsu details fetch for ${args.id} failed, trying AniList...`, kitsuErr);
    }

    // 3. SECONDARY: AniList GraphQL
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(ANILIST_URL, {
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
      }
    } catch (aniErr) {
      console.warn(`AniList details secondary fallback for ${args.id} failed:`, aniErr);
    }

    // 4. TERTIARY: Jikan v4 (MyAnimeList)
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
      console.warn(`Jikan fallback for ${args.id} failed:`, jikanErr);
    }

    // 5. Database fallback
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

export const getRecentCachedAnime = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("animeCache")
      .order("desc")
      .take(args.limit);
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
