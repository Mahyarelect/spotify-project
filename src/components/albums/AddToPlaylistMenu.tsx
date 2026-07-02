import { useState, useRef, useEffect } from "react";
import { ListPlus, Check } from "lucide-react";
import type { Playlist } from "@/types/music";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function AddToPlaylistMenu({
  playlists,
  songId,
  onAdd,
  onRemove,
}: {
  playlists: Playlist[];
  songId: string;
  onAdd: (playlistId: string) => void;
  onRemove: (playlistId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-200"
        title={t.playlists.addToPlaylist}
      >
        <ListPlus size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-56 rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-xl">
          {playlists.length === 0 ? (
            <p className="px-3 py-2 text-xs text-zinc-400">
              {t.playlists.noneYet}
            </p>
          ) : (
            playlists.map((pl) => {
              const inPlaylist = pl.songIds.includes(songId);
              return (
                <button
                  key={pl.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (inPlaylist) {
                      onRemove(pl.id);
                    } else {
                      onAdd(pl.id);
                    }
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-zinc-700"
                >
                  {inPlaylist ? (
                    <Check size={14} className="shrink-0 text-green-400" />
                  ) : (
                    <span className="w-3.5 shrink-0" />
                  )}
                  <span
                    className={`truncate ${inPlaylist ? "text-zinc-100" : "text-zinc-300"}`}
                  >
                    {pl.title}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
