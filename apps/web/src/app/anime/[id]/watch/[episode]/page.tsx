import { WatchPlayerClient } from "./WatchPlayerClient";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { Metadata } from "next";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; episode: string }>;
}): Promise<Metadata> {
  const { id, episode } = await params;
  const numId = parseInt(id, 10);

  if (!numId) return { title: `Watch Episode ${episode} | V-Anime Revived` };

  try {
    const anime = await convex.action(api.anilist.getAnimeDetails, { id: numId });
    const title = anime?.title?.english || anime?.title?.romaji || `Anime #${id}`;

    return {
      title: `Watch ${title} Episode ${episode} (Sub & Dub) | V-Anime Revived`,
      description: `Stream ${title} Episode ${episode} in HD with multiple fast servers and subtitle support.`,
    };
  } catch {
    return { title: `Watch Episode ${episode} | V-Anime Revived` };
  }
}

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; episode: string }>;
  searchParams: Promise<{ server?: string; type?: string }>;
}) {
  const { id, episode } = await params;
  const { server, type } = await searchParams;
  const numId = parseInt(id, 10);

  let animeData = null;
  if (numId) {
    try {
      animeData = await convex.action(api.anilist.getAnimeDetails, { id: numId });
    } catch (err) {
      console.error(`Failed to fetch anime details for ID ${id}`, err);
    }
  }

  const formattedAnime = animeData
    ? {
        id: animeData.id.toString(),
        title: animeData.title?.english || animeData.title?.romaji || `Anime #${id}`,
        romajiTitle: animeData.title?.romaji || "",
        description: animeData.description || "",
        posterUrl: animeData.coverImage?.extraLarge || animeData.coverImage?.large || "",
        bannerUrl: animeData.bannerImage || animeData.coverImage?.extraLarge || "",
        genres: animeData.genres || ["Action", "Anime"],
        status: animeData.status || "FINISHED",
        episodes: animeData.nextAiringEpisode
          ? animeData.nextAiringEpisode.episode - 1
          : animeData.episodes || 24,
        rating: animeData.averageScore ? (animeData.averageScore / 10).toFixed(1) : "9.0",
        year: animeData.seasonYear?.toString() || "2024",
        studio: animeData.studio || "Unknown Studio",
        format: animeData.format || "TV",
        relations: animeData.relations || [],
      }
    : null;

  const availableServers = [
    "senshi",
    "anizone",
    "anikoto",
    "miruro",
    "anineko",
    "reanime",
    "animeheaven",
  ];

  return (
    <WatchPlayerClient
      animeId={id}
      episode={episode}
      serverParam={server}
      typeParam={type as "sub" | "dub" | undefined}
      availableServers={availableServers}
      anime={formattedAnime}
    />
  );
}
