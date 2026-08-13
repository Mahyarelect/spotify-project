import type { ArtistProfile } from "@/types/artist";
import type { User } from "@/types/user";
import type { Song, Album } from "@/types/music";
import { apiRequest } from "@/lib/api/httpClient";

interface ArtistProfileResponse {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  role: string;
  artist_verified: boolean;
  followers_count: number;
  is_following: boolean;
  songs: Array<{
    id: string;
    title: string;
    artist: string;
    artist_name: string;
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
  }>;
  albums: Array<{
    id: string;
    title: string;
    artist: string;
    artist_name: string;
    cover_color: string;
    cover_image: string | null;
    release_date: string;
    is_early_access: boolean;
    genre: string;
    song_count: number;
  }>;
  singles: Array<{
    id: string;
    title: string;
    artist: string;
    artist_name: string;
    cover_color: string;
    cover_image: string | null;
    release_date: string;
    is_early_access: boolean;
    genre: string;
    song_count: number;
  }>;
  total_streams: number;
}

function mapSong(raw: ArtistProfileResponse["songs"][0]): Song {
  return {
    id: raw.id,
    title: raw.title,
    artistName: raw.artist_name,
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

function mapAlbum(raw: ArtistProfileResponse["albums"][0]): Album {
  return {
    id: raw.id,
    title: raw.title,
    artistName: raw.artist_name,
    coverColor: raw.cover_color,
    coverImage: raw.cover_image ?? undefined,
    releaseDate: raw.release_date,
    songIds: [],
    isEarlyAccess: raw.is_early_access,
    genre: raw.genre || undefined,
  };
}

export async function getArtistProfile(username: string): Promise<{
  user: User;
  songs: Song[];
  albums: Album[];
  singles: Album[];
  totalStreams: number;
  isFollowing: boolean;
} | null> {
  try {
    const data = await apiRequest<ArtistProfileResponse>(
      `music/artists/${encodeURIComponent(username)}/`,
      { skipAuth: true }
    );

    const user: User = {
      id: data.id,
      email: "",
      username: data.username,
      displayName: data.display_name,
      role: data.role as User["role"],
      avatarUrl: data.avatar_url ?? undefined,
      bio: data.bio,
      artistVerified: data.artist_verified,
      followersCount: data.followers_count,
      followingCount: 0,
      streamsToday: 0,
      subscription: {
        plan: "free",
        status: "active",
        startsAt: "",
        expiresAt: null,
        limits: {
          dailyStreamLimit: null,
          maxPlaylists: null,
          profileImageAllowed: false,
          downloadAllowed: false,
          earlyAccessAllowed: false,
          statisticsAllowed: false,
        },
      },
      preferences: {
        newReleasesFromFollowed: true,
        subscriptionExpiry: true,
        ticketUpdates: false,
        soundEnabled: true,
        language: "en",
      },
    };

    return {
      user,
      songs: data.songs.map(mapSong),
      albums: data.albums.map(mapAlbum),
      singles: data.singles.map(mapAlbum),
      totalStreams: data.total_streams,
      isFollowing: data.is_following,
    };
  } catch {
    return null;
  }
}

// Keep mock-data helpers for backward compatibility (localStorage fallback)
import { MOCK_USERS } from "@/lib/mockData/users";
import { getSongs, getAlbums } from "./storage";

export function getArtistByDisplayName(displayName: string): User | null {
  return (
    MOCK_USERS.find(
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

export function getArtistProfileFromMock(artistName: string): ArtistProfile | null {
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
