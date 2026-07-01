import type { ArtistProfile } from "@/types/artist";
import type { User } from "@/types/user";
import type { Song, Album } from "@/types/music";
import { getUsers } from "./storage";
import { getSongs, getAlbums } from "./storage";

export function getArtistByDisplayName(
  displayName: string
): User | null {
  const users = getUsers();
  return (
    users.find(
      (u) =>
        u.role === "artist" &&
        u.displayName.toLowerCase() === displayName.toLowerCase()
    ) ?? null
  );
}

export function getArtistSongs(artistName: string): Song[] {
  return getSongs().filter(
    (s) => s.artistName.toLowerCase() === artistName.toLowerCase()
  );
}

export function getArtistAlbums(artistName: string): Album[] {
  return getAlbums().filter(
    (a) =>
      a.artistName.toLowerCase() === artistName.toLowerCase() &&
      a.songIds.length > 1
  );
}

export function getArtistSingles(artistName: string): { song: Song; album: Album | undefined }[] {
  const albums = getAlbums().filter(
    (a) =>
      a.artistName.toLowerCase() === artistName.toLowerCase() &&
      a.songIds.length === 1
  );
  const songs = getArtistSongs(artistName);

  return albums.map((album) => ({
    song: songs.find((s) => album.songIds.includes(s.id)) ?? songs[0],
    album,
  }));
}

export function getArtistTotalStreams(artistName: string): number {
  return getArtistSongs(artistName).reduce((sum, s) => sum + s.playCount, 0);
}

export function isArtistVerified(user: User): boolean {
  return user.role === "artist";
}

export function getArtistProfile(artistName: string): ArtistProfile | null {
  const user = getArtistByDisplayName(artistName);
  if (!user) return null;

  return {
    user,
    albums: getArtistAlbums(artistName),
    singles: getArtistSingles(artistName).map((s) => s.song),
    totalStreams: getArtistTotalStreams(artistName),
    isVerified: isArtistVerified(user),
  };
}
