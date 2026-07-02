import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function ProtectedRoute() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-8 text-center text-zinc-400">{t.routing.loading}</div>;
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
