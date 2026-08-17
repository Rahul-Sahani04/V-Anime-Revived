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
  const { server = "senshi", type = "sub" } = await searchParams;

  const availableServers = [
    "anizone",
    "anineko",
    "reanime",
    "anikoto",
    "senshi",
    "animeheaven",
    "miruro",
  ];

  return (
    <WatchPlayerClient
      animeId={id}
      episode={episode}
      server={server}
      type={type as "sub" | "dub"}
      availableServers={availableServers}
    />
  );
}
