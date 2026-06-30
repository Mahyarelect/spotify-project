import { useRef, useCallback } from "react";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ProgressBar({
  current,
  total,
  onSeek,
  compact = false,
}: {
  current: number;
  total: number;
  onSeek: (time: number) => void;
  compact?: boolean;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  const percent = total > 0 ? (current / total) * 100 : 0;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!barRef.current || total <= 0) return;
      const rect = barRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(ratio * total);
    },
    [onSeek, total]
  );

  if (compact) {
    return (
      <div
        ref={barRef}
        className="group relative h-1 w-full cursor-pointer rounded-full bg-zinc-700"
        onClick={handleClick}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-white transition-[width] duration-1000 ease-linear group-hover:bg-green-400"
          style={{ width: `${percent}%` }}
        />
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-2">
      <span className="w-10 text-right text-xs text-zinc-400 tabular-nums">
        {formatTime(current)}
      </span>
      <div
        ref={barRef}
        className="group relative h-1.5 flex-1 cursor-pointer rounded-full bg-zinc-700"
        onClick={handleClick}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-white transition-[width] duration-1000 ease-linear group-hover:bg-green-400"
          style={{ width: `${percent}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 transition-opacity group-hover:opacity-100"
          style={{ left: `calc(${percent}% - 6px)` }}
        />
      </div>
      <span className="w-10 text-xs text-zinc-400 tabular-nums">
        {formatTime(total)}
      </span>
    </div>
  );
}
