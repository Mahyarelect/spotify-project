import type { Playlist } from "@/types/music";
import { apiRequest } from "@/lib/api/httpClient";

interface PlaylistResponse {
  id: string;
  title: string;
  cover_color: string;
  created_by: string;
  created_by_name: string;
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

export async function getUserPlaylists(): Promise<Playlist[]> {
  const data = await apiRequest<PlaylistResponse[]>("music/playlists/mine/");
  return data.map(mapPlaylist);
}

export async function getPlaylistCount(): Promise<number> {
  const playlists = await getUserPlaylists();
  return playlists.length;
}

export async function canCreatePlaylist(maxPlaylists: number | null): Promise<boolean> {
  if (maxPlaylists === null) return true;
  const count = await getPlaylistCount();
  return count < maxPlaylists;
}

export async function createPlaylist(
  title: string,
  description?: string
): Promise<Playlist> {
  const data = await apiRequest<PlaylistResponse>("music/playlists/", {
    method: "POST",
    body: JSON.stringify({
      title: title.trim(),
      cover_color: "#1b1b2f",
      description: description?.trim() ?? "",
    }),
  });
  return mapPlaylist(data);
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  await apiRequest(`music/playlists/${playlistId}/`, { method: "DELETE" });
}

export async function renamePlaylist(playlistId: string, newTitle: string): Promise<void> {
  await apiRequest(`music/playlists/${playlistId}/`, {
    method: "PATCH",
    body: JSON.stringify({ title: newTitle.trim() }),
  });
}

export async function addSongToPlaylist(playlistId: string, songId: string): Promise<void> {
  await apiRequest(`music/playlists/${playlistId}/songs/`, {
    method: "POST",
    body: JSON.stringify({ song_id: songId }),
  });
}

export async function removeSongFromPlaylist(
  playlistId: string,
  songId: string
): Promise<void> {
  await apiRequest(`music/playlists/${playlistId}/songs/remove/`, {
    method: "DELETE",
    body: JSON.stringify({ song_id: songId }),
  });
}

export async function getPlaylistById(playlistId: string): Promise<Playlist | undefined> {
  try {
    const data = await apiRequest<PlaylistResponse>(`music/playlists/${playlistId}/`, { skipAuth: true });
    return mapPlaylist(data);
  } catch {
    return undefined;
  }
}
