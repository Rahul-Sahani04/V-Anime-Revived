"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Play, Bookmark, Heart, Sparkles, Layers } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

interface AnimeDetailsClientProps {
  anime: {
    id: string;
    title: string;
    description: string;
    posterUrl: string;
    bannerUrl: string;
    genres: string[];
    status: string;
    episodes: number;
    rating?: string;
    year?: string;
    studio?: string;
  };
}

export function AnimeDetailsClient({ anime }: AnimeDetailsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"episodes" | "details">("episodes");
  const [episodeSearch, setEpisodeSearch] = useState("");

  const numId = parseInt(anime.id, 10) || 0;
  const { isSignedIn } = useAuth();

  const userStatus = useQuery(
    api.library.getAnimeUserStatus,
    numId > 0 ? { anilistId: numId } : "skip"
  );
  const toggleFavoriteMutation = useMutation(api.library.toggleFavorite);
  const toggleWatchlistMutation = useMutation(api.library.toggleWatchlist);

  const episodesList = Array.from({ length: anime.episodes }, (_, i) => ({
    number: i + 1,
    title: `Episode ${i + 1}`,
    duration: "24m",
  }));

  const filteredEpisodes = episodeSearch
    ? episodesList.filter((ep) =>
        ep.number.toString().includes(episodeSearch) || ep.title.toLowerCase().includes(episodeSearch.toLowerCase())
      )
    : episodesList;

  const handleToggleWatchlist = async () => {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (numId > 0) {
      await toggleWatchlistMutation({ anilistId: numId });
    }
  };

  const handleToggleFavorite = async () => {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (numId > 0) {
      await toggleFavoriteMutation({ anilistId: numId });
    }
  };

  return (
    <div className="flex flex-col pb-24">
      {/* Cinematic Banner Background */}
      <div className="relative h-[48vh] min-h-[340px] max-h-[500px] w-full overflow-hidden bg-background">
        <Image
          src={anime.bannerUrl}
          alt={anime.title}
          fill
          className="object-cover object-top opacity-50 mix-blend-luminosity brightness-90"
          priority
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
      </div>

      {/* Main Content Info */}
      <div className="container relative z-20 mx-auto px-4 lg:px-8 -mt-36">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
          {/* Anime Poster with Hover Glow */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-48 sm:w-56 md:w-64 shrink-0 mx-auto md:mx-0"
          >
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-surface-border/80 bg-surface shadow-2xl shadow-black/80">
              <Image
                src={anime.posterUrl}
                alt={anime.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute top-3 left-3 rounded-lg bg-background/80 backdrop-blur-md px-2 py-1 text-xs font-mono font-bold text-primary border border-primary/20">
                ★ {anime.rating || "9.0"}
              </div>
            </div>

            {/* Quick Mobile Action Buttons */}
            <div className="mt-4 flex flex-col gap-2 md:hidden">
              <Link
                href={`/anime/${anime.id}/watch/1`}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Watch Ep 1</span>
              </Link>
              <div className="flex gap-2">
                <button
                  onClick={handleToggleWatchlist}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold border transition-all ${
                    userStatus?.isWatchlisted
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-surface border-surface-border text-foreground"
                  }`}
                >
                  <Bookmark className={`h-3.5 w-3.5 ${userStatus?.isWatchlisted ? "fill-current" : ""}`} />
                  <span>{userStatus?.isWatchlisted ? "Saved" : "Watchlist"}</span>
                </button>
                <button
                  onClick={handleToggleFavorite}
                  className={`flex items-center justify-center px-4 rounded-xl py-2.5 text-xs font-bold border transition-all ${
                    userStatus?.isFavorite
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-surface border-surface-border text-foreground"
                  }`}
                >
                  <Heart className={`h-3.5 w-3.5 ${userStatus?.isFavorite ? "fill-current" : ""}`} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Details & Info Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex-1 flex flex-col justify-end pt-2"
          >
            {/* Tags / Metadata */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="rounded-md bg-primary/15 text-primary border border-primary/30 px-2.5 py-0.5 text-xs font-semibold">
                {anime.status}
              </span>
              <span className="rounded-md bg-surface px-2.5 py-0.5 text-xs font-semibold text-neutral-300 border border-surface-border">
                {anime.episodes} Episodes
              </span>
              <span className="rounded-md bg-surface px-2.5 py-0.5 text-xs font-semibold text-neutral-300 border border-surface-border">
                HD 1080p
              </span>
              <span className="rounded-md bg-surface px-2.5 py-0.5 text-xs font-semibold text-neutral-300 border border-surface-border">
                Sub & Dub
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
              {anime.title}
            </h1>

            {/* Genre Pills */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {anime.genres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-full bg-surface/70 px-3 py-1 text-xs font-medium text-muted border border-surface-border/60 hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-4 mb-8">
              <Link
                href={`/anime/${anime.id}/watch/1`}
                className="group flex items-center gap-2.5 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground transition-all duration-300 hover:scale-105 hover:bg-primary/90 shadow-[0_0_25px_rgba(225,29,72,0.4)]"
              >
                <Play className="h-4 w-4 fill-current transition-transform duration-300 group-hover:scale-110" />
                <span>Start Watching Episode 1</span>
              </Link>

              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleToggleWatchlist}
                className={`flex items-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold border transition-all ${
                  userStatus?.isWatchlisted
                    ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(225,29,72,0.3)]"
                    : "bg-surface border-surface-border text-foreground hover:bg-surface-hover"
                }`}
              >
                <Bookmark className={`h-4 w-4 ${userStatus?.isWatchlisted ? "fill-current" : ""}`} />
                <span>{userStatus?.isWatchlisted ? "In Watchlist" : "Add to Watchlist"}</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleToggleFavorite}
                className={`flex items-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold border transition-all ${
                  userStatus?.isFavorite
                    ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(225,29,72,0.3)]"
                    : "bg-surface border-surface-border text-foreground hover:bg-surface-hover"
                }`}
                title="Favorite"
              >
                <Heart className={`h-4 w-4 ${userStatus?.isFavorite ? "fill-current" : ""}`} />
                <span>{userStatus?.isFavorite ? "Favorited" : "Favorite"}</span>
              </motion.button>
            </div>

            {/* Synopsis Preview */}
            <div className="max-w-3xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary" />
                Synopsis
              </h3>
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                {anime.description}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation (Episodes / Details) */}
        <div className="mt-14 border-b border-surface-border">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setActiveTab("episodes")}
              className={`relative pb-3 text-sm font-bold transition-colors ${
                activeTab === "episodes" ? "text-white" : "text-muted hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Episodes ({anime.episodes})
              </span>
              {activeTab === "episodes" && (
                <motion.div
                  layoutId="anime-detail-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(225,29,72,0.8)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab("details")}
              className={`relative pb-3 text-sm font-bold transition-colors ${
                activeTab === "details" ? "text-white" : "text-muted hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                More Details
              </span>
              {activeTab === "details" && (
                <motion.div
                  layoutId="anime-detail-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(225,29,72,0.8)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {activeTab === "episodes" ? (
              <motion.div
                key="episodes-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                {/* Episode Filter Bar */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-muted font-medium">Select an episode to stream</span>
                  <input
                    type="text"
                    placeholder="Search ep #..."
                    value={episodeSearch}
                    onChange={(e) => setEpisodeSearch(e.target.value)}
                    className="w-36 sm:w-48 rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Episode Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {filteredEpisodes.map((ep) => (
                    <Link
                      key={ep.number}
                      href={`/anime/${anime.id}/watch/${ep.number}`}
                      className="group relative flex flex-col items-center justify-center p-3 rounded-xl bg-surface border border-surface-border hover:border-primary/60 hover:bg-surface-hover transition-all duration-200 hover:-translate-y-1 shadow-sm"
                    >
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-surface-hover group-hover:bg-primary text-muted group-hover:text-primary-foreground transition-colors mb-1.5">
                        <Play className="h-3.5 w-3.5 fill-current translate-x-0.5" />
                      </div>
                      <span className="text-xs font-bold text-foreground group-hover:text-primary">
                        EP {ep.number}
                      </span>
                      <span className="text-[10px] text-muted">{ep.duration}</span>
                    </Link>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="details-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl"
              >
                <div className="p-4 rounded-xl bg-surface border border-surface-border">
                  <span className="text-xs text-muted block mb-1">Status</span>
                  <p className="text-sm font-semibold text-foreground">{anime.status}</p>
                </div>
                <div className="p-4 rounded-xl bg-surface border border-surface-border">
                  <span className="text-xs text-muted block mb-1">Episodes</span>
                  <p className="text-sm font-semibold text-foreground">{anime.episodes} Episodes</p>
                </div>
                <div className="p-4 rounded-xl bg-surface border border-surface-border">
                  <span className="text-xs text-muted block mb-1">Community Score</span>
                  <p className="text-sm font-semibold text-primary">★ {anime.rating || "9.0"} / 10</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
