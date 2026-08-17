import { action, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const ANILIST_URL = "https://graphql.anilist.co";

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

export const searchAnime = action({
  args: { query: v.string() },
  handler: async (_ctx, args) => {
    const response = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: SEARCH_QUERY,
        variables: { search: args.query, page: 1, perPage: 20 },
      }),
    });

    if (!response.ok) throw new Error("Failed to fetch from AniList");
    const data = await response.json();
    return data.data.Page.media;
  },
});

export const getHomeFeed = action({
  args: {},
  handler: async (ctx) => {
    const response = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: HOME_FEED_QUERY }),
    });

    if (!response.ok) throw new Error("Failed to fetch home feed from AniList");
    const data = await response.json();

    const trending = data.data.trending.media || [];
    const popular = data.data.popular.media || [];
    const topRated = data.data.topRated.media || [];

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
      });
    }

    return {
      trending,
      popular,
      topRated,
    };
  },
});

export const getTrending = action({
  args: {},
  handler: async (_ctx) => {
    const response = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: HOME_FEED_QUERY }),
    });

    if (!response.ok) throw new Error("Failed to fetch trending from AniList");
    const data = await response.json();
    return data.data.trending.media;
  },
});

export const getAnimeDetails = action({
  args: { id: v.number() },
  handler: async (ctx, args) => {
    const response = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: INFO_QUERY,
        variables: { id: args.id },
      }),
    });

    if (!response.ok) throw new Error(`Failed to fetch info for anime ${args.id}`);
    const data = await response.json();
    const media = data.data.Media;

    if (media) {
      const derivedEpisodes =
        media.episodes ||
        (media.nextAiringEpisode?.episode ? media.nextAiringEpisode.episode - 1 : (media.status === "RELEASING" ? 1100 : 24));

      const cleanedDesc = cleanDescription(media.description);
      const studioName = media.studios?.nodes?.[0]?.name || "Unknown Studio";

      // Cache to Convex DB
      await ctx.runMutation(internal.anilist.cacheAnime, {
        anilistId: media.id,
        title: media.title,
        description: cleanedDesc,
        posterUrl: media.coverImage?.extraLarge || media.coverImage?.large || "",
        bannerUrl: media.bannerImage || "",
        genres: media.genres || [],
        episodes: derivedEpisodes,
        status: media.status,
      });

      return {
        ...media,
        episodes: derivedEpisodes,
        description: cleanedDesc,
        studio: studioName,
      };
    }

    return null;
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
