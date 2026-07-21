import { apiRequest } from "@/lib/api/httpClient";
import { hasSessionTokens } from "@/lib/api/tokenStore";
import {
  mapPublicProfile,
  mapUser,
  type PublicProfileDto,
  type UserDto,
} from "@/lib/api/dto";
import type { Gender, PublicProfile, User } from "@/types/user";

export async function getCurrentUser(): Promise<User | null> {
  if (!hasSessionTokens()) return null;
  return mapUser(await apiRequest<UserDto>("users/me/"));
}

export async function updateProfile(patch: {
  displayName?: string;
  bio?: string;
  birthDate?: string;
  gender?: Gender;
  avatar?: File;
}): Promise<User> {
  const body = new FormData();
  if (patch.displayName !== undefined) body.set("display_name", patch.displayName);
  if (patch.bio !== undefined) body.set("bio", patch.bio);
  if (patch.birthDate !== undefined) body.set("birth_date", patch.birthDate);
  if (patch.gender !== undefined) body.set("gender", patch.gender);
  if (patch.avatar !== undefined) body.set("avatar", patch.avatar);
  return mapUser(await apiRequest<UserDto>("users/me/", { method: "PATCH", body }));
}

export function deleteAccount(currentPassword: string): Promise<void> {
  return apiRequest<void>("users/me/", {
    method: "DELETE",
    body: JSON.stringify({ current_password: currentPassword }),
  });
}

export async function getUserByUsername(username: string, signal?: AbortSignal): Promise<PublicProfile> {
  return mapPublicProfile(await apiRequest<PublicProfileDto>(`users/${encodeURIComponent(username)}/`, { signal }));
}

export async function followUser(username: string): Promise<PublicProfile> {
  return mapPublicProfile(
    await apiRequest<PublicProfileDto>(`users/${encodeURIComponent(username)}/follow/`, { method: "POST" }),
  );
}

export async function unfollowUser(username: string): Promise<PublicProfile> {
  return mapPublicProfile(
    await apiRequest<PublicProfileDto>(`users/${encodeURIComponent(username)}/follow/`, { method: "DELETE" }),
  );
}
