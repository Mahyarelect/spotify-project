import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminDashboardPage from "@/pages/AdminDashboardPage";
import { I18nProvider } from "@/lib/i18n/useTranslation";

const services = vi.hoisted(() => ({
  getPendingApplications: vi.fn(),
  getAllTickets: vi.fn(),
  getPlans: vi.fn(),
  getAuditPaymentsByMonth: vi.fn(),
  getRevenueStats: vi.fn(),
}));

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "support-1", displayName: "Parsa", role: "support" },
  }),
}));

vi.mock("@/lib/services/adminService", () => ({
  getPendingApplications: services.getPendingApplications,
  approveApplication: vi.fn(),
  rejectApplication: vi.fn(),
}));

vi.mock("@/lib/services/ticketService", () => ({
  getAllTickets: services.getAllTickets,
  addTicketMessage: vi.fn(),
  updateTicketStatus: vi.fn(),
}));

vi.mock("@/lib/services/subscriptionService", () => ({
  getPlans: services.getPlans,
  updatePlanPrices: vi.fn(),
}));

vi.mock("@/lib/services/auditService", () => ({
  getAuditPaymentsByMonth: services.getAuditPaymentsByMonth,
  getRevenueStats: services.getRevenueStats,
  generateMonthlyAudit: vi.fn(),
  markPaymentPaid: vi.fn(),
  markPaymentDisputed: vi.fn(),
}));

describe("support dashboard permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    services.getPendingApplications.mockResolvedValue([]);
    services.getAllTickets.mockResolvedValue([]);
  });

  it("loads support workflows without requesting admin-only financial data", async () => {
    render(
      <I18nProvider language="en" setLanguage={async () => undefined}>
        <AdminDashboardPage />
      </I18nProvider>,
    );

    await waitFor(() => {
      expect(services.getPendingApplications).toHaveBeenCalledOnce();
      expect(services.getAllTickets).toHaveBeenCalledOnce();
    });
    expect(services.getPlans).not.toHaveBeenCalled();
    expect(services.getAuditPaymentsByMonth).not.toHaveBeenCalled();
    expect(services.getRevenueStats).not.toHaveBeenCalled();
  });
});
