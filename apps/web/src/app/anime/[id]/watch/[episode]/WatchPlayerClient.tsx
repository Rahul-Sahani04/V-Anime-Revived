"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { getAllGuestProgress, clearGuestProgress } from "@/lib/guestProgress";
import {
  ChevronLeft,
  ChevronRight,
  Tv,
  Volume2,
  List,
  Bookmark,
  Heart,
  Play,
  X,
} from "lucide-react";

interface WatchPlayerClientProps {
  animeId: string;
  episode: string;
  server: string;
  type: "sub" | "dub";
  availableServers: string[];
}

export function WatchPlayerClient({
  animeId,
  episode,
  server,
  type,
  availableServers,
}: WatchPlayerClientProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const numAnimeId = parseInt(animeId, 10) || 0;
  const currentEpNum = parseInt(episode, 10) || 1;
  const prevEp = Math.max(1, currentEpNum - 1);
  const nextEp = currentEpNum + 1;

  const [showAmbientGlow, setShowAmbientGlow] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Convex hooks for Library & Status
  const animeStatus = useQuery(
    api.library.getAnimeUserStatus,
    numAnimeId > 0 ? { anilistId: numAnimeId } : "skip"
  );
  const toggleFavoriteMutation = useMutation(api.library.toggleFavorite);
  const toggleWatchlistMutation = useMutation(api.library.toggleWatchlist);
  const syncGuestProgressMutation = useMutation(api.progress.syncGuestProgress);

  // Sync guest progress to Convex on login
  useEffect(() => {
    if (isSignedIn) {
      const guestItems = getAllGuestProgress();
      if (guestItems.length > 0) {
        syncGuestProgressMutation({ items: guestItems })
          .then(() => {
            clearGuestProgress();
          })
          .catch((err) => {
            console.error("Failed to sync guest progress to Convex", err);
          });
      }
    }
  }, [isSignedIn, syncGuestProgressMutation]);

  // Handle countdown timer for Auto-Next
  useEffect(() => {
    if (countdown === null) return;

    const timer = setTimeout(() => {
      if (countdown <= 1) {
        setCountdown(null);
        router.push(`/anime/${animeId}/watch/${nextEp}?server=${server}&type=${type}`);
      } else {
        setCountdown((prev) => (prev !== null ? prev - 1 : null));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, animeId, nextEp, server, type, router]);

  const handleEpisodeEnd = () => {
    // Start 5-second countdown to next episode
    setCountdown(5);
  };

  const handlePlayNextImmediately = () => {
    setCountdown(null);
    router.push(`/anime/${animeId}/watch/${nextEp}?server=${server}&type=${type}`);
  };

  const handleCancelCountdown = () => {
    setCountdown(null);
  };

  const totalEpisodes = 24; // Default standard count for selector
  const episodeList = Array.from({ length: totalEpisodes }, (_, i) => i + 1);

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      {/* Video Theater Section */}
      <div className="relative w-full bg-black/90 py-4 lg:py-6 overflow-hidden border-b border-surface-border/60">
        {/* Ambient Glow behind player */}
        {showAmbientGlow && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 blur-3xl">
            <div className="h-[70%] w-[80%] rounded-full bg-primary" />
          </div>
        )}

        <div className="container relative z-10 mx-auto px-4 lg:px-8 max-w-6xl">
          {/* Main Video Frame */}
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-neutral-950 shadow-2xl shadow-black border border-surface-border">
            <VideoPlayer
              animeId={animeId}
              episode={episode}
              server={server}
              type={type}
              onEpisodeEnd={handleEpisodeEnd}
            />

            {/* Auto-Next 5-Second Overlay Banner */}
            {countdown !== null && (
              <div className="absolute bottom-6 right-6 z-40 flex items-center gap-4 rounded-2xl bg-background/95 backdrop-blur-xl border border-primary/40 p-4 shadow-2xl shadow-black animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/20 border border-primary text-primary font-mono font-black text-sm">
                  {countdown}s
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-white">
                    Playing Next Episode {nextEp}
                  </span>
                  <span className="text-[11px] text-muted">Auto-advancing shortly</span>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={handlePlayNextImmediately}
                    className="flex items-center gap-1 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_12px_rgba(225,29,72,0.4)]"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>Play Now</span>
                  </button>
                  <button
                    onClick={handleCancelCountdown}
                    className="flex items-center justify-center h-7 w-7 rounded-xl bg-surface hover:bg-surface-hover text-muted hover:text-white border border-surface-border transition-colors"
                    title="Cancel auto-play"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Player Bar: Episode Navigation, Quick Actions & Ambient Toggle */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href={`/anime/${animeId}`}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Anime Details</span>
              </Link>
              <span className="text-surface-border">|</span>
              <span className="text-xs font-bold text-white">
                Episode {episode}
              </span>
            </div>

            {/* Quick Favorites & Watchlist Toggles */}
            <div className="flex items-center gap-2">
              {isSignedIn && (
                <>
                  <button
                    onClick={async () => {
                      if (numAnimeId > 0) await toggleWatchlistMutation({ anilistId: numAnimeId });
                    }}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                      animeStatus?.isWatchlisted
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-surface text-muted border-surface-border hover:text-white"
                    }`}
                    title="Toggle Watchlist"
                  >
                    <Bookmark className={`h-3 w-3 ${animeStatus?.isWatchlisted ? "fill-current" : ""}`} />
                    <span>{animeStatus?.isWatchlisted ? "Watchlisted" : "Watchlist"}</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (numAnimeId > 0) await toggleFavoriteMutation({ anilistId: numAnimeId });
                    }}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                      animeStatus?.isFavorite
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-surface text-muted border-surface-border hover:text-white"
                    }`}
                    title="Toggle Favorite"
                  >
                    <Heart className={`h-3 w-3 ${animeStatus?.isFavorite ? "fill-current text-primary" : ""}`} />
                    <span>{animeStatus?.isFavorite ? "Favorited" : "Favorite"}</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setShowAmbientGlow(!showAmbientGlow)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                  showAmbientGlow
                    ? "bg-primary/15 border-primary text-primary"
                    : "bg-surface text-muted border-surface-border hover:text-white"
                }`}
                title="Toggle Ambient Glow"
              >
                Ambient: {showAmbientGlow ? "ON" : "OFF"}
              </button>

              {currentEpNum > 1 && (
                <Link
                  href={`/anime/${animeId}/watch/${prevEp}?server=${server}&type=${type}`}
                  className="flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-hover transition-colors border border-surface-border"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Prev</span>
                </Link>
              )}

              <Link
                href={`/anime/${animeId}/watch/${nextEp}?server=${server}&type=${type}`}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_12px_rgba(225,29,72,0.3)]"
              >
                <span>Next Episode</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Settings & Episode Selector Container */}
      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Servers & Audio Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Servers Selector */}
            <div className="rounded-2xl bg-surface/70 border border-surface-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <Tv className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                  Streaming Server
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableServers.map((s) => {
                  const isSelected = server === s;
                  return (
                    <Link
                      key={s}
                      href={`/anime/${animeId}/watch/${episode}?server=${s}&type=${type}`}
                      className={`relative px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(225,29,72,0.35)]"
                          : "bg-surface hover:bg-surface-hover text-neutral-300 border border-surface-border"
                      }`}
                    >
                      {s}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Audio Language Selection */}
            <div className="rounded-2xl bg-surface/70 border border-surface-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <Volume2 className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                  Audio Track
                </h3>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/anime/${animeId}/watch/${episode}?server=${server}&type=sub`}
                  className={`px-5 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                    type === "sub"
                      ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(225,29,72,0.35)]"
                      : "bg-surface hover:bg-surface-hover text-neutral-300 border border-surface-border"
                  }`}
                >
                  Subbed (JP)
                </Link>
                <Link
                  href={`/anime/${animeId}/watch/${episode}?server=${server}&type=dub`}
                  className={`px-5 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                    type === "dub"
                      ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(225,29,72,0.35)]"
                      : "bg-surface hover:bg-surface-hover text-neutral-300 border border-surface-border"
                  }`}
                >
                  Dubbed (EN)
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Quick Episode Selector List */}
          <div className="rounded-2xl bg-surface/70 border border-surface-border p-5 flex flex-col h-[320px]">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <List className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                  All Episodes
                </h3>
              </div>
              <span className="text-[11px] font-mono text-muted">1-{totalEpisodes}</span>
            </div>

            {/* Scrollable Episode Number Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-2 overflow-y-auto pr-1">
              {episodeList.map((epNum) => {
                const isCurrent = epNum.toString() === episode;
                return (
                  <Link
                    key={epNum}
                    href={`/anime/${animeId}/watch/${epNum}?server=${server}&type=${type}`}
                    className={`flex items-center justify-center p-2 rounded-xl text-xs font-mono font-bold transition-all ${
                      isCurrent
                        ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(225,29,72,0.4)]"
                        : "bg-surface hover:bg-surface-hover text-neutral-300 border border-surface-border hover:border-primary/40"
                    }`}
                  >
                    {epNum}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
