import { Link } from "react-router-dom";
import { Disc3 } from "lucide-react";
import type { Album } from "@/types/music";

export function AlbumCard({ album }: { album: Album }) {
  return (
    <Link to={`/album/${album.id}`} className="group w-40 shrink-0">
      <div
        className="flex aspect-square items-center justify-center rounded-lg transition group-hover:brightness-110"
        style={{ backgroundColor: album.coverColor }}
      >
        <Disc3 size={40} className="text-white/60" />
      </div>
      <h3 className="mt-2 truncate text-sm font-semibold text-zinc-100 group-hover:text-green-400">
        {album.title}
      </h3>
      <p className="text-xs text-zinc-400 group-hover:text-zinc-300">{album.artistName}</p>
      <p className="text-xs text-zinc-500">
        {new Date(album.releaseDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
    </Link>
  );
}
