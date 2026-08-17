"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { saveGuestProgress, getGuestProgress } from "@/lib/guestProgress";
import { RotateCcw } from "lucide-react";

interface VideoPlayerProps {
  animeId: string;
  episode: string;
  server?: string;
  type?: "sub" | "dub";
  autoplay?: boolean;
  onEpisodeEnd?: () => void;
}

export function VideoPlayer({
  animeId,
  episode,
  server = "senshi",
  type = "sub",
  autoplay = true,
  onEpisodeEnd,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resumeNotice, setResumeNotice] = useState<{ visible: boolean; timeFormatted: string; position: number } | null>(null);
  const [keyToast, setKeyToast] = useState<string | null>(null);

  const numAnimeId = parseInt(animeId, 10) || 0;
  const numEpisode = parseInt(episode, 10) || 1;

  const { isSignedIn } = useAuth();
  const updateProgressMutation = useMutation(api.progress.updateProgress);
  const serverProgress = useQuery(
    api.progress.getAnimeProgress,
    isSignedIn && numAnimeId > 0 ? { anilistId: numAnimeId, episodeNumber: numEpisode } : "skip"
  );

  // Playback tracking refs
  const hasResumed = useRef(false);
  const lastSavedTime = useRef<number>(0);
  const hasMarkedCompleted = useRef<boolean>(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    setKeyToast(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setKeyToast(null);
    }, 1200);
  }, []);

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Helper to persist progress either to Convex or localStorage
  const saveCurrentProgress = useCallback(
    async (position: number, duration: number, completed: boolean) => {
      if (duration <= 0 || position <= 0) return;
      const percentage = Math.min(100, Math.max(0, (position / duration) * 100));

      if (isSignedIn) {
        try {
          await updateProgressMutation({
            anilistId: numAnimeId,
            episodeNumber: numEpisode,
            position: Math.floor(position),
            duration: Math.floor(duration),
            percentage,
            completed,
            server,
          });
        } catch (err) {
          console.error("[Convex Progress Sync Error]", err);
        }
      } else {
        saveGuestProgress({
          anilistId: numAnimeId,
          episodeNumber: numEpisode,
          position: Math.floor(position),
          duration: Math.floor(duration),
          percentage,
          completed,
          server,
        });
      }
    },
    [isSignedIn, numAnimeId, numEpisode, server, updateProgressMutation]
  );

  // Resume logic when video metadata is loaded
  const handleLoadedMetadata = useCallback(() => {
    setIsLoading(false);
    const video = videoRef.current;
    if (!video || hasResumed.current) return;

    let savedPosition = 0;
    let savedCompleted = false;

    if (isSignedIn && serverProgress) {
      savedPosition = serverProgress.position;
      savedCompleted = serverProgress.completed;
    } else if (!isSignedIn) {
      const guest = getGuestProgress(numAnimeId, numEpisode);
      if (guest) {
        savedPosition = guest.position;
        savedCompleted = guest.completed;
      }
    }

    if (savedPosition > 10 && !savedCompleted && savedPosition < (video.duration - 15)) {
      video.currentTime = savedPosition;
      hasResumed.current = true;
      setResumeNotice({
        visible: true,
        timeFormatted: formatTime(savedPosition),
        position: savedPosition,
      });

      // Auto hide resume banner after 6 seconds
      setTimeout(() => {
        setResumeNotice((prev) => (prev ? { ...prev, visible: false } : null));
      }, 6000);
    }
  }, [isSignedIn, numAnimeId, numEpisode, serverProgress]);

  // Restart video from 00:00
  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setResumeNotice(null);
      showToast("Started from beginning");
    }
  };

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing in inputs
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          if (video.paused) {
            video.play();
            showToast("Play");
          } else {
            video.pause();
            showToast("Pause");
          }
          break;
        case "arrowright":
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 5);
          showToast("+5s");
          break;
        case "arrowleft":
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 5);
          showToast("-5s");
          break;
        case "l":
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          showToast("+10s");
          break;
        case "j":
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          showToast("-10s");
          break;
        case "f":
          e.preventDefault();
          if (!document.fullscreenElement && containerRef.current) {
            containerRef.current.requestFullscreen().catch(() => {});
            showToast("Fullscreen");
          } else if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
            showToast("Exit Fullscreen");
          }
          break;
        case "m":
          e.preventDefault();
          video.muted = !video.muted;
          showToast(video.muted ? "Muted" : "Unmuted");
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showToast]);

  // Main Stream Fetch & HLS Setup
  useEffect(() => {
    let hls: Hls | null = null;
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setError(null);
    hasResumed.current = false;
    hasMarkedCompleted.current = false;
    lastSavedTime.current = 0;

    const fetchAndPlay = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await fetch(
          `${apiUrl}/api/anime/${animeId}/episodes/${episode}/watch?server=${server}&type=${type}`
        );

        if (!res.ok) {
          throw new Error("Failed to resolve stream URL from API");
        }

        const { data } = await res.json();
        const streamUrl =
          data.hlsProxyUrl || data.m3u8 || data.mp4ProxyUrl || data.mp4 || data.streamUrl;

        if (!streamUrl) {
          console.error("API response missing stream:", data);
          throw new Error("No playable stream URL returned for this server.");
        }

        if (Hls.isSupported()) {
          hls = new Hls({
            maxBufferLength: 30,
            maxMaxBufferLength: 600,
          });

          hls.loadSource(streamUrl);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.error("Fatal network error encountered, attempting recover");
                  hls?.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error("Fatal media error encountered, recovering");
                  hls?.recoverMediaError();
                  break;
                default:
                  hls?.destroy();
                  setError("A fatal playback error occurred.");
                  setIsLoading(false);
                  break;
              }
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          // Native Safari HLS
          video.src = streamUrl;
        } else {
          setError("Your browser does not support HLS video playback.");
          setIsLoading(false);
        }
      } catch (err: unknown) {
        console.error("Stream fetch error:", err);
        const message = err instanceof Error ? err.message : "Failed to load video stream.";
        setError(message);
        setIsLoading(false);
      }
    };

    fetchAndPlay();

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [animeId, episode, server, type]);

  // Video event handlers for progress tracking
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || video.duration <= 0) return;

    const currentTime = video.currentTime;
    const duration = video.duration;
    const percentage = (currentTime / duration) * 100;

    // Check completion threshold (>= 90%)
    if (percentage >= 90 && !hasMarkedCompleted.current) {
      hasMarkedCompleted.current = true;
      saveCurrentProgress(currentTime, duration, true);
      onEpisodeEnd?.();
    }

    // Debounced sync every 15 seconds
    if (Math.abs(currentTime - lastSavedTime.current) >= 15) {
      lastSavedTime.current = currentTime;
      saveCurrentProgress(currentTime, duration, hasMarkedCompleted.current);
    }
  };

  const handlePause = () => {
    const video = videoRef.current;
    if (!video || video.duration <= 0) return;
    saveCurrentProgress(video.currentTime, video.duration, hasMarkedCompleted.current);
  };

  const handleEnded = () => {
    const video = videoRef.current;
    if (!video || video.duration <= 0) return;
    hasMarkedCompleted.current = true;
    saveCurrentProgress(video.duration, video.duration, true);
    onEpisodeEnd?.();
  };

  // Save on tab close / reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const video = videoRef.current;
      if (video && video.duration > 0) {
        saveCurrentProgress(video.currentTime, video.duration, hasMarkedCompleted.current);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveCurrentProgress]);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center bg-black group select-none"
    >
      {/* Loading Spinner Overlay */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-[0_0_15px_rgba(225,29,72,0.5)]"></div>
          <span className="mt-3 text-xs font-semibold text-neutral-400">Loading stream...</span>
        </div>
      )}

      {/* Playback Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 text-center z-20">
          <div className="rounded-full bg-primary/10 p-3 mb-3 border border-primary/20">
            <span className="text-xl">⚠️</span>
          </div>
          <p className="text-base font-bold text-white">Playback Error</p>
          <p className="mt-1 text-xs text-neutral-400 max-w-md">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)]"
          >
            Retry Stream
          </button>
        </div>
      )}

      {/* Resume Banner Notification */}
      {resumeNotice && resumeNotice.visible && (
        <div className="absolute top-4 left-4 z-30 flex items-center gap-3 rounded-xl bg-background/90 backdrop-blur-md border border-surface-border px-4 py-2.5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">
              Resumed from <span className="text-primary font-mono">{resumeNotice.timeFormatted}</span>
            </span>
          </div>
          <button
            onClick={handleRestart}
            className="flex items-center gap-1 text-[11px] font-bold text-muted hover:text-white bg-surface hover:bg-surface-hover px-2.5 py-1 rounded-lg border border-surface-border transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Restart</span>
          </button>
        </div>
      )}

      {/* Keyboard Shortcut Action Toast */}
      {keyToast && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="rounded-2xl bg-background/80 backdrop-blur-md border border-primary/30 px-5 py-2.5 text-sm font-bold text-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {keyToast}
          </div>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        controls
        autoPlay={autoplay}
        playsInline
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPause={handlePause}
        onEnded={handleEnded}
        className="h-full w-full outline-none"
        crossOrigin="anonymous"
      />
    </div>
  );
}
