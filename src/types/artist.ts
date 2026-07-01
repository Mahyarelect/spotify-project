import type { User } from "./user";
import type { Song, Album } from "./music";

export interface ArtistProfile {
  user: User;
  albums: Album[];
  singles: Song[];
  totalStreams: number;
  isVerified: boolean;
}
