import type { User, PlanTier } from "@/types/user";
import { getUsers, saveUsers, STORAGE_KEYS } from "./storage";
import { getPlanByTier } from "./subscriptionService";

export async function getCurrentUser(): Promise<User | null> {
  const users = getUsers();
  const userId = localStorage.getItem(STORAGE_KEYS.currentSessionUserId);
  if (!userId) return null;
  return users.find((u) => u.id === userId) ?? null;
}

export async function updateProfile(
  userId: string,
  patch: Partial<User>
): Promise<User> {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error("User not found");

  const current = users[idx];
  const plan = await getPlanByTier(current.planTier);

  const safePatch = { ...patch };
  if (!plan.profileImageAllowed) {
    delete safePatch.avatarUrl;
  }

  users[idx] = { ...current, ...safePatch };
  saveUsers(users);
  return users[idx];
}

export async function upgradePlan(
  userId: string,
  tier: PlanTier,
  months: 1 | 3 | 6 | 12 = 1
): Promise<User> {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error("User not found");
  const renewsAt = new Date();
  renewsAt.setMonth(renewsAt.getMonth() + months);
  users[idx] = {
    ...users[idx],
    planTier: tier,
    planRenewsAt: renewsAt.toISOString(),
  };
  saveUsers(users);
  return users[idx];
}

export async function deleteAccount(userId: string): Promise<void> {
  const users = getUsers().filter((u) => u.id !== userId);
  saveUsers(users);
  localStorage.removeItem(STORAGE_KEYS.currentSessionUserId);
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const users = getUsers();
  return users.find((u) => u.username === username) ?? null;
}

export async function followUser(
  currentUserId: string,
  targetUserId: string
): Promise<User> {
  const users = getUsers();
  const ci = users.findIndex((u) => u.id === currentUserId);
  const ti = users.findIndex((u) => u.id === targetUserId);
  if (ci === -1 || ti === -1) throw new Error("User not found");
  if (!users[ci].following.includes(targetUserId)) {
    users[ci].following = [...users[ci].following, targetUserId];
    users[ti].followers = [...users[ti].followers, currentUserId];
  }
  saveUsers(users);
  return users[ci];
}

export async function unfollowUser(
  currentUserId: string,
  targetUserId: string
): Promise<User> {
  const users = getUsers();
  const ci = users.findIndex((u) => u.id === currentUserId);
  const ti = users.findIndex((u) => u.id === targetUserId);
  if (ci === -1 || ti === -1) throw new Error("User not found");
  users[ci].following = users[ci].following.filter((id) => id !== targetUserId);
  users[ti].followers = users[ti].followers.filter((id) => id !== currentUserId);
  saveUsers(users);
  return users[ci];
}
