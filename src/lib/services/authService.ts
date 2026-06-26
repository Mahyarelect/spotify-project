import type { User } from "@/types/user";
import { mockHashPassword, verifyMockPassword } from "./password";
import { getUsers, saveUsers, getArtistApplications, saveArtistApplications, STORAGE_KEYS } from "./storage";

export async function login(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getUsers();
  const user = users.find((candidate) => candidate.email.toLowerCase() === normalizedEmail);

  if (!user || !verifyMockPassword(password, user.passwordHash)) {
    throw new Error("Invalid email or password");
  }

  localStorage.setItem(STORAGE_KEYS.currentSessionUserId, user.id);
  return { user, role: user.role };
}

export async function registerListener(data: {
  displayName: string;
  email: string;
  password: string;
  birthDate: string;
  gender: "male" | "female" | "other" | "unspecified";
}): Promise<User> {
  const users = getUsers();
  if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
    throw new Error("An account with this email already exists");
  }
  const username =
    data.displayName.toLowerCase().replace(/[^a-z0-9]/g, "") +
    "_" +
    Math.random().toString(36).slice(2, 6);
  const newUser: User = {
    id: "u" + Date.now(),
    email: data.email,
    passwordHash: mockHashPassword(data.password),
    displayName: data.displayName,
    username,
    role: "listener",
    birthDate: data.birthDate,
    gender: data.gender,
    avatarUrl: null,
    planTier: "free",
    planRenewsAt: null,
    followers: [],
    following: [],
    notificationLimits: {
      newReleasesFromFollowed: true,
      subscriptionExpiry: true,
      ticketUpdates: false,
    },
    soundEnabled: true,
    language: "en",
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  localStorage.setItem(STORAGE_KEYS.currentSessionUserId, newUser.id);
  return newUser;
}

export async function registerArtist(data: {
  email: string;
  password: string;
  artistName: string;
  portfolioUrl: string;
}): Promise<{ pending: true }> {
  const apps = getArtistApplications();
  apps.push({
    id: "app" + Date.now(),
    email: data.email,
    passwordHash: mockHashPassword(data.password),
    artistName: data.artistName,
    portfolioUrl: data.portfolioUrl,
    status: "pending",
    submittedAt: new Date().toISOString(),
  });
  saveArtistApplications(apps);
  return { pending: true };
}

export async function forgotPassword(_email: string) {
  return {
    message: "If an account exists for this email, a reset link has been sent.",
  };
}

export function logout() {
  localStorage.removeItem(STORAGE_KEYS.currentSessionUserId);
}
