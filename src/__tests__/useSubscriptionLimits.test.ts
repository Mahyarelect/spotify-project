import { expect, it } from "vitest";
import { useSubscriptionLimits } from "@/lib/hooks/useSubscriptionLimits";
import { makeUser } from "./apiFixtures";

it("uses backend-provided entitlements instead of tier constants", () => {
  const user = makeUser("free");
  user.streamsToday = 7;
  user.subscription.limits = {
    dailyStreamLimit: 12,
    maxPlaylists: 4,
    profileImageAllowed: true,
    downloadAllowed: true,
    earlyAccessAllowed: true,
    statisticsAllowed: true,
  };

  expect(useSubscriptionLimits(user)).toEqual(expect.objectContaining({
    dailyStreamsRemaining: 5,
    maxPlaylists: 4,
    canUploadProfileImage: true,
    canDownload: true,
    hasEarlyAccess: true,
    canViewStats: true,
  }));
});
