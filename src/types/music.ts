export interface Song {
  id: string;
  title: string;
  artistName: string;
  artistId?: string;
  albumId: string;
  durationSec: number;
  coverColor: string;
  coverImage?: string;
  playCount: number;
  lyrics?: string;
  genre?: string;
  releaseYear?: number;
  collaborators?: string[];
}

export interface Album {
  id: string;
  title: string;
  artistName: string;
  coverColor: string;
  coverImage?: string;
  releaseDate: string;
  songIds: string[];
  isEarlyAccess: boolean;
  genre?: string;
}

export interface Playlist {
  id: string;
  title: string;
  coverColor: string;
  songIds: string[];
  createdBy: string;
  description?: string;
}

export interface RecentlyPlayed {
  playlistId: string;
  listenedAt: string;
}
