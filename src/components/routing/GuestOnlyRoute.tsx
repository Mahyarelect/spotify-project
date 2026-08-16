import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { ROLE_HOME_ROUTE, ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getLoginReturnPath } from "@/lib/routing/loginRedirect";

export function GuestOnlyRoute() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-8 text-center text-zinc-400">{t.routing.loading}</div>;
  }

  if (user) {
    const returnPath = getLoginReturnPath(location.state);
    return <Navigate to={returnPath ?? ROLE_HOME_ROUTE[user.role] ?? ROUTES.HOME} replace />;
  }

  return <Outlet />;
}
