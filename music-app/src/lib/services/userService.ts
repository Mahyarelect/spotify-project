import type { User, PlanTier } from "@/types/user";

const USERS_KEY = "musicapp_users";
const SESSION_KEY = "musicapp_currentSessionUserId";

function getUsers(): User[] {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function getCurrentUser(): Promise<User | null> {
  const users = getUsers();
  const userId = localStorage.getItem(SESSION_KEY);
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
  users[idx] = { ...users[idx], ...patch };
  saveUsers(users);
  return users[idx];
}

export async function upgradePlan(
  userId: string,
  tier: PlanTier
): Promise<User> {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error("User not found");
  const renewsAt = new Date();
  renewsAt.setMonth(renewsAt.getMonth() + 1);
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
  localStorage.removeItem(SESSION_KEY);
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
