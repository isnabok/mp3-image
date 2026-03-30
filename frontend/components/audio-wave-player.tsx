"use client";

import { useEffect, useRef, useState } from "react";

import { siteMessages } from "@/lib/i18n";

type AudioWavePlayerProps = {
  file: File;
};

type WaveSurferLike = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
  loadBlob: (blob: Blob) => Promise<void>;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
  playPause: () => Promise<void> | void;
};

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-current">
      <path d="M8 6.5v11l9-5.5Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-current">
      <path d="M7 6h3v12H7zM14 6h3v12h-3z" />
    </svg>
  );
}

export function AudioWavePlayer({ file }: AudioWavePlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurferLike | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const container = waveformRef.current;

    if (!container) {
      return;
    }

    let isActive = true;

    setIsReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    void (async () => {
      const { default: WaveSurfer } = await import("wavesurfer.js");

      if (!isActive) {
        return;
      }

      const instance = WaveSurfer.create({
        container,
        height: 88,
        waveColor: "#8c97ab",
        progressColor: "#11d2c5",
        cursorColor: "transparent",
        barWidth: 3,
        barGap: 2,
        barRadius: 999,
        barHeight: 0.9,
        normalize: true,
        dragToSeek: true,
        hideScrollbar: true,
      }) as unknown as WaveSurferLike;

      wavesurferRef.current = instance;

      instance.on("ready", () => {
        if (!isActive) {
          return;
        }

        setDuration(instance.getDuration());
        setCurrentTime(0);
        setIsReady(true);
      });

      instance.on("timeupdate", (value) => {
        if (!isActive) {
          return;
        }

        setCurrentTime(typeof value === "number" ? value : instance.getCurrentTime());
      });

      instance.on("play", () => {
        if (isActive) {
          setIsPlaying(true);
        }
      });

      instance.on("pause", () => {
        if (isActive) {
          setIsPlaying(false);
        }
      });

      instance.on("finish", () => {
        if (isActive) {
          setIsPlaying(false);
          setCurrentTime(instance.getDuration());
        }
      });

      await instance.loadBlob(file);
    })();

    return () => {
      isActive = false;
      wavesurferRef.current?.destroy();
      wavesurferRef.current = null;
    };
  }, [file]);

  const togglePlayback = () => {
    void wavesurferRef.current?.playPause();
  };

  return (
    <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            {siteMessages.audio.panelTitle}
          </p>
          <p className="mt-2 truncate text-[0.85rem] font-medium text-[var(--foreground)]">
            {file.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlayback}
            disabled={!isReady}
            aria-label={isPlaying ? siteMessages.audio.pause : siteMessages.audio.play}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-[var(--accent-contrast)] shadow-[0_16px_32px_var(--accent-glow)] transition hover:translate-y-[-1px] hover:shadow-[0_20px_36px_var(--accent-glow)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          <div className="flex h-11 w-[122px] items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 text-center text-[0.78rem] tabular-nums text-[var(--muted)]">
            {isReady
              ? `${formatTime(currentTime)} / ${formatTime(duration)}`
              : siteMessages.audio.loading}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
        <div ref={waveformRef} className="w-full" aria-label={siteMessages.audio.waveformLabel} />
      </div>
    </div>
  );
}
