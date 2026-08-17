import { action, internalMutation } from "./_generated/server";
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
        episodes
        status
        genres
      }
    }
  }
`;

const TRENDING_QUERY = `
  query($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: TRENDING_DESC) {
        id
        title { romaji english native }
        coverImage { extraLarge large }
        episodes
        status
        genres
      }
    }
  }
`;

const INFO_QUERY = `
  query($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title { romaji english native }
      description
      coverImage { extraLarge large }
      bannerImage
      episodes
      status
      genres
    }
  }
`;

export const searchAnime = action({
  args: { query: v.string() },
  handler: async (ctx, args) => {
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

export const getTrending = action({
  args: {},
  handler: async (_ctx) => {
    const response = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: TRENDING_QUERY,
        variables: { page: 1, perPage: 12 },
      }),
    });
    
    if (!response.ok) throw new Error("Failed to fetch trending from AniList");
    const data = await response.json();
    return data.data.Page.media;
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
    
    if (!response.ok) throw new Error("Failed to fetch info from AniList");
    const data = await response.json();
    const media = data.data.Media;
    
    if (media) {
      // Fire and forget cache mutation
      await ctx.runMutation(internal.anilist.cacheAnime, {
        anilistId: media.id,
        title: media.title,
        description: media.description || "",
        posterUrl: media.coverImage?.extraLarge || media.coverImage?.large || "",
        bannerUrl: media.bannerImage || "",
        genres: media.genres || [],
        episodes: media.episodes,
        status: media.status,
      });
    }
    
    return media;
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
