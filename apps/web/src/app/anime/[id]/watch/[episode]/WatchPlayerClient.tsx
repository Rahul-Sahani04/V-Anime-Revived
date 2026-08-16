"use client";

import { useState } from "react";
import Link from "next/link";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import {
  ChevronLeft,
  ChevronRight,
  Tv,
  Volume2,
  List,
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
  const [showAmbientGlow, setShowAmbientGlow] = useState(true);
  const currentEpNum = parseInt(episode) || 1;
  const prevEp = Math.max(1, currentEpNum - 1);
  const nextEp = currentEpNum + 1;

  const totalEpisodes = 24; // Mock total episodes count
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
            />
          </div>

          {/* Quick Player Bar: Episode Navigation & Ambient Toggle */}
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

            <div className="flex items-center gap-2">
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
