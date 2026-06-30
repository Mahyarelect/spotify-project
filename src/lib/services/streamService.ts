import { getStreamCount, incrementStreamCount } from "./storage";
import type { PlanTier } from "@/types/user";

export function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getTodayStreamCount(userId: string): number {
  return getStreamCount(userId, getTodayString());
}

export function canStream(userId: string, planTier: PlanTier): boolean {
  if (planTier === "silver" || planTier === "gold") return true;
  return getTodayStreamCount(userId) < 60;
}

export function recordStream(userId: string): void {
  incrementStreamCount(userId, getTodayString());
}
