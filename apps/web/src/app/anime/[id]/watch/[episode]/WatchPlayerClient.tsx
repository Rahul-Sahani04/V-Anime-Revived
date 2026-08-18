"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { getAllGuestProgress, clearGuestProgress } from "@/lib/guestProgress";
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Heart,
  Tv,
  Volume2,
  List,
  Grid,
  Search,
  Share2,
  Sparkles,
  Info,
  CheckCircle2,
  Play,
  X,
  Layers,
  ArrowRight,
} from "lucide-react";

interface AnimeMetadata {
  id: string;
  title: string;
  romajiTitle?: string;
  description?: string;
  posterUrl: string;
  bannerUrl: string;
  genres: string[];
  status: string;
  episodes: number;
  rating: string;
  year: string;
  studio: string;
  format: string;
  relations?: Array<{
    id: number;
    title: { english?: string; romaji?: string };
    coverImage?: { medium?: string; large?: string; extraLarge?: string };
    relationType?: string;
    format?: string;
  }>;
}

interface WatchPlayerClientProps {
  animeId: string;
  episode: string;
  serverParam?: string;
  typeParam?: "sub" | "dub";
  availableServers: string[];
  anime: AnimeMetadata | null;
}

export function WatchPlayerClient({
  animeId,
  episode,
  serverParam,
  typeParam,
  availableServers,
  anime,
}: WatchPlayerClientProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const numAnimeId = parseInt(animeId, 10) || 0;
  const currentEpNum = parseInt(episode, 10) || 1;
  const prevEp = Math.max(1, currentEpNum - 1);
  const nextEp = currentEpNum + 1;

  // UI state
  const [showAmbientGlow, setShowAmbientGlow] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [episodeViewMode, setEpisodeViewMode] = useState<"grid" | "list">("grid");
  const [episodeSearchQuery, setEpisodeSearchQuery] = useState("");
  const [selectedChunkIndex, setSelectedChunkIndex] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  // Convex hooks for Preferences, Library & Status
  const userPreferences = useQuery(api.preferences.getUserPreferences);
  const updateUserPreferencesMutation = useMutation(api.preferences.updateUserPreferences);
  const animeStatus = useQuery(
    api.library.getAnimeUserStatus,
    numAnimeId > 0 ? { anilistId: numAnimeId } : "skip"
  );
  const toggleFavoriteMutation = useMutation(api.library.toggleFavorite);
  const toggleWatchlistMutation = useMutation(api.library.toggleWatchlist);
  const syncGuestProgressMutation = useMutation(api.progress.syncGuestProgress);
  const syncAniListAction = useAction(api.anilistSync.syncEpisodeProgressToAniList);

  // Active server & audio type resolution
  const server = serverParam || userPreferences?.preferredServer || "senshi";
  const type: "sub" | "dub" =
    (typeParam as "sub" | "dub") ||
    (userPreferences?.preferredLanguage as "sub" | "dub") ||
    "sub";
  const autoNext = userPreferences?.autoNext ?? true;
  const autoplay = userPreferences?.autoplay ?? true;

  // Total episodes derivation
  const totalEpisodes = Math.max(anime?.episodes || 24, currentEpNum);

  // Chunking episodes for large series (50 per page tab)
  const CHUNK_SIZE = 50;
  const totalChunks = Math.ceil(totalEpisodes / CHUNK_SIZE);
  const chunkTabs = useMemo(() => {
    return Array.from({ length: totalChunks }, (_, i) => {
      const start = i * CHUNK_SIZE + 1;
      const end = Math.min((i + 1) * CHUNK_SIZE, totalEpisodes);
      return { index: i, label: `${start}-${end}`, start, end };
    });
  }, [totalChunks, totalEpisodes]);

  // Set initial active chunk to contain the current episode
  useEffect(() => {
    const chunkIdx = Math.floor((currentEpNum - 1) / CHUNK_SIZE);
    setSelectedChunkIndex(chunkIdx);
  }, [currentEpNum]);

  // Filtered episodes based on search or chunk
  const visibleEpisodes = useMemo(() => {
    const all = Array.from({ length: totalEpisodes }, (_, i) => i + 1);
    if (episodeSearchQuery.trim()) {
      const q = episodeSearchQuery.trim();
      return all.filter((ep) => ep.toString().includes(q));
    }
    const currentTab = chunkTabs[selectedChunkIndex] || chunkTabs[0];
    if (!currentTab) return all;
    return all.filter((ep) => ep >= currentTab.start && ep <= currentTab.end);
  }, [totalEpisodes, episodeSearchQuery, chunkTabs, selectedChunkIndex]);

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
    if (isSignedIn && numAnimeId > 0) {
      syncAniListAction({
        anilistId: numAnimeId,
        episodeNumber: currentEpNum,
        completed: true,
      }).catch((err) => {
        console.error("AniList sync error:", err);
      });
    }

    if (autoNext) {
      setCountdown(5);
    }
  };

  const handlePlayNextImmediately = () => {
    setCountdown(null);
    router.push(`/anime/${animeId}/watch/${nextEp}?server=${server}&type=${type}`);
  };

  const handleCancelCountdown = () => {
    setCountdown(null);
  };

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const cleanDescription = anime?.description?.replace(/<[^>]*>?/gm, "") || "No synopsis available.";
  const displayTitle = anime?.title || `Anime #${animeId}`;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Top Header Bar: Breadcrumbs, Anime Title & Quick Actions */}
      <div className="border-b border-surface-border/60 bg-surface/40 backdrop-blur-md">
        <div className="container mx-auto px-4 lg:px-8 py-3.5 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Left: Breadcrumbs & Anime Identity */}
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
                <span>/</span>
                <Link href={`/anime/${animeId}`} className="hover:text-white transition-colors truncate max-w-[200px] sm:max-w-[300px]">
                  {displayTitle}
                </Link>
                <span>/</span>
                <span className="text-primary font-bold">Episode {episode}</span>
              </div>

              <div className="flex items-center gap-3">
                <h1 className="text-lg sm:text-xl font-black text-white truncate tracking-tight">
                  {displayTitle}
                </h1>
                <span className="shrink-0 px-2.5 py-0.5 rounded-md bg-primary/20 border border-primary/30 text-primary text-xs font-extrabold font-mono">
                  EP {episode}
                </span>
                {anime?.rating && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-surface px-2 py-0.5 rounded-md border border-surface-border">
                    ★ {anime.rating}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Quick Action Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Watchlist Action */}
              <button
                onClick={async () => {
                  if (numAnimeId > 0) await toggleWatchlistMutation({ anilistId: numAnimeId });
                }}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all ${
                  animeStatus?.isWatchlisted
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_rgba(225,29,72,0.35)]"
                    : "bg-surface hover:bg-surface-hover text-neutral-300 border-surface-border"
                }`}
                title="Add to Watchlist"
              >
                <Bookmark className={`h-3.5 w-3.5 ${animeStatus?.isWatchlisted ? "fill-current" : ""}`} />
                <span className="hidden sm:inline">{animeStatus?.isWatchlisted ? "In Watchlist" : "Watchlist"}</span>
              </button>

              {/* Favorite Action */}
              <button
                onClick={async () => {
                  if (numAnimeId > 0) await toggleFavoriteMutation({ anilistId: numAnimeId });
                }}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all ${
                  animeStatus?.isFavorite
                    ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                    : "bg-surface hover:bg-surface-hover text-neutral-300 border-surface-border"
                }`}
                title="Favorite Anime"
              >
                <Heart className={`h-3.5 w-3.5 ${animeStatus?.isFavorite ? "fill-current text-rose-500" : ""}`} />
                <span className="hidden sm:inline">{animeStatus?.isFavorite ? "Favorited" : "Favorite"}</span>
              </button>

              {/* Share Episode */}
              <button
                onClick={handleShare}
                className="relative flex items-center gap-1.5 rounded-xl bg-surface hover:bg-surface-hover px-3 py-1.5 text-xs font-bold text-neutral-300 border border-surface-border transition-colors"
                title="Share Episode Link"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Share</span>
                {shareToast && (
                  <span className="absolute -bottom-8 right-0 bg-neutral-900 border border-primary/40 text-primary text-[10px] px-2 py-0.5 rounded-md shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95">
                    Link Copied!
                  </span>
                )}
              </button>

              {/* Details Page Link */}
              <Link
                href={`/anime/${animeId}`}
                className="flex items-center gap-1.5 rounded-xl bg-surface hover:bg-surface-hover px-3 py-1.5 text-xs font-bold text-muted hover:text-white border border-surface-border transition-colors"
                title="View Full Series Details"
              >
                <Info className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Overview</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Video Theater Section */}
      <div className="relative w-full bg-black/95 py-4 lg:py-6 overflow-hidden border-b border-surface-border/60">
        {/* Ambient Glow behind player */}
        {showAmbientGlow && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 blur-3xl">
            <div className="h-[70%] w-[80%] rounded-full bg-primary" />
          </div>
        )}

        <div className="container relative z-10 mx-auto px-4 lg:px-8 max-w-7xl">
          {/* Main Video Player Container */}
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-neutral-950 shadow-2xl shadow-black border border-surface-border">
            <VideoPlayer
              animeId={animeId}
              episode={episode}
              server={server}
              type={type}
              autoplay={autoplay}
              animeTitle={displayTitle}
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

          {/* Quick Player Bar: Prev/Next Episode, Ambient Glow & Preferences */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {currentEpNum > 1 ? (
                <Link
                  href={`/anime/${animeId}/watch/${prevEp}?server=${server}&type=${type}`}
                  className="flex items-center gap-1.5 rounded-xl bg-surface hover:bg-surface-hover px-4 py-2 text-xs font-bold text-foreground border border-surface-border transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Prev Episode</span>
                </Link>
              ) : (
                <div className="flex items-center gap-1.5 rounded-xl bg-surface/40 px-4 py-2 text-xs font-semibold text-muted/50 border border-surface-border/40 cursor-not-allowed">
                  <ChevronLeft className="h-4 w-4" />
                  <span>First Episode</span>
                </div>
              )}

              <Link
                href={`/anime/${animeId}/watch/${nextEp}?server=${server}&type=${type}`}
                className="flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 px-4 py-2 text-xs font-bold text-primary-foreground transition-all shadow-[0_0_15px_rgba(225,29,72,0.35)]"
              >
                <span>Next Episode</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Quick Playback Automation Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAmbientGlow(!showAmbientGlow)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all ${
                  showAmbientGlow
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-surface text-muted border-surface-border hover:text-white"
                }`}
                title="Toggle Cinematic Ambient Glow"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ambient {showAmbientGlow ? "ON" : "OFF"}</span>
              </button>

              {isSignedIn && (
                <>
                  <button
                    onClick={() => {
                      updateUserPreferencesMutation({ autoplay: !autoplay }).catch(() => {});
                    }}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition-all ${
                      autoplay
                        ? "bg-surface text-neutral-200 border-surface-border"
                        : "bg-surface/50 text-muted border-surface-border/50"
                    }`}
                    title="Toggle Autoplay Stream"
                  >
                    Autoplay: {autoplay ? "ON" : "OFF"}
                  </button>

                  <button
                    onClick={() => {
                      updateUserPreferencesMutation({ autoNext: !autoNext }).catch(() => {});
                    }}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition-all ${
                      autoNext
                        ? "bg-surface text-neutral-200 border-surface-border"
                        : "bg-surface/50 text-muted border-surface-border/50"
                    }`}
                    title="Toggle Auto-Advance Next Episode"
                  >
                    Auto-Next: {autoNext ? "ON" : "OFF"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: 2-Column Responsive Layout */}
      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (65%): Anime Details, Synopsis, Streaming Servers & Audio */}
          <div className="lg:col-span-2 space-y-6">
            {/* Anime & Episode Overview Card */}
            <div className="rounded-2xl bg-surface/70 border border-surface-border p-6 shadow-xl space-y-5">
              <div className="flex items-start gap-4">
                {/* Poster Thumbnail */}
                {anime?.posterUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={anime.posterUrl}
                    alt={displayTitle}
                    className="hidden sm:block h-28 w-20 rounded-xl object-cover border border-surface-border shadow-md shrink-0"
                  />
                )}

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-primary/15 border border-primary/30 text-primary text-[11px] font-extrabold uppercase tracking-wide">
                      Episode {episode}
                    </span>
                    {anime?.format && (
                      <span className="px-2 py-0.5 rounded-md bg-surface border border-surface-border text-neutral-300 text-[11px] font-bold uppercase">
                        {anime.format}
                      </span>
                    )}
                    {anime?.status && (
                      <span className="px-2 py-0.5 rounded-md bg-surface border border-surface-border text-neutral-300 text-[11px] font-bold uppercase">
                        {anime.status}
                      </span>
                    )}
                    {anime?.year && (
                      <span className="px-2 py-0.5 rounded-md bg-surface border border-surface-border text-neutral-300 text-[11px] font-bold">
                        {anime.year}
                      </span>
                    )}
                    {anime?.studio && (
                      <span className="px-2 py-0.5 rounded-md bg-surface border border-surface-border text-neutral-300 text-[11px] font-semibold">
                        {anime.studio}
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-black text-white leading-snug">
                    {displayTitle}
                  </h2>
                  {anime?.romajiTitle && anime.romajiTitle !== displayTitle && (
                    <p className="text-xs font-semibold text-muted italic">
                      {anime.romajiTitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Synopsis / Description */}
              <div className="space-y-2">
                <p className={`text-xs text-neutral-300 leading-relaxed ${isDescriptionExpanded ? "" : "line-clamp-3"}`}>
                  {cleanDescription}
                </p>
                {cleanDescription.length > 180 && (
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="text-[11px] font-bold text-primary hover:underline"
                  >
                    {isDescriptionExpanded ? "Show Less" : "Read More"}
                  </button>
                )}
              </div>

              {/* Genres Pills */}
              {anime?.genres && anime.genres.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-surface-border/50">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted mr-1">
                    Genres:
                  </span>
                  {anime.genres.map((genre) => (
                    <Link
                      key={genre}
                      href={`/search?genres=${encodeURIComponent(genre)}`}
                      className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-hover text-neutral-300 hover:text-white text-[11px] font-semibold border border-surface-border transition-colors"
                    >
                      {genre}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Streaming Server & Audio Controls */}
            <div className="rounded-2xl bg-surface/70 border border-surface-border p-6 shadow-xl space-y-6">
              {/* Server Selector */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Tv className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
                      Fast Streaming Servers
                    </h3>
                  </div>
                  <span className="text-[11px] text-muted">Auto-fallback active</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {availableServers.map((s) => {
                    const isSelected = server === s;
                    return (
                      <Link
                        key={s}
                        href={`/anime/${animeId}/watch/${episode}?server=${s}&type=${type}`}
                        className={`flex items-center justify-between p-3 rounded-xl text-xs font-bold capitalize transition-all border ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(225,29,72,0.35)]"
                            : "bg-surface hover:bg-surface-hover text-neutral-300 border-surface-border hover:border-primary/40"
                        }`}
                      >
                        <span>{s}</span>
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 fill-current" />}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Audio Language Selection */}
              <div className="pt-4 border-t border-surface-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Volume2 className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
                    Audio Track Format
                  </h3>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/anime/${animeId}/watch/${episode}?server=${server}&type=sub`}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold uppercase transition-all border ${
                      type === "sub"
                        ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(225,29,72,0.35)]"
                        : "bg-surface hover:bg-surface-hover text-neutral-300 border-surface-border"
                    }`}
                  >
                    <span>🇯🇵 Japanese Subbed</span>
                  </Link>
                  <Link
                    href={`/anime/${animeId}/watch/${episode}?server=${server}&type=dub`}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold uppercase transition-all border ${
                      type === "dub"
                        ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(225,29,72,0.35)]"
                        : "bg-surface hover:bg-surface-hover text-neutral-300 border-surface-border"
                    }`}
                  >
                    <span>🇺🇸 English Dubbed</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Related Recommendations Carousel (if available) */}
            {anime?.relations && anime.relations.length > 0 && (
              <div className="rounded-2xl bg-surface/70 border border-surface-border p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
                      Related Franchise Anime
                    </h3>
                  </div>
                  <Link href={`/anime/${animeId}`} className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1">
                    <span>View all</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {anime.relations.slice(0, 4).map((rel) => {
                    const relTitle = rel.title?.english || rel.title?.romaji || "Related Anime";
                    const relImg = rel.coverImage?.large || rel.coverImage?.medium || "";
                    return (
                      <Link
                        key={rel.id}
                        href={`/anime/${rel.id}`}
                        className="group flex flex-col gap-2 rounded-xl bg-surface/50 p-2 border border-surface-border hover:border-primary/40 transition-all"
                      >
                        {relImg && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={relImg}
                            alt={relTitle}
                            className="aspect-[3/4] w-full rounded-lg object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          />
                        )}
                        <span className="text-xs font-bold text-neutral-200 line-clamp-1 group-hover:text-primary transition-colors">
                          {relTitle}
                        </span>
                        {rel.relationType && (
                          <span className="text-[10px] font-extrabold uppercase text-muted">
                            {rel.relationType.replace(/_/g, " ")}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (35%): Interactive Episode Browser & Navigator */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-surface/70 border border-surface-border p-5 shadow-xl flex flex-col">
              {/* Header & View Mode Switcher */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
                    Episodes
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-surface border border-surface-border text-[11px] font-mono font-bold text-muted">
                    {totalEpisodes}
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-surface rounded-xl p-0.5 border border-surface-border">
                  <button
                    onClick={() => setEpisodeViewMode("grid")}
                    className={`p-1.5 rounded-lg transition-colors ${
                      episodeViewMode === "grid" ? "bg-primary text-white" : "text-muted hover:text-white"
                    }`}
                    title="Grid View"
                  >
                    <Grid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setEpisodeViewMode("list")}
                    className={`p-1.5 rounded-lg transition-colors ${
                      episodeViewMode === "list" ? "bg-primary text-white" : "text-muted hover:text-white"
                    }`}
                    title="Detailed List View"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Episode Search Bar */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
                <input
                  type="text"
                  placeholder="Jump to episode #..."
                  value={episodeSearchQuery}
                  onChange={(e) => setEpisodeSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-surface border border-surface-border pl-8 pr-3 py-2 text-xs font-semibold text-white placeholder-muted focus:outline-none focus:border-primary/50"
                />
                {episodeSearchQuery && (
                  <button
                    onClick={() => setEpisodeSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Chunk Tabs for Large Shows (e.g. 1-50, 51-100) */}
              {totalChunks > 1 && !episodeSearchQuery && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar">
                  {chunkTabs.map((tab) => (
                    <button
                      key={tab.index}
                      onClick={() => setSelectedChunkIndex(tab.index)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-colors border ${
                        selectedChunkIndex === tab.index
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-surface text-muted border-surface-border hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Episode Items List / Grid */}
              <div className="max-h-[500px] overflow-y-auto pr-1 space-y-1.5">
                {visibleEpisodes.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted">
                    No episode found matching &quot;{episodeSearchQuery}&quot;
                  </div>
                ) : episodeViewMode === "grid" ? (
                  <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2">
                    {visibleEpisodes.map((epNum) => {
                      const isCurrent = epNum.toString() === episode;
                      return (
                        <Link
                          key={epNum}
                          href={`/anime/${animeId}/watch/${epNum}?server=${server}&type=${type}`}
                          className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl text-xs font-mono font-bold transition-all border ${
                            isCurrent
                              ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(225,29,72,0.45)] scale-105 z-10"
                              : "bg-surface hover:bg-surface-hover text-neutral-300 border-surface-border hover:border-primary/40"
                          }`}
                        >
                          <span>{epNum}</span>
                          {isCurrent && (
                            <span className="text-[9px] font-sans font-extrabold uppercase tracking-tight text-white/90">
                              Playing
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {visibleEpisodes.map((epNum) => {
                      const isCurrent = epNum.toString() === episode;
                      return (
                        <Link
                          key={epNum}
                          href={`/anime/${animeId}/watch/${epNum}?server=${server}&type=${type}`}
                          className={`flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all border ${
                            isCurrent
                              ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(225,29,72,0.35)]"
                              : "bg-surface hover:bg-surface-hover text-neutral-300 border-surface-border hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm">{epNum < 10 ? `0${epNum}` : epNum}</span>
                            <div className="flex flex-col">
                              <span>Episode {epNum}</span>
                              <span className="text-[10px] font-normal text-muted">Full HD • Sub & Dub</span>
                            </div>
                          </div>

                          {isCurrent ? (
                            <span className="flex items-center gap-1 text-[11px] font-extrabold text-white bg-black/30 px-2 py-0.5 rounded-md">
                              <Play className="h-3 w-3 fill-current" />
                              Playing
                            </span>
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
