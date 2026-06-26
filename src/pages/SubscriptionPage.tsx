import { useAuth } from "@/lib/hooks/useAuth";
import { useEffect, useState } from "react";
import { PlanCard } from "@/components/subscription/PlanCard";
import { PlanComparisonTable } from "@/components/subscription/PlanComparisonTable";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import * as subscriptionService from "@/lib/services/subscriptionService";
import * as userService from "@/lib/services/userService";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import type { PlanLimits } from "@/types/subscription";

export default function SubscriptionPage() {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState<PlanLimits[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanLimits | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      const loadedPlans = await subscriptionService.getPlans();
      if (!cancelled) setPlans(loadedPlans);
    }

    loadPlans();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) return null;

  const handleUpgrade = async (months: number) => {
    if (!selectedPlan) return;
    await userService.upgradePlan(user.id, selectedPlan.tier, months as 1 | 3 | 6 | 12);
    await refreshUser();
    setSelectedPlan(null);
  };

  return (
    <>
      <PageHeader
        title="Subscription"
        description={`Current plan: ${user.planTier}${user.planRenewsAt ? ` · Renews ${new Date(user.planRenewsAt).toLocaleDateString()}` : ""}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {plans.map((plan) => (
          <PlanCard
            key={plan.tier}
            plan={plan}
            isCurrent={user.planTier === plan.tier}
            onSelect={
              plan.tier !== "free" && plan.tier !== user.planTier
                ? () => setSelectedPlan(plan)
                : undefined
            }
          />
        ))}
      </div>

      <PageShell>
        <h2 className="text-lg font-semibold mb-4">Plan Comparison</h2>
        <PlanComparisonTable plans={plans} />
      </PageShell>

      {selectedPlan && (
        <UpgradeModal
          plan={selectedPlan}
          open={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onConfirm={handleUpgrade}
        />
      )}
    </>
  );
}
