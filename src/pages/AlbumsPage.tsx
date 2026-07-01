import { useState, useMemo, useCallback } from "react";
import { getAllSongs, getAllAlbums } from "@/lib/services/musicService";
import { useAuth } from "@/lib/hooks/useAuth";
import * as playlistService from "@/lib/services/playlistService";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchBar } from "@/components/albums/SearchBar";
import { FilterSortBar, type SortOption } from "@/components/albums/FilterSortBar";
import { AlbumCardArchive } from "@/components/albums/AlbumCardArchive";
import { SingleCard } from "@/components/albums/SingleCard";
import type { Playlist } from "@/types/music";

export default function AlbumsPage() {
  const { user } = useAuth();
  const allSongs = useMemo(() => getAllSongs(), []);
  const allAlbums = useMemo(() => getAllAlbums(), []);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("playCount-desc");
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>(() =>
    user ? playlistService.getUserPlaylists(user.id) : []
  );

  const refreshPlaylists = useCallback(() => {
    if (!user) return;
    setUserPlaylists(playlistService.getUserPlaylists(user.id));
  }, [user]);

  const handleAddToPlaylist = useCallback(
    (playlistId: string, songId: string) => {
      playlistService.addSongToPlaylist(playlistId, songId);
      refreshPlaylists();
    },
    [refreshPlaylists]
  );

  const handleRemoveFromPlaylist = useCallback(
    (playlistId: string, songId: string) => {
      playlistService.removeSongFromPlaylist(playlistId, songId);
      refreshPlaylists();
    },
    [refreshPlaylists]
  );

  const albumMap = useMemo(
    () => new Map(allAlbums.map((a) => [a.id, a])),
    [allAlbums]
  );

  const lowerQuery = query.toLowerCase().trim();

  const filteredAlbums = useMemo(() => {
    let results = allAlbums;
    if (lowerQuery) {
      results = results.filter(
        (a) =>
          a.title.toLowerCase().includes(lowerQuery) ||
          a.artistName.toLowerCase().includes(lowerQuery)
      );
    }
    const sorted = [...results];
    if (sort === "releaseDate-desc") {
      sorted.sort(
        (a, b) =>
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
      );
    } else if (sort === "releaseDate-asc") {
      sorted.sort(
        (a, b) =>
          new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
      );
    } else {
      sorted.sort((a, b) => {
        const aPlays = a.songIds.reduce(
          (sum, id) => sum + (allSongs.find((s) => s.id === id)?.playCount ?? 0),
          0
        );
        const bPlays = b.songIds.reduce(
          (sum, id) => sum + (allSongs.find((s) => s.id === id)?.playCount ?? 0),
          0
        );
        return sort === "playCount-desc" ? bPlays - aPlays : aPlays - bPlays;
      });
    }
    return sorted;
  }, [allAlbums, allSongs, lowerQuery, sort]);

  const filteredSongs = useMemo(() => {
    let results = allSongs;
    if (lowerQuery) {
      results = results.filter(
        (s) =>
          s.title.toLowerCase().includes(lowerQuery) ||
          s.artistName.toLowerCase().includes(lowerQuery)
      );
    }
    const sorted = [...results];
    if (sort === "playCount-desc") {
      sorted.sort((a, b) => b.playCount - a.playCount);
    } else if (sort === "playCount-asc") {
      sorted.sort((a, b) => a.playCount - b.playCount);
    } else if (sort === "releaseDate-desc") {
      sorted.sort((a, b) => {
        const aDate = albumMap.get(a.albumId)?.releaseDate ?? "";
        const bDate = albumMap.get(b.albumId)?.releaseDate ?? "";
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
    } else {
      sorted.sort((a, b) => {
        const aDate = albumMap.get(a.albumId)?.releaseDate ?? "";
        const bDate = albumMap.get(b.albumId)?.releaseDate ?? "";
        return new Date(aDate).getTime() - new Date(bDate).getTime();
      });
    }
    return sorted;
  }, [allSongs, lowerQuery, sort, albumMap]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Albums & Singles"
        description="Search and discover music. Filter by listeners or release date."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by song or artist name..."
          />
        </div>
        <FilterSortBar value={sort} onChange={setSort} />
      </div>

      {filteredAlbums.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Albums</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredAlbums.map((album) => (
              <AlbumCardArchive key={album.id} album={album} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Songs</h2>
        {filteredSongs.length === 0 ? (
          <p className="py-8 text-center text-zinc-400">
            No songs found matching your search.
          </p>
        ) : (
          <div className="space-y-1">
            {filteredSongs.map((song) => (
              <SingleCard
                key={song.id}
                song={song}
                albumTitle={albumMap.get(song.albumId)?.title}
                playlists={userPlaylists}
                onAddToPlaylist={handleAddToPlaylist}
                onRemoveFromPlaylist={handleRemoveFromPlaylist}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
