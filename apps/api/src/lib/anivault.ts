import { Redis } from "@upstash/redis";
import { getRequestTimeoutMs } from "./security";

export const ANIVAULT_BASE_URL = process.env.ANIVAULT_API_URL || "http://localhost:3000";

// Gracefully handle missing Redis credentials (e.g. during local dev without .env)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

export interface Server {
  id: string;
  name: string;
  score?: number;
}

export type PlaybackSource = Record<string, unknown>;

function isPlaybackPayload(value: unknown): value is PlaybackSource {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const payload = value as Record<string, unknown>;
  return ["hlsProxyUrl", "m3u8", "mp4ProxyUrl", "mp4", "streamUrl", "embedUrl"]
    .some((key) => typeof payload[key] === "string" && payload[key].length > 0);
}

/**
 * Return the available sources for AniVault.
 * We rank them by reliability.
 */
export async function getAvailableServers(animeId: string, episode: string): Promise<Server[]> {
  return [
    { id: "anizone", name: "AniZone", score: 100 },
    { id: "anineko", name: "AniNeko", score: 95 },
    { id: "reanime", name: "Re:Anime", score: 90 },
    { id: "anikoto", name: "Anikoto", score: 85 },
    { id: "senshi", name: "Senshi", score: 80 },
    { id: "animeheaven", name: "AnimeHeaven", score: 75 },
    { id: "miruro", name: "Miruro", score: 70 },
  ];
}

/**
 * Resolves the actual stream. If the preferred server fails, this function
 * attempts to automatically fallback to the next best server.
 * Integrates Upstash Redis caching to bypass upstream rate limits.
 */
export async function resolveStreamWithFallback(
  animeId: string,
  episode: string,
  type: string,
  preferredServer: string,
  availableServers: Server[],
  title?: string
): Promise<PlaybackSource> {
  const deadline = Date.now() + 55_000;

  // Sort servers so preferred is first, then ordered by score
  const fallbackQueue = [
    preferredServer,
    ...availableServers
      .filter((s) => s.id !== preferredServer)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((s) => s.id),
  ];

  for (const serverId of fallbackQueue) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) break;
    const cacheKey = `stream:${animeId}:${episode}:${type}:${serverId}`;

    // 1. Check Redis Cache
    if (redis) {
      try {
        const cached = await redis.get<unknown>(cacheKey);
        if (isPlaybackPayload(cached)) {
          console.log(`[Cache Hit] Serving ${serverId} from Redis for ${animeId} EP ${episode}`);
          return cached;
        }
      } catch (err) {
        console.warn("[Redis] Failed to read cache:", err);
      }
    }

    // 2. Fetch from Scraper
    try {
      const titleQuery = title ? `?title=${encodeURIComponent(title)}` : "";
      const url = `${ANIVAULT_BASE_URL}/api/watch/${serverId}/${animeId}/${episode}/${type}${titleQuery}`;
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(Math.min(getRequestTimeoutMs(), remainingMs)),
        headers: process.env.SCRAPER_API_KEY
          ? { "X-Scraper-Key": process.env.SCRAPER_API_KEY }
          : undefined,
        next: { revalidate: 300 }, // Next.js HTTP cache as a secondary layer
      });

      if (response.ok) {
        const data = await response.json();
        if (!isPlaybackPayload(data)) {
          console.warn(`[Fallback] Server ${serverId} returned an invalid playback payload.`);
          continue;
        }
        
        // Keep stream URLs short-lived and preserve the scraper's raw fields.
        if (redis) {
          try {
            await redis.set(cacheKey, data, { ex: 300 });
            console.log(`[Cache Miss] Saved ${serverId} to Redis for ${animeId} EP ${episode}`);
          } catch (err) {
            console.warn("[Redis] Failed to save cache:", err);
          }
        }

        return data as PlaybackSource;
      }
      
      console.warn(`[Fallback] Server ${serverId} failed. Trying next...`);
    } catch (error) {
      console.warn(`[Fallback] Server ${serverId} threw an error:`, error);
    }
  }

  throw new Error("All streaming servers failed to resolve the media.");
}
