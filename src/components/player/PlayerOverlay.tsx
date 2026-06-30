import { Link } from "react-router-dom";
import {
  ChevronDown,
  Music,
  Mic2,
  ListMusic,
} from "lucide-react";
import { useState } from "react";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { useAuth } from "@/lib/hooks/useAuth";
import { PlayPauseButton } from "./controls/PlayPauseButton";
import { SkipButton } from "./controls/SkipButton";
import { ProgressBar } from "./controls/ProgressBar";
import { VolumeControl } from "./controls/VolumeControl";
import { RepeatButton } from "./controls/RepeatButton";
import { ShuffleButton } from "./controls/ShuffleButton";
import { QueuePanel } from "./QueuePanel";
import { getPlanLimits } from "@/lib/constants/plans";
import { getTodayStreamCount } from "@/lib/services/streamService";

export function PlayerOverlay() {
  const {
    currentSong,
    isPlaying,
    progress,
    volume,
    shuffle,
    repeatMode,
    isExpanded,
    queue,
    currentIndex,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleShuffle,
    cycleRepeat,
    collapse,
  } = usePlayer();

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"lyrics" | "queue">("lyrics");

  if (!isExpanded || !currentSong) return null;

  const canViewStats = user ? getPlanLimits(user.planTier).viewStats : false;
  const streamCount = user ? getTodayStreamCount(user.id) : 0;
  const nextSong =
    queue.length > 0 && currentIndex + 1 < queue.length
      ? queue[currentIndex + 1]
      : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <button
          onClick={collapse}
          className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          aria-label="Minimize player"
        >
          <ChevronDown size={24} />
        </button>
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Now Playing
        </p>
        <div className="w-10" />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row lg:gap-8 lg:px-12 lg:py-4">
        {/* Left column: cover + controls + metadata */}
        <div className="flex flex-col items-center gap-6 px-6 py-4 lg:flex-1 lg:justify-center lg:gap-8">
          {/* Cover art */}
          <div className="w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[380px]">
            <div
              className="flex aspect-square w-full items-center justify-center rounded-2xl shadow-2xl shadow-black/50"
              style={{ backgroundColor: currentSong.coverColor }}
            >
              {currentSong.coverImage ? (
                <img
                  src={currentSong.coverImage}
                  alt={currentSong.title}
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : (
                <Music size={80} className="text-white/40" />
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="w-full max-w-[380px] text-center lg:text-left">
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              {currentSong.title}
            </h2>
            <div className="mt-1 flex items-center justify-center gap-2 text-sm text-zinc-400 lg:justify-start">
              <Link
                to={`/artist/${encodeURIComponent(currentSong.artistName)}`}
                onClick={collapse}
                className="transition hover:text-green-400 hover:underline"
              >
                {currentSong.artistName}
              </Link>
              {currentSong.albumId && (
                <>
                  <span className="text-zinc-600">·</span>
                  <Link
                    to={`/album/${currentSong.albumId}`}
                    onClick={collapse}
                    className="transition hover:text-green-400 hover:underline"
                  >
                    Album
                  </Link>
                </>
              )}
            </div>
            {canViewStats && (
              <p className="mt-2 text-xs text-zinc-500">
                {streamCount} {streamCount === 1 ? "stream" : "streams"} today
              </p>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-[380px]">
            <ProgressBar
              current={progress}
              total={currentSong.durationSec}
              onSeek={seek}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-5 sm:gap-6">
            <ShuffleButton active={shuffle} onToggle={toggleShuffle} />
            <SkipButton direction="back" onClick={previous} size={22} />
            <PlayPauseButton isPlaying={isPlaying} onClick={togglePlay} size="lg" />
            <SkipButton direction="forward" onClick={next} size={22} />
            <RepeatButton mode={repeatMode} onCycle={cycleRepeat} />
          </div>

          {/* Volume */}
          <div className="flex items-center justify-center">
            <VolumeControl volume={volume} onChange={setVolume} />
          </div>
        </div>

        {/* Right column: lyrics + queue (desktop) / tabs (mobile) */}
        <div className="flex flex-1 flex-col overflow-hidden border-t border-zinc-800 lg:border-t-0 lg:border-l">
          {/* Tabs */}
          <div className="flex border-b border-zinc-800">
            <button
              onClick={() => setActiveTab("lyrics")}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === "lyrics"
                  ? "border-b-2 border-white text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Mic2 size={16} />
              Lyrics
            </button>
            <button
              onClick={() => setActiveTab("queue")}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === "queue"
                  ? "border-b-2 border-white text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <ListMusic size={16} />
              Queue
              {queue.length > 0 && (
                <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
                  {queue.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 lg:px-8">
            {activeTab === "lyrics" ? (
              <div className="mx-auto max-w-lg">
                {currentSong.lyrics ? (
                  <div className="whitespace-pre-line text-base leading-relaxed text-zinc-300 sm:text-lg">
                    {currentSong.lyrics}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-500">
                    <Mic2 size={32} />
                    <p className="text-sm">Lyrics not available</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mx-auto max-w-lg">
                <QueuePanel />
                {nextSong && (
                  <div className="mt-6 border-t border-zinc-800 pt-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Next up
                    </p>
                    <div className="flex items-center gap-3 rounded-lg bg-zinc-800/50 px-3 py-2.5">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded"
                        style={{ backgroundColor: nextSong.coverColor }}
                      >
                        <Music size={14} className="text-white/60" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-200">
                          {nextSong.title}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {nextSong.artistName}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
