"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useAuth, useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery, useMutation, useAction } from "convex/react";
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
  RefreshCw,
  Unlink,
  ExternalLink,
  ShieldCheck,
  X,
  Loader2,
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
  const anilistAccount = useQuery(api.anilistSync.getAniListAccount);

  // Convex Mutations & Actions
  const updatePreferencesMutation = useMutation(api.preferences.updateUserPreferences);
  const connectTokenAction = useAction(api.anilistSync.connectAniListToken);
  const disconnectMutation = useMutation(api.anilistSync.disconnectAniListAccount);
  const toggleAutoSyncMutation = useMutation(api.anilistSync.toggleAutoSync);
  const importCollectionAction = useAction(api.anilistSync.importAniListCollection);

  // Optimistic local override states
  const [localLanguage, setLocalLanguage] = useState<string | null>(null);
  const [localServer, setLocalServer] = useState<string | null>(null);
  const [localAutoplay, setLocalAutoplay] = useState<boolean | null>(null);
  const [localAutoNext, setLocalAutoNext] = useState<boolean | null>(null);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // AniList Connection Modal State
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{ totalImported: number } | null>(null);

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

  // Auto-connect if URL contains AniList OAuth token in hash (e.g. #access_token=eyJ...)
  useEffect(() => {
    if (typeof window === "undefined" || !isSignedIn) return;
    const hash = window.location.hash;
    if (hash && hash.includes("access_token=")) {
      const match = hash.match(/access_token=([^&]+)/);
      if (match && match[1]) {
        const token = decodeURIComponent(match[1]);
        window.history.replaceState(null, "", window.location.pathname);
        connectTokenAction({ accessToken: token })
          .then(() => {
            triggerToast();
          })
          .catch((err) => {
            console.error("Auto-connect AniList failed:", err);
          });
      }
    }
  }, [isSignedIn, connectTokenAction]);

  // AniList Connect Handler
  const handleConnectAniList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsConnecting(true);
    setConnectError(null);
    try {
      await connectTokenAction({ accessToken: tokenInput.trim() });
      setShowTokenDialog(false);
      setTokenInput("");
      triggerToast();
    } catch (err: unknown) {
      setConnectError(err instanceof Error ? err.message : "Failed to connect to AniList");
    } finally {
      setIsConnecting(false);
    }
  };

  // AniList Import Handler
  const handleImportCollection = async () => {
    setIsImporting(true);
    try {
      const result = await importCollectionAction({});
      setImportSummary({ totalImported: result.totalImported });
    } catch (err) {
      console.error("AniList import error:", err);
    } finally {
      setIsImporting(false);
    }
  };

  // AniList AutoSync Toggle Handler
  const handleToggleAniListAutoSync = async () => {
    if (!anilistAccount) return;
    await toggleAutoSyncMutation({
      autoSyncProgress: !anilistAccount.autoSyncProgress,
    });
    triggerToast();
  };

  // AniList Disconnect Handler
  const handleDisconnectAniList = async () => {
    if (confirm("Are you sure you want to disconnect your AniList account?")) {
      await disconnectMutation({});
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
          <h2 className="text-2xl font-black text-white mb-2">Account Required</h2>
          <p className="text-xs sm:text-sm text-muted mb-6 leading-relaxed">
            Please sign in to view your profile, track lifetime anime streaming statistics, sync AniList watchlists, and customize default playback servers.
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

      {/* AniList Integration Card */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-4 w-4 text-[#02a9ff]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
            AniList Account Synchronization
          </h2>
        </div>

        <div className="rounded-2xl border border-[#02a9ff]/25 bg-surface/70 backdrop-blur-xl p-6 shadow-xl">
          {anilistAccount ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                {anilistAccount.anilistAvatar ? (
                  <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-[#02a9ff]/50">
                    <Image
                      src={anilistAccount.anilistAvatar}
                      alt={anilistAccount.anilistUsername}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#02a9ff]/20 text-[#02a9ff] font-bold text-xl">
                    AL
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">
                      @{anilistAccount.anilistUsername}
                    </span>
                    <span className="rounded-full bg-[#02a9ff]/20 text-[#02a9ff] border border-[#02a9ff]/40 px-2 py-0.5 text-[10px] font-bold">
                      Synced
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    {anilistAccount.lastSyncedAt
                      ? `Last synced ${new Date(anilistAccount.lastSyncedAt).toLocaleDateString()}`
                      : "Ready to sync"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleImportCollection}
                  disabled={isImporting}
                  className="flex items-center gap-2 rounded-xl bg-[#02a9ff] hover:bg-[#02a9ff]/90 px-4 py-2 text-xs font-bold text-white transition-all shadow-[0_0_15px_rgba(2,169,255,0.35)] disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isImporting ? "animate-spin" : ""}`} />
                  <span>{isImporting ? "Importing..." : "Sync Watchlist Now"}</span>
                </button>

                <button
                  onClick={handleToggleAniListAutoSync}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                    anilistAccount.autoSyncProgress
                      ? "bg-[#02a9ff]/15 border-[#02a9ff]/40 text-[#02a9ff]"
                      : "bg-surface border-surface-border text-muted hover:text-white"
                  }`}
                >
                  <span>Auto-Push Episodes: {anilistAccount.autoSyncProgress ? "ON" : "OFF"}</span>
                </button>

                <button
                  onClick={handleDisconnectAniList}
                  className="flex items-center gap-1.5 rounded-xl bg-surface hover:bg-surface-hover text-muted hover:text-rose-400 border border-surface-border px-3 py-2 text-xs font-semibold transition-colors"
                  title="Disconnect AniList"
                >
                  <Unlink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="max-w-xl">
                <h3 className="text-base font-bold text-white mb-1">
                  Connect your AniList Account
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  Seamlessly import your planning and watching lists from AniList, and automatically sync episode progress in real-time as you stream on V-Anime.
                </p>
              </div>

              <button
                onClick={() => setShowTokenDialog(true)}
                className="flex items-center gap-2 rounded-xl bg-[#02a9ff] hover:bg-[#02a9ff]/90 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-[0_0_15px_rgba(2,169,255,0.35)] shrink-0"
              >
                <span>Connect AniList</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
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

      {/* AniList Connection Dialog Modal */}
      <AnimatePresence>
        {showTokenDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTokenDialog(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl shadow-black z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#02a9ff]/20 text-[#02a9ff] font-bold text-sm">
                    AL
                  </div>
                  <h3 className="text-base font-bold text-white">Connect AniList Account</h3>
                </div>
                <button
                  onClick={() => setShowTokenDialog(false)}
                  className="rounded-lg p-1 text-muted hover:bg-surface-hover hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 1-Click OAuth Authorize Button */}
                <div className="rounded-xl bg-[#02a9ff]/10 border border-[#02a9ff]/30 p-4 text-center space-y-3">
                  <p className="text-xs text-neutral-200 leading-relaxed">
                    Authorize V-Anime using your configured AniList Client (ID: <code className="text-[#02a9ff] font-mono">48831</code>):
                  </p>
                  <a
                    href="https://anilist.co/api/v2/oauth/authorize?client_id=48831&response_type=token"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#02a9ff] hover:bg-[#02a9ff]/90 px-6 py-2.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(2,169,255,0.4)] transition-all w-full"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>1-Click Authorize with AniList</span>
                  </a>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-muted justify-center">
                  <span className="h-px flex-1 bg-surface-border" />
                  <span>OR PASTE TOKEN / REDIRECT URL</span>
                  <span className="h-px flex-1 bg-surface-border" />
                </div>

                <form onSubmit={handleConnectAniList} className="space-y-4">
                  <div>
                    <label
                      htmlFor="anilist-token-input"
                      className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5 block"
                    >
                      AniList Access Token or Redirect URL
                    </label>
                    <input
                      id="anilist-token-input"
                      name="anilist-token"
                      aria-label="AniList Access Token"
                      type="password"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="Paste access token (eyJ...) or full redirect URL..."
                      className="w-full rounded-xl border border-surface-border bg-surface-hover px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted focus:border-[#02a9ff] focus:outline-none font-mono"
                    />
                  </div>

                  {connectError && (
                    <p className="text-xs text-rose-400 font-medium">{connectError}</p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowTokenDialog(false)}
                      className="rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-muted hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isConnecting || !tokenInput.trim()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#02a9ff] hover:bg-[#02a9ff]/90 px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-50"
                    >
                      {isConnecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>{isConnecting ? "Verifying..." : "Connect"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sync Complete Summary Modal */}
      <AnimatePresence>
        {importSummary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setImportSummary(null)}
              className="fixed inset-0 bg-background/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm rounded-2xl border border-surface-border bg-surface p-6 text-center shadow-2xl z-10"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#02a9ff]/20 text-[#02a9ff] border border-[#02a9ff]/40 mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">AniList Sync Complete!</h3>
              <p className="text-xs text-muted mb-4">
                Successfully imported and synchronized <span className="font-bold text-white">{importSummary.totalImported} anime titles</span> into your V-Anime Watchlist.
              </p>
              <button
                onClick={() => {
                  setImportSummary(null);
                  router.push("/library");
                }}
                className="w-full rounded-xl bg-[#02a9ff] py-2.5 text-xs font-bold text-white hover:bg-[#02a9ff]/90 transition-all shadow-[0_0_12px_rgba(2,169,255,0.4)]"
              >
                Go to My Library
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
