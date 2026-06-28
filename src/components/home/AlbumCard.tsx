import { Disc3 } from "lucide-react";
import type { Album } from "@/types/music";

export function AlbumCard({ album }: { album: Album }) {
  return (
    <div className="group w-40 shrink-0 cursor-pointer">
      <div
        className="flex aspect-square items-center justify-center rounded-lg transition group-hover:brightness-110"
        style={{ backgroundColor: album.coverColor }}
      >
        <Disc3 size={40} className="text-white/60" />
      </div>
      <h3 className="mt-2 truncate text-sm font-semibold text-zinc-100">
        {album.title}
      </h3>
      <p className="text-xs text-zinc-400">{album.artistName}</p>
      <p className="text-xs text-zinc-500">
        {new Date(album.releaseDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
    </div>
  );
}
