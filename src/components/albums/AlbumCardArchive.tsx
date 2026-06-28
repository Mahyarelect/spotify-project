import { Link } from "react-router-dom";
import { Disc3 } from "lucide-react";
import type { Album } from "@/types/music";

export function AlbumCardArchive({ album }: { album: Album }) {
  return (
    <div className="group w-40 shrink-0 cursor-pointer sm:w-44">
      <Link to={`/album/${album.id}`}>
        <div
          className="flex aspect-square items-center justify-center rounded-lg transition group-hover:brightness-110"
          style={{ backgroundColor: album.coverColor }}
        >
          <Disc3 size={40} className="text-white/60" />
        </div>
      </Link>
      <h3 className="mt-2 truncate text-sm font-semibold text-zinc-100">
        <Link
          to={`/album/${album.id}`}
          className="hover:text-green-400 hover:underline"
        >
          {album.title}
        </Link>
      </h3>
      <p className="text-xs text-zinc-400">
        <Link
          to={`/artist/${encodeURIComponent(album.artistName)}`}
          className="hover:text-green-400 hover:underline"
        >
          {album.artistName}
        </Link>
      </p>
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
