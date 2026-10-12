import { action, mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

const PINNED_ISSUER = "https://usable-alien-7699.clerk.accounts.dev";

async function getUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string; issuer?: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity || (identity.issuer && identity.issuer !== PINNED_ISSUER)) return null;
  // Existing rows use subject for this one pinned Clerk issuer. An
  // issuer-qualified migration is intentionally deferred; do not rewrite data
  // implicitly because that would hide every existing user row.
  return identity.subject;
}

const TOKEN_PREFIX = "enc:v1:";

function getTokenEncryptionKey() {
  const key = process.env.ANILIST_TOKEN_ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error("AniList token encryption is not configured. Set ANILIST_TOKEN_ENCRYPTION_KEY (32+ characters).");
  }
  return key;
}

function toBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function deriveTokenKey(secret: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptAccessToken(token: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveTokenKey(getTokenEncryptionKey());
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(token)),
  );
  return `${TOKEN_PREFIX}${toBase64(iv)}.${toBase64(ciphertext)}`;
}

async function decryptAccessToken(storedToken: string) {
  // Legacy rows can still be read during migration, but all newly linked
  // accounts are encrypted before they are written.
  if (!storedToken.startsWith(TOKEN_PREFIX)) return storedToken;
  const payload = storedToken.slice(TOKEN_PREFIX.length).split(".");
  if (payload.length !== 2) throw new Error("Stored AniList token is invalid.");
  const key = await deriveTokenKey(getTokenEncryptionKey());
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(payload[0]) },
    key,
    fromBase64(payload[1]),
  );
  return new TextDecoder().decode(plaintext);
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

const MAX_IMPORT_ENTRIES = 500;

type AniListImportMedia = {
  id: number;
  title?: { english?: unknown; romaji?: unknown; native?: unknown };
  description?: unknown;
  coverImage?: { extraLarge?: unknown; large?: unknown };
  bannerImage?: unknown;
  genres?: unknown;
  episodes?: unknown;
  status?: unknown;
};

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
    const userId = await getUserId(ctx);
    if (!userId) {
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
    if (token.length > 4096 || /[\u0000-\u001f\u007f]/.test(token)) {
      throw new Error("Access token has an invalid format.");
    }
    // Verify token with AniList
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    let response: Response;
    try {
      response = await fetch(ANILIST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: VIEWER_QUERY }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.data?.Viewer) {
      const errorMsg =
        data?.errors?.[0]?.message ||
        "Invalid or expired AniList Access Token. Please ensure you copied the full Bearer token from AniList.";
      throw new Error(errorMsg);
    }

    const viewer = data.data.Viewer;

    await ctx.runMutation(internal.anilistSync.saveAniListAccount, {
      userId,
      anilistUserId: viewer.id,
      anilistUsername: viewer.name,
      anilistAvatar: viewer.avatar?.large || "",
      accessToken: await encryptAccessToken(token),
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
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const account = await ctx.runQuery(internal.anilistSync.getInternalAniListAccount, {
      userId,
    });

    if (!account) {
      throw new Error("No connected AniList account found.");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    let response: Response;
    try {
      response = await fetch(ANILIST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${await decryptAccessToken(account.accessToken)}`,
        },
        body: JSON.stringify({
          query: COLLECTION_QUERY,
          variables: { userId: account.anilistUserId },
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error("Failed to fetch MediaListCollection from AniList.");
    }

    const data = await response.json().catch(() => null);
    if (!data || data.errors?.length) {
      throw new Error(data?.errors?.[0]?.message || "AniList returned an invalid collection response.");
    }
    const lists = data.data?.MediaListCollection?.lists || [];

    let importedWatchlist = 0;
    const candidates: Array<{ media?: unknown }> = (Array.isArray(lists) ? lists : []).flatMap((list: unknown) => {
      if (!list || typeof list !== "object") return [];
      const entries = (list as { entries?: unknown }).entries;
      return Array.isArray(entries) ? entries as Array<{ media?: unknown }> : [];
    });
    const validEntries = candidates.filter((entry): entry is { media: AniListImportMedia } => {
      const media = entry.media as { id?: unknown } | undefined;
      return !!media && Number.isSafeInteger(media.id) && (media.id as number) > 0;
    });
    const uniqueEntries = [...new Map(validEntries.map((entry) => [entry.media.id, entry])).values()];

    for (const entry of uniqueEntries.slice(0, MAX_IMPORT_ENTRIES)) {
        const media = entry.media;
        const mediaId = media.id;
        if (!Number.isSafeInteger(mediaId) || mediaId <= 0) continue;

        // Cache anime in DB
        await ctx.runMutation(internal.anilist.cacheAnime, {
          anilistId: mediaId,
          title: {
            ...(typeof media.title?.english === "string" ? { english: media.title.english } : {}),
            ...(typeof media.title?.romaji === "string" ? { romaji: media.title.romaji } : {}),
            ...(typeof media.title?.native === "string" ? { native: media.title.native } : {}),
          },
          description: typeof media.description === "string" ? media.description : "No description.",
          posterUrl: typeof media.coverImage?.extraLarge === "string" ? media.coverImage.extraLarge :
            (typeof media.coverImage?.large === "string" ? media.coverImage.large : ""),
          bannerUrl: typeof media.bannerImage === "string" ? media.bannerImage : undefined,
          genres: Array.isArray(media.genres) ? media.genres.filter((genre: unknown): genre is string => typeof genre === "string") : [],
          episodes: typeof media.episodes === "number" ? media.episodes : undefined,
          status: typeof media.status === "string" ? media.status : undefined,
        });

        // Add to watchlist
        await ctx.runMutation(internal.anilistSync.importWatchlistItem, {
          userId,
          anilistId: mediaId,
        });

        importedWatchlist++;
    }

    // Update lastSyncedAt
    await ctx.runMutation(internal.anilistSync.updateLastSynced, {
      userId,
    });

    return {
      success: true,
      totalImported: importedWatchlist,
      totalAvailable: uniqueEntries.length,
      truncated: uniqueEntries.length > MAX_IMPORT_ENTRIES,
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
    if (!Number.isSafeInteger(args.anilistId) || args.anilistId <= 0 ||
        !Number.isSafeInteger(args.episodeNumber) || args.episodeNumber < 1 || args.episodeNumber > 10000) {
      return { success: false, error: "Invalid anime progress" };
    }
    const userId = await getUserId(ctx);
    if (!userId) return { success: false, error: "Unauthenticated" };

    const account = await ctx.runQuery(internal.anilistSync.getInternalAniListAccount, {
      userId,
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
          Authorization: `Bearer ${await decryptAccessToken(account.accessToken)}`,
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

      const data = await response.json().catch(() => null);
      if (!response.ok || data?.errors?.length || !data?.data?.SaveMediaListEntry) {
        return { success: false, error: "AniList API response error" };
      }

      return { success: true };
    } catch (err) {
      console.error("Failed to sync episode to AniList:", err);
      return { success: false, error: String(err) };
    }
  },
});
