"use client";

import { useRef, useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Film, AlertCircle } from "lucide-react";
import type { VideoAsset } from "@/types/database";

export interface GameVideoPlayerHandle {
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
}

interface GameVideoPlayerProps {
  signedUrl: string;
  videoAsset: VideoAsset;
  /** Called whenever playback position changes (throttled by browser ~250ms). */
  onTimeUpdate?: (seconds: number) => void;
}

const GameVideoPlayer = forwardRef<GameVideoPlayerHandle, GameVideoPlayerProps>(
  function GameVideoPlayer({ signedUrl, videoAsset, onTimeUpdate }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // Expose seek + getCurrentTime via ref.
    useImperativeHandle(ref, () => ({
      seekTo(seconds: number) {
        const video = videoRef.current;
        if (!video) return;
        const target = isFinite(video.duration)
          ? Math.min(Math.max(0, seconds), video.duration)
          : Math.max(0, seconds);
        video.currentTime = target;
      },
      getCurrentTime() {
        return videoRef.current?.currentTime ?? 0;
      },
    }));

    // Wire up onTimeUpdate.
    useEffect(() => {
      const video = videoRef.current;
      if (!video || !onTimeUpdate) return;
      const handler = () => onTimeUpdate(video.currentTime);
      video.addEventListener("timeupdate", handler);
      return () => video.removeEventListener("timeupdate", handler);
    }, [onTimeUpdate]);

    if (hasError) {
      return (
        <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-red-500/20 bg-slate-900">
          <div className="text-center px-6 py-8">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-300 mb-1">Video unavailable</p>
            <p className="text-xs text-slate-500">
              The signed playback URL may have expired. Refresh the page to get a new one.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full rounded-xl overflow-hidden bg-black border border-slate-800">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
            <div className="text-center">
              <Film className="h-8 w-8 text-slate-600 mx-auto mb-2 animate-pulse" />
              <p className="text-xs text-slate-500">Loading video…</p>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          src={signedUrl}
          controls
          preload="metadata"
          className="w-full aspect-video"
          aria-label={`Game video: ${videoAsset.fileName}`}
          onCanPlay={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      </div>
    );
  }
);

export { GameVideoPlayer };
