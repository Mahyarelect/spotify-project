import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateMonthlyAudit, getAuditPaymentsByMonth, getRevenueStats, markPaymentDisputed, markPaymentPaid } from "@/lib/services/auditService";

const payout = {
  id: "payout-1", artist: "artist-1", artist_name: "Artist", month: "2026-07-01",
  total_streams: 100, amount: "12.50", status: "pending", provider_reference: null, paid_at: null,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => vi.restoreAllMocks());

describe("auditService backend integration", () => {
  it("loads and maps monthly payouts", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([payout]));
    await expect(getAuditPaymentsByMonth("2026-07")).resolves.toEqual([expect.objectContaining({
      id: "payout-1", artistId: "artist-1", month: "2026-07", amount: 12.5,
    })]);
    expect(fetchMock.mock.calls[0][0]).toContain("artist/payouts/?month=2026-07-01");
  });

  it("generates reports and sends supported status transitions", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      const status = JSON.parse(String(init?.body || "{}")).status;
      return jsonResponse(status ? { ...payout, status } : [payout], status ? 200 : 201);
    });
    await generateMonthlyAudit("2026-07");
    await markPaymentDisputed("payout-1");
    await markPaymentPaid("payout-1");
    expect(fetchMock.mock.calls.map(([, init]) => init?.method)).toEqual(["POST", "PATCH", "PATCH", "PATCH"]);
    expect(fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init?.body || "{}")).status)).toEqual([
      undefined, "disputed", "approved", "paid",
    ]);
  });

  it("maps the admin revenue report", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({
      total_revenue: "25.00", total_streams: 44, paid_amount: "8.00", pending_amount: "3.00",
      by_tier: [{ tier: "gold", count: 2, revenue: "25.00" }],
    }));
    await expect(getRevenueStats()).resolves.toEqual({
      totalRevenue: 25, totalStreams: 44, paidAmount: 8, pendingAmount: 3,
      byTier: [{ tier: "gold", count: 2, revenue: 25 }],
    });
  });
});
