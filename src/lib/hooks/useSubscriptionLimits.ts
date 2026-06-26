import type { User, PlanTier } from "@/types/user";
import { getPlanLimits } from "@/lib/constants/plans";

export function useSubscriptionLimits(user: User | null) {
  if (!user) {
    return {
      canUploadProfileImage: false,
      canDownload: false,
      canViewStats: false,
      hasEarlyAccess: false,
      dailyStreamsRemaining: 0,
      dailyStreamLimit: 0,
      playlistsRemaining: 0,
      maxPlaylists: 0,
      tier: "free" as PlanTier,
      planLimits: getPlanLimits("free"),
    };
  }

  const limits = getPlanLimits(user.planTier);

  return {
    canUploadProfileImage: limits.profileImageAllowed,
    canDownload: limits.downloadAllowed,
    canViewStats: limits.viewStats,
    hasEarlyAccess: limits.earlyAccess,
    dailyStreamsRemaining: limits.dailyStreamLimit ?? Infinity,
    dailyStreamLimit: limits.dailyStreamLimit ?? 0,
    playlistsRemaining: limits.maxPlaylists ?? Infinity,
    maxPlaylists: limits.maxPlaylists ?? 0,
    tier: user.planTier,
    planLimits: limits,
  };
}
