import type { Song, Album, Playlist, RecentlyPlayed } from "@/types/music";
import {
  getSongs as readSongs,
  getAlbums as readAlbums,
  getPlaylists as readPlaylists,
  getRecentlyPlayed as readRecentlyPlayed,
} from "./storage";

export function getAllSongs(): Song[] {
  return readSongs();
}

export function getAllAlbums(): Album[] {
  return readAlbums();
}

export function getAllPlaylists(): Playlist[] {
  return readPlaylists();
}

export function getRecentlyPlayed(userId: string): RecentlyPlayed[] {
  return readRecentlyPlayed(userId);
}

export function getSongById(songId: string): Song | undefined {
  return readSongs().find((s) => s.id === songId);
}

export function getAlbumById(albumId: string): Album | undefined {
  return readAlbums().find((a) => a.id === albumId);
}

export function getAlbumSongs(albumId: string): Song[] {
  const album = readAlbums().find((a) => a.id === albumId);
  if (!album) return [];
  const songs = readSongs();
  return songs.filter((s) => album.songIds.includes(s.id));
}
