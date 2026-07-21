import { z } from "zod";

export const editProfileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  bio: z.string().max(300, "Bio must be at most 300 characters").optional(),
  birthDate: z.string().refine((value) => {
    if (!value) return true;
    const birthDate = new Date(`${value}T00:00:00`);
    if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) return false;
    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    if (
      now.getMonth() < birthDate.getMonth() ||
      (now.getMonth() === birthDate.getMonth() && now.getDate() < birthDate.getDate())
    ) age -= 1;
    return age >= 13 && age <= 120;
  }, "Enter a valid birth date for a user aged 13 to 120"),
  gender: z.enum(["male", "female", "other", "unspecified"]),
});

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function validateAvatarFile(file: File): string | null {
  if (!AVATAR_TYPES.includes(file.type as (typeof AVATAR_TYPES)[number])) {
    return "Only JPEG, PNG, and WebP images are supported.";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return "Profile images must be 5 MB or smaller.";
  }
  return null;
}
