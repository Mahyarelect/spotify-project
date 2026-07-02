import { Link } from "react-router-dom";
import { Music, ChevronUp, ListMusic, X, AlertCircle } from "lucide-react";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { PlayPauseButton } from "./controls/PlayPauseButton";
import { SkipButton } from "./controls/SkipButton";
import { ProgressBar } from "./controls/ProgressBar";
import { VolumeControl } from "./controls/VolumeControl";
import { RepeatButton } from "./controls/RepeatButton";
import { ShuffleButton } from "./controls/ShuffleButton";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function PlayerBar() {
  const { t } = useTranslation();
  const {
    currentSong,
    isPlaying,
    progress,
    volume,
    shuffle,
    repeatMode,
    streamError,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleShuffle,
    cycleRepeat,
    expand,
    clearStreamError,
  } = usePlayer();

  const [showQueue, setShowQueue] = useState(false);

  if (!currentSong) {
    if (streamError) {
      return (
        <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center gap-3 border-t border-red-900/50 bg-red-950 px-4 py-3 text-sm text-red-200">
          <AlertCircle size={16} className="shrink-0" />
          <p className="flex-1">{streamError}</p>
          <button onClick={clearStreamError} className="shrink-0 text-red-400 hover:text-red-200">
            <X size={16} />
          </button>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {/* Stream error toast */}
      {streamError && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-red-900/50 bg-red-950 px-4 py-2 text-sm text-red-200 shadow-lg sm:bottom-[88px]">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <p>{streamError}</p>
            <button onClick={clearStreamError} className="ml-2 text-red-400 hover:text-red-200">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile compact progress bar */}
      <div className="fixed bottom-[64px] left-0 right-0 z-40 sm:hidden">
        <ProgressBar
          current={progress}
          total={currentSong.durationSec}
          onSeek={seek}
          compact
        />
      </div>

      {/* Player bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">
        {/* Desktop layout */}
        <div className="hidden h-[72px] sm:grid sm:grid-cols-[1fr_2fr_1fr] sm:items-center sm:gap-4 sm:px-4">
          {/* Left: song info */}
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-md transition hover:opacity-80"
              style={{ backgroundColor: currentSong.coverColor }}
              onClick={expand}
            >
              {currentSong.coverImage ? (
                <img
                  src={currentSong.coverImage}
                  alt={currentSong.title}
                  className="h-full w-full rounded-md object-cover"
                />
              ) : (
                <Music size={20} className="text-white/60" />
              )}
            </div>
            <div className="min-w-0">
              <p
                className="cursor-pointer truncate text-sm font-medium text-zinc-100 hover:underline"
                onClick={expand}
              >
                {currentSong.title}
              </p>
              <Link
                to={`/artist/${encodeURIComponent(currentSong.artistName)}`}
                className="block truncate text-xs text-zinc-400 hover:text-green-400 hover:underline"
              >
                {currentSong.artistName}
              </Link>
            </div>
          </div>

          {/* Center: controls + progress */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-4">
              <ShuffleButton active={shuffle} onToggle={toggleShuffle} />
              <SkipButton direction="back" onClick={previous} />
              <PlayPauseButton isPlaying={isPlaying} onClick={togglePlay} size="md" />
              <SkipButton direction="forward" onClick={next} />
              <RepeatButton mode={repeatMode} onCycle={cycleRepeat} />
            </div>
            <ProgressBar
              current={progress}
              total={currentSong.durationSec}
              onSeek={seek}
            />
          </div>

          {/* Right: volume + queue + expand */}
          <div className="flex items-center justify-end gap-3">
            <VolumeControl volume={volume} onChange={setVolume} />
            <button
              onClick={() => setShowQueue((v) => !v)}
              className={`text-zinc-400 transition hover:text-white ${showQueue ? "text-green-400" : ""}`}
              aria-label={t.player.toggleQueue}
            >
              <ListMusic size={18} />
            </button>
            <button
              onClick={expand}
              className="text-zinc-400 transition hover:text-white"
              aria-label="Expand player"
            >
              <ChevronUp size={18} />
            </button>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="flex h-16 items-center gap-3 px-3 sm:hidden">
          <div
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md"
            style={{ backgroundColor: currentSong.coverColor }}
            onClick={expand}
          >
            {currentSong.coverImage ? (
              <img
                src={currentSong.coverImage}
                alt={currentSong.title}
                className="h-full w-full rounded-md object-cover"
              />
            ) : (
              <Music size={16} className="text-white/60" />
            )}
          </div>
          <div className="min-w-0 flex-1" onClick={expand} role="button" tabIndex={0}>
            <p className="truncate text-sm font-medium text-zinc-100">
              {currentSong.title}
            </p>
            <p className="truncate text-xs text-zinc-400">
              {currentSong.artistName}
            </p>
          </div>
          <PlayPauseButton isPlaying={isPlaying} onClick={togglePlay} size="sm" />
          <button
            onClick={expand}
            className="text-zinc-400"
            aria-label={t.player.expand}
          >
            <ChevronUp size={20} />
          </button>
        </div>
      </div>
    </>
  );
}
