import type { User, PlanTier } from "@/types/user";

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
      planLimits: {
        dailyStreamLimit: 0,
        maxPlaylists: 0,
        profileImageAllowed: false,
        downloadAllowed: false,
        earlyAccessAllowed: false,
        statisticsAllowed: false,
      },
    };
  }

  const limits = user.subscription.limits;

  return {
    canUploadProfileImage: limits.profileImageAllowed,
    canDownload: limits.downloadAllowed,
    canViewStats: limits.statisticsAllowed,
    hasEarlyAccess: limits.earlyAccessAllowed,
    dailyStreamsRemaining: limits.dailyStreamLimit ?? Infinity,
    dailyStreamLimit: limits.dailyStreamLimit ?? 0,
    playlistsRemaining: limits.maxPlaylists ?? Infinity,
    maxPlaylists: limits.maxPlaylists ?? 0,
    tier: user.subscription.plan,
    planLimits: limits,
  };
}
