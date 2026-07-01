import type { ArtistApplication } from "@/types/user";
import {
  getArtistApplications,
  saveArtistApplications,
  getUsers,
  saveUsers,
} from "./storage";
import { notifyArtistApproved, notifyArtistRejected } from "./notificationService";
import { mockHashPassword } from "./password";

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function getPendingApplications(): ArtistApplication[] {
  return getArtistApplications().filter((a) => a.status === "pending");
}

export function getAllApplications(): ArtistApplication[] {
  return getArtistApplications();
}

export function approveApplication(applicationId: string): ArtistApplication {
  const apps = getArtistApplications();
  const idx = apps.findIndex((a) => a.id === applicationId);
  if (idx === -1) throw new Error("Application not found");

  const app = apps[idx];
  apps[idx] = { ...app, status: "approved" };
  saveArtistApplications(apps);

  const users = getUsers();
  const existingUser = users.find(
    (u) => u.email.toLowerCase() === app.email.toLowerCase()
  );

  if (!existingUser) {
    const username =
      app.artistName.toLowerCase().replace(/[^a-z0-9]/g, "") +
      "_" +
      Math.random().toString(36).slice(2, 6);

    users.push({
      id: createId("u"),
      email: app.email,
      passwordHash: app.passwordHash || mockHashPassword("Password123!"),
      displayName: app.artistName,
      username,
      role: "artist",
      birthDate: "2000-01-01",
      gender: "unspecified",
      avatarUrl: null,
      bio: "",
      planTier: "free",
      planRenewsAt: null,
      followers: [],
      following: [],
      notificationLimits: {
        newReleasesFromFollowed: true,
        subscriptionExpiry: true,
        ticketUpdates: true,
      },
      soundEnabled: true,
      language: "en",
      createdAt: new Date().toISOString(),
    });
    saveUsers(users);
  } else {
    const uidx = users.findIndex((u) => u.id === existingUser.id);
    if (uidx !== -1) {
      users[uidx].role = "artist";
      saveUsers(users);
    }
  }

  notifyArtistApproved(existingUser?.id ?? applicationId, app.artistName);
  return apps[idx];
}

export function rejectApplication(
  applicationId: string,
  reason: string
): ArtistApplication {
  const apps = getArtistApplications();
  const idx = apps.findIndex((a) => a.id === applicationId);
  if (idx === -1) throw new Error("Application not found");

  apps[idx] = { ...apps[idx], status: "rejected", rejectionReason: reason };
  saveArtistApplications(apps);

  const users = getUsers();
  const existingUser = users.find(
    (u) => u.email.toLowerCase() === apps[idx].email.toLowerCase()
  );
  if (existingUser) {
    notifyArtistRejected(existingUser.id, reason);
  }

  return apps[idx];
}
