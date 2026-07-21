import { getStreamCount, incrementStreamCount } from "./storage";

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

export function canStream(userId: string, dailyStreamLimit: number | null): boolean {
  if (dailyStreamLimit === null) return true;
  return getTodayStreamCount(userId) < dailyStreamLimit;
}

export function recordStream(userId: string): void {
  incrementStreamCount(userId, getTodayString());
}
