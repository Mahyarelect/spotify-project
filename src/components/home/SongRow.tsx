import { Play, Music, Pause } from "lucide-react";
import type { Song } from "@/types/music";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { useTranslation } from "@/lib/i18n/useTranslation";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SongRow({
  song,
  index,
  queue,
}: {
  song: Song;
  index: number;
  queue?: Song[];
}) {
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();
  const { t } = useTranslation();
  const isActive = currentSong?.id === song.id;

  const handleClick = () => {
    if (isActive) {
      togglePlay();
    } else {
      playSong(song, queue);
    }
  };

  return (
    <div
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-zinc-800/60 sm:gap-4 ${
        isActive ? "bg-zinc-800/40" : ""
      }`}
    >
      <button
        onClick={handleClick}
        className="flex w-8 items-center justify-center"
        aria-label={isActive && isPlaying ? t.player.pause : t.player.playTitle.replace("{title}", song.title)}
      >
        {isActive && isPlaying ? (
          <Pause size={16} className="text-green-400" fill="currentColor" />
        ) : (
          <>
            <span
              className={`text-sm group-hover:hidden ${
                isActive ? "text-green-400" : "text-zinc-500"
              }`}
            >
              {index + 1}
            </span>
            <Play
              size={16}
              className="hidden text-green-400 group-hover:block"
              fill="currentColor"
            />
          </>
        )}
      </button>
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded"
        style={{ backgroundColor: song.coverColor }}
      >
        <Music size={16} className="text-white/60" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium ${
            isActive ? "text-green-400" : "text-zinc-100"
          }`}
        >
          {song.title}
        </p>
        <p className="truncate text-xs text-zinc-400">{song.artistName}</p>
      </div>
      <span className="text-xs text-zinc-500">
        {formatDuration(song.durationSec)}
      </span>
    </div>
  );
}
