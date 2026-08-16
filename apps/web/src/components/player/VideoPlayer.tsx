"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface VideoPlayerProps {
  animeId: string;
  episode: string;
  server?: string;
  type?: "sub" | "dub";
}

export function VideoPlayer({ animeId, episode, server = "senshi", type = "sub" }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let hls: Hls | null = null;
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setError(null);

    const fetchAndPlay = async () => {
      try {
        // API URL. In production this should point to your apps/api domain
        // For local development, assume apps/api runs on port 3001.
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        
        const res = await fetch(`${apiUrl}/api/anime/${animeId}/episodes/${episode}/watch?server=${server}&type=${type}`);
        
        if (!res.ok) {
          throw new Error("Failed to resolve stream URL from API");
        }
        
        const { data } = await res.json();
        
        // AniVault scraper returns different fields depending on the server type
        const streamUrl = data.hlsProxyUrl || data.m3u8 || data.mp4ProxyUrl || data.mp4 || data.streamUrl;

        if (!streamUrl) {
          console.error("API response missing stream:", data);
          throw new Error("No stream URL returned from API");
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
                  console.error("Fatal network error encountered, try to recover");
                  hls?.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error("Fatal media error encountered, try to recover");
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
          // Native HLS support (Safari)
          video.src = streamUrl;
          video.addEventListener("loadedmetadata", () => {
            setIsLoading(false);
          });
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

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-black">
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4 text-center z-10">
          <p className="text-lg font-bold text-red-500">Playback Error</p>
          <p className="mt-2 text-sm text-gray-300">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 rounded bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-hover"
          >
            Retry
          </button>
        </div>
      )}

      <video
        ref={videoRef}
        controls
        className="h-full w-full outline-none"
        crossOrigin="anonymous"
      />
    </div>
  );
}
