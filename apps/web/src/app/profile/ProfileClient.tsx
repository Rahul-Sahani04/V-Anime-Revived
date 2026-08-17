"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useAuth, useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Tv,
  Volume2,
  Play,
  FastForward,
  CheckCircle2,
  Heart,
  Bookmark,
  Clock,
  Sparkles,
  LogIn,
  ArrowRight,
  Settings,
  LogOut,
} from "lucide-react";

const AVAILABLE_SERVERS = [
  { id: "senshi", name: "Senshi (Fastest)", desc: "Low latency, fast M3U8 streaming" },
  { id: "anikoto", name: "Anikoto (HD)", desc: "High bitrate, multi-quality streams" },
  { id: "miruro", name: "Miruro (Reliable)", desc: "Stable fallback with multiple audio tracks" },
  { id: "anizone", name: "Anizone", desc: "Clean HLS stream feeds" },
  { id: "animeheaven", name: "AnimeHeaven", desc: "Classic high-speed CDN server" },
  { id: "reanime", name: "ReAnime", desc: "Alternate secondary source" },
  { id: "anineko", name: "AniNeko", desc: "Community mirrored server" },
];

export function ProfileClient() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  // Convex Queries
  const preferences = useQuery(api.preferences.getUserPreferences);
  const stats = useQuery(api.preferences.getUserStats);

  // Convex Mutation
  const updatePreferencesMutation = useMutation(api.preferences.updateUserPreferences);

  // Optimistic local override states
  const [localLanguage, setLocalLanguage] = useState<string | null>(null);
  const [localServer, setLocalServer] = useState<string | null>(null);
  const [localAutoplay, setLocalAutoplay] = useState<boolean | null>(null);
  const [localAutoNext, setLocalAutoNext] = useState<boolean | null>(null);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const preferredLanguage = localLanguage ?? preferences?.preferredLanguage ?? "sub";
  const preferredServer = localServer ?? preferences?.preferredServer ?? "senshi";
  const autoplay = localAutoplay ?? preferences?.autoplay ?? true;
  const autoNext = localAutoNext ?? preferences?.autoNext ?? true;

  const triggerToast = () => {
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
    }, 2000);
  };

  const handleUpdateLanguage = async (lang: "sub" | "dub") => {
    setLocalLanguage(lang);
    if (isSignedIn) {
      await updatePreferencesMutation({ preferredLanguage: lang });
      triggerToast();
    }
  };

  const handleUpdateServer = async (server: string) => {
    setLocalServer(server);
    if (isSignedIn) {
      await updatePreferencesMutation({ preferredServer: server });
      triggerToast();
    }
  };

  const handleToggleAutoplay = async () => {
    const newVal = !autoplay;
    setLocalAutoplay(newVal);
    if (isSignedIn) {
      await updatePreferencesMutation({ autoplay: newVal });
      triggerToast();
    }
  };

  const handleToggleAutoNext = async () => {
    const newVal = !autoNext;
    setLocalAutoNext(newVal);
    if (isSignedIn) {
      await updatePreferencesMutation({ autoNext: newVal });
      triggerToast();
    }
  };

  if (isLoaded && !isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <div className="rounded-2xl border border-surface-border bg-surface/70 backdrop-blur-xl p-8 shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30 mb-4">
            <LogIn className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Account Required</h1>
          <p className="text-xs sm:text-sm text-muted mb-6 leading-relaxed">
            Please sign in to view your profile, track lifetime anime streaming statistics, and customize default playback servers.
          </p>
          <button
            onClick={() => router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-all"
          >
            <span>Sign In to Continue</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 max-w-5xl pb-28">
      {/* Profile Header & Identity Card */}
      <div className="relative overflow-hidden rounded-3xl border border-surface-border bg-surface/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {user?.imageUrl ? (
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-2 border-primary/50 shadow-[0_0_25px_rgba(225,29,72,0.35)]">
                <Image
                  src={user.imageUrl}
                  alt={user.fullName || "Avatar"}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface border border-surface-border text-3xl font-black text-primary">
                {user?.firstName?.[0] || "V"}
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  {user?.fullName || user?.username || "Anime Fan"}
                </h1>
                <span className="rounded-full bg-primary/20 text-primary border border-primary/30 px-3 py-0.5 text-xs font-extrabold shadow-sm">
                  {stats?.rank || "Anime Novice 🌱"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted mt-1 font-mono">
                {user?.primaryEmailAddress?.emailAddress || "Registered Member"}
              </p>
            </div>
          </div>

          {/* Quick Sign Out Action */}
          <SignOutButton>
            <button className="flex items-center gap-2 rounded-xl bg-surface hover:bg-surface-hover text-muted hover:text-rose-400 border border-surface-border px-4 py-2 text-xs font-semibold transition-all">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </SignOutButton>
        </div>
      </div>

      {/* Lifetime Stats Dashboard */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
            Lifetime Streaming Statistics
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-surface-border bg-surface/60 p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-semibold">Episodes Watched</span>
              <Play className="h-4 w-4 text-primary" />
            </div>
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              {stats?.totalWatchedEpisodes || 0}
            </span>
          </div>

          <div className="rounded-2xl border border-surface-border bg-surface/60 p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-semibold">Hours Streamed</span>
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              {stats?.totalHoursWatched || 0}h
            </span>
          </div>

          <Link
            href="/library"
            className="group rounded-2xl border border-surface-border bg-surface/60 p-4 sm:p-5 flex flex-col justify-between hover:border-primary/40 hover:bg-surface transition-all"
          >
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-semibold group-hover:text-white">Watchlist</span>
              <Bookmark className="h-4 w-4 text-primary" />
            </div>
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              {stats?.totalWatchlist || 0}
            </span>
          </Link>

          <Link
            href="/library"
            className="group rounded-2xl border border-surface-border bg-surface/60 p-4 sm:p-5 flex flex-col justify-between hover:border-primary/40 hover:bg-surface transition-all"
          >
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-semibold group-hover:text-white">Favorites</span>
              <Heart className="h-4 w-4 text-primary fill-current" />
            </div>
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              {stats?.totalFavorites || 0}
            </span>
          </Link>
        </div>
      </div>

      {/* Streaming Preferences Settings */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
            Streaming & Playback Preferences
          </h2>
        </div>

        {/* Audio Track Selector */}
        <div className="rounded-2xl border border-surface-border bg-surface/70 p-6">
          <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-white mb-1">
                <Volume2 className="h-4 w-4 text-primary" />
                <span>Preferred Audio Track</span>
              </div>
              <p className="text-xs text-muted">
                Default audio track used when opening any anime episode.
              </p>
            </div>

            <div className="flex gap-2 bg-surface p-1 rounded-xl border border-surface-border">
              <button
                onClick={() => handleUpdateLanguage("sub")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  preferredLanguage === "sub"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted hover:text-white"
                }`}
              >
                Subbed (JP)
              </button>
              <button
                onClick={() => handleUpdateLanguage("dub")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  preferredLanguage === "dub"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted hover:text-white"
                }`}
              >
                Dubbed (EN)
              </button>
            </div>
          </div>
        </div>

        {/* Streaming Server Selector */}
        <div className="rounded-2xl border border-surface-border bg-surface/70 p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-white mb-1">
            <Tv className="h-4 w-4 text-primary" />
            <span>Default Streaming Server</span>
          </div>
          <p className="text-xs text-muted mb-4">
            Select your preferred primary video provider server.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {AVAILABLE_SERVERS.map((srv) => {
              const isSelected = preferredServer === srv.id;
              return (
                <button
                  key={srv.id}
                  onClick={() => handleUpdateServer(srv.id)}
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-primary/15 border-primary text-white shadow-[0_0_15px_rgba(225,29,72,0.25)]"
                      : "bg-surface border-surface-border text-muted hover:text-white hover:bg-surface-hover"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold capitalize text-white">{srv.name}</span>
                    {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <span className="text-[11px] text-muted">{srv.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Video Player Automation Toggles */}
        <div className="rounded-2xl border border-surface-border bg-surface/70 divide-y divide-surface-border">
          {/* Autoplay Video */}
          <div className="flex items-center justify-between p-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-white mb-1">
                <Play className="h-4 w-4 text-primary" />
                <span>Autoplay Video</span>
              </div>
              <p className="text-xs text-muted">
                Automatically start playback immediately when opening an episode.
              </p>
            </div>

            <button
              onClick={handleToggleAutoplay}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                autoplay ? "bg-primary shadow-[0_0_10px_rgba(225,29,72,0.5)]" : "bg-surface-border"
              }`}
            >
              <motion.div
                layout
                className="h-5 w-5 rounded-full bg-white shadow-md"
                style={{
                  position: "absolute",
                  top: "2px",
                  left: autoplay ? "22px" : "2px",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {/* Auto-Next Episode */}
          <div className="flex items-center justify-between p-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-white mb-1">
                <FastForward className="h-4 w-4 text-primary" />
                <span>Auto-Advance to Next Episode</span>
              </div>
              <p className="text-xs text-muted">
                Display a 5-second countdown to automatically play the next episode when current reaches 90%.
              </p>
            </div>

            <button
              onClick={handleToggleAutoNext}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                autoNext ? "bg-primary shadow-[0_0_10px_rgba(225,29,72,0.5)]" : "bg-surface-border"
              }`}
            >
              <motion.div
                layout
                className="h-5 w-5 rounded-full bg-white shadow-md"
                style={{
                  position: "absolute",
                  top: "2px",
                  left: autoNext ? "22px" : "2px",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Saved Floating Toast Notification */}
      <AnimatePresence>
        {showSavedToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-surface/95 backdrop-blur-xl border border-primary/40 px-4 py-3 text-xs font-bold text-white shadow-2xl shadow-black"
          >
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>Preferences Auto-Saved</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
