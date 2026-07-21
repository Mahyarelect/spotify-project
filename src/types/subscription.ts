import type { PlanTier } from "./user";

export interface PlanLimits {
  tier: PlanTier;
  displayName?: string;
  currency?: string;
  allowedBillingMonths?: number[];
  dailyStreamLimit: number | null;
  maxPlaylists: number | null;
  profileImageAllowed: boolean;
  downloadAllowed: boolean;
  earlyAccess: boolean;
  viewStats: boolean;
  priceMonthly: number;
}

export interface SubscriptionOrder {
  orderId: string;
  status: "pending" | "paid" | "cancelled" | "failed";
  plan: PlanTier;
  months: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  paymentUrl: string | null;
  createdAt: string;
  paidAt: string | null;
}
