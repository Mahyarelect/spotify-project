import { Link } from "react-router-dom";
import { Play, Music, Pause } from "lucide-react";
import type { Song, Playlist } from "@/types/music";
import { AddToPlaylistMenu } from "./AddToPlaylistMenu";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { useTranslation } from "@/lib/i18n/useTranslation";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SingleCard({
  song,
  albumTitle,
  playlists,
  onAddToPlaylist,
  onRemoveFromPlaylist,
}: {
  song: Song;
  albumTitle?: string;
  playlists: Playlist[];
  onAddToPlaylist: (playlistId: string, songId: string) => void;
  onRemoveFromPlaylist: (playlistId: string, songId: string) => void;
}) {
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();
  const { t } = useTranslation();
  const isActive = currentSong?.id === song.id;

  const handlePlay = () => {
    if (isActive) {
      togglePlay();
    } else {
      playSong(song);
    }
  };

  return (
    <div
      className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition sm:gap-4 sm:px-4 sm:py-3 ${
        isActive
          ? "border-zinc-700 bg-zinc-800/60"
          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-800/60"
      }`}
    >
      <button
        onClick={handlePlay}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded sm:h-11 sm:w-11"
        style={{ backgroundColor: song.coverColor }}
        aria-label={isActive && isPlaying ? t.player.pause : t.player.playTitle.replace("{title}", song.title)}
      >
        {isActive && isPlaying ? (
          <Pause size={16} className="text-white" fill="currentColor" />
        ) : (
          <>
            <Music size={16} className="text-white/60 group-hover:hidden" />
            <Play
              size={16}
              className="hidden text-white group-hover:block"
              fill="currentColor"
            />
          </>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <button
          onClick={handlePlay}
          className={`block truncate text-left text-sm font-medium hover:underline ${
            isActive ? "text-green-400" : "text-zinc-100 hover:text-green-400"
          }`}
        >
          {song.title}
        </button>
        <p className="truncate text-xs text-zinc-400">
          <Link
            to={`/artist/${encodeURIComponent(song.artistName)}`}
            className="hover:text-green-400 hover:underline"
          >
            {song.artistName}
          </Link>
          {albumTitle && (
            <>
              {" · "}
              <Link
                to={`/album/${song.albumId}`}
                className="hover:text-green-400 hover:underline"
              >
                {albumTitle}
              </Link>
            </>
          )}
        </p>
      </div>

      <span className="hidden text-xs text-zinc-500 sm:block">
        {formatDuration(song.durationSec)}
      </span>

      <span className="hidden text-xs text-zinc-500 sm:block">
        {song.playCount.toLocaleString()}
      </span>

      <AddToPlaylistMenu
        playlists={playlists}
        songId={song.id}
        onAdd={(plId) => onAddToPlaylist(plId, song.id)}
        onRemove={(plId) => onRemoveFromPlaylist(plId, song.id)}
      />
    </div>
  );
}
