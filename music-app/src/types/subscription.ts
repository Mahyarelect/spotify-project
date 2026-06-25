import type { PlanTier } from "./user";

export interface PlanLimits {
  tier: PlanTier;
  dailyStreamLimit: number | null;
  maxPlaylists: number | null;
  profileImageAllowed: boolean;
  downloadAllowed: boolean;
  earlyAccess: boolean;
  viewStats: boolean;
  priceMonthly: number;
}
