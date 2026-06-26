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

export function getUsers(): User[] {
  const users = readJson<User[]>(STORAGE_KEYS.users, []);
  if (users.length > 0) return users;
  writeJson(STORAGE_KEYS.users, MOCK_USERS);
  return MOCK_USERS;
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
  const plans = readJson<PlanLimits[]>(STORAGE_KEYS.plans, []);
  if (plans.length > 0) return plans;
  writeJson(STORAGE_KEYS.plans, MOCK_PLANS);
  return MOCK_PLANS;
}

export function savePlans(plans: PlanLimits[]): void {
  writeJson(STORAGE_KEYS.plans, plans);
}
