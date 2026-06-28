import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Disc3, Play } from "lucide-react";
import { useMemo } from "react";
import { getAlbums, getSongs } from "@/lib/services/storage";
import { ROUTES } from "@/lib/constants/routes";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AlbumDetailPage() {
  const { albumId } = useParams();
  const albums = useMemo(() => getAlbums(), []);
  const songs = useMemo(() => getSongs(), []);

  const album = albums.find((a) => a.id === albumId);
  const albumSongs = useMemo(
    () => (album ? songs.filter((s) => album.songIds.includes(s.id)) : []),
    [album, songs]
  );

  if (!album) {
    return (
      <div className="space-y-4 py-20 text-center">
        <p className="text-zinc-400">Album not found.</p>
        <Link to={ROUTES.ALBUMS} className="text-green-400 hover:underline">
          Back to Albums & Singles
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.ALBUMS}
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200"
      >
        <ArrowLeft size={16} />
        Back to Albums & Singles
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div
          className="flex h-40 w-40 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: album.coverColor }}
        >
          <Disc3 size={64} className="text-white/60" />
        </div>
        <div>
          <p className="text-sm text-zinc-400">Album</p>
          <h1 className="text-3xl font-bold tracking-tight">{album.title}</h1>
          <p className="text-zinc-400">
            <Link
              to={`/artist/${encodeURIComponent(album.artistName)}`}
              className="hover:text-green-400 hover:underline"
            >
              {album.artistName}
            </Link>
            {" · "}
            {new Date(album.releaseDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            {" · "}
            {albumSongs.length} {albumSongs.length === 1 ? "song" : "songs"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
        {albumSongs.map((song, i) => (
          <div
            key={song.id}
            className="group flex items-center gap-4 rounded-lg px-4 py-3 transition hover:bg-zinc-800/60"
          >
            <div className="flex w-8 items-center justify-center">
              <span className="text-sm text-zinc-500 group-hover:hidden">
                {i + 1}
              </span>
              <Link to={`/player/${song.id}`}>
                <Play
                  size={16}
                  className="hidden text-green-400 group-hover:block"
                />
              </Link>
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
        ))}
      </div>
    </div>
  );
}
