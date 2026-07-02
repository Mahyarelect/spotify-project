import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { ROLE_HOME_ROUTE, ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function GuestOnlyRoute() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-zinc-400">{t.routing.loading}</div>;
  }

  if (user) {
    return <Navigate to={ROLE_HOME_ROUTE[user.role] ?? ROUTES.HOME} replace />;
  }

  return <Outlet />;
}
