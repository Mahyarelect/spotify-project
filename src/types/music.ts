export interface Song {
  id: string;
  title: string;
  artistName: string;
  albumId: string;
  durationSec: number;
  coverColor: string;
  playCount: number;
}

export interface Album {
  id: string;
  title: string;
  artistName: string;
  coverColor: string;
  releaseDate: string;
  songIds: string[];
  isEarlyAccess: boolean;
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
