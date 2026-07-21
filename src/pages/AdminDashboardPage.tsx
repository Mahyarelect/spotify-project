import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useAuth } from "@/lib/hooks/useAuth";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { RoleGuard } from "@/components/ui/RoleGuard";
import {
  AdminSidebar,
  type AdminSection,
} from "@/components/admin/AdminSidebar";
import { ArtistVerificationTable } from "@/components/admin/ArtistVerificationTable";
import { SupportTicketsTable } from "@/components/admin/SupportTicketsTable";
import { TicketChatBox } from "@/components/admin/TicketChatBox";
import { AuditPaymentsTable } from "@/components/admin/AuditPaymentsTable";
import { SubscriptionPriceForm } from "@/components/admin/SubscriptionPriceForm";
import { RevenueCharts } from "@/components/admin/RevenueCharts";
import {
  getPendingApplications,
  approveApplication,
  rejectApplication,
} from "@/lib/services/adminService";
import {
  getAllTickets,
  addTicketMessage,
  updateTicketStatus,
} from "@/lib/services/ticketService";
import {
  getAuditPaymentsByMonth,
  generateMonthlyAudit,
  markPaymentPaid,
  markPaymentDisputed,
  getRevenueStats,
} from "@/lib/services/auditService";
import { getPlans, updatePlanPrices } from "@/lib/services/subscriptionService";
import type { ArtistApplication } from "@/types/user";
import type { SupportTicket, TicketStatus } from "@/types/ticket";
import type { AuditPayment } from "@/types/audit";
import type { PlanLimits } from "@/types/subscription";

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "admin";

  const [activeSection, setActiveSection] =
    useState<AdminSection>("verification");
  const [refreshKey, setRefresh] = useState(0);
  const triggerRefresh = useCallback(() => setRefresh((k) => k + 1), []);

  const [applications, setApplications] = useState<ArtistApplication[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [payments, setPayments] = useState<AuditPayment[]>([]);
  const [plans, setPlans] = useState<PlanLimits[]>([]);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [revenueStats, setRevenueStats] = useState({
    totalRevenue: 0,
    totalStreams: 0,
    paidAmount: 0,
    pendingAmount: 0,
    byTier: [] as { tier: string; count: number; revenue: number }[],
  });

  useEffect(() => {
    const controller = new AbortController();
    setTickets(getAllTickets());
    setPayments(getAuditPaymentsByMonth(getCurrentMonth()));
    setRevenueStats(getRevenueStats());
    Promise.all([
      getPendingApplications(controller.signal),
      getPlans(controller.signal),
    ]).then(([nextApplications, nextPlans]) => {
      setApplications(nextApplications);
      setPlans(nextPlans);
      setAdminError(null);
    }).catch((caught) => {
      if (!controller.signal.aborted) {
        setAdminError(caught instanceof Error ? caught.message : "Unable to load admin data.");
      }
    });
    return () => controller.abort();
  }, [refreshKey]);

  async function handleApprove(id: string) {
    setAdminError(null);
    try {
      await approveApplication(id);
      triggerRefresh();
    } catch (caught) {
      setAdminError(caught instanceof Error ? caught.message : "Unable to approve application.");
    }
  }

  async function handleReject(id: string, reason: string) {
    setAdminError(null);
    try {
      await rejectApplication(id, reason);
      triggerRefresh();
    } catch (caught) {
      setAdminError(caught instanceof Error ? caught.message : "Unable to reject application.");
    }
  }

  function handleSelectTicket(ticket: SupportTicket) {
    setSelectedTicket(ticket);
  }

  function handleSendMessage(content: string) {
    if (!selectedTicket || !user) return;
    const updated = addTicketMessage(
      selectedTicket.id,
      user.id,
      user.displayName,
      content
    );
    setSelectedTicket(updated);
    triggerRefresh();
  }

  function handleUpdateTicketStatus(status: TicketStatus) {
    if (!selectedTicket) return;
    const updated = updateTicketStatus(selectedTicket.id, status);
    setSelectedTicket(updated);
    triggerRefresh();
  }

  function handleGenerateAudit() {
    generateMonthlyAudit(getCurrentMonth());
    triggerRefresh();
  }

  function handleMarkPaid(id: string) {
    markPaymentPaid(id);
    triggerRefresh();
  }

  function handleMarkDisputed(id: string) {
    markPaymentDisputed(id);
    triggerRefresh();
  }

  async function handleSavePrices(prices: {
    silver: number;
    gold: number;
  }) {
    await updatePlanPrices(prices);
    const updated = await getPlans();
    setPlans(updated);
  }

  if (!user) return null;

  return (
    <RoleGuard
      allow={["admin", "support"]}
      fallback={
        <div className="py-20 text-center text-zinc-400">
          <p>{t.admin.accessDenied}</p>
        </div>
      }
    >
      <PageShell>
        <PageHeader
          title={t.admin.title}
          description={t.admin.signedInAs.replace("{displayName}", user.displayName).replace("{role}", user.role)}
        />

        <div className="flex flex-col gap-6 lg:flex-row">
          <AdminSidebar
            active={activeSection}
            onChange={setActiveSection}
            isSuperAdmin={isSuperAdmin}
          />

          <div className="flex-1 space-y-6">
            {adminError && <p role="alert" className="rounded-lg bg-red-950/50 p-3 text-sm text-red-300">{adminError}</p>}
            {activeSection === "verification" && (
              <section className="space-y-4">
                <h2 className="text-lg font-bold">{t.admin.verificationHeading}</h2>
                <ArtistVerificationTable
                  applications={applications}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              </section>
            )}

            {activeSection === "tickets" && (
              <section className="space-y-4">
                <h2 className="text-lg font-bold">{t.admin.ticketsHeading}</h2>
                {selectedTicket ? (
                  <TicketChatBox
                    ticket={selectedTicket}
                    currentUserId={user.id}
                    onBack={() => setSelectedTicket(null)}
                    onSendMessage={handleSendMessage}
                    onUpdateStatus={handleUpdateTicketStatus}
                  />
                ) : (
                  <SupportTicketsTable
                    tickets={tickets}
                    onSelect={handleSelectTicket}
                  />
                )}
              </section>
            )}

            {activeSection === "audit" && (
              <section className="space-y-4">
                <h2 className="text-lg font-bold">
                  {t.admin.auditHeading.replace("{month}", getCurrentMonth())}
                </h2>
                <AuditPaymentsTable
                  payments={payments}
                  onMarkPaid={handleMarkPaid}
                  onMarkDisputed={handleMarkDisputed}
                  onGenerate={handleGenerateAudit}
                />
              </section>
            )}

            {activeSection === "pricing" && isSuperAdmin && (
              <section className="space-y-4">
                <h2 className="text-lg font-bold">{t.admin.pricingHeading}</h2>
                <SubscriptionPriceForm
                  plans={plans}
                  onSave={handleSavePrices}
                />
              </section>
            )}

            {activeSection === "revenue" && isSuperAdmin && (
              <section className="space-y-4">
                <h2 className="text-lg font-bold">{t.admin.revenueHeading}</h2>
                <RevenueCharts {...revenueStats} />
              </section>
            )}
          </div>
        </div>
      </PageShell>
    </RoleGuard>
  );
}
