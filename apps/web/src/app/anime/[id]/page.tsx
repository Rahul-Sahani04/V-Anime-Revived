import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { AnimeDetailsClient } from "./AnimeDetailsClient";
import Link from "next/link";
import { Metadata } from "next";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

// Enable Next.js ISR Edge Caching (1 hour cache at Vercel edge)
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (!numId) return { title: "Anime Not Found | V-Anime Revived" };

  try {
    const anime = await convex.action(api.anilist.getAnimeDetails, { id: numId });
    if (!anime) return { title: "Anime | V-Anime Revived" };

    const title = anime.title?.english || anime.title?.romaji || "Anime Details";
    return {
      title: `${title} | V-Anime Revived`,
      description: anime.description
        ? anime.description.replace(/<[^>]*>?/gm, "").slice(0, 160)
        : `Stream ${title} on V-Anime Revived in HD with Sub & Dub.`,
      openGraph: {
        title: `${title} - V-Anime Revived`,
        description: anime.description
          ? anime.description.replace(/<[^>]*>?/gm, "").slice(0, 160)
          : `Watch ${title} in HD with multi-server playback.`,
      },
    };
  } catch {
    return { title: "Anime Details | V-Anime Revived" };
  }
}

import { AnimeDetailsFallback } from "./AnimeDetailsFallback";

export default async function AnimeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = parseInt(id, 10);

  let animeData = null;
  if (numId) {
    try {
      animeData = await convex.action(api.anilist.getAnimeDetails, { id: numId });
    } catch (err) {
      console.error(`Failed to fetch anime details for ID ${id}`, err);
    }
  }

  if (!animeData) {
    return <AnimeDetailsFallback animeId={id} />;
  }

  const formattedAnime = {
    id: animeData.id.toString(),
    title: animeData.title?.english || animeData.title?.romaji || "Anime",
    romajiTitle:
      animeData.title?.romaji && animeData.title?.romaji !== animeData.title?.english
        ? animeData.title?.romaji
        : undefined,
    nativeTitle: animeData.title?.native,
    description: animeData.description || "No synopsis available.",
    posterUrl: animeData.coverImage?.extraLarge || animeData.coverImage?.large || "",
    bannerUrl: animeData.bannerImage || animeData.coverImage?.extraLarge || animeData.coverImage?.large || "",
    genres: animeData.genres || ["Action"],
    status: animeData.status || "FINISHED",
    format: animeData.format || "TV",
    episodes: animeData.episodes || 24,
    rating: animeData.averageScore ? (animeData.averageScore / 10).toFixed(1) : "9.0",
    year: animeData.seasonYear?.toString() || "2024",
    studio: animeData.studio || "Unknown Studio",
  };

  return <AnimeDetailsClient anime={formattedAnime} />;
}
