import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useAuth } from "@/lib/hooks/useAuth";
import { PlanCard } from "@/components/subscription/PlanCard";
import { PlanComparisonTable } from "@/components/subscription/PlanComparisonTable";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import * as subscriptionService from "@/lib/services/subscriptionService";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import type { PlanLimits } from "@/types/subscription";

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState<PlanLimits[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanLimits | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPlans() {
      try {
        setPlans(await subscriptionService.getPlans(controller.signal));
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : "Unable to load plans.");
        }
      }
    }

    void loadPlans();
    return () => controller.abort();
  }, []);

  if (!user) return null;

  const handleUpgrade = async (months: number) => {
    if (!selectedPlan) return;
    setError(null);
    try {
      const order = await subscriptionService.createOrder(selectedPlan.tier, months);
      if (order.paymentUrl) {
        window.location.assign(order.paymentUrl);
        return;
      }
      await subscriptionService.confirmMockOrder(order.orderId);
      await refreshUser();
      setSelectedPlan(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create subscription order.");
    }
  };

  const renewal = user.subscription.expiresAt
    ? ` · ${t.subscription.renews.replace("{date}", new Date(user.subscription.expiresAt).toLocaleDateString())}`
    : "";

  return (
    <>
      <PageHeader
        title={t.subscription.title}
        description={`${t.subscription.currentPlan.replace("{planTier}", user.subscription.plan)}${renewal}`}
      />

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-950/50 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6 mb-10">
        {plans.map((plan) => (
          <PlanCard
            key={plan.tier}
            plan={plan}
            isCurrent={user.subscription.plan === plan.tier}
            onSelect={
              plan.tier !== "free" && plan.tier !== user.subscription.plan
                ? () => setSelectedPlan(plan)
                : undefined
            }
          />
        ))}
      </div>

      <PageShell>
        <h2 className="text-lg font-semibold mb-4">{t.subscription.planComparison}</h2>
        <PlanComparisonTable plans={plans} />
      </PageShell>

      {selectedPlan && (
        <UpgradeModal
          plan={selectedPlan}
          open
          onClose={() => setSelectedPlan(null)}
          onConfirm={handleUpgrade}
        />
      )}
    </>
  );
}
