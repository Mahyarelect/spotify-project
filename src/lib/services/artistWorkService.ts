import type { Song, Album } from "@/types/music";
import { apiRequest } from "@/lib/api/httpClient";
import { getAllSongs, getAllAlbums } from "./musicService";

interface SongResponse {
  id: string;
  title: string;
  artist: string;
  artist_name: string;
  artist_username: string;
  album: string | null;
  album_title: string | null;
  duration_sec: number;
  cover_color: string;
  cover_image: string | null;
  audio_file: string | null;
  has_audio: boolean;
  play_count: number;
  lyrics: string;
  collaborators: string[];
  genre: string;
  release_year: number | null;
  track_number: number | null;
}

interface AlbumResponse {
  id: string;
  title: string;
  artist: string;
  artist_name: string;
  artist_username: string;
  cover_color: string;
  cover_image: string | null;
  release_date: string;
  is_early_access: boolean;
  genre: string;
  song_count: number;
}

function mapSong(raw: SongResponse): Song {
  return {
    id: raw.id,
    title: raw.title,
    artistName: raw.artist_name,
    artistUsername: raw.artist_username,
    artistId: raw.artist,
    albumId: raw.album ?? "",
    durationSec: raw.duration_sec,
    coverColor: raw.cover_color,
    coverImage: raw.cover_image ?? undefined,
    audioFile: raw.audio_file ?? undefined,
    hasAudio: raw.has_audio,
    playCount: raw.play_count,
    lyrics: raw.lyrics || undefined,
    collaborators: raw.collaborators,
    genre: raw.genre || undefined,
    releaseYear: raw.release_year ?? undefined,
  };
}

function mapAlbum(raw: AlbumResponse): Album {
  return {
    id: raw.id,
    title: raw.title,
    artistName: raw.artist_name,
    artistUsername: raw.artist_username,
    coverColor: raw.cover_color,
    coverImage: raw.cover_image ?? undefined,
    releaseDate: raw.release_date,
    songIds: [],
    isEarlyAccess: raw.is_early_access,
    genre: raw.genre || undefined,
  };
}

export async function getWorksByArtist(artistName: string): Promise<{
  songs: Song[];
  albums: Album[];
}> {
  const [allSongs, allAlbums] = await Promise.all([getAllSongs(), getAllAlbums()]);
  const songs = allSongs.filter(
    (s) => s.artistName.toLowerCase() === artistName.toLowerCase()
  );
  const albums = allAlbums.filter(
    (a) => a.artistName.toLowerCase() === artistName.toLowerCase()
  );
  return { songs, albums };
}

export async function getArtistStatistics(): Promise<{
  totalStreams: number;
  uniqueListeners: number;
  revenue: number;
  songCount: number;
  songs: Array<{ songId: string; totalStreams: number; uniqueListeners: number; revenue: number }>;
}> {
  const raw = await apiRequest<{
    total_streams: number; unique_listeners: number; revenue: string; song_count: number;
    songs: Array<{ song_id: string; total_streams: number; unique_listeners: number; revenue: string }>;
  }>("music/artists/me/statistics/");
  return {
    totalStreams: raw.total_streams,
    uniqueListeners: raw.unique_listeners,
    revenue: Number(raw.revenue),
    songCount: raw.song_count,
    songs: raw.songs.map((row) => ({ songId: row.song_id, totalStreams: row.total_streams, uniqueListeners: row.unique_listeners, revenue: Number(row.revenue) })),
  };
}

export async function getSongStatistics(songId: string): Promise<{ totalStreams: number; uniqueListeners: number; revenue: number }> {
  const raw = await apiRequest<{ total_streams: number; unique_listeners: number; revenue: string }>(`music/songs/${songId}/statistics/`);
  return { totalStreams: raw.total_streams, uniqueListeners: raw.unique_listeners, revenue: Number(raw.revenue) };
}

export interface CreateSongData {
  title: string;
  albumId: string;
  durationSec: number;
  coverColor: string;
  coverImage?: File;
  lyrics?: string;
  collaborators?: string[];
  genre?: string;
  releaseYear?: number;
  audioFile?: File;
}

export async function createSong(data: CreateSongData): Promise<Song> {
  const formData = new FormData();
  formData.append("title", data.title);
  if (data.albumId) formData.append("album", data.albumId);
  formData.append("duration_sec", String(data.durationSec));
  formData.append("cover_color", data.coverColor);
  if (data.lyrics) formData.append("lyrics", data.lyrics);
  formData.append("collaborators", JSON.stringify(data.collaborators ?? []));
  if (data.genre) formData.append("genre", data.genre);
  if (data.releaseYear) formData.append("release_year", String(data.releaseYear));
  if (data.coverImage) formData.append("cover_image", data.coverImage);

  let raw = await apiRequest<SongResponse>("music/songs/", {
    method: "POST",
    body: formData,
  });
  if (data.audioFile) raw = await uploadSongAudio(raw.id, data.audioFile);
  return mapSong(raw);
}

async function uploadSongAudio(songId: string, file: File): Promise<SongResponse> {
  const formData = new FormData();
  formData.append("audio_file", file);
  return apiRequest<SongResponse>(`music/songs/${songId}/upload-audio/`, { method: "PUT", body: formData });
}

export async function updateSong(
  songId: string,
  patch: { title?: string; genre?: string; lyrics?: string; collaborators?: string[]; coverImage?: File; audioFile?: File }
): Promise<Song> {
  const { coverImage, audioFile, ...metadata } = patch;
  const body = coverImage ? new FormData() : JSON.stringify(metadata);
  if (body instanceof FormData) {
    if (patch.title) body.append("title", patch.title);
    if (patch.genre) body.append("genre", patch.genre);
    if (patch.lyrics) body.append("lyrics", patch.lyrics);
    body.append("collaborators", JSON.stringify(patch.collaborators ?? []));
    body.append("cover_image", coverImage!);
  }
  let raw = await apiRequest<SongResponse>(`music/songs/${songId}/`, {
    method: "PATCH",
    body,
  });
  if (audioFile) raw = await uploadSongAudio(songId, audioFile);
  return mapSong(raw);
}

export async function deleteSong(songId: string): Promise<void> {
  await apiRequest(`music/songs/${songId}/`, { method: "DELETE" });
}

export interface CreateAlbumData {
  title: string;
  coverColor: string;
  coverImage?: File;
  releaseDate: string;
  isEarlyAccess: boolean;
  genre?: string;
}

export async function createAlbum(data: CreateAlbumData): Promise<Album> {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("cover_color", data.coverColor);
  formData.append("release_date", data.releaseDate);
  formData.append("is_early_access", String(data.isEarlyAccess));
  if (data.genre) formData.append("genre", data.genre);
  if (data.coverImage) formData.append("cover_image", data.coverImage);

  const raw = await apiRequest<AlbumResponse>("music/albums/", {
    method: "POST",
    body: formData,
  });
  return mapAlbum(raw);
}

export async function updateAlbum(
  albumId: string,
  patch: { title?: string; genre?: string; isEarlyAccess?: boolean; coverImage?: File }
): Promise<Album> {
  const payload = patch.coverImage ? new FormData() : null;
  if (payload) {
    if (patch.title) payload.append("title", patch.title);
    if (patch.genre) payload.append("genre", patch.genre);
    if (patch.isEarlyAccess !== undefined) payload.append("is_early_access", String(patch.isEarlyAccess));
    payload.append("cover_image", patch.coverImage!);
  }
  const raw = await apiRequest<AlbumResponse>(`music/albums/${albumId}/`, {
    method: "PATCH",
    body: payload ?? JSON.stringify({
      ...(patch.title && { title: patch.title }),
      ...(patch.genre && { genre: patch.genre }),
      ...(patch.isEarlyAccess !== undefined && { is_early_access: patch.isEarlyAccess }),
    }),
  });
  return mapAlbum(raw);
}

export async function deleteAlbum(albumId: string): Promise<void> {
  await apiRequest(`music/albums/${albumId}/`, { method: "DELETE" });
}

export async function addSongToAlbum(songId: string, albumId: string): Promise<void> {
  await apiRequest(`music/songs/${songId}/`, {
    method: "PATCH",
    body: JSON.stringify({ album: albumId }),
  });
}
