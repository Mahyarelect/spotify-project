import type { PlanLimits } from "@/types/subscription";

export const PLAN_LIMITS: PlanLimits[] = [
  {
    tier: "free",
    dailyStreamLimit: 60,
    maxPlaylists: 6,
    profileImageAllowed: false,
    downloadAllowed: false,
    earlyAccess: false,
    viewStats: false,
    priceMonthly: 0,
  },
  {
    tier: "silver",
    dailyStreamLimit: null,
    maxPlaylists: 100,
    profileImageAllowed: true,
    downloadAllowed: true,
    earlyAccess: false,
    viewStats: false,
    priceMonthly: 9.99,
  },
  {
    tier: "gold",
    dailyStreamLimit: null,
    maxPlaylists: null,
    profileImageAllowed: true,
    downloadAllowed: true,
    earlyAccess: true,
    viewStats: true,
    priceMonthly: 14.99,
  },
];

export function getPlanLimits(tier: string): PlanLimits {
  return PLAN_LIMITS.find((p) => p.tier === tier) ?? PLAN_LIMITS[0];
}

export const BILLING_INTERVALS = [1, 3, 6, 12] as const;
