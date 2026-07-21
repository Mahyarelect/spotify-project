export type Role = "listener" | "artist" | "support" | "admin";
export type PlanTier = "free" | "silver" | "gold";
export type Gender = "male" | "female" | "other" | "unspecified";

export interface UserPreferences {
  newReleasesFromFollowed: boolean;
  subscriptionExpiry: boolean;
  ticketUpdates: boolean;
  soundEnabled: boolean;
  language: "en" | "fa";
}

export type NotificationPrefs = Pick<
  UserPreferences,
  "newReleasesFromFollowed" | "subscriptionExpiry" | "ticketUpdates"
>;

export interface SubscriptionEntitlements {
  dailyStreamLimit: number | null;
  maxPlaylists: number | null;
  profileImageAllowed: boolean;
  downloadAllowed: boolean;
  earlyAccessAllowed: boolean;
  statisticsAllowed: boolean;
}

export interface CurrentSubscription {
  plan: PlanTier;
  status: "active" | "expired" | "cancelled";
  startsAt: string;
  expiresAt: string | null;
  limits: SubscriptionEntitlements;
}

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: Role;
  birthDate: string | null;
  gender: Gender;
  avatarUrl: string | null;
  bio: string;
  artistVerified: boolean;
  followersCount: number;
  followingCount: number;
  streamsToday: number | null;
  preferences: UserPreferences;
  subscription: CurrentSubscription;
}

export interface PublicProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  role: Role;
  artistVerified: boolean;
  plan: PlanTier;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export interface ArtistApplication {
  id: string;
  email: string;
  artistName: string;
  portfolioUrl: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  submittedAt: string;
}
