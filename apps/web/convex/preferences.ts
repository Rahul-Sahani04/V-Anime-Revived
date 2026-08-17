import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Helper to get authenticated user ID or null.
 */
async function getUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  return identity ? identity.subject : null;
}

const DEFAULT_PREFERENCES = {
  preferredLanguage: "sub",
  preferredServer: "senshi",
  autoplay: true,
  autoNext: true,
};

/**
 * Get user preferences. Falls back to default options if unauthenticated or unset.
 */
export const getUserPreferences = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return DEFAULT_PREFERENCES;

    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!prefs) return DEFAULT_PREFERENCES;

    return {
      preferredLanguage: prefs.preferredLanguage,
      preferredServer: prefs.preferredServer,
      autoplay: prefs.autoplay,
      autoNext: prefs.autoNext,
    };
  },
});

/**
 * Update user preferences in Convex.
 */
export const updateUserPreferences = mutation({
  args: {
    preferredLanguage: v.optional(v.string()),
    preferredServer: v.optional(v.string()),
    autoplay: v.optional(v.boolean()),
    autoNext: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated: User must be signed in to save preferences.");
    }

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...(args.preferredLanguage !== undefined && { preferredLanguage: args.preferredLanguage }),
        ...(args.preferredServer !== undefined && { preferredServer: args.preferredServer }),
        ...(args.autoplay !== undefined && { autoplay: args.autoplay }),
        ...(args.autoNext !== undefined && { autoNext: args.autoNext }),
      });
    } else {
      await ctx.db.insert("userPreferences", {
        userId,
        preferredLanguage: args.preferredLanguage || DEFAULT_PREFERENCES.preferredLanguage,
        preferredServer: args.preferredServer || DEFAULT_PREFERENCES.preferredServer,
        autoplay: args.autoplay !== undefined ? args.autoplay : DEFAULT_PREFERENCES.autoplay,
        autoNext: args.autoNext !== undefined ? args.autoNext : DEFAULT_PREFERENCES.autoNext,
      });
    }

    return { success: true };
  },
});

/**
 * Calculate user streaming lifetime stats and milestone badges.
 */
export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      return {
        totalFavorites: 0,
        totalWatchlist: 0,
        totalWatchedEpisodes: 0,
        totalHoursWatched: 0,
        rank: "Anime Novice 🌱",
      };
    }

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_anime", (q) => q.eq("userId", userId))
      .collect();

    const watchlist = await ctx.db
      .query("watchlist")
      .withIndex("by_user_and_anime", (q) => q.eq("userId", userId))
      .collect();

    const history = await ctx.db
      .query("watchHistory")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const totalWatchedEpisodes = history.length;
    const totalHoursWatched = Math.round((totalWatchedEpisodes * 24) / 60 * 10) / 10;

    let rank = "Anime Novice 🌱";
    if (totalWatchedEpisodes >= 100) rank = "Otaku Master 👑";
    else if (totalWatchedEpisodes >= 50) rank = "Seasoned Weeb ⚔️";
    else if (totalWatchedEpisodes >= 20) rank = "Binge Watcher 🍿";
    else if (totalWatchedEpisodes >= 5) rank = "Anime Enthusiast ✨";

    return {
      totalFavorites: favorites.length,
      totalWatchlist: watchlist.length,
      totalWatchedEpisodes,
      totalHoursWatched,
      rank,
    };
  },
});
