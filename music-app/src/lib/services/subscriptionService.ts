import { MOCK_PLANS } from "@/lib/mockData/plans";
import type { PlanLimits } from "@/types/subscription";

export async function getPlans(): Promise<PlanLimits[]> {
  return MOCK_PLANS;
}
