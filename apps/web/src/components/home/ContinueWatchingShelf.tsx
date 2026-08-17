"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { AnimeCard } from "@/components/ui/AnimeCard";
import { getAllGuestProgress, GuestProgressItem } from "@/lib/guestProgress";
import { Play } from "lucide-react";

export function ContinueWatchingShelf() {
  const { isSignedIn } = useAuth();
  const serverProgress = useQuery(
    api.progress.getContinueWatching,
    isSignedIn ? {} : "skip"
  );

  const [guestItems] = useState<GuestProgressItem[]>(() => {
    if (typeof window === "undefined") return [];
    return getAllGuestProgress().filter((item) => !item.completed);
  });

  // If signed in, use server items; else use guest items
  const items = isSignedIn ? serverProgress || [] : guestItems;

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 lg:px-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/20">
            <Play className="h-4 w-4 fill-current" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Continue Watching
          </h2>
        </div>
        <span className="text-xs text-muted font-mono bg-surface px-2.5 py-1 rounded-full border border-surface-border">
          {items.length} in progress
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((anime) => {
          // If server progress item, title & posterUrl are hydrated
          const title = "title" in anime ? anime.title : `Anime #${anime.anilistId}`;
          const posterUrl = "posterUrl" in anime ? anime.posterUrl : "";
          const currentEp = "currentEpisode" in anime ? anime.currentEpisode : anime.episodeNumber;
          const progressPct =
            "progressPercentage" in anime
              ? anime.progressPercentage
              : Math.round(anime.percentage);
          const animeId = "id" in anime ? anime.id : anime.anilistId;

          return (
            <AnimeCard
              key={`${animeId}-${currentEp}`}
              id={animeId}
              title={title}
              posterUrl={posterUrl}
              currentEpisode={currentEp}
              progressPercentage={progressPct}
            />
          );
        })}
      </div>
    </section>
  );
}
