import type { Song, Album } from "@/types/music";
import {
  getSongs,
  saveSongs,
  getAlbums,
  saveAlbums,
} from "./storage";
import { MOCK_USERS } from "@/lib/mockData/users";

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function getWorksByArtist(artistName: string): {
  songs: Song[];
  albums: Album[];
} {
  const songs = getSongs().filter(
    (s) => s.artistName.toLowerCase() === artistName.toLowerCase()
  );
  const albums = getAlbums().filter(
    (a) => a.artistName.toLowerCase() === artistName.toLowerCase()
  );
  return { songs, albums };
}

export function getArtistListenerCount(artistName: string): number {
  const songs = getSongs().filter(
    (s) => s.artistName.toLowerCase() === artistName.toLowerCase()
  );
  const artistIds = new Set(songs.map((s) => s.artistId).filter(Boolean));
  if (artistIds.size === 0) return 0;
  const artist = MOCK_USERS.find(
    (u) => u.id === [...artistIds][0]
  );
  return artist?.followersCount ?? 0;
}

export function getArtistRevenue(artistName: string): number {
  const totalStreams = getSongs()
    .filter((s) => s.artistName.toLowerCase() === artistName.toLowerCase())
    .reduce((sum, s) => sum + s.playCount, 0);
  return Math.round(totalStreams * 0.003 * 100) / 100;
}

export interface CreateSongData {
  title: string;
  artistName: string;
  artistId: string;
  albumId: string;
  durationSec: number;
  coverColor: string;
  coverImage?: string;
  lyrics?: string;
  genre?: string;
  releaseYear?: number;
  collaborators?: string[];
}

export function createSong(data: CreateSongData): Song {
  const songs = getSongs();
  const song: Song = {
    id: createId("s"),
    title: data.title,
    artistName: data.artistName,
    artistId: data.artistId,
    albumId: data.albumId,
    durationSec: data.durationSec,
    coverColor: data.coverColor,
    coverImage: data.coverImage,
    playCount: 0,
    lyrics: data.lyrics,
    genre: data.genre,
    releaseYear: data.releaseYear,
    collaborators: data.collaborators,
  };
  songs.push(song);
  saveSongs(songs);
  return song;
}

export function updateSong(
  songId: string,
  patch: Partial<Omit<Song, "id" | "playCount">>
): Song {
  const songs = getSongs();
  const idx = songs.findIndex((s) => s.id === songId);
  if (idx === -1) throw new Error("Song not found");
  songs[idx] = { ...songs[idx], ...patch };
  saveSongs(songs);
  return songs[idx];
}

export function deleteSong(songId: string): void {
  const songs = getSongs().filter((s) => s.id !== songId);
  saveSongs(songs);

  const albums = getAlbums();
  for (const album of albums) {
    album.songIds = album.songIds.filter((id) => id !== songId);
  }
  saveAlbums(albums.filter((a) => a.songIds.length > 0));
}

export interface CreateAlbumData {
  title: string;
  artistName: string;
  coverColor: string;
  coverImage?: string;
  releaseDate: string;
  isEarlyAccess: boolean;
  genre?: string;
  songIds?: string[];
}

export function createAlbum(data: CreateAlbumData): Album {
  const albums = getAlbums();
  const album: Album = {
    id: createId("a"),
    title: data.title,
    artistName: data.artistName,
    coverColor: data.coverColor,
    coverImage: data.coverImage,
    releaseDate: data.releaseDate,
    songIds: data.songIds ?? [],
    isEarlyAccess: data.isEarlyAccess,
    genre: data.genre,
  };
  albums.push(album);
  saveAlbums(albums);
  return album;
}

export function updateAlbum(
  albumId: string,
  patch: Partial<Omit<Album, "id">>
): Album {
  const albums = getAlbums();
  const idx = albums.findIndex((a) => a.id === albumId);
  if (idx === -1) throw new Error("Album not found");
  albums[idx] = { ...albums[idx], ...patch };
  saveAlbums(albums);
  return albums[idx];
}

export function deleteAlbum(albumId: string): void {
  const albums = getAlbums().filter((a) => a.id !== albumId);
  saveAlbums(albums);

  const songs = getSongs().filter((s) => s.albumId !== albumId);
  saveSongs(songs);
}

export function addSongToAlbum(songId: string, albumId: string): void {
  const albums = getAlbums();
  const album = albums.find((a) => a.id === albumId);
  if (!album) throw new Error("Album not found");
  if (!album.songIds.includes(songId)) {
    album.songIds.push(songId);
    saveAlbums(albums);
  }
}
