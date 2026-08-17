import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    username: v.string(),
    imageUrl: v.string(),
  }).index("by_clerkId", ["clerkId"]),

  userPreferences: defineTable({
    userId: v.string(),
    preferredLanguage: v.string(),
    preferredServer: v.string(),
    autoplay: v.boolean(),
    autoNext: v.boolean(),
  }).index("by_userId", ["userId"]),

  animeCache: defineTable({
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
    updatedAt: v.number(),
  }).index("by_anilistId", ["anilistId"]),

  favorites: defineTable({
    userId: v.string(),
    anilistId: v.number(),
    createdAt: v.number(),
  }).index("by_user_and_anime", ["userId", "anilistId"]),

  watchlist: defineTable({
    userId: v.string(),
    anilistId: v.number(),
    priority: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user_and_anime", ["userId", "anilistId"]),

  watchProgress: defineTable({
    userId: v.string(),
    anilistId: v.number(),
    episodeNumber: v.number(),
    position: v.number(),
    duration: v.number(),
    percentage: v.number(),
    completed: v.boolean(),
    lastWatchedAt: v.number(),
  })
    .index("by_user_and_anime_and_episode", ["userId", "anilistId", "episodeNumber"])
    .index("by_user_and_anime", ["userId", "anilistId"])
    .index("by_user_active", ["userId", "completed"]),

  watchHistory: defineTable({
    userId: v.string(),
    anilistId: v.number(),
    episodeNumber: v.number(),
    server: v.string(),
    watchedAt: v.number(),
  }).index("by_userId", ["userId"]),

  anilistAccounts: defineTable({
    userId: v.string(),
    anilistUserId: v.number(),
    anilistUsername: v.string(),
    anilistAvatar: v.optional(v.string()),
    accessToken: v.string(),
    autoSyncProgress: v.boolean(),
    lastSyncedAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]),
});
