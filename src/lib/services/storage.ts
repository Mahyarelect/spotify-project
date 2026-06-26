import { MOCK_USERS } from "@/lib/mockData/users";
import { MOCK_PLANS } from "@/lib/mockData/plans";
import type { User, ArtistApplication } from "@/types/user";
import type { PlanLimits } from "@/types/subscription";

export const STORAGE_KEYS = {
  users: "musicapp_users",
  artistApplications: "musicapp_artistApplications",
  currentSessionUserId: "musicapp_currentSessionUserId",
  plans: "musicapp_plans",
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
