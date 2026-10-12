import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Helper to get authenticated user ID or null.
 */
const PINNED_ISSUER = "https://usable-alien-7699.clerk.accounts.dev";

async function getUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string; issuer?: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity || (identity.issuer && identity.issuer !== PINNED_ISSUER)) return null;
  return identity.subject;
}

const LANGUAGE_OPTIONS = new Set(["sub", "dub"]);
const SERVER_OPTIONS = new Set([
  "senshi",
  "anikoto",
  "miruro",
  "anizone",
  "animeheaven",
  "reanime",
  "anineko",
]);

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
      preferredLanguage: LANGUAGE_OPTIONS.has(prefs.preferredLanguage)
        ? prefs.preferredLanguage
        : DEFAULT_PREFERENCES.preferredLanguage,
      preferredServer: SERVER_OPTIONS.has(prefs.preferredServer)
        ? prefs.preferredServer
        : DEFAULT_PREFERENCES.preferredServer,
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
    if (args.preferredLanguage !== undefined && !LANGUAGE_OPTIONS.has(args.preferredLanguage)) {
      throw new Error("Invalid preferred language.");
    }
    if (args.preferredServer !== undefined && !SERVER_OPTIONS.has(args.preferredServer)) {
      throw new Error("Invalid preferred server.");
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
        statsComplete: true,
      };
    }

    const statsLimit = 10000;
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_anime", (q) => q.eq("userId", userId))
      .take(statsLimit + 1);

    const watchlist = await ctx.db
      .query("watchlist")
      .withIndex("by_user_and_anime", (q) => q.eq("userId", userId))
      .take(statsLimit + 1);

    const history = await ctx.db
      .query("watchHistory")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(statsLimit + 1);

    const statsComplete = favorites.length <= statsLimit && watchlist.length <= statsLimit && history.length <= statsLimit;
    const totalWatchedEpisodes = Math.min(history.length, statsLimit);
    const totalHoursWatched = Math.round((totalWatchedEpisodes * 24) / 60 * 10) / 10;

    let rank = "Anime Novice 🌱";
    if (totalWatchedEpisodes >= 100) rank = "Otaku Master 👑";
    else if (totalWatchedEpisodes >= 50) rank = "Seasoned Weeb ⚔️";
    else if (totalWatchedEpisodes >= 20) rank = "Binge Watcher 🍿";
    else if (totalWatchedEpisodes >= 5) rank = "Anime Enthusiast ✨";

    return {
      totalFavorites: Math.min(favorites.length, statsLimit),
      totalWatchlist: Math.min(watchlist.length, statsLimit),
      totalWatchedEpisodes,
      totalHoursWatched,
      rank,
      statsComplete,
    };
  },
});
