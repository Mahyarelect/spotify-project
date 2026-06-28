import { MOCK_USERS } from "@/lib/mockData/users";
import { MOCK_PLANS } from "@/lib/mockData/plans";
import { MOCK_SONGS, MOCK_ALBUMS, MOCK_PLAYLISTS } from "@/lib/mockData/music";
import type { User, ArtistApplication } from "@/types/user";
import type { PlanLimits } from "@/types/subscription";
import type { Song, Album, Playlist, RecentlyPlayed } from "@/types/music";

export const STORAGE_KEYS = {
  users: "musicapp_users",
  artistApplications: "musicapp_artistApplications",
  currentSessionUserId: "musicapp_currentSessionUserId",
  plans: "musicapp_plans",
  songs: "musicapp_songs",
  albums: "musicapp_albums",
  playlists: "musicapp_playlists",
  recentlyPlayed: "musicapp_recentlyPlayed",
} as const;

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readJson<T>(key: string, fallback: T): T {
  if (!canUseLocalStorage()) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T): void {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function hasStorageKey(key: string): boolean {
  if (!canUseLocalStorage()) return false;
  return window.localStorage.getItem(key) !== null;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function getUsers(): User[] {
  if (!hasStorageKey(STORAGE_KEYS.users)) {
    const seeded = deepClone(MOCK_USERS);
    writeJson(STORAGE_KEYS.users, seeded);
    return seeded;
  }
  return readJson<User[]>(STORAGE_KEYS.users, []);
}

export function saveUsers(users: User[]): void {
  writeJson(STORAGE_KEYS.users, users);
}

export function getArtistApplications(): ArtistApplication[] {
  return readJson<ArtistApplication[]>(STORAGE_KEYS.artistApplications, []);
}

export function saveArtistApplications(applications: ArtistApplication[]): void {
  writeJson(STORAGE_KEYS.artistApplications, applications);
}

export function getPlans(): PlanLimits[] {
  if (!hasStorageKey(STORAGE_KEYS.plans)) {
    const seeded = deepClone(MOCK_PLANS);
    writeJson(STORAGE_KEYS.plans, seeded);
    return seeded;
  }
  return readJson<PlanLimits[]>(STORAGE_KEYS.plans, []);
}

export function savePlans(plans: PlanLimits[]): void {
  writeJson(STORAGE_KEYS.plans, plans);
}

export function getSessionUserId(): string | null {
  if (!canUseLocalStorage()) return null;
  return window.localStorage.getItem(STORAGE_KEYS.currentSessionUserId);
}

export function setSessionUserId(userId: string): void {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(STORAGE_KEYS.currentSessionUserId, userId);
}

export function clearSessionUserId(): void {
  if (!canUseLocalStorage()) return;
  window.localStorage.removeItem(STORAGE_KEYS.currentSessionUserId);
}

// ── Music: Songs ──

export function getSongs(): Song[] {
  if (!hasStorageKey(STORAGE_KEYS.songs)) {
    const seeded = deepClone(MOCK_SONGS);
    writeJson(STORAGE_KEYS.songs, seeded);
    return seeded;
  }
  return readJson<Song[]>(STORAGE_KEYS.songs, []);
}

export function saveSongs(songs: Song[]): void {
  writeJson(STORAGE_KEYS.songs, songs);
}

// ── Music: Albums ──

export function getAlbums(): Album[] {
  if (!hasStorageKey(STORAGE_KEYS.albums)) {
    const seeded = deepClone(MOCK_ALBUMS);
    writeJson(STORAGE_KEYS.albums, seeded);
    return seeded;
  }
  return readJson<Album[]>(STORAGE_KEYS.albums, []);
}

export function saveAlbums(albums: Album[]): void {
  writeJson(STORAGE_KEYS.albums, albums);
}

// ── Music: Playlists ──

export function getPlaylists(): Playlist[] {
  if (!hasStorageKey(STORAGE_KEYS.playlists)) {
    const seeded = deepClone(MOCK_PLAYLISTS);
    writeJson(STORAGE_KEYS.playlists, seeded);
    return seeded;
  }
  return readJson<Playlist[]>(STORAGE_KEYS.playlists, []);
}

export function savePlaylists(playlists: Playlist[]): void {
  writeJson(STORAGE_KEYS.playlists, playlists);
}

// ── Music: Recently Played ──

export function getRecentlyPlayed(userId: string): RecentlyPlayed[] {
  const all = readJson<Record<string, RecentlyPlayed[]>>(STORAGE_KEYS.recentlyPlayed, {});
  return all[userId] ?? [];
}

export function addRecentlyPlayed(userId: string, entry: RecentlyPlayed): void {
  const all = readJson<Record<string, RecentlyPlayed[]>>(STORAGE_KEYS.recentlyPlayed, {});
  const existing = all[userId] ?? [];
  const filtered = existing.filter((e) => e.playlistId !== entry.playlistId);
  all[userId] = [entry, ...filtered].slice(0, 10);
  writeJson(STORAGE_KEYS.recentlyPlayed, all);
}
