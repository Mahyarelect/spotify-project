import { Music } from "lucide-react";
import type { Playlist } from "@/types/music";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const { t } = useTranslation();
  return (
    <div className="group w-40 shrink-0 cursor-pointer">
      <div
        className="flex aspect-square items-center justify-center rounded-lg transition group-hover:brightness-110"
        style={{ backgroundColor: playlist.coverColor }}
      >
        <Music size={40} className="text-white/60" />
      </div>
      <h3 className="mt-2 truncate text-sm font-semibold text-zinc-100">
        {playlist.title}
      </h3>
      <p className="text-xs text-zinc-400">
        {playlist.songIds.length} {playlist.songIds.length === 1 ? t.playlists.song : t.playlists.songs}
      </p>
    </div>
  );
}
