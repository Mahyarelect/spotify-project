import { MOCK_SONGS, MOCK_ALBUMS, MOCK_PLAYLISTS } from "@/lib/mockData/music";
import type { Song, Album, Playlist, RecentlyPlayed } from "@/types/music";
import type { Notification } from "@/types/notification";
import type { SupportTicket } from "@/types/ticket";
import type { AuditPayment } from "@/types/audit";

export const STORAGE_KEYS = {
  songs: "spotify_songs",
  albums: "spotify_albums",
  playlists: "spotify_playlists",
  recentlyPlayed: "spotify_recentlyPlayed",
  streamCounts: "spotify_streamCounts",
  playerPrefs: "spotify_playerPrefs",
  notifications: "spotify_notifications",
  tickets: "spotify_tickets",
  auditPayments: "spotify_auditPayments",
} as const;

const LEGACY_STORAGE_PREFIX = ["music", "app_"].join("");
const LEGACY_STORAGE_KEYS = {
  songs: `${LEGACY_STORAGE_PREFIX}songs`,
  albums: `${LEGACY_STORAGE_PREFIX}albums`,
  playlists: `${LEGACY_STORAGE_PREFIX}playlists`,
  recentlyPlayed: `${LEGACY_STORAGE_PREFIX}recentlyPlayed`,
  streamCounts: `${LEGACY_STORAGE_PREFIX}streamCounts`,
  playerPrefs: `${LEGACY_STORAGE_PREFIX}playerPrefs`,
  notifications: `${LEGACY_STORAGE_PREFIX}notifications`,
  tickets: `${LEGACY_STORAGE_PREFIX}tickets`,
  auditPayments: `${LEGACY_STORAGE_PREFIX}auditPayments`,
} as const;

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function migrateLegacyStorageKey(key: string): void {
  if (!canUseLocalStorage()) return;
  const entry = Object.entries(STORAGE_KEYS).find(([, currentKey]) => currentKey === key);
  if (!entry) return;
  const legacyKey = LEGACY_STORAGE_KEYS[entry[0] as keyof typeof LEGACY_STORAGE_KEYS];
  const legacyValue = window.localStorage.getItem(legacyKey);
  if (window.localStorage.getItem(key) === null && legacyValue !== null) {
    window.localStorage.setItem(key, legacyValue);
  }
  window.localStorage.removeItem(legacyKey);
}

export function readJson<T>(key: string, fallback: T): T {
  if (!canUseLocalStorage()) return fallback;
  migrateLegacyStorageKey(key);
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
  migrateLegacyStorageKey(key);
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function hasStorageKey(key: string): boolean {
  if (!canUseLocalStorage()) return false;
  migrateLegacyStorageKey(key);
  return window.localStorage.getItem(key) !== null;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
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

// ── Stream Counts ──

export function getStreamCount(userId: string, date: string): number {
  const all = readJson<Record<string, Record<string, number>>>(STORAGE_KEYS.streamCounts, {});
  return all[userId]?.[date] ?? 0;
}

export function incrementStreamCount(userId: string, date: string): void {
  const all = readJson<Record<string, Record<string, number>>>(STORAGE_KEYS.streamCounts, {});
  if (!all[userId]) all[userId] = {};
  all[userId][date] = (all[userId][date] ?? 0) + 1;
  writeJson(STORAGE_KEYS.streamCounts, all);
}

// ── Player Preferences ──

export interface PlayerPrefs {
  volume: number;
  shuffle: boolean;
  repeatMode: "off" | "all" | "one";
}

export function getPlayerPrefs(): PlayerPrefs {
  return readJson<PlayerPrefs>(STORAGE_KEYS.playerPrefs, {
    volume: 80,
    shuffle: false,
    repeatMode: "off",
  });
}

export function savePlayerPrefs(prefs: PlayerPrefs): void {
  writeJson(STORAGE_KEYS.playerPrefs, prefs);
}

// ── Notifications ──

export function getNotifications(userId: string): Notification[] {
  const all = readJson<Record<string, Notification[]>>(STORAGE_KEYS.notifications, {});
  return all[userId] ?? [];
}

export function saveNotifications(userId: string, notifications: Notification[]): void {
  const all = readJson<Record<string, Notification[]>>(STORAGE_KEYS.notifications, {});
  all[userId] = notifications;
  writeJson(STORAGE_KEYS.notifications, all);
}

export function getAllNotifications(): Record<string, Notification[]> {
  return readJson<Record<string, Notification[]>>(STORAGE_KEYS.notifications, {});
}

// ── Support Tickets ──

export function getTickets(): SupportTicket[] {
  return readJson<SupportTicket[]>(STORAGE_KEYS.tickets, []);
}

export function saveTickets(tickets: SupportTicket[]): void {
  writeJson(STORAGE_KEYS.tickets, tickets);
}

// ── Audit Payments ──

export function getAuditPayments(): AuditPayment[] {
  return readJson<AuditPayment[]>(STORAGE_KEYS.auditPayments, []);
}

export function saveAuditPayments(payments: AuditPayment[]): void {
  writeJson(STORAGE_KEYS.auditPayments, payments);
}
