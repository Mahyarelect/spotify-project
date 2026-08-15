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

function mapSong(raw: ArtistProfileResponse["songs"][0], artistUsername?: string): Song {
  return {
    id: raw.id,
    title: raw.title,
    artistName: raw.artist_name,
    artistUsername,
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

function mapAlbum(raw: ArtistProfileResponse["albums"][0], artistUsername?: string): Album {
  return {
    id: raw.id,
    title: raw.title,
    artistName: raw.artist_name,
    artistUsername,
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
  singles: Song[];
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
      birthDate: null,
      gender: "unspecified",
      avatarUrl: data.avatar_url,
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
      songs: data.songs.map((s) => mapSong(s, data.username)),
      albums: data.albums.map((a) => mapAlbum(a, data.username)),
      singles: data.singles.flatMap((single) =>
        data.songs
          .filter((song) => song.album === single.id)
          .map((song) => mapSong(song, data.username))
      ),
      totalStreams: data.total_streams,
      isFollowing: data.is_following,
    };
  } catch {
    return null;
  }
}
