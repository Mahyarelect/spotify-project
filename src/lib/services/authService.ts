import type { User } from "@/types/user";

const USERS_KEY = "musicapp_users";
const SESSION_KEY = "musicapp_currentSessionUserId";

function getUsers(): User[] {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function login(email: string, _password: string) {
  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error("Invalid email or password");
  localStorage.setItem(SESSION_KEY, user.id);
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
    passwordHash: "$2b$10$mockhash" + data.password,
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
  localStorage.setItem(SESSION_KEY, newUser.id);
  return newUser;
}

export async function registerArtist(data: {
  email: string;
  password: string;
  artistName: string;
  portfolioUrl: string;
}): Promise<{ pending: true }> {
  const appsKey = "musicapp_artistApplications";
  const raw = localStorage.getItem(appsKey);
  const apps = raw ? JSON.parse(raw) : [];
  apps.push({
    id: "app" + Date.now(),
    email: data.email,
    passwordHash: "$2b$10$mockhash" + data.password,
    artistName: data.artistName,
    portfolioUrl: data.portfolioUrl,
    status: "pending",
    submittedAt: new Date().toISOString(),
  });
  localStorage.setItem(appsKey, JSON.stringify(apps));
  return { pending: true };
}

export async function forgotPassword(_email: string) {
  return {
    message: "If an account exists for this email, a reset link has been sent.",
  };
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}
