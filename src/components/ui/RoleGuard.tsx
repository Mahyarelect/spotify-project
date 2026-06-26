import type { ReactNode } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Role } from "@/types/user";

export function RoleGuard({
  allow,
  children,
  fallback,
}: {
  allow: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user || !allow.includes(user.role)) {
    return fallback ? <>{fallback}</> : null;
  }
  return <>{children}</>;
}
