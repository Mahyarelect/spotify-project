import { X, Music, GripVertical } from "lucide-react";
import type { Song } from "@/types/music";
import { useTranslation } from "@/lib/i18n/useTranslation";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function QueueItem({
  song,
  index: _index,
  isCurrent,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  song: Song;
  index: number;
  isCurrent: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 transition ${
        isCurrent ? "bg-zinc-800" : "hover:bg-zinc-800/50"
      }`}
    >
      <div className="flex flex-col items-center gap-0.5">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="text-zinc-600 transition hover:text-zinc-300 disabled:invisible"
          aria-label={t.queue.moveUp}
        >
          <GripVertical size={12} />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="text-zinc-600 transition hover:text-zinc-300 disabled:invisible"
          aria-label={t.queue.moveDown}
        >
          <GripVertical size={12} />
        </button>
      </div>
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
        style={{ backgroundColor: song.coverColor }}
      >
        <Music size={12} className="text-white/60" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm ${isCurrent ? "font-semibold text-green-400" : "text-zinc-200"}`}
        >
          {song.title}
        </p>
        <p className="truncate text-xs text-zinc-500">{song.artistName}</p>
      </div>
      <span className="text-xs text-zinc-500">{formatDuration(song.durationSec)}</span>
      <button
        onClick={onRemove}
        className="rounded p-1 text-zinc-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
        aria-label={t.queue.remove.replace("{title}", song.title)}
      >
        <X size={14} />
      </button>
    </div>
  );
}
