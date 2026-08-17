"use client";

import { useEffect, useState, useCallback } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { AnimeDetailsClient } from "./AnimeDetailsClient";
import Link from "next/link";
import { RotateCcw, Compass, Loader2 } from "lucide-react";

interface AnimeDetailsFallbackProps {
  animeId: string;
}

export function AnimeDetailsFallback({ animeId }: AnimeDetailsFallbackProps) {
  const numId = parseInt(animeId, 10) || 0;
  const [retrying, setRetrying] = useState(false);
  const [clientData, setClientData] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [failed, setFailed] = useState(false);

  const cachedAnime = useQuery(
    api.anilist.getCachedAnime,
    numId > 0 ? { anilistId: numId } : "skip"
  );
  const fetchDetailsAction = useAction(api.anilist.getAnimeDetails);

  const tryFetch = useCallback(async () => {
    if (!numId) {
      setFailed(true);
      return;
    }
    setRetrying(true);
    setFailed(false);

    try {
      const data = await fetchDetailsAction({ id: numId });
      if (data) {
        setClientData(data);
      } else {
        setFailed(true);
      }
    } catch (err) {
      console.error("Client fallback fetch error:", err);
      setFailed(true);
    } finally {
      setRetrying(false);
    }
  }, [numId, fetchDetailsAction]);

  useEffect(() => {
    tryFetch();
  }, [tryFetch]);

  // If cached data is available in Convex DB
  const effectiveData = clientData || (cachedAnime ? {
    id: cachedAnime.anilistId.toString(),
    title: cachedAnime.title,
    description: cachedAnime.description || "No synopsis available.",
    posterUrl: cachedAnime.posterUrl,
    bannerUrl: cachedAnime.bannerUrl || cachedAnime.posterUrl,
    genres: cachedAnime.genres || ["Action"],
    status: cachedAnime.status || "FINISHED",
    episodes: cachedAnime.episodes || 24,
    rating: "9.0",
    year: "2024",
    studio: "Animation Studio",
  } : null);

  if (effectiveData) {
    const formattedAnime = {
      id: (effectiveData.id || numId).toString(),
      title: effectiveData.title?.english || effectiveData.title?.romaji || "Anime",
      description: effectiveData.description || "No synopsis available.",
      posterUrl:
        effectiveData.coverImage?.extraLarge ||
        effectiveData.coverImage?.large ||
        effectiveData.posterUrl ||
        "",
      bannerUrl:
        effectiveData.bannerImage ||
        effectiveData.bannerUrl ||
        effectiveData.coverImage?.extraLarge ||
        "",
      genres: effectiveData.genres || ["Action"],
      status: effectiveData.status || "FINISHED",
      episodes: effectiveData.episodes || 24,
      rating: effectiveData.averageScore
        ? (effectiveData.averageScore / 10).toFixed(1)
        : effectiveData.rating || "9.0",
      year: effectiveData.seasonYear?.toString() || effectiveData.year || "2024",
      studio: effectiveData.studio || "Unknown Studio",
    };

    return <AnimeDetailsClient anime={formattedAnime} />;
  }

  if (retrying) {
    return (
      <div className="container mx-auto px-4 py-32 flex flex-col items-center justify-center text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary drop-shadow-[0_0_20px_rgba(225,29,72,0.6)] mb-4" />
        <h2 className="text-lg font-bold text-white mb-1">Connecting to AniList Feed...</h2>
        <p className="text-xs text-muted">Retrieving high-resolution series metadata</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-28 text-center max-w-lg">
      <div className="rounded-3xl border border-surface-border bg-surface/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex justify-center mb-4 text-4xl">📺</div>
        <h1 className="text-2xl font-black text-white mb-2">Anime Temporary Rate Limit</h1>
        <p className="text-xs text-neutral-300 mb-6 leading-relaxed">
          AniList is currently limiting requests for ID #{animeId} due to high traffic on Vercel. Please retry in a few seconds or explore trending shows.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={tryFetch}
            disabled={retrying}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-all disabled:opacity-50"
          >
            <RotateCcw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
            <span>{retrying ? "Retrying..." : "Retry Connection"}</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-surface hover:bg-surface-hover text-neutral-200 font-bold text-xs border border-surface-border transition-colors"
          >
            <Compass className="h-4 w-4" />
            <span>Explore Trending</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
