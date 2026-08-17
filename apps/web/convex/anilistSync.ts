import { action, mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

async function getUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  return identity ? identity.subject : null;
}

const VIEWER_QUERY = `
  query {
    Viewer {
      id
      name
      avatar {
        large
      }
    }
  }
`;

const COLLECTION_QUERY = `
  query($userId: Int) {
    MediaListCollection(userId: $userId, type: ANIME) {
      lists {
        name
        status
        entries {
          id
          mediaId
          status
          progress
          score
          media {
            id
            title { romaji english native }
            description(asHtml: false)
            coverImage { extraLarge large }
            bannerImage
            episodes
            status
            genres
          }
        }
      }
    }
  }
`;

const SAVE_ENTRY_MUTATION = `
  mutation($mediaId: Int, $progress: Int, $status: MediaListStatus) {
    SaveMediaListEntry(mediaId: $mediaId, progress: $progress, status: $status) {
      id
      mediaId
      progress
      status
    }
  }
`;

/**
 * Get connected AniList account status.
 */
export const getAniListAccount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return null;

    const account = await ctx.db
      .query("anilistAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!account) return null;

    return {
      connected: true,
      anilistUserId: account.anilistUserId,
      anilistUsername: account.anilistUsername,
      anilistAvatar: account.anilistAvatar,
      autoSyncProgress: account.autoSyncProgress,
      lastSyncedAt: account.lastSyncedAt,
    };
  },
});

/**
 * Internal query to fetch account token for background sync actions.
 */
export const getInternalAniListAccount = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("anilistAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

/**
 * Connect AniList account with an OAuth Access Token.
 */
export const connectAniListToken = action({
  args: { accessToken: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated: Please sign in with Clerk first.");
    }

    let token = args.accessToken.trim();

    // Auto-extract from URL or URL hash if user pasted a full redirect URL
    if (token.includes("access_token=")) {
      const match = token.match(/access_token=([^&]+)/);
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }

    // Strip leading "Bearer " if present
    if (token.toLowerCase().startsWith("bearer ")) {
      token = token.slice(7).trim();
    }

    // Strip quotes if user pasted wrapped in quotes
    if (
      (token.startsWith('"') && token.endsWith('"')) ||
      (token.startsWith("'") && token.endsWith("'"))
    ) {
      token = token.slice(1, -1).trim();
    }

    if (!token) {
      throw new Error("Access token cannot be empty.");
    }

    // Verify token with AniList
    const response = await fetch(ANILIST_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: VIEWER_QUERY }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.data?.Viewer) {
      const errorMsg =
        data?.errors?.[0]?.message ||
        "Invalid or expired AniList Access Token. Please ensure you copied the full Bearer token from AniList.";
      throw new Error(errorMsg);
    }

    const viewer = data.data.Viewer;

    await ctx.runMutation(internal.anilistSync.saveAniListAccount, {
      userId: identity.subject,
      anilistUserId: viewer.id,
      anilistUsername: viewer.name,
      anilistAvatar: viewer.avatar?.large || "",
      accessToken: token,
    });

    return {
      success: true,
      username: viewer.name,
      avatar: viewer.avatar?.large,
    };
  },
});

/**
 * Internal mutation to save or update AniList account record.
 */
export const saveAniListAccount = internalMutation({
  args: {
    userId: v.string(),
    anilistUserId: v.number(),
    anilistUsername: v.string(),
    anilistAvatar: v.optional(v.string()),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("anilistAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        anilistUserId: args.anilistUserId,
        anilistUsername: args.anilistUsername,
        anilistAvatar: args.anilistAvatar,
        accessToken: args.accessToken,
        autoSyncProgress: true,
        lastSyncedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("anilistAccounts", {
        userId: args.userId,
        anilistUserId: args.anilistUserId,
        anilistUsername: args.anilistUsername,
        anilistAvatar: args.anilistAvatar,
        accessToken: args.accessToken,
        autoSyncProgress: true,
        lastSyncedAt: Date.now(),
      });
    }
  },
});

/**
 * Disconnect and unlink AniList account.
 */
export const disconnectAniListAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("anilistAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { success: true };
  },
});

/**
 * Toggle auto-sync progress flag.
 */
export const toggleAutoSync = mutation({
  args: { autoSyncProgress: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("anilistAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        autoSyncProgress: args.autoSyncProgress,
      });
    }

    return { success: true };
  },
});

/**
 * Import user's Anime List from AniList into V-Anime Watchlist & Cache.
 */
export const importAniListCollection = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const account = await ctx.runQuery(internal.anilistSync.getInternalAniListAccount, {
      userId: identity.subject,
    });

    if (!account) {
      throw new Error("No connected AniList account found.");
    }

    const response = await fetch(ANILIST_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${account.accessToken}`,
      },
      body: JSON.stringify({
        query: COLLECTION_QUERY,
        variables: { userId: account.anilistUserId },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch MediaListCollection from AniList.");
    }

    const data = await response.json();
    const lists = data.data?.MediaListCollection?.lists || [];

    let importedWatchlist = 0;

    for (const list of lists) {
      const entries = list.entries || [];
      for (const entry of entries) {
        if (!entry.media) continue;

        // Cache anime in DB
        await ctx.runMutation(internal.anilist.cacheAnime, {
          anilistId: entry.media.id,
          title: entry.media.title,
          description: entry.media.description || "No description.",
          posterUrl: entry.media.coverImage?.extraLarge || entry.media.coverImage?.large || "",
          bannerUrl: entry.media.bannerImage || "",
          genres: entry.media.genres || [],
          episodes: entry.media.episodes,
          status: entry.media.status,
        });

        // Add to watchlist
        await ctx.runMutation(internal.anilistSync.importWatchlistItem, {
          userId: identity.subject,
          anilistId: entry.media.id,
        });

        importedWatchlist++;
      }
    }

    // Update lastSyncedAt
    await ctx.runMutation(internal.anilistSync.updateLastSynced, {
      userId: identity.subject,
    });

    return {
      success: true,
      totalImported: importedWatchlist,
    };
  },
});

export const importWatchlistItem = internalMutation({
  args: { userId: v.string(), anilistId: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("watchlist")
      .withIndex("by_user_and_anime", (q) =>
        q.eq("userId", args.userId).eq("anilistId", args.anilistId)
      )
      .first();

    if (!existing) {
      await ctx.db.insert("watchlist", {
        userId: args.userId,
        anilistId: args.anilistId,
        createdAt: Date.now(),
      });
    }
  },
});

export const updateLastSynced = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("anilistAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (account) {
      await ctx.db.patch(account._id, { lastSyncedAt: Date.now() });
    }
  },
});

/**
 * Realtime Sync: Push watched episode progress directly to AniList.
 */
export const syncEpisodeProgressToAniList = action({
  args: {
    anilistId: v.number(),
    episodeNumber: v.number(),
    completed: v.boolean(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { success: false, error: "Unauthenticated" };

    const account = await ctx.runQuery(internal.anilistSync.getInternalAniListAccount, {
      userId: identity.subject,
    });

    if (!account || !account.autoSyncProgress) {
      return { success: false, error: "AniList auto-sync not enabled" };
    }

    try {
      const response = await fetch(ANILIST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${account.accessToken}`,
        },
        body: JSON.stringify({
          query: SAVE_ENTRY_MUTATION,
          variables: {
            mediaId: args.anilistId,
            progress: args.episodeNumber,
            status: args.completed ? "CURRENT" : "CURRENT",
          },
        }),
      });

      if (!response.ok) {
        return { success: false, error: "AniList API response error" };
      }

      return { success: true };
    } catch (err) {
      console.error("Failed to sync episode to AniList:", err);
      return { success: false, error: String(err) };
    }
  },
});
