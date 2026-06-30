import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Disc3, Play, Pause, Shuffle } from "lucide-react";
import { useMemo } from "react";
import { getAlbums, getSongs } from "@/lib/services/storage";
import { ROUTES } from "@/lib/constants/routes";
import { usePlayer } from "@/lib/hooks/usePlayer";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AlbumDetailPage() {
  const { albumId } = useParams();
  const albums = useMemo(() => getAlbums(), []);
  const songs = useMemo(() => getSongs(), []);
  const { currentSong, isPlaying, playSong, togglePlay, toggleShuffle } = usePlayer();

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

  const isAlbumPlaying =
    currentSong && albumSongs.some((s) => s.id === currentSong.id) && isPlaying;

  const handlePlayAll = () => {
    if (isAlbumPlaying) {
      togglePlay();
    } else if (albumSongs.length > 0) {
      playSong(albumSongs[0], albumSongs);
    }
  };

  const handleShufflePlay = () => {
    if (albumSongs.length > 0) {
      toggleShuffle();
      const randomIndex = Math.floor(Math.random() * albumSongs.length);
      playSong(albumSongs[randomIndex], albumSongs);
    }
  };

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
          className="flex h-40 w-40 shrink-0 items-center justify-center rounded-xl shadow-lg shadow-black/30"
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
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 rounded-full bg-green-500 px-5 py-2 text-sm font-semibold text-black transition hover:bg-green-400"
            >
              {isAlbumPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
              {isAlbumPlaying ? "Pause" : "Play All"}
            </button>
            <button
              onClick={handleShufflePlay}
              className="flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
            >
              <Shuffle size={16} />
              Shuffle
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
        {albumSongs.map((song, i) => {
          const isActive = currentSong?.id === song.id;
          return (
            <div
              key={song.id}
              className={`group flex items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-zinc-800/60 sm:gap-4 sm:px-4 ${
                isActive ? "bg-zinc-800/40" : ""
              }`}
            >
              <button
                onClick={() => {
                  if (isActive) {
                    togglePlay();
                  } else {
                    playSong(song, albumSongs);
                  }
                }}
                className="flex w-8 items-center justify-center"
                aria-label={isActive && isPlaying ? "Pause" : `Play ${song.title}`}
              >
                {isActive && isPlaying ? (
                  <Pause size={16} className="text-green-400" fill="currentColor" />
                ) : (
                  <>
                    <span
                      className={`text-sm group-hover:hidden ${
                        isActive ? "text-green-400" : "text-zinc-500"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <Play
                      size={16}
                      className="hidden text-green-400 group-hover:block"
                      fill="currentColor"
                    />
                  </>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-medium ${
                    isActive ? "text-green-400" : "text-zinc-100"
                  }`}
                >
                  {song.title}
                </p>
                <Link
                  to={`/artist/${encodeURIComponent(song.artistName)}`}
                  className="block truncate text-xs text-zinc-400 hover:text-green-400 hover:underline"
                >
                  {song.artistName}
                </Link>
              </div>
              <span className="text-xs text-zinc-500">
                {formatDuration(song.durationSec)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
