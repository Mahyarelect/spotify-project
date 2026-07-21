import { apiRequest } from "@/lib/api/httpClient";
import type { PlanTier } from "@/types/user";
import type { PlanLimits, SubscriptionOrder } from "@/types/subscription";

interface PlanDto {
  code: PlanTier;
  display_name: string;
  monthly_price: string;
  currency: string;
  allowed_billing_months: number[];
  limits: {
    daily_stream_limit: number | null;
    max_playlists: number | null;
    profile_image_allowed: boolean;
    download_allowed: boolean;
    early_access_allowed: boolean;
    statistics_allowed: boolean;
  };
}

interface OrderDto {
  order_id: string;
  status: SubscriptionOrder["status"];
  plan: PlanTier;
  months: number;
  unit_price: string;
  total_amount: string;
  currency: string;
  payment_url: string | null;
  created_at: string;
  paid_at: string | null;
}

function mapPlan(dto: PlanDto): PlanLimits {
  return {
    tier: dto.code,
    displayName: dto.display_name,
    currency: dto.currency,
    allowedBillingMonths: dto.allowed_billing_months,
    priceMonthly: Number(dto.monthly_price),
    dailyStreamLimit: dto.limits.daily_stream_limit,
    maxPlaylists: dto.limits.max_playlists,
    profileImageAllowed: dto.limits.profile_image_allowed,
    downloadAllowed: dto.limits.download_allowed,
    earlyAccess: dto.limits.early_access_allowed,
    viewStats: dto.limits.statistics_allowed,
  };
}

function mapOrder(dto: OrderDto): SubscriptionOrder {
  return {
    orderId: dto.order_id,
    status: dto.status,
    plan: dto.plan,
    months: dto.months,
    unitPrice: Number(dto.unit_price),
    totalAmount: Number(dto.total_amount),
    currency: dto.currency,
    paymentUrl: dto.payment_url,
    createdAt: dto.created_at,
    paidAt: dto.paid_at,
  };
}

export async function getPlans(signal?: AbortSignal): Promise<PlanLimits[]> {
  const plans = await apiRequest<PlanDto[]>("subscriptions/plans/", { skipAuth: true, signal });
  return plans.map(mapPlan);
}

export async function getPlanByTier(tier: PlanTier): Promise<PlanLimits> {
  const plan = (await getPlans()).find((candidate) => candidate.tier === tier);
  if (!plan) throw new Error(`Unknown plan tier: ${tier}`);
  return plan;
}

export async function createOrder(tier: PlanTier, months: number): Promise<SubscriptionOrder> {
  const idempotencyKey = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return mapOrder(await apiRequest<OrderDto>("subscriptions/orders/", {
    method: "POST",
    body: JSON.stringify({ plan: tier, months, idempotency_key: idempotencyKey }),
  }));
}

export async function getOrder(orderId: string): Promise<SubscriptionOrder> {
  return mapOrder(await apiRequest<OrderDto>(`subscriptions/orders/${orderId}/`));
}

export async function confirmMockOrder(orderId: string): Promise<SubscriptionOrder> {
  return mapOrder(await apiRequest<OrderDto>(`subscriptions/orders/${orderId}/confirm/`, { method: "POST" }));
}

export async function updatePlanPrices(prices: { silver: number; gold: number }): Promise<PlanLimits[]> {
  return Promise.all(
    (["silver", "gold"] as const).map(async (tier) =>
      mapPlan(await apiRequest<PlanDto>(`admin/subscription-plans/${tier}/`, {
        method: "PATCH",
        body: JSON.stringify({ monthly_price: prices[tier] }),
      })),
    ),
  );
}
