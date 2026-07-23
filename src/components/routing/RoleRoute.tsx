import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { getDashboardRoute, ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { Role } from "@/types/user";

export function RoleRoute({ allow }: { allow: Role[] }) {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return <div className="p-8 text-center text-zinc-400">{t.routing.loading}</div>;
  }
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  if (!allow.includes(user.role)) {
    return <Navigate to={getDashboardRoute(user.role) ?? ROUTES.HOME} replace />;
  }
  return <Outlet />;
}
