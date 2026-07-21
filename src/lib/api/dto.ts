import type {
  CurrentSubscription,
  PublicProfile,
  Role,
  User,
  UserPreferences,
} from "@/types/user";

export interface UserPreferencesDto {
  new_releases_from_followed: boolean;
  subscription_expiry: boolean;
  ticket_updates: boolean;
  sound_enabled: boolean;
  language: "en" | "fa";
}

export interface CurrentSubscriptionDto {
  plan: "free" | "silver" | "gold";
  status: "active" | "expired" | "cancelled";
  starts_at: string;
  expires_at: string | null;
  limits: {
    daily_stream_limit: number | null;
    max_playlists: number | null;
    profile_image_allowed: boolean;
    download_allowed: boolean;
    early_access_allowed: boolean;
    statistics_allowed: boolean;
  };
}

export interface UserDto {
  id: string;
  email: string;
  username: string;
  display_name: string;
  role: Role;
  birth_date: string | null;
  gender: User["gender"];
  avatar_url: string | null;
  bio: string;
  artist_verified: boolean;
  followers_count: number;
  following_count: number;
  streams_today: number | null;
  preferences: UserPreferencesDto;
  subscription: CurrentSubscriptionDto;
}

export interface PublicProfileDto {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  role: Role;
  artist_verified: boolean;
  plan: "free" | "silver" | "gold";
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

export interface AuthResponseDto {
  access: string;
  refresh: string;
  user: UserDto;
}

export function mapPreferences(dto: UserPreferencesDto): UserPreferences {
  return {
    newReleasesFromFollowed: dto.new_releases_from_followed,
    subscriptionExpiry: dto.subscription_expiry,
    ticketUpdates: dto.ticket_updates,
    soundEnabled: dto.sound_enabled,
    language: dto.language,
  };
}

export function mapSubscription(dto: CurrentSubscriptionDto): CurrentSubscription {
  return {
    plan: dto.plan,
    status: dto.status,
    startsAt: dto.starts_at,
    expiresAt: dto.expires_at,
    limits: {
      dailyStreamLimit: dto.limits.daily_stream_limit,
      maxPlaylists: dto.limits.max_playlists,
      profileImageAllowed: dto.limits.profile_image_allowed,
      downloadAllowed: dto.limits.download_allowed,
      earlyAccessAllowed: dto.limits.early_access_allowed,
      statisticsAllowed: dto.limits.statistics_allowed,
    },
  };
}

export function mapUser(dto: UserDto): User {
  return {
    id: dto.id,
    email: dto.email,
    username: dto.username,
    displayName: dto.display_name,
    role: dto.role,
    birthDate: dto.birth_date,
    gender: dto.gender,
    avatarUrl: dto.avatar_url,
    bio: dto.bio,
    artistVerified: dto.artist_verified,
    followersCount: dto.followers_count,
    followingCount: dto.following_count,
    streamsToday: dto.streams_today,
    preferences: mapPreferences(dto.preferences),
    subscription: mapSubscription(dto.subscription),
  };
}

export function mapPublicProfile(dto: PublicProfileDto): PublicProfile {
  return {
    id: dto.id,
    username: dto.username,
    displayName: dto.display_name,
    avatarUrl: dto.avatar_url,
    bio: dto.bio,
    role: dto.role,
    artistVerified: dto.artist_verified,
    plan: dto.plan,
    followersCount: dto.followers_count,
    followingCount: dto.following_count,
    isFollowing: dto.is_following,
  };
}
