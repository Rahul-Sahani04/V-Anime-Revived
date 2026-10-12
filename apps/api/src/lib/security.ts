import { verifyToken } from "@clerk/backend";

const DEFAULT_TIMEOUT_MS = 8_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const userRequests = new Map<string, number[]>();

export function getRequestTimeoutMs() {
  const configured = Number(process.env.UPSTREAM_TIMEOUT_MS);
  if (!Number.isFinite(configured)) return DEFAULT_TIMEOUT_MS;
  return Math.min(Math.max(Math.floor(configured), 1_000), 15_000);
}

export async function requireClerkUser(request: Request) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!secretKey || !token) return null;

  try {
    return await verifyToken(token, {
      secretKey,
      authorizedParties: process.env.CLERK_AUTHORIZED_PARTIES
        ?.split(",")
        .map((party) => party.trim())
        .filter(Boolean),
    });
  } catch {
    return null;
  }
}

export function consumePlaybackRateLimit(subject: string) {
  const now = Date.now();
  const recent = (userRequests.get(subject) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    userRequests.set(subject, recent);
    return false;
  }
  recent.push(now);
  userRequests.set(subject, recent);
  return true;
}

export function parsePlaybackParams(request: Request, params: { id: string; episode: string }) {
  const animeId = Number(params.id);
  const episodeNumber = Number(params.episode);
  if (
    !/^\d{1,12}$/.test(params.id) ||
    !/^\d{1,4}$/.test(params.episode) ||
    !Number.isSafeInteger(animeId) ||
    !Number.isSafeInteger(episodeNumber) ||
    animeId <= 0 ||
    episodeNumber <= 0
  ) return null;

  const searchParams = new URL(request.url).searchParams;
  const type = searchParams.get("type") || "sub";
  const server = searchParams.get("server") || "senshi";
  const title = searchParams.get("title") || undefined;
  const validServers = new Set([
    "senshi",
    "anizone",
    "anikoto",
    "miruro",
    "anineko",
    "reanime",
    "animeheaven",
  ]);

  if (!/^(sub|dub)$/.test(type) || !validServers.has(server)) return null;
  if (title && (title.length > 200 || /[\u0000-\u001f\u007f]/.test(title))) return null;

  return { id: params.id, episode: params.episode, type, server, title };
}
