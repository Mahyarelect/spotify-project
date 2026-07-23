import type { PlanTier } from "@/types/user";
import type { PurchaseMode } from "@/types/subscription";

export function getPurchaseMode(current: PlanTier, target: PlanTier): PurchaseMode | null {
  if (current === target && target !== "free") return "renew";
  if (current === "free" && target !== "free") return "upgrade";
  if (current === "silver" && target === "gold") return "upgrade";
  return null;
}
