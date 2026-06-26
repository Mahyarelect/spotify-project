import { getPlans as readPlans, savePlans, getUsers, saveUsers } from "./storage";
import type { User, PlanTier } from "@/types/user";
import type { PlanLimits } from "@/types/subscription";

export async function getPlans(): Promise<PlanLimits[]> {
  return readPlans();
}

export async function getPlanByTier(tier: PlanTier): Promise<PlanLimits> {
  const plan = readPlans().find((candidate) => candidate.tier === tier);
  if (!plan) throw new Error(`Unknown plan tier: ${tier}`);
  return plan;
}

export async function updatePlanPrices(prices: { silver: number; gold: number }): Promise<PlanLimits[]> {
  const next = readPlans().map((plan) => {
    if (plan.tier === "silver") return { ...plan, priceMonthly: prices.silver };
    if (plan.tier === "gold") return { ...plan, priceMonthly: prices.gold };
    return plan;
  });

  savePlans(next);
  return next;
}

export async function upgradePlan(userId: string, tier: PlanTier, months: 1 | 3 | 6 | 12): Promise<User> {
  const users = getUsers();
  const idx = users.findIndex((user) => user.id === userId);
  if (idx === -1) throw new Error("User not found");

  const renewsAt = new Date();
  renewsAt.setMonth(renewsAt.getMonth() + months);

  users[idx] = {
    ...users[idx],
    planTier: tier,
    planRenewsAt: renewsAt.toISOString(),
  };

  saveUsers(users);
  return users[idx];
}
