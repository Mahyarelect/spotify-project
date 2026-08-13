import type { Notification } from "@/types/notification";
import type { SupportTicket } from "@/types/ticket";
import type { AuditPayment } from "@/types/audit";

export const STORAGE_KEYS = {
  playerPrefs: "spotify_playerPrefs",
  notifications: "spotify_notifications",
  tickets: "spotify_tickets",
  auditPayments: "spotify_auditPayments",
} as const;

const LEGACY_STORAGE_PREFIX = ["music", "app_"].join("");
const LEGACY_STORAGE_KEYS = {
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
