import type { Song, Album, Playlist } from "@/types/music";
import { apiRequest } from "@/lib/api/httpClient";

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

interface PlaylistResponse {
  id: string;
  title: string;
  cover_color: string;
  created_by: string;
  created_by_name: string;
  created_by_username: string;
  description: string;
  song_count: number;
  songs: Array<{
    song: string;
    song_title: string;
    song_artist: string;
    song_duration: number;
    position: number;
  }>;
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

function mapPlaylist(raw: PlaylistResponse): Playlist {
  return {
    id: raw.id,
    title: raw.title,
    coverColor: raw.cover_color,
    songIds: raw.songs.map((s) => s.song),
    createdBy: raw.created_by,
    description: raw.description || undefined,
  };
}

export async function getAllSongs(): Promise<Song[]> {
  const data = await apiRequest<SongResponse[]>("music/songs/", { skipAuth: true });
  return data.map(mapSong);
}

export async function getAllAlbums(): Promise<Album[]> {
  const data = await apiRequest<AlbumResponse[]>("music/albums/", { skipAuth: true });
  return data.map(mapAlbum);
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  const data = await apiRequest<PlaylistResponse[]>("music/playlists/", { skipAuth: true });
  return data.map(mapPlaylist);
}

export async function getSongById(songId: string): Promise<Song | undefined> {
  try {
    const data = await apiRequest<SongResponse>(`music/songs/${songId}/`, { skipAuth: true });
    return mapSong(data);
  } catch {
    return undefined;
  }
}

export async function getAlbumById(albumId: string): Promise<Album | undefined> {
  try {
    const data = await apiRequest<AlbumResponse>(`music/albums/${albumId}/`, { skipAuth: true });
    return mapAlbum(data);
  } catch {
    return undefined;
  }
}

export async function getAlbumSongs(albumId: string): Promise<Song[]> {
  try {
    const album = await apiRequest<AlbumResponse & { songs: SongResponse[] }>(
      `music/albums/${albumId}/`,
      { skipAuth: true }
    );
    return (album.songs ?? []).map(mapSong);
  } catch {
    return [];
  }
}

export async function getPlaylistById(playlistId: string): Promise<Playlist | undefined> {
  try {
    const data = await apiRequest<PlaylistResponse>(`music/playlists/${playlistId}/`, { skipAuth: true });
    return mapPlaylist(data);
  } catch {
    return undefined;
  }
}

export async function searchMusic(query: string): Promise<{
  songs: Song[];
  albums: Album[];
  playlists: Playlist[];
}> {
  const data = await apiRequest<{
    songs: SongResponse[];
    albums: AlbumResponse[];
    playlists: PlaylistResponse[];
  }>(`music/search/?q=${encodeURIComponent(query)}`, { skipAuth: true });

  return {
    songs: data.songs.map(mapSong),
    albums: data.albums.map(mapAlbum),
    playlists: data.playlists.map(mapPlaylist),
  };
}

interface RecentlyPlayedResponse {
  id: string;
  song: string;
  song_title: string;
  artist_name: string;
  duration_sec: number;
  cover_color: string;
  cover_image: string | null;
  played_at: string;
}

export async function getRecentlyPlayed(): Promise<
  { songId: string; listenedAt: string }[]
> {
  try {
    const data = await apiRequest<RecentlyPlayedResponse[]>("music/recently-played/");
    return data.map((r) => ({ songId: r.song, listenedAt: r.played_at }));
  } catch {
    return [];
  }
}
