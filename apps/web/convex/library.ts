import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Helper to get authenticated user ID or throw an error.
 */
async function getAuthenticatedUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated: User must be signed in.");
  }
  return identity.subject;
}

/**
 * Check if an anime is favorited or watchlisted by the current user.
 */
export const getAnimeUserStatus = query({
  args: { anilistId: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { isFavorite: false, isWatchlisted: false };
    }

    const userId = identity.subject;

    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_anime", (q) =>
        q.eq("userId", userId).eq("anilistId", args.anilistId)
      )
      .first();

    const watchlist = await ctx.db
      .query("watchlist")
      .withIndex("by_user_and_anime", (q) =>
        q.eq("userId", userId).eq("anilistId", args.anilistId)
      )
      .first();

    return {
      isFavorite: !!favorite,
      isWatchlisted: !!watchlist,
    };
  },
});

/**
 * Toggle favorite status for an anime.
 */
export const toggleFavorite = mutation({
  args: { anilistId: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_anime", (q) =>
        q.eq("userId", userId).eq("anilistId", args.anilistId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { isFavorite: false };
    } else {
      await ctx.db.insert("favorites", {
        userId,
        anilistId: args.anilistId,
        createdAt: Date.now(),
      });
      return { isFavorite: true };
    }
  },
});

/**
 * Toggle watchlist status for an anime.
 */
export const toggleWatchlist = mutation({
  args: { anilistId: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const existing = await ctx.db
      .query("watchlist")
      .withIndex("by_user_and_anime", (q) =>
        q.eq("userId", userId).eq("anilistId", args.anilistId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { isWatchlisted: false };
    } else {
      await ctx.db.insert("watchlist", {
        userId,
        anilistId: args.anilistId,
        createdAt: Date.now(),
      });
      return { isWatchlisted: true };
    }
  },
});

/**
 * Get the full user library (Favorites and Watchlist joined with cached metadata).
 */
export const getLibrary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { favorites: [], watchlist: [] };
    }

    const userId = identity.subject;

    // Fetch favorites
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_anime", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);

    // Fetch watchlist
    const watchlist = await ctx.db
      .query("watchlist")
      .withIndex("by_user_and_anime", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);

    // Hydrate favorites with animeCache metadata
    const hydratedFavorites = await Promise.all(
      favorites.map(async (fav) => {
        const anime = await ctx.db
          .query("animeCache")
          .withIndex("by_anilistId", (q) => q.eq("anilistId", fav.anilistId))
          .first();

        return {
          id: fav.anilistId,
          favoriteId: fav._id,
          createdAt: fav.createdAt,
          title: anime?.title?.english || anime?.title?.romaji || `Anime #${fav.anilistId}`,
          posterUrl: anime?.posterUrl || "",
          episodes: anime?.episodes,
          status: anime?.status,
          genres: anime?.genres || [],
        };
      })
    );

    // Hydrate watchlist with animeCache metadata
    const hydratedWatchlist = await Promise.all(
      watchlist.map(async (item) => {
        const anime = await ctx.db
          .query("animeCache")
          .withIndex("by_anilistId", (q) => q.eq("anilistId", item.anilistId))
          .first();

        return {
          id: item.anilistId,
          watchlistId: item._id,
          createdAt: item.createdAt,
          title: anime?.title?.english || anime?.title?.romaji || `Anime #${item.anilistId}`,
          posterUrl: anime?.posterUrl || "",
          episodes: anime?.episodes,
          status: anime?.status,
          genres: anime?.genres || [],
        };
      })
    );

    return {
      favorites: hydratedFavorites,
      watchlist: hydratedWatchlist,
    };
  },
});
