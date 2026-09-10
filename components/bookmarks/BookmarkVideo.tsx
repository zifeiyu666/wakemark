"use client";

import { cn } from "@/lib/utils";
import { ArrowUpRight, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const PLAY_EVENT = "wakemark:video-play";

export function BookmarkVideo({
  src,
  poster,
  loop = false,
  playLabel,
  openLabel,
}: {
  src: string;
  poster?: string;
  loop?: boolean;
  playLabel: string;
  openLabel: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const onOtherPlay = (event: Event) => {
      const playing = (event as CustomEvent<HTMLVideoElement>).detail;
      if (playing !== videoRef.current) videoRef.current?.pause();
    };
    window.addEventListener(PLAY_EVENT, onOtherPlay);
    return () => window.removeEventListener(PLAY_EVENT, onOtherPlay);
  }, []);

  const announcePlay = (el: HTMLVideoElement) => {
    window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: el }));
  };

  const start = () => {
    const el = videoRef.current;
    if (!el) return;
    setStarted(true);
    announcePlay(el);
    void el.play();
  };

  return (
    <div className="relative aspect-video overflow-hidden rounded-none bg-secondary">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls={started || loop}
        playsInline
        preload={loop ? "metadata" : "none"}
        loop={loop}
        muted={loop}
        autoPlay={loop}
        className="h-full w-full object-cover"
        onPlay={(event) => {
          setStarted(true);
          announcePlay(event.currentTarget);
        }}
      />
      {!started && !loop && (
        <button
          type="button"
          onClick={start}
          aria-label={playLabel}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/30"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm transition-transform hover:scale-105">
            <Play className="ml-0.5 size-5 fill-white text-white" />
          </span>
        </button>
      )}
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={openLabel}
        title={openLabel}
        className={cn(
          "absolute right-2 top-2 z-10 inline-flex size-8 items-center justify-center",
          "rounded-none bg-black/60 text-white backdrop-blur-sm",
          "transition-colors hover:bg-black/80"
        )}
      >
        <ArrowUpRight className="size-4" />
      </a>
    </div>
  );
}
