import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  confirmMockOrder,
  createOrder,
  getPlans,
  updatePlanPrices,
} from "@/lib/services/subscriptionService";
import { jsonResponse } from "./apiFixtures";

const plan = {
  code: "silver" as const,
  display_name: "Silver",
  monthly_price: "9.99",
  currency: "USD",
  allowed_billing_months: [1, 3, 6, 12],
  limits: {
    daily_stream_limit: null,
    max_playlists: 100,
    profile_image_allowed: true,
    download_allowed: true,
    early_access_allowed: false,
    statistics_allowed: false,
  },
};

const order = {
  order_id: "33333333-3333-4333-8333-333333333333",
  status: "pending" as const,
  plan: "silver" as const,
  months: 3,
  unit_price: "9.99",
  total_amount: "29.97",
  currency: "USD",
  payment_url: null,
  created_at: "2026-07-21T00:00:00Z",
  paid_at: null,
};

describe("subscriptionService", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("uses server plan pricing and entitlements", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([plan]));

    const plans = await getPlans();

    expect(plans[0]).toEqual(expect.objectContaining({
      tier: "silver",
      priceMonthly: 9.99,
      maxPlaylists: 100,
      allowedBillingMonths: [1, 3, 6, 12],
    }));
  });

  it("creates a server-priced order with an idempotency key", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(order, 201));

    const created = await createOrder("silver", 3);

    expect(created.totalAmount).toBe(29.97);
    const requestBody = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(requestBody).toEqual(expect.objectContaining({ plan: "silver", months: 3 }));
    expect(requestBody.idempotency_key).toEqual(expect.any(String));
    expect(requestBody).not.toHaveProperty("total_amount");
  });

  it("confirms a development order through the backend", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ ...order, status: "paid", paid_at: "2026-07-21T00:01:00Z" }),
    );

    const confirmed = await confirmMockOrder(order.order_id);

    expect(confirmed.status).toBe("paid");
    expect(fetchMock.mock.calls[0][0]).toContain(`${order.order_id}/confirm/`);
  });

  it("updates paid plan prices with admin API requests", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(plan))
      .mockResolvedValueOnce(jsonResponse({ ...plan, code: "gold", display_name: "Gold", monthly_price: "14.99" }));

    const updated = await updatePlanPrices({ silver: 9.99, gold: 14.99 });

    expect(updated.map((item) => item.tier)).toEqual(["silver", "gold"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
