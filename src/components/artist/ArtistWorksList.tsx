import { Link } from "react-router-dom";
import { Music, Disc3 } from "lucide-react";
import type { Song, Album } from "@/types/music";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/lib/i18n/useTranslation";

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface ArtistWorksListProps {
  albums: Album[];
  singles: Song[];
  allSongs: Song[];
}

export function ArtistWorksList({
  albums,
  singles,
  allSongs,
}: ArtistWorksListProps) {
  const { t } = useTranslation();
  const { playSong } = usePlayer();

  return (
    <div className="space-y-8">
      {albums.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold">{t.artist.albums}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => {
              const albumSongs = allSongs.filter((s) =>
                album.songIds.includes(s.id)
              );
              return (
                <Link
                  key={album.id}
                  to={ROUTES.ALBUM_DETAIL.replace(":albumId", album.id)}
                  className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition hover:bg-zinc-800/50"
                >
                  <div
                    className="mb-3 flex aspect-square items-center justify-center rounded-lg"
                    style={{ backgroundColor: album.coverColor }}
                  >
                    <Disc3 size={48} className="text-white/30" />
                  </div>
                  <h3 className="font-semibold group-hover:text-green-400">
                    {album.title}
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {album.songIds.length} {t.common.songs} ·{" "}
                    {new Date(album.releaseDate).getFullYear()}
                  </p>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (albumSongs.length > 0) playSong(albumSongs[0], albumSongs);
                    }}
                    className="mt-2 text-xs text-green-400 hover:text-green-300"
                  >
                    {t.artist.playAll}
                  </button>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {singles.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold">{t.artist.singles}</h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
            {singles.map((song, i) => (
              <div
                key={song.id}
                className="group flex items-center gap-3 px-4 py-3 transition hover:bg-zinc-800/50"
              >
                <span className="w-6 text-center text-sm text-zinc-500">
                  {i + 1}
                </span>
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded"
                  style={{ backgroundColor: song.coverColor }}
                >
                  {song.coverImage ? (
                    <img
                      src={song.coverImage}
                      alt={song.title}
                      className="h-full w-full rounded object-cover"
                    />
                  ) : (
                    <Music size={16} className="text-white/40" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{song.title}</p>
                  <p className="text-xs text-zinc-500">
                    {formatDuration(song.durationSec)}
                  </p>
                </div>
                <span className="text-xs text-zinc-500">
                  {song.playCount.toLocaleString()} {t.artist.plays}
                </span>
                <button
                  onClick={() => playSong(song, [song])}
                  className="rounded p-1 text-zinc-500 opacity-0 transition hover:text-white group-hover:opacity-100"
                  aria-label={`Play ${song.title}`}
                >
                  <Music size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {albums.length === 0 && singles.length === 0 && (
        <div className="py-12 text-center text-zinc-500">
          <Disc3 size={32} className="mx-auto mb-2 text-zinc-600" />
          <p className="text-sm">{t.artist.noWorks}</p>
        </div>
      )}
    </div>
  );
}
