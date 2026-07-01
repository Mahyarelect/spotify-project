import type { User } from "@/types/user";
import { mockHashPassword, verifyMockPassword } from "./password";
import {
  getUsers, saveUsers,
  getArtistApplications, saveArtistApplications,
  setSessionUserId, clearSessionUserId,
} from "./storage";
import { notifyArtistVerification } from "./notificationService";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export async function login(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const users = getUsers();
  const user = users.find((candidate) => normalizeEmail(candidate.email) === normalizedEmail);

  if (!user || !verifyMockPassword(password, user.passwordHash)) {
    throw new Error("Invalid email or password");
  }

  setSessionUserId(user.id);
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
  const normalizedEmail = normalizeEmail(data.email);

  if (users.some((u) => normalizeEmail(u.email) === normalizedEmail)) {
    throw new Error("Email already exists");
  }

  const username =
    data.displayName.toLowerCase().replace(/[^a-z0-9]/g, "") +
    "_" +
    Math.random().toString(36).slice(2, 6);

  const newUser: User = {
    id: createId("u"),
    email: normalizedEmail,
    passwordHash: mockHashPassword(data.password),
    displayName: data.displayName.trim(),
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
  setSessionUserId(newUser.id);
  return newUser;
}

export async function registerArtist(data: {
  email: string;
  password: string;
  artistName: string;
  portfolioUrl: string;
}): Promise<{ pending: true }> {
  const normalizedEmail = normalizeEmail(data.email);

  const users = getUsers();
  if (users.some((u) => normalizeEmail(u.email) === normalizedEmail)) {
    throw new Error("An account with this email already exists");
  }

  const apps = getArtistApplications();
  if (apps.some((a) => normalizeEmail(a.email) === normalizedEmail && a.status !== "rejected")) {
    throw new Error("An artist application with this email is already pending or approved");
  }

  apps.push({
    id: createId("artist_app"),
    email: normalizedEmail,
    passwordHash: mockHashPassword(data.password),
    artistName: data.artistName,
    portfolioUrl: data.portfolioUrl,
    status: "pending",
    submittedAt: new Date().toISOString(),
  });
  saveArtistApplications(apps);
  notifyArtistVerification(apps[apps.length - 1].id, data.artistName);
  return { pending: true };
}

export async function forgotPassword(_email: string) {
  return {
    message: "If an account exists for this email, a reset link has been sent.",
  };
}

export function logout() {
  clearSessionUserId();
}
