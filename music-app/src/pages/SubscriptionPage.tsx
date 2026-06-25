import { useAuth } from "@/lib/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { PlanCard } from "@/components/subscription/PlanCard";
import { PlanComparisonTable } from "@/components/subscription/PlanComparisonTable";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { PLAN_LIMITS } from "@/lib/constants/plans";
import * as userService from "@/lib/services/userService";
import type { PlanLimits } from "@/types/subscription";

export default function SubscriptionPage() {
  const { user, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<PlanLimits | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  const handleUpgrade = async (_months: number) => {
    if (!selectedPlan) return;
    await userService.upgradePlan(user.id, selectedPlan.tier);
    await refreshUser();
    setSelectedPlan(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-2">Subscription</h1>
        <p className="text-zinc-500 mb-6">
          Current plan: <span className="font-semibold capitalize">{user.planTier}</span>
          {user.planRenewsAt && (
            <span className="ml-2">· Renews {new Date(user.planRenewsAt).toLocaleDateString()}</span>
          )}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {PLAN_LIMITS.map((plan) => (
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

        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Plan Comparison</h2>
          <PlanComparisonTable plans={PLAN_LIMITS} />
        </div>

        {selectedPlan && (
          <UpgradeModal
            plan={selectedPlan}
            open={!!selectedPlan}
            onClose={() => setSelectedPlan(null)}
            onConfirm={handleUpgrade}
          />
        )}
      </div>
    </div>
  );
}
