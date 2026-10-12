import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
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

const MAX_GUEST_PROGRESS_ITEMS = 100;
const MAX_EPISODE_NUMBER = 10000;
const MAX_DURATION_SECONDS = 24 * 60 * 60;
const SERVER_IDS = new Set([
  "senshi",
  "anikoto",
  "miruro",
  "anizone",
  "animeheaven",
  "reanime",
  "anineko",
]);

function assertFiniteNumber(value: number, field: string) {
  if (!Number.isFinite(value)) throw new Error(`Invalid ${field}.`);
}

function validateProgress(item: {
  anilistId: number;
  episodeNumber: number;
  position: number;
  duration: number;
  percentage: number;
  server?: string;
  lastWatchedAt?: number;
}) {
  for (const [field, value] of Object.entries(item)) {
    if (typeof value === "number") assertFiniteNumber(value, field);
  }
  if (!Number.isSafeInteger(item.anilistId) || item.anilistId <= 0) throw new Error("Invalid anime ID.");
  if (!Number.isSafeInteger(item.episodeNumber) || item.episodeNumber < 1 || item.episodeNumber > MAX_EPISODE_NUMBER) {
    throw new Error("Invalid episode number.");
  }
  if (item.position < 0 || item.duration < 0 || item.duration > MAX_DURATION_SECONDS || item.position > item.duration) {
    throw new Error("Progress position must be within the episode duration.");
  }
  if (item.percentage < 0 || item.percentage > 100) throw new Error("Progress percentage must be between 0 and 100.");
  if (item.lastWatchedAt !== undefined && item.lastWatchedAt < 0) throw new Error("Invalid last watched timestamp.");
  if (item.server !== undefined && !SERVER_IDS.has(item.server)) throw new Error("Invalid streaming server.");
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
    validateProgress(args);
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
      const existingHistory = await ctx.db
        .query("watchHistory")
        .withIndex("by_user_and_anime_and_episode", (q) =>
          q.eq("userId", userId).eq("anilistId", args.anilistId).eq("episodeNumber", args.episodeNumber)
        )
        .first();

      if (!existingHistory) {
        await ctx.db.insert("watchHistory", {
          userId,
          anilistId: args.anilistId,
          episodeNumber: args.episodeNumber,
          server: args.server || "senshi",
          watchedAt: now,
        });
      }
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
    let scheduled = false;

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
        .take(100);

      for (const it of items) {
        await ctx.db.delete(it._id);
      }
      if (items.length === 100) {
        scheduled = true;
        await ctx.scheduler.runAfter(0, internal.progress.dismissWatchProgressBatch, {
          userId,
          anilistId: args.anilistId,
        });
      }
    }

    return { success: true, scheduled };
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
      .take(1000);

    for (const item of history) {
      await ctx.db.delete(item._id);
    }
    if (history.length === 1000) {
      await ctx.scheduler.runAfter(0, internal.progress.clearWatchHistoryBatch, { userId });
    }

    return { deleted: history.length, scheduled: history.length === 1000 };
  },
});

export const dismissWatchProgressBatch = internalMutation({
  args: { userId: v.string(), anilistId: v.number() },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("watchProgress")
      .withIndex("by_user_and_anime", (q) => q.eq("userId", args.userId).eq("anilistId", args.anilistId))
      .take(100);
    for (const item of items) await ctx.db.delete(item._id);
    if (items.length === 100) {
      await ctx.scheduler.runAfter(0, internal.progress.dismissWatchProgressBatch, args);
    }
  },
});

export const clearWatchHistoryBatch = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("watchHistory")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(1000);
    for (const item of history) await ctx.db.delete(item._id);
    if (history.length === 1000) {
      await ctx.scheduler.runAfter(0, internal.progress.clearWatchHistoryBatch, args);
    }
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
    if (args.items.length > MAX_GUEST_PROGRESS_ITEMS) {
      throw new Error(`Guest progress sync is limited to ${MAX_GUEST_PROGRESS_ITEMS} items.`);
    }
    for (const item of args.items) validateProgress(item);

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
