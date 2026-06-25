import { z } from "zod";

export const editProfileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  bio: z.string().max(300, "Bio must be at most 300 characters").optional(),
});
