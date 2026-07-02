import { useState } from "react";
import { Edit, Trash2, Music, Disc3, ChevronDown, ChevronUp } from "lucide-react";
import type { Song, Album } from "@/types/music";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface ArtistWorksTableProps {
  songs: Song[];
  albums: Album[];
  onEditSong: (song: Song) => void;
  onDeleteSong: (songId: string) => void;
  onEditAlbum: (album: Album) => void;
  onDeleteAlbum: (albumId: string) => void;
}

export function ArtistWorksTable({
  songs,
  albums,
  onEditSong,
  onDeleteSong,
  onEditAlbum,
  onDeleteAlbum,
}: ArtistWorksTableProps) {
  const [activeTab, setActiveTab] = useState<"songs" | "albums">("songs");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab("songs")}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === "songs"
              ? "border-b-2 border-green-400 text-green-400"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Music size={14} className="mr-1 inline" />
          {t.artistDashboard.songs.replace("{count}", String(songs.length))}
        </button>
        <button
          onClick={() => setActiveTab("albums")}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === "albums"
              ? "border-b-2 border-green-400 text-green-400"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Disc3 size={14} className="mr-1 inline" />
          {t.artistDashboard.albums.replace("{count}", String(albums.length))}
        </button>
      </div>

      {activeTab === "songs" && (
        <div className="rounded-xl border border-zinc-800">
          {songs.length === 0 ? (
            <p className="p-6 text-center text-sm text-zinc-500">
              {t.artistDashboard.noSongs}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
                  <th className="px-4 py-3">{t.artistDashboard.tableTitle}</th>
                  <th className="hidden px-4 py-3 sm:table-cell">{t.artistDashboard.genre}</th>
                  <th className="hidden px-4 py-3 md:table-cell">{t.artistDashboard.plays}</th>
                  <th className="hidden px-4 py-3 lg:table-cell">{t.artistDashboard.duration}</th>
                  <th className="px-4 py-3 text-right">{t.artistDashboard.tableActions}</th>
                </tr>
              </thead>
              <tbody>
                {songs.map((song) => (
                  <tr
                    key={song.id}
                    className="border-b border-zinc-800/50 transition hover:bg-zinc-800/30"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          setExpandedId(
                            expandedId === song.id ? null : song.id
                          )
                        }
                        className="flex items-center gap-2 text-left"
                      >
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
                          style={{ backgroundColor: song.coverColor }}
                        >
                          <Music size={12} className="text-white/40" />
                        </div>
                        <div>
                          <p className="font-medium text-zinc-100">
                            {song.title}
                          </p>
                          {expandedId === song.id && (
                            <div className="mt-1 space-y-0.5 text-xs text-zinc-500">
                              {song.lyrics && <p>{t.artistDashboard.hasLyrics}</p>}
                              {song.collaborators &&
                                song.collaborators.length > 0 && (
                                  <p>
                                    {t.artistDashboard.with.replace("{collaborators}", song.collaborators.join(", "))}
                                  </p>
                                )}
                            </div>
                          )}
                        </div>
                        {expandedId === song.id ? (
                          <ChevronUp size={14} className="text-zinc-500" />
                        ) : (
                          <ChevronDown size={14} className="text-zinc-500" />
                        )}
                      </button>
                    </td>
                    <td className="hidden px-4 py-3 text-zinc-400 sm:table-cell">
                      {song.genre || "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-zinc-400 md:table-cell">
                      {song.playCount.toLocaleString()}
                    </td>
                    <td className="hidden px-4 py-3 text-zinc-400 lg:table-cell">
                      {Math.floor(song.durationSec / 60)}:
                      {(song.durationSec % 60).toString().padStart(2, "0")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onEditSong(song)}
                        className="mr-2 rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                        title={t.artistDashboard.edit}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteSong(song.id)}
                        className="rounded p-1 text-zinc-500 hover:bg-red-950 hover:text-red-400"
                        title={t.artistDashboard.delete}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "albums" && (
        <div className="rounded-xl border border-zinc-800">
          {albums.length === 0 ? (
            <p className="p-6 text-center text-sm text-zinc-500">
              {t.artistDashboard.noAlbums}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
                  <th className="px-4 py-3">{t.artistDashboard.tableTitle}</th>
                  <th className="hidden px-4 py-3 sm:table-cell">{t.artistDashboard.genre}</th>
                  <th className="hidden px-4 py-3 md:table-cell">{t.artistDashboard.songsCount}</th>
                  <th className="hidden px-4 py-3 lg:table-cell">{t.artistDashboard.released}</th>
                  <th className="px-4 py-3 text-right">{t.artistDashboard.tableActions}</th>
                </tr>
              </thead>
              <tbody>
                {albums.map((album) => (
                  <tr
                    key={album.id}
                    className="border-b border-zinc-800/50 transition hover:bg-zinc-800/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
                          style={{ backgroundColor: album.coverColor }}
                        >
                          <Disc3 size={12} className="text-white/40" />
                        </div>
                        <div>
                          <p className="font-medium text-zinc-100">
                            {album.title}
                          </p>
                          {album.isEarlyAccess && (
                            <span className="text-[10px] font-medium text-yellow-400">
                              {t.artistDashboard.earlyAccess}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-zinc-400 sm:table-cell">
                      {album.genre || "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-zinc-400 md:table-cell">
                      {album.songIds.length}
                    </td>
                    <td className="hidden px-4 py-3 text-zinc-400 lg:table-cell">
                      {new Date(album.releaseDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onEditAlbum(album)}
                        className="mr-2 rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                        title={t.artistDashboard.edit}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteAlbum(album.id)}
                        className="rounded p-1 text-zinc-500 hover:bg-red-950 hover:text-red-400"
                        title={t.artistDashboard.delete}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
