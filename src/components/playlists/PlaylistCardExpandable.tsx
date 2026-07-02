import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  Music,
  Play,
  Pause,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";
import type { Playlist, Song } from "@/types/music";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { useTranslation } from "@/lib/i18n/useTranslation";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlaylistCardExpandable({
  playlist,
  songs,
  onRename,
  onDelete,
  onRemoveSong,
}: {
  playlist: Playlist;
  songs: Song[];
  onRename: (newTitle: string) => void;
  onDelete: () => void;
  onRemoveSong: (songId: string) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(playlist.title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();

  const playlistSongs = songs.filter((s) => playlist.songIds.includes(s.id));
  const isPlaylistPlaying =
    currentSong && playlistSongs.some((s) => s.id === currentSong.id) && isPlaying;

  const handleSaveRename = () => {
    if (editTitle.trim()) {
      onRename(editTitle.trim());
      setEditing(false);
    }
  };

  const handlePlayAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaylistPlaying) {
      togglePlay();
    } else if (playlistSongs.length > 0) {
      playSong(playlistSongs[0], playlistSongs);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
      <div
        className="flex cursor-pointer items-center gap-3 p-4 transition hover:bg-zinc-800/40 sm:gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg sm:h-14 sm:w-14"
          style={{ backgroundColor: playlist.coverColor }}
        >
          <Music size={20} className="text-white/60" />
        </div>

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveRename();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 focus:border-green-500 focus:outline-none"
                autoFocus
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveRename();
                }}
                className="rounded p-1 text-green-400 hover:bg-zinc-700"
              >
                <Check size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(false);
                  setEditTitle(playlist.title);
                }}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-700"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <h3 className="truncate text-sm font-semibold text-zinc-100 sm:text-base">
              {playlist.title}
            </h3>
          )}
          <p className="text-xs text-zinc-400">
            {playlistSongs.length}{" "}
            {playlistSongs.length === 1 ? t.playlists.song : t.playlists.songs}
            {playlist.description && ` · ${playlist.description}`}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {playlistSongs.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="rounded-full p-2 text-green-400 transition hover:bg-zinc-700"
              aria-label={isPlaylistPlaying ? t.playlists.pausePlaylist : t.playlists.playPlaylist}
            >
              {isPlaylistPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
            </button>
          )}
          {!editing && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(true);
                  setEditTitle(playlist.title);
                }}
                className="rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-200"
                title={t.playlists.renamePlaylist}
              >
                <Pencil size={14} />
              </button>
              {confirmDelete ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="rounded-full p-1.5 text-red-400 transition hover:bg-red-900/30"
                    title={t.playlists.confirmDelete}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(false);
                    }}
                    className="rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-700"
                    title={t.playlists.cancel}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(true);
                  }}
                  className="rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-700 hover:text-red-400"
                  title={t.playlists.deletePlaylist}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </>
          )}
          {expanded ? (
            <ChevronUp size={18} className="text-zinc-400" />
          ) : (
            <ChevronDown size={18} className="text-zinc-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-zinc-800">
          {playlistSongs.length === 0 ? (
            <p className="p-4 text-center text-sm text-zinc-400">
              {t.playlists.emptySongList}{" "}
              <Link
                to="/albums"
                className="text-green-400 hover:underline"
              >
                {t.playlists.browseAlbums}
              </Link>{" "}
              {t.playlists.addSongsHint}
            </p>
          ) : (
            playlistSongs.map((song, i) => {
              const isActive = currentSong?.id === song.id;
              return (
                <div
                  key={song.id}
                  className={`group flex items-center gap-3 px-4 py-2.5 transition hover:bg-zinc-800/40 sm:gap-4 ${
                    isActive ? "bg-zinc-800/30" : ""
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isActive) {
                        togglePlay();
                      } else {
                        playSong(song, playlistSongs);
                      }
                    }}
                    className="flex w-6 items-center justify-center sm:w-8"
                    aria-label={isActive && isPlaying ? t.player.pause : t.player.playTitle.replace("{title}", song.title)}
                  >
                    {isActive && isPlaying ? (
                      <Pause size={14} className="text-green-400" fill="currentColor" />
                    ) : (
                      <>
                        <span
                          className={`text-xs group-hover:hidden ${
                            isActive ? "text-green-400" : "text-zinc-500"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <Play
                          size={14}
                          className="hidden text-green-400 group-hover:block"
                          fill="currentColor"
                        />
                      </>
                    )}
                  </button>
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded sm:h-10 sm:w-10"
                    style={{ backgroundColor: song.coverColor }}
                  >
                    <Music size={14} className="text-white/60" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`block truncate text-sm font-medium ${
                        isActive ? "text-green-400" : "text-zinc-100"
                      }`}
                    >
                      {song.title}
                    </p>
                    <Link
                      to={`/artist/${encodeURIComponent(song.artistName)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="block truncate text-xs text-zinc-400 hover:text-green-400 hover:underline"
                    >
                      {song.artistName}
                    </Link>
                  </div>
                  <span className="hidden text-xs text-zinc-500 sm:block">
                    {formatDuration(song.durationSec)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSong(song.id);
                    }}
                    className="rounded-full p-1 text-zinc-500 opacity-0 transition hover:bg-zinc-700 hover:text-red-400 group-hover:opacity-100"
                    title={t.playlists.removeFromPlaylist}
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
