import type { Role } from "@/types/user";

export const ROLE_LABELS: Record<Role, string> = {
  listener: "Listener",
  artist: "Artist",
  support: "Support",
  admin: "Admin",
};
