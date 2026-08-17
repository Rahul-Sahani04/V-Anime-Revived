import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Helper to get authenticated user ID or null.
 */
async function getUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  return identity ? identity.subject : null;
}

/**
 * Record or update playback progress for an anime episode.
 */
export const updateProgress = mutation({
  args: {
    anilistId: v.number(),
    episodeNumber: v.number(),
    position: v.number(),
    duration: v.number(),
    percentage: v.number(),
    completed: v.boolean(),
    server: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      // Unauthenticated - caller will handle localStorage
      return null;
    }

    const now = Date.now();

    // Check existing progress
    const existing = await ctx.db
      .query("watchProgress")
      .withIndex("by_user_and_anime_and_episode", (q) =>
        q
          .eq("userId", userId)
          .eq("anilistId", args.anilistId)
          .eq("episodeNumber", args.episodeNumber)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        position: args.position,
        duration: args.duration,
        percentage: args.percentage,
        completed: args.completed,
        lastWatchedAt: now,
      });
    } else {
      await ctx.db.insert("watchProgress", {
        userId,
        anilistId: args.anilistId,
        episodeNumber: args.episodeNumber,
        position: args.position,
        duration: args.duration,
        percentage: args.percentage,
        completed: args.completed,
        lastWatchedAt: now,
      });
    }

    // If marked completed, log to watchHistory
    if (args.completed) {
      await ctx.db.insert("watchHistory", {
        userId,
        anilistId: args.anilistId,
        episodeNumber: args.episodeNumber,
        server: args.server || "senshi",
        watchedAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * Dismiss an in-progress anime from "Continue Watching".
 */
export const dismissWatchProgress = mutation({
  args: {
    anilistId: v.number(),
    episodeNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) return { success: false };

    if (args.episodeNumber !== undefined) {
      const item = await ctx.db
        .query("watchProgress")
        .withIndex("by_user_and_anime_and_episode", (q) =>
          q
            .eq("userId", userId)
            .eq("anilistId", args.anilistId)
            .eq("episodeNumber", args.episodeNumber!)
        )
        .first();

      if (item) {
        await ctx.db.delete(item._id);
      }
    } else {
      const items = await ctx.db
        .query("watchProgress")
        .withIndex("by_user_and_anime", (q) =>
          q.eq("userId", userId).eq("anilistId", args.anilistId)
        )
        .collect();

      for (const it of items) {
        await ctx.db.delete(it._id);
      }
    }

    return { success: true };
  },
});

/**
 * Delete a single history item.
 */
export const removeHistoryItem = mutation({
  args: { historyId: v.id("watchHistory") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) return { success: false };

    const item = await ctx.db.get(args.historyId);
    if (item && item.userId === userId) {
      await ctx.db.delete(args.historyId);
    }
    return { success: true };
  },
});

/**
 * Clear the entire watch history for the user.
 */
export const clearWatchHistory = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return { deleted: 0 };

    const history = await ctx.db
      .query("watchHistory")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    for (const item of history) {
      await ctx.db.delete(item._id);
    }

    return { deleted: history.length };
  },
});

/**
 * Get saved progress for a specific anime episode.
 */
export const getAnimeProgress = query({
  args: {
    anilistId: v.number(),
    episodeNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("watchProgress")
      .withIndex("by_user_and_anime_and_episode", (q) =>
        q
          .eq("userId", userId)
          .eq("anilistId", args.anilistId)
          .eq("episodeNumber", args.episodeNumber)
      )
      .first();
  },
});

/**
 * Get the user's active "Continue Watching" items (unfinished progress sessions).
 */
export const getContinueWatching = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return [];

    // Query active sessions where completed == false
    const activeProgress = await ctx.db
      .query("watchProgress")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", userId).eq("completed", false)
      )
      .order("desc")
      .take(30);

    // Hydrate each progress with animeCache metadata
    const hydratedList = await Promise.all(
      activeProgress.map(async (item) => {
        const anime = await ctx.db
          .query("animeCache")
          .withIndex("by_anilistId", (q) => q.eq("anilistId", item.anilistId))
          .first();

        return {
          id: item.anilistId,
          progressId: item._id,
          title: anime?.title?.english || anime?.title?.romaji || `Anime #${item.anilistId}`,
          posterUrl: anime?.posterUrl || "",
          currentEpisode: item.episodeNumber,
          progressPercentage: Math.min(100, Math.max(0, Math.round(item.percentage))),
          position: item.position,
          duration: item.duration,
          lastWatchedAt: item.lastWatchedAt,
          genre: anime?.genres?.slice(0, 2).join(", ") || "Anime",
        };
      })
    );

    // Sort by lastWatchedAt desc
    return hydratedList.sort((a, b) => b.lastWatchedAt - a.lastWatchedAt);
  },
});

/**
 * Get user's watch history.
 */
export const getWatchHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return [];

    const historyItems = await ctx.db
      .query("watchHistory")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(100);

    return await Promise.all(
      historyItems.map(async (item) => {
        const anime = await ctx.db
          .query("animeCache")
          .withIndex("by_anilistId", (q) => q.eq("anilistId", item.anilistId))
          .first();

        return {
          id: item.anilistId,
          historyId: item._id,
          episodeNumber: item.episodeNumber,
          server: item.server,
          watchedAt: item.watchedAt,
          title: anime?.title?.english || anime?.title?.romaji || `Anime #${item.anilistId}`,
          posterUrl: anime?.posterUrl || "",
          genre: anime?.genres?.slice(0, 2).join(", ") || "Anime",
        };
      })
    );
  },
});

/**
 * Bulk sync guest progress stored in localStorage into Convex upon login.
 */
export const syncGuestProgress = mutation({
  args: {
    items: v.array(
      v.object({
        anilistId: v.number(),
        episodeNumber: v.number(),
        position: v.number(),
        duration: v.number(),
        percentage: v.number(),
        completed: v.boolean(),
        server: v.optional(v.string()),
        lastWatchedAt: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId || args.items.length === 0) return { synced: 0 };

    let count = 0;
    for (const item of args.items) {
      const existing = await ctx.db
        .query("watchProgress")
        .withIndex("by_user_and_anime_and_episode", (q) =>
          q
            .eq("userId", userId)
            .eq("anilistId", item.anilistId)
            .eq("episodeNumber", item.episodeNumber)
        )
        .first();

      if (existing) {
        if (item.lastWatchedAt > existing.lastWatchedAt) {
          await ctx.db.patch(existing._id, {
            position: item.position,
            duration: item.duration,
            percentage: item.percentage,
            completed: item.completed,
            lastWatchedAt: item.lastWatchedAt,
          });
          count++;
        }
      } else {
        await ctx.db.insert("watchProgress", {
          userId,
          anilistId: item.anilistId,
          episodeNumber: item.episodeNumber,
          position: item.position,
          duration: item.duration,
          percentage: item.percentage,
          completed: item.completed,
          lastWatchedAt: item.lastWatchedAt,
        });
        count++;
      }
    }

    return { synced: count };
  },
});
