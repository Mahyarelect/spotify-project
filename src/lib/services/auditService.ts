import type { AuditPayment } from "@/types/audit";
import { getAuditPayments, saveAuditPayments, getSongs } from "./storage";
import { MOCK_USERS } from "@/lib/mockData/users";

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

const RATE_PER_STREAM = 0.003;

export function getAllAuditPayments(): AuditPayment[] {
  return getAuditPayments();
}

export function getAuditPaymentsByMonth(month: string): AuditPayment[] {
  return getAuditPayments().filter((p) => p.month === month);
}

export function generateMonthlyAudit(month: string): AuditPayment[] {
  const users = MOCK_USERS.filter((u) => u.role === "artist");
  const songs = getSongs();
  const existing = getAuditPayments();
  const existingIds = new Set(existing.filter((p) => p.month === month).map((p) => p.artistId));

  const newPayments: AuditPayment[] = [];
  for (const artist of users) {
    if (existingIds.has(artist.id)) continue;

    const artistSongs = songs.filter(
      (s) => s.artistName.toLowerCase() === artist.displayName.toLowerCase()
    );
    const totalStreams = artistSongs.reduce((sum, s) => sum + s.playCount, 0);
    const amount = Math.round(totalStreams * RATE_PER_STREAM * 100) / 100;

    newPayments.push({
      id: createId("audit"),
      artistId: artist.id,
      artistName: artist.displayName,
      month,
      totalStreams,
      amount,
      status: "pending",
    });
  }

  const updated = [...existing, ...newPayments];
  saveAuditPayments(updated);
  return updated.filter((p) => p.month === month);
}

export function markPaymentPaid(paymentId: string): AuditPayment {
  const payments = getAuditPayments();
  const idx = payments.findIndex((p) => p.id === paymentId);
  if (idx === -1) throw new Error("Payment not found");
  payments[idx].status = "paid";
  payments[idx].paidAt = new Date().toISOString();
  saveAuditPayments(payments);
  return payments[idx];
}

export function markPaymentDisputed(paymentId: string): AuditPayment {
  const payments = getAuditPayments();
  const idx = payments.findIndex((p) => p.id === paymentId);
  if (idx === -1) throw new Error("Payment not found");
  payments[idx].status = "disputed";
  saveAuditPayments(payments);
  return payments[idx];
}

export function getRevenueStats(): {
  totalRevenue: number;
  totalStreams: number;
  paidAmount: number;
  pendingAmount: number;
  byTier: { tier: string; count: number; revenue: number }[];
} {
  const users = MOCK_USERS;
  const songs = getSongs();
  const payments = getAuditPayments();

  const totalStreams = songs.reduce((sum, s) => sum + s.playCount, 0);
  const totalRevenue = Math.round(totalStreams * RATE_PER_STREAM * 100) / 100;
  const paidAmount = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const tierCounts: Record<string, { count: number; revenue: number }> = {};
  for (const user of users) {
    const tier = user.subscription.plan;
    if (!tierCounts[tier]) {
      tierCounts[tier] = { count: 0, revenue: 0 };
    }
    tierCounts[tier].count++;
  }

  const tierPrices: Record<string, number> = { free: 0, silver: 9.99, gold: 14.99 };
  for (const tier of Object.keys(tierCounts)) {
    tierCounts[tier].revenue =
      Math.round(tierCounts[tier].count * (tierPrices[tier] ?? 0) * 100) / 100;
  }

  return {
    totalRevenue,
    totalStreams,
    paidAmount: Math.round(paidAmount * 100) / 100,
    pendingAmount: Math.round(pendingAmount * 100) / 100,
    byTier: Object.entries(tierCounts).map(([tier, data]) => ({
      tier,
      ...data,
    })),
  };
}
