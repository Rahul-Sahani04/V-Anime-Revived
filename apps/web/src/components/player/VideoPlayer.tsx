"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { saveGuestProgress, getGuestProgress } from "@/lib/guestProgress";
import Link from "next/link";
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  FastForward,
  Settings,
  PictureInPicture2,
  Sparkles,
  X,
  Loader2,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

interface AniSkipInterval {
  startTime: number;
  endTime: number;
  skipType: "op" | "ed" | "recap" | "mixed-op" | "mixed-ed";
}

interface VideoPlayerProps {
  animeId: string;
  episode: string;
  server?: string;
  type?: "sub" | "dub";
  autoplay?: boolean;
  onEpisodeEnd?: () => void;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

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
  const progressTrackRef = useRef<HTMLDivElement>(null);

  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // HUD & UI states
  const [showControls, setShowControls] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [hoverTime, setHoverTime] = useState<{ pos: number; time: string } | null>(null);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [centerRipple, setCenterRipple] = useState<{ type: "play" | "pause" | "rewind" | "forward"; id: number } | null>(null);
  const [keyToast, setKeyToast] = useState<string | null>(null);
  const [resumeNotice, setResumeNotice] = useState<{ visible: boolean; timeFormatted: string; position: number } | null>(null);

  // AniSkip auto-intro timings
  const [skipIntervals, setSkipIntervals] = useState<AniSkipInterval[]>([]);
  const [activeSkip, setActiveSkip] = useState<AniSkipInterval | null>(null);

  const numAnimeId = parseInt(animeId, 10) || 0;
  const numEpisode = parseInt(episode, 10) || 1;

  const { isSignedIn } = useAuth();
  const updateProgressMutation = useMutation(api.progress.updateProgress);
  const serverProgress = useQuery(
    api.progress.getAnimeProgress,
    isSignedIn && numAnimeId > 0 ? { anilistId: numAnimeId, episodeNumber: numEpisode } : "skip"
  );

  // Tracking refs
  const hasResumed = useRef(false);
  const lastSavedTime = useRef<number>(0);
  const hasMarkedCompleted = useRef<boolean>(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  // Format seconds to MM:SS or HH:MM:SS
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const showToast = useCallback((msg: string) => {
    setKeyToast(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setKeyToast(null);
    }, 1200);
  }, []);

  const triggerRipple = useCallback((type: "play" | "pause" | "rewind" | "forward") => {
    setCenterRipple({ type, id: Date.now() });
    setTimeout(() => {
      setCenterRipple(null);
    }, 600);
  }, []);

  // Controls auto-hide timer
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showSettingsMenu && !isDraggingProgress) {
        setShowControls(false);
      }
    }, 2500);
  }, [isPlaying, showSettingsMenu, isDraggingProgress]);

  // Fetch AniSkip timestamps for current episode
  useEffect(() => {
    if (!numAnimeId || !numEpisode) return;

    const fetchAniSkip = async () => {
      try {
        const res = await fetch(
          `https://api.aniskip.com/v2/skip-times/${numAnimeId}/${numEpisode}?types=op&types=ed&types=recap&types=mixed-op&types=mixed-ed`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.found && Array.isArray(data.results)) {
          const intervals: AniSkipInterval[] = data.results.map((r: { interval: { startTime: number; endTime: number }; skipType: AniSkipInterval["skipType"] }) => ({
            startTime: r.interval.startTime,
            endTime: r.interval.endTime,
            skipType: r.skipType,
          }));
          setSkipIntervals(intervals);
        }
      } catch {
        // Silently ignore if AniSkip has no data for this show
      }
    };

    fetchAniSkip();
  }, [numAnimeId, numEpisode]);

  // Persist progress to Convex or localStorage
  const saveCurrentProgress = useCallback(
    async (pos: number, dur: number, completed: boolean) => {
      if (dur <= 0 || pos <= 0) return;
      const percentage = Math.min(100, Math.max(0, (pos / dur) * 100));

      if (isSignedIn) {
        try {
          await updateProgressMutation({
            anilistId: numAnimeId,
            episodeNumber: numEpisode,
            position: Math.floor(pos),
            duration: Math.floor(dur),
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
          position: Math.floor(pos),
          duration: Math.floor(dur),
          percentage,
          completed,
          server,
        });
      }
    },
    [isSignedIn, numAnimeId, numEpisode, server, updateProgressMutation]
  );

  // Resume logic when metadata loads
  const handleLoadedMetadata = useCallback(() => {
    setIsLoading(false);
    const video = videoRef.current;
    if (!video) return;

    setDuration(video.duration);

    if (hasResumed.current) return;

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

    if (savedPosition > 10 && !savedCompleted && savedPosition < video.duration - 15) {
      video.currentTime = savedPosition;
      hasResumed.current = true;
      setResumeNotice({
        visible: true,
        timeFormatted: formatTime(savedPosition),
        position: savedPosition,
      });

      setTimeout(() => {
        setResumeNotice((prev) => (prev ? { ...prev, visible: false } : null));
      }, 6000);
    }
  }, [isSignedIn, numAnimeId, numEpisode, serverProgress]);

  // Auto-retry & Fallback state
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const ALL_SERVERS = ["senshi", "anizone", "anikoto", "miruro", "anineko", "reanime", "animeheaven"];
  const nextFallbackServer = ALL_SERVERS.find((s) => s !== server) || "anizone";

  // Main Stream Fetch & HLS Setup
  useEffect(() => {
    let isCancelled = false;
    const abortController = new AbortController();
    let hls: Hls | null = null;
    let countdownInterval: NodeJS.Timeout | null = null;
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setError(null);
    hasResumed.current = false;
    hasMarkedCompleted.current = false;
    lastSavedTime.current = 0;

    const fetchAndPlay = async () => {
      let fetchTimeout: NodeJS.Timeout | null = null;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        
        // 5.5s timeout for scraper responsiveness
        fetchTimeout = setTimeout(() => {
          if (!isCancelled) abortController.abort();
        }, 5500);

        const res = await fetch(
          `${apiUrl}/api/anime/${animeId}/episodes/${episode}/watch?server=${server}&type=${type}`,
          { signal: abortController.signal }
        );
        if (fetchTimeout) clearTimeout(fetchTimeout);

        if (isCancelled) return;

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }

        const { data } = await res.json();
        if (isCancelled) return;

        const streamUrl =
          data?.hlsProxyUrl || data?.m3u8 || data?.mp4ProxyUrl || data?.mp4 || data?.streamUrl;

        if (!streamUrl) {
          throw new Error("No playable stream URL returned for this server.");
        }

        // Successfully found stream: reset retry counter
        setRetryAttempt(0);
        setRetryCountdown(null);

        if (Hls.isSupported()) {
          hls = new Hls({
            maxBufferLength: 30,
            maxMaxBufferLength: 600,
          });

          if (isCancelled) {
            hls.destroy();
            return;
          }

          hls.loadSource(streamUrl);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (isCancelled) return;
            setIsLoading(false);
            if (autoplay) {
              video.play().catch(() => {});
            }
          });

          let hasAttemptedDirectFallback = false;

          hls.on(Hls.Events.ERROR, (_event, errorData) => {
            if (isCancelled) return;
            if (errorData.fatal) {
              if (
                errorData.type === Hls.ErrorTypes.NETWORK_ERROR &&
                !hasAttemptedDirectFallback &&
                data?.m3u8 &&
                streamUrl !== data.m3u8
              ) {
                console.warn("HLS proxy failed, attempting direct m3u8 fallback...");
                hasAttemptedDirectFallback = true;
                hls?.loadSource(data.m3u8);
                hls?.startLoad();
                return;
              }

              switch (errorData.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.warn("HLS network error, attempting reload...");
                  hls?.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.warn("HLS media error, recovering...");
                  hls?.recoverMediaError();
                  break;
                default:
                  hls?.destroy();
                  setError("Fatal stream decoding error. Try switching servers.");
                  setIsLoading(false);
                  break;
              }
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          // Native Safari HLS
          if (isCancelled) return;
          video.src = streamUrl;
          if (autoplay) {
            video.play().catch(() => {});
          }
        } else {
          if (isCancelled) return;
          setError("Your browser does not support HLS video playback.");
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (fetchTimeout) clearTimeout(fetchTimeout);
        if (isCancelled || (err instanceof DOMException && err.name === "AbortError" && !isLoading)) {
          return;
        }

        console.error(`[VideoPlayer Error] Server ${server} fetch attempt failed:`, err);

        // Fast auto-retry (up to 2 retries, 1.5s countdown each)
        if (retryAttempt < 2) {
          const nextAttemptNum = retryAttempt + 1;
          const waitSecs = 2;
          setRetryCountdown(waitSecs);
          setIsLoading(true);

          let remaining = waitSecs;
          countdownInterval = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
              if (countdownInterval) clearInterval(countdownInterval);
              if (!isCancelled) {
                setRetryCountdown(null);
                setRetryAttempt(nextAttemptNum);
                setRetryTrigger((prev) => prev + 1);
              }
            } else {
              setRetryCountdown(remaining);
            }
          }, 1000);
        } else {
          // All 2 attempts exhausted: show quick fallback switch
          setError(`Server "${server}" is currently unresponsive.`);
          setIsLoading(false);
        }
      }
    };

    fetchAndPlay();

    return () => {
      isCancelled = true;
      abortController.abort();
      if (countdownInterval) clearInterval(countdownInterval);
      if (hls) {
        hls.stopLoad();
        hls.detachMedia();
        hls.destroy();
        hls = null;
      }
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    };
  }, [animeId, episode, server, type, autoplay, retryTrigger]);

  // Video Event Listeners (Syncing State)
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || video.duration <= 0) return;

    const cur = video.currentTime;
    const dur = video.duration;
    setCurrentTime(cur);

    // Update buffered progress
    if (video.buffered.length > 0) {
      for (let i = video.buffered.length - 1; i >= 0; i--) {
        if (video.buffered.start(i) <= cur) {
          setBufferedEnd(video.buffered.end(i));
          break;
        }
      }
    }

    // Check AniSkip Active Interval
    const match = skipIntervals.find(
      (intv) => cur >= intv.startTime && cur < intv.endTime
    );
    setActiveSkip(match || null);

    // Completion Threshold (>= 90%)
    const percentage = (cur / dur) * 100;
    if (percentage >= 90 && !hasMarkedCompleted.current) {
      hasMarkedCompleted.current = true;
      saveCurrentProgress(cur, dur, true);
      onEpisodeEnd?.();
    }

    // Debounced sync every 15s
    if (Math.abs(cur - lastSavedTime.current) >= 15) {
      lastSavedTime.current = cur;
      saveCurrentProgress(cur, dur, hasMarkedCompleted.current);
    }
  };

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
      triggerRipple("play");
    } else {
      video.pause();
      setIsPlaying(false);
      triggerRipple("pause");
    }
    resetControlsTimer();
  }, [triggerRipple, resetControlsTimer]);

  const seekRelative = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + delta));
    triggerRipple(delta > 0 ? "forward" : "rewind");
    showToast(`${delta > 0 ? "+" : ""}${delta}s`);
    resetControlsTimer();
  }, [triggerRipple, showToast, resetControlsTimer]);

  // Jump to specific skip interval end time
  const handleSkipActive = useCallback(() => {
    if (!activeSkip || !videoRef.current) return;
    videoRef.current.currentTime = activeSkip.endTime;
    showToast(`Skipped ${activeSkip.skipType === "op" ? "Opening" : "Recap"}`);
    setActiveSkip(null);
  }, [activeSkip, showToast]);

  // Quick 85s Opening Jump
  const handleSkip85s = useCallback(() => {
    seekRelative(85);
  }, [seekRelative]);

  // Scrubber Click & Drag
  const handleScrub = useCallback((clientX: number) => {
    const track = progressTrackRef.current;
    const video = videoRef.current;
    if (!track || !video || !video.duration) return;

    const rect = track.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    video.currentTime = pos * video.duration;
    setCurrentTime(video.currentTime);
  }, []);

  const handleMouseDownScrub = (e: React.MouseEvent) => {
    setIsDraggingProgress(true);
    handleScrub(e.clientX);

    const onMouseMove = (moveEvent: MouseEvent) => {
      handleScrub(moveEvent.clientX);
    };

    const onMouseUp = () => {
      setIsDraggingProgress(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleProgressMouseMove = (e: React.MouseEvent) => {
    const track = progressTrackRef.current;
    const video = videoRef.current;
    if (!track || !video || !video.duration) return;

    const rect = track.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime({
      pos: pos * 100,
      time: formatTime(pos * video.duration),
    });
  };

  // Volume Control
  const handleVolumeChange = useCallback((newVol: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(0, Math.min(1, newVol));
    video.volume = clamped;
    setVolume(clamped);
    if (clamped === 0) {
      video.muted = true;
      setIsMuted(true);
    } else {
      video.muted = false;
      setIsMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.muted = false;
      setIsMuted(false);
      if (volume === 0) {
        video.volume = 0.5;
        setVolume(0.5);
      }
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  // Speed Control
  const changeSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      showToast(`${speed}x Speed`);
      setShowSettingsMenu(false);
    }
  };

  // Picture in Picture
  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (e) {
      console.error("PiP error:", e);
    }
  }, []);

  // Fullscreen Management
  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Keyboard Shortcuts Map
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowright":
          e.preventDefault();
          seekRelative(5);
          break;
        case "arrowleft":
          e.preventDefault();
          seekRelative(-5);
          break;
        case "l":
          e.preventDefault();
          seekRelative(10);
          break;
        case "j":
          e.preventDefault();
          seekRelative(-10);
          break;
        case "arrowup":
          e.preventDefault();
          handleVolumeChange(volume + 0.05);
          showToast(`Volume ${Math.round((volume + 0.05) * 100)}%`);
          break;
        case "arrowdown":
          e.preventDefault();
          handleVolumeChange(volume - 0.05);
          showToast(`Volume ${Math.round((volume - 0.05) * 100)}%`);
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          showToast(video.muted ? "Muted" : "Unmuted");
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "s":
          e.preventDefault();
          if (activeSkip) {
            handleSkipActive();
          } else {
            handleSkip85s();
          }
          break;
        case "p":
          e.preventDefault();
          togglePiP();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    togglePlay,
    seekRelative,
    volume,
    activeSkip,
    handleVolumeChange,
    showToast,
    toggleMute,
    toggleFullscreen,
    handleSkipActive,
    handleSkip85s,
    togglePiP,
  ]);

  // Touch Screen Double Tap to Seek
  const handleTouchScreen = (e: React.MouseEvent) => {
    const now = Date.now();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeftSide = clickX < rect.width * 0.4;
    const isRightSide = clickX > rect.width * 0.6;

    if (now - lastTapRef.current.time < 300) {
      // Double tap detected
      if (isLeftSide) {
        seekRelative(-10);
      } else if (isRightSide) {
        seekRelative(10);
      } else {
        togglePlay();
      }
    } else {
      // Single tap
      togglePlay();
    }

    lastTapRef.current = { time: now, x: clickX };
  };

  const playedPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && !showSettingsMenu && setShowControls(false)}
      className="relative flex h-full w-full items-center justify-center bg-black group select-none overflow-hidden"
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        playsInline
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => {
          setIsPlaying(false);
          if (videoRef.current && videoRef.current.duration > 0) {
            saveCurrentProgress(videoRef.current.currentTime, videoRef.current.duration, hasMarkedCompleted.current);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          hasMarkedCompleted.current = true;
          if (videoRef.current) {
            saveCurrentProgress(videoRef.current.duration, videoRef.current.duration, true);
          }
          onEpisodeEnd?.();
        }}
        className="h-full w-full object-contain outline-none cursor-pointer"
        crossOrigin="anonymous"
        onClick={handleTouchScreen}
      />

      {/* Auto-Retry Loading Countdown Overlay */}
      {retryCountdown !== null && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md z-30 animate-in fade-in duration-200">
          <div className="relative flex items-center justify-center mb-3">
            <Loader2 className="h-12 w-12 animate-spin text-primary drop-shadow-[0_0_15px_rgba(225,29,72,0.6)]" />
            <span className="absolute text-xs font-mono font-black text-white">{retryCountdown}s</span>
          </div>
          <span className="text-xs font-extrabold text-white tracking-wider uppercase">
            Connecting Stream (Attempt {retryAttempt + 1}/3)
          </span>
          <span className="mt-1 text-[11px] text-neutral-400">
            Auto-retrying in {retryCountdown}s...
          </span>
          <button
            onClick={() => {
              setRetryCountdown(null);
              setRetryAttempt((prev) => prev + 1);
              setRetryTrigger((prev) => prev + 1);
            }}
            className="mt-3 text-[11px] font-bold text-primary hover:underline"
          >
            Retry Now
          </button>
        </div>
      )}

      {/* Standard Initial Loading Overlay */}
      {isLoading && retryCountdown === null && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-30 pointer-events-none">
          <Loader2 className="h-12 w-12 animate-spin text-primary drop-shadow-[0_0_15px_rgba(225,29,72,0.6)]" />
          <span className="mt-3 text-xs font-bold text-neutral-300 tracking-wider uppercase">Loading Stream...</span>
        </div>
      )}

      {/* Playback Error & Server Fallback Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 text-center z-40 animate-in fade-in duration-200">
          <div className="rounded-2xl bg-rose-500/15 p-4 mb-3 border border-rose-500/30 text-rose-500">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <p className="text-base font-black text-white capitalize">
            Server &quot;{server}&quot; Unavailable
          </p>
          <p className="mt-1 text-xs text-neutral-400 max-w-md leading-relaxed">
            We couldn&apos;t establish a stable stream on server &quot;{server}&quot; after 3 attempts. Switch to a fast fallback server or retry.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/anime/${animeId}/watch/${episode}?server=${nextFallbackServer}&type=${type}`}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)] capitalize"
            >
              <span>Switch to {nextFallbackServer}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <button
              onClick={() => {
                setRetryAttempt(0);
                setRetryTrigger((prev) => prev + 1);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-surface hover:bg-surface-hover px-4 py-2.5 text-xs font-bold text-neutral-200 border border-surface-border transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry {server}</span>
            </button>
          </div>
        </div>
      )}

      {/* Center Screen Animated Ripple Icon */}
      {centerRipple && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-2xl animate-in zoom-in-50 fade-in duration-200">
            {centerRipple.type === "play" && <Play className="h-9 w-9 fill-current translate-x-0.5 text-primary" />}
            {centerRipple.type === "pause" && <Pause className="h-9 w-9 fill-current text-white" />}
            {centerRipple.type === "rewind" && (
              <div className="flex flex-col items-center text-xs font-bold font-mono">
                <RotateCcw className="h-6 w-6 mb-1 text-primary" />
                -10s
              </div>
            )}
            {centerRipple.type === "forward" && (
              <div className="flex flex-col items-center text-xs font-bold font-mono">
                <FastForward className="h-6 w-6 mb-1 text-primary" />
                +10s
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating AniSkip Pill */}
      {activeSkip && (
        <button
          onClick={handleSkipActive}
          className="absolute bottom-24 right-6 z-40 flex items-center gap-2 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs px-5 py-3 shadow-[0_0_25px_rgba(225,29,72,0.6)] border border-white/30 backdrop-blur-md transition-all hover:scale-105 animate-in slide-in-from-bottom-3 duration-300"
        >
          <FastForward className="h-4 w-4 fill-current" />
          <span>Skip {activeSkip.skipType === "op" ? "Opening" : activeSkip.skipType === "ed" ? "Ending" : "Recap"}</span>
          <span className="rounded bg-black/30 px-1.5 py-0.5 text-[10px] font-mono font-normal">S</span>
        </button>
      )}

      {/* Resume Notification Pill */}
      {resumeNotice?.visible && (
        <div className="absolute top-6 left-6 z-30 flex items-center gap-3 rounded-2xl bg-background/90 backdrop-blur-xl border border-surface-border px-4 py-2.5 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-300">
          <span className="text-xs font-semibold text-neutral-200">
            Resumed from <span className="text-primary font-mono font-bold">{resumeNotice.timeFormatted}</span>
          </span>
          <button
            onClick={() => {
              if (videoRef.current) videoRef.current.currentTime = 0;
              setResumeNotice(null);
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-muted hover:text-white bg-surface hover:bg-surface-hover px-2.5 py-1 rounded-lg border border-surface-border transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Restart</span>
          </button>
        </div>
      )}

      {/* Keyboard Shortcut Toast */}
      {keyToast && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="rounded-2xl bg-background/90 backdrop-blur-xl border border-primary/40 px-5 py-2.5 text-xs font-extrabold text-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 font-mono tracking-wider">
            {keyToast}
          </div>
        </div>
      )}

      {/* Floating Modern Controls HUD */}
      <div
        className={`absolute inset-x-0 bottom-0 z-40 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-12 pb-4 px-4 sm:px-6 transition-opacity duration-300 ${
          showControls || !isPlaying ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Scrubber Progress Bar */}
        <div
          ref={progressTrackRef}
          onMouseDown={handleMouseDownScrub}
          onMouseMove={handleProgressMouseMove}
          onMouseLeave={() => setHoverTime(null)}
          className="group/track relative mb-3 flex h-4 w-full cursor-pointer items-center"
        >
          {/* Hover Tooltip */}
          {hoverTime && (
            <div
              style={{ left: `${hoverTime.pos}%` }}
              className="absolute -top-7 -translate-x-1/2 rounded-md bg-neutral-900 border border-surface-border px-2 py-0.5 text-[11px] font-mono font-bold text-white shadow-xl pointer-events-none"
            >
              {hoverTime.time}
            </div>
          )}

          {/* Background Track */}
          <div className="relative h-1.5 w-full rounded-full bg-white/20 overflow-hidden transition-all group-hover/track:h-2">
            {/* Buffered Track */}
            <div
              style={{ width: `${bufferedPct}%` }}
              className="absolute top-0 bottom-0 left-0 bg-white/35 rounded-full"
            />
            {/* Played Progress Track */}
            <div
              style={{ width: `${playedPct}%` }}
              className="absolute top-0 bottom-0 left-0 bg-primary rounded-full shadow-[0_0_10px_rgba(225,29,72,0.8)]"
            />
          </div>

          {/* Scrub Handle Thumb */}
          <div
            style={{ left: `${playedPct}%` }}
            className="absolute -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-[0_0_12px_rgba(225,29,72,0.8)] border-2 border-primary transition-transform scale-0 group-hover/track:scale-100"
          />
        </div>

        {/* Bottom Control Actions */}
        <div className="flex items-center justify-between gap-4">
          {/* Left Controls: Play, 10s Seek, Volume, Timestamps */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play / Pause Toggle */}
            <button
              onClick={togglePlay}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-primary text-white transition-all shadow-sm"
              title={isPlaying ? "Pause (Space/K)" : "Play (Space/K)"}
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current translate-x-0.5" />}
            </button>

            {/* Rewind 10s */}
            <button
              onClick={() => seekRelative(-10)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Rewind 10s (J)"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Fast Forward 10s */}
            <button
              onClick={() => seekRelative(10)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Fast Forward 10s (L)"
            >
              <FastForward className="h-4 w-4" />
            </button>

            {/* Volume Control with expanding slider */}
            <div className="group/vol flex items-center gap-1">
              <button
                onClick={toggleMute}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-300 hover:text-white transition-colors"
                title={isMuted ? "Unmute (M)" : "Mute (M)"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4 text-rose-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>

              <div className="w-0 group-hover/vol:w-20 transition-all duration-200 overflow-hidden flex items-center opacity-0 group-hover/vol:opacity-100 pointer-events-none group-hover/vol:pointer-events-auto">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  aria-label="Volume"
                  className="h-1 w-16 accent-primary cursor-pointer"
                />
              </div>
            </div>

            {/* Timestamp Counter */}
            <span className="text-xs font-mono font-bold text-neutral-300 tracking-tight ml-1">
              {formatTime(currentTime)} <span className="text-neutral-500">/</span> {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls: +85s Jump, Speed, Settings, PiP, Fullscreen */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick +85s Skip Intro Button */}
            <button
              onClick={handleSkip85s}
              className="hidden sm:flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-200 px-2.5 py-1 text-xs font-bold transition-colors"
              title="Jump 85s Intro (S)"
            >
              <FastForward className="h-3 w-3" />
              <span>+85s</span>
            </button>

            {/* Playback Speed Popover */}
            <div className="relative">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                  playbackSpeed !== 1
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "text-neutral-300 hover:text-white hover:bg-white/10"
                }`}
                title="Playback Settings"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>{playbackSpeed}x</span>
              </button>

              {showSettingsMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-48 rounded-2xl border border-surface-border bg-neutral-900/95 backdrop-blur-xl p-3 shadow-2xl z-50">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-surface-border text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    <span>Speed</span>
                    <Sparkles className="h-3 w-3 text-primary" />
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {PLAYBACK_SPEEDS.map((spd) => (
                      <button
                        key={spd}
                        onClick={() => changeSpeed(spd)}
                        className={`flex items-center justify-center py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                          playbackSpeed === spd
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-neutral-400 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Picture in Picture */}
            <button
              onClick={togglePiP}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Picture in Picture (P)"
            >
              <PictureInPicture2 className="h-4 w-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
              title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
