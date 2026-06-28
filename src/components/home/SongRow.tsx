import { Play, Music } from "lucide-react";
import type { Song } from "@/types/music";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SongRow({ song, index }: { song: Song; index: number }) {
  return (
    <div className="group flex items-center gap-4 rounded-lg px-3 py-2 transition hover:bg-zinc-800/60">
      <div className="flex w-8 items-center justify-center">
        <span className="text-sm text-zinc-500 group-hover:hidden">
          {index + 1}
        </span>
        <Play
          size={16}
          className="hidden text-green-400 group-hover:block"
        />
      </div>
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded"
        style={{ backgroundColor: song.coverColor }}
      >
        <Music size={16} className="text-white/60" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-100">
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
