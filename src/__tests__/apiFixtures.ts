import { vi } from "vitest";
import type { UserDto } from "@/lib/api/dto";
import type { Role, User } from "@/types/user";

export function makeUserDto(role: Role = "listener"): UserDto {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    email: "test@example.com",
    username: "testuser",
    display_name: "Test User",
    role,
    birth_date: "1995-01-01",
    gender: "male",
    avatar_url: null,
    bio: "",
    artist_verified: role === "artist",
    followers_count: 2,
    following_count: 3,
    streams_today: 4,
    preferences: {
      new_releases_from_followed: true,
      subscription_expiry: true,
      ticket_updates: false,
      sound_enabled: true,
      language: "en",
    },
    subscription: {
      plan: "free",
      status: "active",
      starts_at: "2026-01-01T00:00:00Z",
      expires_at: null,
      limits: {
        daily_stream_limit: 60,
        max_playlists: 6,
        profile_image_allowed: false,
        download_allowed: false,
        early_access_allowed: false,
        statistics_allowed: false,
      },
    },
  };
}

export function makeUser(plan: "free" | "silver" | "gold" = "free"): User {
  const dto = makeUserDto();
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
    preferences: {
      newReleasesFromFollowed: true,
      subscriptionExpiry: true,
      ticketUpdates: false,
      soundEnabled: true,
      language: "en",
    },
    subscription: {
      plan,
      status: "active",
      startsAt: "2026-01-01T00:00:00Z",
      expiresAt: null,
      limits: {
        dailyStreamLimit: plan === "free" ? 60 : null,
        maxPlaylists: plan === "free" ? 6 : plan === "silver" ? 100 : null,
        profileImageAllowed: plan !== "free",
        downloadAllowed: plan !== "free",
        earlyAccessAllowed: plan === "gold",
        statisticsAllowed: plan === "gold",
      },
    },
  };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function authenticate(role: Role = "listener"): void {
  sessionStorage.setItem("musicapp_access_token", "access-token");
  sessionStorage.setItem("musicapp_refresh_token", "refresh-token");
  vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(makeUserDto(role)));
}
