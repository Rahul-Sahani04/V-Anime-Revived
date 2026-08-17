"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { getAllGuestProgress, GuestProgressItem } from "@/lib/guestProgress";
import {
  Play,
  Bookmark,
  Heart,
  History,
  Trash2,
  Search,
  Sparkles,
  LogIn,
  ArrowRight,
  Tv,
} from "lucide-react";
import { Id } from "@convex/_generated/dataModel";

type LibraryTab = "continue" | "watchlist" | "favorites" | "history";

export function LibraryClient() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<LibraryTab>("continue");
  const [searchQuery, setSearchQuery] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Guest localStorage fallback
  const [guestProgress] = useState<GuestProgressItem[]>(() => {
    if (typeof window === "undefined") return [];
    return getAllGuestProgress();
  });

  // Convex Queries (active when signed in)
  const continueWatching = useQuery(
    api.progress.getContinueWatching,
    isSignedIn ? {} : "skip"
  );
  const libraryData = useQuery(
    api.library.getLibrary,
    isSignedIn ? {} : "skip"
  );
  const watchHistory = useQuery(
    api.progress.getWatchHistory,
    isSignedIn ? {} : "skip"
  );

  // Convex Mutations
  const toggleFavoriteMutation = useMutation(api.library.toggleFavorite);
  const toggleWatchlistMutation = useMutation(api.library.toggleWatchlist);
  const dismissProgressMutation = useMutation(api.progress.dismissWatchProgress);
  const removeHistoryItemMutation = useMutation(api.progress.removeHistoryItem);
  const clearHistoryMutation = useMutation(api.progress.clearWatchHistory);

  const activeContinueWatching = isSignedIn ? continueWatching || [] : guestProgress.filter((i) => !i.completed);
  const favorites = isSignedIn ? libraryData?.favorites || [] : [];
  const watchlist = isSignedIn ? libraryData?.watchlist || [] : [];
  const history = isSignedIn ? watchHistory || [] : [];

  const handleDismissContinue = async (anilistId: number, episodeNumber?: number) => {
    if (isSignedIn) {
      await dismissProgressMutation({ anilistId, episodeNumber });
    }
  };

  const handleRemoveFavorite = async (anilistId: number) => {
    if (isSignedIn) {
      await toggleFavoriteMutation({ anilistId });
    }
  };

  const handleRemoveWatchlist = async (anilistId: number) => {
    if (isSignedIn) {
      await toggleWatchlistMutation({ anilistId });
    }
  };

  const handleRemoveHistoryItem = async (historyId: string) => {
    if (isSignedIn) {
      await removeHistoryItemMutation({ historyId: historyId as Id<"watchHistory"> });
    }
  };

  const handleClearAllHistory = async () => {
    if (isSignedIn) {
      await clearHistoryMutation({});
      setShowClearConfirm(false);
    }
  };

  // Date formatter for History
  const formatHistoryDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (isToday) return `Today at ${timeStr}`;
    return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} at ${timeStr}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 max-w-6xl pb-24">
      {/* Header & User Profile Bar */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-surface-border pb-8">
        <div className="flex items-center gap-4">
          {user?.imageUrl ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl border-2 border-primary/40 shadow-[0_0_20px_rgba(225,29,72,0.3)]">
              <Image
                src={user.imageUrl}
                alt={user.fullName || "User"}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface border border-surface-border text-2xl font-black text-primary">
              {user?.firstName?.[0] || "V"}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {isSignedIn ? (user?.fullName || user?.username || "My Anime Library") : "Guest Library"}
              </h1>
              <span className="rounded-md bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                {isSignedIn ? "Synced" : "Local Device"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted mt-1">
              {isSignedIn
                ? "Your personal anime headquarters, synced seamlessly across all devices."
                : "Viewing playback saved locally on this browser."}
            </p>
          </div>
        </div>

        {/* Global Search within Library */}
        <div className="relative w-full md:w-72">
          <input
            id="library-search-input"
            name="library-search"
            aria-label="Search saved titles"
            type="text"
            placeholder="Search saved titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-surface-border bg-surface py-2.5 pl-10 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted pointer-events-none" />
        </div>
      </div>

      {/* Guest Warning & Sign-In Callout */}
      {isLoaded && !isSignedIn && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-surface/80 border border-primary/30 p-5 shadow-xl"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
              <LogIn className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Sign in to unlock Cloud Sync & Favorites</p>
              <p className="text-xs text-muted">
                Your guest playback will automatically sync to your account when you log in.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`)}
            className="shrink-0 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-all"
          >
            <span>Sign In / Create Account</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}

      {/* Library Tabs Bar */}
      <div className="mb-8 flex items-center justify-between border-b border-surface-border pb-3 overflow-x-auto">
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            onClick={() => setActiveTab("continue")}
            className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "continue"
                ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(225,29,72,0.35)]"
                : "text-muted hover:text-white hover:bg-surface"
            }`}
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Continue Watching</span>
            <span className="rounded-full bg-background/40 px-2 py-0.2 text-[10px] font-mono">
              {activeContinueWatching.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("watchlist")}
            className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "watchlist"
                ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(225,29,72,0.35)]"
                : "text-muted hover:text-white hover:bg-surface"
            }`}
          >
            <Bookmark className="h-4 w-4" />
            <span>Watchlist</span>
            <span className="rounded-full bg-background/40 px-2 py-0.2 text-[10px] font-mono">
              {watchlist.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("favorites")}
            className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "favorites"
                ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(225,29,72,0.35)]"
                : "text-muted hover:text-white hover:bg-surface"
            }`}
          >
            <Heart className="h-4 w-4" />
            <span>Favorites</span>
            <span className="rounded-full bg-background/40 px-2 py-0.2 text-[10px] font-mono">
              {favorites.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "history"
                ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(225,29,72,0.35)]"
                : "text-muted hover:text-white hover:bg-surface"
            }`}
          >
            <History className="h-4 w-4" />
            <span>History</span>
            <span className="rounded-full bg-background/40 px-2 py-0.2 text-[10px] font-mono">
              {history.length}
            </span>
          </button>
        </div>

        {/* Clear History Button in History Tab */}
        {activeTab === "history" && history.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:text-rose-400 border border-surface-border transition-colors shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Tab Content Display */}
      <AnimatePresence mode="wait">
        {/* Tab 1: Continue Watching */}
        {activeTab === "continue" && (
          <motion.div
            key="continue-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {activeContinueWatching.length === 0 ? (
              <div className="rounded-2xl border border-surface-border bg-surface/50 p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface border border-surface-border text-muted mb-4">
                  <Play className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">No In-Progress Anime</h3>
                <p className="text-xs text-muted mb-6 max-w-sm mx-auto">
                  When you start watching episodes, your timestamps will appear here so you can pick up where you left off.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)]"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Explore Trending Series</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {activeContinueWatching
                  .filter((item) => {
                    const title = "title" in item ? item.title : `Anime #${item.anilistId}`;
                    return title.toLowerCase().includes(searchQuery.toLowerCase());
                  })
                  .map((item) => {
                    const title = "title" in item ? item.title : `Anime #${item.anilistId}`;
                    const posterUrl = "posterUrl" in item ? item.posterUrl : "";
                    const ep = "currentEpisode" in item ? item.currentEpisode : item.episodeNumber;
                    const pct = "progressPercentage" in item ? item.progressPercentage : Math.round(item.percentage);
                    const animeId = "id" in item ? item.id : item.anilistId;

                    return (
                      <div key={`${animeId}-${ep}`} className="group relative flex flex-col">
                        {/* Poster Container */}
                        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-surface-border bg-surface shadow-md">
                          {posterUrl ? (
                            <Image
                              src={posterUrl}
                              alt={title}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-full w-full bg-surface" />
                          )}

                          {/* Progress Bar Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/70">
                            <div
                              className="h-full bg-primary shadow-[0_0_8px_rgba(225,29,72,0.8)]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          {/* Episode Badge */}
                          <div className="absolute top-2 left-2 rounded-md bg-background/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono font-bold text-white border border-surface-border">
                            EP {ep}
                          </div>

                          {/* Quick Hover Dismiss Button */}
                          <button
                            onClick={() => handleDismissContinue(animeId, ep)}
                            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 backdrop-blur-md text-muted hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity border border-surface-border"
                            title="Dismiss from Continue Watching"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Hover Play Button */}
                          <Link
                            href={`/anime/${animeId}/watch/${ep}`}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                              <Play className="h-5 w-5 fill-current translate-x-0.5" />
                            </div>
                          </Link>
                        </div>

                        {/* Title & Progress Label */}
                        <div className="mt-2 flex flex-col">
                          <Link
                            href={`/anime/${animeId}`}
                            className="text-xs font-bold text-foreground hover:text-primary transition-colors line-clamp-1"
                          >
                            {title}
                          </Link>
                          <div className="flex items-center justify-between text-[11px] text-muted mt-0.5">
                            <span>Episode {ep}</span>
                            <span className="font-mono text-primary font-semibold">{pct}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 2: Watchlist */}
        {activeTab === "watchlist" && (
          <motion.div
            key="watchlist-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {watchlist.length === 0 ? (
              <div className="rounded-2xl border border-surface-border bg-surface/50 p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface border border-surface-border text-muted mb-4">
                  <Bookmark className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Your Watchlist is Empty</h3>
                <p className="text-xs text-muted mb-6 max-w-sm mx-auto">
                  Bookmark series you plan to watch later by clicking the Bookmark icon on any anime card or details page.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)]"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Discover Shows</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {watchlist
                  .filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((item) => (
                    <div key={item.id} className="group relative flex flex-col">
                      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-surface-border bg-surface shadow-md">
                        {item.posterUrl ? (
                          <Image
                            src={item.posterUrl}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full bg-surface" />
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-2 left-2 rounded-md bg-background/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-neutral-300 border border-surface-border">
                          {item.status || "TV"}
                        </div>

                        {/* Remove Watchlist Action */}
                        <button
                          onClick={() => handleRemoveWatchlist(item.id)}
                          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 backdrop-blur-md text-muted hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity border border-surface-border"
                          title="Remove from Watchlist"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        <Link
                          href={`/anime/${item.id}`}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                            <Play className="h-5 w-5 fill-current translate-x-0.5" />
                          </div>
                        </Link>
                      </div>

                      <div className="mt-2 flex flex-col">
                        <Link
                          href={`/anime/${item.id}`}
                          className="text-xs font-bold text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {item.title}
                        </Link>
                        <span className="text-[10px] text-muted mt-0.5 line-clamp-1">
                          {item.genres?.slice(0, 2).join(", ") || "Anime"}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 3: Favorites */}
        {activeTab === "favorites" && (
          <motion.div
            key="favorites-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {favorites.length === 0 ? (
              <div className="rounded-2xl border border-surface-border bg-surface/50 p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface border border-surface-border text-muted mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">No Favorite Anime Yet</h3>
                <p className="text-xs text-muted mb-6 max-w-sm mx-auto">
                  Click the heart icon on any series you love to feature them in your favorites showcase.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)]"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Browse Masterpieces</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {favorites
                  .filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((item) => (
                    <div key={item.id} className="group relative flex flex-col">
                      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-surface-border bg-surface shadow-md">
                        {item.posterUrl ? (
                          <Image
                            src={item.posterUrl}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full bg-surface" />
                        )}

                        {/* Favorite Heart Badge */}
                        <div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-md bg-primary/20 backdrop-blur-md border border-primary/30 text-primary">
                          <Heart className="h-3.5 w-3.5 fill-current" />
                        </div>

                        {/* Remove Favorite Button */}
                        <button
                          onClick={() => handleRemoveFavorite(item.id)}
                          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 backdrop-blur-md text-muted hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity border border-surface-border"
                          title="Remove from Favorites"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        <Link
                          href={`/anime/${item.id}`}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                            <Play className="h-5 w-5 fill-current translate-x-0.5" />
                          </div>
                        </Link>
                      </div>

                      <div className="mt-2 flex flex-col">
                        <Link
                          href={`/anime/${item.id}`}
                          className="text-xs font-bold text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {item.title}
                        </Link>
                        <span className="text-[10px] text-muted mt-0.5 line-clamp-1">
                          {item.genres?.slice(0, 2).join(", ") || "Anime"}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 4: History */}
        {activeTab === "history" && (
          <motion.div
            key="history-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {history.length === 0 ? (
              <div className="rounded-2xl border border-surface-border bg-surface/50 p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface border border-surface-border text-muted mb-4">
                  <History className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">No Watch History</h3>
                <p className="text-xs text-muted mb-6 max-w-sm mx-auto">
                  Completed and watched episodes will appear in your timeline here.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)]"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Start Watching</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {history
                  .filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((item) => (
                    <div
                      key={item.historyId}
                      className="group flex items-center justify-between gap-4 rounded-xl border border-surface-border bg-surface/60 p-3.5 hover:bg-surface hover:border-surface-border/80 transition-all"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg border border-surface-border bg-surface">
                          {item.posterUrl && (
                            <Image
                              src={item.posterUrl}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>

                        <div className="flex flex-col">
                          <Link
                            href={`/anime/${item.id}`}
                            className="text-xs sm:text-sm font-bold text-white hover:text-primary transition-colors line-clamp-1"
                          >
                            {item.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted">
                            <span className="font-mono font-bold text-foreground">
                              Episode {item.episodeNumber}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 capitalize">
                              <Tv className="h-3 w-3 text-primary" />
                              {item.server}
                            </span>
                            <span>•</span>
                            <span>{formatHistoryDate(item.watchedAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/anime/${item.id}/watch/${item.episodeNumber}?server=${item.server}`}
                          className="flex items-center gap-1.5 rounded-lg bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground px-3 py-1.5 text-xs font-bold transition-all border border-primary/30"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span className="hidden sm:inline">Replay</span>
                        </Link>

                        <button
                          onClick={() => handleRemoveHistoryItem(item.historyId)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface hover:bg-surface-hover text-muted hover:text-rose-400 border border-surface-border transition-colors"
                          title="Delete from history"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-surface-border bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Clear Watch History?</h3>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              This will permanently delete all watched episode logs from your account. This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="rounded-xl bg-surface px-4 py-2 text-xs font-semibold text-muted hover:text-white border border-surface-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllHistory}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-lg"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
