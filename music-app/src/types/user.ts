export type Role = "listener" | "artist" | "support" | "admin";
export type PlanTier = "free" | "silver" | "gold";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  username: string;
  role: Role;
  birthDate: string;
  gender: "male" | "female" | "other" | "unspecified";
  avatarUrl: string | null;
  bio?: string;
  planTier: PlanTier;
  planRenewsAt: string | null;
  followers: string[];
  following: string[];
  notificationLimits: NotificationPrefs;
  soundEnabled: boolean;
  language: "en" | "fa";
  createdAt: string;
}

export interface ArtistApplication {
  id: string;
  email: string;
  passwordHash: string;
  artistName: string;
  portfolioUrl: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  submittedAt: string;
}

export interface NotificationPrefs {
  newReleasesFromFollowed: boolean;
  subscriptionExpiry: boolean;
  ticketUpdates: boolean;
}
