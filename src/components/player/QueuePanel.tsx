import { ListMusic } from "lucide-react";
import { QueueItem } from "./QueueItem";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function QueuePanel() {
  const { t } = useTranslation();
  const { queue, currentIndex, removeFromQueue, reorderQueue, stop } = usePlayer();

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-zinc-500">
        <ListMusic size={32} />
        <p className="text-sm">{t.queue.empty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-zinc-300">{t.queue.heading}</h3>
        <button
          onClick={stop}
          className="text-xs text-zinc-500 transition hover:text-red-400"
        >
          {t.queue.clearAll}
        </button>
      </div>
      <div className="max-h-72 space-y-0.5 overflow-y-auto pr-1 lg:max-h-96">
        {queue.map((song, i) => (
          <QueueItem
            key={`${song.id}-${i}`}
            song={song}
            index={i}
            isCurrent={i === currentIndex}
            onRemove={() => removeFromQueue(i)}
            onMoveUp={() => {
              if (i > 0) reorderQueue(i, i - 1);
            }}
            onMoveDown={() => {
              if (i < queue.length - 1) reorderQueue(i, i + 1);
            }}
            isFirst={i === 0}
            isLast={i === queue.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
