import type { Song, Album, Playlist } from "@/types/music";

export const MOCK_SONGS: Song[] = [
  {
    id: "s1",
    title: "Midnight Drive",
    artistName: "Bob Artist",
    artistId: "u2",
    albumId: "a1",
    durationSec: 214,
    coverColor: "#1a1a2e",
    playCount: 15420,
    lyrics:
      "Driving through the city lights\nShadows dancing in the night\nThe engine hums a lullaby\nAs stars go racing by\n\nMidnight roads and neon glow\nNowhere else I'd rather go",
  },
  {
    id: "s2",
    title: "Neon Lights",
    artistName: "Bob Artist",
    artistId: "u2",
    albumId: "a1",
    durationSec: 187,
    coverColor: "#1a1a2e",
    playCount: 12300,
    lyrics:
      "Neon lights illuminate the rain\nEach drop a prism, none the same\nThe city breathes in violet hues\nElectric whispers, breaking news\n\nWe chase the glow through empty streets",
  },
  {
    id: "s3",
    title: "Sunrise Melody",
    artistName: "Bob Artist",
    artistId: "u2",
    albumId: "a1",
    durationSec: 243,
    coverColor: "#1a1a2e",
    playCount: 9800,
    lyrics:
      "Golden threads across the sky\nThe morning sings its lullaby\nA melody of amber light\nThat turns the darkness into bright\n\nEvery dawn a brand new song\nA place where all of us belong",
  },
  {
    id: "s4",
    title: "Echoes",
    artistName: "Luna Wave",
    artistId: "u4",
    albumId: "a2",
    durationSec: 198,
    coverColor: "#16213e",
    playCount: 22100,
    lyrics:
      "Echoes bouncing off the walls\nOf ancient halls and empty stalls\nA voice that carries through the years\nOf laughter, joy, and quiet tears\n\nThe sound repeats but never same",
  },
  {
    id: "s5",
    title: "Falling Stars",
    artistName: "Luna Wave",
    artistId: "u4",
    albumId: "a2",
    durationSec: 226,
    coverColor: "#16213e",
    playCount: 18700,
    lyrics:
      "Falling stars across your face\nTrails of light in outer space\nWe make a wish on every one\nBefore the night is done\n\nThe universe in quiet motion",
  },
  {
    id: "s6",
    title: "Ocean Breeze",
    artistName: "Luna Wave",
    artistId: "u4",
    albumId: "a2",
    durationSec: 205,
    coverColor: "#16213e",
    playCount: 14500,
    lyrics:
      "Ocean breeze through tangled hair\nSalt and sun beyond compare\nThe waves compose a symphony\nOf endless blue and mystery\n\nWhere horizon meets the sea",
  },
  {
    id: "s7",
    title: "Velvet Sky",
    artistName: "Nova Drift",
    artistId: "u5",
    albumId: "a3",
    durationSec: 176,
    coverColor: "#0f3460",
    playCount: 8900,
    lyrics:
      "Velvet sky in shades of deep\nThe world is winding down to sleep\nConstellations draw their maps\nOf ancient myths and cosmic traps\n\nWe float beneath the quiet dark",
  },
  {
    id: "s8",
    title: "Crystal Rain",
    artistName: "Nova Drift",
    artistId: "u5",
    albumId: "a4",
    durationSec: 231,
    coverColor: "#533483",
    playCount: 6200,
    lyrics:
      "Crystal rain on windowpanes\nEach drop a note in silent refrains\nThe melody of falling glass\nA moment frozen as they pass\n\nTransparent tears of sky above",
  },
];

export const MOCK_ALBUMS: Album[] = [
  {
    id: "a1",
    title: "After Hours",
    artistName: "Bob Artist",
    coverColor: "#1a1a2e",
    releaseDate: "2026-06-15",
    songIds: ["s1", "s2", "s3"],
    isEarlyAccess: false,
  },
  {
    id: "a2",
    title: "Dreamscape",
    artistName: "Luna Wave",
    coverColor: "#16213e",
    releaseDate: "2026-06-20",
    songIds: ["s4", "s5", "s6"],
    isEarlyAccess: false,
  },
  {
    id: "a3",
    title: "Horizons",
    artistName: "Nova Drift",
    coverColor: "#0f3460",
    releaseDate: "2026-06-25",
    songIds: ["s7"],
    isEarlyAccess: true,
  },
  {
    id: "a4",
    title: "Prism",
    artistName: "Nova Drift",
    coverColor: "#533483",
    releaseDate: "2026-06-28",
    songIds: ["s8"],
    isEarlyAccess: true,
  },
];

export const MOCK_PLAYLISTS: Playlist[] = [
  {
    id: "p1",
    title: "Late Night Vibes",
    coverColor: "#1b1b2f",
    songIds: ["s1", "s4", "s7"],
    createdBy: "u1",
    description: "Chill tracks for late nights",
  },
  {
    id: "p2",
    title: "Morning Energy",
    coverColor: "#2d132c",
    songIds: ["s2", "s5", "s8"],
    createdBy: "u1",
    description: "Start your day right",
  },
  {
    id: "p3",
    title: "Focus Mode",
    coverColor: "#1a1a40",
    songIds: ["s3", "s6"],
    createdBy: "u2",
    description: "Deep focus instrumental vibes",
  },
  {
    id: "p4",
    title: "Top Hits 2026",
    coverColor: "#3c1642",
    songIds: ["s1", "s4", "s5", "s7", "s8"],
    createdBy: "u3",
    description: "The biggest tracks of the year",
  },
];
